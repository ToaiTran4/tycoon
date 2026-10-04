import { fmtMoney, fmtPctQ } from '../lib/format.js';

export default function Header({ game, macro, dice, conn }) {
  if (!game || !macro) return null;

  return (
    <div className="navbar bg-base-200 rounded-box shadow-md mb-4 flex-wrap gap-2">
      <div className="flex-1">
        <div className="flex flex-col">
          <span className="text-xl font-bold">Chest Tycoon: {game.code}</span>
          <div className="flex gap-2 text-xs opacity-70">
            <span>Quý {game.quarter}/{game.totalQuarters}</span>
            <span>•</span>
            <span className={conn === 'ws' ? 'text-success' : 'text-warning'}>
              {conn === 'ws' ? 'Realtime' : 'Polling'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-none gap-4 overflow-x-auto py-2">
        <Stat label="Lãi suất" value={fmtPctQ(macro.policyRate)} />
        <Stat label="Lạm phát" value={fmtPctQ(macro.inflation)} color={macro.inflation > 0.08 ? 'text-error' : ''} />
        <Stat label="Tăng trưởng" value={fmtPctQ(macro.growth)} />
        <Stat label="Niềm tin" value={macro.confidence} />
        {dice && (
          <div className="flex items-center gap-1 bg-base-300 px-3 py-1 rounded-lg">
            <span className="text-xs uppercase font-bold opacity-60">Xúc xắc:</span>
            <span className="font-mono text-lg">{dice.a} + {dice.b} = {dice.a + dice.b}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color = '' }) {
  return (
    <div className="flex flex-col items-center px-2">
      <span className="text-[10px] uppercase font-bold opacity-60">{label}</span>
      <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}
