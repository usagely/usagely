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

type mockBudgetsRepo struct {
	budgets  []Budget
	err      error
	gotOrgID string
}

func (m *mockBudgetsRepo) ListBudgets(_ context.Context, orgID string) ([]Budget, error) {
	m.gotOrgID = orgID
	return m.budgets, m.err
}

func TestBudgetsHappyPath(t *testing.T) {
	mock := &mockBudgetsRepo{
		budgets: []Budget{
			{ID: "1", Scope: "team-a", Period: "monthly", LimitUSD: 1000.0, UsedUSD: 500.0, AlertPct: 80},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/budgets", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Budgets(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp BudgetsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Budgets) != 1 {
		t.Fatalf("expected 1 budget, got %d", len(resp.Budgets))
	}
	if resp.Budgets[0].Scope != "team-a" {
		t.Errorf("expected scope team-a, got %s", resp.Budgets[0].Scope)
	}
	if resp.Budgets[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.Budgets[0].ID)
	}
}

func TestBudgetsEmptyResult(t *testing.T) {
	mock := &mockBudgetsRepo{
		budgets: []Budget{},
	}

	req := httptest.NewRequest("GET", "/api/v1/budgets", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Budgets(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp BudgetsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Budgets == nil {
		t.Fatal("expected non-nil budgets array, got null")
	}
	if len(resp.Budgets) != 0 {
		t.Errorf("expected 0 budgets, got %d", len(resp.Budgets))
	}
}

func TestBudgetsRepoError(t *testing.T) {
	mock := &mockBudgetsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/budgets", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Budgets(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch budgets") {
		t.Errorf("expected body to contain 'failed to fetch budgets', got %q", body)
	}
}

func TestBudgetsUnauthorized(t *testing.T) {
	mock := &mockBudgetsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/budgets", nil)
	w := httptest.NewRecorder()

	Budgets(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestBudgetsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/budgets", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Budgets(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp BudgetsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Budgets == nil {
		t.Fatal("expected non-nil budgets array, got null")
	}
	if len(resp.Budgets) != 0 {
		t.Errorf("expected 0 budgets, got %d", len(resp.Budgets))
	}
}
