/**
 * Usagely Typed API Client
 * Fetch wrapper with auth cookie forwarding, error handling, and type safety
 */

import type {
  DashboardResponse,
  TeamsResponse,
  PeopleResponse,
  ProfileResponse,
  ToolsResponse,
  ModelsResponse,
  BudgetsResponse,
  AnomaliesResponse,
  RecommendationsResponse,
  ShadowResponse,
  ApprovalsResponse,
  ForecastResponse,
  SettingsResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  path: string;
  constructor(status: number, path: string) {
    super(`API error ${status}: ${path}`);
    this.status = status;
    this.path = path;
  }
}

/**
 * Typed fetch wrapper with auth cookie forwarding
 */
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // forward auth cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, path);
  }

  return res.json();
}

/**
 * Usagely API client with typed endpoints
 */
export const api = {
  // Dashboard
  dashboard: () => apiFetch<DashboardResponse>('/api/v1/dashboard'),

  // Teams
  teams: () => apiFetch<TeamsResponse>('/api/v1/teams'),

  // People
  people: (team?: string) =>
    apiFetch<PeopleResponse>(
      `/api/v1/people${team ? `?team=${encodeURIComponent(team)}` : ''}`
    ),

  // User Profile
  profile: (email: string) =>
    apiFetch<ProfileResponse>(`/api/v1/people/${encodeURIComponent(email)}`),

  // Tools
  tools: (category?: string) =>
    apiFetch<ToolsResponse>(
      `/api/v1/tools${category ? `?category=${encodeURIComponent(category)}` : ''}`
    ),

  // Models
  models: () => apiFetch<ModelsResponse>('/api/v1/models'),

  // Budgets
  budgets: () => apiFetch<BudgetsResponse>('/api/v1/budgets'),

  // Anomalies
  anomalies: () => apiFetch<AnomaliesResponse>('/api/v1/anomalies'),

  // Settings
  settings: () => apiFetch<SettingsResponse>('/api/v1/settings'),

  // Recommendations
  recommendations: () =>
    apiFetch<RecommendationsResponse>('/api/v1/recommendations'),

  // Shadow AI
  shadow: () => apiFetch<ShadowResponse>('/api/v1/shadow'),

  // Approvals
  approvals: () => apiFetch<ApprovalsResponse>('/api/v1/approvals'),

  // Forecast
  forecast: () => apiFetch<ForecastResponse>('/api/v1/forecast'),

  // Update approval status
  updateApproval: (id: string, status: 'approved' | 'denied') =>
    apiFetch(`/api/v1/approvals/${encodeURIComponent(id)}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};
