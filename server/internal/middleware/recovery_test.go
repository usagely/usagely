package middleware

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestRecovery(t *testing.T) {
	t.Run("catches panic and returns 500 JSON", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			panic("boom")
		})

		req := httptest.NewRequest(http.MethodGet, "/explode", nil)
		w := httptest.NewRecorder()
		Recovery(next).ServeHTTP(w, req)

		if w.Code != http.StatusInternalServerError {
			t.Errorf("status = %d, want %d", w.Code, http.StatusInternalServerError)
		}
		want := `{"error":"internal server error"}`
		if got := w.Body.String(); got != want {
			t.Errorf("body = %q, want %q", got, want)
		}
	})

	t.Run("passes through non-panicking handler", func(t *testing.T) {
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusTeapot)
			_, _ = w.Write([]byte("ok"))
		})

		req := httptest.NewRequest(http.MethodGet, "/safe", nil)
		w := httptest.NewRecorder()
		Recovery(next).ServeHTTP(w, req)

		if w.Code != http.StatusTeapot {
			t.Errorf("status = %d, want %d", w.Code, http.StatusTeapot)
		}
		if got := w.Body.String(); got != "ok" {
			t.Errorf("body = %q, want %q", got, "ok")
		}
	})

	t.Run("logs panic value and request path", func(t *testing.T) {
		var buf bytes.Buffer
		slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, nil)))
		t.Cleanup(func() {
			slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stderr, nil)))
		})

		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			panic("boom")
		})

		req := httptest.NewRequest(http.MethodGet, "/explode", nil)
		w := httptest.NewRecorder()
		Recovery(next).ServeHTTP(w, req)

		var entry map[string]any
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("unmarshal log: %v (raw: %s)", err, buf.String())
		}
		if got, _ := entry["error"].(string); got != "boom" {
			t.Errorf("logged error = %q, want %q", got, "boom")
		}
		if got, _ := entry["path"].(string); got != "/explode" {
			t.Errorf("logged path = %q, want %q", got, "/explode")
		}
	})
}
