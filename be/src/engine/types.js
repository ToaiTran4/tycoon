/**
 * @typedef {'agri'|'real_estate'|'tech'|'tourism'} Sector
 * @typedef {'A'|'B'|'C'|'D'} Rating
 * @typedef {'boom'|'stable'|'recession'} Phase
 * @typedef {'active'|'bankrupt'|'acquired'} PlayerStatus
 *
 * @typedef {Object} Business
 * @property {Sector} sector
 * @property {1|2|3} level
 * @property {'building'|'operating'|'upgrading'|'converting'} status
 * @property {number} readyQuarter
 * @property {1|2|3} [targetLevel]
 * @property {Sector} [targetSector]
 * @property {number} workers
 * @property {number} prevWorkers
 * @property {0|0.03|0.06|0.1} rndRate
 * @property {number} efficiency
 * @property {number} grossCost
 *
 * @typedef {Object} Plot
 * @property {number} id
 * @property {number} x
 * @property {number} y
 * @property {'core'|'mid'|'edge'} tier
 * @property {string|null} ownerId
 * @property {number} idleQuarters
 * @property {Business|null} business
 *
 * @typedef {{ id: string, principal: number, spread: number, originQuarter: number, maturityQuarter: number }} Loan
 * @typedef {{ id: string, principal: number, coupon: number, originQuarter: number, maturityQuarter: number }} Bond
 *
 * @typedef {Object} PlayerState
 * @property {string} id
 * @property {string} name
 * @property {number} seat
 * @property {PlayerStatus} status
 * @property {Object<string, number>} balances
 * @property {Loan[]} loans
 * @property {Bond[]} bonds
 * @property {{ outstanding: number, float: number }} shares
 * @property {Rating} rating
 * @property {number} distressQuarters
 * @property {number} taxLossCarry
 * @property {Array<{ quarter: number, revenue: number, ebit: number, interest: number, netIncome: number, netWorth: number }>} history
 * @property {number} [eliminatedAtQuarter]
 * @property {number} [finalNetWorth]
 *
 * @typedef {Object} SectorSnapshot
 * @property {number} price
 * @property {number} npcCap
 * @property {number} demand
 * @property {number} supply
 * @property {number} util
 * @property {number} priceGrowth
 *
 * @typedef {Object} Macro
 * @property {number} quarter
 * @property {Phase} phase
 * @property {number} phaseAge
 * @property {number} policyRate
 * @property {number} depositRate
 * @property {number} lendingBase
 * @property {number} govYield
 * @property {number} creditRoom
 * @property {number} creditUsed
 * @property {number} inflation
 * @property {number} growth
 * @property {number} unemployment
 * @property {number} confidence
 * @property {number} cpi
 * @property {number} wageIndex
 * @property {number} commodityIndex
 * @property {number} landIndex
 * @property {number} demandIndex
 * @property {number} wageGrowth
 * @property {number} commodityGrowth
 * @property {Object<Sector, SectorSnapshot>} sectors
 * @property {Array<{ id: string, remaining: number }>} activeEvents
 * @property {number} laborForce
 *
 * @typedef {{ plotId: number, reserve: number, source: 'market'|'foreclosure' }} Listing
 *
 * @typedef {Object} GameState
 * @property {number} quarter
 * @property {number} totalQuarters
 * @property {number} nPlayers
 * @property {string} seed
 * @property {Macro} macro
 * @property {Plot[]} plots
 * @property {Object<string, PlayerState>} players
 * @property {Listing[]} listings
 * @property {{ a: number, b: number }} dice
 * @property {{ capital: number, loans: number, deposits: number }} bank
 * @property {{ cash: number, bondsHeld: number }} investors
 * @property {{ cash: number }} gov
 * @property {boolean} finished
 * @property {Array<{ playerId: string, netWorth: number, rank: number, status: PlayerStatus }>} [ranking]
 * @property {Macro[]} macroHistory
 */

export const PLAYER_SEATS_MAX = 6;
export const ACCOUNTS = Object.freeze([
  'CASH','DEPOSIT','LAND','BUILDINGS','ACC_DEPR','GOODWILL',
  'BANK_LOAN','BONDS_PAYABLE','TAX_PAYABLE','ARREARS',
  'PAID_IN_CAPITAL','RETAINED_EARNINGS',
  'REVENUE','INTEREST_INCOME','REVAL_GAIN','BARGAIN_GAIN','DISPOSAL_GAIN',
  'COGS','WAGES','MAINTENANCE','RND','DEPRECIATION','INTEREST_EXPENSE','TAX_EXPENSE','IDLE_LAND_TAX','HR_COSTS','REVAL_LOSS','DISPOSAL_LOSS','FEES',
]);
