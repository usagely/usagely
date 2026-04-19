'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { BudgetsResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { fmtMoney } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardB: { padding: '14px 16px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink-2)', cursor: 'pointer' } as React.CSSProperties,
};

function BudgetsSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div>
      <div style={S.grid2}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[220px] rounded-lg" />)}
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const [data, setData] = useState<BudgetsResponse | null>(null);
  const { fmt } = useCurrency();

  useEffect(() => {
    api.budgets().then(setData).catch(console.error);
  }, []);

  if (!data) return <BudgetsSkeleton />;

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Active budgets" value="6" />
        <KpiCard label="Q2 committed" value={fmt(320000)} />
        <KpiCard label="Q2 utilized" value="68%" delta={0.05} deltaDirGood="down" />
        <KpiCard label="Forecast overrun" value={fmt(11400)} delta={0.3} deltaDirGood="down" />
      </div>

      <div style={S.grid2}>
        {data.budgets.map(b => {
          const pct = b.limit_usd > 0 ? b.used_usd / b.limit_usd : 0;
          const over = pct >= 1;
          const warn = pct >= b.alert_pct / 100 && !over;
          const tone = over ? 'danger' : warn ? 'warn' : 'accent';
          return (
            <div key={b.id} style={S.card}>
              <div style={S.cardH}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.scope}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{b.period} · alert at {b.alert_pct}%</div>
                </div>
                <div style={{ flex: 1 }} />
                {over && <Chip tone="danger" dot>over budget</Chip>}
                {warn && <Chip tone="warn" dot>at risk</Chip>}
                {!over && !warn && <Chip tone="accent" dot>on track</Chip>}
              </div>
              <div style={S.cardB}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Used</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}>{fmt(b.used_usd)}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Limit</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}>{fmt(b.limit_usd)}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Remaining</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}>{fmt(b.limit_usd - b.used_usd)}</div></div>
                  <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Utilization</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500 }}>{(pct * 100).toFixed(0)}%</div></div>
                </div>
                <div style={{ marginTop: 14 }}><ProgressBar pct={Math.min(100, pct * 100)} tone={tone} h={10} /></div>
                <div style={{ display: 'flex', marginTop: 12, gap: 8 }}>
                  <button style={S.btn}>Edit</button>
                  <button style={S.btnGhost}>Alert rules</button>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>resets May 1</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
