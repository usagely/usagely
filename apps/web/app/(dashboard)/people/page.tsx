'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { PeopleResponse, User } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtMoney, fmtNum } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Avatar } from '@/src/components/ui/avatar';
import { ProgressBar } from '@/src/components/ui/progress-bar';
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
  toolbar: {
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderBottom: '1px solid var(--hairline)',
  },
  seg: {
    display: 'flex',
    gap: 0,
    background: 'var(--surface-2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  segBtn: (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--muted)',
    borderRadius: active ? 5 : 0,
    whiteSpace: 'nowrap' as const,
  }),
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 500,
    background: 'var(--surface-2)',
    border: '1px solid var(--hairline)',
    borderRadius: 6,
    color: 'var(--ink)',
    cursor: 'pointer',
  },
  input: {
    padding: '5px 10px',
    fontSize: 12,
    border: '1px solid var(--hairline)',
    borderRadius: 6,
    background: 'var(--surface)',
    color: 'var(--ink)',
    outline: 'none',
    width: 240,
  },
  th: {
    padding: '8px 16px',
    textAlign: 'left' as const,
    fontWeight: 500,
    fontSize: 11,
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--hairline)',
  },
  thRight: {
    padding: '8px 12px',
    textAlign: 'right' as const,
    fontWeight: 500,
    fontSize: 11,
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--hairline)',
  },
  td: {
    padding: '10px 16px',
  },
  tdRight: {
    padding: '10px 12px',
    textAlign: 'right' as const,
    fontFamily: 'var(--font-mono)' as const,
  },
};

/* ── skeleton placeholder ── */
function PeopleSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.kpiGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

/* ── People page ── */
const TEAMS = ['All', 'Engineering', 'Data & ML', 'Product', 'Marketing', 'Sales', 'Customer Support'];

export default function PeoplePage() {
  const [data, setData] = useState<PeopleResponse | null>(null);
  const [team, setTeam] = useState('All');
  const [search, setSearch] = useState('');
  const { fmt } = useCurrency();

  useEffect(() => {
    api.people(team === 'All' ? undefined : team).then(setData).catch(console.error);
  }, [team]);

  if (!data) return <PeopleSkeleton />;

  const rows = data.users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div style={S.pageBody}>
      {/* ── KPI cards ── */}
      <div style={S.kpiGrid}>
        <KpiCard label="Active users" value="187" delta={0.03} deltaDirGood="up" />
        <KpiCard label="Top 10% burn" value={fmt(18400)} delta={0.22} deltaDirGood="down" />
        <KpiCard label="Idle seats" value="14" delta={-0.3} deltaDirGood="down" />
        <KpiCard label="Median / user" value={fmt(312)} delta={0.06} deltaDirGood="down" />
      </div>

      {/* ── Main table ── */}
      <div style={S.card}>
        <div style={S.toolbar}>
          <div style={S.seg}>
            {TEAMS.map((t) => (
              <button
                key={t}
                style={S.segBtn(team === t)}
                onClick={() => setTeam(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: 8, color: 'var(--muted)' }}>
              <Icon name="search" size={13} />
            </span>
            <input
              style={{ ...S.input, paddingLeft: 28 }}
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button style={S.btn}>
            <Icon name="download" size={13} /> Export
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={S.th}>Person</th>
              <th style={S.th}>Team</th>
              <th style={S.th}>Top tool</th>
              <th style={S.thRight}>Tokens</th>
              <th style={S.thRight}>PRs merged</th>
              <th style={S.thRight}>Cost (30d)</th>
              <th style={S.thRight}>$ per PR</th>
              <th style={{ ...S.th, width: 140 }}>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const eff = u.prs > 0 ? u.cost / u.prs : null;
              const effPct = eff ? Math.min(1, 100 / eff) : 0;
              return (
                <tr
                  key={u.email}
                  style={{
                    borderBottom: '1px solid var(--hairline)',
                    cursor: 'pointer',
                  }}
                >
                  <td style={S.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {u.email} · {u.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}>{u.team}</td>
                  <td style={S.td}><Chip>{u.top_tool}</Chip></td>
                  <td style={S.tdRight}>{fmtNum(u.tokens)}</td>
                  <td style={S.tdRight}>{u.prs || '—'}</td>
                  <td style={S.tdRight}>{fmt(u.cost)}</td>
                  <td style={S.tdRight}>
                    {eff ? fmt(Math.round(eff)) : '—'}
                  </td>
                  <td style={{ ...S.td, minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProgressBar
                        pct={effPct * 100}
                        tone={effPct > 0.7 ? 'accent' : effPct > 0.4 ? 'warn' : 'danger'}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
