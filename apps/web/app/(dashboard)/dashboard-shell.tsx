'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@/src/components/shell/sidebar';
import { Topbar } from '@/src/components/shell/topbar';
import { PageHeader } from '@/src/components/shell/page-header';
import { CurrencyProvider } from '@/src/lib/currency-context';
import { TweaksProvider, useTweaks } from '@/src/lib/tweaks-context';

function ShellInner({ children }: { children: ReactNode }) {
  const { tweaks } = useTweaks();

  return (
    <div
      className="grid min-h-screen bg-[var(--bg)] text-[var(--ink)]"
      style={
        tweaks.layout === 'sidebar'
          ? { gridTemplateColumns: '232px 1fr', gridTemplateRows: '1fr' }
          : { gridTemplateColumns: '1fr', gridTemplateRows: '56px 1fr' }
      }
    >
      {tweaks.layout === 'sidebar' ? (
        <Sidebar edition={tweaks.edition} />
      ) : (
        <Topbar />
      )}

      <main className="flex flex-col min-w-0">
        <PageHeader />
        {children}
      </main>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TweaksProvider>
      <CurrencyProvider>
        <ShellInner>{children}</ShellInner>
      </CurrencyProvider>
    </TweaksProvider>
  );
}
