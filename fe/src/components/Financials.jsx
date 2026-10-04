import { fmtMoney, fmtPctQ } from '../lib/format.js';

export default function Financials({ myState }) {
  if (!myState) return null;

  const { balances, rating, history } = myState;
  const lastNetWorth = history?.[history.length - 1]?.netWorth || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <Card label="Tiền mặt" value={fmtMoney(balances.CASH || 0)} />
      <Card label="Tiền gửi" value={fmtMoney(balances.DEPOSIT || 0)} />
      <Card label="Vốn chủ sở hữu" value={fmtMoney(lastNetWorth)} />
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4 items-center justify-center">
          <div className="text-[10px] uppercase font-bold opacity-60">Xếp hạng</div>
          <div className={`text-2xl font-black ${getRatingColor(rating)}`}>{rating}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="text-[10px] uppercase font-bold opacity-60">{label}</div>
        <div className="text-xl font-mono font-bold">{value}</div>
      </div>
    </div>
  );
}

function getRatingColor(rating) {
  const colors = {
    A: 'text-success',
    B: 'text-info',
    C: 'text-warning',
    D: 'text-error'
  };
  return colors[rating] || 'text-base-content';
}
