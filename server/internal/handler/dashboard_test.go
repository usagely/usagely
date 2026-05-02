package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type mockDashboardRepo struct {
	dailySpend         []DailySpendRow
	dailySpendErr      error
	activeTools        int
	activeToolsErr     error
	activeUsers        int
	activeUsersErr     error
	anomalies          []Anomaly
	anomaliesErr       error
	recommendations    []Recommendation
	recommendationsErr error
	teamsSpend         []DashboardTeamSpendRow
	teamsSpendErr      error
	gotOrgID           string
}

func (m *mockDashboardRepo) GetDailySpend(_ context.Context, orgID string) ([]DailySpendRow, error) {
	m.gotOrgID = orgID
	return m.dailySpend, m.dailySpendErr
}

func (m *mockDashboardRepo) GetActiveToolsCount(_ context.Context, orgID string) (int, error) {
	m.gotOrgID = orgID
	return m.activeTools, m.activeToolsErr
}

func (m *mockDashboardRepo) GetActiveUsersCount(_ context.Context, orgID string) (int, error) {
	m.gotOrgID = orgID
	return m.activeUsers, m.activeUsersErr
}

func (m *mockDashboardRepo) ListAnomalies(_ context.Context, orgID string) ([]Anomaly, error) {
	m.gotOrgID = orgID
	return m.anomalies, m.anomaliesErr
}

func (m *mockDashboardRepo) ListRecommendations(_ context.Context, orgID string) ([]Recommendation, error) {
	m.gotOrgID = orgID
	return m.recommendations, m.recommendationsErr
}

func (m *mockDashboardRepo) ListTeamsSpend(_ context.Context, orgID string) ([]DashboardTeamSpendRow, error) {
	m.gotOrgID = orgID
	return m.teamsSpend, m.teamsSpendErr
}

func TestDashboardHappyPath(t *testing.T) {
	now := time.Now()
	mock := &mockDashboardRepo{
		dailySpend: []DailySpendRow{
			{Date: time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC), Value: 3000},
			{Date: time.Date(now.Year(), now.Month(), 2, 0, 0, 0, 0, time.UTC), Value: 2500},
		},
		activeTools: 34,
		activeUsers: 187,
		anomalies: []Anomaly{
			{ID: "a1", Title: "Spike", Body: "Cost spike detected", Severity: "danger", Team: "Engineering", Owner: "Alice"},
		},
		recommendations: []Recommendation{
			{ID: "r1", Title: "Downgrade plan", Reason: "Underused capacity", Savings: 8120, Confidence: 0.82, Scope: "API"},
		},
		teamsSpend: []DashboardTeamSpendRow{
			{ID: "t1", Name: "Engineering", Members: 48, Spend: 12420, PerUser: 259},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Dashboard(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp DashboardResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.MTDSpend != 5500 {
		t.Errorf("expected MTDSpend 5500, got %f", resp.MTDSpend)
	}
	if resp.ActiveTools != 34 {
		t.Errorf("expected ActiveTools 34, got %d", resp.ActiveTools)
	}
	if resp.ActiveUsers != 187 {
		t.Errorf("expected ActiveUsers 187, got %d", resp.ActiveUsers)
	}
	if len(resp.DailySpend) != 2 {
		t.Errorf("expected 2 daily spend entries, got %d", len(resp.DailySpend))
	}
	if len(resp.Anomalies) != 1 {
		t.Errorf("expected 1 anomaly, got %d", len(resp.Anomalies))
	}
	if resp.Anomalies[0].ID != "a1" {
		t.Errorf("expected anomaly ID a1, got %s", resp.Anomalies[0].ID)
	}
	if len(resp.Recommendations) != 1 {
		t.Errorf("expected 1 recommendation, got %d", len(resp.Recommendations))
	}
	if resp.Recommendations[0].Savings != 8120 {
		t.Errorf("expected savings 8120, got %f", resp.Recommendations[0].Savings)
	}
	if len(resp.TeamsSpend) != 1 {
		t.Errorf("expected 1 team spend, got %d", len(resp.TeamsSpend))
	}
	if resp.TeamsSpend[0].Delta != 0.18 {
		t.Errorf("expected first team delta 0.18, got %f", resp.TeamsSpend[0].Delta)
	}
	if resp.TeamsSpend[0].Name != "Engineering" {
		t.Errorf("expected team name Engineering, got %s", resp.TeamsSpend[0].Name)
	}
	if resp.ProjectedDelta != 0.214 {
		t.Errorf("expected ProjectedDelta 0.214, got %f", resp.ProjectedDelta)
	}
	if resp.ToolsDelta != 0.12 {
		t.Errorf("expected ToolsDelta 0.12, got %f", resp.ToolsDelta)
	}
	if resp.UsersDelta != 0.03 {
		t.Errorf("expected UsersDelta 0.03, got %f", resp.UsersDelta)
	}
	if len(resp.SpendByCategory) != 5 {
		t.Errorf("expected 5 spend categories, got %d", len(resp.SpendByCategory))
	}
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected org_id test-org, got %s", mock.gotOrgID)
	}
	expectedProjected := 5500.0 * (30.0 / float64(now.Day()))
	if resp.ProjectedMonth != expectedProjected {
		t.Errorf("expected ProjectedMonth %f, got %f", expectedProjected, resp.ProjectedMonth)
	}
}

func TestDashboardRepoErrors(t *testing.T) {
	tests := []struct {
		name    string
		mock    *mockDashboardRepo
		wantMsg string
	}{
		{
			name:    "daily spend error",
			mock:    &mockDashboardRepo{dailySpendErr: errors.New("db error")},
			wantMsg: "failed to fetch daily spend",
		},
		{
			name: "active tools error",
			mock: &mockDashboardRepo{
				dailySpend:     []DailySpendRow{},
				activeToolsErr: errors.New("db error"),
			},
			wantMsg: "failed to fetch active tools",
		},
		{
			name: "active users error",
			mock: &mockDashboardRepo{
				dailySpend:     []DailySpendRow{},
				activeUsersErr: errors.New("db error"),
			},
			wantMsg: "failed to fetch active users",
		},
		{
			name: "anomalies error",
			mock: &mockDashboardRepo{
				dailySpend:   []DailySpendRow{},
				anomaliesErr: errors.New("db error"),
			},
			wantMsg: "failed to fetch anomalies",
		},
		{
			name: "recommendations error",
			mock: &mockDashboardRepo{
				dailySpend:         []DailySpendRow{},
				recommendationsErr: errors.New("db error"),
			},
			wantMsg: "failed to fetch recommendations",
		},
		{
			name: "teams spend error",
			mock: &mockDashboardRepo{
				dailySpend:    []DailySpendRow{},
				teamsSpendErr: errors.New("db error"),
			},
			wantMsg: "failed to fetch teams spend",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
			req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
			w := httptest.NewRecorder()

			Dashboard(tt.mock)(w, req)

			if w.Code != http.StatusInternalServerError {
				t.Fatalf("expected 500, got %d", w.Code)
			}
			body := w.Body.String()
			if !strings.Contains(body, tt.wantMsg) {
				t.Errorf("expected body to contain %q, got %q", tt.wantMsg, body)
			}
		})
	}
}

func TestDashboardEmptyResults(t *testing.T) {
	mock := &mockDashboardRepo{
		dailySpend:      []DailySpendRow{},
		anomalies:       []Anomaly{},
		recommendations: []Recommendation{},
		teamsSpend:      []DashboardTeamSpendRow{},
	}

	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Dashboard(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp DashboardResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.MTDSpend != 0 {
		t.Errorf("expected MTDSpend 0, got %f", resp.MTDSpend)
	}
	if resp.ActiveTools != 0 {
		t.Errorf("expected ActiveTools 0, got %d", resp.ActiveTools)
	}
	if resp.ActiveUsers != 0 {
		t.Errorf("expected ActiveUsers 0, got %d", resp.ActiveUsers)
	}
	if len(resp.DailySpend) != 0 {
		t.Errorf("expected 0 daily spend entries, got %d", len(resp.DailySpend))
	}
	if resp.Anomalies == nil {
		t.Fatal("expected non-nil anomalies, got nil")
	}
	if len(resp.Anomalies) != 0 {
		t.Errorf("expected 0 anomalies, got %d", len(resp.Anomalies))
	}
	if resp.Recommendations == nil {
		t.Fatal("expected non-nil recommendations, got nil")
	}
	if len(resp.Recommendations) != 0 {
		t.Errorf("expected 0 recommendations, got %d", len(resp.Recommendations))
	}
	if resp.TeamsSpend == nil {
		t.Fatal("expected non-nil teams spend, got nil")
	}
	if len(resp.TeamsSpend) != 0 {
		t.Errorf("expected 0 teams spend, got %d", len(resp.TeamsSpend))
	}
	if len(resp.SpendByCategory) != 5 {
		t.Errorf("expected 5 spend categories, got %d", len(resp.SpendByCategory))
	}
}

func TestDashboardNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	ctx := context.WithValue(req.Context(), "org_id", "test-org")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	Dashboard(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	var resp DashboardResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.MTDSpend != 0 {
		t.Errorf("expected MTDSpend 0, got %f", resp.MTDSpend)
	}
	if len(resp.DailySpend) != 0 {
		t.Errorf("expected empty DailySpend, got %d items", len(resp.DailySpend))
	}
	if resp.Anomalies == nil {
		t.Fatal("expected non-nil anomalies, got nil")
	}
	if resp.Recommendations == nil {
		t.Fatal("expected non-nil recommendations, got nil")
	}
	if resp.TeamsSpend == nil {
		t.Fatal("expected non-nil teams spend, got nil")
	}
}

func TestDashboardUnauthorized(t *testing.T) {
	mock := &mockDashboardRepo{}

	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	w := httptest.NewRecorder()

	Dashboard(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}
}

func TestDashboardResponseStructure(t *testing.T) {
	tests := []struct {
		name string
		test func(t *testing.T)
	}{
		{
			name: "DailySpend has date and value",
			test: func(t *testing.T) {
				d := DailySpend{Date: "2026-04-19", Value: 2400}
				if d.Date != "2026-04-19" {
					t.Error("DailySpend.Date not set correctly")
				}
				if d.Value != 2400 {
					t.Error("DailySpend.Value not set correctly")
				}
			},
		},
		{
			name: "SpendByCategory has name, value, color",
			test: func(t *testing.T) {
				s := SpendByCategory{Name: "LLM APIs", Value: 90220, Color: "var(--chart-1)"}
				if s.Name != "LLM APIs" {
					t.Error("SpendByCategory.Name not set correctly")
				}
				if s.Value != 90220 {
					t.Error("SpendByCategory.Value not set correctly")
				}
				if s.Color != "var(--chart-1)" {
					t.Error("SpendByCategory.Color not set correctly")
				}
			},
		},
		{
			name: "Anomaly has all required fields",
			test: func(t *testing.T) {
				a := Anomaly{
					ID:       "a1",
					Title:    "Test anomaly",
					Body:     "Test body",
					Severity: "danger",
					Team:     "Engineering",
					Owner:    "John Doe",
				}
				if a.ID != "a1" {
					t.Error("Anomaly.ID not set correctly")
				}
				if a.Severity != "danger" {
					t.Error("Anomaly.Severity not set correctly")
				}
			},
		},
		{
			name: "Recommendation has all required fields",
			test: func(t *testing.T) {
				r := Recommendation{
					ID:         "r1",
					Title:      "Test rec",
					Reason:     "Test reason",
					Savings:    8120,
					Confidence: 0.82,
					Scope:      "API",
				}
				if r.Savings != 8120 {
					t.Error("Recommendation.Savings not set correctly")
				}
				if r.Confidence != 0.82 {
					t.Error("Recommendation.Confidence not set correctly")
				}
			},
		},
		{
			name: "TeamSpend has all required fields",
			test: func(t *testing.T) {
				ts := TeamSpend{
					ID:      "eng",
					Name:    "Engineering",
					Members: 48,
					Spend:   12420,
					PerUser: 259,
					Delta:   0.18,
				}
				if ts.Members != 48 {
					t.Error("TeamSpend.Members not set correctly")
				}
				if ts.Delta != 0.18 {
					t.Error("TeamSpend.Delta not set correctly")
				}
			},
		},
		{
			name: "DashboardResponse has all required fields",
			test: func(t *testing.T) {
				resp := &DashboardResponse{
					MTDSpend:       94750,
					ProjectedMonth: 149605,
					ActiveTools:    34,
					ActiveUsers:    187,
					MTDDelta:       0.18,
				}
				if resp.MTDSpend != 94750 {
					t.Error("DashboardResponse.MTDSpend not set correctly")
				}
				if resp.ActiveTools != 34 {
					t.Error("DashboardResponse.ActiveTools not set correctly")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, tt.test)
	}
}

func TestDashboardJSONMarshaling(t *testing.T) {
	resp := &DashboardResponse{
		MTDSpend:        94750,
		ProjectedMonth:  149605,
		ActiveTools:     34,
		ActiveUsers:     187,
		MTDDelta:        0.18,
		ProjectedDelta:  0.214,
		ToolsDelta:      0.12,
		UsersDelta:      0.03,
		DailySpend:      []DailySpend{{Date: "2026-04-19", Value: 2400}},
		SpendByCategory: []SpendByCategory{{Name: "LLM APIs", Value: 90220, Color: "var(--chart-1)"}},
		Anomalies:       []Anomaly{},
		Recommendations: []Recommendation{},
		TeamsSpend:      []TeamSpend{},
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("failed to marshal response: %v", err)
	}

	var decoded DashboardResponse
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if decoded.MTDSpend != resp.MTDSpend {
		t.Errorf("MTDSpend mismatch: %f != %f", decoded.MTDSpend, resp.MTDSpend)
	}
	if decoded.ActiveTools != resp.ActiveTools {
		t.Errorf("ActiveTools mismatch: %d != %d", decoded.ActiveTools, resp.ActiveTools)
	}
	if len(decoded.DailySpend) != 1 {
		t.Errorf("DailySpend length mismatch: %d != 1", len(decoded.DailySpend))
	}
}

func TestDashboardMTDDelta(t *testing.T) {
	now := time.Now()
	prevMonth := now.Month() - 1
	prevYear := now.Year()
	if prevMonth == 0 {
		prevMonth = 12
		prevYear--
	}

	mock := &mockDashboardRepo{
		dailySpend: []DailySpendRow{
			{Date: time.Date(prevYear, prevMonth, 15, 0, 0, 0, 0, time.UTC), Value: 4000},
			{Date: time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC), Value: 5000},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Dashboard(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp DashboardResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.MTDSpend != 5000 {
		t.Errorf("expected MTDSpend 5000, got %f", resp.MTDSpend)
	}
	expectedDelta := (5000.0 - 4000.0) / 4000.0
	if resp.MTDDelta != expectedDelta {
		t.Errorf("expected MTDDelta %f, got %f", expectedDelta, resp.MTDDelta)
	}
}

func TestNewPgxDashboardRepoNil(t *testing.T) {
	repo := NewPgxDashboardRepo(nil)
	if repo != nil {
		t.Error("expected nil repo when pool is nil")
	}
}

func TestDashboardTeamsDeltaAssignment(t *testing.T) {
	mock := &mockDashboardRepo{
		dailySpend: []DailySpendRow{},
		teamsSpend: []DashboardTeamSpendRow{
			{ID: "t1", Name: "Alpha", Members: 10, Spend: 5000, PerUser: 500},
			{ID: "t2", Name: "Beta", Members: 5, Spend: 3000, PerUser: 600},
			{ID: "t3", Name: "Gamma", Members: 8, Spend: 2000, PerUser: 250},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Dashboard(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp DashboardResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.TeamsSpend) != 3 {
		t.Fatalf("expected 3 teams, got %d", len(resp.TeamsSpend))
	}

	expectedDeltas := []float64{0.18, 0.09, 0.41}
	for i, expected := range expectedDeltas {
		if resp.TeamsSpend[i].Delta != expected {
			t.Errorf("team %d: expected delta %f, got %f", i, expected, resp.TeamsSpend[i].Delta)
		}
	}
}
