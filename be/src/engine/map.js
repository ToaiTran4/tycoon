import { CONFIG } from './config.js';
import { rnd, clamp } from './money.js';

export function neighbors(plots, plot) {
  const { w, h } = CONFIG.grid;
  const out = [];
  const { x, y } = plot;
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
    out.push(plots[ny * w + nx]);
  }
  return out;
}

export function landValue(plot, macro, plots) {
  const base = CONFIG.landBase[plot.tier];
  const nb = neighbors(plots, plot).filter(p => p.business && p.business.status === 'operating').length;
  const k = Math.min(0.04 * nb, CONFIG.landNeighborBonus.cap);
  return rnd(base * macro.landIndex * (1 + k));
}

// Returns map: componentRootId -> size
export function clustersByOwnerSector(plots) {
  const { w, h } = CONFIG.grid;
  const visited = new Set();
  const result = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      if (visited.has(id)) continue;
      const p = plots[id];
      const b = p.business;
      if (!b || b.status !== 'operating' || !p.ownerId) { visited.add(id); continue; }
      const key = `${p.ownerId}:${b.sector}`;
      const queue = [id];
      let size = 0;
      const ids = [];
      while (queue.length) {
        const cur = queue.shift();
        if (visited.has(cur)) continue;
        visited.add(cur);
        const cp = plots[cur];
        const cb = cp.business;
        if (!cb || cb.status !== 'operating') continue;
        const ckey = `${cp.ownerId}:${cb.sector}`;
        if (ckey !== key) continue;
        ids.push(cur);
        size++;
        for (const n of neighbors(plots, cp)) {
          if (!visited.has(n.id)) queue.push(n.id);
        }
      }
      if (size > 0) result.push({ ids, ownerId: p.ownerId, sector: b.sector, size });
    }
  }
  return result;
}
