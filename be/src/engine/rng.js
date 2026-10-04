import seedrandom from 'seedrandom';
import { randomNormal } from 'd3-random';

export function rngFor(seed, purpose, quarter = 0) {
  const prng = seedrandom(`${seed}|${purpose}|${quarter}`);
  const normalSrc = randomNormal.source(prng);
  return {
    next: () => prng(),
    int: (min, max) => Math.floor(prng() * (max - min + 1)) + min,
    normal: (mean = 0, sd = 1) => normalSrc(mean, sd)(),
    pick: (items) => {
      const total = items.reduce((s, it) => s + (it.weight ?? 1), 0);
      let r = prng() * total;
      for (const it of items) {
        r -= (it.weight ?? 1);
        if (r <= 0) return it.value;
      }
      return items[items.length - 1]?.value;
    },
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

export const PURPOSES = Object.freeze({
  dice: 'dice', phase: 'phase', event: 'event', macroNoise: 'macroNoise', ties: 'ties', claims: 'claims',
});
