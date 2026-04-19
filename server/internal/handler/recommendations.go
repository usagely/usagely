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

func Recommendations(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &RecommendationsResponse{
			Recommendations: []EERecommendation{},
		}

		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT id, title, reason, savings_usd, confidence, scope, effort
			FROM recommendations
			WHERE org_id = $1
			ORDER BY savings_usd DESC
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch recommendations", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var rec EERecommendation
			if err := rows.Scan(&rec.ID, &rec.Title, &rec.Reason, &rec.SavingsUSD, &rec.Confidence, &rec.Scope, &rec.Effort); err != nil {
				http.Error(w, "failed to scan recommendation", http.StatusInternalServerError)
				return
			}
			resp.Recommendations = append(resp.Recommendations, rec)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
