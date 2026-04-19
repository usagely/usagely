export const FX = {
  USD: { sym: '$', rate: 1, code: 'USD' },
  BRL: { sym: 'R$', rate: 5.05, code: 'BRL' },
  EUR: { sym: '€', rate: 0.93, code: 'EUR' },
} as const;

export type Currency = keyof typeof FX;

export function fmtMoney(n: number, cur: Currency = 'USD'): string {
  const f = FX[cur] || FX.USD;
  const val = (n || 0) * f.rate;
  const abs = Math.abs(val);
  let str: string;
  if (abs >= 1_000_000) str = (val / 1_000_000).toFixed(2) + 'M';
  else if (abs >= 10_000) str = (val / 1_000).toFixed(1) + 'k';
  else if (abs >= 1_000)
    str = val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  else str = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return f.sym + str;
}

export function fmtMoneyFull(n: number, cur: Currency = 'USD'): string {
  const f = FX[cur] || FX.USD;
  const val = (n || 0) * f.rate;
  return (
    f.sym +
    val.toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    })
  );
}

export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString();
}

export function fmtPct(n: number, digits = 1): string {
  return (n * 100).toFixed(digits) + '%';
}

export function fmtDelta(n: number): string {
  const s = n >= 0 ? '+' : '';
  return s + (n * 100).toFixed(1) + '%';
}
