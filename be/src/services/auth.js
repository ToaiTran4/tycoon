import crypto from 'node:crypto';

export function newToken() {
  return crypto.randomBytes(32).toString('hex');
}
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[^A-Za-z0-9À-ỹ ]/g, '').trim().slice(0, 20);
}
export async function authPlayer(prisma, code, token) {
  if (!token) return null;
  const game = await prisma.game.findUnique({ where: { code }, select: { id: true } });
  if (!game) return null;
  const h = hashToken(token);
  const p = await prisma.player.findFirst({ where: { gameId: game.id, tokenHash: h } });
  return p || null;
}
