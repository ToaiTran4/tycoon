import { CONFIG } from '../config.js';
import { rnd, clamp } from '../money.js';

export function investorCashNext(state, { couponReceived, bondPrincipalReceived, newBuys, conf }) {
  const base = CONFIG.investors.inflowPerPlayer * state.nPlayers * (0.6 + 0.8 * conf / 100);
  return Math.round(state.investors.cash + base + (couponReceived || 0) + (bondPrincipalReceived || 0) - (newBuys || 0));
}

export function rho(phase, confidence) {
  const base = clamp(0.5 + confidence / 100, 0.6, 1.4);
  const multiplier = phase === 'recession' ? 0.8 : 1;
  return base * multiplier;
}

export function bondCoupon(rating, govYield) {
  return govYield + (CONFIG.bond.spread[rating] || 0.05);
}

function totalDebtOf(balances) {
  return -((balances.BANK_LOAN || 0) + (balances.BONDS_PAYABLE || 0) + (balances.ARREARS || 0));
}

function equityOf(player) {
  const b = player.balances;
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liab = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liab;
}

export function checkBondEligibility(state, pid, requestedAmount) {
  const p = state.players[pid];
  if (!p) return { ok: false, reason: 'không tìm thấy người chơi' };
  const hasOp = state.plots.some(pl => pl.ownerId === pid && pl.business && pl.business.status === 'operating');
  if (!hasOp) return { ok: false, reason: 'chưa có hoạt động kinh doanh' };
  if (p.rating === 'D') return { ok: false, reason: 'hạng tín nhiệm D' };
  const ebitQ = p.history?.length ? p.history[p.history.length - 1].ebit : 0;
  const depQ = p.history?.length ? (p.history[p.history.length - 1].depreciation || 0) : 0;
  const interestQ = p.history?.length ? (p.history[p.history.length - 1].interest || 0) : 0;
  const coverage = interestQ > 0 ? (ebitQ + depQ) / interestQ : 99;
  if (coverage < CONFIG.bond.minCoverage) return { ok: false, reason: `hệ số thanh toán lãi ${coverage.toFixed(2)} < 1,2` };
  const eq = equityOf(p);
  const debtNow = totalDebtOf(p.balances);
  const debtAfter = debtNow + requestedAmount;
  const maxDE = CONFIG.loan.maxDE[p.rating];
  if (eq <= 0) return { ok: false, reason: 'vốn chủ âm' };
  if (debtAfter > maxDE * eq) return { ok: false, reason: `D/E sau phát hành vượt trần ${maxDE}×` };
  return { ok: true, coverage };
}

export function processBondIssuances(state, requests) {
  const conf = state.macro.confidence || 50;
  const phase = state.macro.phase || 'stable';
  const r = rho(phase, conf);
  const bondBudget = Math.round(0.5 * state.investors.cash * r);
  const budgetLeft = { value: bondBudget };
  const eligible = [];
  const results = new Map();
  for (const req of requests) {
    const pid = req.pid;
    const check = checkBondEligibility(state, pid, req.amount);
    if (!check.ok) { results.set(req, { ok: false, reason: check.reason }); continue; }
    eligible.push({ req, amount: req.amount, check });
  }
  const sumEligible = eligible.reduce((s, e) => s + e.amount, 0);
  let fillFactor = sumEligible > 0 ? Math.min(1, budgetLeft.value / sumEligible) : 0;
  for (const e of eligible) {
    const issued = rnd(e.amount * fillFactor);
    if (issued < CONFIG.bond.minAmount) { results.set(e.req, { ok: false, reason: 'số tiền cấp thấp hơn ngưỡng tối thiểu' }); continue; }
    results.set(e.req, { ok: true, issued, fillFactor, budget: bondBudget });
  }
  return { results, bondBudget, fillFactor: eligible.length > 0 ? fillFactor : 0 };
}

export function shareValuation(state, pid) {
  const p = state.players[pid];
  if (!p) return null;
  const conf = state.macro.confidence || 50;
  const pr = state.macro.policyRate || 0;
  const PE = clamp(12 * (0.6 + conf / 100) * (1 - 4 * (pr - 0.06)), 6, 24);
  const h = p.history || [];
  const last4 = h.slice(-4);
  const ttmNI = last4.reduce((s, x) => s + Math.max(0, x.netIncome || 0), 0);
  const eq = equityOf(p);
  let V;
  if (h.length >= 2) {
    const avgNI = last4.length > 0 ? ttmNI * (4 / Math.max(1, last4.length)) : 0;
    V = Math.round(0.5 * eq + 0.5 * Math.max(0, avgNI) * PE);
  } else {
    V = eq;
  }
  const sharePrice = Math.max(1, V / Math.max(1, p.shares.outstanding));
  return { PE, V, sharePrice };
}

export function checkShareEligibility(state, pid) {
  const p = state.players[pid];
  if (!p) return { ok: false, reason: 'không tìm thấy người chơi' };
  const hasOp = state.plots.some(pl => pl.ownerId === pid && pl.business && pl.business.status === 'operating');
  if (!hasOp) return { ok: false, reason: 'chưa có hoạt động kinh doanh' };
  const eq = equityOf(p);
  if (eq <= 0) return { ok: false, reason: 'vốn chủ ≤ 0' };
  return { ok: true };
}

export function processShareIssuances(state, requests) {
  const conf = state.macro.confidence || 50;
  const phase = state.macro.phase || 'stable';
  const r = rho(phase, conf);
  const equityBudget = Math.round(0.3 * state.investors.cash * r);
  const eligible = [];
  const results = new Map();
  const valuations = new Map();
  for (const req of requests) {
    const pid = req.pid;
    const check = checkShareEligibility(state, pid);
    if (!check.ok) { results.set(req, { ok: false, reason: check.reason }); continue; }
    const val = shareValuation(state, pid);
    valuations.set(pid, val);
    const p = state.players[pid];
    const newShares = rnd(p.shares.outstanding * req.fraction);
    const issuePrice = CONFIG.equity.discount * val.sharePrice;
    const gross = rnd(newShares * issuePrice);
    eligible.push({ req, grossExpected: gross, newSharesExpected: newShares, issuePrice, val, valuation: val });
  }
  const sumGross = eligible.reduce((s, e) => s + e.grossExpected, 0);
  const fillFactor = sumGross > 0 ? Math.min(1, equityBudget / sumGross) : 0;
  for (const e of eligible) {
    const sold = rnd(e.newSharesExpected * fillFactor);
    if (sold <= 0) { results.set(e.req, { ok: false, reason: 'ngân sách không đủ' }); continue; }
    const grossActual = rnd(sold * e.issuePrice);
    results.set(e.req, {
      ok: true,
      shares: sold,
      sharePrice: e.val.sharePrice,
      PE: e.val.PE,
      gross: grossActual,
      fillFactor,
      budget: equityBudget,
    });
  }
  return { results, equityBudget, fillFactor: eligible.length > 0 ? fillFactor : 0 };
}
