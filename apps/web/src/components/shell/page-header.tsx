'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@/src/components/ui/icon';
import { Chip } from '@/src/components/ui/chip';
import { PAGE_META } from '@/src/lib/nav';
import { useState } from 'react';

const TIME_RANGES = ['7d', '30d', '90d', 'YTD'] as const;

export function PageHeader() {
  const pathname = usePathname();
  const current = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const meta = PAGE_META[current] ?? { title: current, sub: '' };
  const [range, setRange] = useState<string>('30d');

  return (
    <div
      className="flex items-center gap-[18px] bg-[var(--surface)] border-b border-[var(--hairline)] sticky top-0 z-[5]"
      style={{ padding: '18px 28px' }}
    >
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-[6px] text-[12px] text-[var(--muted)]">
          <span>Acme Co.</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span>FinOps</span>
          <span style={{ opacity: 0.5 }}>/</span>
          <span className="text-[var(--ink)]">{meta.title}</span>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="text-[17px] font-semibold" style={{ letterSpacing: '-0.01em' }}>
            {meta.title}
          </div>
          <Chip tone="accent" dot>live</Chip>
        </div>
        <div className="text-[12px] text-[var(--muted)]">{meta.sub}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-[6px] border border-[var(--hairline)] overflow-hidden">
          {TIME_RANGES.map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={`text-[12px] font-medium cursor-pointer ${
                range === t
                  ? 'bg-[var(--surface-2)] text-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]'
              }`}
              style={{ padding: '5px 10px' }}
            >
              {t}
            </button>
          ))}
        </div>

        <button className="inline-flex items-center gap-1.5 h-8 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] text-[13px] text-[var(--ink-2)] cursor-pointer hover:bg-[var(--surface-2)] hover:text-[var(--ink)]" style={{ padding: '0 10px' }}>
          <Icon name="filter" size={13} />
          Filter
        </button>

        <button className="inline-flex items-center gap-1.5 h-8 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface)] text-[13px] text-[var(--ink-2)] cursor-pointer hover:bg-[var(--surface-2)] hover:text-[var(--ink)]" style={{ padding: '0 10px' }}>
          <Icon name="download" size={13} />
          Export
        </button>

        <button className="inline-flex items-center gap-1.5 h-8 rounded-[6px] border border-transparent bg-[var(--ink)] text-[var(--bg)] text-[13px] font-medium cursor-pointer hover:opacity-90" style={{ padding: '0 12px' }}>
          <Icon name="plus" size={13} />
          Create budget
        </button>
      </div>
    </div>
  );
}
