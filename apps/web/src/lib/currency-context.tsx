'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, fmtMoney } from './formatters';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  fmt: (n: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('usagely.currency') as Currency | null;
    if (stored && ['USD', 'BRL', 'EUR'].includes(stored)) {
      setCurrencyState(stored);
    }
    setMounted(true);
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('usagely.currency', c);
  };

  const fmt = (n: number) => fmtMoney(n, currency);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
