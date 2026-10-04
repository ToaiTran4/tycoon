#!/usr/bin/env node
import { initGameState } from '../src/engine/init.js';
import { resolveQuarter } from '../src/engine/resolve.js';
import { validateActionsForPlayer } from '../src/engine/validate.js';
import { BOTS } from '../src/engine/bots.js';
import { landValue, clustersByOwnerSector as _clustersByOwnerSector } from '../src/engine/map.js';
import { buildCost, requiredWorkers as _requiredWorkers } from '../src/engine/business.js';
import { CONFIG } from '../src/engine/config.js';
import { rnd } from '../src/engine/money.js';
import { effectiveNbv } from '../src/engine/bankruptcy.js';

function totalEquity(p) {
  const b = p.balances;
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liab = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liab;
}

function cash(p) { return (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0); }

const botKeys = Object.keys(BOTS);

function simGame(seedIdx) {
  const seed = `sim_${seedIdx}`;
  const names = ['An', 'Bình', 'Cẩm', 'Dung', 'Em', 'Phong'];
  const nPlayers = 4;
  const players = [];
  for (let i = 0; i < nPlayers; i++) {
    players.push({ id: `p${i}`, name: names[i], seat: i });
  }
  let state = initGameState({ seed, totalQuarters: 20, players });
  const botAssign = {};
  for (let i = 0; i < nPlayers; i++) botAssign[`p${i}`] = botKeys[(seedIdx + i) % botKeys.length];
  let res = null;
  while (!state.finished) {
    const actions = {};
    for (const pid of Object.keys(state.players)) {
      if (state.players[pid].status !== 'active') continue;
      const botFn = BOTS[botAssign[pid]];
      let acts = botFn ? botFn(state, pid) : [];
      const v = validateActionsForPlayer(state, pid, acts);
      if (!v.ok) acts = [];
      actions[pid] = acts;
    }
    res = resolveQuarter(state, actions);
    state = res.state;
    // Bất biến 8.4 đơn giản: balances check = 0
    for (const p of Object.values(state.players)) {
      if (p.status !== 'active') continue;
      const b = p.balances;
      let dr = 0, cr = 0;
      for (const k of Object.keys(b)) {
        if (b[k] > 0) dr += b[k]; else cr += -b[k];
      }
      if (Math.abs(dr - cr) > 1e-6) {
        throw new Error(`invariant fail: dr!=cr ${p.id} seed=${seedIdx} q=${state.quarter}`);
      }
    }
    if (state.quarter > 120) break; // phòng vô hạn
  }
  return { ...state, botAssign };
}

async function main() {
  const GAMES = parseInt(process.argv[2] || '300', 10);
  const failures = [];
  const summary = { n: GAMES, bankrupt: 0, finished: 0, avgRank1Eq: 0, bankruptByType: {}, botStarts: {} };
  let sumEq = 0; let rank1Count = 0;
  let macroViolations = 0;

  for (let i = 1; i <= GAMES; i++) {
    try {
      const s = simGame(i);
      if (s.finished) summary.finished += 1;
      
      // Track macro violations (simple check)
      if (s.macro.inflation > 0.2 || s.macro.policyRate > 0.2) macroViolations++;

      for (const p of Object.values(s.players)) {
        const type = s.botAssign[p.id];
        summary.botStarts[type] = (summary.botStarts[type] || 0) + 1;
        if (p.status === 'bankrupt') {
          summary.bankrupt += 1;
          summary.bankruptByType[type] = (summary.bankruptByType[type] || 0) + 1;
        }
        sumEq += totalEquity(p);
      }
      const r = s.ranking?.[0];
      if (r) { summary.avgRank1Eq += r.netWorth; rank1Count++; }
      if (i % 10 === 0) process.stdout.write(`[sim] ${i}/${GAMES} done\n`);
    } catch (e) {
      failures.push({ i, message: e.message || String(e) });
    }
  }
  process.stdout.write('\n=== Summary ===\n');
  process.stdout.write(`Games: ${GAMES}  Finished: ${summary.finished}  Failures: ${failures.length}\n`);
  process.stdout.write(`Bankrupt count across games: ${summary.bankrupt} (avg ${(summary.bankrupt / GAMES).toFixed(2)}/game)\n`);
  process.stdout.write('Bankrupt by bot type:\n');
  for (const type of botKeys) {
    const starts = summary.botStarts[type] || 0;
    const br = summary.bankruptByType[type] || 0;
    const pct = starts ? (br / starts * 100).toFixed(1) : 0;
    process.stdout.write(`  ${type.padEnd(12)}: ${br}/${starts} (${pct}%)\n`);
  }
  process.stdout.write(`Macro violations (Inf/Rate > 20%): ${macroViolations}\n`);
  process.stdout.write(`Avg equity/player end: ${Math.round(sumEq / (GAMES * 4))}M\n`);
  if (rank1Count) process.stdout.write(`Avg rank1 net worth: ${Math.round(summary.avgRank1Eq / rank1Count)}M\n`);
  if (failures.length) {
    process.stdout.write('\nFirst failures:\n');
    for (const f of failures.slice(0, 8)) process.stdout.write(`  seed ${f.i}: ${f.message}\n`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
