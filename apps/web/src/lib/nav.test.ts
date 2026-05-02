import { describe, it, expect } from 'vitest';
import { NAV, ENTERPRISE_ONLY, PAGE_META } from './nav';

describe('nav', () => {
  describe('NAV', () => {
    it('has four groups', () => {
      expect(NAV).toHaveLength(4);
    });

    it.each([
      [0, 'OVERVIEW', 2],
      [1, 'ALLOCATION', 4],
      [2, 'CONTROL', 5],
      [3, 'SYSTEM', 1],
    ] as const)('group[%i] is %s with %i items', (index, group, count) => {
      expect(NAV[index].group).toBe(group);
      expect(NAV[index].items).toHaveLength(count);
    });

    it('every item has id, label, and icon', () => {
      for (const group of NAV) {
        for (const item of group.items) {
          expect(item.id).toEqual(expect.any(String));
          expect(item.label).toEqual(expect.any(String));
          expect(item.icon).toEqual(expect.any(String));
        }
      }
    });

    it('collects 12 unique page ids', () => {
      const ids = NAV.flatMap((g) => g.items.map((i) => i.id));
      expect(ids).toHaveLength(12);
      expect(new Set(ids).size).toBe(12);
    });

    it('includes badged items for anomalies, recommendations, shadow, approvals', () => {
      const badged = NAV.flatMap((g) => g.items).filter((i) => i.badge);
      expect(badged.map((i) => i.id)).toEqual(
        expect.arrayContaining(['anomalies', 'recommendations', 'shadow', 'approvals']),
      );
      expect(badged).toHaveLength(4);
    });
  });

  describe('ENTERPRISE_ONLY', () => {
    it('is a Set with exactly 4 members', () => {
      expect(ENTERPRISE_ONLY).toBeInstanceOf(Set);
      expect(ENTERPRISE_ONLY.size).toBe(4);
    });

    it.each(['shadow', 'forecast', 'approvals', 'recommendations'])(
      'contains %s',
      (id) => {
        expect(ENTERPRISE_ONLY.has(id)).toBe(true);
      },
    );

    it.each(['dashboard', 'teams', 'settings', 'people', 'tools'])(
      'does not contain %s',
      (id) => {
        expect(ENTERPRISE_ONLY.has(id)).toBe(false);
      },
    );
  });

  describe('PAGE_META', () => {
    it('has an entry for every nav item id plus profile', () => {
      const navIds = NAV.flatMap((g) => g.items.map((i) => i.id));
      const metaKeys = Object.keys(PAGE_META);
      for (const id of navIds) {
        expect(metaKeys).toContain(id);
      }
      expect(metaKeys).toContain('profile');
    });

    it('every entry has non-empty title and sub', () => {
      for (const meta of Object.values(PAGE_META)) {
        expect(meta.title).toEqual(expect.any(String));
        expect(meta.sub).toEqual(expect.any(String));
        expect(meta.title.length).toBeGreaterThan(0);
        expect(meta.sub.length).toBeGreaterThan(0);
      }
    });

    it.each([
      ['dashboard', 'Dashboard'],
      ['settings', 'Settings'],
      ['shadow', 'Shadow AI'],
      ['forecast', 'Forecast'],
      ['approvals', 'Approvals'],
    ])('PAGE_META[%s].title is %s', (key, title) => {
      expect(PAGE_META[key].title).toBe(title);
    });

    it('has 13 entries total', () => {
      expect(Object.keys(PAGE_META)).toHaveLength(13);
    });
  });
});
