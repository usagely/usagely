package middleware

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/lestrrat-go/jwx/v2/jwa"
	"github.com/lestrrat-go/jwx/v2/jwk"
	"github.com/lestrrat-go/jwx/v2/jwt"
)

func makeEdDSAKeyPair(t *testing.T) (jwk.Key, ed25519.PrivateKey) {
	t.Helper()
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	privKey, err := jwk.FromRaw(priv)
	if err != nil {
		t.Fatalf("jwk from raw: %v", err)
	}
	pubKey, err := jwk.FromRaw(pub)
	if err != nil {
		t.Fatalf("jwk pub from raw: %v", err)
	}
	_ = privKey.Set(jwk.KeyIDKey, "test-kid")
	_ = pubKey.Set(jwk.KeyIDKey, "test-kid")
	_ = pubKey.Set(jwk.AlgorithmKey, jwa.EdDSA)
	return pubKey, priv
}

func makeJWT(t *testing.T, priv ed25519.PrivateKey, email string, exp time.Time) string {
	t.Helper()
	tok, err := jwt.NewBuilder().
		Subject("user-123").
		Claim("email", email).
		Expiration(exp).
		IssuedAt(time.Now()).
		Build()
	if err != nil {
		t.Fatalf("build token: %v", err)
	}
	privKey, err := jwk.FromRaw(priv)
	if err != nil {
		t.Fatalf("jwk from priv: %v", err)
	}
	_ = privKey.Set(jwk.KeyIDKey, "test-kid")
	_ = privKey.Set(jwk.AlgorithmKey, jwa.EdDSA)
	signed, err := jwt.Sign(tok, jwt.WithKey(jwa.EdDSA, privKey))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return string(signed)
}

func jwksServer(t *testing.T, pubKey jwk.Key) *httptest.Server {
	t.Helper()
	set := jwk.NewSet()
	_ = set.AddKey(pubKey)
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(set)
	}))
}

func TestAuthMiddleware(t *testing.T) {
	pubKey, privKey := makeEdDSAKeyPair(t)
	validToken := makeJWT(t, privKey, "priya@acme.co", time.Now().Add(1*time.Hour))
	expiredToken := makeJWT(t, privKey, "priya@acme.co", time.Now().Add(-1*time.Hour))

	srv := jwksServer(t, pubKey)
	defer srv.Close()

	am := NewAuthMiddleware(srv.URL)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		email, _ := r.Context().Value(ContextKeyUserEmail).(string)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(email))
	})

	handler := am.Handler(next)

	tests := []struct {
		name       string
		setupReq   func(r *http.Request)
		wantStatus int
		wantBody   string
	}{
		{
			name: "valid token via Authorization header",
			setupReq: func(r *http.Request) {
				r.Header.Set("Authorization", "Bearer "+validToken)
			},
			wantStatus: http.StatusOK,
			wantBody:   "priya@acme.co",
		},
		{
			name: "valid token via cookie",
			setupReq: func(r *http.Request) {
				r.AddCookie(&http.Cookie{Name: "better-auth.session_token", Value: validToken})
			},
			wantStatus: http.StatusOK,
			wantBody:   "priya@acme.co",
		},
		{
			name:       "missing token",
			setupReq:   func(r *http.Request) {},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "expired token",
			setupReq: func(r *http.Request) {
				r.Header.Set("Authorization", "Bearer "+expiredToken)
			},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name: "invalid token",
			setupReq: func(r *http.Request) {
				r.Header.Set("Authorization", "Bearer notavalidtoken")
			},
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
			tc.setupReq(req)
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)
			if w.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tc.wantStatus)
			}
			if tc.wantBody != "" && w.Body.String() != tc.wantBody {
				t.Errorf("body = %q, want %q", w.Body.String(), tc.wantBody)
			}
		})
	}
}

func TestEditionGate(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	tests := []struct {
		name          string
		serverEdition string
		xEdition      string
		path          string
		wantStatus    int
	}{
		{
			name:          "oss + oss EE route → 403",
			serverEdition: "oss",
			path:          "/api/v1/recommendations",
			wantStatus:    http.StatusForbidden,
		},
		{
			name:          "oss header + EE route → 403",
			serverEdition: "enterprise",
			xEdition:      "oss",
			path:          "/api/v1/shadow",
			wantStatus:    http.StatusForbidden,
		},
		{
			name:          "enterprise + EE route → 200",
			serverEdition: "enterprise",
			path:          "/api/v1/recommendations",
			wantStatus:    http.StatusOK,
		},
		{
			name:          "oss + non-EE route → 200",
			serverEdition: "oss",
			path:          "/api/v1/usage",
			wantStatus:    http.StatusOK,
		},
		{
			name:          "oss + approvals route → 403",
			serverEdition: "oss",
			path:          "/api/v1/approvals",
			wantStatus:    http.StatusForbidden,
		},
		{
			name:          "oss + forecast route → 403",
			serverEdition: "oss",
			path:          "/api/v1/forecast",
			wantStatus:    http.StatusForbidden,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			gate := EditionGate(tc.serverEdition)
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			if tc.xEdition != "" {
				req.Header.Set("X-Edition", tc.xEdition)
			}
			w := httptest.NewRecorder()
			gate(next).ServeHTTP(w, req)
			if w.Code != tc.wantStatus {
				t.Errorf("status = %d, want %d", w.Code, tc.wantStatus)
			}
		})
	}
}
