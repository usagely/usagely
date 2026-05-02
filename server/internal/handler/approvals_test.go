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

type mockApprovalsRepo struct {
	approvals []ApprovalItem
	err       error
	gotOrgID  string
}

func (m *mockApprovalsRepo) ListApprovals(_ context.Context, orgID string) ([]ApprovalItem, error) {
	m.gotOrgID = orgID
	return m.approvals, m.err
}

func TestApprovalsHappyPath(t *testing.T) {
	mock := &mockApprovalsRepo{
		approvals: []ApprovalItem{
			{ID: "1", RequesterName: "Alice", ToolName: "ChatGPT", Reason: "Need for research", CostEstUSD: 50.0, Status: "pending", CreatedAt: "2025-01-15T10:30:00Z"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Approvals(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ApprovalsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Approvals) != 1 {
		t.Fatalf("expected 1 approval, got %d", len(resp.Approvals))
	}
	if resp.Approvals[0].RequesterName != "Alice" {
		t.Errorf("expected requester Alice, got %s", resp.Approvals[0].RequesterName)
	}
	if resp.Approvals[0].ID != "1" {
		t.Errorf("expected ID 1, got %s", resp.Approvals[0].ID)
	}
}

func TestApprovalsEmptyResult(t *testing.T) {
	mock := &mockApprovalsRepo{
		approvals: []ApprovalItem{},
	}

	req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Approvals(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ApprovalsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Approvals == nil {
		t.Fatal("expected non-nil approvals array, got null")
	}
	if len(resp.Approvals) != 0 {
		t.Errorf("expected 0 approvals, got %d", len(resp.Approvals))
	}
}

func TestApprovalsRepoError(t *testing.T) {
	mock := &mockApprovalsRepo{
		err: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Approvals(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch approvals") {
		t.Errorf("expected body to contain 'failed to fetch approvals', got %q", body)
	}
}

func TestApprovalsUnauthorized(t *testing.T) {
	mock := &mockApprovalsRepo{}

	req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
	w := httptest.NewRecorder()

	Approvals(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestApprovalsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Approvals(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ApprovalsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Approvals == nil {
		t.Fatal("expected non-nil approvals array, got null")
	}
	if len(resp.Approvals) != 0 {
		t.Errorf("expected 0 approvals, got %d", len(resp.Approvals))
	}
}
