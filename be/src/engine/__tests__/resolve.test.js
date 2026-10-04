import { describe, it, expect } from 'vitest';
import { initGameState } from '../init.js';
import { resolveQuarter } from '../resolve.js';
import { validateActionsForPlayer } from '../validate.js';

function twoPlayerState() {
  return initGameState({
    seed: 'test_seed_abc',
    totalQuarters: 20,
    players: [
      { id: 'p1', name: 'An', seat: 0 },
      { id: 'p2', name: 'Bình', seat: 1 },
    ],
  });
}

describe('resolve determinism', () => {
  it('cùng input → cùng output JSON', () => {
    const s1 = twoPlayerState();
    const s2 = twoPlayerState();
    const actions = {
      p1: [
        { type: 'deposit', amount: 5000 },
        { type: 'bid', plotId: 0, amount: 800 },
      ],
      p2: [
        { type: 'bid', plotId: 0, amount: 900 },
        { type: 'bid', plotId: 1, amount: 700 },
      ],
    };
    // validate cho cả 2
    validateActionsForPlayer(s1, 'p1', actions.p1);
    validateActionsForPlayer(s1, 'p2', actions.p2);
    const r1 = resolveQuarter(JSON.parse(JSON.stringify(s1)), JSON.parse(JSON.stringify(actions)));
    const r2 = resolveQuarter(JSON.parse(JSON.stringify(s2)), JSON.parse(JSON.stringify(actions)));
    expect(JSON.stringify(r1.state)).toBe(JSON.stringify(r2.state));
  });
});

describe('auction', () => {
  it('đấu giá: người giá cao thắng (p2 900 thắng p1 800 trên ô 0)', () => {
    const s = twoPlayerState();
    s.listings.push({ plotId: 0, reserve: 500, source: 'market' });
    const actions = {
      p1: [{ type: 'bid', plotId: 0, amount: 800 }],
      p2: [{ type: 'bid', plotId: 0, amount: 900 }],
    };
    const r = resolveQuarter(s, actions);
    const plot0 = r.state.plots[0];
    expect(plot0.ownerId).toBe('p2');
    const p2_cash = r.state.players.p2.balances.CASH || 0;
    expect(p2_cash).toBe(10000 - 900);
  });
});
