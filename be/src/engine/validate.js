import { apForAction, ActionZod } from './actions.js';
import { CONFIG } from './config.js';
import { landValue, neighbors } from './map.js';

export function parseAction(raw) {
  try { return ActionZod.parse(raw); } catch { return null; }
}

function _balancesDebt(b) {
  return -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.ARREARS || 0));
}
function _balancesEquity(b) {
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liab = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liab;
}

export function validateActionsForPlayer(state, playerId, actions) {
  const warnings = [];
  const errors = [];
  const me = state.players[playerId];
  if (!me) return { ok: false, errors: ['player_not_found'], warnings };
  let ap = CONFIG.actionPoints;
  const plotsOwned = new Set(state.plots.filter(p => p.ownerId === playerId).map(p => p.id));
  const hasOp = state.plots.some(p => p.ownerId === playerId && p.business && p.business.status === 'operating');
  for (const a of actions) {
    const parsed = parseAction(a);
    if (!parsed) { errors.push(`invalid_action: ${JSON.stringify(a)}`); continue; }
    ap -= apForAction(parsed.type);
    if (ap < 0) errors.push(`action_points_exceeded: ${parsed.type}`);
    if (['build','upgrade','convert','sellPlot','setWorkers','setReinvest'].includes(parsed.type)) {
      if (!plotsOwned.has(parsed.plotId)) errors.push(`not_owner: plot ${parsed.plotId}`);
    }
    if (parsed.type === 'deposit') {
      const cash = me.balances.CASH || 0;
      if (parsed.amount > cash) warnings.push(`deposit_exceeds_cash: ${parsed.amount} > ${cash}`);
    }
    if (parsed.type === 'withdraw') {
      const dep = me.balances.DEPOSIT || 0;
      if (parsed.amount > dep) warnings.push(`withdraw_exceeds_deposit: ${parsed.amount} > ${dep}`);
    }
    if (parsed.type === 'borrow') {
      if (parsed.amount < CONFIG.loan.minAmount) errors.push(`borrow_below_min: ${parsed.amount} < ${CONFIG.loan.minAmount}`);
      const eq = _balancesEquity(me.balances);
      const debt = _balancesDebt(me.balances);
      const capDE = CONFIG.loan.maxDE[me.rating] * eq - debt;
      if (capDE < parsed.amount) warnings.push(`borrow_exceeds_de_ceiling: req ${parsed.amount} cap ${Math.round(capDE)}`);
      if (eq <= 0) warnings.push('borrow_equity_nonpositive');
    }
    if (parsed.type === 'repay') {
      const loan = me.loans.find(l => l.id === parsed.loanId);
      if (!loan) errors.push(`repay_loan_not_found: ${parsed.loanId}`);
      const cash = me.balances.CASH || 0;
      if (loan && parsed.amount > cash) warnings.push(`repay_exceeds_cash: ${parsed.amount} > ${cash}`);
    }
    if (parsed.type === 'issueBond') {
      if (!hasOp) warnings.push('issueBond_no_operating');
      if (me.rating === 'D') warnings.push('issueBond_rating_d');
    }
    if (parsed.type === 'issueShares') {
      if (!hasOp) warnings.push('issueShares_no_operating');
      if (_balancesEquity(me.balances) <= 0) warnings.push('issueShares_equity_nonpositive');
    }
    if (parsed.type === 'bid') {
      const listing = state.listings.find(l => l.plotId === parsed.plotId);
      if (!listing) warnings.push(`bid_not_listed: plot ${parsed.plotId}`);
      else if (parsed.amount < listing.reserve) warnings.push(`bid_below_reserve: ${parsed.amount} < ${listing.reserve}`);
    }
    if (parsed.type === 'claimIdle') {
      const plot = state.plots.find(p => p.id === parsed.plotId);
      if (!plot) { errors.push(`claimIdle_plot_not_found: ${parsed.plotId}`); continue; }
      if (!plot.ownerId || plot.ownerId === playerId) warnings.push(`claimIdle_not_owned_by_other: plot ${parsed.plotId}`);
      if (plot.business) warnings.push(`claimIdle_plot_has_business: plot ${parsed.plotId}`);
      if (plot.idleQuarters < CONFIG.idle.claimAfter) warnings.push(`claimIdle_idle_quarters_insufficient: ${plot.idleQuarters} < ${CONFIG.idle.claimAfter}`);
      const ownedAdj = neighbors(state.plots, plot).some(n => n.ownerId === playerId);
      if (!ownedAdj) warnings.push(`claimIdle_no_adjacent_owned: plot ${parsed.plotId}`);
      if (plot.ownerId) {
        const lv = landValue(plot, state.macro, state.plots);
        const price = Math.round(CONFIG.idle.claimPremium * lv);
        const avail = (me.balances.CASH || 0) + (me.balances.DEPOSIT || 0);
        if (avail < price) warnings.push(`claimIdle_insufficient_funds: need ${price}, avail ${avail}`);
      }
    }
  }
  return { ok: errors.length === 0, errors, warnings, apLeft: ap };
}
