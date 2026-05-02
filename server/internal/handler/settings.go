package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Integration struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	Status   string `json:"status"`
	Info     string `json:"info"`
}

type Guardrail struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
}

type SettingsResponse struct {
	Integrations []Integration `json:"integrations"`
	Guardrails   []Guardrail   `json:"guardrails"`
}

type SettingsRepo interface {
	ListSettings(ctx context.Context, orgID string) ([]Integration, []Guardrail, error)
}

type pgxSettingsRepo struct {
	pool *pgxpool.Pool
}

func NewPgxSettingsRepo(pool *pgxpool.Pool) SettingsRepo {
	if pool == nil {
		return nil
	}
	return &pgxSettingsRepo{pool: pool}
}

func (r *pgxSettingsRepo) ListSettings(ctx context.Context, orgID string) ([]Integration, []Guardrail, error) {
	integrations := []Integration{
		{Name: "OpenAI", Category: "LLM API", Status: "connected", Info: "3 keys · last sync 2m ago"},
		{Name: "Anthropic", Category: "LLM API", Status: "connected", Info: "2 keys · last sync 2m ago"},
		{Name: "Google Vertex", Category: "LLM API", Status: "connected", Info: "GCP project acme-prod"},
		{Name: "GitHub Copilot", Category: "Coding", Status: "connected", Info: "Enterprise · 42 seats"},
		{Name: "Cursor", Category: "Coding", Status: "connected", Info: "Team API · 38 seats"},
		{Name: "Okta", Category: "Identity", Status: "connected", Info: "SCIM provisioning on"},
		{Name: "Ramp", Category: "Expenses", Status: "connected", Info: "Auto-classify AI vendors"},
		{Name: "Slack", Category: "Notifications", Status: "connected", Info: "#ai-finops"},
		{Name: "Snowflake", Category: "Warehouse", Status: "disconnected", Info: "Send daily export"},
		{Name: "Jira", Category: "Productivity", Status: "disconnected", Info: "Correlate work ↔ spend"},
	}
	guardrails := []Guardrail{
		{Title: "Require approval for new tools", Description: "Block provisioning of unknown vendors.", Enabled: true},
		{Title: "Auto-reclaim idle seats (>30d)", Description: "Downgrade Copilot/Cursor seats with no activity.", Enabled: true},
		{Title: "Cap per-user daily token spend", Description: "Alert at $50/user/day.", Enabled: true},
		{Title: "Block Shadow AI via egress", Description: "Drop requests to non-sanctioned domains.", Enabled: false},
		{Title: "Require tagging on all API keys", Description: "Enforce cost-center tag at key creation.", Enabled: true},
		{Title: "Redact PII before logging prompts", Description: "Detect & mask email/phone/SSN.", Enabled: true},
	}
	return integrations, guardrails, nil
}

func Settings(repo SettingsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &SettingsResponse{
			Integrations: []Integration{},
			Guardrails:   []Guardrail{},
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

		integrations, guardrails, err := repo.ListSettings(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to fetch settings", http.StatusInternalServerError)
			return
		}

		if integrations != nil {
			resp.Integrations = integrations
		}
		if guardrails != nil {
			resp.Guardrails = guardrails
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
