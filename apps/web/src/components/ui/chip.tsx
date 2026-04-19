import type { ReactNode } from 'react';

export type ChipTone = '' | 'accent' | 'danger' | 'warn' | 'info';

export interface ChipProps {
  tone?: ChipTone;
  dot?: boolean;
  children: ReactNode;
}

const toneClasses: Record<string, string> = {
  '': 'bg-[var(--surface-2)] text-[var(--ink-2)] border-[var(--hairline)]',
  accent: 'bg-[var(--accent-bg)] text-[var(--accent-ink)] border-transparent',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)] border-transparent',
  warn: 'bg-[var(--warn-bg)] text-[oklch(0.42_0.12_75)] border-transparent',
  info: 'bg-[var(--info-bg)] text-[var(--info)] border-transparent',
};

export function Chip({ tone = '', dot, children }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] px-2 py-0.5 rounded-full text-[11px] font-medium border leading-[1.4] whitespace-nowrap ${toneClasses[tone] ?? toneClasses['']}`}
    >
      {dot && (
        <span className="w-[5px] h-[5px] rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
