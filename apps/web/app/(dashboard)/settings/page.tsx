'use client';

import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api/client';
import type { SettingsResponse } from '@/src/lib/api/types';
import { Chip } from '@/src/components/ui/chip';
import { Icon } from '@/src/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

const S = {
  pageBody: { padding: '20px 28px 60px', display: 'flex', flexDirection: 'column' as const, gap: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 8, overflow: 'hidden' as const },
  cardH: { padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 },
  cardB: { padding: '14px 16px' },
  cardBFlush: { padding: 0 },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
  btnSm: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 6, color: 'var(--ink)', cursor: 'pointer' } as React.CSSProperties,
};

function SettingsSkeleton() {
  return (
    <div style={S.pageBody}>
      <div style={S.grid2}>
        <Skeleton className="h-[500px] rounded-lg" />
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [guardrails, setGuardrails] = useState<Array<{ title: string; description: string; enabled: boolean }>>([]);

  useEffect(() => {
    api.settings().then(d => {
      setData(d);
      setGuardrails(d.guardrails.map(g => ({ ...g })));
    }).catch(console.error);
  }, []);

  if (!data) return <SettingsSkeleton />;

  const toggle = (i: number) => {
    setGuardrails(prev => prev.map((g, idx) => idx === i ? { ...g, enabled: !g.enabled } : g));
  };

  return (
    <div style={S.pageBody}>
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardH}>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>Integrations</div><div style={{ fontSize: 11.5, color: 'var(--muted)' }}>10 available · {data.integrations.filter(i => i.status === 'connected').length} connected</div></div>
            <div style={{ flex: 1 }} />
            <button style={S.btnSm}><Icon name="plus" size={12} /> Add</button>
          </div>
          <div style={S.cardBFlush}>
            {data.integrations.map(int => (
              <div key={int.name} style={{ padding: '10px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{int.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{int.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{int.category} · {int.info}</div>
                </div>
                {int.status === 'connected' ? <Chip tone="accent" dot>connected</Chip> : <button style={S.btnSm}>Connect</button>}
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardH}><div><div style={{ fontSize: 13, fontWeight: 600 }}>Guardrails &amp; governance</div></div></div>
          <div style={{ ...S.cardB, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {guardrails.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.description}</div>
                </div>
                <div
                  onClick={() => toggle(i)}
                  style={{ width: 36, height: 20, borderRadius: 999, background: r.enabled ? 'var(--accent)' : 'var(--surface-3)', border: '1px solid var(--hairline)', position: 'relative', cursor: 'pointer' }}
                >
                  <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'var(--bg)', top: 2, left: r.enabled ? 19 : 2, transition: 'left 0.15s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
