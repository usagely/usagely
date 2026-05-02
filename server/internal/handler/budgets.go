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

type BudgetsRepo interface {
	ListBudgets(ctx context.Context, orgID string) ([]Budget, error)
}

type pgxBudgetsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxBudgetsRepo(pool *pgxpool.Pool) BudgetsRepo {
	if pool == nil {
		return nil
	}
	return &pgxBudgetsRepo{pool: pool}
}

func (r *pgxBudgetsRepo) ListBudgets(ctx context.Context, orgID string) ([]Budget, error) {
	// tenancy:ok query filters by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT id, scope, period, limit_usd, used_usd, alert_pct
		FROM budgets
		WHERE org_id = $1
		ORDER BY scope ASC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var budgets []Budget
	for rows.Next() {
		var b Budget
		if err := rows.Scan(&b.ID, &b.Scope, &b.Period, &b.LimitUSD, &b.UsedUSD, &b.AlertPct); err != nil {
			return nil, err
		}
		budgets = append(budgets, b)
	}

	return budgets, nil
}

func Budgets(repo BudgetsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &BudgetsResponse{
			Budgets: []Budget{},
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

		budgets, err := repo.ListBudgets(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch budgets", http.StatusInternalServerError)
			return
		}

		if budgets != nil {
			resp.Budgets = budgets
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
