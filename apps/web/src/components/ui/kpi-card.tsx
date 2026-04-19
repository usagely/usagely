import type { ReactNode } from 'react';
import { Icon } from './icon';
import { fmtDelta } from '@/src/lib/formatters';

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  deltaDirGood?: 'up' | 'down';
  spark?: ReactNode;
}

export function KpiCard({ label, value, delta, deltaDirGood = 'down', spark }: KpiCardProps) {
  const goodIsDown = deltaDirGood === 'down';

  let deltaCls = 'text-[var(--muted)]';
  if (delta != null) {
    if (delta >= 0) {
      deltaCls = goodIsDown ? 'text-[var(--danger)]' : 'text-[var(--accent)]';
    } else {
      deltaCls = goodIsDown ? 'text-[var(--accent)]' : 'text-[var(--danger)]';
    }
  }

  return (
    <div className="relative overflow-hidden bg-[var(--surface)] border border-[var(--hairline)] rounded-[var(--radius-lg)] px-4 py-3.5 flex flex-col gap-1.5">
      <div className="text-[11.5px] text-[var(--muted)] uppercase tracking-[0.06em]">
        {label}
      </div>
      <div className="font-mono text-[26px] font-medium tracking-[-0.02em] text-[var(--ink)]">
        {value}
      </div>
      {delta != null && (
        <div className={`inline-flex items-center gap-1 text-[11.5px] font-mono ${deltaCls}`}>
          <Icon name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={11} />
          {fmtDelta(delta)}{' '}
          <span className="text-[var(--muted)]">vs prev period</span>
        </div>
      )}
      {spark && (
        <div className="absolute right-2.5 bottom-2.5 opacity-60">
          {spark}
        </div>
      )}
    </div>
  );
}
