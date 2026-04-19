'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/src/components/ui/icon';
import { Avatar } from '@/src/components/ui/avatar';
import { NAV } from '@/src/lib/nav';

export function Topbar() {
  const pathname = usePathname();
  const current = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const all = NAV.flatMap((s) => s.items);

  return (
    <header
      className="flex items-center gap-4 bg-[var(--surface)] border-b border-[var(--hairline)] col-span-full"
      style={{ padding: '0 20px', height: 56 }}
    >
      <div className="flex items-center gap-[10px]" style={{ border: 0, padding: 0, margin: 0 }}>
        <div
          className="grid place-items-center w-[26px] h-[26px] rounded-[6px] bg-[var(--ink)] text-[var(--bg)] font-mono font-semibold text-[14px]"
          style={{ letterSpacing: '-0.02em' }}
        >
          U.
        </div>
        <div className="font-semibold text-[14px]" style={{ letterSpacing: '-0.01em' }}>
          Usagely
        </div>
      </div>

      <div className="flex gap-1" style={{ marginLeft: 24 }}>
        {all.slice(0, 7).map((it) => (
          <Link
            key={it.id}
            href={`/${it.id}`}
            className={`flex items-center gap-[10px] rounded-[6px] text-[13px] select-none border cursor-pointer ${
              current === it.id
                ? 'bg-[var(--surface-2)] text-[var(--ink)] border-[var(--hairline)]'
                : 'text-[var(--ink-2)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
            }`}
            style={{ padding: '6px 10px' }}
          >
            <Icon name={it.icon} size={14} />
            <span>{it.label}</span>
          </Link>
        ))}
        <button
          className="flex items-center gap-[10px] rounded-[6px] text-[13px] select-none border border-transparent text-[var(--ink-2)] cursor-pointer hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          style={{ padding: '6px 10px' }}
        >
          <span>More</span>
          <Icon name="chevron-down" size={12} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="relative">
        <input
          className="h-8 rounded-[6px] border border-[var(--hairline)] bg-[var(--surface-2)] text-[13px] outline-none"
          placeholder="Search tools, people, budgets…"
          style={{ width: 260, paddingLeft: 28, paddingRight: 10 }}
        />
        <span className="absolute left-[9px] top-[9px] text-[var(--muted)]">
          <Icon name="search" size={14} />
        </span>
      </div>

      <button className="relative inline-flex items-center justify-center w-8 h-8 rounded-[6px] text-[var(--ink-2)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">
        <Icon name="bell" size={15} />
        <span
          className="absolute w-[6px] h-[6px] rounded-full bg-[var(--danger)]"
          style={{ top: 6, right: 6 }}
        />
      </button>

      <Avatar name="Priya Rao" />
    </header>
  );
}
