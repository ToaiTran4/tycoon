import { describe, it, expect } from 'vitest';
import { fmtMoney, fmtPct } from '../lib/format.js';

describe('format', () => {
  it('fmtMoney: < 1000 -> triệu', () => {
    expect(fmtMoney(850)).toBe('850 triệu');
  });
  it('fmtMoney: >= 1000 -> tỷ', () => {
    expect(fmtMoney(10000)).toBe('10 tỷ');
    expect(fmtMoney(1500)).toBe('1,5 tỷ');
  });
  it('fmtPct quy đổi quý -> năm mặc định', () => {
    expect(fmtPct(0.01)).toBe('4,0%/năm');
  });
});
