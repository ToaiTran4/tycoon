import { useEffect, useState } from 'react';
import { fmtPctQ, fmtNumber } from '../lib/format.js';
import { seatColor, CONFIG } from '../lib/config.js';
import {
  Building2, Timer, Radio, Dices, Users, TrendingUp,
  Flag, Zap, Crown
} from 'lucide-react';

function useCountdown(deadlineAt) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!deadlineAt) { setLeft(null); return; }
    const calc = () => {
      const ms = new Date(deadlineAt).getTime() - Date.now();
      setLeft(Math.max(0, Math.ceil(ms / 1000)));
    };
    calc();
    const id = setInterval(calc, 500);
    return () => clearInterval(id);
  }, [deadlineAt]);
  return left;
}

function fmtClock(s) {
  if (s == null) return '∞';
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

export default function Header({ game, macro, dice, conn, players, me, onResolve }) {
  const left = useCountdown(game?.deadlineAt);
  if (!game || !macro) return null;
  const year = Math.ceil(game.quarter / 4);
  const qInYear = ((game.quarter - 1) % 4) + 1;
  const phaseClass = CONFIG.phaseColors[macro.phase] || CONFIG.phaseColors.stable;

  return (
    <header
      className="relative rounded-2xl overflow-hidden border border-slate-700/70 shadow-2xl animate-slide-up"
      style={{
        background:
          'linear-gradient(120deg, rgba(15,23,42,0.95), rgba(30,41,59,0.92) 45%, rgba(120,53,15,0.18) 100%)',
      }}
    >
      {/* Noise / glow accents */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(800px 200px at 20% -40%, rgba(245,158,11,0.18), transparent 60%), radial-gradient(500px 160px at 90% 140%, rgba(59,130,246,0.18), transparent 60%)' }}
      />

      <div className="relative p-3 md:p-4 flex flex-wrap items-center gap-3">
        {/* Brand + quarter info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center shadow-glow-yellow shadow-2xl">
              <Building2 size={26} strokeWidth={2.2} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 grid place-items-center">
              <TrendingUp size={9} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display font-black tracking-tight text-xl md:text-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent leading-tight">
              TYCOON KINH TẾ
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="stat-chip">
                <span className="opacity-50">Phòng</span>
                <span className="font-mono text-amber-300">{game.code}</span>
              </span>
              <span className="stat-chip">
                <Zap size={11} className="text-amber-400" />
                Quý <b className="text-white">Q{qInYear} · Năm {year}</b> / {game.totalQuarters}
              </span>
              <span className={`stat-chip border ${phaseClass}`}>
                {CONFIG.phaseNames[macro.phase] || macro.phase}
              </span>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Macro strip */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
          <MacroStat label="Lãi suất" value={fmtPctQ(macro.policyRate)} />
          <Divider />
          <MacroStat label="Lạm phát" value={fmtPctQ(macro.inflation)} tone={macro.inflation > 0.08 ? 'bad' : 'ok'} />
          <Divider />
          <MacroStat label="Tăng trưởng" value={fmtPctQ(macro.growth)} tone={macro.growth >= 0 ? 'good' : 'bad'} />
          <Divider />
          <MacroStat label="Lương" value={`${fmtNumber(macro.wageIndex)}`} />
          <Divider />
          <MacroStat label="Niềm tin" value={fmtNumber(macro.confidence)} tone={macro.confidence > 65 ? 'good' : macro.confidence < 40 ? 'bad' : 'ok'} />
        </div>

        {/* Dice */}
        {dice && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700/70">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Xúc xắc</span>
            <div className="flex gap-1.5">
              <Die value={dice.a} />
              <Die value={dice.b} />
            </div>
          </div>
        )}

        {/* Countdown */}
        {left != null && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-mono font-bold text-sm
            ${left <= 10 ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 animate-pulse' :
              'bg-slate-900/70 border-slate-700/70 text-slate-200'}`}>
            <Timer size={14} />
            <span className="tabular-nums min-w-[48px] text-center">{fmtClock(left)}</span>
          </div>
        )}

        {/* Conn status */}
        <div className={`badge badge-xs md:badge-sm font-black gap-1.5 px-3 py-2
          ${conn === 'ws' ? 'badge-success' : 'badge-warning'}`}>
          <Radio size={11} className="animate-pulse" />
          {conn === 'ws' ? 'LIVE' : 'POLL'}
        </div>

        {/* Players ready strip */}
        {players && players.length > 0 && (
          <div className="w-full md:w-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700/60 order-last md:order-none">
            <Users size={14} className="text-slate-400" />
            <div className="flex items-center gap-2">
              {players.map(p => {
                const sc = seatColor(p.seat);
                const isMe = me && me.playerId === p.id;
                const isHost = p.id === game.hostPlayerId;
                return (
                  <div key={p.id} className="group relative">
                    <div className={`w-8 h-8 rounded-lg grid place-items-center font-bold text-[10px] shadow-inner
                      ${sc.bg} ${sc.fg} ring-2 transition-all
                      ${meReady(p) ? `${sc.ring} ring-offset-2 ring-offset-slate-900 scale-105` : 'ring-transparent opacity-75'}`}
                      title={`${p.name}${isHost ? ' (Chủ phòng)' : ''} · ${meReady(p) ? 'Sẵn sàng' : 'Chưa sẵn sàng'}`}
                    >
                      {p.name.slice(0,2).toUpperCase()}
                    </div>
                    {isMe && (
                      <div className="absolute -top-1 -left-1 text-[9px]">
                        <Flag size={11} className="text-amber-400 fill-amber-400 drop-shadow" />
                      </div>
                    )}
                    {isHost && (
                      <div className="absolute -top-1 -right-1">
                        <Crown size={11} className="text-yellow-300 drop-shadow" />
                      </div>
                    )}
                    {meReady(p) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Host resolve */}
        {me && me.playerId === game.hostPlayerId && game.status === 'active' && (
          <button
            onClick={onResolve}
            className="btn-game btn btn-sm md:btn-md bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 border-0 shadow-lg shadow-amber-500/20 hover:shadow-glow-yellow"
          >
            ⏭ Chốt quý ngay
          </button>
        )}
      </div>

      {/* Mobile macro strip */}
      <div className="md:hidden px-3 pb-3 grid grid-cols-5 gap-1">
        <MacroStat label="Lãi" value={fmtPctQ(macro.policyRate)} compact />
        <MacroStat label="L.phát" value={fmtPctQ(macro.inflation)} tone={macro.inflation > 0.08 ? 'bad' : 'ok'} compact />
        <MacroStat label="T.trưởng" value={fmtPctQ(macro.growth)} tone={macro.growth >= 0 ? 'good' : 'bad'} compact />
        <MacroStat label="Lương" value={fmtNumber(macro.wageIndex)} compact />
        <MacroStat label="Niềm tin" value={fmtNumber(macro.confidence)} compact />
      </div>
    </header>
  );
}

function meReady(p) {
  // ready from players array OR status-based heuristic
  return !!p.ready || p.status === 'ready' || !!p._ready;
}

function Divider() {
  return <div className="w-px h-6 bg-slate-700/70" />;
}

function MacroStat({ label, value, tone = 'ok', compact }) {
  const cls =
    tone === 'good' ? 'text-emerald-400' :
    tone === 'bad'  ? 'text-rose-400' :
    'text-slate-100';
  return (
    <div className={`flex ${compact ? 'flex-col items-center' : 'flex-col'} min-w-0 px-1.5`}>
      <span className="text-[9px] md:text-[10px] uppercase font-black tracking-wider text-slate-500 whitespace-nowrap">{label}</span>
      <span className={`font-mono font-bold ${cls} ${compact ? 'text-[12px]' : 'text-sm'} tabular-nums`}>{value}</span>
    </div>
  );
}

export function Die({ value = 1 }) {
  const layout = {
    1: [['c','c']],
    2: [['tl','br']],
    3: [['tl','c','br']],
    4: [['tl','tr','bl','br']],
    5: [['tl','tr','c','bl','br']],
    6: [['tl','tr','ml','mr','bl','br']],
  }[value] || [[]];
  return (
    <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-white to-slate-100 shadow-lg shadow-black/40 border border-slate-200 grid-cols-3 grid-rows-3 grid p-1 rotate-[2deg]">
      {['tl','tr','c','bl','br','ml','mr'].map(pos => {
        const on = layout.flat().includes(pos);
        const gridArea =
          pos === 'tl' ? '1 / 1' : pos === 'tr' ? '1 / 3' :
          pos === 'c'  ? '2 / 2' :
          pos === 'ml' ? '2 / 1' : pos === 'mr' ? '2 / 3' :
          pos === 'bl' ? '3 / 1' : '3 / 3';
        return (
          <div key={pos} className="grid place-items-center" style={{ gridArea }}>
            {on && <div className="dice-dot w-2 h-2 bg-slate-900" />}
          </div>
        );
      })}
    </div>
  );
}
