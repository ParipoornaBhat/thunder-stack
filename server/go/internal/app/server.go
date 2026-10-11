package app

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"thunder.dev/server/internal/auth"
	"thunder.dev/server/internal/config"
)

type App struct {
	cfg   config.Config
	db    *pgxpool.Pool
	mux   *http.ServeMux
	limit rateLimiter
	oauth oauthStates
}

type rateLimiter struct {
	mu sync.Mutex
	m  map[string]rateEntry
}

type rateEntry struct {
	count   int
	resetAt time.Time
}

func (r *rateLimiter) limited(key string, max int, window time.Duration) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.m == nil {
		r.m = map[string]rateEntry{}
	}
	now := time.Now()
	entry, ok := r.m[key]
	if !ok || now.After(entry.resetAt) {
		r.m[key] = rateEntry{count: 1, resetAt: now.Add(window)}
		return false
	}
	entry.count++
	r.m[key] = entry
	return entry.count > max
}

func New(cfg config.Config, db *pgxpool.Pool) *App {
	a := &App{cfg: cfg, db: db, mux: http.NewServeMux()}
	a.routes()
	return a
}

func (a *App) routes() {
	a.mux.HandleFunc("GET /health", a.health)

	a.mux.HandleFunc("POST /api/auth/sign-up/email", a.signUpEmail)
	a.mux.HandleFunc("POST /api/auth/sign-in/email", a.signInEmail)
	a.mux.HandleFunc("POST /api/auth/sign-out", a.signOut)
	a.mux.HandleFunc("GET /api/auth/get-session", a.getSession)
	a.mux.HandleFunc("POST /api/auth/get-session", a.getSession)
	a.mux.HandleFunc("POST /api/auth/sign-in/social", a.signInSocial)
	a.mux.HandleFunc("GET /api/auth/sign-in/social", a.loginSocial)
	a.mux.HandleFunc("GET /api/auth/login/social", a.loginSocial)
	a.mux.HandleFunc("GET /api/auth/callback/google", a.googleCallback)
	a.mux.HandleFunc("GET /api/auth/mobile-callback", a.mobileCallback)

	a.mux.HandleFunc("POST /api/users/seed-trial", a.seedTrial)
	a.mux.HandleFunc("GET /api/users/profile", a.profile)
	a.mux.HandleFunc("GET /api/users/dashboard-stats", a.dashboardStats)
	a.mux.HandleFunc("POST /api/users/switch-role", a.switchRole)
	a.mux.HandleFunc("POST /api/users/forgot-password", a.forgotPassword)
	a.mux.HandleFunc("POST /api/users/reset-password-otp", a.resetPasswordOTP)
	a.mux.HandleFunc("GET /api/users", a.listUsers)
	a.mux.HandleFunc("POST /api/users/{id}/role", a.updateUserRole)

	a.mux.HandleFunc("GET /api/roles/permissions", a.listPermissions)
	a.mux.HandleFunc("GET /api/roles", a.listRoles)
	a.mux.HandleFunc("POST /api/roles", a.createRole)
	a.mux.HandleFunc("DELETE /api/roles/{id}", a.deleteRole)
	a.mux.HandleFunc("POST /api/roles/{id}/permissions", a.togglePermission)
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	a.applyCORS(w, r)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	ww := &statusWriter{ResponseWriter: w, status: http.StatusOK}
	a.mux.ServeHTTP(ww, r)
	log.Printf("%s %s %d %s", r.Method, r.URL.Path, ww.status, time.Since(start).Round(time.Millisecond))
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (s *statusWriter) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

func (a *App) applyCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	allow := ""
	if origin == "" {
		if len(a.cfg.ClientURLs) > 0 {
			allow = a.cfg.ClientURLs[0]
		} else {
			allow = "*"
		}
	} else if a.originAllowed(origin) {
		allow = origin
	} else if !a.cfg.Production() {
		allow = origin
	} else if len(a.cfg.ClientURLs) > 0 {
		allow = a.cfg.ClientURLs[0]
	}
	if allow != "" {
		w.Header().Set("Access-Control-Allow-Origin", allow)
	}
	w.Header().Set("Vary", "Origin")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Expose-Headers", "Set-Cookie")
}

func (a *App) originAllowed(origin string) bool {
	origin = strings.TrimRight(origin, "/")
	for _, allowed := range append(append([]string{}, a.cfg.ClientURLs...), a.cfg.ServerURL) {
		if origin == strings.TrimRight(allowed, "/") {
			return true
		}
	}
	return false
}

func (a *App) health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=30, s-maxage=120, stale-while-revalidate=600")
	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "ok",
		"service":   "thunder-server",
		"timestamp": time.Now().UTC().Format(time.RFC3339Nano),
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]any{
		"error":   message,
		"message": message,
	})
}

func readJSON(r *http.Request, dest any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	return dec.Decode(dest)
}

func (a *App) requireDB(w http.ResponseWriter) bool {
	if a.db == nil {
		writeError(w, http.StatusInternalServerError, "Database is not configured")
		return false
	}
	return true
}

type authContext struct {
	User        userDTO
	Session     sessionDTO
	ActiveRole  *roleBrief
	Permissions []string
}

type roleBrief struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
}

func (a *App) currentAuth(r *http.Request) (*authContext, error) {
	token := tokenFromRequest(r)
	if token == "" || a.db == nil {
		return nil, nil
	}
	ctx := r.Context()
	var sess sessionDTO
	var user userDTO
	err := a.db.QueryRow(ctx, `
		SELECT s.id, s.expires_at, s.token, s.created_at, s.updated_at, s.ip_address, s.user_agent, s.user_id,
		       u.id, u.name, u.email, u.email_verified, u.image, u.created_at, u.updated_at, u.phone, u.gender, u.onboarded
		FROM session s
		JOIN "user" u ON u.id = s.user_id
		WHERE s.token = $1
	`, token).Scan(
		&sess.ID, &sess.ExpiresAt, &sess.Token, &sess.CreatedAt, &sess.UpdatedAt, &sess.IPAddress, &sess.UserAgent, &sess.UserID,
		&user.ID, &user.Name, &user.Email, &user.EmailVerified, &user.Image, &user.CreatedAt, &user.UpdatedAt, &user.Phone, &user.Gender, &user.Onboarded,
	)
	if err != nil {
		return nil, nil
	}
	if time.Now().After(sess.ExpiresAt) {
		_, _ = a.db.Exec(ctx, `DELETE FROM session WHERE id = $1`, sess.ID)
		return nil, nil
	}
	active, perms, err := a.loadAccess(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	return &authContext{User: user, Session: sess, ActiveRole: active, Permissions: perms}, nil
}

func (a *App) loadAccess(ctx context.Context, userID string) (*roleBrief, []string, error) {
	var role roleBrief
	var linkID string
	err := a.db.QueryRow(ctx, `
		SELECT ur.id::text, r.id::text, r.name, r.display_name
		FROM user_role ur
		JOIN role r ON r.id = ur.role_id
		WHERE ur.user_id = $1 AND ur.is_active = true
		LIMIT 1
	`, userID).Scan(&linkID, &role.ID, &role.Name, &role.DisplayName)
	if err != nil {
		err = a.db.QueryRow(ctx, `
			SELECT ur.id::text, r.id::text, r.name, r.display_name
			FROM user_role ur
			JOIN role r ON r.id = ur.role_id
			WHERE ur.user_id = $1
			LIMIT 1
		`, userID).Scan(&linkID, &role.ID, &role.Name, &role.DisplayName)
		if err != nil {
			return nil, []string{}, nil
		}
		_, _ = a.db.Exec(ctx, `UPDATE user_role SET is_active = true WHERE id = $1::uuid`, linkID)
	}

	rows, err := a.db.Query(ctx, `
		SELECT p.key
		FROM role_permission rp
		JOIN permission p ON p.id = rp.permission_id
		WHERE rp.role_id = $1::uuid
	`, role.ID)
	if err != nil {
		return &role, []string{}, err
	}
	defer rows.Close()
	perms := []string{}
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return &role, perms, err
		}
		perms = append(perms, key)
	}
	return &role, perms, rows.Err()
}

func (a *App) authorize(w http.ResponseWriter, r *http.Request, permission string) *authContext {
	authCtx, err := a.currentAuth(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load session")
		return nil
	}
	if authCtx == nil {
		writeError(w, http.StatusUnauthorized, "Unauthorized")
		return nil
	}
	if permission != "" && (authCtx.ActiveRole == nil || authCtx.ActiveRole.Name != "admin") {
		if !contains(authCtx.Permissions, permission) {
			writeError(w, http.StatusForbidden, "Forbidden. Missing permission: "+permission)
			return nil
		}
	}
	return authCtx
}

func contains(list []string, needle string) bool {
	for _, item := range list {
		if item == needle {
			return true
		}
	}
	return false
}

func tokenFromRequest(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if len(header) > 7 && strings.EqualFold(header[:7], "bearer ") {
		return normalizeToken(strings.TrimSpace(header[7:]))
	}
	for _, name := range []string{"better-auth.session_token", "__Secure-better-auth.session_token"} {
		c, err := r.Cookie(name)
		if err == nil && c.Value != "" {
			return normalizeToken(c.Value)
		}
	}
	return ""
}

func normalizeToken(value string) string {
	if i := strings.LastIndex(value, "."); i > 0 {
		return value[:i]
	}
	return value
}

func (a *App) setSessionCookies(w http.ResponseWriter, raw string) {
	signed := auth.SignToken(raw, a.cfg.Secret)
	expires := time.Now().Add(7 * 24 * time.Hour)
	for _, name := range []string{"better-auth.session_token", "__Secure-better-auth.session_token"} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    signed,
			Path:     "/",
			Expires:  expires,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteNoneMode,
		})
	}
}

func (a *App) clearSessionCookies(w http.ResponseWriter) {
	for _, name := range []string{"better-auth.session_token", "__Secure-better-auth.session_token"} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteNoneMode,
		})
	}
}

func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.TrimSpace(strings.Split(fwd, ",")[0])
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i > 0 {
		return host[:i]
	}
	return host
}
