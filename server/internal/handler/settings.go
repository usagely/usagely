package handler

import (
	"encoding/json"
	"net/http"
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

func Settings(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := SettingsResponse{
		Integrations: []Integration{
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
		},
		Guardrails: []Guardrail{
			{Title: "Require approval for new tools", Description: "Block provisioning of unknown vendors.", Enabled: true},
			{Title: "Auto-reclaim idle seats (>30d)", Description: "Downgrade Copilot/Cursor seats with no activity.", Enabled: true},
			{Title: "Cap per-user daily token spend", Description: "Alert at $50/user/day.", Enabled: true},
			{Title: "Block Shadow AI via egress", Description: "Drop requests to non-sanctioned domains.", Enabled: false},
			{Title: "Require tagging on all API keys", Description: "Enforce cost-center tag at key creation.", Enabled: true},
			{Title: "Redact PII before logging prompts", Description: "Detect & mask email/phone/SSN.", Enabled: true},
		},
	}

	json.NewEncoder(w).Encode(response)
}
