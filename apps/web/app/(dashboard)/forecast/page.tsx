'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/src/lib/api/client';
import type { ForecastResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtMoney, fmtDelta } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { EnterpriseLock } from '@/src/components/ui/enterprise-lock';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardB: { padding: '14px 16px' },
  cardBFlush: { padding: 0 },
};

export default function ForecastPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [locked, setLocked] = useState(false);
  const { fmt } = useCurrency();

  useEffect(() => {
    api.forecast()
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) setLocked(true);
        else console.error(err);
      });
  }, []);

  if (locked) return <EnterpriseLock feature="Forecast" description="Projected spend based on usage trajectory with scenario modeling. Available on the Enterprise plan." />;
  if (!data) return <div style={S.pageBody}><div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div><Skeleton className="h-[350px] rounded-lg" /></div>;

  const projectedTotal = data.projected_spend.reduce((a, d) => a + d.value, 0);
  const histVals = data.historical_spend.map(d => d.value);
  const projVals = data.projected_spend.map(d => d.value);
  const all = [...histVals, ...projVals];
  const max = Math.max(...all);
  const histLen = histVals.length;

  const w = 920, h = 280, padL = 44, padR = 12, padT = 12, padB = 28;
  const iw = w - padL - padR, ih = h - padT - padB;
  const xs = all.map((_, i) => padL + (i / Math.max(all.length - 1, 1)) * iw);
  const ys = all.map(v => padT + ih - ((v) / max) * ih);

  const histPath = xs.slice(0, histLen).map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const projPath = xs.slice(histLen - 1).map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[histLen - 1 + i].toFixed(1)}`).join(' ');

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Next 30d forecast" value={fmt(projectedTotal)} delta={0.18} />
        <KpiCard label="Q2 landing (projected)" value={fmt(projectedTotal + 90000)} delta={0.24} />
        <KpiCard label="Budget vs forecast" value={fmt(11400)} delta={0.3} deltaDirGood="down" />
        <KpiCard label="Confidence" value="82%" delta={0.03} deltaDirGood="up" />
      </div>

      <div style={S.card}>
        <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>60 days history · 30 days forecast</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Auto-regressive projection with 80% confidence band</div></div></div>
        <div style={S.cardB}>
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
            {[0, 1, 2, 3, 4].map(i => {
              const y = padT + (i / 4) * ih;
              const v = max - (i / 4) * max;
              return <g key={i}><line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--hairline)" strokeDasharray="2 4" /><text x={padL - 8} y={y + 3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{fmtMoney(v)}</text></g>;
            })}
            <path d={histPath} stroke="var(--chart-1)" strokeWidth="1.8" fill="none" />
            <path d={projPath} stroke="var(--chart-2)" strokeWidth="1.8" fill="none" strokeDasharray="4 3" />
            {histLen > 0 && <line x1={xs[histLen - 1]} x2={xs[histLen - 1]} y1={padT} y2={padT + ih} stroke="var(--muted)" strokeDasharray="2 2" opacity={0.5} />}
            {histLen > 0 && <text x={xs[histLen - 1] + 6} y={padT + 14} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">today</text>}
          </svg>
        </div>
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Drivers of projected growth</div></div></div>
          <div style={S.cardB}>
            {data.drivers.map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{d.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{(d.pct * 100).toFixed(0)}%</span>
                </div>
                <ProgressBar pct={d.pct * 100} tone="accent" />
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Scenarios</div></div></div>
          <div style={S.cardB}>
            {data.scenarios.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
                <Chip tone={s.tone === 'info' ? 'accent' : s.tone === 'accent' ? 'accent' : s.tone === 'warn' ? 'warn' : 'danger'} dot>{s.name}</Chip>
                <div style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{fmt(s.value)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>{fmtDelta(s.delta)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
