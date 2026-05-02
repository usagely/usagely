-- 0003_integrations.up.sql
-- Managed integrations and connector run history (W1.4)

-- integrations: one row per connected provider per org.
-- secret_encrypted stores the provider credential; it is NEVER returned
-- by any API endpoint. In production deployments use pgcrypto's
-- pgp_sym_encrypt($secret, $key) to populate this column.
CREATE TABLE integrations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider          TEXT        NOT NULL,
  display_name      TEXT        NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 255),
  config            JSONB       NOT NULL DEFAULT '{}',
  secret_encrypted  TEXT        NOT NULL DEFAULT '',
  status            TEXT        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'paused', 'error')),
  next_run_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX integrations_org_id_idx ON integrations (org_id);

-- connector_runs: one row per sync attempt for an integration.
CREATE TABLE connector_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id  UUID        NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'success', 'error')),
  events_written  INT         NOT NULL DEFAULT 0,
  error_message   TEXT        NOT NULL DEFAULT '',
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX connector_runs_integration_id_idx ON connector_runs (integration_id);
CREATE INDEX connector_runs_org_id_idx ON connector_runs (org_id);
