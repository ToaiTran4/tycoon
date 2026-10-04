import { fmtPctQ } from '../lib/format.js';

export default function Header({ game, macro, dice, conn }) {
  if (!game || !macro) return null;

  return (
    <div className="navbar bg-slate-800 text-slate-100 rounded-xl shadow-2xl mb-4 border-2 border-slate-700 p-2 flex-wrap gap-4">
      <div className="flex-1 flex items-center gap-3 pl-2">
        <div className="bg-yellow-500 p-2 rounded-lg shadow-inner">
          <span className="text-2xl">🏢</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-tighter uppercase italic text-yellow-500">Tycoon Kinh Tế</span>
          <div className="flex gap-2 text-[10px] font-bold opacity-60 uppercase tracking-widest">
            <span>Phòng: {game.code}</span>
            <span>•</span>
            <span className="text-emerald-400">Quý {game.quarter}/{game.totalQuarters}</span>
          </div>
        </div>
      </div>

      <div className="flex-none flex items-center gap-6 pr-2 overflow-x-auto py-2">
        <div className="flex gap-4">
          <Stat label="Lãi suất" value={fmtPctQ(macro.policyRate)} icon="📉" />
          <Stat label="Lạm phát" value={fmtPctQ(macro.inflation)} icon="🎈" color={macro.inflation > 0.08 ? 'text-red-400' : 'text-slate-100'} />
          <Stat label="Tăng trưởng" value={fmtPctQ(macro.growth)} icon="🚀" />
          <Stat label="Niềm tin" value={macro.confidence} icon="🤝" />
        </div>

        {dice && (
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 shadow-inner group">
            <span className="text-[10px] uppercase font-black text-slate-500 group-hover:text-yellow-500 transition-colors">Xúc xắc</span>
            <div className="flex gap-1">
              <Die value={dice.a} />
              <Die value={dice.b} />
            </div>
          </div>
        )}

        <div className={`badge badge-sm font-bold ${conn === 'ws' ? 'badge-success' : 'badge-warning'} gap-1`}>
          <div className={`w-2 h-2 rounded-full ${conn === 'ws' ? 'bg-white animate-pulse' : 'bg-slate-700'}`}></div>
          {conn === 'ws' ? 'LIVE' : 'POLLING'}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color = 'text-slate-100' }) {
  return (
    <div className="flex flex-col items-center min-w-[60px]">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs opacity-50">{icon}</span>
        <span className="text-[9px] uppercase font-black tracking-tighter text-slate-400">{label}</span>
      </div>
      <span className={`font-mono text-sm font-black ${color}`}>{value}</span>
    </div>
  );
}

function Die({ value }) {
  const dots = {
    1: 'justify-center items-center',
    2: 'justify-between',
    3: 'justify-between items-center',
    4: 'justify-between',
    5: 'justify-between items-center',
    6: 'justify-between'
  };

  return (
    <div className="w-8 h-8 bg-white rounded-md shadow-lg flex flex-col p-1.5 relative overflow-hidden group-hover:rotate-12 transition-transform">
      <div className={`flex flex-1 ${dots[value]}`}>
        {value === 1 && <Dot />}
        {value === 2 && <><Dot /><div className="self-end"><Dot /></div></>}
        {value === 3 && <><Dot /><Dot /><div className="self-end"><Dot /></div></>}
        {value === 4 && <><div className="flex flex-col justify-between"><Dot /><Dot /></div><div className="flex flex-col justify-between"><Dot /><Dot /></div></>}
        {value === 5 && <><div className="flex flex-col justify-between"><Dot /><Dot /></div><Dot /><div className="flex flex-col justify-between"><Dot /><Dot /></div></>}
        {value === 6 && <><div className="flex flex-col justify-between"><Dot /><Dot /><Dot /></div><div className="flex flex-col justify-between"><Dot /><Dot /><Dot /></div></>}
      </div>
    </div>
  );
}

function Dot() {
  return <div className="w-1.5 h-1.5 bg-slate-900 rounded-full shadow-sm"></div>;
}
