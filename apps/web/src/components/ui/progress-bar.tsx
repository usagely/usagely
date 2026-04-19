export interface ProgressBarProps {
  pct: number;
  tone?: 'accent' | 'danger' | 'warn';
  h?: number;
}

const toneBg: Record<string, string> = {
  accent: 'bg-[var(--accent)]',
  danger: 'bg-[var(--danger)]',
  warn: 'bg-[var(--warn)]',
};

export function ProgressBar({ pct, tone, h }: ProgressBarProps) {
  const height = h ? `${h}px` : undefined;

  return (
    <div
      className="h-1.5 bg-[var(--surface-3)] rounded overflow-hidden"
      style={height ? { height } : undefined}
    >
      <span
        className={`block h-full ${tone ? toneBg[tone] ?? 'bg-[var(--ink)]' : 'bg-[var(--ink)]'}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
