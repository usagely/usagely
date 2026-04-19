'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { DashboardResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtDelta, fmtMoney } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Sparkline } from '@/src/components/charts/sparkline';
import { MainChart } from '@/src/components/charts/main-chart';
import { Donut } from '@/src/components/charts/donut';
import { Skeleton } from '@/components/ui/skeleton';

/* ── inline style tokens (matching design/styles.css) ── */
const S = {
  pageBody: {
    padding: '20px 28px 60px',
    display: 'flex',
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
    gridTemplateColumns: '2fr 1fr',
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
  cardBFlush: { padding: 0 },
};

/* ── skeleton placeholder ── */
function DashboardSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
      <div style={S.grid2}>
        <Skeleton className="h-[340px] rounded-lg" />
        <Skeleton className="h-[340px] rounded-lg" />
      </div>
      <div style={S.grid2}>
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
      <Skeleton className="h-[320px] rounded-lg" />
    </div>
  );
}

/* ── Dashboard page ── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const { fmt } = useCurrency();
  const { tweaks } = useTweaks();

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <DashboardSkeleton />;

  const dailyVals = data.daily_spend.map((d) => d.value);
  const totalSeg = data.spend_by_category.reduce((a, s) => a + s.value, 0);

  return (
    <div style={S.pageBody}>
      {/* ── KPI cards ── */}
      <div style={S.kpiGrid}>
        <KpiCard
          label="MTD spend"
          value={fmt(data.mtd_spend)}
          delta={data.mtd_delta}
          spark={
            <Sparkline
              data={dailyVals.slice(-14)}
              color="var(--chart-1)"
              style={tweaks.chart}
            />
          }
        />
        <KpiCard
          label="Projected month"
          value={fmt(data.projected_month)}
          delta={data.projected_delta}
          spark={
            <Sparkline
              data={dailyVals.slice(-30)}
              color="var(--chart-2)"
              style={tweaks.chart}
            />
          }
        />
        <KpiCard
          label="Active AI tools"
          value={String(data.active_tools)}
          delta={data.tools_delta}
          deltaDirGood="up"
          spark={
            <Sparkline
              data={[24, 25, 27, 28, 28, 30, 31, 32, data.active_tools]}
              color="var(--chart-3)"
              style={tweaks.chart}
            />
          }
        />
        <KpiCard
          label="Active users"
          value={String(data.active_users)}
          delta={data.users_delta}
          deltaDirGood="up"
          spark={
            <Sparkline
              data={[160, 168, 171, 172, 176, 180, 182, 184, data.active_users]}
              color="var(--chart-4)"
              style={tweaks.chart}
            />
          }
        />
      </div>

      {/* ── Daily spend + Spend by category ── */}
      <div style={S.grid2}>
        {/* Daily spend chart */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Daily spend · all AI</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Trailing 60 days · USD equivalent
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: 'flex',
                gap: 0,
                background: 'var(--surface-2)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {['All', 'APIs', 'Seats'].map((label, i) => (
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
          </div>
          <div style={S.cardB}>
            <MainChart
              data={data.daily_spend}
              style={tweaks.chart}
              color="var(--chart-1)"
              h={260}
              annotate={
                data.daily_spend.length >= 5
                  ? [
                      {
                        index: data.daily_spend.length - 5,
                        label: 'Anomaly +187%',
                      },
                    ]
                  : undefined
              }
            />
          </div>
        </div>

        {/* Spend by category donut */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Spend by category</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Month-to-date</div>
            </div>
          </div>
          <div
            style={{
              ...S.cardB,
              display: 'flex',
              gap: 18,
              alignItems: 'center',
            }}
          >
            <Donut
              segments={data.spend_by_category}
              size={140}
              thickness={18}
              center={{ label: 'Total MTD', value: fmt(totalSeg) }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.spend_by_category.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--muted)',
                    }}
                  >
                    {totalSeg > 0 ? ((s.value / totalSeg) * 100).toFixed(0) : 0}%
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Anomalies + Recommendations ── */}
      <div style={S.grid2}>
        {/* Anomalies & alerts */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Anomalies &amp; alerts</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Last 7 days · {data.anomalies.length} open
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              View all <Icon name="arrow-right" size={12} />
            </button>
          </div>
          <div style={S.cardBFlush}>
            {data.anomalies.slice(0, 4).map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--hairline)',
                  borderLeft: `3px solid ${a.severity === 'danger' ? 'var(--danger)' : 'var(--warn)'}`,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Chip tone={a.severity}>
                      {a.severity === 'danger' ? 'critical' : 'warning'}
                    </Chip>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {a.body}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 4,
                    }}
                  >
                    {a.detected_at} · {a.team_name} · owner {a.owner_name}
                  </div>
                </div>
                <button
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--hairline)',
                    borderRadius: 6,
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top recommendations */}
        <div style={S.card}>
          <div style={S.cardH}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Top recommendations</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                Projected savings · this month
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 12,
                fontWeight: 500,
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              View all <Icon name="arrow-right" size={12} />
            </button>
          </div>
          <div style={S.cardBFlush}>
            {data.recommendations.slice(0, 4).map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--hairline)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: 'var(--accent)',
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {r.reason}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Chip tone="accent">Save {fmt(r.savings_usd)}/mo</Chip>
                    <Chip>Conf. {(r.confidence * 100).toFixed(0)}%</Chip>
                    <Chip>{r.scope}</Chip>
                  </div>
                </div>
                <button
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Spend by team table ── */}
      <div style={S.card}>
        <div style={S.cardH}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Spend by team</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              MTD · sorted by spend
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            All teams <Icon name="arrow-right" size={12} />
          </button>
        </div>
        <div style={S.cardBFlush}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
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
                <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 500 }}>
                  Team
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>
                  Members
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>
                  MTD spend
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>
                  Per user
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>
                  Δ vs prev
                </th>
                <th style={{ padding: '8px 12px', width: 140, fontWeight: 500 }}>
                  Trend
                </th>
                <th style={{ padding: '8px 8px', width: 24 }} />
              </tr>
            </thead>
            <tbody>
              {data.teams_spend.map((t) => (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid var(--hairline)',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: t.color,
                          flexShrink: 0,
                        }}
                      />
                      {t.name}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {t.members}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {fmt(t.spend)}
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
                      data={Array.from({ length: 14 }, () => 500 + Math.random() * 1000)}
                      color={t.color}
                      style={tweaks.chart}
                      w={120}
                      h={24}
                    />
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <Icon name="chevron-right" size={14} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
