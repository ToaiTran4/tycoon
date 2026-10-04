import { describe, it, expect } from 'vitest';
import { createLedger, post } from '../ledger.js';
import { balancesReport, closeTemporaryAccounts } from '../statements.js';
import { initGameState, makeInitialPlayer } from '../init.js';

describe('statements', () => {
  it('Bằng: Tài sản = Nợ + Vốn chủ (vốn góp ban đầu)', () => {
    const L = createLedger();
    post(L, { playerId: 'p1', memo: 'start', category: 'financing', lines: [
      { account: 'CASH', dr: 10000 }, { account: 'PAID_IN_CAPITAL', cr: 10000 },
    ]});
    closeTemporaryAccounts(L, 'p1');
    const b = balancesReport(L.balances);
    expect(Math.round(b.check)).toBe(0);
  });

  it('Sau đóng sổ: TK tạm thời về 0', () => {
    const L = createLedger();
    post(L, { playerId: 'p', memo: '1', category: 'financing', lines: [{ account: 'CASH', dr: 100 }, { account: 'REVENUE', cr: 100 }] });
    post(L, { playerId: 'p', memo: '2', category: 'operating', lines: [{ account: 'WAGES', dr: 40 }, { account: 'CASH', cr: 40 }] });
    closeTemporaryAccounts(L, 'p');
    expect(L.balances.REVENUE || 0).toBe(0);
    expect(L.balances.WAGES || 0).toBe(0);
  });

  it('makeInitialPlayer -> CASH=10000, PAID_IN_CAPITAL=-10000, check=0', () => {
    const p = makeInitialPlayer({ id: 'p1', name: 'A', seat: 0 });
    const b = balancesReport(p.balances);
    expect(b.assets.CASH).toBe(10000);
    expect(b.equity.PAID_IN_CAPITAL).toBe(10000);
    expect(Math.round(b.check)).toBe(0);
  });

  it('initGameState có số lượng players/plots', () => {
    const s = initGameState({
      seed: 'x',
      totalQuarters: 20,
      players: [
        { id: 'p1', name: 'A', seat: 0 },
        { id: 'p2', name: 'B', seat: 1 },
      ],
    });
    expect(s.plots).toHaveLength(36);
    expect(Object.keys(s.players)).toHaveLength(2);
    expect(s.macro.laborForce).toBe(3000);
  });
});
