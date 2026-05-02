import { describe, it, expect, vi } from 'vitest';

const { mockCreateAuthClient } = vi.hoisted(() => {
  const mockCreateAuthClient = vi.fn(() => ({
    $Infer: { Session: {} },
  }));
  return { mockCreateAuthClient };
});

vi.mock('better-auth/client', () => ({
  createAuthClient: mockCreateAuthClient,
}));

import { authClient } from './auth-client';

describe('auth-client', () => {
  it('exports the auth client instance', () => {
    expect(authClient).toBeDefined();
    expect(mockCreateAuthClient).toHaveBeenCalledOnce();
  });

  it('passes baseURL defaulting to localhost:3000', () => {
    const config = mockCreateAuthClient.mock.calls[0][0] as Record<string, unknown>;
    expect(config.baseURL).toBe(
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    );
  });

  it('client exposes $Infer for session type extraction', () => {
    expect(authClient.$Infer).toBeDefined();
    expect(authClient.$Infer.Session).toBeDefined();
  });
});
