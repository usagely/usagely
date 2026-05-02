package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Tool struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Vendor       string  `json:"vendor"`
	Category     string  `json:"category"`
	Status       string  `json:"status"`
	Seats        *int    `json:"seats"`
	Provisioning string  `json:"provisioning"`
	Spend        float64 `json:"spend"`
	Prev         float64 `json:"prev"`
}

type ToolsResponse struct {
	Tools []Tool `json:"tools"`
}

type ToolsRepo interface {
	ListTools(ctx context.Context, orgID string, category string) ([]Tool, error)
}

type pgxToolsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxToolsRepo(pool *pgxpool.Pool) ToolsRepo {
	if pool == nil {
		return nil
	}
	return &pgxToolsRepo{pool: pool}
}

func (r *pgxToolsRepo) ListTools(ctx context.Context, orgID string, category string) ([]Tool, error) {
	query := `
		SELECT id, name, vendor, category, status, seats, provisioning, spend_current, spend_prev
		FROM tools
		WHERE org_id = $1
	`
	args := []interface{}{orgID}

	if category != "" && category != "All" {
		query += ` AND category = $2`
		args = append(args, category)
	}

	query += ` ORDER BY name ASC`

	// tenancy:ok query is built above with WHERE org_id = $1
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tools []Tool
	for rows.Next() {
		var t Tool
		if err := rows.Scan(&t.ID, &t.Name, &t.Vendor, &t.Category, &t.Status, &t.Seats, &t.Provisioning, &t.Spend, &t.Prev); err != nil {
			return nil, err
		}
		tools = append(tools, t)
	}

	return tools, nil
}

func Tools(repo ToolsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &ToolsResponse{
			Tools: []Tool{},
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

		category := r.URL.Query().Get("category")

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		tools, err := repo.ListTools(ctx, orgID, category)
		if err != nil {
			http.Error(w, "failed to fetch tools", http.StatusInternalServerError)
			return
		}

		if tools != nil {
			resp.Tools = tools
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
