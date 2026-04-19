// Usagely — main screens part 2 (Models, Budgets, Recommendations, Shadow AI, Approvals, Forecast, Anomalies, Settings)

// ========== MODELS ==========
function ModelsPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const totalTokens = D.models.reduce((a, m) => a + m.tokens_in + m.tokens_out, 0);
  const totalCost = D.models.reduce((a, m) => a + m.cost, 0);
  const totalCalls = D.models.reduce((a, m) => a + m.calls, 0);

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Tokens (30d)" value={fmtNum(totalTokens)} delta={0.28} deltaDirGood="up"/>
        <KPI label="API cost (30d)" value={fmtMoney(totalCost, cur)} delta={0.19}/>
        <KPI label="$ per 1M tokens" value={fmtMoney(totalCost/(totalTokens/1_000_000), cur)} delta={-0.06} deltaDirGood="down"/>
        <KPI label="Calls (30d)" value={fmtNum(totalCalls)} delta={0.34} deltaDirGood="up"/>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Spend by model</div><div className="sub">30-day window</div></div></div>
          <div className="card-b">
            <svg viewBox="0 0 560 260" style={{ width: '100%', height: 260 }}>
              {D.models.map((m, i) => {
                const y = 20 + i * 32;
                const w = (m.cost / 22000) * 400;
                const color = ['var(--chart-1)','var(--chart-1)','var(--chart-2)','var(--chart-2)','var(--chart-2)','var(--chart-3)','var(--chart-3)'][i];
                return <g key={m.name}>
                  <text x="0" y={y + 4} fontSize="11" fill="var(--ink-2)" fontFamily="var(--font-mono)">{m.name}</text>
                  <rect x="160" y={y - 8} width={w} height="16" fill={color} rx="2" opacity="0.85"/>
                  <text x={160 + w + 8} y={y + 4} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">{fmtMoney(m.cost, cur)}</text>
                </g>;
              })}
            </svg>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Token mix · input vs output</div><div className="sub">Output is ~4× more expensive on most models</div></div></div>
          <div className="card-b">
            {D.models.map((m, i) => {
              const total = m.tokens_in + m.tokens_out;
              const inPct = (m.tokens_in / total) * 100;
              return (
                <div key={m.name} style={{ marginBottom: 10 }}>
                  <div className="row" style={{ justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="mono">{m.name}</span>
                    <span className="num" style={{ color: 'var(--muted)' }}>{fmtNum(total)}</span>
                  </div>
                  <div style={{ display: 'flex', height: 8, borderRadius: 2, overflow: 'hidden', background: 'var(--surface-3)', marginTop: 4 }}>
                    <div style={{ width: inPct + '%', background: 'var(--chart-2)' }}/>
                    <div style={{ width: (100-inPct) + '%', background: 'var(--chart-5)' }}/>
                  </div>
                </div>
              );
            })}
            <div className="row" style={{ gap: 14, marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--chart-2)', borderRadius: 2 }}/>input</span>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, background: 'var(--chart-5)', borderRadius: 2 }}/>output</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h"><div><div className="ttl">All models</div><div className="sub">Usage, cost and latency — 30 days</div></div></div>
        <table className="tbl">
          <thead><tr>
            <th>Model</th><th>Vendor</th>
            <th className="right">Calls</th><th className="right">Input tok</th><th className="right">Output tok</th>
            <th className="right">Cost</th><th className="right">$/1M tok</th><th className="right">p50 latency</th>
          </tr></thead>
          <tbody>
            {D.models.map(m => {
              const tot = m.tokens_in + m.tokens_out;
              return (
                <tr key={m.name}>
                  <td className="mono" style={{ fontSize: 12 }}>{m.name}</td>
                  <td>{m.vendor}</td>
                  <td className="right num">{fmtNum(m.calls)}</td>
                  <td className="right num">{fmtNum(m.tokens_in)}</td>
                  <td className="right num">{fmtNum(m.tokens_out)}</td>
                  <td className="right num">{fmtMoney(m.cost, cur)}</td>
                  <td className="right num">{fmtMoney(m.cost/(tot/1_000_000), cur)}</td>
                  <td className="right num">{m.avg_latency.toFixed(1)}s</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== BUDGETS ==========
function BudgetsPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Active budgets" value="6"/>
        <KPI label="Q2 committed" value={fmtMoney(320000, cur)}/>
        <KPI label="Q2 utilized" value="68%" delta={0.05} deltaDirGood="down"/>
        <KPI label="Forecast overrun" value={fmtMoney(11400, cur)} delta={0.3} deltaDirGood="down"/>
      </div>

      <div className="grid-2">
        {D.budgets.map(b => {
          const pct = b.used / b.limit;
          const over = pct >= 1;
          const warn = pct >= b.alert/100 && !over;
          return (
            <div key={b.id} className="card">
              <div className="card-h">
                <div>
                  <div className="ttl">{b.scope}</div>
                  <div className="sub">{b.period} · alert at {b.alert}%</div>
                </div>
                <div style={{ flex: 1 }}/>
                {over && <Chip tone="danger" dot>over budget</Chip>}
                {warn && <Chip tone="warn" dot>at risk</Chip>}
                {!over && !warn && <Chip tone="accent" dot>on track</Chip>}
              </div>
              <div className="card-b">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="stat-col"><div className="l">Used</div><div className="v">{fmtMoney(b.used, cur)}</div></div>
                  <div className="stat-col"><div className="l">Limit</div><div className="v">{fmtMoney(b.limit, cur)}</div></div>
                  <div className="stat-col"><div className="l">Remaining</div><div className="v">{fmtMoney(b.limit - b.used, cur)}</div></div>
                  <div className="stat-col"><div className="l">Utilization</div><div className="v">{(pct*100).toFixed(0)}%</div></div>
                </div>
                <div className="bar" style={{ marginTop: 14, height: 10 }}>
                  <span style={{ width: Math.min(100,pct*100)+'%', background: over ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--accent)' }}/>
                </div>
                <div className="row" style={{ marginTop: 12, gap: 8 }}>
                  <button className="btn sm">Edit</button>
                  <button className="btn sm ghost">Alert rules</button>
                  <div style={{ flex: 1 }}/>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }} className="mono">resets May 1</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== RECOMMENDATIONS ==========
function RecommendationsPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const [applied, setApplied] = useState({});
  const total = D.recommendations.reduce((a, r) => a + r.savings, 0);
  const accepted = D.recommendations.filter(r => applied[r.id]).reduce((a,r)=>a+r.savings, 0);

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Open recommendations" value={D.recommendations.length}/>
        <KPI label="Potential savings / mo" value={fmtMoney(total, cur)} />
        <KPI label="Accepted this mo" value={fmtMoney(accepted, cur)} delta={accepted > 0 ? 1 : null} deltaDirGood="up"/>
        <KPI label="Accuracy (realized)" value="92%" delta={0.04} deltaDirGood="up"/>
      </div>

      <div className="callout accent">
        <Icon name="bolt" size={15}/>
        <div>
          <strong>Usagely has found {fmtMoney(total, cur)} in potential monthly savings.</strong>{' '}
          Apply recommendations to propagate changes to your models, routing rules and licenses automatically.
        </div>
      </div>

      <div className="card">
        <div className="card-b flush">
          {D.recommendations.map(r => {
            const isApplied = applied[r.id];
            return (
              <div key={r.id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '1fr 180px 160px 120px', gap: 18, alignItems: 'center' }}>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.title}</div>
                    <Chip>{r.scope}</Chip>
                    <Chip tone={r.effort==='low'?'accent':'warn'}>{r.effort} effort</Chip>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{r.reason}</div>
                </div>
                <div className="stat-col"><div className="l">Projected savings</div><div className="v" style={{ color: 'var(--accent)' }}>{fmtMoney(r.savings, cur)}/mo</div></div>
                <div>
                  <div className="l" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confidence</div>
                  <div className="row" style={{ gap: 8, marginTop: 4 }}>
                    <div className="bar accent" style={{ flex: 1 }}><span style={{ width: (r.confidence*100)+'%' }}/></div>
                    <span className="num" style={{ fontSize: 11 }}>{(r.confidence*100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                  {isApplied ? <Chip tone="accent" dot>applied</Chip> : (
                    <>
                      <button className="btn sm">Dismiss</button>
                      <button className="btn sm primary" onClick={() => setApplied(a => ({...a, [r.id]: true}))}>Apply</button>
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

// ========== SHADOW AI ==========
function ShadowPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  return (
    <div className="page-body">
      <div className="callout danger">
        <Icon name="warn" size={15}/>
        <div>
          <strong>5 unapproved AI tools detected</strong> — combined monthly spend is {fmtMoney(500, cur)} and affects 26 people.
          Review and either sanction, block, or consolidate.
        </div>
      </div>
      <div className="kpi-grid">
        <KPI label="Unapproved tools" value="5"/>
        <KPI label="People affected" value="26"/>
        <KPI label="Shadow spend / mo" value={fmtMoney(500, cur)}/>
        <KPI label="Policy coverage" value="74%" delta={0.12} deltaDirGood="up"/>
      </div>
      <div className="card">
        <div className="card-h"><div><div className="ttl">Detected tools</div><div className="sub">From expense reports, SSO logs and egress analysis</div></div></div>
        <table className="tbl">
          <thead><tr><th>Tool</th><th>Detection source</th><th>First seen</th><th className="right">Users</th><th className="right">Monthly</th><th>Risk</th><th></th></tr></thead>
          <tbody>
            {D.shadow.map(s => (
              <tr key={s.tool}>
                <td style={{ fontWeight: 500 }}>{s.tool}</td>
                <td><Chip>{s.source}</Chip></td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{s.first_seen}</td>
                <td className="right num">{s.users}</td>
                <td className="right num">{fmtMoney(s.monthly, cur)}</td>
                <td><Chip tone={s.risk==='high'?'danger':s.risk==='medium'?'warn':'info'} dot>{s.risk}</Chip></td>
                <td className="right">
                  <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn sm">Block</button>
                    <button className="btn sm primary">Sanction</button>
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

// ========== APPROVALS ==========
function ApprovalsPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const [list, setList] = useState(D.approvals);
  const update = (id, status) => setList(ls => ls.map(p => p.id === id ? { ...p, status } : p));

  const statusChip = s => s === 'pending' ? <Chip tone="warn" dot>pending</Chip>
    : s === 'approved' ? <Chip tone="accent" dot>approved</Chip>
    : <Chip tone="danger" dot>denied</Chip>;

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Pending" value={list.filter(p=>p.status==='pending').length}/>
        <KPI label="Avg decision time" value="1.8d" delta={-0.2} deltaDirGood="down"/>
        <KPI label="Approved (30d)" value="12"/>
        <KPI label="Est. added spend" value={fmtMoney(4200, cur)}/>
      </div>
      <div className="card">
        <div className="card-h"><div><div className="ttl">Tool requests</div><div className="sub">Queue sorted by recency</div></div></div>
        <div className="card-b flush">
          {list.map(p => (
            <div key={p.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--hairline)', display: 'grid', gridTemplateColumns: '40px 1fr 160px 220px', gap: 14, alignItems: 'center' }}>
              <Avatar name={p.requester} lg/>
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <strong>{p.tool}</strong>
                  {statusChip(p.status)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.requester} · {p.when}</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>{p.reason}</div>
              </div>
              <div className="stat-col"><div className="l">Est. monthly</div><div className="v">{fmtMoney(p.cost_est, cur)}</div></div>
              <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                {p.status === 'pending' ? <>
                  <button className="btn sm" onClick={() => update(p.id, 'denied')}>Deny</button>
                  <button className="btn sm">Request info</button>
                  <button className="btn sm primary" onClick={() => update(p.id, 'approved')}>Approve</button>
                </> : <button className="btn sm ghost">View</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== FORECAST ==========
function ForecastPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  // Extend daily with 30d projection
  const hist = D.daily.map(d => d.value);
  const avgGrowth = 1.009;
  const proj = [];
  let last = hist[hist.length - 1];
  for (let i = 0; i < 30; i++) {
    last = last * avgGrowth * (0.95 + Math.random() * 0.1);
    proj.push(last);
  }
  const w = 920, h = 280, padL = 44, padR = 12, padT = 12, padB = 28;
  const iw = w - padL - padR, ih = h - padT - padB;
  const all = [...hist, ...proj];
  const max = Math.max(...all), min = 0, rng = max - min;
  const xs = all.map((_, i) => padL + (i / (all.length - 1)) * iw);
  const ys = all.map(v => padT + ih - ((v - min) / rng) * ih);
  const histPath = xs.slice(0, hist.length).map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const projPath = xs.slice(hist.length - 1).map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[hist.length - 1 + i].toFixed(1)}`).join(' ');
  const mtdTotal = hist.slice(-19).reduce((a,b)=>a+b,0);
  const projTotal = proj.reduce((a,b)=>a+b,0) + mtdTotal;

  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Next 30d forecast" value={fmtMoney(proj.reduce((a,b)=>a+b,0), cur)} delta={0.18}/>
        <KPI label="Q2 landing (projected)" value={fmtMoney(projTotal + 90000, cur)} delta={0.24}/>
        <KPI label="Budget vs forecast" value={fmtMoney(11400, cur)} delta={0.3} deltaDirGood="down"/>
        <KPI label="Confidence" value="82%" delta={0.03} deltaDirGood="up"/>
      </div>

      <div className="card">
        <div className="card-h"><div><div className="ttl">60 days history · 30 days forecast</div><div className="sub">Auto-regressive projection with 80% confidence band</div></div></div>
        <div className="card-b">
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
            {[0,1,2,3,4].map(i => {
              const y = padT + (i/4)*ih;
              const v = max - (i/4)*rng;
              return <g key={i}>
                <line x1={padL} x2={w-padR} y1={y} y2={y} stroke="var(--hairline)" strokeDasharray="2 4"/>
                <text x={padL-8} y={y+3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{fmtMoney(v)}</text>
              </g>;
            })}
            {/* Confidence band */}
            <path d={
              xs.slice(hist.length).map((x,i) => `${i===0?'M':'L'}${x},${ys[hist.length+i]-20}`).join(' ')
              + ' ' + xs.slice(hist.length).slice().reverse().map((x,i) => {
                const idx = hist.length + (xs.length - hist.length - 1 - i);
                return `L${x},${ys[idx]+20}`;
              }).join(' ') + 'Z'
            } fill="var(--chart-2)" opacity="0.1"/>
            <path d={histPath} stroke="var(--chart-1)" strokeWidth="1.8" fill="none"/>
            <path d={projPath} stroke="var(--chart-2)" strokeWidth="1.8" fill="none" strokeDasharray="4 3"/>
            <line x1={xs[hist.length-1]} x2={xs[hist.length-1]} y1={padT} y2={padT+ih} stroke="var(--muted)" strokeDasharray="2 2" opacity="0.5"/>
            <text x={xs[hist.length-1]+6} y={padT+14} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">today</text>
            <text x={padL+8} y={h-8} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)">Feb 19</text>
            <text x={xs[xs.length-1]-8} y={h-8} fontSize="10" fill="var(--muted)" fontFamily="var(--font-mono)" textAnchor="end">May 19</text>
          </svg>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Drivers of projected growth</div></div></div>
          <div className="card-b">
            {[
              { name: 'Data & ML · RAG workloads', pct: 0.42, cur: 'var(--chart-3)' },
              { name: 'Engineering · Claude Code usage', pct: 0.28, cur: 'var(--chart-1)' },
              { name: 'Product · new prompt tooling', pct: 0.14, cur: 'var(--chart-2)' },
              { name: 'Marketing · image/video gen', pct: 0.09, cur: 'var(--chart-4)' },
              { name: 'Customer Support · triage AI', pct: 0.07, cur: 'var(--chart-5)' },
            ].map((d,i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>{d.name}</span><span className="num" style={{ color: 'var(--muted)' }}>{(d.pct*100).toFixed(0)}%</span>
                </div>
                <div className="bar"><span style={{ width: (d.pct*100)+'%', background: d.cur }}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Scenarios</div></div></div>
          <div className="card-b">
            {[
              { name: 'Baseline', val: 238000, delta: 0.18, tone: 'info' },
              { name: 'Apply all recommendations', val: 216000, delta: 0.07, tone: 'accent' },
              { name: 'Hire +6 engineers', val: 264000, delta: 0.31, tone: 'warn' },
              { name: 'Launch new AI product', val: 312000, delta: 0.54, tone: 'danger' },
            ].map((s,i) => (
              <div key={i} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--hairline)' }}>
                <Chip tone={s.tone} dot>{s.name}</Chip>
                <div style={{ flex: 1 }}/>
                <span className="num" style={{ fontSize: 15 }}>{fmtMoney(s.val, cur)}</span>
                <span className="num" style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 8 }}>{fmtDelta(s.delta)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== ANOMALIES ==========
function AnomaliesPage({ tweaks }) {
  const D = window.LAI_DATA;
  const cur = tweaks.currency;
  const extended = [...D.anomalies,
    { id: 'a5', when: '4 days ago', title: 'Midjourney seat usage -68%', body: '5 seats unused for >21 days. Consider downgrading plan.', severity: 'warn', team: 'Marketing', owner: 'Emre Yilmaz' },
    { id: 'a6', when: '5 days ago', title: 'ElevenLabs token burn +44%', body: 'New voice cloning batch job. Expected behaviour.', severity: 'info', team: 'Product', owner: 'Noor Haddad' },
    { id: 'a7', when: '6 days ago', title: 'Cursor usage spike from new hires', body: '6 new seats provisioned; normalized within 48h.', severity: 'info', team: 'Engineering', owner: 'Priya Rao' },
  ];
  return (
    <div className="page-body">
      <div className="kpi-grid">
        <KPI label="Open anomalies" value="4" delta={0.3} deltaDirGood="down"/>
        <KPI label="Avg resolution" value="6.2h" delta={-0.18} deltaDirGood="down"/>
        <KPI label="Signal / noise" value="84%" delta={0.04} deltaDirGood="up"/>
        <KPI label="Auto-resolved (7d)" value="12"/>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="seg"><button className="active">All</button><button>Critical</button><button>Warning</button><button>Info</button></div>
          <div className="spacer"/>
          <button className="btn"><Icon name="filter" size={13}/>Filter</button>
          <button className="btn"><Icon name="settings" size={13}/>Detection rules</button>
        </div>
        <div className="card-b flush">
          {extended.map(a => (
            <div key={a.id} className="anom" style={{ borderLeftColor: a.severity==='danger'?'var(--danger)':a.severity==='warn'?'var(--warn)':'var(--info)' }}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Chip tone={a.severity==='danger'?'danger':a.severity==='warn'?'warn':'info'}>{a.severity}</Chip>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.body}</div>
                <div className="meta" style={{ marginTop: 4 }}>{a.when} · {a.team} · owner {a.owner}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm">Snooze</button>
                <button className="btn sm">Acknowledge</button>
                <button className="btn sm primary">Investigate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== SETTINGS ==========
function SettingsPage({ tweaks }) {
  const integrations = [
    { name: 'OpenAI', cat: 'LLM API', status: 'connected', info: '3 keys · last sync 2m ago' },
    { name: 'Anthropic', cat: 'LLM API', status: 'connected', info: '2 keys · last sync 2m ago' },
    { name: 'Google Vertex', cat: 'LLM API', status: 'connected', info: 'GCP project acme-prod' },
    { name: 'GitHub Copilot', cat: 'Coding', status: 'connected', info: 'Enterprise · 42 seats' },
    { name: 'Cursor', cat: 'Coding', status: 'connected', info: 'Team API · 38 seats' },
    { name: 'Okta', cat: 'Identity', status: 'connected', info: 'SCIM provisioning on' },
    { name: 'Ramp', cat: 'Expenses', status: 'connected', info: 'Auto-classify AI vendors' },
    { name: 'Slack', cat: 'Notifications', status: 'connected', info: '#ai-finops' },
    { name: 'Snowflake', cat: 'Warehouse', status: 'disconnected', info: 'Send daily export' },
    { name: 'Jira', cat: 'Productivity', status: 'disconnected', info: 'Correlate work ↔ spend' },
  ];
  return (
    <div className="page-body">
      <div className="grid-2">
        <div className="card">
          <div className="card-h"><div><div className="ttl">Integrations</div><div className="sub">10 available · 8 connected</div></div><div style={{flex:1}}/><button className="btn sm"><Icon name="plus" size={12}/>Add</button></div>
          <div className="card-b flush">
            {integrations.map(i => (
              <div key={i.name} style={{ padding: '10px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{i.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{i.cat} · {i.info}</div>
                </div>
                {i.status === 'connected' ? <Chip tone="accent" dot>connected</Chip> : <button className="btn sm">Connect</button>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><div><div className="ttl">Guardrails & governance</div></div></div>
          <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { t: 'Require approval for new tools', d: 'Block provisioning of unknown vendors.', on: true },
              { t: 'Auto-reclaim idle seats (>30d)', d: 'Downgrade Copilot/Cursor seats with no activity.', on: true },
              { t: 'Cap per-user daily token spend', d: 'Alert at $50/user/day.', on: true },
              { t: 'Block Shadow AI via egress', d: 'Drop requests to non-sanctioned domains.', on: false },
              { t: 'Require tagging on all API keys', d: 'Enforce cost-center tag at key creation.', on: true },
              { t: 'Redact PII before logging prompts', d: 'Detect & mask email/phone/SSN.', on: true },
            ].map((r, i) => (
              <div key={i} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.d}</div>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: r.on ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--hairline)', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'var(--bg)', top: 2, left: r.on ? 19 : 2, transition: 'left 0.15s' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ModelsPage, BudgetsPage, RecommendationsPage, ShadowPage, ApprovalsPage, ForecastPage, AnomaliesPage, SettingsPage });
