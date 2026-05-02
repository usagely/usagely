// @vitest-environment jsdom

// These tests pin the mounted-flag SSR-safety pattern in CurrencyProvider.
// A lazy-init useState refactor (e.g. useState(() => localStorage.getItem(...)))
// will break the "SSR render returns default" test because localStorage is not
// available on the server. That failure is intentional — that refactor is unsafe
// for SSR. See issue #6 v1 for the bug class being pinned.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { CurrencyProvider, useCurrency } from './currency-context';

function Consumer() {
  const { currency, fmt, setCurrency } = useCurrency();
  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <span data-testid="formatted">{fmt(0)}</span>
      <button data-testid="set-eur" onClick={() => setCurrency('EUR')} />
    </div>
  );
}

describe('CurrencyProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('SSR renderToString returns the default currency (USD)', () => {
    // renderToString runs without browser globals — proves the server-safe
    // default. If someone swaps in lazy-init useState(() => localStorage.getItem(...))
    // this test throws because localStorage is undefined on the server.
    const html = renderToString(
      <CurrencyProvider>
        <Consumer />
      </CurrencyProvider>,
    );
    // Default currency is USD; fmtMoney(0, 'USD') => "$0"
    expect(html).toContain('$0');
    expect(html).toContain('USD');
  });

  it('after mount, persisted value from localStorage takes effect', async () => {
    localStorage.setItem('usagely.currency', 'BRL');
    render(
      <CurrencyProvider>
        <Consumer />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('currency').textContent).toBe('BRL');
    });
  });

  it('setCurrency writes to localStorage', async () => {
    render(
      <CurrencyProvider>
        <Consumer />
      </CurrencyProvider>,
    );

    await act(async () => {
      screen.getByTestId('set-eur').click();
    });

    expect(localStorage.getItem('usagely.currency')).toBe('EUR');
    await waitFor(() => {
      expect(screen.getByTestId('currency').textContent).toBe('EUR');
    });
  });

  it('invalid stored value falls back to default', async () => {
    localStorage.setItem('usagely.currency', 'GARBAGE');
    render(
      <CurrencyProvider>
        <Consumer />
      </CurrencyProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('currency').textContent).toBe('USD');
    });
  });

  it('useCurrency outside provider throws', () => {
    // Suppress console.error from React for the unhandled error boundary
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useCurrency must be used within CurrencyProvider',
    );
    spy.mockRestore();
  });
});
