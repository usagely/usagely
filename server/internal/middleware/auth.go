package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

type contextKey string

const (
	ContextKeyUserID    contextKey = "userID"
	ContextKeyUserEmail contextKey = "userEmail"
)

type AuthMiddleware struct {
	jwksURL string
	cache   *jwk.Cache
}

func NewAuthMiddleware(jwksURL string) *AuthMiddleware {
	cache := jwk.NewCache(context.Background())
	if jwksURL != "" && jwksURL != "skip" {
		if err := cache.Register(jwksURL, jwk.WithMinRefreshInterval(1*time.Hour)); err != nil {
			slog.Warn("auth: failed to register JWKS URL", slog.String("url", jwksURL), slog.Any("error", err))
		}
	}
	return &AuthMiddleware{
		jwksURL: jwksURL,
		cache:   cache,
	}
}

func (a *AuthMiddleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if a.jwksURL == "skip" {
			ctx := context.WithValue(r.Context(), ContextKeyUserID, "dev-user")
			ctx = context.WithValue(ctx, ContextKeyUserEmail, "dev@usagely.local")
			ctx = context.WithValue(ctx, "org_id", "00000000-0000-0000-0000-000000000001")
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		token := extractToken(r)
		if token == "" {
			writeAuthError(w, "missing token", http.StatusUnauthorized)
			return
		}

		keySet, err := a.cache.Get(r.Context(), a.jwksURL)
		if err != nil {
			slog.Warn("auth: JWKS fetch failed", slog.Any("error", err))
			writeAuthError(w, "authentication service unavailable", http.StatusUnauthorized)
			return
		}

		parsed, err := jwt.Parse([]byte(token),
			jwt.WithKeySet(keySet),
			jwt.WithValidate(true),
		)
		if err != nil {
			writeAuthError(w, "invalid token", http.StatusUnauthorized)
			return
		}

		// Extract claims
		sub := parsed.Subject()
		emailVal, _ := parsed.Get("email")
		emailStr, _ := emailVal.(string)

		ctx := context.WithValue(r.Context(), ContextKeyUserID, sub)
		ctx = context.WithValue(ctx, ContextKeyUserEmail, emailStr)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func extractToken(r *http.Request) string {
	if cookie, err := r.Cookie("better-auth.session_token"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}

func writeAuthError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
