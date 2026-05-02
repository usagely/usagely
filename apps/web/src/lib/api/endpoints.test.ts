import { describe, it, expect } from 'vitest';
import { ENDPOINTS } from './endpoints';

describe('api/endpoints', () => {
  describe('static paths', () => {
    it.each([
      ['DASHBOARD', '/api/v1/dashboard'],
      ['TEAMS', '/api/v1/teams'],
      ['PEOPLE', '/api/v1/people'],
      ['TOOLS', '/api/v1/tools'],
      ['MODELS', '/api/v1/models'],
      ['BUDGETS', '/api/v1/budgets'],
      ['ANOMALIES', '/api/v1/anomalies'],
      ['RECOMMENDATIONS', '/api/v1/recommendations'],
      ['SHADOW', '/api/v1/shadow'],
      ['APPROVALS', '/api/v1/approvals'],
      ['FORECAST', '/api/v1/forecast'],
      ['SETTINGS', '/api/v1/settings'],
    ])('ENDPOINTS.%s is %s', (key, expected) => {
      expect(ENDPOINTS[key as keyof typeof ENDPOINTS]).toBe(expected);
    });
  });

  describe('PEOPLE_BY_EMAIL', () => {
    it('builds path for a simple email', () => {
      expect(ENDPOINTS.PEOPLE_BY_EMAIL('alice@co.com')).toBe(
        '/api/v1/people/alice%40co.com',
      );
    });

    it('encodes special characters', () => {
      expect(ENDPOINTS.PEOPLE_BY_EMAIL('a+b@co.com')).toBe(
        '/api/v1/people/a%2Bb%40co.com',
      );
    });
  });

  describe('APPROVAL_BY_ID', () => {
    it('builds path for a plain id', () => {
      expect(ENDPOINTS.APPROVAL_BY_ID('abc-123')).toBe('/api/v1/approvals/abc-123');
    });

    it('encodes special characters in id', () => {
      expect(ENDPOINTS.APPROVAL_BY_ID('id/with spaces')).toBe(
        '/api/v1/approvals/id%2Fwith%20spaces',
      );
    });
  });

  it('exports exactly 14 keys', () => {
    expect(Object.keys(ENDPOINTS)).toHaveLength(14);
  });
});
