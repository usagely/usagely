-- 0002_constraints.down.sql
-- Remove unique constraints

ALTER TABLE tools DROP CONSTRAINT IF EXISTS tools_org_name_uniq;
ALTER TABLE user_usage DROP CONSTRAINT IF EXISTS user_usage_user_period_uniq;
ALTER TABLE model_usage DROP CONSTRAINT IF EXISTS model_usage_model_org_period_uniq;
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_org_scope_uniq;
ALTER TABLE anomalies DROP CONSTRAINT IF EXISTS anomalies_org_title_uniq;
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_org_title_uniq;
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_org_requester_tool_uniq;
ALTER TABLE shadow_tools DROP CONSTRAINT IF EXISTS shadow_tools_org_name_uniq;
