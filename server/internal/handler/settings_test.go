package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type mockSettingsRepo struct {
	integrations []Integration
	guardrails   []Guardrail
	err          error
	gotOrgID     string
}

func (m *mockSettingsRepo) ListSettings(_ context.Context, orgID string) ([]Integration, []Guardrail, error) {
	m.gotOrgID = orgID
	return m.integrations, m.guardrails, m.err
}

func TestSettingsHappyPath(t *testing.T) {
	mock := &mockSettingsRepo{
		integrations: []Integration{
			{Name: "OpenAI", Category: "LLM API", Status: "connected", Info: "3 keys"},
		},
		guardrails: []Guardrail{
			{Title: "Block Shadow AI", Description: "Block it.", Enabled: true},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/settings", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Settings(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp SettingsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Integrations) != 1 {
		t.Fatalf("expected 1 integration, got %d", len(resp.Integrations))
	}
	if resp.Integrations[0].Name != "OpenAI" {
		t.Errorf("expected name OpenAI, got %s", resp.Integrations[0].Name)
	}
	if len(resp.Guardrails) != 1 {
		t.Fatalf("expected 1 guardrail, got %d", len(resp.Guardrails))
	}
	if resp.Guardrails[0].Title != "Block Shadow AI" {
		t.Errorf("expected title 'Block Shadow AI', got %s", resp.Guardrails[0].Title)
	}
}

func TestSettingsEmptyResult(t *testing.T) {
	mock := &mockSettingsRepo{
		integrations: []Integration{},
		guardrails:   []Guardrail{},
	}

	req := httptest.NewRequest("GET", "/api/v1/settings", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Settings(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp SettingsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Integrations == nil {
		t.Fatal("expected non-nil integrations array, got null")
	}
	if len(resp.Integrations) != 0 {
		t.Errorf("expected 0 integrations, got %d", len(resp.Integrations))
	}
	if resp.Guardrails == nil {
		t.Fatal("expected non-nil guardrails array, got null")
	}
	if len(resp.Guardrails) != 0 {
		t.Errorf("expected 0 guardrails, got %d", len(resp.Guardrails))
	}
}

func TestSettingsRepoError(t *testing.T) {
	mock := &mockSettingsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/settings", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Settings(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch settings") {
		t.Errorf("expected body to contain 'failed to fetch settings', got %q", body)
	}
}

func TestSettingsUnauthorized(t *testing.T) {
	mock := &mockSettingsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/settings", nil)
	w := httptest.NewRecorder()

	Settings(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestSettingsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/settings", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Settings(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp SettingsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Integrations == nil {
		t.Fatal("expected non-nil integrations array, got null")
	}
	if len(resp.Integrations) != 0 {
		t.Errorf("expected 0 integrations, got %d", len(resp.Integrations))
	}
	if resp.Guardrails == nil {
		t.Fatal("expected non-nil guardrails array, got null")
	}
	if len(resp.Guardrails) != 0 {
		t.Errorf("expected 0 guardrails, got %d", len(resp.Guardrails))
	}
}
