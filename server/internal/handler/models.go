package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type APIModel struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Vendor     string  `json:"vendor"`
	TokensIn   int64   `json:"tokens_in"`
	TokensOut  int64   `json:"tokens_out"`
	Calls      int64   `json:"calls"`
	Cost       float64 `json:"cost"`
	AvgLatency float64 `json:"avg_latency"`
}

type ModelsResponse struct {
	TotalTokens int64      `json:"total_tokens"`
	TotalCost   float64    `json:"total_cost"`
	TotalCalls  int64      `json:"total_calls"`
	Models      []APIModel `json:"models"`
}

type ModelsRepo interface {
	ListModels(ctx context.Context, orgID string) ([]APIModel, error)
}

type pgxModelsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxModelsRepo(pool *pgxpool.Pool) ModelsRepo {
	if pool == nil {
		return nil
	}
	return &pgxModelsRepo{pool: pool}
}

func (r *pgxModelsRepo) ListModels(ctx context.Context, orgID string) ([]APIModel, error) {
	// tenancy:ok query filters by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT m.id, m.name, m.vendor,
			   COALESCE(mu.tokens_in, 0) as tokens_in,
			   COALESCE(mu.tokens_out, 0) as tokens_out,
			   COALESCE(mu.calls, 0) as calls,
			   COALESCE(mu.cost_usd, 0) as cost,
			   COALESCE(mu.avg_latency, 0) as avg_latency
		FROM models m
		LEFT JOIN model_usage mu ON mu.model_id = m.id AND mu.org_id = $1
		ORDER BY m.name ASC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var models []APIModel
	for rows.Next() {
		var m APIModel
		if err := rows.Scan(&m.ID, &m.Name, &m.Vendor, &m.TokensIn, &m.TokensOut, &m.Calls, &m.Cost, &m.AvgLatency); err != nil {
			return nil, err
		}
		models = append(models, m)
	}

	return models, nil
}

func Models(repo ModelsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &ModelsResponse{
			TotalTokens: 0,
			TotalCost:   0,
			TotalCalls:  0,
			Models:      []APIModel{},
		}

		if repo == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		models, err := repo.ListModels(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch models", http.StatusInternalServerError)
			return
		}

		if models != nil {
			resp.Models = models
			for _, m := range models {
				resp.TotalTokens += m.TokensIn + m.TokensOut
				resp.TotalCost += m.Cost
				resp.TotalCalls += m.Calls
			}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
