package handler

import (
	"context"
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ForecastDriver struct {
	Name string  `json:"name"`
	Pct  float64 `json:"pct"`
}

type ForecastScenario struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Delta float64 `json:"delta"`
	Tone  string  `json:"tone"`
}

type ForecastResponse struct {
	HistoricalSpend []DailySpend       `json:"historical_spend"`
	ProjectedSpend  []DailySpend       `json:"projected_spend"`
	Drivers         []ForecastDriver   `json:"drivers"`
	Scenarios       []ForecastScenario `json:"scenarios"`
}

func Forecast(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &ForecastResponse{
			HistoricalSpend: []DailySpend{},
			ProjectedSpend:  []DailySpend{},
			Drivers:         []ForecastDriver{},
			Scenarios:       []ForecastScenario{},
		}

		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT date, total_value FROM usage_daily
			WHERE org_id = $1
			ORDER BY date ASC
			LIMIT 60
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch daily spend", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var hist []DailySpend
		for rows.Next() {
			var ds DailySpend
			if err := rows.Scan(&ds.Date, &ds.Value); err != nil {
				http.Error(w, "failed to scan daily spend", http.StatusInternalServerError)
				return
			}
			hist = append(hist, ds)
		}
		resp.HistoricalSpend = hist

		if len(hist) == 0 {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		lastVal := hist[len(hist)-1].Value
		lastDate, _ := time.Parse("2006-01-02", hist[len(hist)-1].Date)

		avgGrowth := 1.009
		rng := rand.New(rand.NewSource(42))

		for i := 1; i <= 30; i++ {
			lastVal = lastVal * avgGrowth * (0.95 + rng.Float64()*0.1)
			nextDate := lastDate.AddDate(0, 0, i)
			resp.ProjectedSpend = append(resp.ProjectedSpend, DailySpend{
				Date:  nextDate.Format("2006-01-02"),
				Value: math.Round(lastVal*100) / 100,
			})
		}

		resp.Drivers = []ForecastDriver{
			{Name: "Data & ML · RAG workloads", Pct: 0.42},
			{Name: "Engineering · Claude Code usage", Pct: 0.28},
			{Name: "Product · new prompt tooling", Pct: 0.14},
			{Name: "Marketing · image/video gen", Pct: 0.09},
			{Name: "Customer Support · triage AI", Pct: 0.07},
		}

		resp.Scenarios = []ForecastScenario{
			{Name: "Baseline", Value: 238000, Delta: 0.18, Tone: "info"},
			{Name: "Apply all recommendations", Value: 216000, Delta: 0.07, Tone: "accent"},
			{Name: "Hire +6 engineers", Value: 264000, Delta: 0.31, Tone: "warn"},
			{Name: "Launch new AI product", Value: 312000, Delta: 0.54, Tone: "danger"},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
