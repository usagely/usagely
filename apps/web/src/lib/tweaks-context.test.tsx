// @vitest-environment jsdom

// These tests pin the mounted-flag SSR-safety pattern in TweaksProvider.
// A lazy-init useState refactor (e.g. useState(() => loadTweaks())) would
// break the "SSR render returns defaults" test because localStorage is not
// available on the server. That failure is intentional — that refactor is
// unsafe for SSR. See issue #6 v1 for the bug class being pinned.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { TweaksProvider, useTweaks } from './tweaks-context';
import type { Tweaks } from './tweaks-context';

const DEFAULTS: Tweaks = {
  edition: 'oss',
  theme: 'dark',
  density: 'default',
  chart: 'area',
  currency: 'USD',
  layout: 'sidebar',
};

function Consumer() {
  const { tweaks, setTweak } = useTweaks();
  return (
    <div>
      <span data-testid="theme">{tweaks.theme}</span>
      <span data-testid="density">{tweaks.density}</span>
      <span data-testid="layout">{tweaks.layout}</span>
      <button
        data-testid="set-light"
        onClick={() => setTweak('theme', 'light')}
      />
    </div>
  );
}

describe('TweaksProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-density');
  });

  it('SSR renderToString returns default tweaks', () => {
    const html = renderToString(
      <TweaksProvider>
        <Consumer />
      </TweaksProvider>,
    );
    expect(html).toContain('dark');
    expect(html).toContain('default');
    expect(html).toContain('sidebar');
  });

  it('after mount, persisted values from localStorage take effect', async () => {
    localStorage.setItem(
      'lai.tweaks',
      JSON.stringify({ ...DEFAULTS, theme: 'light', density: 'compact' }),
    );
    render(
      <TweaksProvider>
        <Consumer />
      </TweaksProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('light');
      expect(screen.getByTestId('density').textContent).toBe('compact');
    });
  });

  it('setTweak writes to localStorage and updates DOM attributes', async () => {
    render(
      <TweaksProvider>
        <Consumer />
      </TweaksProvider>,
    );

    await act(async () => {
      screen.getByTestId('set-light').click();
    });

    const stored = JSON.parse(localStorage.getItem('lai.tweaks')!) as Tweaks;
    expect(stored.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('invalid stored JSON falls back to defaults', async () => {
    localStorage.setItem('lai.tweaks', 'not-json');
    render(
      <TweaksProvider>
        <Consumer />
      </TweaksProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('dark');
    });
  });

  it('useTweaks outside provider throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useTweaks must be used within TweaksProvider',
    );
    spy.mockRestore();
  });
});
