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

type mockToolsRepo struct {
	tools       []Tool
	err         error
	gotOrgID    string
	gotCategory string
}

func (m *mockToolsRepo) ListTools(_ context.Context, orgID string, category string) ([]Tool, error) {
	m.gotOrgID = orgID
	m.gotCategory = category
	return m.tools, m.err
}

func TestToolsHappyPath(t *testing.T) {
	seats := 10
	mock := &mockToolsRepo{
		tools: []Tool{
			{ID: "1", Name: "ChatGPT", Vendor: "OpenAI", Category: "LLM", Status: "active", Seats: &seats, Provisioning: "manual", Spend: 100.0, Prev: 90.0},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/tools", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Tools(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ToolsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Tools) != 1 {
		t.Fatalf("expected 1 tool, got %d", len(resp.Tools))
	}
	if resp.Tools[0].Name != "ChatGPT" {
		t.Errorf("expected name ChatGPT, got %s", resp.Tools[0].Name)
	}
	if resp.Tools[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.Tools[0].ID)
	}
}

func TestToolsEmptyResult(t *testing.T) {
	mock := &mockToolsRepo{
		tools: []Tool{},
	}

	req := httptest.NewRequest("GET", "/api/v1/tools", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Tools(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ToolsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Tools == nil {
		t.Fatal("expected non-nil tools array, got null")
	}
	if len(resp.Tools) != 0 {
		t.Errorf("expected 0 tools, got %d", len(resp.Tools))
	}
}

func TestToolsRepoError(t *testing.T) {
	mock := &mockToolsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/tools", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Tools(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch tools") {
		t.Errorf("expected body to contain 'failed to fetch tools', got %q", body)
	}
}

func TestToolsUnauthorized(t *testing.T) {
	mock := &mockToolsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/tools", nil)
	w := httptest.NewRecorder()

	Tools(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestToolsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/tools", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Tools(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ToolsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Tools == nil {
		t.Fatal("expected non-nil tools array, got null")
	}
	if len(resp.Tools) != 0 {
		t.Errorf("expected 0 tools, got %d", len(resp.Tools))
	}
}

func TestToolsCategoryForwarded(t *testing.T) {
	mock := &mockToolsRepo{
		tools: []Tool{},
	}

	req := httptest.NewRequest("GET", "/api/v1/tools?category=LLM", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Tools(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if mock.gotOrgID != "test-org" {
		t.Errorf("expected orgID 'test-org', got %q", mock.gotOrgID)
	}
	if mock.gotCategory != "LLM" {
		t.Errorf("expected category 'LLM', got %q", mock.gotCategory)
	}
}
