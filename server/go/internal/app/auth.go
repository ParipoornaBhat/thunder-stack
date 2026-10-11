package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"thunder.dev/server/internal/auth"
)

type userDTO struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Email         string    `json:"email"`
	EmailVerified bool      `json:"emailVerified"`
	Image         *string   `json:"image"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	Phone         *string   `json:"phone"`
	Gender        *string   `json:"gender"`
	Onboarded     bool      `json:"onboarded"`
}

type sessionDTO struct {
	ID        string    `json:"id"`
	ExpiresAt time.Time `json:"expiresAt"`
	Token     string    `json:"token"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	IPAddress *string   `json:"ipAddress"`
	UserAgent *string   `json:"userAgent"`
	UserID    string    `json:"userId"`
}

type oauthState struct {
	CallbackURL string
	ErrorURL    string
	Expires     time.Time
}

type oauthStates struct {
	mu sync.Mutex
	m  map[string]oauthState
}

func (o *oauthStates) put(state string, data oauthState) {
	o.mu.Lock()
	defer o.mu.Unlock()
	if o.m == nil {
		o.m = map[string]oauthState{}
	}
	o.m[state] = data
}

func (o *oauthStates) take(state string) (oauthState, bool) {
	o.mu.Lock()
	defer o.mu.Unlock()
	data, ok := o.m[state]
	if ok {
		delete(o.m, state)
	}
	if !ok || time.Now().After(data.Expires) {
		return oauthState{}, false
	}
	return data, true
}

func (a *App) signUpEmail(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := readJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	name := strings.TrimSpace(body.Name)
	if email == "" || body.Password == "" {
		writeError(w, http.StatusBadRequest, "Email and password are required")
		return
	}
	if len(body.Password) < 8 {
		writeError(w, http.StatusBadRequest, "Password must be at least 8 characters long")
		return
	}
	if name == "" {
		name = strings.Split(email, "@")[0]
	}

	ctx := r.Context()
	var exists bool
	_ = a.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM "user" WHERE email = $1)`, email).Scan(&exists)
	if exists {
		writeError(w, http.StatusUnprocessableEntity, "User already exists")
		return
	}

	hash, err := auth.HashPassword(body.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}
	user, session, err := a.createCredentialUser(ctx, r, email, name, hash, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create account")
		log.Printf("sign-up: %v", err)
		return
	}
	a.setSessionCookies(w, session.Token)
	writeJSON(w, http.StatusOK, map[string]any{
		"redirect": false,
		"token":    session.Token,
		"user":     user,
		"session":  session,
	})
}

func (a *App) signInEmail(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := readJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	ctx := r.Context()

	var user userDTO
	var password *string
	err := a.db.QueryRow(ctx, `
		SELECT u.id, u.name, u.email, u.email_verified, u.image, u.created_at, u.updated_at, u.phone, u.gender, u.onboarded, acc.password
		FROM "user" u
		LEFT JOIN account acc ON acc.user_id = u.id AND acc.provider_id = 'credential'
		WHERE u.email = $1
	`, email).Scan(
		&user.ID, &user.Name, &user.Email, &user.EmailVerified, &user.Image, &user.CreatedAt, &user.UpdatedAt, &user.Phone, &user.Gender, &user.Onboarded, &password,
	)
	if err != nil || password == nil || !auth.VerifyPassword(*password, body.Password) {
		writeError(w, http.StatusUnauthorized, "Invalid email or password")
		return
	}
	session, err := a.createSession(ctx, r, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}
	a.setSessionCookies(w, session.Token)
	writeJSON(w, http.StatusOK, map[string]any{
		"redirect": false,
		"token":    session.Token,
		"user":     user,
		"session":  session,
	})
}

func (a *App) signOut(w http.ResponseWriter, r *http.Request) {
	if a.db != nil {
		if token := tokenFromRequest(r); token != "" {
			_, _ = a.db.Exec(r.Context(), `DELETE FROM session WHERE token = $1`, token)
		}
	}
	a.clearSessionCookies(w)
	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (a *App) getSession(w http.ResponseWriter, r *http.Request) {
	authCtx, err := a.currentAuth(r)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to load session")
		return
	}
	if authCtx == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("null"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"session": authCtx.Session,
		"user":    authCtx.User,
	})
}

func (a *App) signInSocial(w http.ResponseWriter, r *http.Request) {
	var body map[string]any
	if err := readJSON(r, &body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}
	if token := extractIDToken(body["idToken"]); token != "" {
		a.finishGoogleIDToken(w, r, token)
		return
	}
	callbackURL, _ := body["callbackURL"].(string)
	errorURL, _ := body["errorCallbackURL"].(string)
	authURL, err := a.beginGoogle(callbackURL, errorURL)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"url": authURL, "redirect": true})
}

func (a *App) loginSocial(w http.ResponseWriter, r *http.Request) {
	authURL, err := a.beginGoogle(r.URL.Query().Get("callbackURL"), r.URL.Query().Get("errorCallbackURL"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	http.Redirect(w, r, authURL, http.StatusFound)
}

func (a *App) beginGoogle(callbackURL, errorURL string) (string, error) {
	if a.cfg.GoogleID == "" || a.cfg.GoogleSecret == "" {
		return "", fmt.Errorf("Google OAuth is not configured")
	}
	if callbackURL == "" {
		if len(a.cfg.ClientURLs) > 0 {
			callbackURL = a.cfg.ClientURLs[0]
		} else {
			callbackURL = a.cfg.ServerURL
		}
	}
	if !a.safeRedirect(callbackURL) {
		return "", fmt.Errorf("Invalid callback URL")
	}
	state := auth.NewToken()
	a.oauth.put(state, oauthState{
		CallbackURL: callbackURL,
		ErrorURL:    errorURL,
		Expires:     time.Now().Add(10 * time.Minute),
	})
	q := url.Values{}
	q.Set("client_id", a.cfg.GoogleID)
	q.Set("redirect_uri", a.cfg.ServerURL+"/api/auth/callback/google")
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("state", state)
	q.Set("access_type", "online")
	q.Set("prompt", "select_account")
	return "https://accounts.google.com/o/oauth2/v2/auth?" + q.Encode(), nil
}

func (a *App) googleCallback(w http.ResponseWriter, r *http.Request) {
	if !a.requireDB(w) {
		return
	}
	q := r.URL.Query()
	state, ok := a.oauth.take(q.Get("state"))
	if !ok {
		writeError(w, http.StatusBadRequest, "Invalid OAuth state")
		return
	}
	if q.Get("error") != "" {
		a.redirectAuthError(w, r, state.ErrorURL, q.Get("error"))
		return
	}
	profile, err := a.exchangeGoogleCode(r.Context(), q.Get("code"))
	if err != nil {
		log.Printf("google callback: %v", err)
		a.redirectAuthError(w, r, state.ErrorURL, "oauth_failed")
		return
	}
	user, session, err := a.upsertGoogleUser(r.Context(), r, profile)
	if err != nil {
		log.Printf("google user: %v", err)
		a.redirectAuthError(w, r, state.ErrorURL, "oauth_failed")
		return
	}
	_ = user
	a.setSessionCookies(w, session.Token)
	http.Redirect(w, r, state.CallbackURL, http.StatusFound)
}

func (a *App) finishGoogleIDToken(w http.ResponseWriter, r *http.Request, idToken string) {
	if !a.requireDB(w) {
		return
	}
	profile, err := a.verifyGoogleIDToken(r.Context(), idToken)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid Google ID token")
		return
	}
	user, session, err := a.upsertGoogleUser(r.Context(), r, profile)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create session")
		return
	}
	a.setSessionCookies(w, session.Token)
	writeJSON(w, http.StatusOK, map[string]any{
		"redirect": false,
		"token":    session.Token,
		"user":     user,
		"session":  session,
	})
}

func (a *App) mobileCallback(w http.ResponseWriter, r *http.Request) {
	redirectURI := r.URL.Query().Get("redirect_uri")
	if redirectURI == "" {
		redirectURI = "thunderstack://auth-callback"
	}
	if !a.safeRedirect(redirectURI) {
		writeError(w, http.StatusBadRequest, "Invalid redirect URI")
		return
	}
	token := ""
	for _, name := range []string{"better-auth.session_token", "__Secure-better-auth.session_token"} {
		if c, err := r.Cookie(name); err == nil && c.Value != "" {
			token = c.Value
			break
		}
	}
	sep := "?"
	if strings.Contains(redirectURI, "?") {
		sep = "&"
	}
	if token == "" {
		http.Redirect(w, r, redirectURI+sep+"error=no_token", http.StatusFound)
		return
	}
	http.Redirect(w, r, redirectURI+sep+"token="+url.QueryEscape(token), http.StatusFound)
}

func (a *App) safeRedirect(raw string) bool {
	if strings.HasPrefix(raw, "thunderstack://") {
		return true
	}
	if strings.HasPrefix(raw, "/") && !strings.HasPrefix(raw, "//") {
		return true
	}
	for _, origin := range append(append([]string{}, a.cfg.ClientURLs...), a.cfg.ServerURL) {
		if strings.HasPrefix(raw, origin) {
			return true
		}
	}
	return false
}

func (a *App) redirectAuthError(w http.ResponseWriter, r *http.Request, errorURL, code string) {
	if errorURL != "" && a.safeRedirect(errorURL) {
		sep := "?"
		if strings.Contains(errorURL, "?") {
			sep = "&"
		}
		http.Redirect(w, r, errorURL+sep+"error="+url.QueryEscape(code), http.StatusFound)
		return
	}
	writeError(w, http.StatusBadRequest, code)
}

type googleProfile struct {
	Sub     string
	Email   string
	Name    string
	Picture string
}

func (a *App) exchangeGoogleCode(ctx context.Context, code string) (googleProfile, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", a.cfg.GoogleID)
	form.Set("client_secret", a.cfg.GoogleSecret)
	form.Set("redirect_uri", a.cfg.ServerURL+"/api/auth/callback/google")
	form.Set("grant_type", "authorization_code")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	if err != nil {
		return googleProfile{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return googleProfile{}, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return googleProfile{}, fmt.Errorf("token exchange %d: %s", res.StatusCode, body)
	}
	var token struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &token); err != nil {
		return googleProfile{}, err
	}
	infoReq, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return googleProfile{}, err
	}
	infoReq.Header.Set("Authorization", "Bearer "+token.AccessToken)
	infoRes, err := http.DefaultClient.Do(infoReq)
	if err != nil {
		return googleProfile{}, err
	}
	defer infoRes.Body.Close()
	infoBody, _ := io.ReadAll(infoRes.Body)
	if infoRes.StatusCode >= 300 {
		return googleProfile{}, fmt.Errorf("userinfo %d: %s", infoRes.StatusCode, infoBody)
	}
	var info struct {
		Sub     string `json:"sub"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(infoBody, &info); err != nil {
		return googleProfile{}, err
	}
	return googleProfile{Sub: info.Sub, Email: info.Email, Name: info.Name, Picture: info.Picture}, nil
}

func (a *App) verifyGoogleIDToken(ctx context.Context, idToken string) (googleProfile, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://oauth2.googleapis.com/tokeninfo?id_token="+url.QueryEscape(idToken), nil)
	if err != nil {
		return googleProfile{}, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return googleProfile{}, err
	}
	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 300 {
		return googleProfile{}, fmt.Errorf("tokeninfo %d", res.StatusCode)
	}
	var info struct {
		Aud     string `json:"aud"`
		Sub     string `json:"sub"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(body, &info); err != nil {
		return googleProfile{}, err
	}
	if len(a.cfg.GoogleAudiences) > 0 && !contains(a.cfg.GoogleAudiences, info.Aud) {
		return googleProfile{}, fmt.Errorf("unexpected audience")
	}
	return googleProfile{Sub: info.Sub, Email: info.Email, Name: info.Name, Picture: info.Picture}, nil
}

func extractIDToken(value any) string {
	switch v := value.(type) {
	case string:
		return strings.TrimSpace(v)
	case map[string]any:
		if token, ok := v["token"].(string); ok {
			return strings.TrimSpace(token)
		}
	}
	return ""
}

func (a *App) createCredentialUser(ctx context.Context, r *http.Request, email, name, passwordHash string, verified bool) (userDTO, sessionDTO, error) {
	now := time.Now().UTC()
	userID := auth.NewID()
	user := userDTO{
		ID: userID, Name: name, Email: email, EmailVerified: verified,
		CreatedAt: now, UpdatedAt: now, Onboarded: false,
	}
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return userDTO{}, sessionDTO{}, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at, phone, gender, onboarded)
		VALUES ($1, $2, $3, $4, NULL, $5, $5, NULL, NULL, false)
	`, userID, name, email, verified, now)
	if err != nil {
		return userDTO{}, sessionDTO{}, err
	}
	_, err = tx.Exec(ctx, `
		INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
		VALUES ($1, $2, 'credential', $3, $4, $5, $5)
	`, auth.NewID(), userID, userID, passwordHash, now)
	if err != nil {
		return userDTO{}, sessionDTO{}, err
	}
	if err := assignDefaultRole(ctx, tx, userID, email); err != nil {
		log.Printf("role assign: %v", err)
	}
	session, err := insertSession(ctx, tx, r, userID)
	if err != nil {
		return userDTO{}, sessionDTO{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return userDTO{}, sessionDTO{}, err
	}
	return user, session, nil
}

func (a *App) upsertGoogleUser(ctx context.Context, r *http.Request, profile googleProfile) (userDTO, sessionDTO, error) {
	email := strings.ToLower(strings.TrimSpace(profile.Email))
	if email == "" || profile.Sub == "" {
		return userDTO{}, sessionDTO{}, fmt.Errorf("google profile missing email")
	}
	name := profile.Name
	if name == "" {
		name = strings.Split(email, "@")[0]
	}
	var user userDTO
	err := a.db.QueryRow(ctx, `
		SELECT id, name, email, email_verified, image, created_at, updated_at, phone, gender, onboarded
		FROM "user" WHERE email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.EmailVerified, &user.Image, &user.CreatedAt, &user.UpdatedAt, &user.Phone, &user.Gender, &user.Onboarded)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return userDTO{}, sessionDTO{}, err
	}
	if err != nil {
		now := time.Now().UTC()
		user = userDTO{ID: auth.NewID(), Name: name, Email: email, EmailVerified: true, CreatedAt: now, UpdatedAt: now}
		if profile.Picture != "" {
			user.Image = &profile.Picture
		}
		tx, txErr := a.db.Begin(ctx)
		if txErr != nil {
			return userDTO{}, sessionDTO{}, txErr
		}
		defer tx.Rollback(ctx)
		_, txErr = tx.Exec(ctx, `
			INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at, phone, gender, onboarded)
			VALUES ($1, $2, $3, true, $4, $5, $5, NULL, NULL, false)
		`, user.ID, name, email, user.Image, now)
		if txErr != nil {
			return userDTO{}, sessionDTO{}, txErr
		}
		_, _ = tx.Exec(ctx, `
			INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at)
			VALUES ($1, $2, 'google', $3, $4, $4)
		`, auth.NewID(), profile.Sub, user.ID, now)
		_ = assignDefaultRole(ctx, tx, user.ID, email)
		session, txErr := insertSession(ctx, tx, r, user.ID)
		if txErr != nil {
			return userDTO{}, sessionDTO{}, txErr
		}
		if txErr = tx.Commit(ctx); txErr != nil {
			return userDTO{}, sessionDTO{}, txErr
		}
		return user, session, nil
	}
	now := time.Now().UTC()
	_, _ = a.db.Exec(ctx, `
		INSERT INTO account (id, account_id, provider_id, user_id, created_at, updated_at)
		SELECT $1, $2, 'google', $3, $4, $4
		WHERE NOT EXISTS (
			SELECT 1 FROM account WHERE user_id = $3 AND provider_id = 'google'
		)
	`, auth.NewID(), profile.Sub, user.ID, now)
	session, err := a.createSession(ctx, r, user.ID)
	return user, session, err
}

type roleDB interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func assignDefaultRole(ctx context.Context, tx roleDB, userID, email string) error {
	roleName := ""
	switch email {
	case "admin@thunder.com":
		roleName = "admin"
	case "user@thunder.com":
		roleName = "user"
	default:
		var count int
		if err := tx.QueryRow(ctx, `SELECT count(*) FROM "user"`).Scan(&count); err != nil {
			return err
		}
		if count <= 1 {
			roleName = "admin"
		} else {
			roleName = "user"
		}
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO user_role (id, user_id, role_id, is_active, assigned_at)
		SELECT $1::uuid, $2, r.id, true, now()
		FROM role r
		WHERE r.name = $3
		AND NOT EXISTS (
			SELECT 1 FROM user_role ur WHERE ur.user_id = $2 AND ur.role_id = r.id
		)
	`, auth.NewID(), userID, roleName)
	return err
}

func (a *App) createSession(ctx context.Context, r *http.Request, userID string) (sessionDTO, error) {
	return insertSession(ctx, a.db, r, userID)
}

func insertSession(ctx context.Context, q interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}, r *http.Request, userID string) (sessionDTO, error) {
	now := time.Now().UTC()
	session := sessionDTO{
		ID:        auth.NewID(),
		ExpiresAt: now.Add(7 * 24 * time.Hour),
		Token:     auth.NewToken(),
		CreatedAt: now,
		UpdatedAt: now,
		UserID:    userID,
	}
	ip := clientIP(r)
	ua := r.UserAgent()
	if ip != "" {
		session.IPAddress = &ip
	}
	if ua != "" {
		session.UserAgent = &ua
	}
	_, err := q.QueryRow(ctx, `
		INSERT INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
		VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
		RETURNING id
	`, session.ID, session.ExpiresAt, session.Token, now, session.IPAddress, session.UserAgent, userID).Scan(&session.ID)
	return session, err
}
