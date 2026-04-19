'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { ToolsResponse, Tool } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtMoney, fmtDelta } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Sparkline } from '@/src/components/charts/sparkline';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardBFlush: { padding: 0 },
  toolbar: { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--hairline)' },
  seg: { display: 'flex', gap: 0, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' },
  segBtn: (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
    background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--ink)' : 'var(--muted)',
    borderRadius: active ? 5 : 0, whiteSpace: 'nowrap' as const,
  }),
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  th: { padding: '8px 16px', textAlign: 'left' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  thRight: { padding: '8px 12px', textAlign: 'right' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  td: { padding: '10px 16px' },
  tdRight: { padding: '10px 12px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)' as const },
};

function ToolsSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

const CATEGORIES = ['All', 'LLM API', 'Coding', 'Chat seat', 'Image', 'Video', 'Voice', 'Audio'];

function statusChip(s: string) {
  if (s === 'approved') return <Chip tone="accent" dot>approved</Chip>;
  if (s === 'pending') return <Chip tone="warn" dot>pending</Chip>;
  if (s === 'shadow') return <Chip tone="danger" dot>shadow</Chip>;
  return <Chip>{s}</Chip>;
}

export default function ToolsPage() {
  const [data, setData] = useState<ToolsResponse | null>(null);
  const [filter, setFilter] = useState('All');
  const { fmt } = useCurrency();
  const { tweaks } = useTweaks();

  useEffect(() => {
    api.tools(filter === 'All' ? undefined : filter).then(setData).catch(console.error);
  }, [filter]);

  if (!data) return <ToolsSkeleton />;

  const rows = data.tools;

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Tools in use" value="34" delta={0.12} deltaDirGood="up" spark={<Sparkline data={[24, 25, 27, 28, 30, 31, 32, 34]} color="var(--chart-1)" style={tweaks.chart} />} />
        <KpiCard label="Unapproved (shadow)" value="5" delta={0.4} deltaDirGood="down" />
        <KpiCard label="Monthly subscription" value={fmt(12540)} delta={0.04} />
        <KpiCard label="Usage-based spend" value={fmt(92210)} delta={0.31} />
      </div>

      <div style={S.card}>
        <div style={S.toolbar}>
          <div style={S.seg}>
            {CATEGORIES.map(c => (
              <button key={c} style={S.segBtn(filter === c)} onClick={() => setFilter(c)}>{c}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button style={S.btn}><Icon name="plus" size={13} /> Connect tool</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>
            <th style={S.th}>Tool</th><th style={S.th}>Category</th><th style={S.th}>Status</th><th style={S.th}>Provisioning</th>
            <th style={S.thRight}>Seats</th><th style={S.thRight}>Spend (30d)</th><th style={S.thRight}>Δ</th>
            <th style={{ ...S.th, width: 140 }}>Trend</th><th style={S.th}></th>
          </tr></thead>
          <tbody>
            {rows.map(t => {
              const delta = t.prev > 0 ? (t.spend - t.prev) / t.prev : null;
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}>{t.vendor[0]}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <span style={{ fontWeight: 500 }}>{t.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.vendor}</span>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}>{t.category}</td>
                  <td style={S.td}>{statusChip(t.status)}</td>
                  <td style={S.td}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{t.provisioning}</span></td>
                  <td style={S.tdRight}>{t.seats ?? '—'}</td>
                  <td style={S.tdRight}>{fmt(t.spend)}</td>
                  <td style={{ ...S.tdRight, color: delta == null ? 'var(--muted)' : delta >= 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    {delta == null ? '—' : fmtDelta(delta)}
                  </td>
                  <td style={S.td}>
                    <Sparkline data={Array.from({ length: 14 }, () => 30 + Math.random() * 100)} color="var(--chart-2)" style={tweaks.chart} w={120} h={24} />
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}><Icon name="chevron-right" size={14} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
