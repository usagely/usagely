package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

type ReadyResponse struct {
	Status string `json:"status"`
	Error  string `json:"error,omitempty"`
}

// Pingable abstracts the database ping for testing.
type Pingable interface {
	Ping(ctx context.Context) error
}

type pgxPingable struct {
	pool *pgxpool.Pool
}

// NewPgxPingable returns a Pingable backed by pgxpool, or nil when pool is nil.
func NewPgxPingable(pool *pgxpool.Pool) Pingable {
	if pool == nil {
		return nil
	}
	return &pgxPingable{pool: pool}
}

func (p *pgxPingable) Ping(ctx context.Context) error {
	return p.pool.Ping(ctx)
}

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(HealthResponse{
		Status:  "ok",
		Version: "0.1.0",
	})
}

func Ready(p Pingable) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if p == nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(ReadyResponse{
				Status: "not ready",
				Error:  "database not configured",
			})
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := p.Ping(ctx); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(ReadyResponse{
				Status: "not ready",
				Error:  err.Error(),
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(ReadyResponse{
			Status: "ready",
		})
	}
}
