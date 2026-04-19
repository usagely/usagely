package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestDashboardNoPool(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	ctx := context.WithValue(req.Context(), "org_id", "test-org")
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	handler := Dashboard(nil)
	handler(w, req)

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
}

func TestDashboardNoOrgID(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/dashboard", nil)
	w := httptest.NewRecorder()

	handler := Dashboard(nil)
	handler(w, req)

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
