package handler

// integrations.go — CRUD + sync endpoints for managed integrations.
//
// Routes (mounted at /api/v1/integrations by the caller):
//
//	GET    /                  — list integrations (no secret)
//	POST   /                  — create integration
//	GET    /{id}              — get single integration (no secret)
//	PATCH  /{id}              — update display_name / config / rotate secret
//	DELETE /{id}              — soft-delete (status → "paused")
//	POST   /{id}/sync         — trigger immediate sync (202)
//	GET    /{id}/runs?limit=N — recent connector runs

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ConnectorRegistry is the set of valid provider slugs.
// Validate POST/PATCH requests against this before persisting.
var ConnectorRegistry = map[string]bool{
	"openai":    true,
	"anthropic": true,
	"github":    true,
	"cursor":    true,
	"google":    true,
	"azure":     true,
}

const maxDisplayNameLen = 255

// ---------------------------------------------------------------------------
// Response / request types
// ---------------------------------------------------------------------------

// IntegrationRecord is the public representation of a managed integration.
// It deliberately omits secret_encrypted and any decrypted credential bytes.
type IntegrationRecord struct {
	ID            string          `json:"id"`
	Provider      string          `json:"provider"`
	DisplayName   string          `json:"display_name"`
	Config        json.RawMessage `json:"config"`
	Status        string          `json:"status"`
	NextRunAt     *string         `json:"next_run_at,omitempty"`
	LastRunStatus *string         `json:"last_run_status,omitempty"`
	EventsWritten *int            `json:"events_written,omitempty"`
	CreatedAt     string          `json:"created_at"`
	UpdatedAt     string          `json:"updated_at"`
}

// IntegrationsListResponse wraps the list endpoint payload.
type IntegrationsListResponse struct {
	Integrations []IntegrationRecord `json:"integrations"`
}

// ConnectorRunRecord is the public representation of a single sync run.
type ConnectorRunRecord struct {
	ID            string  `json:"id"`
	IntegrationID string  `json:"integration_id"`
	Status        string  `json:"status"`
	EventsWritten int     `json:"events_written"`
	ErrorMessage  string  `json:"error_message,omitempty"`
	StartedAt     *string `json:"started_at,omitempty"`
	FinishedAt    *string `json:"finished_at,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

// ConnectorRunsListResponse wraps the runs list endpoint payload.
type ConnectorRunsListResponse struct {
	Runs []ConnectorRunRecord `json:"runs"`
}

// IntegrationCreateRequest is the body accepted by POST /.
type IntegrationCreateRequest struct {
	Provider    string          `json:"provider"`
	DisplayName string          `json:"display_name"`
	Config      json.RawMessage `json:"config"`
	Secret      string          `json:"secret"`
}

// IntegrationUpdateRequest is the body accepted by PATCH /{id}.
// All fields are optional; omitted fields are left unchanged.
type IntegrationUpdateRequest struct {
	DisplayName *string         `json:"display_name"`
	Config      json.RawMessage `json:"config"`
	Secret      *string         `json:"secret"`
}

// ---------------------------------------------------------------------------
// Repository interface
// ---------------------------------------------------------------------------

// IntegrationsRepo abstracts all integration and connector-run queries.
// Every method is scoped to the caller's org_id — cross-tenant access is
// structurally impossible through this interface.
type IntegrationsRepo interface {
	ListIntegrations(ctx context.Context, orgID string) ([]IntegrationRecord, error)
	CreateIntegration(ctx context.Context, orgID, provider, displayName string, config json.RawMessage, secret string) (*IntegrationRecord, error)
	GetIntegration(ctx context.Context, orgID, id string) (*IntegrationRecord, error)
	UpdateIntegration(ctx context.Context, orgID, id string, displayName *string, config json.RawMessage, secret *string) (*IntegrationRecord, error)
	DeleteIntegration(ctx context.Context, orgID, id string) error
	TriggerSync(ctx context.Context, orgID, id string) (*ConnectorRunRecord, error)
	ListRuns(ctx context.Context, orgID, integrationID string, limit int) ([]ConnectorRunRecord, error)
}

// ---------------------------------------------------------------------------
// pgxpool implementation
// ---------------------------------------------------------------------------

type pgxIntegrationsRepo struct {
	pool *pgxpool.Pool
}

// NewPgxIntegrationsRepo returns an IntegrationsRepo backed by pgxpool,
// or nil when pool is nil.
func NewPgxIntegrationsRepo(pool *pgxpool.Pool) IntegrationsRepo {
	if pool == nil {
		return nil
	}
	return &pgxIntegrationsRepo{pool: pool}
}

func (r *pgxIntegrationsRepo) ListIntegrations(ctx context.Context, orgID string) ([]IntegrationRecord, error) {
	// tenancy:ok — both the subquery and the outer WHERE filter by org_id = $1
	rows, err := r.pool.Query(ctx, `
		SELECT i.id, i.provider, i.display_name, i.config, i.status,
		       i.next_run_at, i.created_at, i.updated_at,
		       cr.status, cr.events_written
		FROM integrations i
		LEFT JOIN connector_runs cr ON cr.id = (
			SELECT id FROM connector_runs
			WHERE integration_id = i.id AND org_id = $1
			ORDER BY created_at DESC LIMIT 1
		)
		WHERE i.org_id = $1
		ORDER BY i.created_at DESC
	`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []IntegrationRecord
	for rows.Next() {
		var rec IntegrationRecord
		var nextRunAt *time.Time
		var createdAt, updatedAt time.Time
		var lastRunStatus *string
		var eventsWritten *int
		if err := rows.Scan(
			&rec.ID, &rec.Provider, &rec.DisplayName, &rec.Config,
			&rec.Status, &nextRunAt, &createdAt, &updatedAt,
			&lastRunStatus, &eventsWritten,
		); err != nil {
			return nil, err
		}
		rec.CreatedAt = createdAt.Format(time.RFC3339)
		rec.UpdatedAt = updatedAt.Format(time.RFC3339)
		if nextRunAt != nil {
			s := nextRunAt.Format(time.RFC3339)
			rec.NextRunAt = &s
		}
		rec.LastRunStatus = lastRunStatus
		rec.EventsWritten = eventsWritten
		items = append(items, rec)
	}
	return items, nil
}

func (r *pgxIntegrationsRepo) CreateIntegration(ctx context.Context, orgID, provider, displayName string, config json.RawMessage, secret string) (*IntegrationRecord, error) {
	if len(config) == 0 {
		config = json.RawMessage(`{}`)
	}
	// tenancy:ok — INSERT scoped to org_id = $1; secret stored as-is
	// (production deployments should wrap $5 with pgp_sym_encrypt($5, $key))
	row := r.pool.QueryRow(ctx, `
		INSERT INTO integrations (org_id, provider, display_name, config, secret_encrypted)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, provider, display_name, config, status, next_run_at, created_at, updated_at
	`, orgID, provider, displayName, config, secret)
	return scanIntegrationRow(row)
}

func (r *pgxIntegrationsRepo) GetIntegration(ctx context.Context, orgID, id string) (*IntegrationRecord, error) {
	// tenancy:ok — filtered by org_id = $1 and id = $2
	row := r.pool.QueryRow(ctx, `
		SELECT id, provider, display_name, config, status, next_run_at, created_at, updated_at
		FROM integrations
		WHERE org_id = $1 AND id = $2
	`, orgID, id)
	return scanIntegrationRow(row)
}

func (r *pgxIntegrationsRepo) UpdateIntegration(ctx context.Context, orgID, id string, displayName *string, config json.RawMessage, secret *string) (*IntegrationRecord, error) {
	// tenancy:ok — WHERE org_id = $1 AND id = $2
	row := r.pool.QueryRow(ctx, `
		UPDATE integrations
		SET display_name      = COALESCE($3, display_name),
		    config            = COALESCE($4::jsonb, config),
		    secret_encrypted  = CASE WHEN $5 IS NOT NULL THEN $5 ELSE secret_encrypted END,
		    updated_at        = NOW()
		WHERE org_id = $1 AND id = $2
		RETURNING id, provider, display_name, config, status, next_run_at, created_at, updated_at
	`, orgID, id, displayName, config, secret)
	return scanIntegrationRow(row)
}

func (r *pgxIntegrationsRepo) DeleteIntegration(ctx context.Context, orgID, id string) error {
	// tenancy:ok — WHERE org_id = $1 AND id = $2
	_, err := r.pool.Exec(ctx, `
		UPDATE integrations
		SET status = 'paused', updated_at = NOW()
		WHERE org_id = $1 AND id = $2
	`, orgID, id)
	return err
}

func (r *pgxIntegrationsRepo) TriggerSync(ctx context.Context, orgID, id string) (*ConnectorRunRecord, error) {
	// Step 1: bump next_run_at and verify ownership.
	// tenancy:ok — WHERE org_id = $1 AND id = $2
	var integrationID string
	err := r.pool.QueryRow(ctx, `
		UPDATE integrations
		SET next_run_at = NOW(), updated_at = NOW()
		WHERE org_id = $1 AND id = $2
		RETURNING id
	`, orgID, id).Scan(&integrationID)
	if err != nil {
		return nil, err
	}

	// Step 2: create a pending connector run.
	// tenancy:ok — INSERT includes org_id column = $2
	row := r.pool.QueryRow(ctx, `
		INSERT INTO connector_runs (integration_id, org_id, status)
		VALUES ($1, $2, 'pending')
		RETURNING id, integration_id, status, events_written,
		          error_message, started_at, finished_at, created_at
	`, integrationID, orgID)
	return scanConnectorRunRow(row)
}

func (r *pgxIntegrationsRepo) ListRuns(ctx context.Context, orgID, integrationID string, limit int) ([]ConnectorRunRecord, error) {
	if limit <= 0 {
		limit = 20
	}
	// tenancy:ok — WHERE org_id = $1 AND integration_id = $2
	rows, err := r.pool.Query(ctx, `
		SELECT id, integration_id, status, events_written,
		       error_message, started_at, finished_at, created_at
		FROM connector_runs
		WHERE org_id = $1 AND integration_id = $2
		ORDER BY created_at DESC
		LIMIT $3
	`, orgID, integrationID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var runs []ConnectorRunRecord
	for rows.Next() {
		run, err := scanConnectorRunRow(rows)
		if err != nil {
			return nil, err
		}
		runs = append(runs, *run)
	}
	return runs, nil
}

// ---------------------------------------------------------------------------
// Scan helpers (keep SQL→Go mapping in one place)
// ---------------------------------------------------------------------------

// rowScanner is satisfied by both pgx.Row and pgx.Rows.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanIntegrationRow(row rowScanner) (*IntegrationRecord, error) {
	var rec IntegrationRecord
	var nextRunAt *time.Time
	var createdAt, updatedAt time.Time
	if err := row.Scan(
		&rec.ID, &rec.Provider, &rec.DisplayName, &rec.Config,
		&rec.Status, &nextRunAt, &createdAt, &updatedAt,
	); err != nil {
		return nil, err
	}
	rec.CreatedAt = createdAt.Format(time.RFC3339)
	rec.UpdatedAt = updatedAt.Format(time.RFC3339)
	if nextRunAt != nil {
		s := nextRunAt.Format(time.RFC3339)
		rec.NextRunAt = &s
	}
	return &rec, nil
}

func scanConnectorRunRow(row rowScanner) (*ConnectorRunRecord, error) {
	var run ConnectorRunRecord
	var startedAt, finishedAt *time.Time
	var createdAt time.Time
	if err := row.Scan(
		&run.ID, &run.IntegrationID, &run.Status, &run.EventsWritten,
		&run.ErrorMessage, &startedAt, &finishedAt, &createdAt,
	); err != nil {
		return nil, err
	}
	run.CreatedAt = createdAt.Format(time.RFC3339)
	if startedAt != nil {
		s := startedAt.Format(time.RFC3339)
		run.StartedAt = &s
	}
	if finishedAt != nil {
		s := finishedAt.Format(time.RFC3339)
		run.FinishedAt = &s
	}
	return &run, nil
}

// ---------------------------------------------------------------------------
// HTTP handler functions
// ---------------------------------------------------------------------------

// ListIntegrations handles GET /api/v1/integrations.
//
// Response: 200 {"integrations": [...]}
// Each item exposes connection health (last_run_status, events_written)
// but never the encrypted secret.
func ListIntegrations(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &IntegrationsListResponse{Integrations: []IntegrationRecord{}}

		if repo == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		items, err := repo.ListIntegrations(ctx, orgID)
		if err != nil {
			http.Error(w, "failed to list integrations", http.StatusInternalServerError)
			return
		}
		if items != nil {
			resp.Integrations = items
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}

// CreateIntegration handles POST /api/v1/integrations.
//
// Body: {"provider": "openai", "display_name": "...", "config": {}, "secret": "sk-..."}
// Response: 201 {integration} — secret is write-only and never returned.
func CreateIntegration(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if repo == nil {
			http.Error(w, "service unavailable", http.StatusServiceUnavailable)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		var req IntegrationCreateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Validate provider against connector registry.
		if !ConnectorRegistry[strings.ToLower(req.Provider)] {
			http.Error(w, "unknown provider", http.StatusBadRequest)
			return
		}
		// Validate display_name.
		if trimmed := strings.TrimSpace(req.DisplayName); trimmed == "" || len(req.DisplayName) > maxDisplayNameLen {
			http.Error(w, "display_name must be 1–255 characters", http.StatusBadRequest)
			return
		}
		// Reject whitespace-only secrets.
		if strings.TrimSpace(req.Secret) == "" {
			http.Error(w, "secret must not be empty or whitespace-only", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		rec, err := repo.CreateIntegration(ctx, orgID, strings.ToLower(req.Provider), req.DisplayName, req.Config, req.Secret)
		if err != nil {
			http.Error(w, "failed to create integration", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(rec)
	}
}

// GetIntegration handles GET /api/v1/integrations/{id}.
//
// Response: 200 {integration} or 404 if not found / wrong org.
// Secret is never included in the response.
func GetIntegration(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if repo == nil {
			http.Error(w, "service unavailable", http.StatusServiceUnavailable)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		rec, err := repo.GetIntegration(ctx, orgID, id)
		if err != nil {
			http.Error(w, "integration not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rec)
	}
}

// UpdateIntegration handles PATCH /api/v1/integrations/{id}.
//
// Body: {"display_name": "...", "config": {}, "secret": "..."}  (all optional)
// Response: 200 {updated integration} — secret is write-only.
func UpdateIntegration(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if repo == nil {
			http.Error(w, "service unavailable", http.StatusServiceUnavailable)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		var req IntegrationUpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Validate display_name if provided.
		if req.DisplayName != nil {
			trimmed := strings.TrimSpace(*req.DisplayName)
			if trimmed == "" || len(*req.DisplayName) > maxDisplayNameLen {
				http.Error(w, "display_name must be 1–255 characters", http.StatusBadRequest)
				return
			}
		}
		// Reject whitespace-only secrets if a rotation is requested.
		if req.Secret != nil && strings.TrimSpace(*req.Secret) == "" {
			http.Error(w, "secret must not be empty or whitespace-only", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		rec, err := repo.UpdateIntegration(ctx, orgID, id, req.DisplayName, req.Config, req.Secret)
		if err != nil {
			http.Error(w, "integration not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(rec)
	}
}

// DeleteIntegration handles DELETE /api/v1/integrations/{id}.
//
// Performs a soft delete: sets status = "paused". Foreign keys on
// connector_runs and events rows are preserved.
// Response: 200 {"deleted": true}
func DeleteIntegration(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if repo == nil {
			http.Error(w, "service unavailable", http.StatusServiceUnavailable)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		if err := repo.DeleteIntegration(ctx, orgID, id); err != nil {
			http.Error(w, "failed to delete integration", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]bool{"deleted": true})
	}
}

// TriggerSync handles POST /api/v1/integrations/{id}/sync.
//
// Sets next_run_at = now() on the integration and creates a pending
// connector_run row. Returns 202 with the new run record.
func TriggerSync(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if repo == nil {
			http.Error(w, "service unavailable", http.StatusServiceUnavailable)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		run, err := repo.TriggerSync(ctx, orgID, id)
		if err != nil {
			http.Error(w, "integration not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(run)
	}
}

// ListRuns handles GET /api/v1/integrations/{id}/runs.
//
// Query param: limit (default 20, max 100).
// Response: 200 {"runs": [...]}
func ListRuns(repo IntegrationsRepo) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		resp := &ConnectorRunsListResponse{Runs: []ConnectorRunRecord{}}

		if repo == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(resp)
			return
		}

		orgID, ok := r.Context().Value("org_id").(string)
		if !ok || orgID == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		id := r.PathValue("id")
		if id == "" {
			http.Error(w, "id required", http.StatusBadRequest)
			return
		}

		limit := 20
		if l := r.URL.Query().Get("limit"); l != "" {
			if n, err := strconv.Atoi(l); err == nil && n > 0 {
				if n > 100 {
					n = 100
				}
				limit = n
			}
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		runs, err := repo.ListRuns(ctx, orgID, id, limit)
		if err != nil {
			http.Error(w, "failed to list runs", http.StatusInternalServerError)
			return
		}
		if runs != nil {
			resp.Runs = runs
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(resp)
	}
}
