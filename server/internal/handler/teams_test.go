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

type mockTeamsRepo struct {
	teams    []TeamRow
	err      error
	gotOrgID string
}

func (m *mockTeamsRepo) ListTeams(_ context.Context, orgID string) ([]TeamRow, error) {
	m.gotOrgID = orgID
	return m.teams, m.err
}

func TestTeamsHappyPath(t *testing.T) {
	mock := &mockTeamsRepo{
		teams: []TeamRow{
			{ID: "t1", Name: "Engineering", Color: "#3b82f6", Members: 48},
			{ID: "t2", Name: "Design", Color: "#8b5cf6", Members: 22},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/teams", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Teams(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp TeamsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Teams) != 2 {
		t.Fatalf("expected 2 teams, got %d", len(resp.Teams))
	}
	if resp.Teams[0].Name != "Engineering" {
		t.Errorf("expected name Engineering, got %s", resp.Teams[0].Name)
	}
	if resp.Teams[0].ID != "t1" {
		t.Errorf("expected ID t1, got %s", resp.Teams[0].ID)
	}
	if resp.Teams[0].Spend != 28420 {
		t.Errorf("expected spend 28420, got %f", resp.Teams[0].Spend)
	}
	if len(resp.Heatmap) != 6 {
		t.Errorf("expected 6 heatmap rows, got %d", len(resp.Heatmap))
	}
	if len(resp.CostVsOutput) != 2 {
		t.Errorf("expected 2 cost_vs_output entries, got %d", len(resp.CostVsOutput))
	}
}

func TestTeamsEmptyResult(t *testing.T) {
	mock := &mockTeamsRepo{
		teams: []TeamRow{},
	}

	req := httptest.NewRequest("GET", "/api/v1/teams", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Teams(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp TeamsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Teams == nil {
		t.Fatal("expected non-nil teams array, got null")
	}
	if len(resp.Teams) != 0 {
		t.Errorf("expected 0 teams, got %d", len(resp.Teams))
	}
	if len(resp.Heatmap) != 6 {
		t.Errorf("expected 6 heatmap rows even with no teams, got %d", len(resp.Heatmap))
	}
	if len(resp.CostVsOutput) != 0 {
		t.Errorf("expected 0 cost_vs_output entries, got %d", len(resp.CostVsOutput))
	}
}

func TestTeamsRepoError(t *testing.T) {
	mock := &mockTeamsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/teams", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Teams(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch teams") {
		t.Errorf("expected body to contain 'failed to fetch teams', got %q", body)
	}
}

func TestTeamsUnauthorized(t *testing.T) {
	mock := &mockTeamsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/teams", nil)
	w := httptest.NewRecorder()

	Teams(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestTeamsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/teams", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Teams(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp TeamsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Teams == nil {
		t.Fatal("expected non-nil teams array, got null")
	}
	if len(resp.Teams) != 0 {
		t.Errorf("expected 0 teams, got %d", len(resp.Teams))
	}
}
