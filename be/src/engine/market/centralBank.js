import { CONFIG } from '../config.js';
import { clamp, rnd } from '../money.js';

export function creditRoomNext(policyRateNext, inflationAnnual, bank, nPlayers, eventRoomMult = 1) {
  let stance = 1;
  if (inflationAnnual > 0.08 || policyRateNext > 0.10) stance = 0.6;
  else if (inflationAnnual < 0.01) stance = 1.4;
  const bankHealth = clamp(bank.capital / CONFIG.bank.capital0, 0.4, 1.2);
  return rnd(CONFIG.roomPerPlayer * nPlayers * stance * bankHealth * eventRoomMult);
}
