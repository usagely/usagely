// Usagely — Shell (sidebar + topbar, login, tweaks)
const NAV = [
  { group: 'OVERVIEW', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'anomalies', label: 'Anomalies', icon: 'warn', badge: '4' },
  ]},
  { group: 'ALLOCATION', items: [
    { id: 'teams', label: 'Teams', icon: 'users' },
    { id: 'users', label: 'People', icon: 'users' },
    { id: 'tools', label: 'Tools & Vendors', icon: 'tools' },
    { id: 'models', label: 'Models & Tokens', icon: 'cpu' },
  ]},
  { group: 'CONTROL', items: [
    { id: 'budgets', label: 'Budgets', icon: 'budget' },
    { id: 'recommendations', label: 'Recommendations', icon: 'bolt', badge: '6' },
    { id: 'shadow', label: 'Shadow AI', icon: 'shadow', badge: '5' },
    { id: 'approvals', label: 'Approvals', icon: 'approve', badge: '3' },
    { id: 'forecast', label: 'Forecast', icon: 'forecast' },
  ]},
  { group: 'SYSTEM', items: [
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]},
];

// Features that require Enterprise edition (locked in OSS)
const ENTERPRISE_ONLY = new Set(['shadow', 'forecast', 'approvals', 'recommendations']);

const PAGE_META = {
  dashboard: { title: 'Dashboard', sub: 'Company · Q2 2026 · Month-to-date' },
  anomalies: { title: 'Anomalies', sub: 'Automated detection across all connected sources' },
  teams: { title: 'Teams', sub: 'Spend, efficiency and trend by cost center' },
  users: { title: 'People', sub: 'Individual contributor usage & efficiency' },
  profile: { title: 'Profile', sub: 'Detailed user view — usage, sessions and policies' },
  tools: { title: 'Tools & Vendors', sub: 'All approved and detected AI tools' },
  models: { title: 'Models & Tokens', sub: 'AI-native efficiency metrics across providers' },
  budgets: { title: 'Budgets', sub: 'Limits, utilization and alerts' },
  recommendations: { title: 'Recommendations', sub: 'AI-generated optimizations, ranked by projected savings' },
  shadow: { title: 'Shadow AI', sub: 'Detected un-approved tools across expenses, SSO and network' },
  approvals: { title: 'Approvals', sub: 'Requests for new AI tools' },
  forecast: { title: 'Forecast', sub: 'Projected spend based on 60-day trajectory' },
  settings: { title: 'Settings', sub: 'Integrations, guardrails and access' },
};

function Sidebar({ current, onNav, tweaks }) {
  const isOSS = tweaks.edition === 'oss';
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" style={{ background: isOSS ? 'transparent' : 'var(--ink)', color: isOSS ? 'var(--ink)' : 'var(--bg)', border: isOSS ? '1px solid var(--hairline-strong)' : 'none' }}>L/</div>
        <div>
          <div className="brand-name">Usagely</div>
          <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {isOSS ? 'oss · self-hosted' : 'acme.co · enterprise'}
          </div>
        </div>
      </div>
      {NAV.map(sec => (
        <div key={sec.group}>
          <div className="nav-section">{sec.group}</div>
          {sec.items.map(it => {
            const locked = isOSS && ENTERPRISE_ONLY.has(it.id);
            return (
              <div key={it.id} className={'nav-item' + (current === it.id ? ' active' : '')} onClick={() => onNav(it.id)} style={{ opacity: locked ? 0.55 : 1 }}>
                <Icon name={it.icon} size={15} />
                <span>{it.label}</span>
                {locked ? <span className="badge" style={{ display: 'inline-flex' }}><Icon name="lock" size={11}/></span>
                  : it.badge ? <span className="badge">{it.badge}</span> : null}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--hairline)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name="You" />
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onNav('profile:priya@acme.co')}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Priya Rao</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>FinOps Admin</div>
        </div>
        <button className="btn ghost icon" title="Sign out" onClick={() => onNav('__logout')}><Icon name="logout" size={14} /></button>
      </div>
    </aside>
  );
}

function TopbarNav({ current, onNav }) {
  const all = NAV.flatMap(s => s.items);
  return (
    <header className="topbar">
      <div className="brand" style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="brand-mark">U.</div>
        <div className="brand-name">Usagely</div>
      </div>
      <div className="topbar-nav">
        {all.slice(0, 7).map(it => (
          <div key={it.id} className={'nav-item' + (current === it.id ? ' active' : '')} onClick={() => onNav(it.id)}>
            <Icon name={it.icon} size={14} />
            <span>{it.label}</span>
          </div>
        ))}
        <div className="nav-item"><span>More</span><Icon name="chevron-down" size={12} /></div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative' }}>
        <Icon name="search" size={14} className="" />
        <input className="input search" placeholder="Search tools, people, budgets…" style={{ width: 260, paddingLeft: 28 }} />
        <span style={{ position: 'absolute', left: 9, top: 9, color: 'var(--muted)' }}><Icon name="search" size={14}/></span>
      </div>
      <button className="btn ghost icon"><Icon name="bell" size={15} /><span className="dot-red" style={{ marginLeft: -6, marginTop: -8 }}/></button>
      <Avatar name="Priya Rao" />
    </header>
  );
}

function PageHeader({ current }) {
  const meta = PAGE_META[current] || { title: current };
  return (
    <div className="page-header">
      <div className="col" style={{ flex: 1 }}>
        <div className="breadcrumb">
          <span>Acme Co.</span>
          <span className="crumb-sep">/</span>
          <span>FinOps</span>
          <span className="crumb-sep">/</span>
          <span style={{ color: 'var(--ink)' }}>{meta.title}</span>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <div className="page-title">{meta.title}</div>
          <Chip tone="accent" dot>live</Chip>
        </div>
        <div className="page-sub">{meta.sub}</div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <div className="seg">
          <button>7d</button><button className="active">30d</button><button>90d</button><button>YTD</button>
        </div>
        <button className="btn"><Icon name="filter" size={13}/>Filter</button>
        <button className="btn"><Icon name="download" size={13}/>Export</button>
        <button className="btn primary"><Icon name="plus" size={13}/>Create budget</button>
      </div>
    </div>
  );
}

// ========== LOGIN ==========
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('priya@acme.co');
  const [pw, setPw] = useState('••••••••');
  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="row" style={{ gap: 10 }}>
          <div className="brand-mark" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>U.</div>
          <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Usagely</div>
        </div>
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>FinOps for AI</div>
          <h1 style={{ fontSize: 38, lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
            Every token, prompt<br/>and seat — accounted for.
          </h1>
          <p style={{ opacity: 0.72, marginTop: 16, fontSize: 14, lineHeight: 1.55 }}>
            Usagely unifies AI spend across 40+ providers, attributes cost to teams and projects,
            and surfaces optimizations that cut your bill without cutting capability.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 32, paddingTop: 24, borderTop: '1px solid oklch(1 0 0 / 0.12)' }}>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>$4.2M</div><div style={{ fontSize: 11, opacity: 0.6 }}>saved YTD for customers</div></div>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>41</div><div style={{ fontSize: 11, opacity: 0.6 }}>native integrations</div></div>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500 }}>SOC 2</div><div style={{ fontSize: 11, opacity: 0.6 }}>Type II audited</div></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
          <span>v4.12.0</span><span>·</span><span>status: operational</span><span>·</span><span>us-east-1</span>
        </div>
        <svg aria-hidden style={{ position: 'absolute', right: -80, bottom: -80, opacity: 0.08 }} width="420" height="420" viewBox="0 0 420 420">
          <defs><pattern id="gr" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" stroke="currentColor" strokeWidth="0.5" fill="none"/></pattern></defs>
          <rect width="420" height="420" fill="url(#gr)"/>
        </svg>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={e => { e.preventDefault(); onLogin(); }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>Sign in</div>
            <h2 style={{ margin: '4px 0 4px', fontSize: 24, letterSpacing: '-0.01em', fontWeight: 500 }}>Welcome back.</h2>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Continue to your Acme workspace.</div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <button type="button" className="btn" style={{ height: 40, justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>Continue with Microsoft</button>
            <button type="button" className="btn" style={{ height: 40, justifyContent: 'center' }}><Icon name="link" size={14}/>Continue with Google Workspace</button>
            <button type="button" className="btn" style={{ height: 40, justifyContent: 'center' }}><Icon name="lock" size={14}/>Continue with Okta SSO</button>
          </div>
          <div className="row" style={{ gap: 10, color: 'var(--muted)', fontSize: 11 }}>
            <hr className="hr" style={{ flex: 1 }}/><span>OR</span><hr className="hr" style={{ flex: 1 }}/>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Work email</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: 8, color: 'var(--muted)' }}><Icon name="mail" size={14}/></span>
              <input className="input" style={{ paddingLeft: 32, height: 38 }} value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <label style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: 8, color: 'var(--muted)' }}><Icon name="lock" size={14}/></span>
              <input className="input" type="password" style={{ paddingLeft: 32, height: 38 }} value={pw} onChange={e => setPw(e.target.value)} />
            </div>
          </div>
          <button className="btn primary" type="submit" style={{ height: 40, justifyContent: 'center' }}>
            Sign in <Icon name="arrow-right" size={14}/>
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
            <a style={{ color: 'var(--ink-2)' }}>Forgot password?</a>
            <a style={{ color: 'var(--ink-2)' }}>Request access</a>
          </div>
        </form>
      </main>
    </div>
  );
}

// ========== TWEAKS ==========
function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const set = (k, v) => setTweaks(t => ({ ...t, [k]: v }));
  return (
    <div className="tweaks">
      <div className="tweaks-h">
        <Icon name="settings" size={14} />
        <div className="ttl">Tweaks</div>
        <div style={{ flex: 1 }}/>
        <button className="btn ghost icon" onClick={onClose}><Icon name="close" size={13}/></button>
      </div>
      <div className="tweaks-b">
        <div className="tweak-row">
          <label>Edition</label>
          <div className="seg">
            <button className={tweaks.edition === 'enterprise' ? 'active' : ''} onClick={() => set('edition', 'enterprise')}>Enterprise</button>
            <button className={tweaks.edition === 'oss' ? 'active' : ''} onClick={() => set('edition', 'oss')}>Open-source</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Theme</label>
          <div className="seg">
            <button className={tweaks.theme === 'light' ? 'active' : ''} onClick={() => set('theme', 'light')}>Light</button>
            <button className={tweaks.theme === 'dark' ? 'active' : ''} onClick={() => set('theme', 'dark')}>Dark</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Density</label>
          <div className="seg">
            <button className={tweaks.density === 'compact' ? 'active' : ''} onClick={() => set('density', 'compact')}>Compact</button>
            <button className={tweaks.density === 'default' ? 'active' : ''} onClick={() => set('density', 'default')}>Default</button>
            <button className={tweaks.density === 'comfortable' ? 'active' : ''} onClick={() => set('density', 'comfortable')}>Comfy</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Chart style</label>
          <div className="seg">
            <button className={tweaks.chart === 'line' ? 'active' : ''} onClick={() => set('chart', 'line')}>Line</button>
            <button className={tweaks.chart === 'area' ? 'active' : ''} onClick={() => set('chart', 'area')}>Area</button>
            <button className={tweaks.chart === 'bars' ? 'active' : ''} onClick={() => set('chart', 'bars')}>Bars</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Currency</label>
          <div className="seg">
            <button className={tweaks.currency === 'USD' ? 'active' : ''} onClick={() => set('currency', 'USD')}>USD</button>
            <button className={tweaks.currency === 'BRL' ? 'active' : ''} onClick={() => set('currency', 'BRL')}>BRL</button>
            <button className={tweaks.currency === 'EUR' ? 'active' : ''} onClick={() => set('currency', 'EUR')}>EUR</button>
          </div>
        </div>
        <div className="tweak-row">
          <label>Layout</label>
          <div className="seg">
            <button className={tweaks.layout === 'sidebar' ? 'active' : ''} onClick={() => set('layout', 'sidebar')}>Sidebar</button>
            <button className={tweaks.layout === 'topbar' ? 'active' : ''} onClick={() => set('layout', 'topbar')}>Topbar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopbarNav, PageHeader, LoginPage, TweaksPanel, NAV, PAGE_META });
