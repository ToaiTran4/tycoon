import { describe, it, expect } from 'vitest';
import { landValue, neighbors, clustersByOwnerSector } from '../map.js';
import { initGameState } from '../init.js';

describe('map', () => {
  it('grid 6x6 = 36 ô; ô (2,2) là core, (1,1) là mid, (0,0) là edge', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    expect(s.plots[2 * 6 + 2].tier).toBe('core');
    expect(s.plots[1 * 6 + 1].tier).toBe('mid');
    expect(s.plots[0].tier).toBe('edge');
  });

  it('neighbors: 4 ô trung tâm có 4 láng giềng, ô góc có 2', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    expect(neighbors(s.plots, s.plots[0])).toHaveLength(2);
    expect(neighbors(s.plots, s.plots[2 * 6 + 2])).toHaveLength(4);
  });

  it('landValue ≥ 0 và phụ thuộc tier', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    const vCore = landValue(s.plots[2 * 6 + 2], s.macro, s.plots);
    const vEdge = landValue(s.plots[0], s.macro, s.plots);
    expect(vCore).toBeGreaterThan(vEdge);
    expect(vEdge).toBeGreaterThan(0);
  });

  it('clusters: 2 ô cùng chủ, cùng ngành, liền kề → cùng cụm size 2', () => {
    const s = initGameState({ seed: 'a', totalQuarters: 4, players: [{ id: 'p1', name: 'A', seat: 0 }] });
    s.plots[0].ownerId = 'p1';
    s.plots[0].business = { sector: 'agri', level: 1, status: 'operating', readyQuarter: 1, workers: 5, prevWorkers: 5, rndRate: 0, efficiency: 1, grossCost: 1000 };
    s.plots[1].ownerId = 'p1';
    s.plots[1].business = { sector: 'agri', level: 1, status: 'operating', readyQuarter: 1, workers: 5, prevWorkers: 5, rndRate: 0, efficiency: 1, grossCost: 1000 };
    const c = clustersByOwnerSector(s.plots);
    expect(c.find(x => x.ownerId === 'p1' && x.sector === 'agri').size).toBe(2);
  });
});
