package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

const RequestIDKey = "request-id"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(RequestIDKey)
		if id == "" {
			id = uuid.New().String()
		}
		ctx := context.WithValue(r.Context(), RequestIDKey, id)
		w.Header().Set(RequestIDKey, id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
