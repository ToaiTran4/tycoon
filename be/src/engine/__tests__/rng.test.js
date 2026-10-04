import { describe, it, expect } from 'vitest';
import { rngFor } from '../rng.js';

describe('rng', () => {
  it('cùng seed + purpose + quarter → cùng dãy', () => {
    const a = rngFor('abc', 'dice', 1);
    const b = rngFor('abc', 'dice', 1);
    const n = 20;
    for (let i = 0; i < n; i++) expect(a.next()).toBe(b.next());
  });

  it('khác purpose → khác dãy', () => {
    const a = rngFor('abc', 'dice', 1);
    const b = rngFor('abc', 'event', 1);
    const aN = Array.from({ length: 10 }, () => a.next());
    const bN = Array.from({ length: 10 }, () => b.next());
    expect(aN).not.toEqual(bN);
  });

  it('int trả trong khoảng [min,max] bao gồm cả 2 đầu', () => {
    const r = rngFor('xyz', 'ties', 2);
    for (let i = 0; i < 500; i++) {
      const v = r.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});
