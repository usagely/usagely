'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { TeamsResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtDelta, fmtMoney, fmtNum } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { Sparkline } from '@/src/components/charts/sparkline';
import { Heatmap } from '@/src/components/charts/heatmap';
import { Skeleton } from '@/components/ui/skeleton';

/* ── inline style tokens (matching design/styles.css) ── */
const S = {
  pageBody: {
    padding: '20px 28px 60px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 20,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  cardH: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--hairline)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  cardB: { padding: '14px 16px' },
  toolbar: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--hairline)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
};

function TeamsSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
      <div style={S.grid2}>
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const [data, setData] = useState<TeamsResponse | null>(null);
  const { fmt } = useCurrency();
  const { tweaks } = useTweaks();

  useEffect(() => {
    api.teams().then(setData).catch(console.error);
  }, []);

  if (!data) return <TeamsSkeleton />;

  const teams = data.teams;
  const overBudget = teams.filter((t) => t.spend / t.budget > 0.8).length;
  const avgPerUser = teams.length > 0 ? teams.reduce((a, t) => a + t.per_user, 0) / teams.length : 0;
  const mostEfficient = teams.length > 0
    ? [...teams].sort((a, b) => a.per_user - b.per_user)[0]?.name ?? '—'
    : '—';

  const heatmapLabels = {
    y: ['Eng', 'Product', 'Data', 'Mkt', 'CS', 'Sales'],
    x: ['OAI API', 'Anth API', 'Vertex', 'Copilot', 'Cursor', 'ClaudeCode', 'ChatGPT', 'Claude T.', 'MJ', 'Eleven'],
  };
  const heatmapData = [
    [4200, 8200, 1200, 620, 1520, 4200, 360, 820, 0, 120],
    [320, 420, 180, 60, 120, 0, 560, 380, 80, 0],
    [9800, 10000, 4200, 0, 280, 620, 180, 120, 0, 80],
    [120, 80, 40, 0, 0, 0, 220, 80, 180, 0],
    [160, 220, 60, 0, 0, 0, 480, 260, 0, 420],
    [60, 90, 20, 0, 60, 0, 320, 180, 0, 120],
  ];

  return (
    <div style={S.pageBody}>
      {/* KPI cards */}
      <div style={S.kpiGrid}>
        <KpiCard label="Teams tracked" value={String(teams.length)} delta={0} />
        <KpiCard label="Avg spend / user" value={fmt(avgPerUser)} delta={0.08} />
        <KpiCard label="Over-budget teams" value={String(overBudget)} delta={0.2} deltaDirGood="down" />
        <KpiCard label="Most efficient" value={mostEfficient} />
      </div>

      {/* Teams table */}
      <div style={S.card}>
        <div style={S.toolbar}>
          <div
            style={{
              display: 'flex',
              gap: 0,
              background: 'var(--surface-2)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {['All', 'Over budget', 'Inefficient'].map((label, i) => (
              <button
                key={label}
                style={{
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: i === 0 ? 'var(--surface)' : 'transparent',
                  color: i === 0 ? 'var(--ink)' : 'var(--muted)',
                  borderRadius: i === 0 ? 5 : 0,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: 8, color: 'var(--muted)' }}>
              <Icon name="search" size={13} />
            </span>
            <input
              style={{
                width: 240,
                paddingLeft: 28,
                height: 30,
                fontSize: 12,
                border: '1px solid var(--hairline)',
                borderRadius: 6,
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                outline: 'none',
              }}
              placeholder="Search teams…"
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              background: 'var(--surface-2)',
              border: '1px solid var(--hairline)',
              borderRadius: 6,
              color: 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            <Icon name="filter" size={13} /> Filter
          </button>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              background: 'var(--surface-2)',
              border: '1px solid var(--hairline)',
              borderRadius: 6,
              color: 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            <Icon name="download" size={13} /> Export
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--hairline)',
                fontSize: 11,
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 500 }}>Team</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>Members</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>Top tool</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>MTD spend</th>
              <th style={{ padding: '8px 12px', fontWeight: 500, minWidth: 160 }}>Budget usage</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>Per user</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>Δ vs prev</th>
              <th style={{ padding: '8px 12px', width: 140, fontWeight: 500 }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const pct = Math.min(1, t.spend / t.budget);
              const tone = pct > 0.95 ? 'danger' : pct > 0.75 ? 'warn' : 'accent';
              return (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: t.color,
                          flexShrink: 0,
                        }}
                      />
                      <strong>{t.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                    {t.members}
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.top_tool}</td>
                  <td
                    style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {fmt(t.spend)}
                  </td>
                  <td style={{ padding: '10px 12px', minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar pct={pct * 100} tone={tone} />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--muted)',
                          minWidth: 40,
                        }}
                      >
                        {(pct * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {fmt(t.per_user)}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      color: t.delta >= 0 ? 'var(--danger)' : 'var(--accent)',
                    }}
                  >
                    {fmtDelta(t.delta)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Sparkline
                      data={Array.from({ length: 14 }, () => 200 + Math.random() * 800)}
                      color={t.color}
                      style={tweaks.chart}
                      w={120}
                      h={24}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scatter plot + Heatmap */}
      <div style={S.grid2}>
        {/* Cost vs output scatter */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Cost vs output · last 30d</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                PRs merged / $1k spent · higher is better
              </div>
            </div>
          </div>
          <div style={S.cardB}>
            <svg viewBox="0 0 520 240" style={{ width: '100%', height: 240 }}>
              <line x1="40" y1="210" x2="510" y2="210" stroke="var(--hairline)" />
              <line x1="40" y1="10" x2="40" y2="210" stroke="var(--hairline)" />
              {[0.25, 0.5, 0.75].map((f, i) => (
                <line
                  key={i}
                  x1="40"
                  x2="510"
                  y1={210 - f * 200}
                  y2={210 - f * 200}
                  stroke="var(--hairline)"
                  strokeDasharray="2 3"
                />
              ))}
              {teams.map((t) => {
                const maxSpend = Math.max(...teams.map((r) => r.spend), 1);
                const maxPerUser = Math.max(...teams.map((r) => r.per_user), 1);
                const x = 60 + (t.spend / maxSpend) * 430;
                const y = 210 - Math.min(1, t.per_user / maxPerUser) * 200;
                const r = 6 + Math.sqrt(t.members) * 2;
                return (
                  <g key={t.id}>
                    <circle cx={x} cy={y} r={r} fill={t.color} opacity="0.25" />
                    <circle cx={x} cy={y} r={r} fill="none" stroke={t.color} strokeWidth="1.5" />
                    <text x={x + r + 4} y={y + 3} fontSize="11" fill="var(--ink)">
                      {t.name}
                    </text>
                  </g>
                );
              })}
              <text x="275" y="234" textAnchor="middle" fontSize="10" fill="var(--muted)">
                spend →
              </text>
              <text
                x="22"
                y="110"
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
                transform="rotate(-90 22 110)"
              >
                efficiency →
              </text>
            </svg>
          </div>
        </div>

        {/* Heatmap */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Team × Tool heatmap</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                $ spent · darker = higher
              </div>
            </div>
          </div>
          <div style={{ ...S.cardB, overflowX: 'auto' }}>
            <Heatmap
              data={heatmapData}
              labelY={heatmapLabels.y}
              labelX={heatmapLabels.x}
              max={10000}
              cell={22}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
