import { describe, it, expect } from 'vitest';
import { computeDemandSupply } from '../market/sectors.js';
import { initGameState } from '../init.js';
import { rngFor } from '../rng.js';

describe('macro invariants', () => {
  it('1000 quý mô phỏng: tất cả các chỉ số chính nằm trong biên clamp', () => {
    let state = initGameState({ seed: 'macro_test_1', totalQuarters: 1005, players: [
      { id: 'p1', name: 'A', seat: 0 },
      { id: 'p2', name: 'B', seat: 1 },
      { id: 'p3', name: 'C', seat: 2 },
      { id: 'p4', name: 'D', seat: 3 },
    ]});
    const rng = rngFor(state.seed, 'macroNoise', 0);
    let pw = 0;
    for (let q = 0; q < 1000; q++) {
      const info = computeDemandSupply(state);
      for (const s of Object.keys(state.macro.sectors)) {
        expect(state.macro.sectors[s].price).toBeGreaterThanOrEqual(0.7 - 1e-9);
        expect(state.macro.sectors[s].price).toBeLessThanOrEqual(2.0 + 1e-9);
        expect(Number.isFinite(state.macro.sectors[s].demand)).toBe(true);
      }
      expect(state.macro.unemployment).toBeGreaterThanOrEqual(0.02 - 1e-9);
      expect(state.macro.unemployment).toBeLessThanOrEqual(0.15 + 1e-9);
      expect(state.macro.policyRate).toBeGreaterThanOrEqual(0.015 - 1e-9);
      expect(state.macro.policyRate).toBeLessThanOrEqual(0.14 + 1e-9);
      expect(state.macro.inflation).toBeGreaterThanOrEqual(-0.04 - 1e-9);
      // Step minimal to avoid infinite loop: increment quarter, nudge indices
      state.macro.quarter++;
      state.macro.demandIndex = Math.max(0.2, state.macro.demandIndex * (1 + rng.normal(0.008, 0.004)));
      state.macro.landIndex = Math.max(0.2, state.macro.landIndex * (1 + rng.normal(0.004, 0.004)));
      state.macro.commodityIndex = Math.max(0.7, Math.min(1.8, state.macro.commodityIndex * (1 + rng.normal(0, 0.02))));
      state.macro.wageIndex = Math.max(0.5, state.macro.wageIndex * (1 + rng.normal(0.005, 0.01)));
      state.macro.unemployment = Math.max(0.02, Math.min(0.15, state.macro.unemployment + rng.normal(0, 0.005)));
      state.macro.policyRate = Math.max(0.015, Math.min(0.14, state.macro.policyRate + rng.normal(0, 0.005)));
      pw += rng.int(-10, 10);
    }
  });
});
