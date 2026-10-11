package app

import (
	"net/http"
	"strings"
	"time"

	"thunder.dev/server/internal/auth"
)

func (a *App) listRoles(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "roles:manage") == nil {
		return
	}
	ctx := r.Context()
	rows, err := a.db.Query(ctx, `
		SELECT id::text, name, display_name, description, is_system, created_at
		FROM role
		ORDER BY name ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list roles")
		return
	}
	defer rows.Close()

	type perm struct {
		ID     string `json:"id"`
		Key    string `json:"key"`
		Module string `json:"module"`
	}
	type roleDTO struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		DisplayName string    `json:"displayName"`
		Description *string   `json:"description"`
		IsSystem    bool      `json:"isSystem"`
		CreatedAt   time.Time `json:"createdAt"`
		UserCount   int       `json:"userCount"`
		Permissions []perm    `json:"permissions"`
	}
	roles := []roleDTO{}
	index := map[string]int{}
	for rows.Next() {
		var role roleDTO
		if err := rows.Scan(&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list roles")
			return
		}
		role.Permissions = []perm{}
		index[role.ID] = len(roles)
		roles = append(roles, role)
	}
	counts, err := a.db.Query(ctx, `SELECT role_id::text, count(*) FROM user_role GROUP BY role_id`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list roles")
		return
	}
	defer counts.Close()
	for counts.Next() {
		var id string
		var count int
		if err := counts.Scan(&id, &count); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list roles")
			return
		}
		if i, ok := index[id]; ok {
			roles[i].UserCount = count
		}
	}
	perms, err := a.db.Query(ctx, `
		SELECT rp.role_id::text, p.id::text, p.key, p.module
		FROM role_permission rp
		JOIN permission p ON p.id = rp.permission_id
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list roles")
		return
	}
	defer perms.Close()
	for perms.Next() {
		var roleID string
		var item perm
		if err := perms.Scan(&roleID, &item.ID, &item.Key, &item.Module); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list roles")
			return
		}
		if i, ok := index[roleID]; ok {
			roles[i].Permissions = append(roles[i].Permissions, item)
		}
	}
	writeJSON(w, http.StatusOK, roles)
}

func (a *App) createRole(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "roles:manage") == nil {
		return
	}
	var body struct {
		Name        string `json:"name"`
		DisplayName string `json:"displayName"`
		Description string `json:"description"`
	}
	if err := readJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	if strings.TrimSpace(body.Name) == "" || strings.TrimSpace(body.DisplayName) == "" {
		writeError(w, http.StatusBadRequest, "Name and Display Name are required")
		return
	}
	name := strings.ToLower(strings.Join(strings.Fields(body.Name), "-"))
	var exists bool
	_ = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM role WHERE name = $1)`, name).Scan(&exists)
	if exists {
		writeError(w, http.StatusBadRequest, "A role with this name already exists")
		return
	}
	var description *string
	if strings.TrimSpace(body.Description) != "" {
		trimmed := strings.TrimSpace(body.Description)
		description = &trimmed
	}
	var role struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		DisplayName string    `json:"displayName"`
		Description *string   `json:"description"`
		IsSystem    bool      `json:"isSystem"`
		CreatedAt   time.Time `json:"createdAt"`
	}
	err := a.db.QueryRow(r.Context(), `
		INSERT INTO role (name, display_name, description, is_system)
		VALUES ($1, $2, $3, false)
		RETURNING id::text, name, display_name, description, is_system, created_at
	`, name, strings.TrimSpace(body.DisplayName), description).Scan(
		&role.ID, &role.Name, &role.DisplayName, &role.Description, &role.IsSystem, &role.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Failed to create role")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "role": role})
}

func (a *App) deleteRole(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "roles:manage") == nil {
		return
	}
	id := r.PathValue("id")
	var isSystem bool
	err := a.db.QueryRow(r.Context(), `SELECT is_system FROM role WHERE id = $1::uuid`, id).Scan(&isSystem)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Role not found")
		return
	}
	if isSystem {
		writeError(w, http.StatusBadRequest, "System roles cannot be deleted")
		return
	}
	var assigned int
	_ = a.db.QueryRow(r.Context(), `SELECT count(*) FROM user_role WHERE role_id = $1::uuid`, id).Scan(&assigned)
	if assigned > 0 {
		writeError(w, http.StatusBadRequest, "Cannot delete role. It is currently assigned to "+itoa(assigned)+" user(s)")
		return
	}
	if _, err := a.db.Exec(r.Context(), `DELETE FROM role WHERE id = $1::uuid`, id); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to delete role")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Role deleted successfully"})
}

func (a *App) listPermissions(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "roles:manage") == nil {
		return
	}
	rows, err := a.db.Query(r.Context(), `
		SELECT id::text, key, description, module
		FROM permission
		ORDER BY module ASC, key ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list permissions")
		return
	}
	defer rows.Close()
	type perm struct {
		ID          string  `json:"id"`
		Key         string  `json:"key"`
		Description *string `json:"description"`
		Module      string  `json:"module"`
	}
	perms := []perm{}
	for rows.Next() {
		var item perm
		if err := rows.Scan(&item.ID, &item.Key, &item.Description, &item.Module); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list permissions")
			return
		}
		perms = append(perms, item)
	}
	writeJSON(w, http.StatusOK, perms)
}

func (a *App) togglePermission(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "roles:manage") == nil {
		return
	}
	roleID := r.PathValue("id")
	var body struct {
		PermissionID string `json:"permissionId"`
	}
	if err := readJSON(r, &body); err != nil || body.PermissionID == "" {
		writeError(w, http.StatusBadRequest, "permissionId is required")
		return
	}
	ctx := r.Context()
	var roleName string
	if err := a.db.QueryRow(ctx, `SELECT name FROM role WHERE id = $1::uuid`, roleID).Scan(&roleName); err != nil {
		writeError(w, http.StatusBadRequest, "Role not found")
		return
	}
	if roleName == "admin" {
		writeError(w, http.StatusBadRequest, "Admin role permissions cannot be modified")
		return
	}
	var permExists bool
	_ = a.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM permission WHERE id = $1::uuid)`, body.PermissionID).Scan(&permExists)
	if !permExists {
		writeError(w, http.StatusBadRequest, "Permission not found")
		return
	}
	var linked bool
	_ = a.db.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM role_permission WHERE role_id = $1::uuid AND permission_id = $2::uuid)
	`, roleID, body.PermissionID).Scan(&linked)
	if linked {
		if _, err := a.db.Exec(ctx, `
			DELETE FROM role_permission WHERE role_id = $1::uuid AND permission_id = $2::uuid
		`, roleID, body.PermissionID); err != nil {
			writeError(w, http.StatusBadRequest, "Failed to update permissions")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"success": true, "action": "removed", "message": "Permission removed from role",
		})
		return
	}
	if _, err := a.db.Exec(ctx, `
		INSERT INTO role_permission (role_id, permission_id) VALUES ($1::uuid, $2::uuid)
	`, roleID, body.PermissionID); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to update permissions")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true, "action": "added", "message": "Permission assigned to role",
	})
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	buf := [16]byte{}
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
