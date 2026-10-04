import { CONFIG } from './config.js';
import { clamp, rnd } from './money.js';

export function constructionIndex(macro) {
  return 0.5 * macro.commodityIndex + 0.5 * macro.wageIndex;
}

export function buildCost(sector, level, macro) {
  const base = CONFIG.sectors[sector].build[level - 1];
  return rnd(base * constructionIndex(macro));
}

export function nbv(business) {
  // Simplified: assume depreciated 2% per quarter.
  const age = 0; // placeholder, real impl would track age in business
  const dep = clamp(CONFIG.depreciationRate * age * business.grossCost, 0, business.grossCost);
  return Math.max(0, business.grossCost - dep);
}

// Compute staffing ratio
export function staffing(b) {
  const req = CONFIG.levels.workers[b.level - 1];
  return req > 0 ? b.workers / req : 1;
}

export function requiredWorkers(b) {
  return CONFIG.levels.workers[b.level - 1];
}
