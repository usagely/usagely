'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/src/components/ui/icon';
import { Avatar } from '@/src/components/ui/avatar';
import { NAV, ENTERPRISE_ONLY } from '@/src/lib/nav';

export interface SidebarProps {
  edition?: 'oss' | 'enterprise';
}

export function Sidebar({ edition = 'oss' }: SidebarProps) {
  const pathname = usePathname();
  const isOSS = edition === 'oss';

  const current = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';

  return (
    <aside
      className="flex flex-col sticky top-0 h-screen overflow-y-auto bg-[var(--surface)] border-r border-[var(--hairline)]"
      style={{ padding: '14px 10px' }}
    >
      <div
        className="flex items-center gap-[10px] border-b border-[var(--hairline)] mb-[10px]"
        style={{ padding: '6px 8px 14px' }}
      >
        <div
          className="grid place-items-center w-[26px] h-[26px] rounded-[6px] font-mono font-semibold text-[14px]"
          style={{
            background: isOSS ? 'transparent' : 'var(--ink)',
            color: isOSS ? 'var(--ink)' : 'var(--bg)',
            border: isOSS ? '1px solid var(--hairline-strong)' : 'none',
            letterSpacing: '-0.02em',
          }}
        >
          L/
        </div>
        <div>
          <div className="font-semibold text-[14px]" style={{ letterSpacing: '-0.01em' }}>
            Usagely
          </div>
          <div
            className="font-mono text-[var(--muted)]"
            style={{ fontSize: '10.5px' }}
          >
            {isOSS ? 'oss · self-hosted' : 'acme.co · enterprise'}
          </div>
        </div>
      </div>

      {NAV.map((sec) => (
        <div key={sec.group}>
          <div
            className="uppercase text-[var(--muted)]"
            style={{
              padding: '10px 8px 4px',
              fontSize: '10.5px',
              letterSpacing: '0.08em',
            }}
          >
            {sec.group}
          </div>
          {sec.items.map((it) => {
            const locked = isOSS && ENTERPRISE_ONLY.has(it.id);
            const active = current === it.id;
            return (
              <Link
                key={it.id}
                href={`/${it.id}`}
                className={`flex items-center gap-[10px] rounded-[6px] text-[13px] select-none border cursor-pointer ${
                  active
                    ? 'bg-[var(--surface-2)] text-[var(--ink)] border-[var(--hairline)]'
                    : 'text-[var(--ink-2)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                }`}
                style={{
                  padding: '7px 10px',
                  opacity: locked ? 0.55 : 1,
                }}
              >
                <Icon name={it.icon} size={15} />
                <span>{it.label}</span>
                {locked ? (
                  <span className="ml-auto font-mono text-[var(--muted)]" style={{ fontSize: '10.5px', display: 'inline-flex' }}>
                    <Icon name="lock" size={11} />
                  </span>
                ) : it.badge ? (
                  <span className="ml-auto font-mono text-[var(--muted)]" style={{ fontSize: '10.5px' }}>
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="flex-1" />

      <div
        className="flex items-center gap-2 border-t border-[var(--hairline)] mt-2"
        style={{ padding: '10px 8px' }}
      >
        <Avatar name="You" />
        <Link href="/profile/priya@acme.co" className="flex-1 min-w-0 cursor-pointer">
          <div className="text-[12px] font-medium">Priya Rao</div>
          <div className="text-[11px] text-[var(--muted)]">FinOps Admin</div>
        </Link>
        <button
          className="inline-flex items-center justify-center w-7 h-7 rounded-[6px] text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          title="Sign out"
        >
          <Icon name="logout" size={14} />
        </button>
      </div>
    </aside>
  );
}
