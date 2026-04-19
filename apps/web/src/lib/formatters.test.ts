import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtMoneyFull, fmtNum, fmtPct, fmtDelta } from './formatters';

describe('formatters', () => {
  describe('fmtMoney', () => {
    it('formats 12420 USD as $12.4k', () => {
      expect(fmtMoney(12420, 'USD')).toBe('$12.4k');
    });

    it('formats 12420 BRL as R$62.7k', () => {
      expect(fmtMoney(12420, 'BRL')).toBe('R$62.7k');
    });

    it('formats 1500000 USD as $1.50M', () => {
      expect(fmtMoney(1500000, 'USD')).toBe('$1.50M');
    });

    it('formats 500 USD as $500', () => {
      expect(fmtMoney(500, 'USD')).toBe('$500');
    });
  });

  describe('fmtDelta', () => {
    it('formats 0.18 as +18.0%', () => {
      expect(fmtDelta(0.18)).toBe('+18.0%');
    });

    it('formats -0.08 as -8.0%', () => {
      expect(fmtDelta(-0.08)).toBe('-8.0%');
    });
  });

  describe('fmtNum', () => {
    it('formats 18420000 as 18.42M', () => {
      expect(fmtNum(18_420_000)).toBe('18.42M');
    });

    it('formats 1500 as 1.5k', () => {
      expect(fmtNum(1500)).toBe('1.5k');
    });
  });

  describe('fmtPct', () => {
    it('formats 0.742 as 74.2%', () => {
      expect(fmtPct(0.742)).toBe('74.2%');
    });
  });
});
