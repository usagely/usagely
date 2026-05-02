package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCORS(t *testing.T) {
	const allowedOrigin = "https://app.usagely.io"

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := CORS(allowedOrigin)(next)

	tests := []struct {
		name    string
		method  string
		origin  string
		headers map[string]string
		check   func(t *testing.T, resp *httptest.ResponseRecorder)
	}{
		{
			name:   "preflight from allowed origin",
			method: http.MethodOptions,
			origin: allowedOrigin,
			headers: map[string]string{
				"Access-Control-Request-Method":  "POST",
				"Access-Control-Request-Headers": "Content-Type, Authorization, Cookie",
			},
			check: func(t *testing.T, resp *httptest.ResponseRecorder) {
				t.Helper()
				h := resp.Header()
				if got := h.Get("Access-Control-Allow-Origin"); got != allowedOrigin {
					t.Errorf("Allow-Origin = %q, want %q", got, allowedOrigin)
				}
				if got := h.Get("Access-Control-Allow-Methods"); got == "" {
					t.Error("Allow-Methods is empty")
				}
				hdrs := h.Get("Access-Control-Allow-Headers")
				for _, hdr := range []string{"Content-Type", "Authorization", "Cookie"} {
					if !strings.Contains(strings.ToLower(hdrs), strings.ToLower(hdr)) {
						t.Errorf("Allow-Headers %q missing %s", hdrs, hdr)
					}
				}
				if got := h.Get("Access-Control-Allow-Credentials"); got != "true" {
					t.Errorf("Allow-Credentials = %q, want true", got)
				}
				if got := h.Get("Access-Control-Max-Age"); got != "300" {
					t.Errorf("Max-Age = %q, want 300", got)
				}
			},
		},
		{
			name:   "non-allowed origin gets no CORS headers",
			method: http.MethodOptions,
			origin: "https://evil.example.com",
			headers: map[string]string{
				"Access-Control-Request-Method": "GET",
			},
			check: func(t *testing.T, resp *httptest.ResponseRecorder) {
				t.Helper()
				if got := resp.Header().Get("Access-Control-Allow-Origin"); got != "" {
					t.Errorf("Allow-Origin = %q, want empty for non-allowed origin", got)
				}
			},
		},
		{
			name:   "simple GET from allowed origin",
			method: http.MethodGet,
			origin: allowedOrigin,
			check: func(t *testing.T, resp *httptest.ResponseRecorder) {
				t.Helper()
				if got := resp.Header().Get("Access-Control-Allow-Origin"); got != allowedOrigin {
					t.Errorf("Allow-Origin = %q, want %q", got, allowedOrigin)
				}
				exposed := resp.Header().Get("Access-Control-Expose-Headers")
				if !strings.Contains(exposed, "Content-Length") {
					t.Errorf("Expose-Headers %q missing Content-Length", exposed)
				}
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, "/api/v1/test", nil)
			req.Header.Set("Origin", tc.origin)
			for k, v := range tc.headers {
				req.Header.Set(k, v)
			}
			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)
			tc.check(t, w)
		})
	}
}
