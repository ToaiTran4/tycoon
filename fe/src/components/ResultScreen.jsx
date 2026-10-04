import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { fmtMoney } from '../lib/format.js';
import { CONFIG, seatColor } from '../lib/config.js';
import {
  Trophy, Crown, Star, Sparkles, Award, Medal,
  Calendar, ArrowLeft, RotateCcw, Share2, PartyPopper
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResultScreen({ code, ranking, players, totalQuarters, onHome }) {
  const sorted = useMemo(() => {
    if (ranking && ranking.length > 0) {
      return ranking
        .map(r => ({ ...r, ...(players?.find(p => p.id === r.playerId) || {}) }))
        .sort((a, b) => (b.netWorth ?? b.finalNetWorth ?? 0) - (a.netWorth ?? a.finalNetWorth ?? 0))
        .map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return (players || [])
      .map(p => ({ ...p, netWorth: p.netWorth ?? p.finalNetWorth ?? 0 }))
      .sort((a, b) => b.netWorth - a.netWorth)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [ranking, players]);

  const winner = sorted[0];
  const historyData = useMemo(() => buildNetWorthSeries(sorted), [sorted]);
  const moments = useMemo(() => pickMoments(sorted, totalQuarters), [sorted, totalQuarters]);

  return (
    <div className="min-h-screen py-6 px-3 flex flex-col items-center">
      {/* Confetti feel */}
      <div className="fixed inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(400px 200px at 10% 20%, rgba(251,191,36,0.12), transparent 60%),' +
            'radial-gradient(400px 200px at 90% 20%, rgba(59,130,246,0.12), transparent 60%),' +
            'radial-gradient(400px 300px at 50% 90%, rgba(16,185,129,0.10), transparent 60%)',
        }}
      />

      <div className="w-full max-w-5xl space-y-5 relative z-10">
        {/* Trophy header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="game-card overflow-hidden relative"
        >
          <div className="absolute inset-0 pointer-events-none opacity-40"
            style={{ background:
              'radial-gradient(600px 200px at 50% -40%, rgba(251,191,36,0.35), transparent 60%)' }} />
          <div className="relative p-5 md:p-6 text-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 120 }}
              className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-glow-yellow mb-3 relative"
            >
              <Trophy size={44} className="text-amber-950" strokeWidth={2.2} />
              <PartyPopper size={22} className="absolute -top-2 -right-2 text-emerald-300 rotate-12 drop-shadow" />
            </motion.div>
            <div className="font-display text-2xl md:text-3xl font-black tracking-tight uppercase">
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Trận chiến kinh tế đã kết thúc!
              </span>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {totalQuarters} quý • {players?.length || 0} nhà kinh tế đầu tư
            </div>

            {/* Winner announcement */}
            {winner && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-5 inline-flex items-center gap-4 px-5 py-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 shadow-glow-yellow shadow-lg"
              >
                {(() => {
                  const sc = seatColor(winner.seat ?? 0);
                  return (
                    <>
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl grid place-items-center font-black text-2xl ring-4 ring-offset-2 ring-offset-slate-900 shadow-inner ${sc.bg} ${sc.fg} ${sc.ring}`}>
                        {winner.name?.slice(0,2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <Crown size={18} className="text-yellow-300" />
                          <span className="text-[10px] uppercase font-black tracking-widest text-amber-300">Người chiến thắng</span>
                        </div>
                        <div className="font-black text-xl md:text-2xl text-slate-100 leading-tight">
                          {winner.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] uppercase text-slate-400 font-bold tracking-wider">Tổng tài sản:</span>
                          <span className="font-mono font-black text-amber-300 text-lg tabular-nums drop-shadow">
                            {fmtMoney(winner.netWorth ?? winner.finalNetWorth ?? 0)}
                          </span>
                        </div>
                      </div>
                      <Sparkles size={28} className="text-amber-400 animate-float" />
                    </>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Podium + chart */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="md:col-span-2 game-card p-4">
            <div className="game-card-title mb-3">
              <Award size={14} className="text-amber-400" /> BẢNG XẾP HẠNG
            </div>
            <FinalPodium list={sorted} />
            <div className="mt-4 space-y-1.5">
              {sorted.map((p, i) => (
                <motion.div
                  key={p.id || p.playerId || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-lg bg-slate-900/60 border border-slate-700/70 px-3 py-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className={`w-8 h-8 grid place-items-center rounded-md font-black text-sm
                    ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 shadow-glow-yellow' :
                      i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' :
                      i === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-orange-50' :
                                'bg-slate-800 text-slate-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200 truncate">
                      {p.name}
                      {i === 0 && <Crown size={12} className="inline ml-1 text-amber-300 -mt-0.5" />}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Trạng thái: {p.status === 'active' ? 'Hoàn thành' : p.status === 'bankrupt' ? 'Phá sản' : 'Bị loại'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black tabular-nums text-amber-300">
                      {fmtMoney(p.netWorth ?? p.finalNetWorth ?? 0)}
                    </div>
                    <div className={`badge badge-xs mt-1 font-bold ${p.rating === 'A' ? 'badge-warning' : p.rating === 'B' ? 'badge-info' : p.rating === 'C' ? 'badge' : 'badge-error'}`}>
                      Hạng {p.rating || '?'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="md:col-span-3 game-card p-4 flex flex-col">
            <div className="game-card-title mb-3">
              <Star size={14} className="text-amber-400" /> BIỂU ĐỒ TÀI SẢN RỒNG
            </div>
            <div className="h-64 md:h-72 w-full">
              {historyData.length > 1 ? (
                <ResponsiveContainer>
                  <AreaChart data={historyData} margin={{ top: 5, right: 15, bottom: 5, left: -10 }}>
                    <defs>
                      {sorted.map((p, i) => (
                        <linearGradient key={i} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={seatColors(p.seat ?? i)} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={seatColors(p.seat ?? i)} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="q" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(1)}t`} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
                      formatter={(v, n) => [fmtMoney(v), n]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }}
                      formatter={(v) => <span className="text-slate-200">{String(v).split(':').slice(1).join(':') || v}</span>}
                    />
                    {sorted.map((p, i) => (
                      <Area
                        key={p.id || p.playerId || i}
                        type="monotone"
                        dataKey={`${p.seat ?? i}:${p.name}`}
                        name={`${p.seat ?? i}:${p.name}`}
                        stroke={seatColors(p.seat ?? i)}
                        strokeWidth={2.2}
                        fill={`url(#g${i})`}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center italic text-slate-500 text-xs">
                  Không đủ dữ liệu lịch sử để vẽ biểu đồ
                </div>
              )}
            </div>

            {/* Memorable moments */}
            <div className="mt-4 pt-3 border-t border-slate-700/70">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                <Calendar size={12} className="text-amber-400" /> Khoảnh khắc đáng nhớ
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                {moments.map((m, i) => (
                  <div key={i} className="rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 flex items-start gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <div className="font-bold text-slate-200">{m.title}</div>
                      <div className="text-slate-400">{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button onClick={onHome} className="btn-game btn btn-primary border-0 bg-gradient-to-r from-blue-500 to-indigo-600">
            <ArrowLeft size={16} className="mr-2" /> Về trang chủ
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(code || '');
              alert('Đã sao chép mã phòng!');
            }}
            className="btn-game btn btn-outline btn-secondary"
          >
            <Share2 size={16} className="mr-2" /> Mã phòng: <b className="ml-1 font-mono">{code}</b>
          </button>
          <button onClick={() => location.reload()} className="btn-game btn btn-outline">
            <RotateCcw size={16} className="mr-2" /> Tải lại
          </button>
        </div>
      </div>
    </div>
  );
}

function FinalPodium({ list }) {
  const [a, b, c] = [list[1], list[0], list[2]];
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      {[a, b, c].map((p, i) => {
        if (!p) return <div key={i} />;
        const posKey = i === 0 ? 2 : i === 1 ? 1 : 3;
        const sc = seatColor(p.seat ?? i);
        const h = posKey === 1 ? 'h-24' : posKey === 2 ? 'h-20' : 'h-16';
        return (
          <div key={p.id || p.playerId || i} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-xl grid place-items-center font-black shadow-inner ring-2 ring-offset-2 ring-offset-slate-900 ${sc.bg} ${sc.fg} ${sc.ring}`}>
              {p.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-[10px] font-bold text-slate-300 mt-1 max-w-full truncate px-1">{p.name}</div>
            <div className={`mt-2 w-full rounded-t-xl ${h} bg-gradient-to-t
              ${posKey === 1 ? 'from-amber-600 to-amber-400/70' :
                posKey === 2 ? 'from-slate-500 to-slate-400/70' :
                                'from-orange-700 to-orange-500/60'}
              grid place-items-start pt-2 justify-items-center shadow-inner-deep`}>
              <div className="text-white/90 font-black text-xl drop-shadow">
                {posKey === 1 ? '🥇' : posKey === 2 ? '🥈' : '🥉'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildNetWorthSeries(list) {
  const N = list.reduce((m, p) => Math.max(m, (p.history || []).length), 0);
  if (N <= 0) return [];
  const rows = [];
  for (let q = 1; q <= N; q++) {
    const row = { q: `Q${q}` };
    list.forEach(p => {
      const h = p.history?.[q - 1];
      row[`${p.seat ?? 0}:${p.name}`] = h?.netWorth ?? 0;
    });
    rows.push(row);
  }
  return rows;
}

function pickMoments(list, totalQuarters) {
  const moments = [];
  const richest = list[0];
  if (richest) moments.push({
    icon: '💎',
    title: 'Tỷ phú cuối cùng',
    desc: `${richest.name} chốt ván với ${fmtMoney(richest.netWorth ?? richest.finalNetWorth ?? 0)} tài sản ròng.`,
  });
  const bestGrowth = list
    .map(p => ({ p, delta: (p.history?.length ? (p.history[p.history.length-1]?.netWorth ?? 0) - (p.history[0]?.netWorth ?? 0) : 0) }))
    .sort((a,b) => b.delta - a.delta)[0];
  if (bestGrowth && bestGrowth.delta > 0) moments.push({
    icon: '🚀',
    title: 'Tăng trưởng ấn tượng',
    desc: `${bestGrowth.p.name} tăng thêm ${fmtMoney(bestGrowth.delta)} qua ${totalQuarters} quý.`,
  });
  const bankrupt = list.filter(p => p.status === 'bankrupt' || p.status === 'acquired');
  if (bankrupt.length > 0) moments.push({
    icon: '💥',
    title: 'Người rời cuộc chơi',
    desc: `${bankrupt.map(b => b.name).join(', ')} đã bị loại (${bankrupt.length} công ty sụp đổ).`,
  });
  const longestWin = [...list].sort((a,b) => (b.netWorth ?? 0) - (a.netWorth ?? 0))[1];
  if (longestWin) moments.push({
    icon: '🏅',
    title: 'Á quân xuất sắc',
    desc: `${longestWin.name} về nhì với ${fmtMoney(longestWin.netWorth ?? 0)} VCSH.`,
  });
  return moments.slice(0, 4);
}

function seatColors(seat) {
  const pal = ['#f59e0b','#3b82f6','#10b981','#f43f5e','#8b5cf6','#06b6d4'];
  return pal[seat % pal.length];
}
