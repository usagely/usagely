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

type mockModelsRepo struct {
	models   []APIModel
	err      error
	gotOrgID string
}

func (m *mockModelsRepo) ListModels(_ context.Context, orgID string) ([]APIModel, error) {
	m.gotOrgID = orgID
	return m.models, m.err
}

func TestModelsHappyPath(t *testing.T) {
	mock := &mockModelsRepo{
		models: []APIModel{
			{ID: "1", Name: "GPT-4o", Vendor: "OpenAI", TokensIn: 1000, TokensOut: 500, Calls: 10, Cost: 0.50, AvgLatency: 1.2},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/models", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Models(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ModelsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Models) != 1 {
		t.Fatalf("expected 1 model, got %d", len(resp.Models))
	}
	if resp.Models[0].Name != "GPT-4o" {
		t.Errorf("expected name GPT-4o, got %s", resp.Models[0].Name)
	}
	if resp.Models[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.Models[0].ID)
	}
	if resp.TotalTokens != 1500 {
		t.Errorf("expected total tokens 1500, got %d", resp.TotalTokens)
	}
	if resp.TotalCost != 0.50 {
		t.Errorf("expected total cost 0.50, got %f", resp.TotalCost)
	}
	if resp.TotalCalls != 10 {
		t.Errorf("expected total calls 10, got %d", resp.TotalCalls)
	}
}

func TestModelsEmptyResult(t *testing.T) {
	mock := &mockModelsRepo{
		models: []APIModel{},
	}

	req := httptest.NewRequest("GET", "/api/v1/models", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Models(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ModelsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Models == nil {
		t.Fatal("expected non-nil models array, got null")
	}
	if len(resp.Models) != 0 {
		t.Errorf("expected 0 models, got %d", len(resp.Models))
	}
	if resp.TotalTokens != 0 {
		t.Errorf("expected total tokens 0, got %d", resp.TotalTokens)
	}
}

func TestModelsRepoError(t *testing.T) {
	mock := &mockModelsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/models", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Models(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch models") {
		t.Errorf("expected body to contain 'failed to fetch models', got %q", body)
	}
}

func TestModelsUnauthorized(t *testing.T) {
	mock := &mockModelsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/models", nil)
	w := httptest.NewRecorder()

	Models(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestModelsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/models", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Models(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ModelsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Models == nil {
		t.Fatal("expected non-nil models array, got null")
	}
	if len(resp.Models) != 0 {
		t.Errorf("expected 0 models, got %d", len(resp.Models))
	}
	if resp.TotalTokens != 0 {
		t.Errorf("expected total tokens 0, got %d", resp.TotalTokens)
	}
}
