import { describe, it, expect } from 'vitest';
import { initGameState } from '../init.js';
import { resolveQuarter } from '../resolve.js';
import { ratePlayer } from '../market/rating.js';
import { CONFIG } from '../config.js';

function twoPlayerState() {
  return initGameState({
    seed: 'credit_test_seed',
    totalQuarters: 40,
    players: [
      { id: 'p1', name: 'An', seat: 0 },
      { id: 'p2', name: 'Bình', seat: 1 },
    ],
  });
}

function addHistory(player, { revenue = 0, ebit = 0, interest = 0, depreciation = 0, netIncome = 0 } = {}) {
  player.history.push({
    revenue, cogs: 0, grossProfit: revenue, wages: 0, materials: 0,
    depreciation, ebit, interest, ebt: ebit - interest, tax: 0, netIncome, quarter: player.history.length + 1,
  });
}

describe('ratePlayer thresholds', () => {
  it('điểm cao => hạng A', () => {
    const s = twoPlayerState();
    const p = s.players.p1;
    p.balances.CASH = 30000;
    p.balances.LAND = 20000;
    p.balances.BUILDINGS = 10000;
    p.balances.ACC_DEPR = -2000;
    for (let i = 0; i < 4; i++) addHistory(p, { revenue: 15000, ebit: 3200, depreciation: 200, netIncome: 3000 });
    expect(ratePlayer(p)).toBe('A');
  });
  it('điểm thấp, nhiều nợ => hạng D', () => {
    const s = twoPlayerState();
    const p = s.players.p1;
    p.balances.CASH = 500;
    p.balances.LAND = 0;
    p.balances.BUILDINGS = 0;
    p.balances.ACC_DEPR = 0;
    p.balances.BANK_LOAN = -10000;
    p.balances.BONDS_PAYABLE = -20000;
    p.balances.ARREARS = -5000;
    addHistory(p, { revenue: 0, ebit: -500, interest: 1000, netIncome: -2000 });
    expect(ratePlayer(p)).toBe('D');
  });
  it('có nợ quá hạn -20 điểm => hạng tệ hơn', () => {
    const s = twoPlayerState();
    const p = s.players.p1;
    p.balances.CASH = 25000;
    p.balances.LAND = 15000;
    p.balances.BUILDINGS = 5000;
    p.balances.ACC_DEPR = -500;
    for (let i = 0; i < 4; i++) addHistory(p, { revenue: 10000, ebit: 2200, depreciation: 100, netIncome: 2000 });
    const clean = ratePlayer(p);
    p.balances.ARREARS = -3000;
    const withArr = ratePlayer(p);
    expect(withArr === 'D' || withArr !== clean).toBeTruthy();
  });
});

describe('borrow cap + room', () => {
  it('borrow cut xuống khi vượt trần D/E hạng B (1.5×)', () => {
    const s = twoPlayerState();
    const p = s.players.p1;
    p.balances.CASH = 20000;
    p.balances.LAND = 5000;
    p.balances.PAID_IN_CAPITAL = -(25000);
    p.rating = 'B';
    const actions = {
      p1: [{ type: 'borrow', amount: 90000, term: 8 }],
      p2: [],
    };
    const r = resolveQuarter(JSON.parse(JSON.stringify(s)), JSON.parse(JSON.stringify(actions)));
    const borrowTotal = r.state.players.p1.loans.reduce((a, l) => a + l.initial, 0);
    const eq = 20000 + 5000;
    const capDE = Math.round(CONFIG.loan.maxDE['B'] * eq);
    expect(borrowTotal).toBeLessThanOrEqual(capDE + 200);
  });
  it('2 người vay đồng thời > room → chia tỷ lệ', () => {
    const s = twoPlayerState();
    s.macro.creditRoom = 5000;
    s.macro.creditUsed = 0;
    for (const pid of ['p1', 'p2']) {
      const p = s.players[pid];
      p.balances.CASH = 20000;
      p.balances.LAND = 15000;
      p.rating = 'B';
    }
    const actions = {
      p1: [{ type: 'borrow', amount: 3000, term: 8 }],
      p2: [{ type: 'borrow', amount: 3000, term: 8 }],
    };
    const r = resolveQuarter(JSON.parse(JSON.stringify(s)), JSON.parse(JSON.stringify(actions)));
    const p1Total = r.state.players.p1.loans.reduce((a, l) => a + l.initial, 0);
    const p2Total = r.state.players.p2.loans.reduce((a, l) => a + l.initial, 0);
    expect(p1Total + p2Total).toBeLessThanOrEqual(5400);
    expect(p1Total).toBeLessThanOrEqual(2700);
    expect(p2Total).toBeLessThanOrEqual(2700);
  });
});

describe('roleLogs populate', () => {
  it('market.roleLogs được sinh không rỗng sau resolve', () => {
    const s = twoPlayerState();
    const r = resolveQuarter(JSON.parse(JSON.stringify(s)), {});
    expect(Array.isArray(r.market.roleLogs)).toBe(true);
    expect(r.market.roleLogs.length).toBeGreaterThan(0);
  });
});
