import { ACCOUNT_GROUPS, isCreditAccount } from './accounts.js';

function groupSum(balances, codes) {
  return codes.reduce((s, c) => s + (balances[c] || 0), 0);
}

export function balancesReport(balances) {
  const assets = groupSum(balances, ['CASH','DEPOSIT','LAND','BUILDINGS','GOODWILL']) + (balances.ACC_DEPR || 0);
  const liabilities = -groupSum(balances, ACCOUNT_GROUPS.liabilities); // because stored as (dr-cr) negative
  const equity = -groupSum(balances, ACCOUNT_GROUPS.equity);
  // For display we return split with credit-nature accounts flipped.
  return {
    assets: {
      CASH: balances.CASH || 0,
      DEPOSIT: balances.DEPOSIT || 0,
      LAND: balances.LAND || 0,
      BUILDINGS: balances.BUILDINGS || 0,
      ACC_DEPR: balances.ACC_DEPR || 0,
      GOODWILL: balances.GOODWILL || 0,
      total: assets,
    },
    liabilities: {
      BANK_LOAN: -(balances.BANK_LOAN || 0),
      BONDS_PAYABLE: -(balances.BONDS_PAYABLE || 0),
      TAX_PAYABLE: -(balances.TAX_PAYABLE || 0),
      ARREARS: -(balances.ARREARS || 0),
      total: liabilities,
    },
    equity: {
      PAID_IN_CAPITAL: -(balances.PAID_IN_CAPITAL || 0),
      RETAINED_EARNINGS: -(balances.RETAINED_EARNINGS || 0),
      total: equity,
    },
    check: assets - liabilities - equity,
  };
}

export function pnl(balances) {
  const income = ACCOUNT_GROUPS.income.reduce((s, c) => s + (balances[c] || 0), 0);
  const expense = ACCOUNT_GROUPS.expense.reduce((s, c) => s + (balances[c] || 0), 0);
  // Income stored with credit sign (negative). PNL = -income + expense (expense is dr-positive)
  // Better: compute via convention.
  return -income + expense; // = net income (credit balances flip: -(-incomeDrCr?) TODO clean)
}

export function closeTemporaryAccounts(ledgerState, playerId) {
  const bal = ledgerState.balances;
  let incomeCr = 0;
  let expenseDr = 0;
  const lines = [];
  for (const c of ACCOUNT_GROUPS.income) {
    const v = bal[c] || 0; // dr-cr, credit balance is negative
    if (v !== 0) {
      // Zero out: reverse sign then post to RE.
      // Income balance: cr => negative. dr = v? To zero: dr = -v (cr part) of RE?
      // bal[c] = dr-cr; income has cr => bal[c] negative. Close: dr Income, cr RE.
      // dr Income with amount = -bal[c] (since bal<0 => -bal>0)
      lines.push({ account: c, dr: -v });
      incomeCr += -v;
    }
  }
  for (const c of ACCOUNT_GROUPS.expense) {
    const v = bal[c] || 0; // dr-cr positive for expense
    if (v !== 0) {
      lines.push({ account: c, cr: v });
      expenseDr += v;
    }
  }
  const net = incomeCr - expenseDr; // retained earnings credit (income)
  if (net > 0) lines.push({ account: 'RETAINED_EARNINGS', cr: net });
  else if (net < 0) lines.push({ account: 'RETAINED_EARNINGS', dr: -net });
  if (lines.length) {
    post(ledgerState, { playerId, memo: 'Đóng sổ cuối quý', category: 'system', lines });
  }
  return { netIncome: net };
}

// Avoid circular: post is re-implemented inline-less
import { post as _post } from './ledger.js';
function post(ls, e) { _post(ls, e); }
