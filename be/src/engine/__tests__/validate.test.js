import { describe, it, expect } from 'vitest';
import { validateActionsForPlayer } from '../validate.js';
import { initGameState } from '../init.js';

describe('validate', () => {
  it('vượt điểm hành động → báo lỗi', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    // 4 hành động tốn 1 ĐHĐ (4 > 3)
    const actions = [
      { type: 'bid', plotId: 0, amount: 100 },
      { type: 'bid', plotId: 1, amount: 100 },
      { type: 'bid', plotId: 2, amount: 100 },
      { type: 'bid', plotId: 3, amount: 100 },
    ];
    const v = validateActionsForPlayer(s, 'p1', actions);
    expect(v.ok).toBe(false);
    expect(v.errors.some(e => /action_points_exceeded/.test(e))).toBe(true);
  });

  it('hành động tài chính nhanh 0 ĐHĐ → hợp lệ', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    const actions = [
      { type: 'withdraw', amount: 10 },
      { type: 'deposit', amount: 10 },
      { type: 'borrow', amount: 500 },
      { type: 'setWorkers', plotId: 0, workers: 0 },
      { type: 'setReinvest', plotId: 0, rate: 0 },
    ];
    const v = validateActionsForPlayer(s, 'p1', actions);
    expect(v.apLeft).toBe(3);
  });
});
