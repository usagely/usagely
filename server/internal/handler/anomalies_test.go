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

type mockAnomaliesRepo struct {
	anomalies []AnomalyItem
	err       error
	gotOrgID  string
}

func (m *mockAnomaliesRepo) ListAnomalies(_ context.Context, orgID string) ([]AnomalyItem, error) {
	m.gotOrgID = orgID
	return m.anomalies, m.err
}

func TestAnomaliesHappyPath(t *testing.T) {
	mock := &mockAnomaliesRepo{
		anomalies: []AnomalyItem{
			{ID: "a1", Title: "GPU spike", Body: "Unexpected GPU usage", Severity: "critical", TeamName: "ML", OwnerName: "Alice", DetectedAt: "2025-01-01T00:00:00Z"},
			{ID: "a2", Title: "Token surge", Body: "Token usage up 40%", Severity: "warn", TeamName: "Eng", OwnerName: "Bob", DetectedAt: "2025-01-02T00:00:00Z"},
			{ID: "a3", Title: "Idle seats", Body: "10 seats unused", Severity: "info", TeamName: "Sales", OwnerName: "Carol", DetectedAt: "2025-01-03T00:00:00Z"},
			{ID: "a4", Title: "API errors", Body: "Error rate up", Severity: "critical", TeamName: "Platform", OwnerName: "Dave", DetectedAt: "2025-01-04T00:00:00Z"},
			{ID: "a5", Title: "Cost anomaly", Body: "Spend doubled", Severity: "warn", TeamName: "Data", OwnerName: "Eve", DetectedAt: "2025-01-05T00:00:00Z"},
			{ID: "a6", Title: "New model cost", Body: "GPT-5 costs high", Severity: "info", TeamName: "Research", OwnerName: "Frank", DetectedAt: "2025-01-06T00:00:00Z"},
			{ID: "a7", Title: "Batch job spike", Body: "Batch processing up", Severity: "warn", TeamName: "Ops", OwnerName: "Grace", DetectedAt: "2025-01-07T00:00:00Z"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Anomalies(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp AnomaliesResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Anomalies) != 7 {
		t.Fatalf("expected 7 anomalies (no extension), got %d", len(resp.Anomalies))
	}
	if resp.Anomalies[0].Title != "GPU spike" {
		t.Errorf("expected title 'GPU spike', got %s", resp.Anomalies[0].Title)
	}
	if resp.Anomalies[0].ID != "a1" {
		t.Errorf("expected ID a1, got %s", resp.Anomalies[0].ID)
	}
}

func TestAnomaliesExtendedFallback(t *testing.T) {
	mock := &mockAnomaliesRepo{
		anomalies: []AnomalyItem{
			{ID: "a1", Title: "GPU spike", Body: "Unexpected GPU usage", Severity: "critical", TeamName: "ML", OwnerName: "Alice", DetectedAt: "2025-01-01T00:00:00Z"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Anomalies(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp AnomaliesResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Anomalies) != 4 {
		t.Fatalf("expected 4 anomalies (1 db + 3 extended), got %d", len(resp.Anomalies))
	}
	if resp.Anomalies[1].ID != "a5" {
		t.Errorf("expected extended anomaly ID a5, got %s", resp.Anomalies[1].ID)
	}
}

func TestAnomaliesEmptyResult(t *testing.T) {
	mock := &mockAnomaliesRepo{
		anomalies: []AnomalyItem{},
	}

	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Anomalies(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp AnomaliesResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Anomalies == nil {
		t.Fatal("expected non-nil anomalies array, got null")
	}
	if len(resp.Anomalies) != 3 {
		t.Fatalf("expected 3 extended anomalies for empty DB, got %d", len(resp.Anomalies))
	}
}

func TestAnomaliesRepoError(t *testing.T) {
	mock := &mockAnomaliesRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Anomalies(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch anomalies") {
		t.Errorf("expected body to contain 'failed to fetch anomalies', got %q", body)
	}
}

func TestAnomaliesUnauthorized(t *testing.T) {
	mock := &mockAnomaliesRepo{}

	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	w := httptest.NewRecorder()

	Anomalies(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestAnomaliesNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/anomalies", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Anomalies(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp AnomaliesResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Anomalies == nil {
		t.Fatal("expected non-nil anomalies array, got null")
	}
	if len(resp.Anomalies) != 0 {
		t.Errorf("expected 0 anomalies, got %d", len(resp.Anomalies))
	}
}
