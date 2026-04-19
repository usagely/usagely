// Usagely — main screens part 1 (Dashboard, Teams, People, Tools)

function KPI({ label, value, delta, deltaDirGood = 'down', spark, sparkColor, chart }) {
  const goodIsDown = deltaDirGood === 'down';
  const cls = delta == null ? 'flat' : (delta < 0 ? (goodIsDown ? 'down' : 'up') : (goodIsDown ? 'up' : 'down'));
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {delta != null && (
        <div className={'delta ' + cls}>
          <Icon name={delta >= 0 ? 'arrow-up' : 'arrow-down'} size={11} />
          {fmtDelta(delta)} <span style={{ color: 'var(--muted)' }}>vs prev period</span>
        </div>
      )}
      {spark && <div className="spark"><Sparkline data={spark} color={sparkColor || 'var(--ink-2)'} style={chart} w={110} h={32} /></div>}
    </div>
  );
}

// ========== DASHBOARD ==========
function DashboardPage({ tweaks, go }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const dailyVals = D.daily.map(d => d.value);
  const mtdSpend = D.daily.slice(-19).reduce((a, b) => a + b.value, 0);
  const prevMtd = D.daily.slice(-49, -19).reduce((a, b) => a + b.value, 0) * (19/30);
  const delta = (mtdSpend - prevMtd) / prevMtd;

  const bySegment = [
    { name: 'LLM APIs', value: 90220, color: 'var(--chart-1)' },
    { name: 'Coding', value: 6518, color: 'var(--chart-2)' },
    { name: 'Chat seats', value: 4290, color: 'var(--chart-3)' },
    { name: 'Media', value: 636, color: 'var(--chart-4)' },
    { name: 'Voice', value: 1060, color: 'var(--chart-5)' },
  ];
  const totalSeg = bySegment.reduce((a, s) => a + s.value, 0);

  const teamRows = D.teams.slice(0, 6).map((t, i) => ({
    ...t,
    spend: [12420, 9820, 8140, 1870, 1240, 1380][i] || 500,
    per_user: [259, 447, 428, 133, 103, 153][i] || 80,
    delta: [0.18, 0.09, 0.41, -0.04, 0.12, -0.08][i] || 0,
  }));

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="MTD spend"       value={fmtMoney(mtdSpend, cur)} delta={delta} spark={dailyVals.slice(-14)} sparkColor="var(--chart-1)" chart={tweaks.chart} />
        <KPI label="Projected month" value={fmtMoney(mtdSpend * 30/19, cur)} delta={0.214} spark={dailyVals.slice(-30)} sparkColor="var(--chart-2)" chart={tweaks.chart}/>
        <KPI label="Active AI tools" value="34" delta={0.12} deltaDirGood="up" spark={[24,25,27,28,28,30,31,32,34]} sparkColor="var(--chart-3)" chart={tweaks.chart} />
        <KPI label="Active users"    value="187" delta={0.03} deltaDirGood="up" spark={[160,168,171,172,176,180,182,184,187]} sparkColor="var(--chart-4)" chart={tweaks.chart} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h">
            <div><div className="ttl">Daily spend · all AI</div><div className="sub">Trailing 60 days · USD equivalent</div></div>
            <div style={{ flex: 1 }}/>
            <div className="seg"><button className="active">All</button><button>APIs</button><button>Seats</button></div>
          </div>
          <div className="card-b">
            <Chart data={D.daily} style={tweaks.chart} color="var(--chart-1)" annotate={[{ index: D.daily.length - 5, label: 'Anomaly +187%' }]} h={260}/>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Spend by category</div><div className="sub">Month-to-date</div></div></div>
          <div className="card-b" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Donut segments={bySegment} size={140} thickness={18} center={{ label: 'Total MTD', value: fmtMoney(totalSeg, cur) }} />
            <div className="legend" style={{ flex: 1 }}>
              {bySegment.map((s, i) => (
                <div className="l-row" key={i}>
                  <span className="sw" style={{ background: s.color }} />
                  <span style={{ flex: 1 }}>{s.name}</span>
                  <span className="num" style={{ color: 'var(--muted)' }}>{((s.value/totalSeg)*100).toFixed(0)}%</span>
                  <span className="num">{fmtMoney(s.value, cur)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Anomalies & alerts</div><div className="sub">Last 7 days · 4 open</div></div><div style={{ flex:1 }}/><button className="btn sm ghost" onClick={()=>go('anomalies')}>View all <Icon name="arrow-right" size={12}/></button></div>
          <div className="card-b flush">
            {D.anomalies.map(a => (
              <div key={a.id} className="anom" style={{ borderLeftColor: a.severity === 'danger' ? 'var(--danger)' : 'var(--warn)' }}>
                <div style={{ flex: 1 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Chip tone={a.severity}>{a.severity === 'danger' ? 'critical' : 'warning'}</Chip>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.body}</div>
                  <div className="meta" style={{ marginTop: 4 }}>{a.when} · {a.team} · owner {a.owner}</div>
                </div>
                <button className="btn sm">Investigate</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><div><div className="ttl">Top recommendations</div><div className="sub">Projected savings · this month</div></div><div style={{ flex:1 }}/><button className="btn sm ghost" onClick={()=>go('recommendations')}>View all <Icon name="arrow-right" size={12}/></button></div>
          <div className="card-b flush">
            {D.recommendations.slice(0, 4).map(r => (
              <div key={r.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)', marginTop: 6 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{r.reason}</div>
                  <div className="row" style={{ gap: 8, marginTop: 6 }}>
                    <Chip tone="accent">Save {fmtMoney(r.savings, cur)}/mo</Chip>
                    <Chip>Conf. {(r.confidence*100).toFixed(0)}%</Chip>
                    <Chip>{r.scope}</Chip>
                  </div>
                </div>
                <button className="btn sm primary">Apply</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><div><div className="ttl">Spend by team</div><div className="sub">MTD · sorted by spend</div></div><div style={{ flex: 1 }}/><button className="btn sm ghost" onClick={()=>go('teams')}>All teams <Icon name="arrow-right" size={12}/></button></div>
        <div className="card-b flush">
          <table className="tbl">
            <thead><tr>
              <th>Team</th><th>Members</th><th className="right">MTD spend</th><th className="right">Per user</th><th className="right">Δ vs prev</th><th style={{ width: 140 }}>Trend</th><th></th>
            </tr></thead>
            <tbody>
              {teamRows.map(t => (
                <tr key={t.id} className="clickable" onClick={() => go('team-detail')}>
                  <td><div className="row" style={{ gap: 10 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: t.color }}/>{t.name}</div></td>
                  <td className="num">{t.members}</td>
                  <td className="right num">{fmtMoney(t.spend, cur)}</td>
                  <td className="right num">{fmtMoney(t.per_user, cur)}</td>
                  <td className="right num" style={{ color: t.delta >= 0 ? 'var(--danger)' : 'var(--accent)' }}>{fmtDelta(t.delta)}</td>
                  <td><Sparkline data={Array.from({length: 14}, () => 500 + Math.random()*1000)} color={t.color} style={tweaks.chart} w={120} h={24} /></td>
                  <td className="right"><Icon name="chevron-right" size={14} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== TEAMS ==========
function TeamsPage({ tweaks, go }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const rows = D.teams.map((t, i) => ({
    ...t,
    spend: [28420, 3100, 27100, 1240, 1380, 820, 260, 420][i] || 400,
    budget: [32000, 4000, 28000, 2000, 3500, 1500, 500, 1000][i] || 1000,
    per_user: [592, 141, 1426, 89, 115, 91, 43, 84][i] || 80,
    top_tool: ['Claude Code', 'ChatGPT Team', 'Anthropic API', 'Midjourney', 'Claude Teams', 'ChatGPT Team', 'ChatGPT Team', 'ChatGPT Team'][i],
    delta: [0.18, 0.05, 0.41, 0.12, -0.08, 0.02, 0.0, 0.09][i],
  }));

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Teams tracked" value="8" delta={0}/>
        <KPI label="Avg spend / user" value={fmtMoney(312, cur)} delta={0.08}/>
        <KPI label="Over-budget teams" value="2" delta={0.2} deltaDirGood="down"/>
        <KPI label="Most efficient" value="Sales" delta={null}/>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="seg"><button className="active">All</button><button>Over budget</button><button>Inefficient</button></div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 9, top: 8, color: 'var(--muted)' }}><Icon name="search" size={13}/></span>
            <input className="input search" style={{ width: 240, paddingLeft: 28 }} placeholder="Search teams…" />
          </div>
          <div className="spacer"/>
          <button className="btn"><Icon name="filter" size={13}/>Filter</button>
          <button className="btn"><Icon name="download" size={13}/>Export</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Team</th><th>Members</th><th>Top tool</th><th className="right">MTD spend</th>
            <th>Budget usage</th><th className="right">Per user</th><th className="right">Δ vs prev</th><th style={{ width: 140 }}>Trend</th>
          </tr></thead>
          <tbody>
            {rows.map(t => {
              const pct = Math.min(1, t.spend / t.budget);
              const over = pct > 0.95;
              return (
                <tr key={t.id} className="clickable">
                  <td><div className="row" style={{ gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: t.color }}/><strong>{t.name}</strong></div></td>
                  <td className="num">{t.members}</td>
                  <td>{t.top_tool}</td>
                  <td className="right num">{fmtMoney(t.spend, cur)}</td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={'bar ' + (over ? 'danger' : pct > 0.75 ? 'warn' : 'accent')} style={{ flex: 1 }}>
                        <span style={{ width: (pct * 100).toFixed(0) + '%' }} />
                      </div>
                      <span className="num" style={{ fontSize: 11, color: 'var(--muted)', minWidth: 40 }}>{(pct * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="right num">{fmtMoney(t.per_user, cur)}</td>
                  <td className="right num" style={{ color: t.delta >= 0 ? 'var(--danger)' : 'var(--accent)' }}>{fmtDelta(t.delta)}</td>
                  <td><Sparkline data={Array.from({length:14},()=>200+Math.random()*800)} color={t.color} style={tweaks.chart} w={120} h={24}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Cost vs output · last 30d</div><div className="sub">PRs merged / $1k spent · higher is better</div></div></div>
          <div className="card-b">
            <svg viewBox="0 0 520 240" style={{ width: '100%', height: 240 }}>
              <line x1="40" y1="210" x2="510" y2="210" stroke="var(--hairline)"/>
              <line x1="40" y1="10" x2="40" y2="210" stroke="var(--hairline)"/>
              {[0.25,0.5,0.75].map((f,i)=><line key={i} x1="40" x2="510" y1={210 - f*200} y2={210 - f*200} stroke="var(--hairline)" strokeDasharray="2 3"/>)}
              {rows.map((t, i) => {
                const x = 60 + (t.spend / 30000) * 430;
                const y = 210 - Math.min(1, t.per_user / 1500) * 200;
                const r = 6 + Math.sqrt(t.members) * 2;
                return <g key={t.id}>
                  <circle cx={x} cy={y} r={r} fill={t.color} opacity="0.25"/>
                  <circle cx={x} cy={y} r={r} fill="none" stroke={t.color} strokeWidth="1.5"/>
                  <text x={x + r + 4} y={y + 3} fontSize="11" fill="var(--ink)">{t.name}</text>
                </g>;
              })}
              <text x="275" y="234" textAnchor="middle" fontSize="10" fill="var(--muted)">spend →</text>
              <text x="22" y="110" textAnchor="middle" fontSize="10" fill="var(--muted)" transform="rotate(-90 22 110)">efficiency →</text>
            </svg>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Team × Tool heatmap</div><div className="sub">$ spent · darker = higher</div></div></div>
          <div className="card-b" style={{ overflowX: 'auto' }}>
            <Heatmap
              labelY={['Eng','Product','Data','Mkt','CS','Sales']}
              labelX={['OAI API','Anth API','Vertex','Copilot','Cursor','ClaudeCode','ChatGPT','Claude T.','MJ','Eleven']}
              max={10000}
              data={[
                [4200,8200,1200,620,1520,4200,360,820,0,120],
                [320,420,180,60,120,0,560,380,80,0],
                [9800,10000,4200,0,280,620,180,120,0,80],
                [120,80,40,0,0,0,220,80,180,0],
                [160,220,60,0,0,0,480,260,0,420],
                [60,90,20,0,60,0,320,180,0,120],
              ]}
              cell={22}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== PEOPLE ==========
function PeoplePage({ tweaks, go }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const [team, setTeam] = useState('All');
  const rows = team === 'All' ? D.users : D.users.filter(u => u.team === team);

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Active users" value="187" delta={0.03} deltaDirGood="up"/>
        <KPI label="Top 10% burn" value={fmtMoney(18400, cur)} delta={0.22} deltaDirGood="down"/>
        <KPI label="Idle seats"   value="14" delta={-0.3} deltaDirGood="down"/>
        <KPI label="Median / user"value={fmtMoney(312, cur)} delta={0.06} deltaDirGood="down"/>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="seg">
            {['All','Engineering','Data & ML','Product','Marketing','Sales','Customer Support'].map(t => (
              <button key={t} className={team===t?'active':''} onClick={()=>setTeam(t)}>{t}</button>
            ))}
          </div>
          <div className="spacer"/>
          <input className="input" placeholder="Search name or email…" style={{ width: 240 }}/>
          <button className="btn"><Icon name="download" size={13}/>Export</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Person</th><th>Team</th><th>Top tool</th>
            <th className="right">Tokens</th><th className="right">PRs merged</th>
            <th className="right">Cost (30d)</th><th className="right">$ per PR</th>
            <th style={{ width: 140 }}>Efficiency</th>
          </tr></thead>
          <tbody>
            {rows.map(u => {
              const eff = u.prs > 0 ? (u.cost / u.prs) : null;
              const effPct = eff ? Math.min(1, 100 / eff) : 0;
              return (
                <tr key={u.email} className="clickable" onClick={() => go('profile:' + u.email)}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar name={u.name}/>
                      <div className="col" style={{ gap: 0 }}>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{u.email} · {u.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>{u.team}</td>
                  <td><Chip>{u.topTool}</Chip></td>
                  <td className="right num">{fmtNum(u.tokens)}</td>
                  <td className="right num">{u.prs || '—'}</td>
                  <td className="right num">{fmtMoney(u.cost, cur)}</td>
                  <td className="right num">{eff ? fmtMoney(Math.round(eff), cur) : '—'}</td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={'bar ' + (effPct > 0.7 ? 'accent' : effPct > 0.4 ? 'warn' : 'danger')} style={{ flex: 1 }}>
                        <span style={{ width: (effPct*100).toFixed(0)+'%' }}/>
                      </div>
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

// ========== TOOLS ==========
function ToolsPage({ tweaks, go }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const [filter, setFilter] = useState('All');
  const rows = D.tools.filter(t => filter === 'All' || t.category === filter);

  const statusChip = s => {
    if (s === 'approved') return <Chip tone="accent" dot>approved</Chip>;
    if (s === 'pending') return <Chip tone="warn" dot>pending</Chip>;
    if (s === 'shadow') return <Chip tone="danger" dot>shadow</Chip>;
    return <Chip>{s}</Chip>;
  };

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Tools in use" value="34" delta={0.12} deltaDirGood="up" spark={[24,25,27,28,30,31,32,34]} chart={tweaks.chart}/>
        <KPI label="Unapproved (shadow)" value="5" delta={0.4} deltaDirGood="down"/>
        <KPI label="Monthly subscription" value={fmtMoney(12540, cur)} delta={0.04}/>
        <KPI label="Usage-based spend"  value={fmtMoney(92210, cur)} delta={0.31}/>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="seg">
            {['All','LLM API','Coding','Chat seat','Image','Video','Voice','Audio'].map(t => (
              <button key={t} className={filter===t?'active':''} onClick={()=>setFilter(t)}>{t}</button>
            ))}
          </div>
          <div className="spacer"/>
          <button className="btn"><Icon name="plus" size={13}/>Connect tool</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Tool</th><th>Category</th><th>Status</th><th>Provisioning</th>
            <th className="right">Seats</th><th className="right">Spend (30d)</th>
            <th className="right">Δ</th><th style={{ width: 140 }}>Trend</th><th></th>
          </tr></thead>
          <tbody>
            {rows.map(t => {
              const delta = t.prev > 0 ? (t.spend - t.prev) / t.prev : null;
              return (
                <tr key={t.id} className="clickable">
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600 }}>{t.vendor[0]}</div>
                      <div className="col" style={{ gap: 0 }}>
                        <span style={{ fontWeight: 500 }}>{t.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t.vendor}</span>
                      </div>
                    </div>
                  </td>
                  <td>{t.category}</td>
                  <td>{statusChip(t.status)}</td>
                  <td><span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{t.prov}</span></td>
                  <td className="right num">{t.seats ?? '—'}</td>
                  <td className="right num">{fmtMoney(t.spend, cur)}</td>
                  <td className="right num" style={{ color: delta == null ? 'var(--muted)' : delta >= 0 ? 'var(--danger)' : 'var(--accent)' }}>
                    {delta == null ? '—' : fmtDelta(delta)}
                  </td>
                  <td><Sparkline data={Array.from({length: 14}, () => 30 + Math.random()*100)} color="var(--chart-2)" style={tweaks.chart} w={120} h={24}/></td>
                  <td className="right"><Icon name="chevron-right" size={14}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { KPI, DashboardPage, TeamsPage, PeoplePage, ToolsPage });
