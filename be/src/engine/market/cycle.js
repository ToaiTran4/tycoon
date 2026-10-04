import { rngFor, PURPOSES } from '../rng.js';
import { clamp } from '../money.js';
import { CONFIG } from '../config.js';

const TRANSITION = {
  stable:    { boom: 0.25, stable: 0.60, recession: 0.15 },
  recession: { boom: 0.05, stable: 0.40, recession: 0.55 },
  boom:      { boom: 0.65, stable: 0.30, recession: 0.05 },
};

export function nextPhase(macro, rng) {
  if (macro.phaseAge < 2) return macro.phase;
  let weights = { ...TRANSITION[macro.phase] };
  const inflAnn = 4 * macro.inflation;
  if (macro.phase === 'boom' && macro.phaseAge >= 4) {
    weights.recession = (weights.recession || 0) + 0.10;
    weights.boom = Math.max(0, (weights.boom || 0) - 0.10);
  }
  if (inflAnn > 0.08) {
    weights.recession = (weights.recession || 0) + 0.10;
    weights.boom = Math.max(0, (weights.boom || 0) - 0.10);
  }
  const items = Object.entries(weights).map(([k, v]) => ({ value: k, weight: Math.max(0, v) }));
  const total = items.reduce((s, it) => s + it.weight, 0);
  for (const it of items) it.weight = it.weight / total;
  return rng.pick(items);
}

export function applyPolicyRate(macroPrev, rngNoise) {
  const inflAnn = 4 * macroPrev.inflation;
  const target =
    0.06 +
    0.8 * (inflAnn - 0.04) -
    0.4 * (macroPrev.unemployment - 0.06);
  const delta = clamp(target - macroPrev.policyRate, -0.0075, 0.0075);
  return clamp(Math.round((macroPrev.policyRate + delta) / 0.0025) * 0.0025, 0.015, 0.14);
}
