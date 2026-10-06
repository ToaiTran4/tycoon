import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@tycoon/db';
import * as gameService from '../services/gameService.js';
import { authPlayer } from '../services/auth.js';
import { previewActions } from '../engine/preview.js';
import { validateActionsForPlayer } from '../engine/validate.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, t: Date.now() });
});

const GameCreateSchema = z.object({
  hostName: z.string().min(2).max(20),
  avatar: z.enum(['male', 'female']).optional().default('male'),
  mode: z.enum(['standard', 'practice']).optional().default('standard'),
  botCount: z.number().int().min(1).max(5).optional().default(2),
  botType: z.enum(['passive', 'conservative', 'balanced', 'aggressive', 'random']).optional().default('balanced'),
  totalQuarters: z.number().int().min(4).max(60).optional().default(20),
  quarterSeconds: z.number().int().min(0).max(3600).optional().default(0),
});

const JoinSchema = z.object({ name: z.string().min(2).max(20), avatar: z.enum(['male', 'female']).optional().default('male') });
const ActionsSchema = z.object({ actions: z.array(z.any()) });
const PreviewSchema = z.object({ actions: z.array(z.any()) });
const ReadySchema = z.object({ ready: z.boolean() });


function err(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

async function requireAuth(req, res) {
  const token = req.headers['x-player-token'];
  if (!token) { err(res, 401, 'NO_TOKEN', 'Thiếu x-player-token'); return null; }
  const player = await authPlayer(prisma, req.params.code, token);
  if (!player) { err(res, 403, 'FORBIDDEN', 'Token không hợp lệ hoặc không thuộc game này'); return null; }
  return player;
}

apiRouter.post('/games', async (req, res) => {
  try {
    const body = GameCreateSchema.parse(req.body);
    const result = await gameService.createGame(body);
    return res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) return err(res, 400, 'INVALID', e.errors[0].message);
    return err(res, 500, 'INTERNAL', e.message);
  }
});

apiRouter.post('/games/:code/join', async (req, res) => {
  try {
    const { name, avatar } = JoinSchema.parse(req.body);
    const result = await gameService.joinGame(req.params.code, name, avatar);
    if (!result.ok) return err(res, 400, result.error.toUpperCase(), result.error);
    return res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) return err(res, 400, 'INVALID', e.errors[0].message);
    return err(res, 500, 'INTERNAL', e.message);
  }
});

apiRouter.get('/games/:code', async (req, res) => {
  const token = req.headers['x-player-token'];
  const game = await prisma.game.findUnique({
    where: { code: req.params.code },
    include: { players: true }
  });

  if (!game) return err(res, 404, 'NOT_FOUND', 'Không tìm thấy game');

  let me = null;
  if (token) {
    me = await authPlayer(prisma, req.params.code, token);
  }

  const view = gameService.buildView(game, me, game.players, game.state);
  res.json(view);
});

apiRouter.put('/games/:code/actions', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  try {
    const { actions } = ActionsSchema.parse(req.body);
    const game = await prisma.game.findUnique({ where: { code: req.params.code } });
    if (!game || game.status !== 'active') return err(res, 400, 'NOT_ACTIVE', 'Game chưa bắt đầu hoặc đã kết thúc');

    const v = validateActionsForPlayer(game.state, me.id, actions);
    if (!v.ok) return err(res, 400, 'INVALID_ACTIONS', v.error);

    await gameService.updatePending(req.params.code, me.id, actions);
    return res.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return err(res, 400, 'INVALID', e.errors[0].message);
    return err(res, 500, 'INTERNAL', e.message);
  }
});

apiRouter.post('/games/:code/preview', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  try {
    const { actions } = PreviewSchema.parse(req.body);
    const game = await prisma.game.findUnique({ where: { code: req.params.code } });
    if (!game || game.status !== 'active') return err(res, 400, 'NOT_ACTIVE', 'Game chưa bắt đầu');

    const result = previewActions(game.state, me.id, actions);
    return res.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) return err(res, 400, 'INVALID', e.errors[0].message);
    return err(res, 500, 'INTERNAL', e.message);
  }
});

apiRouter.post('/games/:code/start', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  const result = await gameService.startGame(req.params.code, me.id);
  if (!result.ok) return err(res, 400, result.error.toUpperCase(), result.error);
  return res.json({ ok: true });
});

apiRouter.post('/games/:code/ready', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  try {
    const { ready } = ReadySchema.parse(req.body);
    await gameService.setReady(req.params.code, me.id, ready);
    return res.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return err(res, 400, 'INVALID', e.errors[0].message);
    return err(res, 500, 'INTERNAL', e.message);
  }
});

apiRouter.post('/games/:code/resolve', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  const game = await prisma.game.findUnique({ where: { code: req.params.code } });
  if (game.hostPlayerId !== me.id) return err(res, 403, 'NOT_HOST', 'Chỉ chủ phòng mới có thể chốt quý thủ công');

  const newState = await gameService.resolveNow(req.params.code);
  if (!newState) return err(res, 400, 'FAILED', 'Không thể chốt quý');

  return res.json({ ok: true });
});

apiRouter.get('/games/:code/ledger', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  const entries = await prisma.ledgerEntry.findMany({
    where: { gameId: me.gameId, playerId: me.id },
    orderBy: [{ quarter: 'desc' }, { seq: 'asc' }]
  });

  res.json({ entries });
});

apiRouter.get('/games/:code/reports/:quarter', async (req, res) => {
  const me = await requireAuth(req, res);
  if (!me) return;

  const q = parseInt(req.params.quarter);
  const market = await prisma.marketReport.findUnique({
    where: { gameId_quarter: { gameId: me.gameId, quarter: q } }
  });
  const playerReport = await prisma.quarterReport.findUnique({
    where: { gameId_quarter_playerId: { gameId: me.gameId, quarter: q, playerId: me.id } }
  });

  res.json({ market: market?.data || null, report: playerReport?.data || null });
});
