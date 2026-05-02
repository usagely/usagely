package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type EERecommendation struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Reason     string  `json:"reason"`
	SavingsUSD float64 `json:"savings_usd"`
	Confidence float64 `json:"confidence"`
	Scope      string  `json:"scope"`
	Effort     string  `json:"effort"`
}

type RecommendationsResponse struct {
	Recommendations []EERecommendation `json:"recommendations"`
}

type RecommendationsRepo interface {
	ListRecommendations(ctx context.Context, orgID string) ([]EERecommendation, error)
}

type pgxRecommendationsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxRecommendationsRepo(pool *pgxpool.Pool) RecommendationsRepo {
	if pool == nil {
		return nil
	}
	return &pgxRecommendationsRepo{pool: pool}
}

func (r *pgxRecommendationsRepo) ListRecommendations(ctx context.Context, orgID string) ([]EERecommendation, error) {
	// tenancy:ok query filters by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT id, title, reason, savings_usd, confidence, scope, effort
		FROM recommendations
		WHERE org_id = $1
		ORDER BY savings_usd DESC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recommendations []EERecommendation
	for rows.Next() {
		var rec EERecommendation
		if err := rows.Scan(&rec.ID, &rec.Title, &rec.Reason, &rec.SavingsUSD, &rec.Confidence, &rec.Scope, &rec.Effort); err != nil {
			return nil, err
		}
		recommendations = append(recommendations, rec)
	}

	return recommendations, nil
}

func Recommendations(repo RecommendationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &RecommendationsResponse{
			Recommendations: []EERecommendation{},
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

		recommendations, err := repo.ListRecommendations(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch recommendations", http.StatusInternalServerError)
			return
		}

		if recommendations != nil {
			resp.Recommendations = recommendations
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
