import { z } from 'zod';
import { CONFIG } from './config.js';

export const SECTOR = z.enum(['agri','real_estate','tech','tourism']);
export const RND_RATE = z.enum(['0','0.03','0.06','0.1']);

export const ActionZod = z.discriminatedUnion('type', [
  z.object({ type: z.literal('withdraw'), amount: z.number().int().min(0) }),
  z.object({ type: z.literal('deposit'), amount: z.number().int().min(0) }),
  z.object({ type: z.literal('borrow'), amount: z.number().int().min(CONFIG.loan.minAmount) }),
  z.object({ type: z.literal('repay'), loanId: z.string(), amount: z.number().int().min(0) }),
  z.object({ type: z.literal('setWorkers'), plotId: z.number().int().min(0), workers: z.number().int().min(0) }),
  z.object({ type: z.literal('setReinvest'), plotId: z.number().int().min(0), rate: z.enum([0, 0.03, 0.06, 0.1]) }),
  z.object({ type: z.literal('bid'), plotId: z.number().int().min(0), amount: z.number().int().min(0) }),
  z.object({ type: z.literal('build'), plotId: z.number().int().min(0), sector: SECTOR }),
  z.object({ type: z.literal('upgrade'), plotId: z.number().int().min(0) }),
  z.object({ type: z.literal('convert'), plotId: z.number().int().min(0), sector: SECTOR }),
  z.object({ type: z.literal('sellPlot'), plotId: z.number().int().min(0) }),
  z.object({ type: z.literal('issueBond'), amount: z.number().int().min(CONFIG.bond.minAmount), term: z.enum([4, 8]) }),
  z.object({ type: z.literal('issueShares'), fraction: z.number().gt(0).lte(CONFIG.equity.maxFraction) }),
  z.object({ type: z.literal('claimIdle'), plotId: z.number().int().min(0) }),
]);

export const AP_COST = {
  withdraw: 0, deposit: 0, borrow: 0, repay: 0, setWorkers: 0, setReinvest: 0,
  bid: 1, build: 1, upgrade: 1, convert: 1, sellPlot: 1, issueBond: 1, issueShares: 1, claimIdle: 1, tenderOffer: 1,
};

export function apForAction(type) { return AP_COST[type] ?? 0; }

export const PROCESS_ORDER = ['withdraw','sellPlot','borrow','issueBond','issueShares','bid','claimIdle','tenderOffer','build','upgrade','convert','repay','deposit','setWorkers','setReinvest'];
