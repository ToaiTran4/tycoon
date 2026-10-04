import { landValue } from './map.js';
import { buildCost } from './business.js';
import { CONFIG } from './config.js';
import { rnd } from './money.js';
import { effectiveNbv } from './bankruptcy.js';

function totalEquity(p) {
  const b = p.balances;
  const assets = (b.CASH || 0) + (b.DEPOSIT || 0) + (b.LAND || 0) + (b.BUILDINGS || 0) + (b.ACC_DEPR || 0) + (b.GOODWILL || 0);
  const liab = -((b.BANK_LOAN || 0) + (b.BONDS_PAYABLE || 0) + (b.TAX_PAYABLE || 0) + (b.ARREARS || 0));
  return assets - liab;
}

function cash(p) { return (p.balances.CASH || 0) + (p.balances.DEPOSIT || 0); }

export const BOTS = {
  passive: (state, pid) => {
    const p = state.players[pid];
    const acts = [];
    const c = p.balances.CASH || 0;
    if (c > 0) acts.push({ type: 'deposit', amount: c });
    return acts;
  },

  conservative: (state, pid) => {
    const p = state.players[pid];
    const acts = [];
    const eq = totalEquity(p);
    const totalCash = cash(p);
    const minCash = eq * 0.15;

    // Quản lý nợ: D/E <= 0.5
    const debt = -((p.balances.BANK_LOAN || 0) + (p.balances.BONDS_PAYABLE || 0));
    if (debt / eq > 0.5 && (p.balances.CASH || 0) > 1000) {
      acts.push({ type: 'repay', amount: Math.min(p.balances.CASH, 1000) });
    }

    // Đất: edge/mid, đa ngành
    if (totalCash > minCash + 2000) {
      for (const l of state.listings) {
        const plot = state.plots.find(pl => pl.id === l.plotId);
        if (!plot || plot.ownerId || plot.tier === 'core') continue;
        if (totalCash >= l.reserve + 500) {
          acts.push({ type: 'bid', plotId: l.plotId, amount: l.reserve + 100 });
          break;
        }
      }
    }

    // Xây dựng: đa dạng ngành
    for (const plot of state.plots) {
      if (plot.ownerId !== pid || plot.business) continue;
      const sectors = Object.keys(CONFIG.sectors);
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const cost = buildCost(sector, 1, state.macro);
      if (totalCash >= cost + minCash) {
        acts.push({ type: 'build', plotId: plot.id, sector });
        break;
      }
    }

    if (p.balances.CASH > 0) acts.push({ type: 'deposit', amount: p.balances.CASH });
    return acts;
  },

  aggressive: (state, pid) => {
    const p = state.players[pid];
    const acts = [];
    const eq = totalEquity(p);
    const totalCash = cash(p);

    // Vay khi cần (tiền mặt thấp hoặc muốn xây dựng)
    if (totalCash < 2000) {
      let col = 0;
      for (const plot of state.plots) {
        if (plot.ownerId !== pid) continue;
        col += landValue(plot, state.macro, state.plots);
        if (plot.business) col += effectiveNbv(plot.business);
      }
      const maxDE = CONFIG.loan.maxDE[p.rating] || 0.3;
      const currentDebt = -((p.balances.BANK_LOAN || 0));
      const allowed = Math.max(0, Math.min(col * CONFIG.loan.collateralRate, eq * maxDE) - currentDebt);
      if (allowed >= CONFIG.loan.minAmount && p.rating !== 'D') {
        acts.push({ type: 'borrow', amount: rnd(allowed * 0.8) }); // Vay 80% hạn mức để an toàn
      }
    }

    // Tập trung một ngành (ví dụ: tech)
    const targetSector = 'tech';
    for (const l of state.listings) {
      const plot = state.plots.find(pl => pl.id === l.plotId);
      if (!plot || plot.ownerId) continue;
      if (totalCash >= l.reserve + 500) {
        acts.push({ type: 'bid', plotId: l.plotId, amount: l.reserve + 500 });
        break;
      }
    }

    for (const plot of state.plots) {
      if (plot.ownerId !== pid) continue;
      if (!plot.business) {
        const cost = buildCost(targetSector, 1, state.macro);
        if (totalCash >= cost + 1000) acts.push({ type: 'build', plotId: plot.id, sector: targetSector });
      } else if (plot.business.status === 'operating' && plot.business.level < 3) {
        const cost = buildCost(plot.business.sector, plot.business.level + 1, state.macro);
        if (totalCash >= cost + 1000) acts.push({ type: 'upgrade', plotId: plot.id });
      }
    }

    return acts;
  },

  balanced: (state, pid) => {
    const p = state.players[pid];
    const acts = [];
    const eq = totalEquity(p);
    const totalCash = cash(p);

    // Quản lý nợ: D/E <= 0.8 (thay vì 1.0)
    const currentDebt = -((p.balances.BANK_LOAN || 0));
    if (currentDebt / eq < 0.6 && p.rating !== 'D' && totalCash < 3000) {
      acts.push({ type: 'borrow', amount: 1000 });
    }

    // Đa dạng hóa
    for (const l of state.listings) {
      const plot = state.plots.find(pl => pl.id === l.plotId);
      if (!plot || plot.ownerId) continue;
      if (totalCash >= l.reserve + 1000) {
        acts.push({ type: 'bid', plotId: l.plotId, amount: l.reserve + 200 });
        break;
      }
    }

    for (const plot of state.plots) {
      if (plot.ownerId !== pid || plot.business) continue;
      const sectors = Object.keys(CONFIG.sectors);
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      const cost = buildCost(sector, 1, state.macro);
      if (totalCash >= cost + 2000) {
        acts.push({ type: 'build', plotId: plot.id, sector });
        break;
      }
    }

    if (p.balances.CASH > 2000) acts.push({ type: 'deposit', amount: p.balances.CASH - 1000 });
    return acts;
  },

  random: (state, pid) => {
    const p = state.players[pid];
    const acts = [];
    const r = Math.random();
    if (r < 0.2) {
      const l = state.listings[Math.floor(Math.random() * state.listings.length)];
      if (l) acts.push({ type: 'bid', plotId: l.plotId, amount: l.reserve + 100 });
    } else if (r < 0.4) {
      const plots = state.plots.filter(pl => pl.ownerId === pid && !pl.business);
      const plot = plots[Math.floor(Math.random() * plots.length)];
      if (plot) acts.push({ type: 'build', plotId: plot.id, sector: 'agri' });
    } else if (r < 0.6) {
      acts.push({ type: 'deposit', amount: 500 });
    }
    return acts;
  }
};
