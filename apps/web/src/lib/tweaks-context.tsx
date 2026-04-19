'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Edition = 'oss' | 'enterprise';
export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'default' | 'comfortable';
export type ChartStyle = 'line' | 'area' | 'bars';
export type Currency = 'USD' | 'BRL' | 'EUR';
export type Layout = 'sidebar' | 'topbar';

export interface Tweaks {
  edition: Edition;
  theme: Theme;
  density: Density;
  chart: ChartStyle;
  currency: Currency;
  layout: Layout;
}

const DEFAULTS: Tweaks = {
  edition: 'oss',
  theme: 'dark',
  density: 'default',
  chart: 'area',
  currency: 'USD',
  layout: 'sidebar',
};

const STORAGE_KEY = 'lai.tweaks';

interface TweaksContextType {
  tweaks: Tweaks;
  setTweaks: React.Dispatch<React.SetStateAction<Tweaks>>;
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

const TweaksContext = createContext<TweaksContextType | undefined>(undefined);

function loadTweaks(): Tweaks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function applyAttributes(tweaks: Tweaks) {
  document.documentElement.setAttribute('data-theme', tweaks.theme);
  document.documentElement.setAttribute('data-density', tweaks.density);
}

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadTweaks();
    setTweaks(stored);
    applyAttributes(stored);
    setMounted(true);
  }, []);

  // Persist + apply attributes on every change (after mount)
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    applyAttributes(tweaks);
  }, [tweaks, mounted]);

  const setTweak = useCallback(
    <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
      setTweaks((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <TweaksContext.Provider value={{ tweaks, setTweaks, setTweak }}>
      {children}
    </TweaksContext.Provider>
  );
}

export function useTweaks() {
  const context = useContext(TweaksContext);
  if (!context) {
    throw new Error('useTweaks must be used within TweaksProvider');
  }
  return context;
}
