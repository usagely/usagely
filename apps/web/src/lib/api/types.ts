/**
 * Usagely API Type Contracts
 * Derived from design prototype data shapes (design/data.js)
 * BFF response shapes per screen
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  edition: 'oss' | 'enterprise';
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: number;
}

export interface Tool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  status: 'approved' | 'pending' | 'shadow';
  seats: number | null;
  provisioning: string;
  spend: number;
  prev: number;
}

export interface Model {
  id?: string;
  name: string;
  vendor: string;
  tokens_in: number;
  tokens_out: number;
  calls: number;
  cost: number;
  avg_latency: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  team: string;
  role: string;
  tokens: number;
  cost: number;
  prs: number;
  top_tool: string;
}

export interface Budget {
  id: string;
  scope: string;
  period: string;
  limit_usd: number;
  used_usd: number;
  alert_pct: number;
}

export interface Anomaly {
  id: string;
  title: string;
  body: string;
  severity: 'danger' | 'warn' | 'info';
  team_name: string;
  owner_name: string;
  detected_at: string;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  savings_usd: number;
  confidence: number;
  scope: string;
  effort: 'low' | 'med' | 'high';
}

export interface Approval {
  id: string;
  requester_name: string;
  tool_name: string;
  reason: string;
  cost_est_usd: number;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}

export interface ShadowTool {
  id: string;
  tool_name: string;
  users_count: number;
  source: string;
  first_seen: string;
  monthly_usd: number;
  risk: 'low' | 'medium' | 'high';
}

export interface DailySpend {
  date: string;
  value: number;
}

// ============================================================================
// SCREEN-SPECIFIC RESPONSE SHAPES (BFF PATTERN)
// ============================================================================

export interface DashboardResponse {
  mtd_spend: number;
  projected_month: number;
  active_tools: number;
  active_users: number;
  mtd_delta: number;
  projected_delta: number;
  tools_delta: number;
  users_delta: number;
  daily_spend: DailySpend[];
  spend_by_category: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  teams_spend: Array<
    Team & {
      spend: number;
      per_user: number;
      delta: number;
      budget_pct: number;
    }
  >;
}

export interface TeamsResponse {
  teams: Array<
    Team & {
      spend: number;
      budget: number;
      per_user: number;
      top_tool: string;
      delta: number;
    }
  >;
  heatmap: number[][];
}

export interface PeopleResponse {
  users: User[];
}

export interface ProfileResponse extends User {
  daily_activity: DailySpend[];
  hourly_pattern: number[][];
  models: Array<{
    name: string;
    tokens: number;
    cost: number;
    calls: number;
    color: string;
  }>;
  tools: Array<{
    name: string;
    category: string;
    usage: string;
    cost: number;
    status: string;
  }>;
  sessions: Array<{
    id: string;
    when: string;
    tool: string;
    model: string;
    tag: string;
    duration: string;
    tokens: number;
    cost: number;
    outcome: string;
  }>;
}

export interface ToolsResponse {
  tools: Tool[];
}

export interface ModelsResponse {
  models: Model[];
  total_tokens: number;
  total_cost: number;
  total_calls: number;
}

export interface BudgetsResponse {
  budgets: Budget[];
}

export interface AnomaliesResponse {
  anomalies: Anomaly[];
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

export interface ShadowResponse {
  shadow_tools: ShadowTool[];
}

export interface ApprovalsResponse {
  approvals: Approval[];
}

export interface ForecastResponse {
  historical_spend: DailySpend[];
  projected_spend: DailySpend[];
  drivers: Array<{
    name: string;
    pct: number;
  }>;
  scenarios: Array<{
    name: string;
    value: number;
    delta: number;
    tone: string;
  }>;
}

export interface SettingsResponse {
  integrations: Array<{
    name: string;
    category: string;
    status: string;
    info: string;
  }>;
  guardrails: Array<{
    title: string;
    description: string;
    enabled: boolean;
  }>;
}
