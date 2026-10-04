const timers = new Map();

export async function boot() {
  try {
    const { prisma } = await import('@tycoon/db');
    const now = new Date();
    const games = await prisma.game.findMany({
      where: { phase: 'action', deadlineAt: { not: null } },
      select: { id: true, code: true, deadlineAt: true },
    });
    for (const g of games) {
      const ms = g.deadlineAt.getTime() - now.getTime();
      if (ms <= 0) {
        resolveSafe(g.code);
      } else {
        schedule(g.id, g.code, ms);
      }
    }
    console.log(`[scheduler] booted, armed ${games.length} deadlines`);
  } catch (e) {
    console.warn('[scheduler] boot skipped (db not ready)', e.message);
  }
}

export function schedule(gameId, code, ms) {
  cancel(gameId);
  const t = setTimeout(() => resolveSafe(code), ms);
  timers.set(gameId, t);
}

export function cancel(gameId) {
  const t = timers.get(gameId);
  if (t) { clearTimeout(t); timers.delete(gameId); }
}

async function resolveSafe(code) {
  try {
    const { resolveNow } = await import('./gameService.js');
    await resolveNow(code);
  } catch (e) {
    console.warn('[scheduler] resolve failed', code, e.message);
  }
}
