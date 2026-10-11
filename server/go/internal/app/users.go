package app

import (
	"crypto/rand"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"thunder.dev/server/internal/auth"
)

func (a *App) seedTrial(w http.ResponseWriter, r *http.Request) {
	if a.cfg.Production() {
		writeError(w, http.StatusForbidden, "Not available in production")
		return
	}
	if !a.requireDB(w) {
		return
	}
	type trial struct {
		role, email, password, name string
	}
	trials := []trial{
		{"admin", "admin@thunder.com", "AdminPassword123", "Trial Admin"},
		{"user", "user@thunder.com", "UserPassword123", "Trial User"},
	}
	for _, item := range trials {
		var exists bool
		_ = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM "user" WHERE email = $1)`, item.email).Scan(&exists)
		if exists {
			continue
		}
		hash, err := auth.HashPassword(item.password)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to seed trial users")
			return
		}
		if _, _, err := a.createCredentialUser(r.Context(), r, item.email, item.name, hash, true); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to seed trial users")
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Trial login credentials initialized successfully!",
		"credentials": []map[string]string{
			{"role": "admin", "email": "admin@thunder.com", "password": "AdminPassword123"},
			{"role": "user", "email": "user@thunder.com", "password": "UserPassword123"},
		},
	})
}

func (a *App) profile(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	authCtx, err := a.currentAuth(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load profile")
		return
	}
	if authCtx == nil {
		writeError(w, http.StatusUnauthorized, "Not logged in")
		return
	}
	rows, err := a.db.Query(r.Context(), `
		SELECT r.id::text, r.name, r.display_name, ur.is_active
		FROM user_role ur
		JOIN role r ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`, authCtx.User.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load roles")
		return
	}
	defer rows.Close()
	roles := []map[string]any{}
	for rows.Next() {
		var id, name, display string
		var active bool
		if err := rows.Scan(&id, &name, &display, &active); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to load roles")
			return
		}
		roles = append(roles, map[string]any{
			"id": id, "name": name, "displayName": display, "isActive": active,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"user":        authCtx.User,
		"activeRole":  authCtx.ActiveRole,
		"permissions": authCtx.Permissions,
		"roles":       roles,
	})
}

func (a *App) dashboardStats(w http.ResponseWriter, r *http.Request) {
	authCtx := a.authorize(w, r, "")
	if authCtx == nil {
		return
	}
	stats := map[string]any{
		"usersCount":       nil,
		"rolesCount":       nil,
		"permissionsCount": nil,
	}
	isAdmin := authCtx.ActiveRole != nil && authCtx.ActiveRole.Name == "admin"
	ctx := r.Context()
	if isAdmin || contains(authCtx.Permissions, "users:view") {
		var count int
		if err := a.db.QueryRow(ctx, `SELECT count(*) FROM "user"`).Scan(&count); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch stats")
			return
		}
		stats["usersCount"] = count
	}
	if isAdmin || contains(authCtx.Permissions, "roles:manage") {
		var roles, perms int
		if err := a.db.QueryRow(ctx, `SELECT count(*) FROM role`).Scan(&roles); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch stats")
			return
		}
		if err := a.db.QueryRow(ctx, `SELECT count(*) FROM permission`).Scan(&perms); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch stats")
			return
		}
		stats["rolesCount"] = roles
		stats["permissionsCount"] = perms
	}
	writeJSON(w, http.StatusOK, stats)
}

func (a *App) switchRole(w http.ResponseWriter, r *http.Request) {
	authCtx := a.authorize(w, r, "")
	if authCtx == nil {
		return
	}
	var body struct {
		RoleID string `json:"roleId"`
	}
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.RoleID) == "" {
		writeError(w, http.StatusBadRequest, "roleId is required")
		return
	}
	ctx := r.Context()
	var linkID string
	err := a.db.QueryRow(ctx, `
		SELECT id::text FROM user_role WHERE user_id = $1 AND role_id = $2::uuid
	`, authCtx.User.ID, body.RoleID).Scan(&linkID)
	if err != nil {
		writeError(w, http.StatusBadRequest, "You are not assigned to this role")
		return
	}
	tx, err := a.db.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to switch role")
		return
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE user_role SET is_active = false WHERE user_id = $1`, authCtx.User.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to switch role")
		return
	}
	if _, err := tx.Exec(ctx, `UPDATE user_role SET is_active = true WHERE id = $1::uuid`, linkID); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to switch role")
		return
	}
	if err := tx.Commit(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to switch role")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Active role switched successfully"})
}

func (a *App) listUsers(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "users:view") == nil {
		return
	}
	page := queryInt(r, "page", 1)
	limit := queryInt(r, "limit", 10)
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 1
	}
	if limit > 100 {
		limit = 100
	}
	search := strings.TrimSpace(r.URL.Query().Get("search"))
	offset := (page - 1) * limit
	ctx := r.Context()

	var total int
	err := a.db.QueryRow(ctx, `
		SELECT count(*) FROM "user"
		WHERE $1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%'
	`, search).Scan(&total)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list users")
		return
	}
	rows, err := a.db.Query(ctx, `
		SELECT id, name, email, phone, gender, onboarded, created_at
		FROM "user"
		WHERE $1 = '' OR name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%'
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, search, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to list users")
		return
	}
	defer rows.Close()

	type listedUser struct {
		ID         string         `json:"id"`
		Name       string         `json:"name"`
		Email      string         `json:"email"`
		Phone      *string        `json:"phone"`
		Gender     *string        `json:"gender"`
		Onboarded  bool           `json:"onboarded"`
		CreatedAt  time.Time      `json:"createdAt"`
		Roles      []userRoleView `json:"roles"`
		ActiveRole *userRoleView  `json:"activeRole"`
	}
	users := []listedUser{}
	ids := []string{}
	index := map[string]int{}
	for rows.Next() {
		var u listedUser
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Gender, &u.Onboarded, &u.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list users")
			return
		}
		u.Roles = []userRoleView{}
		index[u.ID] = len(users)
		ids = append(ids, u.ID)
		users = append(users, u)
	}
	if len(ids) > 0 {
		roleRows, err := a.db.Query(ctx, `
			SELECT ur.user_id, r.id::text, r.name, r.display_name, ur.is_active
			FROM user_role ur
			JOIN role r ON r.id = ur.role_id
			WHERE ur.user_id = ANY($1)
		`, ids)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to list users")
			return
		}
		defer roleRows.Close()
		for roleRows.Next() {
			var userID string
			var role userRoleView
			if err := roleRows.Scan(&userID, &role.ID, &role.Name, &role.DisplayName, &role.IsActive); err != nil {
				writeError(w, http.StatusInternalServerError, "Failed to list users")
				return
			}
			i := index[userID]
			users[i].Roles = append(users[i].Roles, role)
			if role.IsActive || users[i].ActiveRole == nil {
				copied := role
				users[i].ActiveRole = &copied
			}
		}
	}
	pages := 0
	if limit > 0 {
		pages = (total + limit - 1) / limit
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"users":      users,
		"totalCount": total,
		"totalPages": pages,
		"page":       page,
		"limit":      limit,
	})
}

type userRoleView struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	IsActive    bool   `json:"isActive"`
}

func (a *App) updateUserRole(w http.ResponseWriter, r *http.Request) {
	if a.authorize(w, r, "users:manage") == nil {
		return
	}
	userID := r.PathValue("id")
	var body struct {
		RoleID string `json:"roleId"`
		Assign *bool  `json:"assign"`
	}
	if err := readJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	if userID == "" {
		writeError(w, http.StatusBadRequest, "User ID is required")
		return
	}
	if body.RoleID == "" {
		writeError(w, http.StatusBadRequest, "roleId is required")
		return
	}
	assign := true
	if body.Assign != nil {
		assign = *body.Assign
	}
	ctx := r.Context()
	var roleName string
	if err := a.db.QueryRow(ctx, `SELECT name FROM role WHERE id = $1::uuid`, body.RoleID).Scan(&roleName); err != nil {
		writeError(w, http.StatusBadRequest, "Role not found")
		return
	}
	if !assign {
		var count int
		_ = a.db.QueryRow(ctx, `SELECT count(*) FROM user_role WHERE user_id = $1`, userID).Scan(&count)
		if count <= 1 {
			writeError(w, http.StatusBadRequest, "Cannot remove the last role from a user")
			return
		}
		if _, err := a.db.Exec(ctx, `DELETE FROM user_role WHERE user_id = $1 AND role_id = $2::uuid`, userID, body.RoleID); err != nil {
			writeError(w, http.StatusBadRequest, "Failed to update role")
			return
		}
		var active int
		_ = a.db.QueryRow(ctx, `SELECT count(*) FROM user_role WHERE user_id = $1 AND is_active = true`, userID).Scan(&active)
		if active == 0 {
			_, _ = a.db.Exec(ctx, `
				UPDATE user_role SET is_active = true
				WHERE id = (
					SELECT id FROM user_role WHERE user_id = $1 LIMIT 1
				)
			`, userID)
		}
	} else {
		_, err := a.db.Exec(ctx, `
			INSERT INTO user_role (id, user_id, role_id, is_active, assigned_at)
			SELECT $1::uuid, $2, $3::uuid, false, now()
			WHERE NOT EXISTS (
				SELECT 1 FROM user_role WHERE user_id = $2 AND role_id = $3::uuid
			)
		`, auth.NewID(), userID, body.RoleID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Failed to update role")
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": "User roles updated successfully"})
}

func (a *App) forgotPassword(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if err := readJSON(r, &body); err != nil || strings.TrimSpace(body.Email) == "" {
		writeError(w, http.StatusBadRequest, "Email is required")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	message := "If an account exists with this email, a verification code has been sent."
	var exists bool
	_ = a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT 1 FROM "user" WHERE email = $1)`, email).Scan(&exists)
	if !exists {
		writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": message})
		return
	}
	if a.limit.limited("forgot:"+email, 3, 10*time.Minute) {
		writeError(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
		return
	}
	otp := randomOTP()
	expires := time.Now().Add(10 * time.Minute)
	ctx := r.Context()
	_, _ = a.db.Exec(ctx, `DELETE FROM verification WHERE identifier = $1`, email)
	if _, err := a.db.Exec(ctx, `
		INSERT INTO verification (id, identifier, value, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, now(), now())
	`, auth.NewID(), email, otp, expires); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to send email. Please try again later.")
		return
	}
	if err := sendOTP(a.cfg, email, otp); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to send email. Please try again later.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"success": true, "message": message})
}

func (a *App) resetPasswordOTP(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	var body struct {
		Email       string `json:"email"`
		OTP         string `json:"otp"`
		NewPassword string `json:"newPassword"`
	}
	if err := readJSON(r, &body); err != nil || body.Email == "" || body.OTP == "" || body.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "Email, OTP, and new password are required")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if a.limit.limited("reset:"+email, 5, 15*time.Minute) {
		writeError(w, http.StatusTooManyRequests, "Too many attempts. Please try again later.")
		return
	}
	if len(body.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}
	ctx := r.Context()
	var recordID string
	var expires time.Time
	err := a.db.QueryRow(ctx, `
		SELECT id, expires_at FROM verification WHERE identifier = $1 AND value = $2
	`, email, body.OTP).Scan(&recordID, &expires)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid OTP code")
		return
	}
	if time.Now().After(expires) {
		_, _ = a.db.Exec(ctx, `DELETE FROM verification WHERE id = $1`, recordID)
		writeError(w, http.StatusBadRequest, "OTP code has expired")
		return
	}
	var userID string
	if err := a.db.QueryRow(ctx, `SELECT id FROM "user" WHERE email = $1`, email).Scan(&userID); err != nil {
		writeError(w, http.StatusNotFound, "User not found")
		return
	}
	hash, err := auth.HashPassword(body.NewPassword)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}
	tag, err := a.db.Exec(ctx, `
		UPDATE account SET password = $1, updated_at = now()
		WHERE user_id = $2 AND provider_id = 'credential'
	`, hash, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}
	if tag.RowsAffected() == 0 {
		_, err = a.db.Exec(ctx, `
			INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
			VALUES ($1, $2, 'credential', $3, $4, now(), now())
		`, auth.NewID(), email, userID, hash)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to reset password")
			return
		}
	}
	_, _ = a.db.Exec(ctx, `DELETE FROM verification WHERE id = $1`, recordID)
	writeJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Password reset successfully! You can now log in.",
	})
}

func queryInt(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return n
}

func randomOTP() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "000000"
	}
	return strconv.Itoa(int(n.Int64()) + 100000)
}
