export interface AvatarProps {
  name: string;
  lg?: boolean;
}

export function Avatar({ name, lg }: AvatarProps) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className={`inline-grid place-items-center rounded-full bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--hairline)] font-semibold tracking-tight ${
        lg
          ? 'w-10 h-10 text-[14px]'
          : 'w-6 h-6 text-[10.5px]'
      }`}
    >
      {initials}
    </span>
  );
}
