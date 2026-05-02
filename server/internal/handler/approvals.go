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

type ApprovalsRepo interface {
	ListApprovals(ctx context.Context, orgID string) ([]ApprovalItem, error)
}

type pgxApprovalsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxApprovalsRepo(pool *pgxpool.Pool) ApprovalsRepo {
	if pool == nil {
		return nil
	}
	return &pgxApprovalsRepo{pool: pool}
}

func (r *pgxApprovalsRepo) ListApprovals(ctx context.Context, orgID string) ([]ApprovalItem, error) {
	// tenancy:ok query filters by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT id, requester_name, tool_name, reason, cost_est_usd, status, created_at
		FROM approvals
		WHERE org_id = $1
		ORDER BY created_at DESC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var approvals []ApprovalItem
	for rows.Next() {
		var a ApprovalItem
		var createdAt time.Time
		if err := rows.Scan(&a.ID, &a.RequesterName, &a.ToolName, &a.Reason, &a.CostEstUSD, &a.Status, &createdAt); err != nil {
			return nil, err
		}
		a.CreatedAt = createdAt.Format(time.RFC3339)
		approvals = append(approvals, a)
	}

	return approvals, nil
}

func Approvals(repo ApprovalsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &ApprovalsResponse{
			Approvals: []ApprovalItem{},
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

		approvals, err := repo.ListApprovals(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch approvals", http.StatusInternalServerError)
			return
		}

		if approvals != nil {
			resp.Approvals = approvals
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
