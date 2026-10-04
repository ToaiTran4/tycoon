import { CONFIG } from '../config.js';
import { clamp, rnd } from '../money.js';

function demandMult(s, m) {
  const conf = m.confidence;
  const r = m.policyRate;
  switch (s) {
    case 'agri':        return 1.0;
    case 'tourism':     return 0.7 + 0.6 * conf / 100;
    case 'real_estate': return clamp(1 - 4 * (r - 0.06) + 0.004 * (conf - 50), 0.6, 1.4);
    case 'tech':        return 0.85 + 0.3 * conf / 100;
  }
  return 1;
}

export function applyEventsToSectorDemand(demand, s, events) {
  let m = demand;
  for (const ev of events) {
    const spec = ev._spec;
    if (!spec) continue;
    if (spec.demandMult && spec.demandMult[s]) m *= spec.demandMult[s];
  }
  return m;
}

export function computeDemandSupply(state) {
  const m = state.macro;
  const n = state.nPlayers;
  const out = {};
  const playerCap = {};
  for (const s of Object.keys(CONFIG.sectors)) playerCap[s] = 0;
  for (const plot of state.plots) {
    const b = plot.business;
    if (!b || b.status !== 'operating') continue;
    const req = CONFIG.levels.workers[b.level - 1];
    const staffing = req > 0 ? (b.workers / req) : 1;
    playerCap[b.sector] += CONFIG.levels.capacity[b.level - 1] * staffing;
  }
  for (const s of Object.keys(CONFIG.sectors)) {
    const SECTOR = CONFIG.sectors[s];
    const npcCap0 = SECTOR.npcBase * (0.6 + 0.1 * n);
    let npcCap = m.sectors[s].npcCap;
    const mult = {}; // per-event supply mult
    for (const ev of m.activeEvents) {
      const spec = ev._spec;
      if (!spec) continue;
      if (spec.supplyMult && spec.supplyMult[s]) mult[s] = (mult[s] || 1) * spec.supplyMult[s];
    }
    const npcEff = Math.max(0.4 * npcCap, npcCap - 0.8 * playerCap[s]) * (mult[s] || 1);
    const demand = applyEventsToSectorDemand(npcCap0 * m.demandIndex * demandMult(s, m), s, m.activeEvents.map(e => ({ _spec: e.spec })));
    const supply = npcEff + playerCap[s];
    const ratio = supply > 0 ? demand / supply : 1;
    const util = Math.min(1, ratio);
    out[s] = { demand, supply, ratio, util, npcEff, playerCap: playerCap[s] };
  }
  return out;
}
