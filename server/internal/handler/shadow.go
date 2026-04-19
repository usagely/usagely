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

func Shadow(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &ShadowResponse{
			ShadowTools: []ShadowTool{},
		}

		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT id, tool_name, users_count, source, first_seen, monthly_usd, risk
			FROM shadow_tools
			WHERE org_id = $1
			ORDER BY monthly_usd DESC
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch shadow tools", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var s ShadowTool
			var firstSeen time.Time
			if err := rows.Scan(&s.ID, &s.ToolName, &s.UsersCount, &s.Source, &firstSeen, &s.MonthlyUSD, &s.Risk); err != nil {
				http.Error(w, "failed to scan shadow tool", http.StatusInternalServerError)
				return
			}
			s.FirstSeen = firstSeen.Format("2006-01-02")
			resp.ShadowTools = append(resp.ShadowTools, s)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
