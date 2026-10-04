import { CONFIG } from '../config.js';

export function governmentSpend(govCash) {
  return Math.round(0.5 * govCash);
}

export function computeCorporateTax(taxable, brackets = CONFIG.tax.brackets) {
  let remaining = Math.max(0, taxable);
  let tax = 0;
  let below = 0;
  for (const b of brackets) {
    const upTo = b.upTo === Infinity ? remaining : b.upTo;
    const band = Math.max(0, Math.min(remaining, upTo) - below);
    tax += band * b.rate;
    below = upTo;
    if (remaining <= upTo) break;
  }
  return Math.round(tax);
}
