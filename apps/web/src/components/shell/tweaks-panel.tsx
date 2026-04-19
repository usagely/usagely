'use client';

import { Icon } from '@/src/components/ui/icon';
import { useTweaks, type Tweaks } from '@/src/lib/tweaks-context';

interface SegmentOption<V extends string> {
  value: V;
  label: string;
}

function Segment<V extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<V>[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-[var(--hairline)] overflow-hidden">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
            value === o.value
              ? 'bg-[var(--ink)] text-[var(--bg)]'
              : 'bg-transparent text-[var(--ink-2)] hover:bg-[var(--surface-2)]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface TweaksPanelProps {
  onClose: () => void;
}

export function TweaksPanel({ onClose }: TweaksPanelProps) {
  const { tweaks, setTweak } = useTweaks();

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[280px] rounded-xl border border-[var(--hairline)] bg-[var(--surface)] shadow-lg">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--hairline)]">
        <Icon name="settings" size={14} />
        <span className="text-sm font-medium">Tweaks</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onClose}
          className="grid h-6 w-6 place-items-center rounded-md hover:bg-[var(--surface-2)] text-[var(--muted)]"
        >
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <TweakRow label="Edition">
          <Segment<Tweaks['edition']>
            options={[
              { value: 'enterprise', label: 'Enterprise' },
              { value: 'oss', label: 'Open-source' },
            ]}
            value={tweaks.edition}
            onChange={(v) => setTweak('edition', v)}
          />
        </TweakRow>

        <TweakRow label="Theme">
          <Segment<Tweaks['theme']>
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={tweaks.theme}
            onChange={(v) => setTweak('theme', v)}
          />
        </TweakRow>

        <TweakRow label="Density">
          <Segment<Tweaks['density']>
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'default', label: 'Default' },
              { value: 'comfortable', label: 'Comfy' },
            ]}
            value={tweaks.density}
            onChange={(v) => setTweak('density', v)}
          />
        </TweakRow>

        <TweakRow label="Chart style">
          <Segment<Tweaks['chart']>
            options={[
              { value: 'line', label: 'Line' },
              { value: 'area', label: 'Area' },
              { value: 'bars', label: 'Bars' },
            ]}
            value={tweaks.chart}
            onChange={(v) => setTweak('chart', v)}
          />
        </TweakRow>

        <TweakRow label="Currency">
          <Segment<Tweaks['currency']>
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'BRL', label: 'BRL' },
              { value: 'EUR', label: 'EUR' },
            ]}
            value={tweaks.currency}
            onChange={(v) => setTweak('currency', v)}
          />
        </TweakRow>

        <TweakRow label="Layout">
          <Segment<Tweaks['layout']>
            options={[
              { value: 'sidebar', label: 'Sidebar' },
              { value: 'topbar', label: 'Topbar' },
            ]}
            value={tweaks.layout}
            onChange={(v) => setTweak('layout', v)}
          />
        </TweakRow>
      </div>
    </div>
  );
}

function TweakRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      {children}
    </div>
  );
}
