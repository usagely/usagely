'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/src/lib/api/client';
import type { ProfileResponse } from '@/src/lib/api/types';
import { useCurrency } from '@/src/lib/currency-context';
import { useTweaks } from '@/src/lib/tweaks-context';
import { fmtMoney, fmtMoneyFull, fmtNum } from '@/src/lib/formatters';
import { KpiCard } from '@/src/components/ui/kpi-card';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Avatar } from '@/src/components/ui/avatar';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { Sparkline } from '@/src/components/charts/sparkline';
import { MainChart } from '@/src/components/charts/main-chart';
import { Donut } from '@/src/components/charts/donut';
import { Heatmap } from '@/src/components/charts/heatmap';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 },
  grid2even: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardB: { padding: '14px 16px' },
  cardBFlush: { padding: 0 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' } as React.CSSProperties,
  th: { padding: '8px 16px', textAlign: 'left' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  thRight: { padding: '8px 12px', textAlign: 'right' as const, fontWeight: 500, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', borderBottom: '1px solid var(--hairline)' },
  td: { padding: '10px 16px' },
  tdRight: { padding: '10px 12px', textAlign: 'right' as const, fontFamily: 'var(--font-mono)' as const },
};

function ProfileSkeleton() {
  return (
    <div style={S.pageBody}>
      <Skeleton className="h-[110px] rounded-lg" />
      <div style={S.kpiGrid}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}</div>
      <div style={S.grid2even}><Skeleton className="h-[300px] rounded-lg" /><Skeleton className="h-[300px] rounded-lg" /></div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const email = decodeURIComponent((params?.email as string) || '');
  const [data, setData] = useState<ProfileResponse | null>(null);
  const { fmt } = useCurrency();
  const { tweaks } = useTweaks();

  useEffect(() => {
    if (email) api.profile(email).then(setData).catch(console.error);
  }, [email]);

  if (!data) return <ProfileSkeleton />;

  const totalTok = data.models.reduce((a, m) => a + m.tokens, 0);
  const totalCost = data.models.reduce((a, m) => a + m.cost, 0) + data.tools.reduce((a, t) => a + t.cost, 0);

  return (
    <div style={S.pageBody}>
      {/* Profile header */}
      <div style={{ ...S.card, padding: 20, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 600, border: '1px solid var(--hairline)' }}>
          {data.name.split(' ').map(s => s[0]).join('')}
        </div>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{data.name}</span>
            <Chip tone="accent" dot>active</Chip>
            <Chip>Power user · top 5%</Chip>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{data.email} · {data.role} · {data.team}</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
            <span><Icon name="tools" size={12} /> {data.tools.length} tools</span>
            <span><Icon name="cpu" size={12} /> {data.models.length} models</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>joined Apr 2024</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>cost-center: R&amp;D-ENG-02</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn}>Message</button>
          <button style={S.btn}>Set budget</button>
          <button style={S.btnPrimary}>Coach</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={S.kpiGrid}>
        <KpiCard label="Spend (30d)" value={fmt(data.cost)} delta={0.22} spark={<Sparkline data={data.daily_activity.map(d => d.value).slice(-14)} color="var(--chart-1)" style={tweaks.chart} />} />
        <KpiCard label="Tokens (30d)" value={fmtNum(data.tokens)} delta={0.18} deltaDirGood="up" />
        <KpiCard label="PRs merged" value={String(data.prs)} delta={0.12} deltaDirGood="up" />
        <KpiCard label="$ per PR" value={fmt(Math.round(data.cost / (data.prs || 1)))} delta={-0.08} deltaDirGood="down" />
      </div>

      {/* Activity + Hourly pattern */}
      <div style={S.grid2even}>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Daily activity · 30 days</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Cost in USD</div></div></div>
          <div style={S.cardB}>
            <MainChart data={data.daily_activity} style={tweaks.chart} color="var(--chart-1)" h={220} />
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Hourly pattern</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Activity density · last 4 weeks</div></div></div>
          <div style={{ ...S.cardB, overflowX: 'auto' as const }}>
            <Heatmap
              labelY={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
              labelX={['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22']}
              max={100}
              data={data.hourly_pattern}
              cell={22}
            />
          </div>
        </div>
      </div>

      {/* Models + Tools */}
      <div style={S.grid2even}>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Models used</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Mix of cheap &amp; flagship</div></div></div>
          <div style={{ ...S.cardB, display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut
              segments={data.models.map(m => ({ name: m.name, value: m.cost, color: m.color }))}
              size={130}
              thickness={16}
              center={{ label: 'Total', value: fmt(totalCost) }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.models.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{m.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{fmtNum(m.tokens)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fmt(m.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Tools provisioned</div></div></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              <th style={S.th}>Tool</th><th style={S.th}>Category</th><th style={S.th}>Usage</th>
              <th style={S.thRight}>Cost (30d)</th><th style={S.th}></th>
            </tr></thead>
            <tbody>
              {data.tools.map(t => (
                <tr key={t.name} style={{ borderBottom: '1px solid var(--hairline)' }}>
                  <td style={{ ...S.td, fontWeight: 500 }}>{t.name}</td>
                  <td style={S.td}>{t.category}</td>
                  <td style={{ ...S.td, fontSize: 12, color: 'var(--muted)' }}>{t.usage}</td>
                  <td style={S.tdRight}>{fmt(t.cost)}</td>
                  <td style={S.td}>{t.status === 'idle' ? <Chip tone="warn" dot>idle</Chip> : <Chip tone="accent" dot>active</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessions */}
      <div style={S.card}>
        <div style={S.cardH}>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Recent sessions</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Prompts, model calls and outcomes · last 7 days</div></div>
          <div style={{ flex: 1 }} />
          <button style={{ ...S.btn, border: 'none', background: 'transparent', color: 'var(--ink-2)' }}><Icon name="download" size={12} /> Export</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>
            <th style={S.th}>When</th><th style={S.th}>Tool</th><th style={S.th}>Model</th><th style={S.th}>Project tag</th>
            <th style={S.thRight}>Duration</th><th style={S.thRight}>Tokens</th><th style={S.thRight}>Cost</th><th style={S.th}>Outcome</th>
          </tr></thead>
          <tbody>
            {data.sessions.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--hairline)', cursor: 'pointer' }}>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>{s.when}</td>
                <td style={S.td}>{s.tool}</td>
                <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.model}</td>
                <td style={S.td}><Chip>{s.tag}</Chip></td>
                <td style={S.tdRight}>{s.duration}</td>
                <td style={S.tdRight}>{fmtNum(s.tokens)}</td>
                <td style={S.tdRight}>{fmtMoneyFull(s.cost)}</td>
                <td style={{ ...S.td, fontSize: 12, color: 'var(--muted)' }}>{s.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policies + Productivity */}
      <div style={S.grid2even}>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Applied policies</div></div></div>
          <div style={{ ...S.cardB, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t: 'Daily spend cap $50', used: 34 },
              { t: 'Monthly budget share · Eng-R&D', used: 72 },
              { t: 'Allowed models: claude-*, gpt-*, gemini-*' },
              { t: 'PII redaction on prompts' },
              { t: 'o3 requires approval' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="approve" size={13} />
                <span style={{ flex: 1, fontSize: 13 }}>{p.t}</span>
                {p.used != null && (
                  <div style={{ display: 'flex', gap: 6, width: 140 }}>
                    <ProgressBar pct={p.used} tone="accent" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{p.used}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Productivity benchmark</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>vs team median</div></div></div>
          <div style={S.cardB}>
            {[
              { l: 'PRs merged', v: '+34%', tone: 'accent' as const, w: 84 },
              { l: 'Lines changed', v: '+22%', tone: 'accent' as const, w: 72 },
              { l: 'Review time', v: '-18%', tone: 'accent' as const, w: 68 },
              { l: 'Cost per PR', v: '-12%', tone: 'accent' as const, w: 58 },
              { l: 'Flagship model usage', v: '+140%', tone: 'warn' as const, w: 92 },
            ].map((b, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span>{b.l}</span>
                  <Chip tone={b.tone}>{b.v}</Chip>
                </div>
                <div style={{ marginTop: 4 }}><ProgressBar pct={b.w} tone={b.tone} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
