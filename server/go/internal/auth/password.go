package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"strings"

	"golang.org/x/crypto/scrypt"
	"golang.org/x/text/unicode/norm"
)

// Hash and verify match Better Auth's password format:
// saltHex + ":" + scrypt(NFKC(password), utf8(saltHex), N=16384, r=16, p=1, dkLen=64)
const (
	scryptN    = 16384
	scryptR    = 16
	scryptP    = 1
	scryptLen  = 64
	saltBytes  = 16
)

func HashPassword(password string) (string, error) {
	saltRaw := make([]byte, saltBytes)
	if _, err := rand.Read(saltRaw); err != nil {
		return "", err
	}
	salt := hex.EncodeToString(saltRaw)
	key, err := derive(password, salt)
	if err != nil {
		return "", err
	}
	return salt + ":" + hex.EncodeToString(key), nil
}

func VerifyPassword(hash, password string) bool {
	salt, keyHex, ok := strings.Cut(hash, ":")
	if !ok || salt == "" || keyHex == "" {
		return false
	}
	key, err := derive(password, salt)
	if err != nil {
		return false
	}
	got := hex.EncodeToString(key)
	if len(got) != len(keyHex) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(got), []byte(keyHex)) == 1
}

func derive(password, salt string) ([]byte, error) {
	return scrypt.Key([]byte(norm.NFKC.String(password)), []byte(salt), scryptN, scryptR, scryptP, scryptLen)
}

func SignToken(token, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(token))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return token + "." + sig
}

func NewID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return hex.EncodeToString(b[0:4]) + "-" +
		hex.EncodeToString(b[4:6]) + "-" +
		hex.EncodeToString(b[6:8]) + "-" +
		hex.EncodeToString(b[8:10]) + "-" +
		hex.EncodeToString(b[10:16])
}

func NewToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
