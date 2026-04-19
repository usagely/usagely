// Usagely — shared primitives (icons, formatters, charts)
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const FX = { USD: { sym: '$', rate: 1, code: 'USD' }, BRL: { sym: 'R$', rate: 5.05, code: 'BRL' }, EUR: { sym: '€', rate: 0.93, code: 'EUR' } };

function fmtMoney(n, cur = 'USD') {
  const f = FX[cur] || FX.USD;
  const val = (n || 0) * f.rate;
  const abs = Math.abs(val);
  let str;
  if (abs >= 1_000_000) str = (val / 1_000_000).toFixed(2) + 'M';
  else if (abs >= 10_000) str = (val / 1_000).toFixed(1) + 'k';
  else if (abs >= 1_000) str = val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  else str = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return f.sym + str;
}
function fmtMoneyFull(n, cur = 'USD') {
  const f = FX[cur] || FX.USD;
  const val = (n || 0) * f.rate;
  return f.sym + val.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}
function fmtNum(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}
function fmtPct(n, digits = 1) { return (n * 100).toFixed(digits) + '%'; }
function fmtDelta(n) { const s = n >= 0 ? '+' : ''; return s + (n * 100).toFixed(1) + '%'; }

// --- ICONS (single-weight stroke, original) ---
const Icon = ({ name, size = 16, className = '' }) => {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', className };
  switch (name) {
    case 'home': return <svg {...common}><path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>;
    case 'chart': return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'users': return <svg {...common}><circle cx="9" cy="9" r="3.2"/><path d="M3 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"/><circle cx="17" cy="8" r="2.4"/><path d="M15 13.5c3 0 6 1.6 6 5.5"/></svg>;
    case 'tools': return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><rect x="14" y="14" width="7" height="7" rx="1.2"/></svg>;
    case 'cpu': return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM2 10v4M2 7v0M22 10v4M10 2h4M10 22h4M7 2v0"/></svg>;
    case 'budget': return <svg {...common}><path d="M3 12a9 9 0 1 0 9-9"/><path d="M12 3v9l6 4"/></svg>;
    case 'bolt': return <svg {...common}><path d="M13 3 4 14h6l-1 7 9-11h-6z"/></svg>;
    case 'shadow': return <svg {...common}><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 14l9 5 9-5"/></svg>;
    case 'approve': return <svg {...common}><path d="M4 12l5 5L20 6"/></svg>;
    case 'forecast': return <svg {...common}><path d="M3 18c3-4 6-4 9 0s6 2 9-4"/><path d="M3 18v2h18"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M6 13l6 6 6-6"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'filter': return <svg {...common}><path d="M3 5h18l-7 9v5l-4 2v-7z"/></svg>;
    case 'download': return <svg {...common}><path d="M12 3v13M6 11l6 6 6-6M5 21h14"/></svg>;
    case 'warn': return <svg {...common}><path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.5"/></svg>;
    case 'spark': return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'close': return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'mail': return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
    case 'lock': return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'link': return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'logout': return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9"/></svg>;
    case 'dots': return <svg {...common}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>;
    case 'circle-dot': return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>;
    default: return null;
  }
};

// --- AVATAR ---
const Avatar = ({ name, lg }) => {
  const letters = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return <span className={'avatar' + (lg ? ' lg' : '')}>{letters}</span>;
};

// --- CHIP ---
const Chip = ({ tone = '', dot, children }) => (
  <span className={'chip ' + tone}>
    {dot && <span className="dot" />}
    {children}
  </span>
);

// --- SPARKLINE ---
function Sparkline({ data, w = 90, h = 28, color = 'currentColor', style = 'line' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * w);
  const ys = data.map(v => h - ((v - min) / rng) * (h - 4) - 2);
  if (style === 'bars') {
    const bw = (w / data.length) * 0.7;
    return <svg width={w} height={h}>{data.map((v, i) => {
      const y = ys[i]; const x = xs[i] - bw/2;
      return <rect key={i} x={x} y={y} width={bw} height={h - y - 2} fill={color} opacity="0.7"/>;
    })}</svg>;
  }
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  if (style === 'area') {
    const dArea = d + ` L${w},${h} L0,${h}Z`;
    return <svg width={w} height={h}>
      <path d={dArea} fill={color} opacity="0.18"/>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>;
  }
  return <svg width={w} height={h}><path d={d} stroke={color} strokeWidth="1.5" fill="none"/></svg>;
}

// --- BIG CHART (line/area/bars) ---
function Chart({ data, w = 920, h = 240, style = 'area', color, annotate, showGrid = true, xLabels = true }) {
  const c = color || 'var(--chart-1)';
  const padL = 44, padR = 12, padT = 12, padB = 28;
  const iw = w - padL - padR, ih = h - padT - padB;
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const vals = data.map(d => d.value ?? d);
  const max = Math.max(...vals);
  const min = Math.min(0, Math.min(...vals));
  const rng = max - min || 1;
  const xs = data.map((_, i) => padL + (i / (data.length - 1)) * iw);
  const ys = vals.map(v => padT + ih - ((v - min) / rng) * ih);
  const gridY = 4;
  const gridLines = Array.from({ length: gridY + 1 }, (_, i) => {
    const y = padT + (i / gridY) * ih;
    const v = max - (i / gridY) * (max - min);
    return { y, v };
  });

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const areaPath = path + ` L${xs[xs.length - 1]},${padT + ih} L${xs[0]},${padT + ih}Z`;

  // x labels: first, last, a few between
  const labelIdxs = xLabels ? [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1] : [];

  return (
    <svg width={w} height={h} style={{ display: 'block', width: '100%' }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {showGrid && gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} x2={w - padR} y1={g.y} y2={g.y} stroke="var(--hairline)" strokeDasharray={i === gridY ? '' : '2 4'} />
          <text x={padL - 8} y={g.y + 3} fontSize="10" textAnchor="end" fill="var(--muted)" fontFamily="var(--font-mono)">{fmtMoney(g.v)}</text>
        </g>
      ))}
      {style === 'bars' ? data.map((_, i) => {
        const bw = Math.max(2, (iw / data.length) * 0.7);
        const x = xs[i] - bw / 2;
        const y = ys[i];
        return <rect key={i} x={x} y={y} width={bw} height={padT + ih - y} fill={c} opacity="0.85" rx="1" />;
      }) : (
        <>
          {style === 'area' && <path d={areaPath} fill={c} opacity="0.14" />}
          <path d={path} fill="none" stroke={c} strokeWidth="1.8" />
          {/* points */}
          {data.length < 40 && xs.map((x, i) => (
            <circle key={i} cx={x} cy={ys[i]} r="2" fill="var(--bg)" stroke={c} strokeWidth="1.2" />
          ))}
        </>
      )}
      {annotate && annotate.map((a, i) => {
        const idx = a.index;
        if (idx == null) return null;
        const x = xs[idx], y = ys[idx];
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={padT} y2={padT + ih} stroke="var(--danger)" strokeDasharray="2 3" opacity="0.6" />
            <circle cx={x} cy={y} r="4" fill="var(--danger)" />
            <rect x={x - 55} y={y - 34} width="110" height="22" rx="4" fill="var(--surface)" stroke="var(--hairline)" />
            <text x={x} y={y - 19} fontSize="10.5" textAnchor="middle" fill="var(--ink)">{a.label}</text>
          </g>
        );
      })}
      {labelIdxs.map((i, k) => (
        <text key={k} x={xs[i]} y={h - 8} fontSize="10" textAnchor="middle" fill="var(--muted)" fontFamily="var(--font-mono)">
          {data[i].date ? data[i].date.slice(5) : ''}
        </text>
      ))}
    </svg>
  );
}

// --- DONUT ---
function Donut({ segments, size = 160, thickness = 18, center }) {
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--hairline)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * circ;
        const gap = circ - dash;
        const off = -acc * circ;
        acc += frac;
        return <circle key={i} cx={c} cy={c} r={r} fill="none"
                       stroke={s.color} strokeWidth={thickness}
                       strokeDasharray={`${dash} ${gap}`} strokeDashoffset={off}
                       transform={`rotate(-90 ${c} ${c})`} />;
      })}
      {center && <>
        <text x={c} y={c - 4} fontSize="11" textAnchor="middle" fill="var(--muted)">{center.label}</text>
        <text x={c} y={c + 14} fontSize="17" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontWeight="500">{center.value}</text>
      </>}
    </svg>
  );
}

// --- HEATMAP ---
function Heatmap({ rows, cols, data, max, labelY = [], labelX = [], cell = 18 }) {
  const m = max || Math.max(...data.flat());
  return (
    <div style={{ display: 'inline-block' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
        <thead>
          <tr>
            <th></th>
            {labelX.map((l, i) => <th key={i} style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, padding: '2px 4px', fontFamily: 'var(--font-mono)' }}>{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              <td style={{ fontSize: 11, color: 'var(--muted)', paddingRight: 8, whiteSpace: 'nowrap' }}>{labelY[ri]}</td>
              {row.map((v, ci) => {
                const intensity = v / m;
                const bg = `color-mix(in oklab, var(--accent) ${Math.round(intensity * 100)}%, var(--surface-2))`;
                return <td key={ci} style={{ width: cell, height: cell, background: bg, borderRadius: 2 }} title={v} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// expose
Object.assign(window, {
  fmtMoney, fmtMoneyFull, fmtNum, fmtPct, fmtDelta, FX,
  Icon, Avatar, Chip, Sparkline, Chart, Donut, Heatmap
});
