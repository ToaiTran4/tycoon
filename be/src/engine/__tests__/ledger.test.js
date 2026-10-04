import { describe, it, expect } from 'vitest';
import { createLedger, post, payOrArrears } from '../ledger.js';

describe('ledger', () => {
  it('bút toán lệch → ném lỗi', () => {
    const L = createLedger();
    expect(() =>
      post(L, { playerId: 'p1', memo: 'lệch', category: 'operating', lines: [
        { account: 'CASH', dr: 100 },
        { account: 'PAID_IN_CAPITAL', cr: 50 },
      ]}),
    ).toThrow(/Nợ ≠ Có/);
  });

  it('payOrArrears đúng thứ tự cash → deposit → arrears', () => {
    const L = createLedger();
    L.balances.CASH = 100;
    L.balances.DEPOSIT = 200;
    const res = payOrArrears(L, { amount: 400, debitAccount: 'WAGES', category: 'operating', memo: 'test', playerId: 'p1' });
    expect(res.fromCash).toBe(100);
    expect(res.fromDeposit).toBe(200);
    expect(res.arrears).toBe(100);
    expect(L.balances.CASH).toBe(0);
    expect(L.balances.DEPOSIT).toBe(0);
    expect(L.balances.ARREARS).toBe(-100); // ARREARS: cr (liability sign convention dr-cr => negative)
  });

  it('post cập nhật số dư và entries', () => {
    const L = createLedger();
    post(L, { playerId: 'p', memo: 'm', category: 'financing', lines: [
      { account: 'CASH', dr: 10000 }, { account: 'PAID_IN_CAPITAL', cr: 10000 },
    ]});
    expect(L.balances.CASH).toBe(10000);
    expect(L.balances.PAID_IN_CAPITAL).toBe(-10000);
    expect(L.entries).toHaveLength(1);
  });
});
