package config

import (
	"bufio"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	DatabaseURL  string
	Secret       string
	ServerURL    string
	ClientURLs   []string
	Port         string
	NodeEnv      string
	GoogleID     string
	GoogleSecret string
	GoogleAudiences []string
	SMTPEmail    string
	SMTPPassword string
	SMTPName     string
}

func Load() Config {
	loadEnvFiles()

	serverURL := firstEnv("SERVER_URL", "BETTER_AUTH_URL")
	if serverURL == "" {
		serverURL = "http://localhost:4000"
	}
	serverURL = strings.TrimRight(strings.Split(serverURL, ",")[0], "/")

	port := os.Getenv("PORT")
	if port == "" {
		if u, err := url.Parse(serverURL); err == nil && u.Port() != "" {
			port = u.Port()
		} else {
			port = "4000"
		}
	}

	nodeEnv := os.Getenv("NODE_ENV")
	if nodeEnv == "" {
		nodeEnv = "development"
	}

	googleIDs := uniqueNonEmpty(
		os.Getenv("GOOGLE_CLIENT_ID"),
		os.Getenv("EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB"),
		os.Getenv("EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS"),
		os.Getenv("EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID"),
	)

	secret := os.Getenv("BETTER_AUTH_SECRET")
	if secret == "" {
		secret = "fallback-secret-for-dev"
	}

	smtpName := os.Getenv("SMTP_NAME")
	if smtpName == "" {
		smtpName = "THUNDER Stack"
	}

	return Config{
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		Secret:          secret,
		ServerURL:       serverURL,
		ClientURLs:      splitURLs(firstNonEmpty(os.Getenv("CLIENT_URL"), "http://localhost:3000")),
		Port:            port,
		NodeEnv:         nodeEnv,
		GoogleID:        realSecret(os.Getenv("GOOGLE_CLIENT_ID")),
		GoogleSecret:    realSecret(os.Getenv("GOOGLE_CLIENT_SECRET")),
		GoogleAudiences: googleIDs,
		SMTPEmail:       os.Getenv("SMTP_EMAIL"),
		SMTPPassword:    os.Getenv("SMTP_APP_PASSWORD"),
		SMTPName:        smtpName,
	}
}

func (c Config) Production() bool {
	return c.NodeEnv == "production"
}

func loadEnvFiles() {
	var candidates []string
	cwd, err := os.Getwd()
	if err == nil {
		dir := cwd
		for i := 0; i < 5; i++ {
			candidates = append(candidates, filepath.Join(dir, ".env"))
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}
	// Later files are closer to cwd; apply them last so the nearest .env wins
	// only for keys that are still empty after process environment.
	for i := len(candidates) - 1; i >= 0; i-- {
		applyEnvFile(candidates[i])
	}
}

func applyEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		eq := strings.Index(line, "=")
		if eq <= 0 {
			continue
		}
		key := strings.TrimSpace(line[:eq])
		value := strings.TrimSpace(line[eq+1:])
		if !strings.HasPrefix(value, "\"") && !strings.HasPrefix(value, "'") {
			if hash := strings.Index(value, "#"); hash >= 0 {
				value = strings.TrimSpace(value[:hash])
			}
		}
		if len(value) >= 2 {
			if (value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'') {
				value = value[1 : len(value)-1]
			}
		}
		if os.Getenv(key) == "" {
			_ = os.Setenv(key, value)
		}
	}
}

func splitURLs(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimRight(strings.TrimSpace(part), "/")
		if part != "" {
			out = append(out, part)
		}
	}
	if len(out) == 0 {
		return []string{"http://localhost:3000"}
	}
	return out
}

func firstEnv(keys ...string) string {
	for _, key := range keys {
		if v := strings.TrimSpace(os.Getenv(key)); v != "" {
			return v
		}
	}
	return ""
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func uniqueNonEmpty(values ...string) []string {
	seen := map[string]struct{}{}
	var out []string
	for _, v := range values {
		v = realSecret(v)
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	return out
}

func realSecret(value string) string {
	value = strings.TrimSpace(value)
	switch strings.ToLower(value) {
	case "", "your-google-client-id", "your-google-client-secret", "google-id", "google-secret",
		"your-google-client-id-for-web", "your-expo-ios-client-id", "your-expo-android-client-id":
		return ""
	default:
		return value
	}
}
