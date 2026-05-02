package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ShadowTool struct {
	ID         string  `json:"id"`
	ToolName   string  `json:"tool_name"`
	UsersCount int     `json:"users_count"`
	Source     string  `json:"source"`
	FirstSeen  string  `json:"first_seen"`
	MonthlyUSD float64 `json:"monthly_usd"`
	Risk       string  `json:"risk"`
}

type ShadowResponse struct {
	ShadowTools []ShadowTool `json:"shadow_tools"`
}

type ShadowRepo interface {
	ListShadowTools(ctx context.Context, orgID string) ([]ShadowTool, error)
}

type pgxShadowRepo struct {
	pool *pgxpool.Pool
}

func NewPgxShadowRepo(pool *pgxpool.Pool) ShadowRepo {
	if pool == nil {
		return nil
	}
	return &pgxShadowRepo{pool: pool}
}

func (r *pgxShadowRepo) ListShadowTools(ctx context.Context, orgID string) ([]ShadowTool, error) {
	// tenancy:ok query filters by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT id, tool_name, users_count, source, first_seen, monthly_usd, risk
		FROM shadow_tools
		WHERE org_id = $1
		ORDER BY monthly_usd DESC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var shadowTools []ShadowTool
	for rows.Next() {
		var s ShadowTool
		var firstSeen time.Time
		if err := rows.Scan(&s.ID, &s.ToolName, &s.UsersCount, &s.Source, &firstSeen, &s.MonthlyUSD, &s.Risk); err != nil {
			return nil, err
		}
		s.FirstSeen = firstSeen.Format("2006-01-02")
		shadowTools = append(shadowTools, s)
	}

	return shadowTools, nil
}

func Shadow(repo ShadowRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &ShadowResponse{
			ShadowTools: []ShadowTool{},
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

		shadowTools, err := repo.ListShadowTools(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch shadow tools", http.StatusInternalServerError)
			return
		}

		if shadowTools != nil {
			resp.ShadowTools = shadowTools
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
