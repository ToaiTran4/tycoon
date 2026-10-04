import { CONFIG } from '../config.js';
import { rnd } from '../money.js';

export function bankNext(state, { interestIncome, interestPaid, newBadDebt, newLoans, newDeposits }) {
  let capital = state.bank.capital + 300 + Math.round(0.25 * (interestIncome - interestPaid));
  capital -= rnd(newBadDebt || 0);
  return {
    capital: Math.max(0, capital),
    loans: state.bank.loans + rnd(newLoans || 0),
    deposits: state.bank.deposits + rnd(newDeposits || 0),
  };
}
