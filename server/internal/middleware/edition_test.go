package middleware

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEditionGate_HeaderOverride(t *testing.T) {
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
			name:          "X-Edition ee overrides oss server on EE route",
			serverEdition: "oss",
			xEdition:      "ee",
			path:          "/api/v1/recommendations",
			wantStatus:    http.StatusOK,
		},
		{
			name:          "oss server blocks shadow route",
			serverEdition: "oss",
			path:          "/api/v1/shadow",
			wantStatus:    http.StatusForbidden,
		},
		{
			name:          "ee server allows recommendations without header",
			serverEdition: "ee",
			path:          "/api/v1/recommendations",
			wantStatus:    http.StatusOK,
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
			if tc.wantStatus == http.StatusForbidden {
				if got := w.Header().Get("Content-Type"); got != "application/json" {
					t.Errorf("Content-Type = %q, want application/json", got)
				}
				var body map[string]string
				if err := json.NewDecoder(w.Body).Decode(&body); err != nil {
					t.Fatalf("decode body: %v", err)
				}
				if body["error"] != "enterprise edition required" {
					t.Errorf("error = %q, want %q", body["error"], "enterprise edition required")
				}
			}
		})
	}
}

func TestIsEERoute(t *testing.T) {
	tests := []struct {
		path string
		want bool
	}{
		{"/api/v1/recommendations", true},
		{"/api/v1/recommendations/123", true},
		{"/api/v1/shadow", true},
		{"/api/v1/shadow/config", true},
		{"/api/v1/approvals", true},
		{"/api/v1/forecast", true},
		{"/api/v1/dashboard", false},
		{"/api/v1/usage", false},
		{"/", false},
	}

	for _, tc := range tests {
		t.Run(tc.path, func(t *testing.T) {
			if got := isEERoute(tc.path); got != tc.want {
				t.Errorf("isEERoute(%q) = %v, want %v", tc.path, got, tc.want)
			}
		})
	}
}
