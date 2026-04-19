import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        hairline: 'var(--hairline)',
        'hairline-strong': 'var(--hairline-strong)',
        accent: 'var(--accent)',
        'accent-ink': 'var(--accent-ink)',
        'accent-bg': 'var(--accent-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        warn: 'var(--warn)',
        'warn-bg': 'var(--warn-bg)',
        info: 'var(--info)',
        'info-bg': 'var(--info-bg)',
        'chart-1': 'var(--chart-1)',
        'chart-2': 'var(--chart-2)',
        'chart-3': 'var(--chart-3)',
        'chart-4': 'var(--chart-4)',
        'chart-5': 'var(--chart-5)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      spacing: {
        row: 'var(--row)',
      },
    },
  },
  plugins: [],
};

export default config;
