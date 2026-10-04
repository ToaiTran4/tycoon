import { CONFIG } from '../config.js';
import { clamp } from '../money.js';

export function updatePrices(state, sectorInfo) {
  const m = state.macro;
  let inflation = 0;
  for (const s of Object.keys(CONFIG.sectors)) {
    const SECTOR = CONFIG.sectors[s];
    const info = sectorInfo[s];
    const costPush = 0.5 * (SECTOR.cogs * m.commodityGrowth + 0.2 * m.wageGrowth);
    const priceGrowth = clamp(0.002 + 0.30 * Math.log(info.ratio || 1) + costPush, -0.03, 0.04);
    const prevPrice = m.sectors[s].price;
    const price = clamp(prevPrice * (1 + priceGrowth), 0.7, 2.0);
    inflation += SECTOR.weight * priceGrowth;
    m.sectors[s] = {
      ...m.sectors[s],
      npcCap: m.sectors[s].npcCap * (1 + CONFIG.npcTrend),
      demand: info.demand,
      supply: info.supply,
      util: info.util,
      priceGrowth,
      price,
    };
  }
  m.inflation = clamp(inflation, -0.04, 0.08);
  m.cpi = clamp(m.cpi * (1 + m.inflation), 0.5, 3.0);
}
