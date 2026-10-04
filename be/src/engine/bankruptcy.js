import { CONFIG } from './config.js';
import { landValue } from './map.js';
import { createLedger, post } from './ledger.js';
import { rnd, clamp } from './money.js';
import { closeTemporaryAccounts } from './statements.js';
import { nbv } from './business.js';

export function processBankruptcy(state, playerId) {
  const p = state.players[playerId];
  if (!p) return { bankLoss: 0 };
  p.status = 'bankrupt';
  const L = { balances: p.balances, entries: [] };
  // 1) Tính giá trị thu hồi: tiền + tiền gửi + 80% × (land value + NBV)
  let recoverable = (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0);
  let landAndBuildings = 0;
  const plotsOwned = [];
  for (const plot of state.plots) {
    if (plot.ownerId !== playerId) continue;
    plotsOwned.push(plot);
    const lv = landValue(plot, state.macro, state.plots);
    const bv = plot.business ? nbv(plot.business) : 0;
    landAndBuildings += lv + bv;
  }
  recoverable += rnd(0.8 * landAndBuildings);
  // 2) Thứ tự trả: ARREARS → TAX_PAYABLE → vay & trái phiếu theo tỷ lệ gốc
  const arrears = Math.max(0, -(p.balances.ARREARS || 0));
  const tax = Math.max(0, -(p.balances.TAX_PAYABLE || 0));
  const bankLoan = Math.max(0, -(p.balances.BANK_LOAN || 0));
  const bonds = Math.max(0, -(p.balances.BONDS_PAYABLE || 0));
  const totalLiab = arrears + tax + bankLoan + bonds;
  let remaining = recoverable;
  // pay arrears first
  const payArrears = Math.min(arrears, remaining);
  remaining -= payArrears;
  const payTax = Math.min(tax, remaining);
  remaining -= payTax;
  const otherSum = bankLoan + bonds;
  let payBank = 0, payBonds = 0;
  if (otherSum > 0) {
    const scale = remaining / otherSum;
    payBank = Math.min(bankLoan, rnd(bankLoan * scale));
    payBonds = remaining - payBank; // lấy phần còn lại (làm tròn)
    if (payBonds < 0) payBonds = 0;
  }
  // Bút toán: giảm tài khoản CASH/DEPOSIT/LAND/BUILDINGS bằng cách thanh lý; trả nợ; phần lỗ ghi vào RETAINED_EARNINGS (thông qua P&L tạm) và tính bankLoss.
  const lines = [];
  // clear assets
  lines.push({ account: 'CASH', cr: Math.max(0, p.balances.CASH || 0) });
  lines.push({ account: 'DEPOSIT', cr: Math.max(0, p.balances.DEPOSIT || 0) });
  lines.push({ account: 'ACC_DEPR', dr: Math.abs(p.balances.ACC_DEPR || 0) });
  lines.push({ account: 'LAND', cr: Math.max(0, p.balances.LAND || 0) });
  lines.push({ account: 'BUILDINGS', cr: Math.max(0, p.balances.BUILDINGS || 0) });
  lines.push({ account: 'GOODWILL', cr: Math.max(0, p.balances.GOODWILL || 0) });
  // pay liabilities
  lines.push({ account: 'ARREARS', dr: payArrears });
  lines.push({ account: 'TAX_PAYABLE', dr: payTax });
  lines.push({ account: 'BANK_LOAN', dr: payBank });
  lines.push({ account: 'BONDS_PAYABLE', dr: payBonds });
  // Cân bằng với một "Lỗ thanh lý" qua RETAINED_EARNINGS (nợ → Goodwill? Dùng RETAINED_EARNINGS dr/cr cho cân.)
  const dr = lines.reduce((s, l) => s + (l.dr || 0), 0);
  const cr = lines.reduce((s, l) => s + (l.cr || 0), 0);
  const diff = dr - cr;
  if (diff > 0) lines.push({ account: 'RETAINED_EARNINGS', cr: diff });
  else if (diff < 0) lines.push({ account: 'RETAINED_EARNINGS', dr: -diff });
  try {
    post(L, { playerId, memo: 'Thanh lý phá sản', category: 'system', lines });
  } catch (e) {
    // nếu vẫn lệch, bỏ qua (bankruptcy step dùng làm đơn giản)
    console.warn('[bankruptcy] post không cân bằng:', e.message);
  }
  closeTemporaryAccounts(L, playerId);

  // Reset plots về chưa có chủ, đánh dấu foreclosure
  for (const plot of plotsOwned) {
    plot.ownerId = null;
    plot.business = null;
    plot.idleQuarters = 0;
    plot._foreclosure = true;
  }
  // Reset loans/bonds outstanding for aggregates
  const bankLoss = Math.max(0, bankLoan - payBank);
  state.bank.loans -= bankLoan;
  state.bank.capital = Math.max(0, state.bank.capital - bankLoss);
  const invLoss = Math.max(0, bonds - payBonds);
  state.investors.bondsHeld = Math.max(0, state.investors.bondsHeld - bonds);
  state.investors.cash += payBonds; // phần nhận được từ người phá sản
  state.gov.cash += payTax;
  return { bankLoss, invLoss };
}

// helper re-export
export { nbv as effectiveNbv };
function effectiveNbv(b) { return nbv(b); }
