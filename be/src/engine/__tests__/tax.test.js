import { describe, it, expect } from 'vitest';
import { computeCorporateTax, governmentSpend } from '../market/government.js';

describe('tax', () => {
  it('tính thuế đúng từng bậc', () => {
    // 0-500: 15%, 500-1500: 22%, >1500: 30%
    expect(computeCorporateTax(0)).toBe(0);
    expect(computeCorporateTax(500)).toBe(Math.round(500 * 0.15)); // 75
    const t1500 = 500 * 0.15 + 1000 * 0.22;
    expect(computeCorporateTax(1500)).toBe(Math.round(t1500));
    const t2500 = 500 * 0.15 + 1000 * 0.22 + 1000 * 0.30;
    expect(computeCorporateTax(2500)).toBe(Math.round(t2500));
  });

  it('governmentSpend = 50% gov cash', () => {
    expect(governmentSpend(1000)).toBe(500);
  });
});
