'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { AnomaliesResponse } from '@/src/lib/api/types';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardBFlush: { padding: 0 },
  toolbar: { padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--hairline)' },
  seg: { display: 'flex', gap: 0, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden' },
  segBtn: (active: boolean): React.CSSProperties => ({
    padding: '5px 12px', fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
    background: active ? 'var(--surface)' : 'transparent', color: active ? 'var(--ink)' : 'var(--muted)',
    borderRadius: active ? 5 : 0,
  }),
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' } as React.CSSProperties,
};

function AnomaliesSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

const SEVERITY_FILTERS = ['All', 'Critical', 'Warning', 'Info'];

export default function AnomaliesPage() {
  const [data, setData] = useState<AnomaliesResponse | null>(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.anomalies().then(setData).catch(console.error);
  }, []);

  if (!data) return <AnomaliesSkeleton />;

  const severityMap: Record<string, string> = { danger: 'Critical', warn: 'Warning', info: 'Info' };
  const filtered = filter === 'All' ? data.anomalies : data.anomalies.filter(a => severityMap[a.severity] === filter);

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Open anomalies" value="4" delta={0.3} deltaDirGood="down" />
        <KpiCard label="Avg resolution" value="6.2h" delta={-0.18} deltaDirGood="down" />
        <KpiCard label="Signal / noise" value="84%" delta={0.04} deltaDirGood="up" />
        <KpiCard label="Auto-resolved (7d)" value="12" />
      </div>

      <div style={S.card}>
        <div style={S.toolbar}>
          <div style={S.seg}>
            {SEVERITY_FILTERS.map(f => (
              <button key={f} style={S.segBtn(filter === f)} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button style={S.btn}><Icon name="filter" size={13} /> Filter</button>
          <button style={S.btn}><Icon name="settings" size={13} /> Detection rules</button>
        </div>
        <div style={S.cardBFlush}>
          {filtered.map(a => {
            const borderLeft = a.severity === 'danger' ? 'var(--danger)' : a.severity === 'warn' ? 'var(--warn)' : 'var(--info)';
            const chipTone = a.severity === 'danger' ? 'danger' : a.severity === 'warn' ? 'warn' : 'info';
            return (
              <div key={a.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', borderLeft: `3px solid ${borderLeft}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Chip tone={chipTone}>{a.severity}</Chip>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{a.detected_at} · {a.team_name} · owner {a.owner_name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={S.btn}>Snooze</button>
                  <button style={S.btn}>Acknowledge</button>
                  <button style={S.btnPrimary}>Investigate</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
