import type { IconName } from '@/src/components/ui/icon';

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  badge?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      { id: 'anomalies', label: 'Anomalies', icon: 'warn', badge: '4' },
    ],
  },
  {
    group: 'ALLOCATION',
    items: [
      { id: 'teams', label: 'Teams', icon: 'users' },
      { id: 'people', label: 'People', icon: 'users' },
      { id: 'tools', label: 'Tools & Vendors', icon: 'tools' },
      { id: 'models', label: 'Models & Tokens', icon: 'cpu' },
    ],
  },
  {
    group: 'CONTROL',
    items: [
      { id: 'budgets', label: 'Budgets', icon: 'budget' },
      { id: 'recommendations', label: 'Recommendations', icon: 'bolt', badge: '6' },
      { id: 'shadow', label: 'Shadow AI', icon: 'shadow', badge: '5' },
      { id: 'approvals', label: 'Approvals', icon: 'approve', badge: '3' },
      { id: 'forecast', label: 'Forecast', icon: 'forecast' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export const ENTERPRISE_ONLY = new Set([
  'shadow',
  'forecast',
  'approvals',
  'recommendations',
]);

export const PAGE_META: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Company · Q2 2026 · Month-to-date' },
  anomalies: { title: 'Anomalies', sub: 'Automated detection across all connected sources' },
  teams: { title: 'Teams', sub: 'Spend, efficiency and trend by cost center' },
  people: { title: 'People', sub: 'Individual contributor usage & efficiency' },
  profile: { title: 'Profile', sub: 'Detailed user view — usage, sessions and policies' },
  tools: { title: 'Tools & Vendors', sub: 'All approved and detected AI tools' },
  models: { title: 'Models & Tokens', sub: 'AI-native efficiency metrics across providers' },
  budgets: { title: 'Budgets', sub: 'Limits, utilization and alerts' },
  recommendations: { title: 'Recommendations', sub: 'AI-generated optimizations, ranked by projected savings' },
  shadow: { title: 'Shadow AI', sub: 'Detected un-approved tools across expenses, SSO and network' },
  approvals: { title: 'Approvals', sub: 'Requests for new AI tools' },
  forecast: { title: 'Forecast', sub: 'Projected spend based on 60-day trajectory' },
  settings: { title: 'Settings', sub: 'Integrations, guardrails and access' },
};
