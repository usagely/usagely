'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { ModelsResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { fmtMoney, fmtNum } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardB: { padding: '14px 16px' },
  cardBFlush: { padding: 0 },
  th: { padding: '8px 16px', textAlign: 'left' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  thRight: { padding: '8px 12px', textAlign: 'right' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  td: { padding: '10px 16px' },
  tdRight: { padding: '10px 12px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)' as const },
};

const MODEL_COLORS = ['var(--chart-1)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-2)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-3)'];

function ModelsSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div>
      <div style={S.grid2}><Skeleton className="h-[300px] rounded-lg" /><Skeleton className="h-[300px] rounded-lg" /></div>
      <Skeleton className="h-[350px] rounded-lg" />
    </div>
  );
}

export default function ModelsPage() {
  const [data, setData] = useState<ModelsResponse | null>(null);
  const { fmt } = useCurrency();

  useEffect(() => {
    api.models().then(setData).catch(console.error);
  }, []);

  if (!data) return <ModelsSkeleton />;

  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        <KpiCard label="Tokens (30d)" value={fmtNum(data.total_tokens)} delta={0.28} deltaDirGood="up" />
        <KpiCard label="API cost (30d)" value={fmt(data.total_cost)} delta={0.19} />
        <KpiCard label="$ per 1M tokens" value={fmt(data.total_cost / (data.total_tokens / 1_000_000))} delta={-0.06} deltaDirGood="down" />
        <KpiCard label="Calls (30d)" value={fmtNum(data.total_calls)} delta={0.34} deltaDirGood="up" />
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Spend by model</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>30-day window</div></div></div>
          <div style={S.cardB}>
            <svg viewBox="0 0 560 260" style={{ width: '100%', height: 260 }}>
              {data.models.map((m, i) => {
                const y = 20 + i * 32;
                const w = (m.cost / 22000) * 400;
                const color = MODEL_COLORS[i] || 'var(--chart-1)';
                return (
                  <g key={m.name}>
                    <text x="0" y={y + 4} fontSize="11" fill="var(--ink-2)" fontFamily="var(--font-mono)">{m.name}</text>
                    <rect x="160" y={y - 8} width={w} height="16" fill={color} rx="2" opacity="0.85" />
                    <text x={160 + w + 8} y={y + 4} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">{fmt(m.cost)}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Token mix · input vs output</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Output is ~4× more expensive on most models</div></div></div>
          <div style={S.cardB}>
            {data.models.map((m) => {
              const total = m.tokens_in + m.tokens_out;
              const inPct = total > 0 ? (m.tokens_in / total) * 100 : 50;
              return (
                <div key={m.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{m.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmtNum(total)}</span>
                  </div>
                  <div style={{ display: 'flex', height: 8, borderRadius: 2, overflow: 'hidden', background: 'var(--surface-3)', marginTop: 4 }}>
                    <div style={{ width: `${inPct}%`, background: 'var(--chart-2)' }} />
                    <div style={{ width: `${100 - inPct}%`, background: 'var(--chart-5)' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 10, height: 10, background: 'var(--chart-2)', borderRadius: 2 }} />input</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 10, height: 10, background: 'var(--chart-5)', borderRadius: 2 }} />output</span>
            </div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>All models</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Usage, cost and latency — 30 days</div></div></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>
            <th style={S.th}>Model</th><th style={S.th}>Vendor</th>
            <th style={S.thRight}>Calls</th><th style={S.thRight}>Input tok</th><th style={S.thRight}>Output tok</th>
            <th style={S.thRight}>Cost</th><th style={S.thRight}>$/1M tok</th><th style={S.thRight}>p50 latency</th>
          </tr></thead>
          <tbody>
            {data.models.map(m => {
              const tot = m.tokens_in + m.tokens_out;
              return (
                <tr key={m.name} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.name}</td>
                  <td style={S.td}>{m.vendor}</td>
                  <td style={S.tdRight}>{fmtNum(m.calls)}</td>
                  <td style={S.tdRight}>{fmtNum(m.tokens_in)}</td>
                  <td style={S.tdRight}>{fmtNum(m.tokens_out)}</td>
                  <td style={S.tdRight}>{fmt(m.cost)}</td>
                  <td style={S.tdRight}>{fmt(tot > 0 ? m.cost / (tot / 1_000_000) : 0)}</td>
                  <td style={S.tdRight}>{m.avg_latency.toFixed(1)}s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
