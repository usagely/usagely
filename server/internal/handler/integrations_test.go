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

// ---------------------------------------------------------------------------
// Mock repository
// ---------------------------------------------------------------------------

type mockIntegrationsRepo struct {
	// list
	listItems []IntegrationRecord
	listErr   error
	// create
	createRec *IntegrationRecord
	createErr error
	// get
	getRec *IntegrationRecord
	getErr error
	// update
	updateRec *IntegrationRecord
	updateErr error
	// delete
	deleteErr error
	// sync
	syncRun *ConnectorRunRecord
	syncErr error
	// runs
	runs    []ConnectorRunRecord
	runsErr error

	// recorded call args
	gotOrgID        string
	gotID           string
	gotSecret       string
	gotDisplayName  string
	gotProvider     string
	deletedOrgID    string
	deletedID       string
	syncOrgID       string
	syncID          string
}

func (m *mockIntegrationsRepo) ListIntegrations(_ context.Context, orgID string) ([]IntegrationRecord, error) {
	m.gotOrgID = orgID
	return m.listItems, m.listErr
}

func (m *mockIntegrationsRepo) CreateIntegration(_ context.Context, orgID, provider, displayName string, config json.RawMessage, secret string) (*IntegrationRecord, error) {
	m.gotOrgID = orgID
	m.gotProvider = provider
	m.gotDisplayName = displayName
	m.gotSecret = secret // recorded for internal verification only
	return m.createRec, m.createErr
}

func (m *mockIntegrationsRepo) GetIntegration(_ context.Context, orgID, id string) (*IntegrationRecord, error) {
	m.gotOrgID = orgID
	m.gotID = id
	return m.getRec, m.getErr
}

func (m *mockIntegrationsRepo) UpdateIntegration(_ context.Context, orgID, id string, displayName *string, config json.RawMessage, secret *string) (*IntegrationRecord, error) {
	m.gotOrgID = orgID
	m.gotID = id
	if displayName != nil {
		m.gotDisplayName = *displayName
	}
	return m.updateRec, m.updateErr
}

func (m *mockIntegrationsRepo) DeleteIntegration(_ context.Context, orgID, id string) error {
	m.deletedOrgID = orgID
	m.deletedID = id
	return m.deleteErr
}

func (m *mockIntegrationsRepo) TriggerSync(_ context.Context, orgID, id string) (*ConnectorRunRecord, error) {
	m.syncOrgID = orgID
	m.syncID = id
	return m.syncRun, m.syncErr
}

func (m *mockIntegrationsRepo) ListRuns(_ context.Context, orgID, integrationID string, _ int) ([]ConnectorRunRecord, error) {
	m.gotOrgID = orgID
	m.gotID = integrationID
	return m.runs, m.runsErr
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func integrationJSON(provider, displayName string) string {
	return `{"provider":"` + provider + `","display_name":"` + displayName + `","config":{},"secret":"sk-test-secret"}`
}

func updateJSON(displayName string) string {
	return `{"display_name":"` + displayName + `"}`
}

// ---------------------------------------------------------------------------
// ListIntegrations
// ---------------------------------------------------------------------------

func TestListIntegrationsEmpty(t *testing.T) {
	mock := &mockIntegrationsRepo{listItems: []IntegrationRecord{}}

	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListIntegrations(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp IntegrationsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Integrations == nil {
		t.Fatal("expected non-nil integrations array")
	}
	if len(resp.Integrations) != 0 {
		t.Errorf("expected 0 integrations, got %d", len(resp.Integrations))
	}
}

func TestListIntegrationsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListIntegrations(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp IntegrationsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Integrations == nil {
		t.Fatal("expected non-nil integrations array")
	}
}

func TestListIntegrationsUnauthorized(t *testing.T) {
	mock := &mockIntegrationsRepo{}
	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	w := httptest.NewRecorder()

	ListIntegrations(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestListIntegrationsRepoError(t *testing.T) {
	mock := &mockIntegrationsRepo{listErr: errors.New("db down")}

	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListIntegrations(mock)(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// CreateIntegration
// ---------------------------------------------------------------------------

func TestCreateIntegrationHappyPath(t *testing.T) {
	created := &IntegrationRecord{
		ID:          "int-1",
		Provider:    "openai",
		DisplayName: "My OpenAI",
		Config:      json.RawMessage(`{}`),
		Status:      "active",
		CreatedAt:   "2024-01-01T00:00:00Z",
		UpdatedAt:   "2024-01-01T00:00:00Z",
	}
	mock := &mockIntegrationsRepo{createRec: created}

	body := strings.NewReader(integrationJSON("openai", "My OpenAI"))
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var rec IntegrationRecord
	if err := json.NewDecoder(w.Body).Decode(&rec); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if rec.ID != "int-1" {
		t.Errorf("expected id int-1, got %s", rec.ID)
	}
	if rec.Provider != "openai" {
		t.Errorf("expected provider openai, got %s", rec.Provider)
	}
	// Verify the repo received the correct org_id.
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected repo called with test-org, got %s", mock.gotOrgID)
	}
}

func TestCreateIntegrationUnknownProvider(t *testing.T) {
	mock := &mockIntegrationsRepo{}

	body := strings.NewReader(`{"provider":"fakeprovider","display_name":"test","config":{},"secret":"abc"}`)
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "unknown provider") {
		t.Errorf("expected 'unknown provider' in body, got %q", w.Body.String())
	}
}

func TestCreateIntegrationEmptyDisplayName(t *testing.T) {
	mock := &mockIntegrationsRepo{}

	body := strings.NewReader(`{"provider":"openai","display_name":"   ","config":{},"secret":"abc"}`)
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty display_name, got %d", w.Code)
	}
}

func TestCreateIntegrationWhitespaceOnlySecret(t *testing.T) {
	mock := &mockIntegrationsRepo{}

	body := strings.NewReader(`{"provider":"openai","display_name":"test","config":{},"secret":"   "}`)
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for whitespace-only secret, got %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), "secret") {
		t.Errorf("expected secret-related error, got %q", w.Body.String())
	}
}

func TestCreateIntegrationUnauthorized(t *testing.T) {
	mock := &mockIntegrationsRepo{}
	body := strings.NewReader(integrationJSON("openai", "test"))
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestCreateIntegrationNilRepo(t *testing.T) {
	body := strings.NewReader(integrationJSON("openai", "test"))
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(nil)(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// Secret never returned
// ---------------------------------------------------------------------------

// TestSecretNeverReturned verifies that no response body from any endpoint
// contains a "secret" or "secret_encrypted" JSON field.
func TestSecretNeverReturnedOnCreate(t *testing.T) {
	created := &IntegrationRecord{
		ID:          "int-secret",
		Provider:    "openai",
		DisplayName: "Secret Test",
		Config:      json.RawMessage(`{}`),
		Status:      "active",
		CreatedAt:   "2024-01-01T00:00:00Z",
		UpdatedAt:   "2024-01-01T00:00:00Z",
	}
	mock := &mockIntegrationsRepo{createRec: created}

	body := strings.NewReader(integrationJSON("openai", "Secret Test"))
	req := httptest.NewRequest("POST", "/api/v1/integrations", body)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	CreateIntegration(mock)(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", w.Code)
	}
	assertNoSecretInBody(t, w.Body.String())
}

func TestSecretNeverReturnedOnList(t *testing.T) {
	mock := &mockIntegrationsRepo{
		listItems: []IntegrationRecord{
			{ID: "int-1", Provider: "openai", DisplayName: "Proj", Config: json.RawMessage(`{}`), Status: "active", CreatedAt: "2024-01-01T00:00:00Z", UpdatedAt: "2024-01-01T00:00:00Z"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListIntegrations(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	assertNoSecretInBody(t, w.Body.String())
}

func TestSecretNeverReturnedOnGet(t *testing.T) {
	mock := &mockIntegrationsRepo{
		getRec: &IntegrationRecord{
			ID: "int-1", Provider: "openai", DisplayName: "Proj",
			Config: json.RawMessage(`{}`), Status: "active",
			CreatedAt: "2024-01-01T00:00:00Z", UpdatedAt: "2024-01-01T00:00:00Z",
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	GetIntegration(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	assertNoSecretInBody(t, w.Body.String())
}

// assertNoSecretInBody fails the test if the JSON body contains a key whose
// name contains "secret" (case-insensitive).
func assertNoSecretInBody(t *testing.T, body string) {
	t.Helper()
	lower := strings.ToLower(body)
	if strings.Contains(lower, `"secret"`) || strings.Contains(lower, `"secret_encrypted"`) {
		t.Errorf("response body contains secret field: %s", body)
	}
}

// ---------------------------------------------------------------------------
// GetIntegration
// ---------------------------------------------------------------------------

func TestGetIntegrationHappyPath(t *testing.T) {
	mock := &mockIntegrationsRepo{
		getRec: &IntegrationRecord{
			ID: "int-1", Provider: "openai", DisplayName: "My Key",
			Config: json.RawMessage(`{}`), Status: "active",
			CreatedAt: "2024-01-01T00:00:00Z", UpdatedAt: "2024-01-01T00:00:00Z",
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	GetIntegration(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var rec IntegrationRecord
	if err := json.NewDecoder(w.Body).Decode(&rec); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if rec.ID != "int-1" {
		t.Errorf("expected id int-1, got %s", rec.ID)
	}
}

func TestGetIntegrationNotFound(t *testing.T) {
	mock := &mockIntegrationsRepo{getErr: errors.New("not found")}

	req := httptest.NewRequest("GET", "/api/v1/integrations/missing", nil)
	req.SetPathValue("id", "missing")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	GetIntegration(mock)(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// Cross-tenant boundary (Sign #3 — GUARDRAILS.md)
// ---------------------------------------------------------------------------

// TestCrossTenantGetIntegration verifies that a request from org-A cannot
// retrieve an integration that belongs to org-B.  The handler must pass only
// the authenticated org_id to the repository; the repository enforces the
// WHERE org_id = $1 clause which causes a "not found" for mismatched orgs.
func TestCrossTenantGetIntegration(t *testing.T) {
	// Repo simulates org-B's integration being invisible to org-A
	// (query returns no rows when org_id ≠ org-B).
	mock := &mockIntegrationsRepo{getErr: errors.New("not found")}

	req := httptest.NewRequest("GET", "/api/v1/integrations/org-b-int", nil)
	req.SetPathValue("id", "org-b-int")
	// Authenticated as org-A.
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "org-A"))
	w := httptest.NewRecorder()

	GetIntegration(mock)(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for cross-tenant access, got %d", w.Code)
	}
	// Confirm the handler forwarded org-A, not some bypass.
	if mock.gotOrgID != "org-A" {
		t.Errorf("expected repo called with org-A, got %q", mock.gotOrgID)
	}
}

func TestCrossTenantListIntegrations(t *testing.T) {
	// Mock returns only org-A's data when called with org-A.
	orgAItem := IntegrationRecord{
		ID: "int-org-a", Provider: "openai", DisplayName: "Org A Key",
		Config: json.RawMessage(`{}`), Status: "active",
		CreatedAt: "2024-01-01T00:00:00Z", UpdatedAt: "2024-01-01T00:00:00Z",
	}
	mock := &mockIntegrationsRepo{listItems: []IntegrationRecord{orgAItem}}

	req := httptest.NewRequest("GET", "/api/v1/integrations", nil)
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "org-A"))
	w := httptest.NewRecorder()

	ListIntegrations(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Verify the repo was invoked with org-A, not some other tenant ID.
	if mock.gotOrgID != "org-A" {
		t.Errorf("expected repo called with org-A, got %q", mock.gotOrgID)
	}

	var resp IntegrationsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Integrations) != 1 || resp.Integrations[0].ID != "int-org-a" {
		t.Errorf("expected org-A's integration, got %+v", resp.Integrations)
	}
}

// ---------------------------------------------------------------------------
// UpdateIntegration
// ---------------------------------------------------------------------------

func TestUpdateIntegration(t *testing.T) {
	updated := &IntegrationRecord{
		ID: "int-1", Provider: "openai", DisplayName: "Updated Name",
		Config: json.RawMessage(`{}`), Status: "active",
		CreatedAt: "2024-01-01T00:00:00Z", UpdatedAt: "2024-01-02T00:00:00Z",
	}
	mock := &mockIntegrationsRepo{updateRec: updated}

	body := strings.NewReader(updateJSON("Updated Name"))
	req := httptest.NewRequest("PATCH", "/api/v1/integrations/int-1", body)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	UpdateIntegration(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var rec IntegrationRecord
	if err := json.NewDecoder(w.Body).Decode(&rec); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if rec.DisplayName != "Updated Name" {
		t.Errorf("expected Updated Name, got %s", rec.DisplayName)
	}
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected org test-org, got %s", mock.gotOrgID)
	}
	if mock.gotDisplayName != "Updated Name" {
		t.Errorf("expected display_name Updated Name passed to repo, got %s", mock.gotDisplayName)
	}
	assertNoSecretInBody(t, w.Body.String())
}

func TestUpdateIntegrationNotFound(t *testing.T) {
	mock := &mockIntegrationsRepo{updateErr: errors.New("not found")}

	body := strings.NewReader(updateJSON("New Name"))
	req := httptest.NewRequest("PATCH", "/api/v1/integrations/missing", body)
	req.SetPathValue("id", "missing")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	UpdateIntegration(mock)(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// DeleteIntegration (soft delete)
// ---------------------------------------------------------------------------

// TestDeleteIntegrationIsSoft verifies that DELETE calls the repo's
// DeleteIntegration method (which executes a soft-delete UPDATE, not DROP).
// The handler must return 200 {"deleted": true} and must NOT issue a hard
// delete — the actual "paused" SQL is in the pgx implementation tested by
// the tenancy lint and integration tests.
func TestDeleteIntegrationIsSoft(t *testing.T) {
	mock := &mockIntegrationsRepo{}

	req := httptest.NewRequest("DELETE", "/api/v1/integrations/int-1", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	DeleteIntegration(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	// Verify deleted ID and org scoping.
	if mock.deletedID != "int-1" {
		t.Errorf("expected deletedID int-1, got %s", mock.deletedID)
	}
	if mock.deletedOrgID != "test-org" {
		t.Errorf("expected deletedOrgID test-org, got %s", mock.deletedOrgID)
	}

	// The response must confirm deletion without leaking any secret.
	var resp map[string]bool
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !resp["deleted"] {
		t.Error("expected {\"deleted\": true}")
	}
}

func TestDeleteIntegrationUnauthorized(t *testing.T) {
	mock := &mockIntegrationsRepo{}
	req := httptest.NewRequest("DELETE", "/api/v1/integrations/int-1", nil)
	req.SetPathValue("id", "int-1")
	w := httptest.NewRecorder()

	DeleteIntegration(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// TriggerSync
// ---------------------------------------------------------------------------

// TestTriggerSyncCreatesRun verifies that POST /{id}/sync returns 202 with
// a connector run record.
func TestTriggerSyncCreatesRun(t *testing.T) {
	run := &ConnectorRunRecord{
		ID:            "run-1",
		IntegrationID: "int-1",
		Status:        "pending",
		EventsWritten: 0,
		CreatedAt:     "2024-01-01T00:00:00Z",
	}
	mock := &mockIntegrationsRepo{syncRun: run}

	req := httptest.NewRequest("POST", "/api/v1/integrations/int-1/sync", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	TriggerSync(mock)(w, req)

	if w.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d: %s", w.Code, w.Body.String())
	}

	var rec ConnectorRunRecord
	if err := json.NewDecoder(w.Body).Decode(&rec); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if rec.ID != "run-1" {
		t.Errorf("expected run-1, got %s", rec.ID)
	}
	if rec.Status != "pending" {
		t.Errorf("expected pending status, got %s", rec.Status)
	}
	// Verify org scoping.
	if mock.syncOrgID != "test-org" {
		t.Errorf("expected syncOrgID test-org, got %s", mock.syncOrgID)
	}
	if mock.syncID != "int-1" {
		t.Errorf("expected syncID int-1, got %s", mock.syncID)
	}
}

func TestTriggerSyncNotFound(t *testing.T) {
	mock := &mockIntegrationsRepo{syncErr: errors.New("not found")}

	req := httptest.NewRequest("POST", "/api/v1/integrations/missing/sync", nil)
	req.SetPathValue("id", "missing")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	TriggerSync(mock)(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestTriggerSyncUnauthorized(t *testing.T) {
	mock := &mockIntegrationsRepo{}
	req := httptest.NewRequest("POST", "/api/v1/integrations/int-1/sync", nil)
	req.SetPathValue("id", "int-1")
	w := httptest.NewRecorder()

	TriggerSync(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

// ---------------------------------------------------------------------------
// ListRuns
// ---------------------------------------------------------------------------

func TestListRunsHappyPath(t *testing.T) {
	mock := &mockIntegrationsRepo{
		runs: []ConnectorRunRecord{
			{ID: "run-1", IntegrationID: "int-1", Status: "success", EventsWritten: 10, CreatedAt: "2024-01-01T00:00:00Z"},
			{ID: "run-2", IntegrationID: "int-1", Status: "error", EventsWritten: 0, ErrorMessage: "timeout", CreatedAt: "2024-01-02T00:00:00Z"},
		},
	}

	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1/runs", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListRuns(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ConnectorRunsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Runs) != 2 {
		t.Fatalf("expected 2 runs, got %d", len(resp.Runs))
	}
	if resp.Runs[0].ID != "run-1" {
		t.Errorf("expected run-1, got %s", resp.Runs[0].ID)
	}
	if mock.gotOrgID != "test-org" {
		t.Errorf("expected org test-org, got %s", mock.gotOrgID)
	}
	if mock.gotID != "int-1" {
		t.Errorf("expected integration_id int-1, got %s", mock.gotID)
	}
}

func TestListRunsEmpty(t *testing.T) {
	mock := &mockIntegrationsRepo{runs: []ConnectorRunRecord{}}

	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1/runs", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListRuns(mock)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp ConnectorRunsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Runs == nil {
		t.Fatal("expected non-nil runs array")
	}
	if len(resp.Runs) != 0 {
		t.Errorf("expected 0 runs, got %d", len(resp.Runs))
	}
}

func TestListRunsUnauthorized(t *testing.T) {
	mock := &mockIntegrationsRepo{}
	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1/runs", nil)
	req.SetPathValue("id", "int-1")
	w := httptest.NewRecorder()

	ListRuns(mock)(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestListRunsNilRepo(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/v1/integrations/int-1/runs", nil)
	req.SetPathValue("id", "int-1")
	req = req.WithContext(context.WithValue(req.Context(), "org_id", "test-org"))
	w := httptest.NewRecorder()

	ListRuns(nil)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp ConnectorRunsListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Runs == nil {
		t.Fatal("expected non-nil runs array")
	}
}

// ---------------------------------------------------------------------------
// NewPgxIntegrationsRepo nil pool
// ---------------------------------------------------------------------------

func TestNewPgxIntegrationsRepoNilPool(t *testing.T) {
	repo := NewPgxIntegrationsRepo(nil)
	if repo != nil {
		t.Error("expected nil repo when pool is nil")
	}
}
