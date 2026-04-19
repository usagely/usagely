'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/src/lib/api/client';
import type { ShadowResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { fmtMoney } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Callout } from '@/src/components/ui/callout';
import { EnterpriseLock } from '@/src/components/ui/enterprise-lock';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardBFlush: { padding: 0 },
  th: { padding: '8px 16px', textAlign: 'left' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  thRight: { padding: '8px 12px', textAlign: 'right' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  td: { padding: '10px 16px' },
  tdRight: { padding: '10px 12px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)' as const },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' } as React.CSSProperties,
};

export default function ShadowPage() {
  const [data, setData] = useState<ShadowResponse | null>(null);
  const [locked, setLocked] = useState(false);
  const { fmt } = useCurrency();

  useEffect(() => {
    api.shadow()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLocked(true);
        else console.error(err);
      });
  }, []);

  if (locked) return <EnterpriseLock feature="Shadow AI" description="Detect and manage unapproved AI tools used across your organization. Available on the Enterprise plan." />;
  if (!data) return <div style={S.pageBody}><Skeleton className="h-[60px] rounded-lg" /><div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div><Skeleton className="h-[350px] rounded-lg" /></div>;

  const totalSpend = data.shadow_tools.reduce((a, s) => a + s.monthly_usd, 0);
  const totalUsers = data.shadow_tools.reduce((a, s) => a + s.users_count, 0);

  return (
    <div style={S.pageBody}>
      <Callout tone="danger">
        <Icon name="warn" size={15} />
        <div><strong>{data.shadow_tools.length} unapproved AI tools detected</strong> — combined monthly spend is {fmt(totalSpend)} and affects {totalUsers} people. Review and either sanction, block, or consolidate.</div>
      </Callout>
      <div style={S.kpiGrid}>
        <KpiCard label="Unapproved tools" value={String(data.shadow_tools.length)} />
        <KpiCard label="People affected" value={String(totalUsers)} />
        <KpiCard label="Shadow spend / mo" value={fmt(totalSpend)} />
        <KpiCard label="Policy coverage" value="74%" delta={0.12} deltaDirGood="up" />
      </div>
      <div style={S.card}>
        <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Detected tools</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>From expense reports, SSO logs and egress analysis</div></div></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>
            <th style={S.th}>Tool</th><th style={S.th}>Detection source</th><th style={S.th}>First seen</th>
            <th style={S.thRight}>Users</th><th style={S.thRight}>Monthly</th><th style={S.th}>Risk</th><th style={S.th}></th>
          </tr></thead>
          <tbody>
            {data.shadow_tools.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                <td style={{ ...S.td, fontWeight: 500 }}>{s.tool_name}</td>
                <td style={S.td}><Chip>{s.source}</Chip></td>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{s.first_seen}</td>
                <td style={S.tdRight}>{s.users_count}</td>
                <td style={S.tdRight}>{fmt(s.monthly_usd)}</td>
                <td style={S.td}><Chip tone={s.risk === 'high' ? 'danger' : s.risk === 'medium' ? 'warn' : 'info'} dot>{s.risk}</Chip></td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button style={S.btn}>Block</button>
                    <button style={S.btnPrimary}>Sanction</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
