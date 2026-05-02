import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from './client';

describe('ApiError', () => {
  it('extends Error with status and path', () => {
    const err = new ApiError(404, '/api/v1/teams');
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.path).toBe('/api/v1/teams');
    expect(err.message).toBe('API error 404: /api/v1/teams');
  });

  it('includes status in the message', () => {
    const err = new ApiError(500, '/test');
    expect(err.message).toContain('500');
    expect(err.message).toContain('/test');
  });
});

describe('api client', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
  });

  function jsonOk(data: unknown) {
    return { ok: true, status: 200, json: () => Promise.resolve(data) };
  }

  function jsonError(status: number) {
    return { ok: false, status, json: () => Promise.resolve({ error: 'fail' }) };
  }

  describe('happy path (200 + JSON)', () => {
    it('returns parsed JSON from dashboard', async () => {
      const body = { totalSpend: 1000 };
      mockFetch.mockResolvedValueOnce(jsonOk(body));

      const result = await api.dashboard();
      expect(result).toEqual(body);
    });

    it('sends credentials include and Content-Type header', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({}));

      await api.dashboard();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/dashboard',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('URL composition', () => {
    it('people without team filter', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.people();
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/people');
    });

    it('people with team filter encodes query param', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.people('eng ops');
      expect(mockFetch.mock.calls[0][0]).toBe(
        'http://localhost:8080/api/v1/people?team=eng%20ops',
      );
    });

    it('profile encodes email in path', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({}));
      await api.profile('a@b.com');
      expect(mockFetch.mock.calls[0][0]).toBe(
        'http://localhost:8080/api/v1/people/a%40b.com',
      );
    });

    it('tools with category filter', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.tools('coding');
      expect(mockFetch.mock.calls[0][0]).toBe(
        'http://localhost:8080/api/v1/tools?category=coding',
      );
    });

    it('tools without category', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk([]));
      await api.tools();
      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8080/api/v1/tools');
    });
  });

  describe('updateApproval', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockResolvedValueOnce(jsonOk({ ok: true }));
      await api.updateApproval('req-1', 'approved');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:8080/api/v1/approvals/req-1');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body as string)).toEqual({ status: 'approved' });
    });
  });

  describe('error handling', () => {
    it('throws ApiError on 4xx response', async () => {
      mockFetch.mockResolvedValueOnce(jsonError(404));
      await expect(api.teams()).rejects.toThrow(ApiError);
    });

    it('ApiError contains status and path for 404', async () => {
      mockFetch.mockResolvedValueOnce(jsonError(404));
      try {
        await api.teams();
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
        expect((e as ApiError).path).toBe('/api/v1/teams');
      }
    });

    it('throws ApiError on 5xx response', async () => {
      mockFetch.mockResolvedValueOnce(jsonError(500));
      await expect(api.dashboard()).rejects.toThrow(ApiError);
    });

    it('propagates network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
      await expect(api.dashboard()).rejects.toThrow(TypeError);
    });

    it('network error preserves original message', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(api.dashboard()).rejects.toThrow('Failed to fetch');
    });
  });

  describe('all simple endpoints call correct paths', () => {
    it.each([
      ['dashboard', '/api/v1/dashboard'],
      ['teams', '/api/v1/teams'],
      ['models', '/api/v1/models'],
      ['budgets', '/api/v1/budgets'],
      ['anomalies', '/api/v1/anomalies'],
      ['settings', '/api/v1/settings'],
      ['recommendations', '/api/v1/recommendations'],
      ['shadow', '/api/v1/shadow'],
      ['approvals', '/api/v1/approvals'],
      ['forecast', '/api/v1/forecast'],
    ])('api.%s() calls %s', async (method, path) => {
      mockFetch.mockResolvedValueOnce(jsonOk({}));
      await (api as Record<string, () => Promise<unknown>>)[method]();
      expect(mockFetch.mock.calls[0][0]).toBe(`http://localhost:8080${path}`);
    });
  });
});
