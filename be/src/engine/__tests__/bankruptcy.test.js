import { describe, it, expect } from 'vitest';
import { initGameState } from '../init.js';
import { resolveQuarter } from '../resolve.js';
import { landValue } from '../map.js';
import { CONFIG } from '../config.js';

describe('bankruptcy', () => {
  it('phá sản: status bankrupt, đất về foreclosure ngân hàng chịu lỗ', () => {
    const s = initGameState({
      seed: 'bk_test',
      totalQuarters: 4,
      players: [{ id: 'p1', name: 'X', seat: 0 }, { id: 'p2', name: 'Y', seat: 1 }],
    });
    // ép p1 phá sản: vay lớn rồi cho mất tiền, giữ vốn chủ âm
    const p = s.players.p1;
    // mua đất (đấu giá thủ công bằng cách set owner)
    s.plots[0].ownerId = 'p1';
    // ghi thủ công LAND và CASH: mua giá 500 → Nợ LAND, Có CASH
    p.balances.LAND = (p.balances.LAND || 0) + 500;
    p.balances.CASH = (p.balances.CASH || 0) - 500;
    // Cho vay quá nhiều, rồi tạo ARREARS
    p.loans.push({ id: 'x1', principal: 50000, spread: CONFIG.loan.spread.D, originQuarter: 0, maturityQuarter: 99 });
    p.balances.BANK_LOAN = -50000; // nợ (cr side -> dr-cr negative)
    p.balances.ARREARS = -500; // có nợ quá hạn
    s.bank.loans += 50000;
    // confirm equity < 0
    const assets = (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0) + (p.balances.LAND || 0) + (p.balances.BUILDINGS || 0) + (p.balances.ACC_DEPR || 0);
    const liab = -((p.balances.BANK_LOAN || 0) + (p.balances.BONDS_PAYABLE || 0) + (p.balances.TAX_PAYABLE || 0) + (p.balances.ARREARS || 0));
    const eq = assets - liab;
    expect(eq).toBeLessThan(0);
    const r = resolveQuarter(s, {});
    expect(r.state.players.p1.status).toBe('bankrupt');
    expect(r.state.plots[0].ownerId).toBeNull();
    const l = r.state.listings.find(l => l.plotId === 0);
    expect(l).toBeTruthy();
    expect(l.source).toBe('foreclosure');
  });
});
