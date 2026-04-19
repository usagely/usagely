-- 0002_constraints.up.sql
-- Add unique constraints needed for seed upserts

ALTER TABLE tools ADD CONSTRAINT tools_org_name_uniq UNIQUE (org_id, name);
ALTER TABLE user_usage ADD CONSTRAINT user_usage_user_period_uniq UNIQUE (user_id, period_start);
ALTER TABLE model_usage ADD CONSTRAINT model_usage_model_org_period_uniq UNIQUE (model_id, org_id, period_start);
ALTER TABLE budgets ADD CONSTRAINT budgets_org_scope_uniq UNIQUE (org_id, scope);
ALTER TABLE anomalies ADD CONSTRAINT anomalies_org_title_uniq UNIQUE (org_id, title);
ALTER TABLE recommendations ADD CONSTRAINT recommendations_org_title_uniq UNIQUE (org_id, title);
ALTER TABLE approvals ADD CONSTRAINT approvals_org_requester_tool_uniq UNIQUE (org_id, requester_name, tool_name);
ALTER TABLE shadow_tools ADD CONSTRAINT shadow_tools_org_name_uniq UNIQUE (org_id, tool_name);
