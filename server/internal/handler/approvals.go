package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ApprovalItem struct {
	ID            string  `json:"id"`
	RequesterName string  `json:"requester_name"`
	ToolName      string  `json:"tool_name"`
	Reason        string  `json:"reason"`
	CostEstUSD    float64 `json:"cost_est_usd"`
	Status        string  `json:"status"`
	CreatedAt     string  `json:"created_at"`
}

type ApprovalsResponse struct {
	Approvals []ApprovalItem `json:"approvals"`
}

func Approvals(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		resp := &ApprovalsResponse{
			Approvals: []ApprovalItem{},
		}

		if pool == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		rows, err := pool.Query(ctx, `
			SELECT id, requester_name, tool_name, reason, cost_est_usd, status, created_at
			FROM approvals
			WHERE org_id = $1
			ORDER BY created_at DESC
		`, orgID)
		if err != nil {
			http.Error(w, "failed to fetch approvals", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var a ApprovalItem
			var createdAt time.Time
			if err := rows.Scan(&a.ID, &a.RequesterName, &a.ToolName, &a.Reason, &a.CostEstUSD, &a.Status, &createdAt); err != nil {
				http.Error(w, "failed to scan approval", http.StatusInternalServerError)
				return
			}
			a.CreatedAt = createdAt.Format(time.RFC3339)
			resp.Approvals = append(resp.Approvals, a)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}
}
