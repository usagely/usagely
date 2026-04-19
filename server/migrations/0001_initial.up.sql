-- 0001_initial.up.sql
-- Usagely — initial schema

-- organizations
CREATE TABLE organizations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        UNIQUE NOT NULL,
  edition    TEXT        NOT NULL DEFAULT 'oss' CHECK (edition IN ('oss', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- teams
CREATE TABLE teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- users
CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id    UUID        REFERENCES teams(id) ON DELETE SET NULL,
  name       TEXT        NOT NULL,
  email      TEXT        UNIQUE NOT NULL,
  role       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tools
CREATE TABLE tools (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT         NOT NULL,
  vendor           TEXT         NOT NULL DEFAULT '',
  category         TEXT         NOT NULL DEFAULT '',
  status           TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'shadow')),
  seats            INT,
  provisioning     TEXT         NOT NULL DEFAULT '',
  spend_current    NUMERIC(12,2) NOT NULL DEFAULT 0,
  spend_prev       NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- models (global registry, not per-org)
CREATE TABLE models (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        UNIQUE NOT NULL,
  vendor     TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- usage_daily
CREATE TABLE usage_daily (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date        DATE         NOT NULL,
  total_value NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, date)
);

-- tool_spend
CREATE TABLE tool_spend (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id       UUID         NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  org_id        UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start  DATE         NOT NULL,
  period_end    DATE         NOT NULL,
  spend_usd     NUMERIC(12,2) NOT NULL DEFAULT 0,
  prev_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- model_usage
CREATE TABLE model_usage (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     UUID         NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  org_id       UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE         NOT NULL,
  tokens_in    BIGINT       NOT NULL DEFAULT 0,
  tokens_out   BIGINT       NOT NULL DEFAULT 0,
  calls        BIGINT       NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(12,2) NOT NULL DEFAULT 0,
  avg_latency  NUMERIC(6,3),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- user_usage
CREATE TABLE user_usage (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE         NOT NULL,
  tokens       BIGINT       NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(12,2) NOT NULL DEFAULT 0,
  prs_merged   INT          NOT NULL DEFAULT 0,
  top_tool     TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- budgets
CREATE TABLE budgets (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope      TEXT         NOT NULL,
  period     TEXT         NOT NULL,
  limit_usd  NUMERIC(12,2) NOT NULL,
  used_usd   NUMERIC(12,2) NOT NULL DEFAULT 0,
  alert_pct  INT          NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- anomalies
CREATE TABLE anomalies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  body        TEXT        NOT NULL DEFAULT '',
  severity    TEXT        NOT NULL CHECK (severity IN ('danger', 'warn', 'info')),
  team_name   TEXT        NOT NULL DEFAULT '',
  owner_name  TEXT        NOT NULL DEFAULT '',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- recommendations
CREATE TABLE recommendations (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title       TEXT          NOT NULL,
  reason      TEXT          NOT NULL DEFAULT '',
  savings_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  confidence  NUMERIC(4,3)  NOT NULL DEFAULT 0,
  scope       TEXT          NOT NULL DEFAULT '',
  effort      TEXT          NOT NULL CHECK (effort IN ('low', 'med', 'high')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- approvals
CREATE TABLE approvals (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_name  TEXT          NOT NULL,
  tool_name       TEXT          NOT NULL,
  reason          TEXT          NOT NULL DEFAULT '',
  cost_est_usd    NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- shadow_tools
CREATE TABLE shadow_tools (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tool_name   TEXT          NOT NULL,
  users_count INT           NOT NULL DEFAULT 0,
  source      TEXT          NOT NULL DEFAULT '',
  first_seen  TEXT          NOT NULL DEFAULT '',
  monthly_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  risk        TEXT          NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
