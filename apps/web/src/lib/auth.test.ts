import { describe, it, expect, vi } from 'vitest';

const { mockPragma, MockDatabase, mockBetterAuth, mockJwt } = vi.hoisted(() => {
  const mockPragma = vi.fn();
  class MockDatabase {
    pragma = mockPragma;
  }
  const mockBetterAuth = vi.fn(() => ({ _mock: true }));
  const mockJwt = vi.fn((config: Record<string, unknown>) => ({ _plugin: 'jwt', config }));
  return { mockPragma, MockDatabase, mockBetterAuth, mockJwt };
});

vi.mock('better-sqlite3', () => ({ default: MockDatabase }));
vi.mock('better-auth', () => ({ betterAuth: mockBetterAuth }));
vi.mock('better-auth/plugins', () => ({ jwt: mockJwt }));

import { auth } from './auth';

describe('auth', () => {
  it('exports the betterAuth instance', () => {
    expect(auth).toBeDefined();
    expect(mockBetterAuth).toHaveBeenCalledOnce();
  });

  it('opens SQLite with WAL journal mode', () => {
    expect(mockPragma).toHaveBeenCalledWith('journal_mode = WAL');
  });

  describe('betterAuth config', () => {
    const config = mockBetterAuth.mock.calls[0][0] as Record<string, unknown>;

    it('sets appName to Usagely', () => {
      expect(config.appName).toBe('Usagely');
    });

    it('sets basePath to /api/auth', () => {
      expect(config.basePath).toBe('/api/auth');
    });

    it('enables email and password auth', () => {
      const ep = config.emailAndPassword as Record<string, unknown>;
      expect(ep.enabled).toBe(true);
      expect(ep.minPasswordLength).toBe(6);
      expect(ep.autoSignIn).toBe(true);
    });

    it('configures session with 7-day expiry and 1-day update age', () => {
      const session = config.session as Record<string, number>;
      expect(session.expiresIn).toBe(60 * 60 * 24 * 7);
      expect(session.updateAge).toBe(60 * 60 * 24);
    });

    it('includes one plugin (jwt)', () => {
      const plugins = config.plugins as unknown[];
      expect(plugins).toHaveLength(1);
      expect(mockJwt).toHaveBeenCalledOnce();
    });

    it('configures jwt with usagely issuer and audience', () => {
      const jwtConfig = mockJwt.mock.calls[0][0] as Record<string, Record<string, unknown>>;
      expect(jwtConfig.jwt.issuer).toBe('usagely');
      expect(jwtConfig.jwt.audience).toBe('usagely-api');
      expect(jwtConfig.jwt.expirationTime).toBe('7d');
    });

    it('jwt definePayload maps user and session fields', () => {
      const jwtConfig = mockJwt.mock.calls[0][0] as {
        jwt: { definePayload: (ctx: { user: Record<string, string>; session: Record<string, string> }) => unknown };
      };
      const payload = jwtConfig.jwt.definePayload({
        user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
        session: { id: 's1' },
      });
      expect(payload).toEqual({
        sub: 'u1',
        email: 'a@b.com',
        name: 'Alice',
        sessionId: 's1',
      });
    });
  });
});
