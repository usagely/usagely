package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Budget struct {
	ID       string  `json:"id"`
	Scope    string  `json:"scope"`
	Period   string  `json:"period"`
	LimitUSD float64 `json:"limit_usd"`
	UsedUSD  float64 `json:"used_usd"`
	AlertPct int     `json:"alert_pct"`
}

type BudgetsResponse struct {
	Budgets []Budget `json:"budgets"`
}

// Budgets returns a handler that fetches all budgets for the org
func Budgets(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		// Get org_id from context (set by auth middleware)
		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &BudgetsResponse{
			Budgets: []Budget{},
		}

		// If no pool, return empty response
		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		// Fetch budgets for org
		rows, err := pool.Query(ctx, `
			SELECT id, scope, period, limit_usd, used_usd, alert_pct
			FROM budgets
			WHERE org_id = $1
			ORDER BY scope ASC
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch budgets", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var b Budget
			if err := rows.Scan(&b.ID, &b.Scope, &b.Period, &b.LimitUSD, &b.UsedUSD, &b.AlertPct); err != nil {
				http.Error(w, "failed to scan budget", http.StatusInternalServerError)
				return
			}
			resp.Budgets = append(resp.Budgets, b)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
