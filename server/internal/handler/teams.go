package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Team struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Color     string  `json:"color"`
	Members   int     `json:"members"`
	Spend     float64 `json:"spend"`
	Budget    float64 `json:"budget"`
	PerUser   float64 `json:"per_user"`
	TopTool   string  `json:"top_tool"`
	Delta     float64 `json:"delta"`
	BudgetPct float64 `json:"budget_pct"`
}

type CostVsOutput struct {
	Name    string  `json:"name"`
	Spend   float64 `json:"spend"`
	PerUser float64 `json:"per_user"`
	Members int     `json:"members"`
	Color   string  `json:"color"`
}

type TeamsResponse struct {
	Teams        []Team         `json:"teams"`
	Heatmap      [][]float64    `json:"heatmap"`
	CostVsOutput []CostVsOutput `json:"cost_vs_output"`
}

// Teams returns a handler that fetches all teams data
func Teams(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		resp := &TeamsResponse{
			Teams:        []Team{},
			Heatmap:      [][]float64{},
			CostVsOutput: []CostVsOutput{},
		}

		// If no pool, return empty response
		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		// Get org_id from context (set by auth middleware)
		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		// Hardcoded data from design (screens1.jsx:159-163)
		spends := []float64{28420, 3100, 27100, 1240, 1380, 820, 260, 420}
		budgets := []float64{32000, 4000, 28000, 2000, 3500, 1500, 500, 1000}
		perUsers := []float64{592, 141, 1426, 89, 115, 91, 43, 84}
		topTools := []string{"Claude Code", "ChatGPT Team", "Anthropic API", "Midjourney", "Claude Teams", "ChatGPT Team", "ChatGPT Team", "ChatGPT Team"}
		deltas := []float64{0.18, 0.05, 0.41, 0.12, -0.08, 0.02, 0.0, 0.09}

		// Fetch teams with member count
		teamRows, err := pool.Query(ctx, `
			SELECT t.id, t.name, t.color, COUNT(u.id) as members
			FROM teams t
			LEFT JOIN users u ON u.team_id = t.id
			WHERE t.org_id = $1
			GROUP BY t.id, t.name, t.color
			ORDER BY t.created_at ASC
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch teams", http.StatusInternalServerError)
			return
		}
		defer teamRows.Close()

		teamIdx := 0
		for teamRows.Next() {
			var team Team
			if err := teamRows.Scan(&team.ID, &team.Name, &team.Color, &team.Members); err != nil {
				http.Error(w, "failed to scan team", http.StatusInternalServerError)
				return
			}

			// Apply hardcoded values
			if teamIdx < len(spends) {
				team.Spend = spends[teamIdx]
				team.Budget = budgets[teamIdx]
				team.PerUser = perUsers[teamIdx]
				team.TopTool = topTools[teamIdx]
				team.Delta = deltas[teamIdx]
				if team.Budget > 0 {
					team.BudgetPct = team.Spend / team.Budget
				}
			}

			resp.Teams = append(resp.Teams, team)
			teamIdx++
		}

		// Heatmap: 6×10 matrix from screens1.jsx:249-256
		resp.Heatmap = [][]float64{
			{4200, 8200, 1200, 620, 1520, 4200, 360, 820, 0, 120},
			{320, 420, 180, 60, 120, 0, 560, 380, 80, 0},
			{9800, 10000, 4200, 0, 280, 620, 180, 120, 0, 80},
			{120, 80, 40, 0, 0, 0, 220, 80, 180, 0},
			{160, 220, 60, 0, 0, 0, 480, 260, 0, 420},
			{60, 90, 20, 0, 60, 0, 320, 180, 0, 120},
		}

		// Cost vs output: same as teams but with spend/per_user/members/color
		for _, team := range resp.Teams {
			resp.CostVsOutput = append(resp.CostVsOutput, CostVsOutput{
				Name:    team.Name,
				Spend:   team.Spend,
				PerUser: team.PerUser,
				Members: team.Members,
				Color:   team.Color,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
