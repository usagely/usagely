// Usagely — Profile page + Edition (Enterprise vs OSS) config

// Which features are enterprise-only
const ENT_ONLY = new Set(['shadow', 'forecast', 'approvals', 'recommendations']);
// Settings sections that are enterprise-only
const ENT_GUARDRAILS = true;

function EditionBanner({ edition, setEdition }) {
  if (edition === 'enterprise') {
    return (
      <div style={{ padding: '8px 28px', background: 'var(--ink)', color: 'var(--bg)', display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', border: '1px solid color-mix(in oklab, var(--bg) 40%, transparent)', borderRadius: 3 }}>ENTERPRISE</span>
        <span>Acme Co · Unlimited seats · SOC 2 Type II · Dedicated support</span>
        <div style={{ flex: 1 }}/>
        <span style={{ opacity: 0.7 }}>Renews Sep 12, 2026</span>
      </div>
    );
  }
  return (
    <div style={{ padding: '8px 28px', background: 'var(--surface-2)', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: 12, alignItems: 'center', fontSize: 12 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 6px', border: '1px solid var(--hairline-strong)', borderRadius: 3 }}>OSS · v4.12.0</span>
      <span style={{ color: 'var(--muted)' }}>Self-hosted · MIT license · Community support via GitHub Discussions</span>
      <div style={{ flex: 1 }}/>
      <a style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>⭐ 12.4k stars</a>
      <a style={{ color: 'var(--ink-2)', textDecoration: 'none' }}>Upgrade to Enterprise →</a>
    </div>
  );
}

function LockedFeature({ name, description }) {
  return (
    <div className="page-body">
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 560, margin: '40px auto' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Icon name="lock" size={22}/>
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>{name} is an Enterprise feature</div>
        <div style={{ color: 'var(--muted)', marginTop: 6, fontSize: 13 }}>{description}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24, textAlign: 'left' }}>
          {[
            'Shadow AI detection via egress & expense feeds',
            '30-day rolling AI forecast with scenarios',
            'Tool request & approval workflows',
            'ML-powered optimization recommendations',
            'SAML SSO & SCIM provisioning',
            'SOC 2 Type II audited hosting',
          ].map(f => (
            <div key={f} className="row" style={{ gap: 8, fontSize: 12 }}>
              <Icon name="approve" size={13} className=""/>{f}
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn">Read docs</button>
          <button className="btn primary">Talk to sales</button>
        </div>
      </div>
    </div>
  );
}

// ========== USER PROFILE ==========
function ProfilePage({ tweaks, go, userEmail }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const u = D.users.find(x => x.email === userEmail) || D.users[1]; // Diego default

  // Derived data
  const daily = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2026, 2, 20 + i).toISOString().slice(0, 10),
    value: Math.max(5, 40 + Math.sin(i / 3) * 25 + Math.random() * 30 + (i > 20 ? 20 : 0))
  }));
  const models = [
    { name: 'claude-sonnet-4.5', tokens: 12_400_000, cost: 720, calls: 4820, color: 'var(--chart-1)' },
    { name: 'gpt-4.1-mini',      tokens: 6_300_000,  cost: 210, calls: 8120, color: 'var(--chart-2)' },
    { name: 'claude-opus-4',     tokens: 1_800_000,  cost: 640, calls: 480,  color: 'var(--chart-4)' },
    { name: 'gpt-4o',            tokens: 1_600_000,  cost: 410, calls: 920,  color: 'var(--chart-3)' },
  ];
  const tools = [
    { name: 'Cursor', cat: 'Coding', usage: 'Daily · 5.2h avg', cost: 40, status: 'active' },
    { name: 'Claude Code', cat: 'Coding', usage: 'Daily · 2.1h avg', cost: 140, status: 'active' },
    { name: 'Claude Teams', cat: 'Chat seat', usage: 'Daily', cost: 30, status: 'active' },
    { name: 'Anthropic API', cat: 'API key', usage: '12k calls / 7d', cost: 720, status: 'active' },
    { name: 'OpenAI API', cat: 'API key', usage: '9k calls / 7d', cost: 620, status: 'active' },
    { name: 'Midjourney', cat: 'Image', usage: 'Idle 18d', cost: 32, status: 'idle' },
  ];

  const sessions = [
    { id: 's1', when: '12 min ago', tool: 'Claude Code', model: 'claude-sonnet-4.5', duration: '34m', tokens: 284_000, cost: 16.8, tag: 'billing-service', outcome: 'PR #2841 merged' },
    { id: 's2', when: '1h ago',     tool: 'Cursor',      model: 'gpt-4o',            duration: '1h 12m', tokens: 420_000, cost: 11.2, tag: 'billing-service', outcome: 'code edits · not pushed' },
    { id: 's3', when: '3h ago',     tool: 'Anthropic API', model: 'claude-opus-4',   duration: '—', tokens: 180_000, cost: 32.4, tag: 'data-pipeline', outcome: 'batch extraction' },
    { id: 's4', when: 'Yesterday',  tool: 'Claude Code', model: 'claude-sonnet-4.5', duration: '2h 8m',  tokens: 860_000, cost: 42.8, tag: 'auth-refactor', outcome: 'PR #2839 merged' },
    { id: 's5', when: '2 days ago', tool: 'ChatGPT',     model: 'gpt-4o',            duration: '—', tokens: 62_000, cost: 1.4, tag: 'research', outcome: 'notes' },
    { id: 's6', when: '3 days ago', tool: 'Cursor',      model: 'gpt-4.1-mini',      duration: '5h 22m', tokens: 1_200_000, cost: 8.2, tag: 'billing-service', outcome: 'PR #2837 merged' },
  ];

  const totalTok = models.reduce((a,m)=>a+m.tokens, 0);
  const totalCost = models.reduce((a,m)=>a+m.cost, 0) + tools.reduce((a,t)=>a+t.cost, 0);

  return (
    <div className="page-body">
      {/* Profile header */}
      <div className="card" style={{ padding: 20, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 600, border: '1px solid var(--hairline)' }}>
          {u.name.split(' ').map(s=>s[0]).join('')}
        </div>
        <div>
          <div className="row" style={{ gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em' }}>{u.name}</div>
            <Chip tone="accent" dot>active</Chip>
            <Chip>Power user · top 5%</Chip>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{u.email} · {u.role} · {u.team}</div>
          <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
            <span><Icon name="tools" size={12}/> 6 tools</span>
            <span><Icon name="cpu" size={12}/> 4 models</span>
            <span><Icon name="users" size={12}/> Reports to Priya Rao</span>
            <span className="mono">joined Apr 2024</span>
            <span className="mono">cost-center: R&D-ENG-02</span>
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn sm">Message</button>
          <button className="btn sm">Set budget</button>
          <button className="btn sm primary">Coach</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI label="Spend (30d)" value={fmtMoney(u.cost, cur)} delta={0.22} spark={daily.map(d=>d.value)} sparkColor="var(--chart-1)" chart={tweaks.chart}/>
        <KPI label="Tokens (30d)" value={fmtNum(u.tokens)} delta={0.18} deltaDirGood="up"/>
        <KPI label="PRs merged" value={u.prs} delta={0.12} deltaDirGood="up"/>
        <KPI label="$ per PR" value={fmtMoney(Math.round(u.cost/u.prs), cur)} delta={-0.08} deltaDirGood="down"/>
      </div>

      {/* Activity timeline */}
      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Daily activity · 30 days</div><div className="sub">Cost in USD</div></div></div>
          <div className="card-b">
            <Chart data={daily} style={tweaks.chart} color="var(--chart-1)" h={220}/>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Hourly pattern</div><div className="sub">Activity density · last 4 weeks</div></div></div>
          <div className="card-b" style={{ overflowX: 'auto' }}>
            <Heatmap
              labelY={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
              labelX={['00','02','04','06','08','10','12','14','16','18','20','22']}
              max={100}
              data={[
                [0,0,0,0,20,80,90,70,80,90,60,30],
                [0,0,0,0,25,85,95,80,90,85,70,40],
                [0,0,0,0,30,90,100,85,95,90,80,45],
                [0,0,0,0,30,85,90,80,85,80,60,35],
                [0,0,0,0,20,70,80,60,50,30,20,10],
                [0,0,0,0,0,10,15,10,5,0,0,0],
                [0,0,0,0,5,20,30,20,10,5,0,0],
              ]}
              cell={22}
            />
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Models used</div><div className="sub">Mix of cheap & flagship</div></div></div>
          <div className="card-b" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Donut segments={models.map(m=>({ name: m.name, value: m.cost, color: m.color }))} size={130} thickness={16}
              center={{ label: 'Total', value: fmtMoney(totalCost, cur) }}/>
            <div className="legend" style={{ flex: 1 }}>
              {models.map(m => (
                <div className="l-row" key={m.name}>
                  <span className="sw" style={{ background: m.color }}/>
                  <span className="mono" style={{ flex: 1, fontSize: 11 }}>{m.name}</span>
                  <span className="num" style={{ color: 'var(--muted)' }}>{fmtNum(m.tokens)}</span>
                  <span className="num">{fmtMoney(m.cost, cur)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Tools provisioned</div></div></div>
          <table className="tbl">
            <thead><tr><th>Tool</th><th>Category</th><th>Usage</th><th className="right">Cost (30d)</th><th></th></tr></thead>
            <tbody>
              {tools.map(t => (
                <tr key={t.name}>
                  <td style={{ fontWeight: 500 }}>{t.name}</td>
                  <td>{t.cat}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{t.usage}</td>
                  <td className="right num">{fmtMoney(t.cost, cur)}</td>
                  <td>{t.status === 'idle' ? <Chip tone="warn" dot>idle</Chip> : <Chip tone="accent" dot>active</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sessions */}
      <div className="card">
        <div className="card-h">
          <div><div className="ttl">Recent sessions</div><div className="sub">Prompts, model calls and outcomes · last 7 days</div></div>
          <div style={{ flex: 1 }}/>
          <button className="btn sm ghost"><Icon name="download" size={12}/>Export</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>When</th><th>Tool</th><th>Model</th><th>Project tag</th>
            <th className="right">Duration</th><th className="right">Tokens</th><th className="right">Cost</th><th>Outcome</th>
          </tr></thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="clickable">
                <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{s.when}</td>
                <td>{s.tool}</td>
                <td className="mono" style={{ fontSize: 12 }}>{s.model}</td>
                <td><Chip>{s.tag}</Chip></td>
                <td className="right num">{s.duration}</td>
                <td className="right num">{fmtNum(s.tokens)}</td>
                <td className="right num">{fmtMoneyFull(s.cost, cur)}</td>
                <td style={{ fontSize: 12, color: 'var(--muted)' }}>{s.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policies & access */}
      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Applied policies</div></div></div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { t: 'Daily spend cap $50', s: 'active', used: 34 },
              { t: 'Monthly budget share · Eng-R&D', s: 'active', used: 72 },
              { t: 'Allowed models: claude-*, gpt-*, gemini-*', s: 'active' },
              { t: 'PII redaction on prompts', s: 'active' },
              { t: 'o3 requires approval', s: 'active' },
            ].map((p,i) => (
              <div key={i} className="row" style={{ gap: 10 }}>
                <Icon name="approve" size={13}/>
                <span style={{ flex: 1, fontSize: 13 }}>{p.t}</span>
                {p.used != null && (
                  <div className="row" style={{ gap: 6, width: 140 }}>
                    <div className="bar accent" style={{ flex: 1 }}><span style={{ width: p.used + '%' }}/></div>
                    <span className="num" style={{ fontSize: 11, color: 'var(--muted)' }}>{p.used}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Productivity benchmark</div><div className="sub">vs team median</div></div></div>
          <div className="card-b">
            {[
              { l: 'PRs merged', v: '+34%', tone: 'accent', w: 84 },
              { l: 'Lines changed', v: '+22%', tone: 'accent', w: 72 },
              { l: 'Review time', v: '-18%', tone: 'accent', w: 68 },
              { l: 'Cost per PR', v: '-12%', tone: 'accent', w: 58 },
              { l: 'Flagship model usage', v: '+140%', tone: 'warn', w: 92 },
            ].map((b,i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                  <span>{b.l}</span><Chip tone={b.tone}>{b.v}</Chip>
                </div>
                <div className={'bar ' + b.tone} style={{ marginTop: 4 }}><span style={{ width: b.w + '%' }}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfilePage, EditionBanner, LockedFeature, ENT_ONLY });
