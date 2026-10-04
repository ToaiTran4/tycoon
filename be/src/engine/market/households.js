import { CONFIG } from '../config.js';
import { clamp, rnd } from '../money.js';

export function computeUnemployment(macroPrev, playerWorkers, playerWorkersPrev, laborForce, gNext) {
  const u_t = macroPrev.unemployment;
  const delta =
    -0.35 * (gNext - 0.010) -
    (playerWorkers - playerWorkersPrev) / laborForce +
    0.1 * (0.05 - u_t);
  return clamp(u_t + delta, 0.02, 0.15);
}

export function wageGrowth(macroPrev, unemploymentNext) {
  return clamp(0.7 * macroPrev.inflation + 0.05 * (0.06 - unemploymentNext), -0.01, 0.04);
}

export function confidenceTarget(macroPrev, gNext, unemploymentNext, eventConfDelta) {
  const inflAnn = 4 * macroPrev.inflation;
  return (
    50 +
    400 * gNext -
    150 * Math.max(0, inflAnn - 0.05) -
    250 * (unemploymentNext - 0.06) +
    (eventConfDelta || 0)
  );
}

export function confidenceNext(macroPrev, target) {
  return clamp(macroPrev.confidence + 0.5 * (target - macroPrev.confidence), 10, 95);
}

export function growthNext(macroPrev, policyNext, creditUsed_prev, creditRoom_prev, govImpulse, rngNorm, eventDemandShock) {
  const base = { boom: 0.025, stable: 0.010, recession: -0.015 }[macroPrev.phase] ?? 0.01;
  const g =
    base -
    0.15 * (policyNext - 0.06) +
    0.0002 * (macroPrev.confidence - 50) +
    0.004 * (creditUsed_prev / Math.max(1, creditRoom_prev) - 0.5) +
    (govImpulse || 0) +
    (eventDemandShock || 0) +
    (rngNorm || 0);
  return clamp(g, -0.04, 0.05);
}
