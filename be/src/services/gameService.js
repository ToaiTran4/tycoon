import { prisma } from '@tycoon/db';
import { publish } from './realtime.js';
import { schedule, cancel } from './scheduler.js';
import { initGameState } from '../engine/init.js';
import { resolveQuarter } from '../engine/resolve.js';
import { hashToken, newToken } from './auth.js';
import { CONFIG } from '../engine/config.js';

async function bumpVersion(tx, gameId, inc = 1) {
  return (await tx.game.update({ where: { id: gameId }, data: { version: { increment: inc } }, select: { version: true } })).version;
}

async function lockGame(tx, id) {
  try {
    await tx.$queryRawUnsafe(`SELECT id FROM "Game" WHERE id = $1 FOR UPDATE`, id);
  } catch (e) {
    // Fallback for DBs that don't support FOR UPDATE (like SQLite during local dev)
    console.warn('[gameService] lockGame failed, continuing without lock', e.message);
  }
}

export async function createGame({ hostName, totalQuarters = 20, quarterSeconds = 0 }) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = newToken();
  const tokenHash = hashToken(token);
  const seed = Math.random().toString(36).substring(2, 10);

  const game = await prisma.game.create({
    data: {
      code,
      totalQuarters,
      quarterSeconds,
      seed,
      status: 'lobby',
      phase: 'lobby',
      players: {
        create: {
          name: hostName,
          tokenHash,
          seat: 0,
          status: 'active',
          ready: false
        }
      }
    },
    include: { players: true }
  });

  await prisma.game.update({
    where: { id: game.id },
    data: { hostPlayerId: game.players[0].id }
  });

  return { ok: true, code, token, playerId: game.players[0].id };
}

export async function joinGame(code, name) {
  return await prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { code },
      include: { players: true }
    });

    if (!game) return { ok: false, error: 'game_not_found' };
    if (game.status !== 'lobby') return { ok: false, error: 'game_started' };
    if (game.players.length >= CONFIG.players.max) return { ok: false, error: 'game_full' };
    if (game.players.find(p => p.name === name)) return { ok: false, error: 'name_taken' };

    const token = newToken();
    const tokenHash = hashToken(token);
    const seat = game.players.length;

    const player = await tx.player.create({
      data: {
        gameId: game.id,
        name,
        tokenHash,
        seat
      }
    });

    await bumpVersion(tx, game.id);
    publish(code, 'player_joined', { name, seat });

    return { ok: true, code, token, playerId: player.id };
  });
}

export async function startGame(code, hostId) {
  return await prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { code },
      include: { players: true }
    });

    if (!game) return { ok: false, error: 'game_not_found' };
    if (game.hostPlayerId !== hostId) return { ok: false, error: 'not_host' };
    if (game.players.length < CONFIG.players.min) return { ok: false, error: 'not_enough_players' };

    const state = initGameState({
      seed: game.seed,
      totalQuarters: game.totalQuarters,
      players: game.players.map(p => ({ id: p.id, name: p.name, seat: p.seat }))
    });

    await tx.game.update({
      where: { id: game.id },
      data: {
        status: 'active',
        phase: 'action',
        quarter: 1,
        state: state,
        deadlineAt: game.quarterSeconds > 0 ? new Date(Date.now() + game.quarterSeconds * 1000) : null
      }
    });

    if (game.quarterSeconds > 0) {
      schedule(game.id, code, game.quarterSeconds * 1000);
    }

    await bumpVersion(tx, game.id);
    publish(code, 'game_started', {});

    return { ok: true };
  });
}

export async function updatePending(code, playerId, actions) {
  await prisma.player.update({
    where: { id: playerId },
    data: { pending: actions }
  });
  return { ok: true };
}

export async function setReady(code, playerId, ready) {
  const player = await prisma.player.update({
    where: { id: playerId },
    data: { ready }
  });

  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true }
  });

  if (game.players.every(p => p.ready || p.status !== 'active')) {
    // Auto resolve if all ready
    resolveNow(code).catch(console.error);
  }

  await prisma.game.update({ where: { id: game.id }, data: { version: { increment: 1 } } });
  publish(code, 'player_ready', { playerId, ready });
  return { ok: true };
}

export async function resolveNow(code) {
  return await prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { code },
      include: { players: true }
    });

    if (!game || game.status !== 'active') return null;
    await lockGame(tx, game.id);

    const actions = {};
    for (const p of game.players) {
      actions[p.id] = p.pending;
    }

    const result = resolveQuarter(game.state, actions);
    const newState = result.state;

    // Reset players ready/pending
    await tx.player.updateMany({
      where: { gameId: game.id },
      data: { ready: false, pending: [] }
    });

    // Save reports
    const q = game.quarter;
    await tx.marketReport.create({
      data: { gameId: game.id, quarter: q, data: result.market }
    });

    for (const pid of Object.keys(result.reports)) {
      await tx.quarterReport.create({
        data: { gameId: game.id, quarter: q, playerId: pid, data: result.reports[pid] }
      });
    }

    // Save ledger entries
    if (result.ledgerEntries) {
      for (let i = 0; i < result.ledgerEntries.length; i++) {
        const entry = result.ledgerEntries[i];
        await tx.ledgerEntry.create({
          data: {
            gameId: game.id,
            playerId: entry.playerId,
            quarter: q,
            seq: i,
            memo: entry.memo,
            category: entry.category,
            lines: entry.lines
          }
        });
      }
    }

    const finished = newState.finished;
    const nextDeadline = (!finished && game.quarterSeconds > 0) ? new Date(Date.now() + game.quarterSeconds * 1000) : null;

    await tx.game.update({
      where: { id: game.id },
      data: {
        quarter: newState.quarter,
        status: finished ? 'finished' : 'active',
        state: newState,
        deadlineAt: nextDeadline,
        version: { increment: 1 }
      }
    });

    if (nextDeadline) {
      schedule(game.id, code, game.quarterSeconds * 1000);
    } else {
      cancel(game.id);
    }

    publish(code, 'quarter_resolved', { quarter: newState.quarter });
    return newState;
  }, { timeout: 10000 });
}

export function buildView(game, me, players, state) {
  if (!game) return { version: game?.version || 0, now: Date.now(), game: null };

  // Lobby view: game exists but engine hasn't initialized state yet
  if (!state && game.status === 'lobby') {
    const dbPlayersMap = new Map((players || []).map(p => [p.id, p]));
    const dbPs = players || [];
    return {
      version: game.version ?? 0,
      now: Date.now(),
      game: {
        code: game.code,
        status: 'lobby',
        phase: game.phase || 'lobby',
        quarter: 0,
        totalQuarters: game.totalQuarters,
        deadlineAt: game.deadlineAt || null,
        hostPlayerId: game.hostPlayerId,
        quarterSeconds: game.quarterSeconds || 0
      },
      me: me ? { playerId: me.id, seat: me.seat, name: me.name, ready: me.ready || false } : null,
      players: dbPs.map(p => ({
        id: p.id,
        name: p.name,
        seat: p.seat,
        status: p.status || 'active',
        rating: null,
        ready: p.ready || false,
        netWorth: CONFIG.startCash
      })),
      macro: null,
      macroHistory: [],
      dice: null,
      listings: [],
      activeEvents: [],
      plots: [],
      myState: null,
      myPending: [],
      myApLeft: 0,
      finished: false,
      ranking: []
    };
  }

  if (!state) return { version: game.version || 0, now: Date.now(), game: null };
  const dbPlayersMap = new Map((players || []).map(p => [p.id, p]));

  return {
    version: game.version,
    now: Date.now(),
    game: {
      code: game.code,
      status: game.status,
      phase: game.phase,
      quarter: game.quarter,
      totalQuarters: game.totalQuarters,
      deadlineAt: game.deadlineAt,
      hostPlayerId: game.hostPlayerId,
      quarterSeconds: game.quarterSeconds || 0
    },
    me: me ? { playerId: me.id, seat: me.seat, name: me.name, ready: me.ready } : null,
    players: Object.values(state.players).map(p => {
      const dbp = dbPlayersMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        seat: p.seat,
        status: p.status,
        rating: p.rating,
        ready: dbp?.ready || false,
        netWorth: p.history[p.history.length - 1]?.netWorth || CONFIG.startCash
      };
    }),
    macro: state.macro,
    macroHistory: state.macroHistory,
    dice: state.dice,
    listings: state.listings,
    activeEvents: state.macro.activeEvents,
    plots: state.plots,
    myState: me ? state.players[me.id] : null,
    myPending: Array.isArray(me?.pending) ? me.pending : [],
    myApLeft: me ? CONFIG.actionPoints - (Array.isArray(me.pending) ? me.pending.length : 0) : 0,
    finished: state.finished,
    ranking: state.ranking
  };
}
