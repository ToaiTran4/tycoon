import { rnd } from './money.js';

/**
 * Ledger (double-entry). `balances` là object mã tài khoản -> số dư (Nợ − Có).
 * `post(entry)` ném lỗi nếu Σ Nợ ≠ Σ Có.
 *
 * @param {{ balances: Record<string, number>, entries: any[] }} ledgerState
 * @param {{ playerId: string, memo: string, category: string, lines: Array<{account: string, dr?: number, cr?: number}> }} entry
 */
export function post(ledgerState, entry) {
  const lines = (entry.lines || []).map((l) => ({
    account: l.account,
    dr: rnd(l.dr ?? 0),
    cr: rnd(l.cr ?? 0),
  }));
  const sumDr = lines.reduce((s, l) => s + l.dr, 0);
  const sumCr = lines.reduce((s, l) => s + l.cr, 0);
  if (sumDr !== sumCr) {
    throw new Error(
      `[ledger] Nợ ≠ Có trong bút toán "${entry.memo || entry.category}": dr=${sumDr} cr=${sumCr}` +
      ` | player=${entry.playerId} lines=${JSON.stringify(lines)}`,
    );
  }
  const bal = ledgerState.balances;
  for (const l of lines) {
    bal[l.account] = rnd((bal[l.account] || 0) + l.dr - l.cr);
  }
  ledgerState.entries.push({
    playerId: entry.playerId,
    memo: entry.memo,
    category: entry.category,
    lines,
    seq: ledgerState.entries.length,
  });
}

export function createLedger() {
  return { balances: Object.create(null), entries: [] };
}

/**
 * Thanh toán tiền mặt / tiền gửi / nợ quá hạn.
 * Ưu tiên: CASH → DEPOSIT (rút) → ARREARS (thiếu).
 * Ghi bút toán (debitAccount / credit tài khoản nguồn).
 */
export function payOrArrears(ledgerState, { amount, debitAccount, category, memo, playerId }) {
  const bal = ledgerState.balances;
  let remain = rnd(amount);
  if (remain <= 0) return { paid: 0, arrears: 0, fromCash: 0, fromDeposit: 0 };
  const fromCash = Math.min(remain, Math.max(0, bal.CASH || 0));
  remain -= fromCash;

  let fromDeposit = 0;
  if (remain > 0) {
    fromDeposit = Math.min(remain, Math.max(0, bal.DEPOSIT || 0));
    if (fromDeposit > 0) remain -= fromDeposit;
  }

  const arrears = remain;
  const total = fromCash + fromDeposit + arrears;
  const lines = [];
  if (debitAccount) lines.push({ account: debitAccount, dr: total });
  if (fromCash > 0) lines.push({ account: 'CASH', cr: fromCash });
  if (fromDeposit > 0) lines.push({ account: 'DEPOSIT', cr: fromDeposit });
  if (arrears > 0) lines.push({ account: 'ARREARS', cr: arrears });
  post(ledgerState, { playerId, memo: memo || 'payOrArrears', category, lines });
  return { paid: fromCash + fromDeposit, arrears, fromCash, fromDeposit };
}
