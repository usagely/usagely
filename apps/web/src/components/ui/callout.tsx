import type { ReactNode } from 'react';

export interface CalloutProps {
  tone?: 'accent' | 'danger' | 'warn' | 'info';
  children: ReactNode;
}

const toneClasses: Record<string, string> = {
  '': 'bg-[var(--surface-2)] border-[var(--hairline)] text-[var(--ink-2)]',
  accent: 'bg-[var(--accent-bg)] border-transparent text-[var(--accent-ink)]',
  danger: 'bg-[var(--danger-bg)] border-transparent text-[var(--danger)]',
  warn: 'bg-[var(--warn-bg)] border-transparent text-[oklch(0.42_0.12_75)]',
  info: 'bg-[var(--info-bg)] border-transparent text-[var(--info)]',
};

export function Callout({ tone, children }: CalloutProps) {
  return (
    <div
      className={`flex gap-2.5 p-2.5 rounded border text-[12.5px] ${toneClasses[tone ?? '']}`}
    >
      {children}
    </div>
  );
}
