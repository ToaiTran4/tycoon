import { describe, it, expect } from 'vitest';
import { initGameState } from '../init.js';
import { resolveQuarter } from '../resolve.js';
import {
  checkBondEligibility,
  checkShareEligibility,
  shareValuation,
  processBondIssuances,
  rho,
  bondCoupon,
} from '../market/investors.js';

function threePlayerState() {
  return initGameState({
    seed: 'investors_test_seed',
    totalQuarters: 40,
    players: [
      { id: 'p1', name: 'An', seat: 0 },
      { id: 'p2', name: 'Bình', seat: 1 },
      { id: 'p3', name: 'Cường', seat: 2 },
    ],
  });
}

function addHistory(player, { revenue = 0, ebit = 0, interest = 0, depreciation = 0, netIncome = 0 }) {
  player.history.push({
    revenue, cogs: 0, grossProfit: revenue, wages: 0, materials: 0,
    depreciation, ebit, interest, ebt: ebit - interest, tax: 0, netIncome, quarter: player.history.length + 1,
  });
}

function grantOperating(state, pid, plotId, sector = 'tech') {
  const plot = state.plots.find(p => p.id === plotId);
  plot.ownerId = pid;
  plot.business = {
    id: `b_${plotId}`,
    sector,
    status: 'operating',
    workers: 4,
    reinvest: false,
    level: 1,
    efficiency: 1,
    nbv: 5000,
    age: 2,
  };
  plot.idleQuarters = 0;
  const p = state.players[pid];
  p.balances.BUILDINGS = (p.balances.BUILDINGS || 0) + 5500;
  p.balances.ACC_DEPR = (p.balances.ACC_DEPR || 0) - 500;
  return p;
}

describe('checkBondEligibility 4 điều kiện', () => {
  it('không có OP → từ chối', () => {
    const s = threePlayerState();
    grantOperating(s, 'p2', 10);
    const p1 = s.players.p1;
    p1.balances.CASH = 20000;
    p1.balances.LAND = 10000;
    p1.balances.BUILDINGS = 0;
    const res = checkBondEligibility(s, 'p1', 5000);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/kinh doanh/);
  });
  it('hạng D → từ chối', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const p1 = s.players.p1;
    p1.rating = 'D';
    const res = checkBondEligibility(s, 'p1', 5000);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/hạng tín nhiệm D/);
  });
  it('coverage < 1.2 → từ chối', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const p1 = s.players.p1;
    for (let i = 0; i < 4; i++) addHistory(p1, { revenue: 10000, ebit: 100, interest: 500, depreciation: 0, netIncome: -500 });
    p1.rating = 'B';
    const res = checkBondEligibility(s, 'p1', 5000);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/hệ số thanh toán lãi/);
  });
  it('D/E after vượt trần C 1.0× → từ chối', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const p1 = s.players.p1;
    p1.rating = 'C';
    p1.balances.CASH = 10000;
    p1.balances.LAND = 0;
    p1.balances.PAID_IN_CAPITAL = -10000;
    p1.balances.BANK_LOAN = -5000;
    for (let i = 0; i < 4; i++) addHistory(p1, { revenue: 10000, ebit: 3000, interest: 100, depreciation: 200, netIncome: 2500 });
    const res = checkBondEligibility(s, 'p1', 10000);
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/vượt trần/);
  });
});

describe('shareValuation PE clamp 6-24', () => {
  it('PE nằm trong [6,24] với các giá trị input', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const p1 = s.players.p1;
    for (let i = 0; i < 5; i++) addHistory(p1, { revenue: 15000, ebit: 3000, interest: 100, depreciation: 200, netIncome: 2500 });
    const vals = shareValuation(s, 'p1');
    expect(vals.PE).toBeGreaterThanOrEqual(6);
    expect(vals.PE).toBeLessThanOrEqual(24);
  });
  it('history < 2 → V = equity (không dùng PE)', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const vals = shareValuation(s, 'p1');
    expect(vals).toBeTruthy();
    expect(vals.sharePrice).toBeGreaterThanOrEqual(1);
  });
});

describe('processBondIssuances fillFactor', () => {
  it('tổng yêu cầu > bondBudget → fillFactor < 1', () => {
    const s = threePlayerState();
    for (const pid of ['p1', 'p2', 'p3']) {
      const idx = pid === 'p1' ? 0 : pid === 'p2' ? 5 : 10;
      grantOperating(s, pid, idx);
      const p = s.players[pid];
      p.rating = 'A';
      for (let i = 0; i < 4; i++) addHistory(p, { revenue: 20000, ebit: 4000, interest: 0, depreciation: 300, netIncome: 3500 });
    }
    const requests = [
      { pid: 'p1', amount: 20000, term: 8 },
      { pid: 'p2', amount: 20000, term: 8 },
      { pid: 'p3', amount: 20000, term: 8 },
    ];
    // giảm investor cash để fillFactor bị cắt
    s.investors.cash = 10000;
    const { results, fillFactor } = processBondIssuances(s, requests);
    expect(fillFactor).toBeLessThan(1);
    for (const req of requests) {
      const r = results.get(req);
      expect(r).toBeTruthy();
      expect(r.issued).toBeLessThanOrEqual(req.amount);
    }
  });
});

describe('bondCoupon theo hạng', () => {
  it('coupon A thấp hơn coupon D (gov 1%)', () => {
    expect(bondCoupon('A', 0.01)).toBeLessThan(bondCoupon('D', 0.01));
  });
});

describe('rho risk appetite recession giảm 0.8', () => {
  it('rho(recession, 50) = 0.8 × rho(stable, 50)', () => {
    const stable = rho('stable', 50);
    const rec = rho('recession', 50);
    expect(Math.round(100 * rec)).toBe(Math.round(100 * stable * 0.8));
  });
});

describe('checkShareEligibility', () => {
  it('equity <= 0 + không OP → fail cả 2', () => {
    const s = threePlayerState();
    const p1 = s.players.p1;
    p1.balances.CASH = 0;
    p1.balances.BANK_LOAN = -10000;
    p1.balances.PAID_IN_CAPITAL = 0;
    const res = checkShareEligibility(s, 'p1');
    expect(res.ok).toBe(false);
  });
});

describe('roleLogs có bond/share', () => {
  it('issueBond + issueShares → roleLogs chứa entry Nhà đầu tư / Cổ phiếu / Trái phiếu', () => {
    const s = threePlayerState();
    grantOperating(s, 'p1', 0);
    const p1 = s.players.p1;
    p1.rating = 'A';
    for (let i = 0; i < 4; i++) addHistory(p1, { revenue: 15000, ebit: 3000, interest: 0, depreciation: 200, netIncome: 2500 });
    const actions = {
      p1: [
        { type: 'issueBond', amount: 10000, term: 12 },
        { type: 'issueShares', fraction: 0.1 },
      ],
      p2: [],
      p3: [],
    };
    const r = resolveQuarter(JSON.parse(JSON.stringify(s)), JSON.parse(JSON.stringify(actions)));
    const logs = r.market.roleLogs;
    expect(logs.length).toBeGreaterThan(0);
    const joined = logs.map(l => `${l.role}|${l.text}`).join('\n');
    expect(joined.length).toBeGreaterThan(10);
  });
});
