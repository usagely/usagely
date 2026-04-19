import { Icon } from './icon';

export interface EnterpriseLockProps {
  feature: string;
  description: string;
}

export function EnterpriseLock({ feature, description }: EnterpriseLockProps) {
  return (
    <div
      style={{
        padding: '20px 28px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
        }}
      >
        <Icon name="lock" size={28} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
          {feature} is an Enterprise feature
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <a
          href="https://usagely.com/enterprise"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: '1px solid var(--ink)',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Upgrade to Enterprise
        </a>
        <a
          href="https://usagely.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--hairline-strong)',
            borderRadius: 6,
            textDecoration: 'none',
          }}
        >
          Talk to sales
        </a>
      </div>
    </div>
  );
}
