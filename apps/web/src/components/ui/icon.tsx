export type IconName =
  | 'home' | 'chart' | 'users' | 'tools' | 'cpu' | 'budget'
  | 'bolt' | 'shadow' | 'approve' | 'forecast' | 'settings'
  | 'search' | 'bell' | 'plus' | 'arrow-right' | 'arrow-up'
  | 'arrow-down' | 'chevron-down' | 'chevron-right' | 'filter'
  | 'download' | 'warn' | 'spark' | 'close' | 'mail' | 'lock'
  | 'link' | 'eye' | 'logout' | 'dots' | 'circle-dot';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
    case 'chart':
      return <svg {...common}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="9" r="3.2" /><path d="M3 20c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2" /><circle cx="17" cy="8" r="2.4" /><path d="M15 13.5c3 0 6 1.6 6 5.5" /></svg>;
    case 'tools':
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></svg>;
    case 'cpu':
      return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 9h6v6H9zM2 10v4M2 7v0M22 10v4M10 2h4M10 22h4M7 2v0" /></svg>;
    case 'budget':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 9-9" /><path d="M12 3v9l6 4" /></svg>;
    case 'bolt':
      return <svg {...common}><path d="M13 3 4 14h6l-1 7 9-11h-6z" /></svg>;
    case 'shadow':
      return <svg {...common}><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 14l9 5 9-5" /></svg>;
    case 'approve':
      return <svg {...common}><path d="M4 12l5 5L20 6" /></svg>;
    case 'forecast':
      return <svg {...common}><path d="M3 18c3-4 6-4 9 0s6 2 9-4" /><path d="M3 18v2h18" /></svg>;
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3H9a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8V9a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z" />
        </svg>
      );
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></svg>;
    case 'bell':
      return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case 'arrow-right':
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'arrow-up':
      return <svg {...common}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
    case 'arrow-down':
      return <svg {...common}><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
    case 'chevron-down':
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case 'chevron-right':
      return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
    case 'filter':
      return <svg {...common}><path d="M3 5h18l-7 9v5l-4 2v-7z" /></svg>;
    case 'download':
      return <svg {...common}><path d="M12 3v13M6 11l6 6 6-6M5 21h14" /></svg>;
    case 'warn':
      return <svg {...common}><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18v.5" /></svg>;
    case 'spark':
      return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>;
    case 'close':
      return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case 'mail':
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case 'link':
      return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
    case 'eye':
      return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'logout':
      return <svg {...common}><path d="M10 17l5-5-5-5M15 12H3M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9" /></svg>;
    case 'dots':
      return <svg {...common}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>;
    case 'circle-dot':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></svg>;
    default:
      return null;
  }
}
