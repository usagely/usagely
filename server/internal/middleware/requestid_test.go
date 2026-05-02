package middleware

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
)

var uuidV4Re = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func TestRequestID(t *testing.T) {
	t.Run("generates UUIDv4 when no header present", func(t *testing.T) {
		var ctxID string
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctxID = r.Context().Value(RequestIDKey).(string)
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		RequestID(next).ServeHTTP(w, req)

		respID := w.Header().Get(RequestIDKey)
		if respID == "" {
			t.Fatal("response header request-id is empty")
		}
		if !uuidV4Re.MatchString(respID) {
			t.Errorf("response header %q does not match UUIDv4 pattern", respID)
		}
		if ctxID != respID {
			t.Errorf("context id %q != response header id %q", ctxID, respID)
		}
	})

	t.Run("propagates existing header without overwrite", func(t *testing.T) {
		const incoming = "my-custom-request-id"
		var ctxID string
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctxID = r.Context().Value(RequestIDKey).(string)
			w.WriteHeader(http.StatusOK)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set(RequestIDKey, incoming)
		w := httptest.NewRecorder()
		RequestID(next).ServeHTTP(w, req)

		if got := w.Header().Get(RequestIDKey); got != incoming {
			t.Errorf("response header = %q, want %q", got, incoming)
		}
		if ctxID != incoming {
			t.Errorf("context id = %q, want %q", ctxID, incoming)
		}
	})

	t.Run("downstream handler reads id from context", func(t *testing.T) {
		var ctxVal any
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctxVal = r.Context().Value(RequestIDKey)
		})

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		RequestID(next).ServeHTTP(w, req)

		id, ok := ctxVal.(string)
		if !ok || id == "" {
			t.Fatal("downstream could not read request id from context")
		}
	})
}
