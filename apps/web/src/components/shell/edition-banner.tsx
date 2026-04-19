'use client';

import type { Edition } from '@/src/lib/tweaks-context';

interface EditionBannerProps {
  edition: Edition;
}

export function EditionBanner({ edition }: EditionBannerProps) {
  if (edition === 'enterprise') {
    return (
      <div className="flex items-center gap-3 px-7 py-2 bg-[var(--ink)] text-[var(--bg)] text-xs">
        <span className="font-mono text-[11px] px-1.5 py-px border border-[color-mix(in_oklab,var(--bg)_40%,transparent)] rounded-[3px]">
          ENTERPRISE
        </span>
        <span>Acme Co &middot; Unlimited seats &middot; SOC 2 Type II &middot; Dedicated support</span>
        <div className="flex-1" />
        <span className="opacity-70">Renews Sep 12, 2026</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-7 py-2 bg-[var(--surface-2)] border-b border-[var(--hairline)] text-xs">
      <span className="font-mono text-[11px] px-1.5 py-px border border-[var(--hairline-strong)] rounded-[3px]">
        OSS &middot; v4.12.0
      </span>
      <span className="text-[var(--muted)]">
        Self-hosted &middot; MIT license &middot; Community support via GitHub Discussions
      </span>
      <div className="flex-1" />
      <a href="#" className="text-[var(--ink-2)] no-underline">
        &#11088; 12.4k stars
      </a>
      <a href="#" className="text-[var(--ink-2)] no-underline">
        Upgrade to Enterprise &rarr;
      </a>
    </div>
  );
}
