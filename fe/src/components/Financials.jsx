import { fmtMoney } from '../lib/format.js';

export default function Financials({ myState }) {
  if (!myState) return null;

  const { balances, rating, history } = myState;
  const lastNetWorth = history?.[history.length - 1]?.netWorth || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <GameCard 
        label="Tiền mặt" 
        value={fmtMoney(balances.CASH || 0)} 
        icon="💵" 
        color="text-emerald-400"
      />
      <GameCard 
        label="Tiền gửi" 
        value={fmtMoney(balances.DEPOSIT || 0)} 
        icon="🏦" 
        color="text-blue-400"
      />
      <GameCard 
        label="Vốn chủ sở hữu" 
        value={fmtMoney(lastNetWorth)} 
        icon="📈" 
        color="text-indigo-400"
      />
      <div className="relative overflow-hidden card bg-slate-800 border-2 border-slate-700 shadow-xl group hover:border-yellow-500 transition-colors duration-300">
        <div className="card-body p-4 items-center justify-center relative z-10">
          <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Xếp hạng tín dụng</div>
          <div className={`text-4xl font-black italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${getRatingColor(rating)}`}>
            {rating}
          </div>
        </div>
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
          <span className="text-4xl">🎖️</span>
        </div>
      </div>
    </div>
  );
}

function GameCard({ label, value, icon, color }) {
  return (
    <div className="relative overflow-hidden card bg-slate-800 border-2 border-slate-700 shadow-xl group hover:border-slate-500 transition-colors duration-300">
      <div className="card-body p-4 relative z-10">
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{label}</div>
        <div className={`text-xl font-mono font-bold ${color} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>{value}</div>
      </div>
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function getRatingColor(rating) {
  const colors = {
    A: 'text-yellow-400',
    B: 'text-blue-400',
    C: 'text-orange-400',
    D: 'text-red-500'
  };
  return colors[rating] || 'text-slate-200';
}
