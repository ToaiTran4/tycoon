import { describe, expect, it } from 'vitest';
import { initGameState } from '../init.js';
import { BOTS } from '../bots.js';
import { validateActionsForPlayer } from '../validate.js';

const strategies = Object.keys(BOTS);

describe('bot strategies', () => {
  it.each(strategies)('%s returns validator-safe actions', (strategy) => {
    const state = initGameState({
      seed: `bot_${strategy}`,
      totalQuarters: 12,
      players: [{ id: 'bot-1', name: 'Bot', seat: 0 }],
    });

    const actions = BOTS[strategy](state, 'bot-1');
    const result = validateActionsForPlayer(state, 'bot-1', actions);

    expect(Array.isArray(actions)).toBe(true);
    expect(result.ok).toBe(true);
    expect(actions.length).toBeLessThanOrEqual(3);
  });
});
