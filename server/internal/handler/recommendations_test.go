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

type mockRecommendationsRepo struct {
	recommendations []EERecommendation
	err             error
	gotOrgID        string
}

func (m *mockRecommendationsRepo) ListRecommendations(_ context.Context, orgID string) ([]EERecommendation, error) {
	m.gotOrgID = orgID
	return m.recommendations, m.err
}

func TestRecommendationsHappyPath(t *testing.T) {
	mock := &mockRecommendationsRepo{
		recommendations: []EERecommendation{
			{ID: "1", Title: "Downgrade idle seats", Reason: "30 seats unused", SavingsUSD: 500.0, Confidence: 0.95, Scope: "team-a", Effort: "low"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/recommendations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Recommendations(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp RecommendationsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Recommendations) != 1 {
		t.Fatalf("expected 1 recommendation, got %d", len(resp.Recommendations))
	}
	if resp.Recommendations[0].Title != "Downgrade idle seats" {
		t.Errorf("expected title 'Downgrade idle seats', got %s", resp.Recommendations[0].Title)
	}
	if resp.Recommendations[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.Recommendations[0].ID)
	}
}

func TestRecommendationsEmptyResult(t *testing.T) {
	mock := &mockRecommendationsRepo{
		recommendations: []EERecommendation{},
	}

	req := httptest.NewRequest("GET", "/api/v1/recommendations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Recommendations(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp RecommendationsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Recommendations == nil {
		t.Fatal("expected non-nil recommendations array, got null")
	}
	if len(resp.Recommendations) != 0 {
		t.Errorf("expected 0 recommendations, got %d", len(resp.Recommendations))
	}
}

func TestRecommendationsRepoError(t *testing.T) {
	mock := &mockRecommendationsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/recommendations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Recommendations(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch recommendations") {
		t.Errorf("expected body to contain 'failed to fetch recommendations', got %q", body)
	}
}

func TestRecommendationsUnauthorized(t *testing.T) {
	mock := &mockRecommendationsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/recommendations", nil)
	w := httptest.NewRecorder()

	Recommendations(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestRecommendationsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/recommendations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Recommendations(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp RecommendationsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Recommendations == nil {
		t.Fatal("expected non-nil recommendations array, got null")
	}
	if len(resp.Recommendations) != 0 {
		t.Errorf("expected 0 recommendations, got %d", len(resp.Recommendations))
	}
}
