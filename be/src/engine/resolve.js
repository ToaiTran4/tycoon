import { CONFIG } from './config.js';
import { rnd, clamp } from './money.js';
import { createLedger, post as _post, payOrArrears } from './ledger.js';
import { closeTemporaryAccounts, balancesReport } from './statements.js';
import { landValue, clustersByOwnerSector, neighbors } from './map.js';
import { constructionIndex, buildCost, staffing as f_staffing, requiredWorkers } from './business.js';
import { AP_COST, PROCESS_ORDER, apForAction } from './actions.js';
import { validateActionsForPlayer } from './validate.js';
import { rngFor, PURPOSES } from './rng.js';
import { nextPhase } from './market/cycle.js';
import { EVENTS } from './market/events.js';
import { computeDemandSupply } from './market/sectors.js';
import { updatePrices } from './market/macro.js';
import { computeUnemployment, wageGrowth, confidenceTarget, confidenceNext, growthNext } from './market/households.js';
import { creditRoomNext } from './market/centralBank.js';
import { computeCorporateTax } from './market/government.js';
import { ratePlayer } from './market/rating.js';
import { processBankruptcy } from './bankruptcy.js';
import { buildRoleLogs } from './explain.js';
import { processBondIssuances, processShareIssuances, shareValuation, bondCoupon } from './market/investors.js';

function playerLedger(player) {
  // Wrap existing balances into a "ledger state" so post() mutates them in-place.
  const entries = [];
  return {
    balances: player.balances,
    entries,
  };
}

function wrapPost(ledger, playerId, journal, quarter) {
  return {
    post: (entry) => {
      const fullEntry = { ...entry, playerId, quarter };
      const tmp = { balances: ledger.balances, entries: [] };
      _post(tmp, { playerId, memo: entry.memo, category: entry.category, lines: entry.lines });
      for (const e of tmp.entries) journal.push({ ...e, quarter });
    },
    pay: (opts) => {
      const tmp = { balances: ledger.balances, entries: [] };
      const res = payOrArrears(tmp, { ...opts, playerId });
      for (const e of tmp.entries) journal.push({ ...e, quarter });
      return res;
    },
  };
}

function playerByIdentity(state, pid) { return state.players[pid]; }

function orderActivePlayerIds(state) {
  return Object.values(state.players)
    .filter(p => p.status === 'active')
    .sort((a, b) => a.seat - b.seat)
    .map(p => p.id);
}

function hasOperating(state, pid) {
  return state.plots.some(p => p.ownerId === pid && p.business && p.business.status === 'operating');
}

function buildEventHint(ev) {
  const parts = [];
  if (ev.demandMult) {
    for (const s of Object.keys(ev.demandMult)) {
      const m = ev.demandMult[s];
      const name = CONFIG.sectors[s]?.name || s;
      const pct = Math.round(Math.abs(m - 1) * 100);
      if (m > 1) parts.push(`cầu ${name} +${pct}%`);
      else parts.push(`cầu ${name} -${pct}%`);
    }
  }
  if (ev.supplyMult) {
    for (const s of Object.keys(ev.supplyMult)) {
      const m = ev.supplyMult[s];
      const name = CONFIG.sectors[s]?.name || s;
      const pct = Math.round(Math.abs(m - 1) * 100);
      if (m < 1) parts.push(`cung ${name} -${pct}%`);
      else parts.push(`cung ${name} +${pct}%`);
    }
  }
  if (ev.commodityShock) parts.push(`nguyên liệu ${ev.commodityShock > 0 ? '+' : ''}${Math.round(ev.commodityShock * 100)}%`);
  if (ev.wageShock) parts.push(`lương ${ev.wageShock > 0 ? '+' : ''}${Math.round(ev.wageShock * 100)}%`);
  if (ev.landShock) parts.push(`giá đất ${ev.landShock > 0 ? '+' : ''}${Math.round(ev.landShock * 100)}%`);
  if (ev.confidenceDelta) parts.push(`niềm tin ${ev.confidenceDelta > 0 ? '+' : ''}${Math.round(ev.confidenceDelta)}`);
  if (ev.demandIndexShock) parts.push(`tổng cầu ${ev.demandIndexShock > 0 ? '+' : ''}${Math.round(ev.demandIndexShock * 100)}%`);
  if (ev.bankCapitalPct) parts.push(`vốn ngân hàng ${ev.bankCapitalPct > 0 ? '+' : ''}${Math.round(ev.bankCapitalPct * 100)}%`);
  if (ev.roomMult && ev.roomMult !== 1) parts.push(`room tín dụng ${ev.roomMult < 1 ? 'thắt chặt' : 'nới lỏng'}`);
  parts.push(`kéo dài ${ev.duration} quý`);
  return parts.join('; ');
}

function effectiveNbv(business) {
  const age = Math.max(0, (business._age || 0));
  const dep = clamp(CONFIG.depreciationRate * age * business.grossCost, 0, business.grossCost);
  return Math.max(0, business.grossCost - dep);
}

function totalDebt(player) {
  const b = player.balances;
  return -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.ARREARS || 0));
}

function totalEquity(player) {
  const b = player.balances;
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liab = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liab;
}

function applyClustersExternality(state) {
  const clusterMap = new Map();
  const clusters = clustersByOwnerSector(state.plots);
  for (const c of clusters) {
    for (const id of c.ids) clusterMap.set(id, c.size);
  }
  return { clusterMap };
}

function externalityFor(state, plot) {
  let ext = 0;
  const my = plot.business;
  if (!my) return 0;
  const ex = CONFIG.externality[my.sector] || {};
  for (const n of neighbors(state.plots, plot)) {
    if (!n.business || n.business.status !== 'operating') continue;
    if (Object.prototype.hasOwnProperty.call(ex, n.business.sector)) ext += ex[n.business.sector];
  }
  return clamp(ext, -CONFIG.externalityCap, CONFIG.externalityCap);
}

export function resolveQuarter(state, pendingByPlayer) {
  // Clone state top-level for minimal mutation isolation for deterministic output.
  // (engine accepts in-place mutation with immer optional.)
  const journal = [];
  const reports = [];
  const resultsByPlayer = {};
  const t = state.quarter;
  const prevMacro = { ...state.macro };
  const borrowLogs = [];
  const rolloverLogs = [];
  const bondLogs = [];
  const shareLogs = [];
  const bankrupts = [];
  const newEvents = [];
  let govTaxCollected = 0;
  let govSpendAmount = 0;
  let idc = 0;

  // === R0: load pending actions, validate loosely ===
  const allPids = Object.keys(state.players);
  for (const pid of allPids) {
    const acts = pendingByPlayer?.[pid] || [];
    const p = state.players[pid];
    const v = validateActionsForPlayer(state, pid, acts);
    resultsByPlayer[pid] = { actionResults: [], apTotal: CONFIG.actionPoints, apUsed: 0, ok: v.ok, errors: v.errors, warnings: v.warnings };
    if (p.status === 'active') p._pendingValid = v.ok ? acts : [];
    else p._pendingValid = [];
  }

  // === A. Xử lý hành động người chơi theo thứ tự PROCESS_ORDER ===
  const activeIds = orderActivePlayerIds(state);
  const rngDice = rngFor(state.seed, PURPOSES.dice, t);
  const rngTies = rngFor(state.seed, PURPOSES.ties, t);

  // Group actions by player and type
  const grouped = {};
  for (const pid of activeIds) {
    const p = state.players[pid];
    const acts = p._pendingValid || [];
    grouped[pid] = {};
    // count action points
    let ap = CONFIG.actionPoints;
    const apValid = [];
    for (const a of acts) {
      const cost = apForAction(a.type);
      if (ap - cost < 0) continue;
      ap -= cost;
      apValid.push(a);
    }
    for (const a of apValid) {
      grouped[pid][a.type] = grouped[pid][a.type] || [];
      grouped[pid][a.type].push(a);
    }
    resultsByPlayer[pid].apUsed = CONFIG.actionPoints - ap;
    resultsByPlayer[pid].actionsFinal = apValid;
  }

  // === A1 withdraw ===
  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    for (const a of (grouped[pid].withdraw || [])) {
      const dep = Math.max(0, p.balances.DEPOSIT || 0);
      const amt = Math.min(a.amount, dep);
      if (amt <= 0) { resultsByPlayer[pid].actionResults.push({ type: 'withdraw', ok: false, reason: 'không đủ tiền gửi' }); continue; }
      wp.post({ memo: 'Rút tiền gửi', category: 'transfer', lines: [
        { account: 'CASH', dr: amt }, { account: 'DEPOSIT', cr: amt },
      ]});
      resultsByPlayer[pid].actionResults.push({ type: 'withdraw', ok: true, amount: amt });
    }
  }

  // === A2 sellPlot ===
  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    for (const a of (grouped[pid].sellPlot || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      if (!plot || plot.ownerId !== pid) { resultsByPlayer[pid].actionResults.push({ type: 'sellPlot', ok: false, reason: 'không sở hữu ô' }); continue; }
      const lv = landValue(plot, state.macro, state.plots);
      const landBook = p.balances.LAND || 0; // simplistic: we track book globally; sell with average? Use lv and land current book per plot (not tracked). Approximate: landValue for book delta? We compute fair NBV land = lv; book = proportional share.
      const nbvLand = lv; // treat book value as landValue (after revaluation each quarter)
      const nbvBld = plot.business ? effectiveNbv(plot.business) : 0;
      const grossBld = plot.business ? plot.business.grossCost : 0;
      const accDepBld = grossBld - nbvBld;
      const proceeds = rnd(CONFIG.sellPlot.landRate * lv + CONFIG.sellPlot.buildingRate * nbvBld);
      const disposalBase = nbvLand + nbvBld;
      const diff = proceeds - disposalBase;
      const lines = [
        { account: 'CASH', dr: proceeds },
        { account: 'ACC_DEPR', dr: accDepBld },
      ];
      if (plot.business) lines.push({ account: 'BUILDINGS', cr: grossBld });
      lines.push({ account: 'LAND', cr: nbvLand });
      if (diff > 0) lines.push({ account: 'DISPOSAL_GAIN', cr: diff });
      else if (diff < 0) lines.push({ account: 'DISPOSAL_LOSS', dr: -diff });
      wp.post({ memo: `Bán ô ${plot.id}`, category: 'investing', lines });
      plot.ownerId = null;
      plot.idleQuarters = 0;
      plot.business = null;
      // reduce LAND balance (approximate): subtract nbvLand
      // (LAND account holds total book of all owned plots; we need to subtract nbvLand from it, which above line already does via LAND cr nbvLand)
      resultsByPlayer[pid].actionResults.push({ type: 'sellPlot', ok: true, proceeds });
    }
  }

  // === A3 borrow, issueBond, issueShares ===
  // Borrow: maxDE, collateral, pro-rata room, ghi lý do vào borrowLogs
  const borrowRequests = [];
  for (const pid of activeIds) {
    for (const a of (grouped[pid].borrow || [])) {
      borrowRequests.push({ pid, amount: a.amount, loanId: `L${t}_${pid}_${(++idc).toString(36)}` });
      break;
    }
  }
  let roomLeft = state.macro.creditRoom - (state.macro.creditUsed || 0);
  // Sort by seat for stable pro-rata share
  borrowRequests.sort((a, b) => state.players[a.pid].seat - state.players[b.pid].seat);
  // First pass: per-player caps, ghi lý do hạn chế (lưu vào borrowReasons theo req)
  const allowed = new Map();
  const borrowReasons = new Map();
  let sumAllowed = 0;
  for (const req of borrowRequests) {
    const p = state.players[req.pid];
    let collateral = 0;
    for (const plot of state.plots) {
      if (plot.ownerId !== req.pid) continue;
      collateral += landValue(plot, state.macro, state.plots);
      if (plot.business) collateral += effectiveNbv(plot.business);
    }
    const eq = totalEquity(p);
    const de = CONFIG.loan.maxDE[p.rating];
    const curDebt = totalDebt(p);
    const capDE = Math.max(0, de * eq - curDebt);
    const capCol = Math.max(0, CONFIG.loan.collateralRate * collateral - (-p.balances.BANK_LOAN || 0));
    let amt = Math.max(0, Math.min(req.amount, capDE, capCol));
    let reason = null;
    if (amt < CONFIG.loan.minAmount) {
      if (req.amount > capDE + 50) reason = `vượt trần D/E ${de}×`;
      else if (req.amount > capCol + 50) reason = 'tài sản đảm bảo không đủ';
      else reason = 'số tiền yêu cầu thấp hơn ngưỡng';
    }
    if (amt >= CONFIG.loan.minAmount) { allowed.set(req, amt); sumAllowed += amt; borrowReasons.set(req, reason); }
    else borrowLogs.push({ pid: req.pid, requested: req.amount, allowed: 0, ok: false, reason });
  }
  // Pro-rata nếu vượt room
  const scale = sumAllowed > 0 && roomLeft >= 0 ? (sumAllowed <= roomLeft ? 1 : roomLeft / sumAllowed) : 0;
  for (const [req, amt0] of allowed.entries()) {
    const pid = req.pid;
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    const amt = rnd(amt0 * scale);
    let reason = borrowReasons.get(req) || null;
    if (scale < 0.999 && !reason) reason = 'hết room tín dụng hệ thống';
    if (amt < CONFIG.loan.minAmount) {
      borrowLogs.push({ pid, requested: req.amount, allowed: 0, ok: false, reason: reason || 'hết room tín dụng hoặc vượt trần' });
      resultsByPlayer[pid].actionResults.push({ type: 'borrow', ok: false, amount: 0, reason: reason || 'hết room tín dụng hoặc vượt trần' });
      continue;
    }
    const spread = CONFIG.loan.spread[p.rating];
    const maturity = t + CONFIG.loan.termQuarters;
    const loan = { id: req.loanId, principal: amt, spread, originQuarter: t, maturityQuarter: maturity };
    p.loans.push(loan);
    wp.post({ memo: `Vay ngân hàng ${loan.id}`, category: 'financing', lines: [
      { account: 'CASH', dr: amt }, { account: 'BANK_LOAN', cr: amt },
    ]});
    state.bank.loans += amt;
    state.macro.creditUsed += amt;
    if (amt < req.amount || reason) borrowLogs.push({ pid, requested: req.amount, allowed: amt, ok: true, reason });
    resultsByPlayer[pid].actionResults.push({ type: 'borrow', ok: true, amount: amt });
  }

  // issueBond / issueShares: dùng processBondIssuances / processShareIssuances
  const bondRequests = [];
  for (const pid of activeIds) {
    for (const a of (grouped[pid].issueBond || [])) {
      bondRequests.push({ pid, amount: a.amount, term: a.term });
      break;
    }
  }
  const shareRequests = [];
  for (const pid of activeIds) {
    for (const a of (grouped[pid].issueShares || [])) {
      shareRequests.push({ pid, fraction: a.fraction });
      break;
    }
  }
  const { results: bondResults } = processBondIssuances(state, bondRequests);
  for (const req of bondRequests) {
    const pid = req.pid;
    const res = bondResults.get(req);
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    if (!res || !res.ok) {
      const reason = res?.reason || 'điều kiện không đủ';
      bondLogs.push({ pid, ok: false, reason });
      resultsByPlayer[pid].actionResults.push({ type: 'issueBond', ok: false, reason });
      continue;
    }
    const issued = res.issued;
    const coupon = bondCoupon(p.rating, state.macro.govYield);
    const fee = rnd(CONFIG.bond.fee * issued);
    wp.post({ memo: `Phát hành ${issued} triệu trái phiếu kỳ hạn ${req.term} quý`, category: 'financing', lines: [
      { account: 'CASH', dr: Math.max(0, issued - fee) },
      { account: 'FEES', dr: fee },
      { account: 'BONDS_PAYABLE', cr: issued },
    ]});
    p.bonds.push({ id: `B${t}_${pid}_${(++idc).toString(36)}`, principal: issued, coupon, originQuarter: t, maturityQuarter: t + req.term });
    state.investors.bondsHeld += issued;
    state.investors.cash -= Math.max(0, issued - fee);
    bondLogs.push({ pid, ok: true, requested: req.amount, issued, fillFactor: res.fillFactor, budget: res.budget });
    resultsByPlayer[pid].actionResults.push({ type: 'issueBond', ok: true, principal: issued });
  }
  const { results: shareResults } = processShareIssuances(state, shareRequests);
  for (const req of shareRequests) {
    const pid = req.pid;
    const res = shareResults.get(req);
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    if (!res || !res.ok) {
      const reason = res?.reason || 'điều kiện không đủ';
      resultsByPlayer[pid].actionResults.push({ type: 'issueShares', ok: false, reason });
      continue;
    }
    const fee = rnd(CONFIG.equity.fee * res.gross);
    wp.post({ memo: `Phát hành ${res.shares} cổ phiếu mới`, category: 'financing', lines: [
      { account: 'CASH', dr: Math.max(0, res.gross - fee) },
      { account: 'FEES', dr: fee },
      { account: 'PAID_IN_CAPITAL', cr: res.gross },
    ]});
    p.shares.outstanding += res.shares;
    p.shares.float += res.shares;
    state.investors.cash -= Math.max(0, res.gross - fee);
    const founder = (p.shares.outstanding - p.shares.float) / Math.max(1, p.shares.outstanding);
    shareLogs.push({ pid, ok: true, shares: res.shares, sharePrice: res.sharePrice, PE: res.PE, founderStake: founder });
    resultsByPlayer[pid].actionResults.push({ type: 'issueShares', ok: true, shares: res.shares, gross: res.gross });
  }

  // === A4 bid (đấu giá), claimIdle ===
  // Gom tất cả giá thầu theo plotId
  const bidsByPlot = new Map();
  for (const pid of activeIds) {
    for (const a of (grouped[pid].bid || [])) {
      if (!bidsByPlot.has(a.plotId)) bidsByPlot.set(a.plotId, []);
      bidsByPlot.get(a.plotId).push({ pid, amount: a.amount });
    }
  }
  const listingsMap = new Map(state.listings.map(l => [l.plotId, l]));
  for (const [plotId, bidsArr] of bidsByPlot.entries()) {
    const listing = listingsMap.get(plotId);
    if (!listing) continue;
    // loại giá dưới sàn
    let valid = bidsArr.filter(b => b.amount >= listing.reserve);
    // sắp xếp giảm dần; nếu đồng hạng, xáo ngẫu nhiên theo rngTies
    valid.sort((a, b) => b.amount - a.amount || (rngTies.next() - 0.5));
    // duyệt
    const plot = state.plots.find(pl => pl.id === plotId);
    for (const b of valid) {
      if (plot.ownerId) break;
      const p = state.players[b.pid];
      if (p.status !== 'active') continue;
      const cashAvail = (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0);
      if (cashAvail < b.amount) continue;
      // thắng: trả tiền
      const L = playerLedger(p); const wp = wrapPost(L, b.pid, journal, t);
      // rút tiền gửi nếu cần
      let need = b.amount;
      const cash = Math.max(0, p.balances.CASH || 0);
      const useCash = Math.min(cash, need);
      need -= useCash;
      let useDeposit = 0;
      if (need > 0) {
        const dep = Math.max(0, p.balances.DEPOSIT || 0);
        useDeposit = Math.min(dep, need);
      }
      const lines = [
        { account: 'LAND', dr: b.amount },
      ];
      if (useCash > 0) lines.push({ account: 'CASH', cr: useCash });
      if (useDeposit > 0) lines.push({ account: 'DEPOSIT', cr: useDeposit });
      if (need - useDeposit > 0) { /* shouldn't */ }
      wp.post({ memo: `Mua đấu giá ô ${plotId} (giá ${b.amount})`, category: 'investing', lines });
      plot.ownerId = b.pid;
      plot.idleQuarters = 0;
      // remove plot from listings
      state.listings = state.listings.filter(l => l.plotId !== plotId);
      resultsByPlayer[b.pid].actionResults.push({ type: 'bid', ok: true, plotId, amount: b.amount, won: true });
    }
  }

  // claimIdle (placeholder)
  for (const pid of activeIds) {
    for (const a of (grouped[pid].claimIdle || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      if (!plot || !plot.ownerId || plot.ownerId === pid || plot.business || plot.idleQuarters < CONFIG.idle.claimAfter) {
        resultsByPlayer[pid].actionResults.push({ type: 'claimIdle', ok: false, reason: 'ô không đủ điều kiện' }); continue;
      }
      // yêu cầu: sở hữu ô liền kề
      const adj = neighbors(state.plots, plot).some(n => n.ownerId === pid);
      if (!adj) { resultsByPlayer[pid].actionResults.push({ type: 'claimIdle', ok: false, reason: 'không sở hữu ô liền kề' }); continue; }
      const p = state.players[pid];
      const target = state.players[plot.ownerId];
      const lv = landValue(plot, state.macro, state.plots);
      const price = rnd(CONFIG.idle.claimPremium * lv);
      const cashAvail = (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0);
      if (cashAvail < price) { resultsByPlayer[pid].actionResults.push({ type: 'claimIdle', ok: false, reason: 'không đủ tiền' }); continue; }
      const L1 = playerLedger(p); const wp1 = wrapPost(L1, pid, journal, t);
      const lines1 = [{ account: 'LAND', dr: lv }];
      let need = price; const c1 = Math.min(p.balances.CASH || 0, need); need -= c1;
      const d1 = Math.min(p.balances.DEPOSIT || 0, need);
      if (c1 > 0) lines1.push({ account: 'CASH', cr: c1 });
      if (d1 > 0) lines1.push({ account: 'DEPOSIT', cr: d1 });
      if (price > lv) lines1.push({ account: 'GOODWILL', dr: price - lv });
      wp1.post({ memo: `Mua cưỡng chế ô ${plot.id} (claimIdle)`, category: 'investing', lines: lines1 });
      // trả tiền cho chủ cũ
      const L2 = playerLedger(target); const wp2 = wrapPost(L2, plot.ownerId, journal, t);
      wp2.post({ memo: `Bán ô ${plot.id} qua claimIdle`, category: 'investing', lines: [
        { account: 'CASH', dr: price },
        { account: 'LAND', cr: lv },
        ...(price > lv ? [{ account: 'DISPOSAL_GAIN', cr: price - lv }] : price < lv ? [{ account: 'DISPOSAL_LOSS', dr: lv - price }] : []),
      ]});
      plot.ownerId = pid; plot.idleQuarters = 0;
      resultsByPlayer[pid].actionResults.push({ type: 'claimIdle', ok: true, price });
    }
  }

  // === A5 build / upgrade / convert ===
  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    for (const a of (grouped[pid].build || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      if (!plot || plot.ownerId !== pid || plot.business) { resultsByPlayer[pid].actionResults.push({ type: 'build', ok: false, reason: 'ô không hợp lệ' }); continue; }
      const cost = buildCost(a.sector, 1, state.macro);
      if ((p.balances.CASH || 0) < cost) { resultsByPlayer[pid].actionResults.push({ type: 'build', ok: false, reason: 'không đủ tiền mặt' }); continue; }
      wp.post({ memo: `Xây ${CONFIG.sectors[a.sector].name} cấp 1 ô ${plot.id}`, category: 'investing', lines: [
        { account: 'BUILDINGS', dr: cost }, { account: 'CASH', cr: cost },
      ]});
      plot.business = {
        sector: a.sector, level: 1, status: 'building', readyQuarter: t + 1,
        workers: 0, prevWorkers: 0, rndRate: 0, efficiency: 1.0, grossCost: cost, _age: 0,
      };
      resultsByPlayer[pid].actionResults.push({ type: 'build', ok: true, cost });
    }
    for (const a of (grouped[pid].upgrade || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      const b = plot?.business;
      if (!b || b.status !== 'operating' || b.level >= 3) { resultsByPlayer[pid].actionResults.push({ type: 'upgrade', ok: false, reason: 'điều kiện không đủ' }); continue; }
      const cost = buildCost(b.sector, b.level + 1, state.macro);
      if ((p.balances.CASH || 0) < cost) { resultsByPlayer[pid].actionResults.push({ type: 'upgrade', ok: false, reason: 'không đủ tiền mặt' }); continue; }
      wp.post({ memo: `Nâng cấp ô ${plot.id} lên cấp ${b.level + 1}`, category: 'investing', lines: [
        { account: 'BUILDINGS', dr: cost }, { account: 'CASH', cr: cost },
      ]});
      b.targetLevel = b.level + 1;
      b.status = 'upgrading';
      b.readyQuarter = t + 1;
      b.grossCost += cost;
      resultsByPlayer[pid].actionResults.push({ type: 'upgrade', ok: true, cost });
    }
    for (const a of (grouped[pid].convert || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      const b = plot?.business;
      if (!b || b.status !== 'operating' || b.level !== 1 || b.sector === a.sector) { resultsByPlayer[pid].actionResults.push({ type: 'convert', ok: false, reason: 'điều kiện không đủ' }); continue; }
      const cost = rnd(0.6 * buildCost(a.sector, 1, state.macro));
      if ((p.balances.CASH || 0) < cost) { resultsByPlayer[pid].actionResults.push({ type: 'convert', ok: false, reason: 'không đủ tiền mặt' }); continue; }
      wp.post({ memo: `Chuyển ngành ô ${plot.id} sang ${CONFIG.sectors[a.sector].name}`, category: 'investing', lines: [
        { account: 'BUILDINGS', dr: cost }, { account: 'CASH', cr: cost },
      ]});
      b.targetSector = a.sector; b.status = 'converting'; b.readyQuarter = t + 1; b.grossCost += cost;
      resultsByPlayer[pid].actionResults.push({ type: 'convert', ok: true, cost });
    }
  }

  // === A6 repay ===
  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    for (const a of (grouped[pid].repay || [])) {
      const loan = p.loans.find(l => l.id === a.loanId);
      if (!loan) { resultsByPlayer[pid].actionResults.push({ type: 'repay', ok: false, reason: 'không tìm thấy khoản vay' }); continue; }
      const amt = Math.min(a.amount, loan.principal, Math.max(0, p.balances.CASH || 0));
      if (amt <= 0) { resultsByPlayer[pid].actionResults.push({ type: 'repay', ok: false, reason: 'không đủ tiền' }); continue; }
      wp.post({ memo: `Trả gốc vay ${loan.id}`, category: 'financing', lines: [
        { account: 'BANK_LOAN', dr: amt }, { account: 'CASH', cr: amt },
      ]});
      loan.principal -= amt;
      state.bank.loans -= amt;
      resultsByPlayer[pid].actionResults.push({ type: 'repay', ok: true, amount: amt });
    }
  }

  // === A7 deposit ===
  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    for (const a of (grouped[pid].deposit || [])) {
      const amt = Math.min(a.amount, Math.max(0, p.balances.CASH || 0));
      if (amt <= 0) { resultsByPlayer[pid].actionResults.push({ type: 'deposit', ok: false, reason: 'không đủ tiền mặt' }); continue; }
      wp.post({ memo: 'Gửi tiết kiệm', category: 'transfer', lines: [
        { account: 'DEPOSIT', dr: amt }, { account: 'CASH', cr: amt },
      ]});
      state.bank.deposits += amt;
      resultsByPlayer[pid].actionResults.push({ type: 'deposit', ok: true, amount: amt });
    }
  }

  // === A8 setWorkers, setReinvest ===
  for (const pid of activeIds) {
    for (const a of (grouped[pid].setWorkers || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      const b = plot?.business;
      if (!b || b.status !== 'operating') { resultsByPlayer[pid].actionResults.push({ type: 'setWorkers', ok: false, reason: 'doanh nghiệp không operating' }); continue; }
      const req = requiredWorkers(b);
      if (a.workers < 0 || a.workers > req) { resultsByPlayer[pid].actionResults.push({ type: 'setWorkers', ok: false, reason: 'số nhân công ngoài khoảng [0, required]' }); continue; }
      b.workers = a.workers;
      resultsByPlayer[pid].actionResults.push({ type: 'setWorkers', ok: true });
    }
    for (const a of (grouped[pid].setReinvest || [])) {
      const plot = state.plots.find(pl => pl.id === a.plotId);
      const b = plot?.business;
      if (!b) { resultsByPlayer[pid].actionResults.push({ type: 'setReinvest', ok: false, reason: 'không có doanh nghiệp' }); continue; }
      const choices = /** @type {any} */(CONFIG.rnd.rates);
      if (!choices.includes(a.rate)) { resultsByPlayer[pid].actionResults.push({ type: 'setReinvest', ok: false, reason: 'mức không hợp lệ' }); continue; }
      b.rndRate = a.rate;
      resultsByPlayer[pid].actionResults.push({ type: 'setReinvest', ok: true });
    }
  }

  // === B. Vận hành quý t ===
  // B1 Hoàn thành công trình
  for (const plot of state.plots) {
    const b = plot.business;
    if (!b) continue;
    if (b._age == null) b._age = 0;
    if (b.readyQuarter && b.readyQuarter <= t) {
      if (b.status === 'building') { b.status = 'operating'; b.workers = requiredWorkers(b); b.prevWorkers = b.workers; }
      else if (b.status === 'upgrading' && b.targetLevel) { b.level = b.targetLevel; b.status = 'operating'; b.workers = requiredWorkers(b); b.prevWorkers = b.workers; delete b.targetLevel; }
      else if (b.status === 'converting' && b.targetSector) { b.sector = b.targetSector; b.status = 'operating'; delete b.targetSector; }
      b.readyQuarter = 0;
    }
    if (b.status !== 'building') b._age += 1;
  }

  // B2 Tính cầu-cung-giá
  const sectorInfo = computeDemandSupply(state);
  updatePrices(state, sectorInfo);

  // B3-B7: tính doanh thu, chi phí, lãi vay/coupon, đến hạn, khấu hao/thuế, revalue, risk check, close books
  // Tạo cluster & externality cache
  const { clusterMap } = applyClustersExternality(state);
  // Aggregates
  let interestIncomeTotal = 0; let interestPaidTotal = 0; let badDebt = 0; let newLoans = 0; let newDeposits = 0;
  let couponPaid = 0; let couponRcvd = 0; let bondPrincipalPaid = 0;
  const govImpulseRef = { value: 0 };

  for (const pid of activeIds) {
    const p = state.players[pid];
    const L = playerLedger(p); const wp = wrapPost(L, pid, journal, t);
    let playerRevenue = 0; let playerEBIT = 0; let playerInterestExpense = 0; let playerInterestIncome = 0;
    let playerDepreciation = 0; let playerHR = 0; let playerNetWorth = 0;

    // Doanh thu từng doanh nghiệp operating
    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      const b = plot.business;
      if (!b || b.status === 'building' || b.status === 'converting') continue;
      const sector = b.sector;
      const sinfo = sectorInfo[sector];
      const price = state.macro.sectors[sector].price;
      const cap = CONFIG.levels.capacity[b.level - 1];
      const req = requiredWorkers(b);
      const sf = f_staffing(b);
      const capEff = cap * sf;
      // cluster rev/cogs (sử dụng size từ clusterMap; tìm bằng plot id)
      const clusterSize = clusterMap.get(plot.id) || 1;
      const clusterRev = Math.min(CONFIG.cluster.revPerNeighbor * (clusterSize - 1), CONFIG.cluster.revCap);
      const clusterCogs = Math.min(CONFIG.cluster.cogsPerNeighbor * (clusterSize - 1), CONFIG.cluster.cogsCap);
      const ext = externalityFor(state, plot);
      const SECTOR = CONFIG.sectors[sector];
      const revenue = rnd(capEff * sinfo.util * price * b.efficiency * (1 + clusterRev + ext) * CONFIG.unitValue);
      const cogs = rnd(SECTOR.cogs * (1 - clusterCogs) * capEff * sinfo.util * state.macro.commodityIndex * CONFIG.unitValue);
      const wages = rnd(b.workers * CONFIG.baseWage * state.macro.wageIndex * SECTOR.wageMult);
      const nbvNow = effectiveNbv(b);
      const maint = rnd(CONFIG.maintenanceRate * nbvNow);
      const rndcost = rnd(b.rndRate * revenue);
      const maxDep = clamp(CONFIG.depreciationRate * b.grossCost, 0, b.grossCost);
      const dep = Math.min(maxDep, nbvNow);
      const wage1 = CONFIG.baseWage * state.macro.wageIndex * SECTOR.wageMult;
      const delta = b.workers - b.prevWorkers;
      const hr = rnd(
        CONFIG.hr.hireCost * wage1 * Math.max(0, delta) +
        CONFIG.hr.fireCost * wage1 * Math.max(0, -delta),
      );
      b.prevWorkers = b.workers;

      const ebit = revenue - cogs - wages - maint - rndcost - dep - hr;
      playerRevenue += revenue; playerEBIT += ebit;
      playerDepreciation += dep; playerHR += hr;

      wp.post({ memo: `Doanh thu ô ${plot.id} (${SECTOR.name})`, category: 'operating', lines: [
        { account: 'CASH', dr: revenue }, { account: 'REVENUE', cr: revenue },
      ]});
      wp.post({ memo: `Chi phí ô ${plot.id}`, category: 'operating', lines: [
        { account: 'COGS', dr: cogs },
        { account: 'WAGES', dr: wages },
        { account: 'MAINTENANCE', dr: maint },
        { account: 'RND', dr: rndcost },
        { account: 'HR_COSTS', dr: hr },
        { account: 'CASH', cr: cogs + wages + maint + rndcost + hr },
      ]});
      wp.post({ memo: `Khấu hao ô ${plot.id}`, category: 'operating', lines: [
        { account: 'DEPRECIATION', dr: dep }, { account: 'ACC_DEPR', cr: dep },
      ]});
      // R&D efficiency delta (cuối quý)
      const idx = CONFIG.rnd.rates.indexOf(b.rndRate);
      const deltaEff = CONFIG.rnd.effDelta[idx] || 0;
      b.efficiency = clamp(b.efficiency + deltaEff, CONFIG.rnd.effMin, CONFIG.rnd.effMax);
    }

    // Lãi tiền gửi
    const depBal = Math.max(0, p.balances.DEPOSIT || 0);
    const interestIncome = rnd(depBal * state.macro.depositRate / 4);
    if (interestIncome > 0) {
      wp.post({ memo: 'Lãi tiền gửi quý', category: 'operating', lines: [
        { account: 'CASH', dr: interestIncome }, { account: 'INTEREST_INCOME', cr: interestIncome },
      ]});
      state.bank.deposits += interestIncome;
      playerInterestIncome += interestIncome;
      interestIncomeTotal += interestIncome;
    }

    // Lãi vay & coupon
    let interestExpense = 0;
    for (const loan of p.loans) {
      const amt = rnd(loan.principal * (state.macro.lendingBase + loan.spread) / 4);
      interestExpense += amt;
    }
    for (const bond of p.bonds) {
      const amt = rnd(bond.principal * bond.coupon / 4);
      interestExpense += amt;
      couponPaid += amt;
    }
    // Lãi phạt nợ quá hạn
    const arrs = -((p.balances.ARREARS || 0));
    const penaltyArrears = rnd(Math.max(0, arrs) * (state.macro.lendingBase + CONFIG.loan.penaltySpread) / 4);
    interestExpense += penaltyArrears;
    playerInterestExpense = interestExpense;
    if (interestExpense > 0) {
      const r = wp.pay({ amount: interestExpense, debitAccount: 'INTEREST_EXPENSE', category: 'operating', memo: 'Lãi vay & coupon & phạt quá hạn quý' });
      const paidCash = r.fromCash + r.fromDeposit;
      interestPaidTotal += paidCash;
      badDebt += r.arrears; // phần chưa trả
      state.bank.deposits -= r.fromDeposit;
    }

    // B5 Nộp thuế quý trước (TAX_PAYABLE)
    const taxOwed = -((p.balances.TAX_PAYABLE || 0));
    if (taxOwed > 0) {
      const r = wp.pay({ amount: taxOwed, debitAccount: 'TAX_PAYABLE', category: 'tax', memo: 'Nộp thuế TNDN quý trước' });
      state.gov.cash += r.fromCash + r.fromDeposit;
      state.bank.deposits -= r.fromDeposit;
      // unpaid tax becomes ARREARS via payOrArrears logic (cr ARREARS)
    }
    // Trả gốc vay đáo hạn (tái cấp vốn nếu thiếu)
    for (const loan of [...p.loans].filter(l => l.maturityQuarter <= t)) {
      const need = loan.principal;
      if (need <= 0) continue;
      // Đánh giá điều kiện tái cấp vốn trước
      const eq = totalEquity(p);
      const capDE = CONFIG.loan.maxDE[p.rating] * eq - totalDebt(p);
      const roomOk = (state.macro.creditRoom - state.macro.creditUsed) >= need;
      const eligible = (p.rating !== 'D') && capDE >= need && roomOk;
      const short = need - (p.balances.CASH || 0);
      const newId = `R${t}_${pid}_${(++idc).toString(36)}`;
      if (eligible && short > 0) {
        wp.post({ memo: `Tái cấp vốn ${newId} khoản ${loan.id}`, category: 'financing', lines: [
          { account: 'CASH', dr: short }, { account: 'BANK_LOAN', cr: short },
        ]});
        p.loans.push({ id: newId, principal: short, spread: CONFIG.loan.spread[p.rating], originQuarter: t, maturityQuarter: t + CONFIG.loan.rolloverQuarters });
        state.bank.loans += short;
        state.macro.creditUsed += short;
        newLoans += short;
        rolloverLogs.push({ pid, ok: true, refinanced: short });
      } else if (short > 0 && !eligible) {
        rolloverLogs.push({ pid, ok: false, refinanced: 0, reason: p.rating });
      }
      const payAmt = Math.min(need, p.balances.CASH || 0);
      const still = need - payAmt;
      wp.post({ memo: `Trả gốc vay đáo hạn ${loan.id} (${still > 0 ? 'thiếu → ARREARS' : 'đủ'})`, category: 'financing', lines: [
        { account: 'BANK_LOAN', dr: need },
        { account: 'CASH', cr: payAmt },
        ...(still > 0 ? [{ account: 'ARREARS', cr: still }] : []),
      ]});
      state.bank.loans -= need;
      if (still > 0) badDebt += still;
      loan.principal = 0;
    }
    p.loans = p.loans.filter(l => l.principal > 0);
    // Trả gốc trái phiếu đáo hạn
    for (const bond of p.bonds.filter(b => b.maturityQuarter <= t)) {
      const need = bond.principal;
      bondPrincipalPaid += need;
      const payAmt = Math.min(need, p.balances.CASH || 0);
      const still = need - payAmt;
      wp.post({ memo: `Trả gốc trái phiếu ${bond.id}`, category: 'financing', lines: [
        { account: 'BONDS_PAYABLE', dr: need },
        { account: 'CASH', cr: payAmt },
        ...(still > 0 ? [{ account: 'ARREARS', cr: still }] : []),
      ]});
      if (still > 0) badDebt += still;
      state.investors.bondsHeld -= need;
      bond.principal = 0;
    }
    p.bonds = p.bonds.filter(b => b.principal > 0);

    // B6 Thuế đất trống (nộp ngay)
    let idleLandTax = 0;
    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      if (plot.business) continue;
      if (plot.idleQuarters < CONFIG.idle.taxAfter) continue;
      const lv = landValue(plot, state.macro, state.plots);
      idleLandTax += rnd(CONFIG.idle.taxRate * lv);
    }
    if (idleLandTax > 0) {
      const r = wp.pay({ amount: idleLandTax, debitAccount: 'IDLE_LAND_TAX', category: 'tax', memo: 'Thuế đất trống quý' });
      state.gov.cash += r.fromCash + r.fromDeposit;
      state.bank.deposits -= r.fromDeposit;
      badDebt += r.arrears;
    }
    // Thuế TNDN quý t (ghi nhận phải nộp, đóng sổ vào quý sau)
    const ebt = playerEBIT + playerInterestIncome - playerInterestExpense - idleLandTax;
    if (ebt < 0) p.taxLossCarry += -ebt;
    else {
      const usedLoss = Math.min(p.taxLossCarry, ebt);
      p.taxLossCarry = Math.max(0, p.taxLossCarry - usedLoss);
      const taxable = Math.max(0, ebt - usedLoss);
      const tax = computeCorporateTax(taxable);
      if (tax > 0) {
        wp.post({ memo: 'Ghi nhận thuế TNDN quý', category: 'tax', lines: [
          { account: 'TAX_EXPENSE', dr: tax }, { account: 'TAX_PAYABLE', cr: tax },
        ]});
      }
    }

    // B7 Định giá lại đất (fair value)
    let landBookBefore = p.balances.LAND || 0;
    let landFairValue = 0;
    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      landFairValue += landValue(plot, state.macro, state.plots);
    }
    const delta = landFairValue - landBookBefore;
    if (delta > 0) {
      wp.post({ memo: 'Định giá lại đất (lãi)', category: 'system', lines: [
        { account: 'LAND', dr: delta }, { account: 'REVAL_GAIN', cr: delta },
      ]});
    } else if (delta < 0) {
      wp.post({ memo: 'Định giá lại đất (lỗ)', category: 'system', lines: [
        { account: 'REVAL_LOSS', dr: -delta }, { account: 'LAND', cr: -delta },
      ]});
    }
    // idleQuarters update
    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      if (plot.business) plot.idleQuarters = 0;
      else plot.idleQuarters += 1;
    }

    // B8 Kiểm tra rủi ro → phá sản (M3 placeholder ở processBankruptcy đơn giản)
    const eq = totalEquity(p);
    const arrearsBal = -((p.balances.ARREARS || 0));
    if (arrearsBal > 0) p.distressQuarters += 1; else p.distressQuarters = Math.max(0, p.distressQuarters - 1);
    if (eq < 0 || (p.distressQuarters >= 2 && arrearsBal > 0)) {
      p.eliminatedAtQuarter = t;
      p.finalNetWorth = eq;
      const before = state.bank.capital;
      const bd = processBankruptcy(state, pid);
      badDebt += bd.bankLoss;
      const bankLoss = before - state.bank.capital;
      const reason = eq < 0 ? 'vốn chủ âm' : 'nợ quá hạn hai quý liên tiếp';
      bankrupts.push({ pid, reason, bankLoss });
      resultsByPlayer[pid].bankruptcy = true;
      journal.push({ category: 'system', playerId: pid, quarter: t, memo: `Phá sản (${reason}), ngân hàng chịu lỗ ${bankLoss}` });
    }

    // B9 Đóng sổ → xếp hạng → báo cáo
    const closeRes = closeTemporaryAccounts(L, pid);
    const qreportNet = closeRes.netIncome;
    const rep = balancesReport(p.balances);
    playerNetWorth = rep.assets.total - rep.liabilities.total;
    // xếp hạng
    const qrData = {
      quarter: t,
      revenue: playerRevenue,
      interest: playerInterestExpense,
      depreciation: playerDepreciation,
      ebit: playerEBIT,
      netIncome: qreportNet,
      netWorth: playerNetWorth,
      equity: rep.equity.total,
    };
    p.history.push(qrData);
    if (p.status === 'active') {
      const hasOp = hasOperating(state, pid);
      p.rating = hasOp ? ratePlayer(p, qrData) : p.rating;
    }
    reports.push({
      quarter: t,
      playerId: pid,
      data: {
        balance: rep,
        pnl: {
          revenue: playerRevenue,
          ebit: playerEBIT,
          interestIncome: playerInterestIncome,
          interestExpense: playerInterestExpense,
          idleLandTax,
          taxExpense: Math.abs(p.balances.TAX_EXPENSE || 0),
          revaluation: delta,
          ebt,
          netIncome: qreportNet,
        },
        netWorth: playerNetWorth,
        rating: p.rating,
      },
    });
  }

  // Dòng tiền nhà đầu tư: cộng coupon & gốc nhận từ người chơi (đã trừ khi phá sản)
  state.investors.cash += couponPaid + bondPrincipalPaid;
  // Bank next
  state.bank.capital = Math.max(0, state.bank.capital + 300 + Math.round(0.25 * (interestPaidTotal - interestIncomeTotal)) - Math.round(badDebt));
  // Gov spend
  govTaxCollected = state.gov.cash || 0;
  const spend = Math.round(0.5 * state.gov.cash);
  govSpendAmount = spend;
  state.gov.cash -= spend;
  govImpulseRef.govSpend = spend;

  // === C. Chuẩn bị quý t+1 ===
  // C1 tung xúc xắc cho t+1
  const diceA = rngDice.int(1, 6);
  const diceB = rngDice.int(1, 6);
  state.dice = { a: diceA, b: diceB };

  // C2 Chọn pha chu kỳ mới + sự kiện
  const rngPhase = rngFor(state.seed, PURPOSES.phase, t + 1);
  let newPhase = state.macro.phase;
  if (state.macro.phaseAge < 2) {
    state.macro.phaseAge += 1;
  } else {
    newPhase = nextPhase(state.macro, rngPhase);
    state.macro.phaseAge = newPhase === state.macro.phase ? state.macro.phaseAge + 1 : 0;
    state.macro.phase = newPhase;
  }
  const rngEvent = rngFor(state.seed, PURPOSES.event, t + 1);
  // giảm remaining sự kiện đang chạy
  state.macro.activeEvents = state.macro.activeEvents.map(e => ({ ...e, remaining: e.remaining - 1 })).filter(e => e.remaining > 0);
  if (t + 1 >= CONFIG.eventFromQuarter && rngEvent.next() < CONFIG.eventChance) {
    const items = EVENTS.map(e => ({ value: e, weight: e.weight }));
    const ev = rngEvent.pick(items);
    state.macro.activeEvents.push({ id: ev.id, remaining: ev.duration, spec: ev });
    newEvents.push({
      id: ev.id,
      name: ev.name,
      description: ev._hint || buildEventHint(ev),
      severity: ev.severity || 'info',
    });
  }

  // C3 Tính toán macro mới cho quý t+1
  // 1) tính nominalDemand (quy t): Σ price * demand * unitValue (tính trên quý t vừa rồi để lấy gov impulse)
  let nominalDemand = 0;
  for (const s of Object.keys(CONFIG.sectors)) {
    nominalDemand += state.macro.sectors[s].demand * state.macro.sectors[s].price * CONFIG.unitValue;
  }
  const govImpulse = clamp(0.3 * spend / Math.max(1, nominalDemand), 0, 0.01);
  // rng.normal for growth
  const rngNoise = rngFor(state.seed, PURPOSES.macroNoise, t + 1);
  const rngNorm = rngNoise.normal(0, 0.004);

  // event shocks
  let confDelta = 0;
  let landShock = 0;
  let commShock = 0;
  let wageShock = 0;
  let demandShock = 0;
  let roomMult = 1;
  let onceBankCapitalPct = 0;
  for (const e of state.macro.activeEvents) {
    const spec = e.spec;
    if (!spec) continue;
    if (e.remaining === spec.duration) { // first active quarter (this one newly added) => apply once
      if (spec.commodityShock) commShock += spec.commodityShock;
      if (spec.wageShock) wageShock += spec.wageShock;
      if (spec.landShock) landShock += spec.landShock;
      if (spec.demandIndexShock) demandShock += spec.demandIndexShock;
      if (spec.confidenceDelta) confDelta += spec.confidenceDelta;
      if (spec.bankCapitalPct) onceBankCapitalPct += spec.bankCapitalPct;
      if (spec.roomMult) roomMult *= spec.roomMult;
    } else if (!spec.once) {
      // recurring: only demandMult/supplyMult applied via sectors demand/supply; no repeated shocks
    }
  }
  // apply once bank capital %
  if (onceBankCapitalPct) {
    state.bank.capital = Math.max(0, Math.round(state.bank.capital * (1 + onceBankCapitalPct)));
  }
  // Dice B commodity shock
  const diceCommodity = { 1: 0.08, 2: 0.03, 3: 0, 4: 0, 5: -0.03, 6: -0.08 }[diceB] || 0;
  // worker counts
  let playerWorkers = 0; let playerWorkersPrev = 0;
  for (const pid of activeIds) {
    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      const b = plot.business;
      if (!b) continue;
      if (b.status === 'operating' || b.status === 'upgrading') playerWorkers += b.workers;
    }
  }
  playerWorkersPrev = playerWorkers; // approximate
  // policy next
  const inflAnn = 4 * state.macro.inflation;
  const target = 0.06 + 0.8 * (inflAnn - 0.04) - 0.4 * (state.macro.unemployment - 0.06) - (newPhase === 'recession' ? 0.005 : 0);
  const deltaPol = clamp(target - state.macro.policyRate, -0.0075, 0.0075);
  const policyRateNext = clamp(Math.round((state.macro.policyRate + deltaPol) / 0.0025) * 0.0025, 0.015, 0.14);

  const gNext = growthNext(state.macro, policyRateNext, state.macro.creditUsed, state.macro.creditRoom, govImpulse, rngNorm, demandShock);
  const uNext = computeUnemployment(state.macro, playerWorkers, playerWorkersPrev, state.macro.laborForce, gNext);
  const wgNext = wageGrowth(state.macro, uNext) + wageShock;
  const confTarget = confidenceTarget(state.macro, gNext, uNext, confDelta);
  const confNext = confidenceNext(state.macro, confTarget);
  const landGrowthNext = clamp(0.4 * state.macro.inflation + 0.7 * gNext - 0.4 * (policyRateNext - 0.06) + landShock + rngNoise.normal(0, 0.004), -0.06, 0.06);
  const commGrowth = diceCommodity + commShock + 0.1 * (1 - state.macro.commodityIndex);
  const commodityNext = clamp(state.macro.commodityIndex * (1 + commGrowth), 0.7, 1.8);
  const wageNext = clamp(state.macro.wageIndex * (1 + wgNext), 0.5, 3.0);
  const demandIndexNext = clamp(state.macro.demandIndex * (1 + gNext), 0.3, 3.0);
  const landNext = clamp(state.macro.landIndex * (1 + landGrowthNext), 0.5, 3.0);
  const roomNext = creditRoomNext(policyRateNext, inflAnn, state.bank, state.nPlayers, roomMult);

  // write macroNext (keep sectors demand/supply from B2, but we will recompute at start of t+1)
  state.quarter = t + 1;
  state.macro.quarter = t + 1;
  state.macro.policyRate = policyRateNext;
  state.macro.depositRate = Math.max(0.005, policyRateNext - 0.015);
  state.macro.lendingBase = policyRateNext + 0.025;
  state.macro.govYield = policyRateNext + 0.01;
  state.macro.creditRoom = roomNext;
  state.macro.creditUsed = 0;
  state.macro.growth = gNext;
  state.macro.unemployment = uNext;
  state.macro.wageGrowth = wgNext;
  state.macro.commodityGrowth = commGrowth;
  state.macro.confidence = confNext;
  state.macro.cpi = clamp(state.macro.cpi * (1 + state.macro.inflation), 0.5, 3.0);
  state.macro.wageIndex = wageNext;
  state.macro.commodityIndex = commodityNext;
  state.macro.landIndex = landNext;
  state.macro.demandIndex = demandIndexNext;

  // C4 listings mới (đất rao bán): ưu tiên foreclosure, rồi ô chưa có chủ ngẫu nhiên
  const unownedPlots = state.plots.filter(p => !p.ownerId);
  const npc = unownedPlots.filter(p => p._foreclosure);
  const listCount = Math.min(unownedPlots.length, diceA + Math.ceil(state.nPlayers / 2) + 1);
  const rngList = rngFor(state.seed, PURPOSES.dice, t + 1);
  const selected = new Set();
  const newListings = [];
  for (const p of npc) {
    if (newListings.length >= listCount) break;
    if (selected.has(p.id)) continue;
    selected.add(p.id);
    const reserve = rnd(CONFIG.foreclosureReserve * landValue(p, state.macro, state.plots));
    newListings.push({ plotId: p.id, reserve, source: 'foreclosure' });
    delete p._foreclosure;
  }
  const rem = listCount - newListings.length;
  const otherCandidates = unownedPlots.filter(p => !selected.has(p.id) && !p._foreclosure);
  const shuffled = rngList.shuffle(otherCandidates).slice(0, rem);
  for (const p of shuffled) {
    selected.add(p.id);
    const reserve = landValue(p, state.macro, state.plots);
    newListings.push({ plotId: p.id, reserve, source: 'market' });
  }
  state.listings = newListings;

  // macro history snapshot
  const snap = {
    quarter: state.macro.quarter, phase: state.macro.phase, phaseAge: state.macro.phaseAge,
    policyRate: state.macro.policyRate, depositRate: state.macro.depositRate,
    lendingBase: state.macro.lendingBase, govYield: state.macro.govYield,
    creditRoom: state.macro.creditRoom, creditUsed: state.macro.creditUsed,
    inflation: state.macro.inflation, growth: state.macro.growth,
    unemployment: state.macro.unemployment, confidence: state.macro.confidence,
    cpi: state.macro.cpi, wageIndex: state.macro.wageIndex,
    commodityIndex: state.macro.commodityIndex, landIndex: state.macro.landIndex,
    demandIndex: state.macro.demandIndex,
  };
  state.macroHistory.push(snap);
  if (state.macroHistory.length > 40) state.macroHistory.shift();

  // C6 end game
  const stillActive = Object.values(state.players).filter(p => p.status === 'active');
  if (t >= state.totalQuarters || stillActive.length <= 1) {
    state.finished = true;
    const ranking = Object.values(state.players).map(p => {
      const eq = totalEquity(p);
      const status = p.status;
      const net = status === 'active' ? eq : (p.finalNetWorth ?? eq);
      return { playerId: p.id, netWorth: net, rank: 0, status, cash: p.balances.CASH || 0 };
    });
    ranking.sort((a, b) => b.netWorth - a.netWorth || b.cash - a.cash);
    ranking.forEach((r, i) => (r.rank = i + 1));
    state.ranking = ranking.map(({ rank, playerId, netWorth, status }) => ({ rank, playerId, netWorth, status }));
  } else {
    // C7 quarter++ (đã cập nhật ở macro trên), reset pending
    for (const pid of allPids) {
      if (state.players[pid].status === 'active') {
        state.players[pid]._pendingValid = [];
      }
    }
  }

  // market report skeleton + roleLogs
  const roleLogs = buildRoleLogs(state, {
    prevMacro,
    borrowLogs,
    rolloverLogs,
    bondLogs,
    shareLogs,
    govTax: govTaxCollected,
    govSpend: govSpendAmount,
    bankrupts,
    newEvents,
  });
  const market = {
    quarter: t,
    dice: state.dice,
    listings: state.listings,
    roleLogs,
    inflationAnn: 4 * state.macro.inflation,
  };

  return { state, journal, reports, market, results: resultsByPlayer };
}
