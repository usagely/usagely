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

type mockForecastRepo struct {
	dailySpend []DailySpend
	err        error
	gotOrgID   string
}

func (m *mockForecastRepo) ListDailySpend(_ context.Context, orgID string) ([]DailySpend, error) {
	m.gotOrgID = orgID
	return m.dailySpend, m.err
}

func TestForecastHappyPath(t *testing.T) {
	mock := &mockForecastRepo{
		dailySpend: []DailySpend{
			{Date: "2025-01-01", Value: 100.0},
			{Date: "2025-01-02", Value: 105.0},
			{Date: "2025-01-03", Value: 110.0},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/forecast", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Forecast(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ForecastResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.HistoricalSpend) != 3 {
		t.Fatalf("expected 3 historical spend entries, got %d", len(resp.HistoricalSpend))
	}
	if len(resp.ProjectedSpend) != 30 {
		t.Fatalf("expected 30 projected spend entries, got %d", len(resp.ProjectedSpend))
	}
	if len(resp.Drivers) != 5 {
		t.Fatalf("expected 5 drivers, got %d", len(resp.Drivers))
	}
	if len(resp.Scenarios) != 4 {
		t.Fatalf("expected 4 scenarios, got %d", len(resp.Scenarios))
	}
	if resp.HistoricalSpend[0].Date != "2025-01-01" {
		t.Errorf("expected first date 2025-01-01, got %s", resp.HistoricalSpend[0].Date)
	}
}

func TestForecastEmptyResult(t *testing.T) {
	mock := &mockForecastRepo{
		dailySpend: []DailySpend{},
	}

	req := httptest.NewRequest("GET", "/api/v1/forecast", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Forecast(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ForecastResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.HistoricalSpend == nil {
		t.Fatal("expected non-nil historical_spend array, got null")
	}
	if len(resp.HistoricalSpend) != 0 {
		t.Errorf("expected 0 historical spend entries, got %d", len(resp.HistoricalSpend))
	}
	if len(resp.ProjectedSpend) != 0 {
		t.Errorf("expected 0 projected spend entries, got %d", len(resp.ProjectedSpend))
	}
	if len(resp.Drivers) != 0 {
		t.Errorf("expected 0 drivers, got %d", len(resp.Drivers))
	}
	if len(resp.Scenarios) != 0 {
		t.Errorf("expected 0 scenarios, got %d", len(resp.Scenarios))
	}
}

func TestForecastRepoError(t *testing.T) {
	mock := &mockForecastRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/forecast", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Forecast(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch daily spend") {
		t.Errorf("expected body to contain 'failed to fetch daily spend', got %q", body)
	}
}

func TestForecastUnauthorized(t *testing.T) {
	mock := &mockForecastRepo{}

	req := httptest.NewRequest("GET", "/api/v1/forecast", nil)
	w := httptest.NewRecorder()

	Forecast(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestForecastNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/forecast", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Forecast(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ForecastResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.HistoricalSpend == nil {
		t.Fatal("expected non-nil historical_spend array, got null")
	}
	if len(resp.HistoricalSpend) != 0 {
		t.Errorf("expected 0 historical spend entries, got %d", len(resp.HistoricalSpend))
	}
}
