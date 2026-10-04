export const ACCOUNT_GROUPS = Object.freeze({
  assets: ['CASH', 'DEPOSIT', 'LAND', 'BUILDINGS', 'ACC_DEPR', 'GOODWILL'],
  liabilities: ['BANK_LOAN', 'BONDS_PAYABLE', 'TAX_PAYABLE', 'ARREARS'],
  equity: ['PAID_IN_CAPITAL', 'RETAINED_EARNINGS'],
  income: ['REVENUE', 'INTEREST_INCOME', 'REVAL_GAIN', 'BARGAIN_GAIN', 'DISPOSAL_GAIN'],
  expense: ['COGS', 'WAGES', 'MAINTENANCE', 'RND', 'DEPRECIATION', 'INTEREST_EXPENSE', 'TAX_EXPENSE', 'IDLE_LAND_TAX', 'HR_COSTS', 'REVAL_LOSS', 'DISPOSAL_LOSS', 'FEES'],
});

// Balance convention: dr - cr
// For balance sheet reports we flip the sign of credit-nature accounts.
export function isCreditAccount(code) {
  return (
    ACCOUNT_GROUPS.liabilities.includes(code) ||
    ACCOUNT_GROUPS.equity.includes(code) ||
    ACCOUNT_GROUPS.income.includes(code) ||
    code === 'ACC_DEPR'
  );
}
