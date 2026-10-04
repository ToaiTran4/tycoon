import { CONFIG } from './config.js';
import { createLedger, post } from './ledger.js';
import { rnd } from './money.js';

export function makeInitialMacro(nPlayers) {
  const sectors = {};
  for (const s of Object.keys(CONFIG.sectors)) {
    sectors[s] = {
      price: 1.0,
      npcCap: CONFIG.sectors[s].npcBase * (0.6 + 0.1 * nPlayers),
      demand: 0,
      supply: 0,
      util: 1.0,
      priceGrowth: 0,
    };
  }
  return {
    quarter: 1,
    phase: CONFIG.macroInit.phase,
    phaseAge: 0,
    policyRate: CONFIG.macroInit.policyRate,
    depositRate: Math.max(0.005, CONFIG.macroInit.policyRate - 0.015),
    lendingBase: CONFIG.macroInit.policyRate + 0.025,
    govYield: CONFIG.macroInit.policyRate + 0.01,
    creditRoom: CONFIG.roomPerPlayer * nPlayers,
    creditUsed: 0,
    inflation: CONFIG.macroInit.inflation,
    growth: 0.01,
    unemployment: CONFIG.macroInit.unemployment,
    confidence: CONFIG.macroInit.confidence,
    cpi: 1.0,
    wageIndex: 1.0,
    commodityIndex: 1.0,
    landIndex: 1.0,
    demandIndex: 1.0,
    wageGrowth: 0,
    commodityGrowth: 0,
    sectors,
    activeEvents: [],
    laborForce: 1500 * nPlayers,
  };
}

export function makeInitialPlots() {
  const plots = [];
  const { w, h } = CONFIG.grid;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let tier = 'edge';
      if ((x === 2 || x === 3) && (y === 2 || y === 3)) tier = 'core';
      else if (x >= 1 && x <= 4 && y >= 1 && y <= 4) tier = 'mid';
      plots.push({
        id: y * w + x, x, y, tier,
        ownerId: null, idleQuarters: 0, business: null,
      });
    }
  }
  return plots;
}

export function makeInitialPlayer({ id, name, seat }) {
  const ledger = createLedger();
  post(ledger, {
    playerId: id,
    memo: 'Vốn góp ban đầu',
    category: 'financing',
    lines: [
      { account: 'CASH', dr: CONFIG.startCash },
      { account: 'PAID_IN_CAPITAL', cr: CONFIG.startCash },
    ],
  });
  return {
    id,
    name,
    seat,
    status: 'active',
    balances: ledger.balances,
    loans: [],
    bonds: [],
    shares: { outstanding: CONFIG.startShares, float: 0 },
    rating: 'B',
    distressQuarters: 0,
    taxLossCarry: 0,
    history: [],
  };
}

export function initGameState({ seed, players, totalQuarters }) {
  const nPlayers = players.length;
  const macro = makeInitialMacro(nPlayers);
  const playerMap = {};
  for (const p of players) {
    const ip = makeInitialPlayer(p);
    playerMap[ip.id] = ip;
  }
  const state = {
    quarter: 1,
    totalQuarters,
    nPlayers,
    seed,
    macro,
    plots: makeInitialPlots(),
    players: playerMap,
    listings: [],
    dice: { a: 0, b: 0 },
    bank: { capital: CONFIG.bank.capital0, loans: 0, deposits: 0 },
    investors: { cash: CONFIG.investors.cashPerPlayer * nPlayers, bondsHeld: 0 },
    gov: { cash: 0 },
    finished: false,
    macroHistory: [{ ...macro }],
  };
  return state;
}
