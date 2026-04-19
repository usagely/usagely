'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/src/lib/api/client';
import type { RecommendationsResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { fmtMoney } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Callout } from '@/src/components/ui/callout';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { EnterpriseLock } from '@/src/components/ui/enterprise-lock';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardBFlush: { padding: 0 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' } as React.CSSProperties,
};

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [locked, setLocked] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const { fmt } = useCurrency();

  useEffect(() => {
    api.recommendations()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLocked(true);
        else console.error(err);
      });
  }, []);

  if (locked) return <EnterpriseLock feature="Recommendations" description="AI-generated cost optimization recommendations with projected savings and confidence scores. Available on the Enterprise plan." />;
  if (!data) return <div style={S.pageBody}><div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div><Skeleton className="h-[400px] rounded-lg" /></div>;

  const total = data.recommendations.reduce((a, r) => a + r.savings_usd, 0);
  const accepted = data.recommendations.filter(r => applied[r.id]).reduce((a, r) => a + r.savings_usd, 0);

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Open recommendations" value={String(data.recommendations.length)} />
        <KpiCard label="Potential savings / mo" value={fmt(total)} />
        <KpiCard label="Accepted this mo" value={fmt(accepted)} delta={accepted > 0 ? 1 : undefined} deltaDirGood="up" />
        <KpiCard label="Accuracy (realized)" value="92%" delta={0.04} deltaDirGood="up" />
      </div>

      <Callout tone="accent">
        <Icon name="bolt" size={15} />
        <div>
          <strong>Usagely has found {fmt(total)} in potential monthly savings.</strong>{' '}
          Apply recommendations to propagate changes to your models, routing rules and licenses automatically.
        </div>
      </Callout>

      <div style={S.card}>
        <div style={S.cardBFlush}>
          {data.recommendations.map(r => {
            const isApplied = applied[r.id];
            return (
              <div key={r.id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '1fr 180px 160px 120px', gap: 18, alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                    <Chip>{r.scope}</Chip>
                    <Chip tone={r.effort === 'low' ? 'accent' : 'warn'}>{r.effort} effort</Chip>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{r.reason}</div>
                </div>
                <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Projected savings</div><div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 15 }}>{fmt(r.savings_usd)}/mo</div></div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <ProgressBar pct={r.confidence * 100} tone="accent" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{(r.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {isApplied ? <Chip tone="accent" dot>applied</Chip> : (
                    <>
                      <button style={S.btn}>Dismiss</button>
                      <button style={S.btnPrimary} onClick={() => setApplied(a => ({ ...a, [r.id]: true }))}>Apply</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
