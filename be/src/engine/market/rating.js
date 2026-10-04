import { CONFIG } from '../config.js';
import { clamp } from '../money.js';

export function ratePlayer(player, quarterReport) {
  const { balances, bonds, loans } = player;
  const totalDebt =
    -((balances.BANK_LOAN || 0) + (balances.BONDS_PAYABLE || 0) + (balances.ARREARS || 0));
  const equity = quarterReport?.equity?.total ?? computeEquity(player);
  const de = equity > 0 ? totalDebt / equity : 9;
  const interest = quarterReport?.interest ?? 0;
  const ebit = quarterReport?.ebit ?? 0;
  const depreciation = quarterReport?.depreciation ?? 0;
  const coverage = interest > 0 ? (ebit + depreciation) / interest : 99;
  const cash = (balances.CASH || 0) + (balances.DEPOSIT || 0);
  const liquidity = totalDebt > 0 ? cash / Math.max(1, 0.15 * totalDebt + 500) : 99;
  const revenue = quarterReport?.revenue ?? 0;
  const netIncome = quarterReport?.netIncome ?? 0;
  const netMargin = revenue > 0 ? netIncome / revenue : 0;
  const score =
    clamp(30 * (1 - de / 3), 0, 30) +
    clamp(25 * Math.min(coverage, 5) / 5, 0, 25) +
    clamp(25 * Math.min(liquidity, 1), 0, 25) +
    clamp(20 * netMargin / 0.15, 0, 20) -
    ((balances.ARREARS || 0) < 0 ? 20 : 0);
  return score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
}

function computeEquity(player) {
  const b = player.balances;
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liabilities = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liabilities;
}
