package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DailySpend struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

type SpendByCategory struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Color string  `json:"color"`
}

type Anomaly struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Body     string `json:"body"`
	Severity string `json:"severity"`
	Team     string `json:"team"`
	Owner    string `json:"owner"`
}

type Recommendation struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Reason     string  `json:"reason"`
	Savings    float64 `json:"savings"`
	Confidence float64 `json:"confidence"`
	Scope      string  `json:"scope"`
}

type TeamSpend struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Members int     `json:"members"`
	Spend   float64 `json:"spend"`
	PerUser float64 `json:"per_user"`
	Delta   float64 `json:"delta"`
}

type DashboardResponse struct {
	MTDSpend        float64           `json:"mtd_spend"`
	ProjectedMonth  float64           `json:"projected_month"`
	ActiveTools     int               `json:"active_tools"`
	ActiveUsers     int               `json:"active_users"`
	MTDDelta        float64           `json:"mtd_delta"`
	ProjectedDelta  float64           `json:"projected_delta"`
	ToolsDelta      float64           `json:"tools_delta"`
	UsersDelta      float64           `json:"users_delta"`
	DailySpend      []DailySpend      `json:"daily_spend"`
	SpendByCategory []SpendByCategory `json:"spend_by_category"`
	Anomalies       []Anomaly         `json:"anomalies"`
	Recommendations []Recommendation  `json:"recommendations"`
	TeamsSpend      []TeamSpend       `json:"teams_spend"`
}

// Dashboard returns a handler that fetches all dashboard data
func Dashboard(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		// Get org_id from context (set by auth middleware)
		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &DashboardResponse{
			DailySpend:      []DailySpend{},
			SpendByCategory: []SpendByCategory{},
			Anomalies:       []Anomaly{},
			Recommendations: []Recommendation{},
			TeamsSpend:      []TeamSpend{},
		}

		// If no pool, return empty response
		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		// Fetch daily spend (last 60 days)
		dailyRows, err := pool.Query(ctx, `
			SELECT date, total_value FROM usage_daily
			WHERE org_id = $1
			ORDER BY date ASC
			LIMIT 60
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch daily spend", http.StatusInternalServerError)
			return
		}
		defer dailyRows.Close()

		var mtdSpend float64
		var prevMtdSpend float64
		today := time.Now()
		currentMonth := today.Month()
		currentYear := today.Year()
		daysElapsed := today.Day()

		for dailyRows.Next() {
			var date time.Time
			var value float64
			if err := dailyRows.Scan(&date, &value); err != nil {
				http.Error(w, "failed to scan daily spend", http.StatusInternalServerError)
				return
			}

			dateStr := date.Format("2006-01-02")
			resp.DailySpend = append(resp.DailySpend, DailySpend{
				Date:  dateStr,
				Value: value,
			})

			if date.Month() == currentMonth && date.Year() == currentYear {
				mtdSpend += value
			} else if date.Month() == time.Month((int(currentMonth)-2)%12+1) && date.Year() == currentYear {
				prevMtdSpend += value
			}
		}

		resp.MTDSpend = mtdSpend

		// Calculate projected month
		if daysElapsed > 0 {
			resp.ProjectedMonth = mtdSpend * (30.0 / float64(daysElapsed))
		}

		// Calculate deltas
		if prevMtdSpend > 0 {
			resp.MTDDelta = (mtdSpend - prevMtdSpend) / prevMtdSpend
		}
		resp.ProjectedDelta = 0.214 // Hardcoded from design
		resp.ToolsDelta = 0.12      // Hardcoded from design
		resp.UsersDelta = 0.03      // Hardcoded from design

		// Fetch active tools (status = 'approved')
		toolRow := pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM tools
			WHERE org_id = $1 AND status = 'approved'
		`, orgID)
		if err := toolRow.Scan(&resp.ActiveTools); err != nil {
			http.Error(w, "failed to fetch active tools", http.StatusInternalServerError)
			return
		}

		// Fetch active users
		userRow := pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM users
			WHERE org_id = $1
		`, orgID)
		if err := userRow.Scan(&resp.ActiveUsers); err != nil {
			http.Error(w, "failed to fetch active users", http.StatusInternalServerError)
			return
		}

		// Hardcoded spend by category (from design data)
		resp.SpendByCategory = []SpendByCategory{
			{Name: "LLM APIs", Value: 90220, Color: "var(--chart-1)"},
			{Name: "Coding", Value: 6518, Color: "var(--chart-2)"},
			{Name: "Chat seats", Value: 4290, Color: "var(--chart-3)"},
			{Name: "Media", Value: 636, Color: "var(--chart-4)"},
			{Name: "Voice", Value: 1060, Color: "var(--chart-5)"},
		}

		// Fetch anomalies (last 4 by detected_at DESC)
		anomalyRows, err := pool.Query(ctx, `
			SELECT id, title, body, severity, team_name, owner_name
			FROM anomalies
			WHERE org_id = $1
			ORDER BY detected_at DESC
			LIMIT 4
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch anomalies", http.StatusInternalServerError)
			return
		}
		defer anomalyRows.Close()

		for anomalyRows.Next() {
			var a Anomaly
			if err := anomalyRows.Scan(&a.ID, &a.Title, &a.Body, &a.Severity, &a.Team, &a.Owner); err != nil {
				http.Error(w, "failed to scan anomaly", http.StatusInternalServerError)
				return
			}
			resp.Anomalies = append(resp.Anomalies, a)
		}

		// Fetch recommendations (first 4 by savings_usd DESC)
		recRows, err := pool.Query(ctx, `
			SELECT id, title, reason, savings_usd, confidence, scope
			FROM recommendations
			WHERE org_id = $1
			ORDER BY savings_usd DESC
			LIMIT 4
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch recommendations", http.StatusInternalServerError)
			return
		}
		defer recRows.Close()

		for recRows.Next() {
			var r Recommendation
			if err := recRows.Scan(&r.ID, &r.Title, &r.Reason, &r.Savings, &r.Confidence, &r.Scope); err != nil {
				http.Error(w, "failed to scan recommendation", http.StatusInternalServerError)
				return
			}
			resp.Recommendations = append(resp.Recommendations, r)
		}

		// Fetch teams spend (top 6 by spend)
		teamRows, err := pool.Query(ctx, `
			SELECT t.id, t.name, COUNT(u.id) as members,
				   COALESCE(SUM(uu.cost_usd), 0) as spend,
				   CASE WHEN COUNT(u.id) > 0 THEN COALESCE(SUM(uu.cost_usd), 0) / COUNT(u.id) ELSE 0 END as per_user
			FROM teams t
			LEFT JOIN users u ON u.team_id = t.id
			LEFT JOIN user_usage uu ON uu.user_id = u.id
			WHERE t.org_id = $1
			GROUP BY t.id, t.name
			ORDER BY spend DESC
			LIMIT 6
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch teams spend", http.StatusInternalServerError)
			return
		}
		defer teamRows.Close()

		// Hardcoded deltas for teams (from design)
		teamDeltas := []float64{0.18, 0.09, 0.41, -0.04, 0.12, -0.08}
		teamIdx := 0

		for teamRows.Next() {
			var ts TeamSpend
			if err := teamRows.Scan(&ts.ID, &ts.Name, &ts.Members, &ts.Spend, &ts.PerUser); err != nil {
				http.Error(w, "failed to scan team spend", http.StatusInternalServerError)
				return
			}
			if teamIdx < len(teamDeltas) {
				ts.Delta = teamDeltas[teamIdx]
			}
			resp.TeamsSpend = append(resp.TeamsSpend, ts)
			teamIdx++
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
