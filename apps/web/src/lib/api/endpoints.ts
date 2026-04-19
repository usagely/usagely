/**
 * Usagely API Endpoint Path Constants
 * All API v1 endpoints used by the frontend
 */

export const ENDPOINTS = {
  // Dashboard
  DASHBOARD: '/api/v1/dashboard',

  // Teams
  TEAMS: '/api/v1/teams',

  // People
  PEOPLE: '/api/v1/people',
  PEOPLE_BY_EMAIL: (email: string) => `/api/v1/people/${encodeURIComponent(email)}`,

  // Tools
  TOOLS: '/api/v1/tools',

  // Models
  MODELS: '/api/v1/models',

  // Budgets
  BUDGETS: '/api/v1/budgets',

  // Anomalies
  ANOMALIES: '/api/v1/anomalies',

  // Recommendations
  RECOMMENDATIONS: '/api/v1/recommendations',

  // Shadow AI
  SHADOW: '/api/v1/shadow',

  // Approvals
  APPROVALS: '/api/v1/approvals',
  APPROVAL_BY_ID: (id: string) => `/api/v1/approvals/${encodeURIComponent(id)}`,

  // Forecast
  FORECAST: '/api/v1/forecast',

  // Settings
  SETTINGS: '/api/v1/settings',
} as const;
