package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestLogger(t *testing.T) {
	t.Run("logs method path status duration and request_id", func(t *testing.T) {
		var buf bytes.Buffer
		slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, nil)))
		t.Cleanup(func() {
			slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stderr, nil)))
		})

		inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusTeapot)
		})

		handler := RequestID(Logger(inner))

		req := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)

		var entry map[string]any
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("unmarshal log: %v (raw: %s)", err, buf.String())
		}
		if got := entry["method"]; got != "POST" {
			t.Errorf("method = %v, want POST", got)
		}
		if got := entry["path"]; got != "/api/v1/test" {
			t.Errorf("path = %v, want /api/v1/test", got)
		}
		if got, ok := entry["status"].(float64); !ok || int(got) != http.StatusTeapot {
			t.Errorf("status = %v, want %d", entry["status"], http.StatusTeapot)
		}
		if _, ok := entry["duration"]; !ok {
			t.Error("duration field missing from log")
		}
		if got, ok := entry["request_id"].(string); !ok || got == "" {
			t.Error("request_id missing or empty in log")
		}
	})

	t.Run("responseWriter records WriteHeader status", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rw := &responseWriter{ResponseWriter: rec, statusCode: http.StatusOK}
		rw.WriteHeader(http.StatusNotFound)

		if rw.statusCode != http.StatusNotFound {
			t.Errorf("statusCode = %d, want %d", rw.statusCode, http.StatusNotFound)
		}
		if rec.Code != http.StatusNotFound {
			t.Errorf("underlying recorder code = %d, want %d", rec.Code, http.StatusNotFound)
		}
	})

	t.Run("defaults to 200 when Write called without WriteHeader", func(t *testing.T) {
		var buf bytes.Buffer
		slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, nil)))
		t.Cleanup(func() {
			slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stderr, nil)))
		})

		inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("no explicit WriteHeader"))
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		ctx := context.WithValue(req.Context(), RequestIDKey, "test-id")
		req = req.WithContext(ctx)

		w := httptest.NewRecorder()
		Logger(inner).ServeHTTP(w, req)

		var entry map[string]any
		if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
			t.Fatalf("unmarshal log: %v (raw: %s)", err, buf.String())
		}
		if got, ok := entry["status"].(float64); !ok || int(got) != http.StatusOK {
			t.Errorf("status = %v, want %d", entry["status"], http.StatusOK)
		}
	})
}
