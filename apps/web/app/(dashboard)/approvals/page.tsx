'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/src/lib/api/client';
import type { ApprovalsResponse, Approval } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { fmtMoney } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Avatar } from '@/src/components/ui/avatar';
import { EnterpriseLock } from '@/src/components/ui/enterprise-lock';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardBFlush: { padding: 0 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' } as React.CSSProperties,
};

function statusChip(s: string) {
  if (s === 'pending') return <Chip tone="warn" dot>pending</Chip>;
  if (s === 'approved') return <Chip tone="accent" dot>approved</Chip>;
  return <Chip tone="danger" dot>denied</Chip>;
}

export default function ApprovalsPage() {
  const [list, setList] = useState<Approval[] | null>(null);
  const [locked, setLocked] = useState(false);
  const { fmt } = useCurrency();

  useEffect(() => {
    api.approvals()
      .then(d => setList(d.approvals))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLocked(true);
        else console.error(err);
      });
  }, []);

  if (locked) return <EnterpriseLock feature="Approvals" description="Workflow for requesting and approving new AI tool purchases. Available on the Enterprise plan." />;
  if (list === null) return <div style={S.pageBody}><div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div><Skeleton className="h-[400px] rounded-lg" /></div>;

  const pending = list.filter(p => p.status === 'pending').length;
  const approved = list.filter(p => p.status === 'approved').length;

  const update = (id: string, status: 'approved' | 'denied') => {
    setList(ls => ls ? ls.map(p => p.id === id ? { ...p, status } : p) : ls);
  };

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Pending" value={String(pending)} />
        <KpiCard label="Avg decision time" value="1.8d" delta={-0.2} deltaDirGood="down" />
        <KpiCard label="Approved (30d)" value={String(approved)} />
        <KpiCard label="Est. added spend" value={fmt(4200)} />
      </div>
      <div style={S.card}>
        <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Tool requests</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Queue sorted by recency</div></div></div>
        <div style={S.cardBFlush}>
          {list.map(p => (
            <div key={p.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '40px 1fr 160px 220px', gap: 14, alignItems: 'center' }}>
              <Avatar name={p.requester_name} lg />
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <strong>{p.tool_name}</strong>
                  {statusChip(p.status)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.requester_name} · {p.created_at}</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>{p.reason}</div>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Est. monthly</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{fmt(p.cost_est_usd)}</div></div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                {p.status === 'pending' ? (
                  <>
                    <button style={S.btn} onClick={() => update(p.id, 'denied')}>Deny</button>
                    <button style={S.btn}>Request info</button>
                    <button style={S.btnPrimary} onClick={() => update(p.id, 'approved')}>Approve</button>
                  </>
                ) : <button style={{ ...S.btn, border: 'none', background: 'transparent', color: 'var(--ink-2)' }}>View</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
