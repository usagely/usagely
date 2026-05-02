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

type mockShadowRepo struct {
	shadowTools []ShadowTool
	err         error
	gotOrgID    string
}

func (m *mockShadowRepo) ListShadowTools(_ context.Context, orgID string) ([]ShadowTool, error) {
	m.gotOrgID = orgID
	return m.shadowTools, m.err
}

func TestShadowHappyPath(t *testing.T) {
	mock := &mockShadowRepo{
		shadowTools: []ShadowTool{
			{ID: "1", ToolName: "Hugging Chat", UsersCount: 12, Source: "egress", FirstSeen: "2025-01-10", MonthlyUSD: 320.0, Risk: "high"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/shadow", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Shadow(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ShadowResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.ShadowTools) != 1 {
		t.Fatalf("expected 1 shadow tool, got %d", len(resp.ShadowTools))
	}
	if resp.ShadowTools[0].ToolName != "Hugging Chat" {
		t.Errorf("expected tool name 'Hugging Chat', got %s", resp.ShadowTools[0].ToolName)
	}
	if resp.ShadowTools[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.ShadowTools[0].ID)
	}
}

func TestShadowEmptyResult(t *testing.T) {
	mock := &mockShadowRepo{
		shadowTools: []ShadowTool{},
	}

	req := httptest.NewRequest("GET", "/api/v1/shadow", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Shadow(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ShadowResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.ShadowTools == nil {
		t.Fatal("expected non-nil shadow_tools array, got null")
	}
	if len(resp.ShadowTools) != 0 {
		t.Errorf("expected 0 shadow tools, got %d", len(resp.ShadowTools))
	}
}

func TestShadowRepoError(t *testing.T) {
	mock := &mockShadowRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/shadow", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Shadow(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch shadow tools") {
		t.Errorf("expected body to contain 'failed to fetch shadow tools', got %q", body)
	}
}

func TestShadowUnauthorized(t *testing.T) {
	mock := &mockShadowRepo{}

	req := httptest.NewRequest("GET", "/api/v1/shadow", nil)
	w := httptest.NewRecorder()

	Shadow(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestShadowNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/shadow", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Shadow(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ShadowResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.ShadowTools == nil {
		t.Fatal("expected non-nil shadow_tools array, got null")
	}
	if len(resp.ShadowTools) != 0 {
		t.Errorf("expected 0 shadow tools, got %d", len(resp.ShadowTools))
	}
}
