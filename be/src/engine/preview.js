import { validateActionsForPlayer } from './validate.js';

export function previewActions(state, playerId, actions) {
  const { warnings, errors, apLeft } = validateActionsForPlayer(state, playerId, actions);
  const me = state.players[playerId];
  const cashAfter = me ? me.balances.CASH ?? 0 : null;
  return { cashAfter, warnings: [...warnings, ...errors], apLeft };
}
