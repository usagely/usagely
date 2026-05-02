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

type mockPeopleRepo struct {
	users      []User
	usersErr   error
	profile    *User
	profileErr error
	gotOrgID   string
	gotTeam    string
	gotEmail   string
}

func (m *mockPeopleRepo) ListPeople(_ context.Context, orgID string, team string) ([]User, error) {
	m.gotOrgID = orgID
	m.gotTeam = team
	return m.users, m.usersErr
}

func (m *mockPeopleRepo) GetProfile(_ context.Context, orgID string, email string) (*User, error) {
	m.gotOrgID = orgID
	m.gotEmail = email
	return m.profile, m.profileErr
}

// ---------------------------------------------------------------------------
// People handler
// ---------------------------------------------------------------------------

func TestPeopleHappyPath(t *testing.T) {
	mock := &mockPeopleRepo{
		users: []User{
			{ID: "u1", Name: "Alice", Email: "alice@acme.co", Team: "Engineering", Role: "engineer", Tokens: 1000, Cost: 50.0, PRs: 10, TopTool: "Cursor"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	People(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp PeopleResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Users) != 1 {
		t.Fatalf("expected 1 user, got %d", len(resp.Users))
	}
	if resp.Users[0].Name != "Alice" {
		t.Errorf("expected name Alice, got %s", resp.Users[0].Name)
	}
	if resp.Users[0].ID != "u1" {
		t.Errorf("expected ID u1, got %s", resp.Users[0].ID)
	}
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected org_id test-org, got %s", mock.gotOrgID)
	}
}

func TestPeopleEmptyResult(t *testing.T) {
	mock := &mockPeopleRepo{
		users: []User{},
	}

	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	People(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp PeopleResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Users == nil {
		t.Fatal("expected non-nil users array, got null")
	}
	if len(resp.Users) != 0 {
		t.Errorf("expected 0 users, got %d", len(resp.Users))
	}
}

func TestPeopleRepoError(t *testing.T) {
	mock := &mockPeopleRepo{
		usersErr: errors.New("connection refused"),
	}

	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	People(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "failed to fetch users") {
		t.Errorf("expected body to contain 'failed to fetch users', got %q", body)
	}
}

func TestPeopleUnauthorized(t *testing.T) {
	mock := &mockPeopleRepo{}

	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	w := httptest.NewRecorder()

	People(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestPeopleNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	People(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp PeopleResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Users == nil {
		t.Fatal("expected non-nil users array, got null")
	}
	if len(resp.Users) != 0 {
		t.Errorf("expected 0 users, got %d", len(resp.Users))
	}
}

func TestPeopleCrossTenant(t *testing.T) {
	mock := &mockPeopleRepo{
		users: []User{
			{ID: "u1", Name: "Alice", Email: "alice@acme.co", Team: "Engineering"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/people", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "org-A"))
	w := httptest.NewRecorder()

	People(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if mock.gotOrgID != "org-A" {
		t.Errorf("expected repo called with org_id 'org-A', got %q", mock.gotOrgID)
	}

	var resp PeopleResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if len(resp.Users) != 1 {
		t.Fatalf("expected 1 user from mock, got %d", len(resp.Users))
	}
	if resp.Users[0].Name != "Alice" {
		t.Errorf("expected name Alice, got %s", resp.Users[0].Name)
	}
}

// ---------------------------------------------------------------------------
// Profile handler
// ---------------------------------------------------------------------------

func TestProfileHappyPath(t *testing.T) {
	mock := &mockPeopleRepo{
		profile: &User{ID: "u1", Name: "Alice", Email: "alice@acme.co", Team: "Engineering", Role: "engineer", Tokens: 1000, Cost: 50.0, PRs: 10, TopTool: "Cursor"},
	}

	req := httptest.NewRequest("GET", "/api/v1/people/alice@acme.co", nil)
	req.SetPathValue("email", "alice@acme.co")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Profile(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ProfileResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Name != "Alice" {
		t.Errorf("expected name Alice, got %s", resp.Name)
	}
	if resp.Email != "alice@acme.co" {
		t.Errorf("expected email alice@acme.co, got %s", resp.Email)
	}
	if resp.Team != "Engineering" {
		t.Errorf("expected team Engineering, got %s", resp.Team)
	}
	if len(resp.DailyActivity) != 30 {
		t.Errorf("expected 30 daily activity entries, got %d", len(resp.DailyActivity))
	}
	if len(resp.HourlyPattern) != 7 {
		t.Errorf("expected 7 hourly pattern entries, got %d", len(resp.HourlyPattern))
	}
	if len(resp.Models) != 4 {
		t.Errorf("expected 4 models, got %d", len(resp.Models))
	}
	if len(resp.Tools) != 6 {
		t.Errorf("expected 6 tools, got %d", len(resp.Tools))
	}
	if len(resp.Sessions) != 6 {
		t.Errorf("expected 6 sessions, got %d", len(resp.Sessions))
	}
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected org_id test-org, got %s", mock.gotOrgID)
	}
	if mock.gotEmail != "alice@acme.co" {
		t.Errorf("expected email alice@acme.co, got %s", mock.gotEmail)
	}
}

func TestProfileEmptyEmail(t *testing.T) {
	mock := &mockPeopleRepo{}

	req := httptest.NewRequest("GET", "/api/v1/people/", nil)
	w := httptest.NewRecorder()

	Profile(mock)(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "email required") {
		t.Errorf("expected body to contain 'email required', got %q", body)
	}
}

func TestProfileRepoError(t *testing.T) {
	mock := &mockPeopleRepo{
		profileErr: errors.New("not found"),
	}

	req := httptest.NewRequest("GET", "/api/v1/people/alice@acme.co", nil)
	req.SetPathValue("email", "alice@acme.co")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Profile(mock)(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}

	body := w.Body.String()
	if !strings.Contains(body, "user not found") {
		t.Errorf("expected body to contain 'user not found', got %q", body)
	}
}

func TestProfileUnauthorized(t *testing.T) {
	mock := &mockPeopleRepo{}

	req := httptest.NewRequest("GET", "/api/v1/people/alice@acme.co", nil)
	req.SetPathValue("email", "alice@acme.co")
	w := httptest.NewRecorder()

	Profile(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestProfileNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/people/alice@acme.co", nil)
	req.SetPathValue("email", "alice@acme.co")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	Profile(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ProfileResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.DailyActivity == nil {
		t.Fatal("expected non-nil daily_activity, got nil")
	}
	if resp.Models == nil {
		t.Fatal("expected non-nil models, got nil")
	}
	if resp.Tools == nil {
		t.Fatal("expected non-nil tools, got nil")
	}
	if resp.Sessions == nil {
		t.Fatal("expected non-nil sessions, got nil")
	}
}

func TestProfileCrossTenant(t *testing.T) {
	mock := &mockPeopleRepo{
		profile: &User{ID: "u1", Name: "Alice", Email: "alice@acme.co", Team: "Engineering"},
	}

	req := httptest.NewRequest("GET", "/api/v1/people/alice@acme.co", nil)
	req.SetPathValue("email", "alice@acme.co")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "org-A"))
	w := httptest.NewRecorder()

	Profile(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	if mock.gotOrgID != "org-A" {
		t.Errorf("expected repo called with org_id 'org-A', got %q", mock.gotOrgID)
	}

	var resp ProfileResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	if resp.Name != "Alice" {
		t.Errorf("expected name Alice, got %s", resp.Name)
	}
}

func TestNewPgxPeopleRepoNil(t *testing.T) {
	repo := NewPgxPeopleRepo(nil)
	if repo != nil {
		t.Error("expected nil repo when pool is nil")
	}
}
