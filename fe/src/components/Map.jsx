import { CONFIG, seatColor } from '../lib/config.js';
import { fmtMoney, fmtNumber } from '../lib/format.js';
import { Hammer, Leaf, Building2, Code2, Waves, AlertTriangle, Star } from 'lucide-react';
import { ChibiAvatar } from './ChibiAvatar.jsx';

const SECTOR_META = {
  agri:        { icon: <Leaf size={16} />,      cls: 'sector-agri' },
  real_estate: { icon: <Building2 size={16} />, cls: 'sector-real_estate' },
  tech:        { icon: <Code2 size={16} />,     cls: 'sector-tech' },
  tourism:     { icon: <Waves size={16} />,     cls: 'sector-tourism' },
};

export default function GameMap({ plots, players, listings, onPlotClick, selectedPlotId, myId }) {
  if (!plots) return null;

  const byXY = new globalThis.Map();
  plots.forEach(p => byXY.set(`${p.x},${p.y}`, p));
  const w = CONFIG.grid.w, h = CONFIG.grid.h;

  return (
    <div className="relative">
      {/* Title strip */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="game-card-title !text-[11px]">
          <span className="text-amber-400">🎯</span> BẢN ĐỒ THÀNH PHỐ
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600/70" />Trung tâm</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500/70" />Nửa vòng</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700/70" />Vành ngoài</span>
        </div>
      </div>

      {/* City board with player avatars facing inward */}
      <div className="city-stage">
        <AvatarRail players={players?.slice(0, 3)} side="left" myId={myId} />
        <div className="board-frame rounded-2xl p-3 md:p-5 relative flex-1 min-w-0">
        {/* Inner city feel layer */}
        <div className="absolute inset-3 md:inset-5 rounded-xl pointer-events-none"
          style={{
            background:
              'radial-gradient(500px 250px at 50% 50%, rgba(251,191,36,0.06), transparent 60%),' +
              'repeating-linear-gradient(0deg, rgba(71,85,105,0.06) 0 1px, transparent 1px 40px),' +
              'repeating-linear-gradient(90deg, rgba(71,85,105,0.06) 0 1px, transparent 1px 40px)',
          }}
        />
        {/* Street/grid */}
        <div className="relative z-10 grid gap-2 md:gap-3"
          style={{ gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: h }).map((_, y) =>
            Array.from({ length: w }).map((__, x) => {
              const plot = byXY.get(`${x},${y}`);
              return plot
                ? <PlotCell key={plot.id} plot={plot} players={players} listings={listings}
                            onClick={() => onPlotClick(plot)} selected={selectedPlotId === plot.id} myId={myId} />
                : <div key={`empty-${x}-${y}`} />;
            })
          )}
        </div>
        </div>
        <AvatarRail players={players?.slice(3, 6)} side="right" myId={myId} />
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] justify-center">
        {Object.entries(SECTOR_META).map(([k, m]) => (
          <div key={k} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${m.cls}`}>
            {m.icon} <span className="font-bold">{CONFIG.sectors[k].name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvatarRail({ players = [], side, myId }) {
  if (!players.length) return null;
  return (
    <div className={`city-avatar-rail city-avatar-rail-${side}`}>
      {players.map(player => (
        <div key={player.id} className={`city-avatar ${player.id === myId ? 'city-avatar-current' : ''}`}>
          <ChibiAvatar gender={player.avatar} size="sm" />
          <span className="city-avatar-name">{player.name}</span>
        </div>
      ))}
    </div>
  );
}

function PlotCell({ plot, players, listings, onClick, selected, myId }) {
  const owner = players?.find(p => p.id === plot.ownerId);
  const isMine = owner?.id === myId;
  const listing = listings?.find(l => l.plotId === plot.id);
  const sc = owner ? seatColor(owner.seat) : null;
  const b = plot.business;
  const sectorCls = b ? SECTOR_META[b.sector]?.cls || '' : '';
  const tierBg =
    plot.tier === 'core' ? 'tier-core' :
    plot.tier === 'mid'  ? 'tier-mid'  : 'tier-edge';
  const idle = (plot.idleQuarters || 0) >= CONFIG.idle.claimAfter;

  return (
    <button
      onClick={onClick}
      className={`
        plot-tile aspect-square group p-1
        ${sectorCls || tierBg}
        ${selected ? 'ring-4 ring-amber-400 -translate-y-1 shadow-[0_10px_25px_rgba(0,0,0,0.5),0_0_30px_rgba(251,191,36,0.3)] scale-[1.03] z-20' : 'hover:scale-[1.04] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.45)] z-10'}
        ${owner ? 'border-opacity-90' : 'border-slate-700/70 border-dashed'}
      `}
      style={{
        // Ring color per owner
        boxShadow: owner && !selected
          ? `inset 0 0 0 2px rgba(255,255,255,0.04), inset 0 0 0 0px`
          : undefined
      }}
    >
      {/* Tier ribbon */}
      <span className={`tier-ribbon
        ${plot.tier === 'core' ? 'bg-amber-500/30 text-amber-100' :
          plot.tier === 'mid' ? 'bg-slate-500/30 text-slate-200' :
                                'bg-slate-600/30 text-slate-300'}`}>
        {plot.tier === 'core' ? '★' : plot.tier === 'mid' ? '◆' : '·'}
      </span>

      {/* Owner seat color */}
      {owner && (
        <span className={`absolute top-0.5 right-0.5 badge-seat ${sc.bg} ${sc.fg} !w-5 !h-5 !text-[9px] shadow-lg`}>
          {owner.name.slice(0,1).toUpperCase()}
        </span>
      )}

      {/* Idle / claimable */}
      {idle && !isMine && (
        <span className="absolute top-0.5 left-0.5 text-[9px] animate-pulse">
          <AlertTriangle size={11} className="text-rose-400 drop-shadow" />
        </span>
      )}

      {/* For sale badge */}
      {listing && (
        <span className={`absolute bottom-0 inset-x-0 text-center text-[8px] font-black uppercase py-0.5
          ${listing.source === 'foreclosure' ? 'bg-rose-500/85 text-white' : 'bg-amber-500/85 text-amber-950'}`}>
          {listing.source === 'foreclosure' ? 'Thanh lý' : 'Rao bán'}
        </span>
      )}

      {/* Main content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center z-10 mt-1">
        {b ? (
          <div className="flex flex-col items-center transition-transform group-hover:scale-110">
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg grid place-items-center shadow-lg
              ${b.status === 'construction' ? 'bg-slate-800 border border-slate-600' :
                b.status === 'upgrading'  ? 'bg-amber-700/30 border border-amber-500/50 animate-pulse' :
                b.status === 'converting' ? 'bg-violet-700/30 border border-violet-500/50 animate-pulse' :
                                              'bg-white/10 border border-white/15 backdrop-blur-sm'}
            `}>
              {b.status === 'construction'
                ? <Hammer size={16} className="text-slate-300" />
                : SECTOR_META[b.sector]?.icon}
            </div>
            {/* Stars level */}
            <div className="flex gap-0.5 mt-1">
              {[1,2,3].map(i => (
                <Star key={i} size={8}
                  fill={i <= b.level ? '#fbbf24' : 'none'}
                  stroke={i <= b.level ? '#fbbf24' : 'rgba(148,163,184,0.6)'}
                />
              ))}
            </div>
            {/* Workers micro dot */}
            {b.workers != null && (
              <div className="text-[8px] text-slate-300/80 mt-0.5">
                👷 {b.workers}/{CONFIG.levels.workers[b.level-1] || 5}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-50 group-hover:opacity-90 transition-opacity">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-dashed border-slate-400/40 grid place-items-center">
              <span className="text-lg md:text-xl">🏗️</span>
            </div>
            <div className="text-[9px] uppercase font-black mt-0.5 tracking-wider text-slate-300">
              {CONFIG.tierNames[plot.tier]}
            </div>
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-slate-900/95 backdrop-blur border border-slate-600 rounded-lg px-2.5 py-1.5
                        shadow-2xl whitespace-nowrap text-[11px] min-w-[140px] max-w-[200px]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-slate-100">Ô #{plot.id}</span>
            <span className="text-slate-400">{CONFIG.tierNames[plot.tier]}</span>
          </div>
          <div className="text-sky-300 mb-1">Vị trí: ({plot.x}, {plot.y})</div>
          <div className="text-slate-300 mb-1">
            Chủ sở hữu: {owner ? <span className="font-bold">{owner.name}</span> : <em>Chưa có</em>}
          </div>
          {plot.landValue != null && (
            <div className="text-amber-300 font-mono">Giá đất: {fmtMoney(plot.landValue)}</div>
          )}
          {plot.idleQuarters > 0 && (
            <div className={`text-xs mt-1 ${idle ? 'text-rose-300' : 'text-slate-400'}`}>
              ⚠ Bỏ trống {plot.idleQuarters} quý{idle && ' (có thể mua lại)'}
            </div>
          )}
          {b && (
            <div className="mt-1 pt-1 border-t border-slate-700 text-slate-200 space-y-0.5">
              <div>🏭 {CONFIG.sectors[b.sector]?.name} cấp {b.level}</div>
              <div>🔧 Trạng thái: {statusLabel(b.status)}</div>
              <div>🛠 Hiệu quả: {fmtNumber((b.efficiency||0)*100)}%</div>
            </div>
          )}
          {listing && (
            <div className="mt-1 pt-1 border-t border-slate-700 text-amber-300 font-bold">
              💲 {listing.source === 'foreclosure' ? 'Thanh lý' : 'Rao'}: {fmtMoney(listing.reserve)}
            </div>
          )}
        </div>
        <div className="w-3 h-3 rotate-45 bg-slate-900/95 border-r border-b border-slate-600
                        absolute left-1/2 -translate-x-1/2 -translate-y-1.5" />
      </div>
    </button>
  );
}

function statusLabel(s) {
  switch (s) {
    case 'operating':    return <span className="text-emerald-300">Vận hành</span>;
    case 'construction': return <span className="text-sky-300">Đang xây</span>;
    case 'upgrading':    return <span className="text-amber-300">Nâng cấp</span>;
    case 'converting':   return <span className="text-violet-300">Đổi ngành</span>;
    default: return s;
  }
}
