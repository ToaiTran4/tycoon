import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, Cell
} from 'recharts';
import { fmtMoney } from '../lib/format.js';
import { CONFIG, seatColor } from '../lib/config.js';
import { Trophy, Medal, Crown, TrendingUp, Award, Users } from 'lucide-react';

export default function TabRanking({ players = [], myId, finished, ranking, plots, macro }) {
  const [view, setView] = useState('chart');

  const list = useMemo(() => {
    if (ranking && Array.isArray(ranking)) {
      return ranking.map(r => {
        const full = players.find(p => p.id === r.playerId) || {};
        return { ...full, ...r, seat: full.seat ?? r.seat ?? 0 };
      }).sort((a, b) => (b.rank || 99) - (a.rank || 99)).reverse();
    }
    return players
      .map(p => ({ ...p, netWorth: p.netWorth ?? 0 }))
      .sort((a, b) => b.netWorth - a.netWorth)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [players, ranking]);

  const history = useMemo(() => {
    const quarters = new Map();
    players.forEach(p => {
      (p.history || []).forEach((h, idx) => {
        const key = `Q${idx + 1}`;
        if (!quarters.has(key)) quarters.set(key, { q: key });
        quarters.get(key)[`${p.seat}:${p.name}`] = h.netWorth ?? 0;
      });
    });
    return Array.from(quarters.values());
  }, [players]);

  const playerCount = players.length;
  const totalNetWorth = list.reduce((s, p) => s + (p.netWorth || 0), 0);
  const avgNetWorth = playerCount ? totalNetWorth / playerCount : 0;
  const sectorStats = useMemo(() => calcSectorStats(plots, players), [plots, players]);

  return (
    <div className="game-card">
      <div className="game-card-header flex-wrap gap-2">
        <div className="game-card-title">
          <Trophy size={14} className="text-amber-400" /> XẾP HẠNG & THỐNG KÊ
        </div>
        <div className="flex items-center gap-2">
          {finished && (
            <span className="badge badge-xs badge-success border-0 !bg-gradient-to-r from-emerald-500 to-teal-500 font-black">
              <Crown size={11} className="mr-1" /> KẾT QUẢ CUỐI CÙNG
            </span>
          )}
          <div className="tabs tabs-boxed tabs-xs">
            <button onClick={() => setView('chart')} className={`tab ${view==='chart'?'tab-active':''}`}>📈 Biểu đồ</button>
            <button onClick={() => setView('table')} className={`tab ${view==='table'?'tab-active':''}`}>🏆 Bảng hạng</button>
            <button onClick={() => setView('stats')} className={`tab ${view==='stats'?'tab-active':''}`}>📊 Thống kê</button>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Podium */}
        <Podium list={list} />

        {view === 'chart' && (
          <ChartView history={history} players={players} />
        )}

        {view === 'table' && (
          <RankingTable list={list} myId={myId} />
        )}

        {view === 'stats' && (
          <StatsView
            totalNetWorth={totalNetWorth} avgNetWorth={avgNetWorth}
            sectorStats={sectorStats}
            macro={macro}
          />
        )}
      </div>
    </div>
  );
}

/* ============= Podium ============= */
function Podium({ list }) {
  const [first, second, third] = [list[0], list[1], list[2]];
  if (!first) return null;
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      {[second, first, third].map((p, i) => {
        if (!p) return <div key={i} className="hidden" />;
        const posKey = i === 0 ? 2 : i === 1 ? 1 : 3;
        const sc = seatColor(p.seat);
        const heights = posKey === 1 ? 'h-28' : posKey === 2 ? 'h-20' : 'h-16';
        const sizes   = posKey === 1 ? 'text-3xl' : posKey === 2 ? 'text-2xl' : 'text-xl';
        const crown   = posKey === 1 ? <Crown size={18} className="text-yellow-300 mb-1 drop-shadow" />
                                  : posKey === 2 ? <Medal size={16} className="text-slate-300 mb-1" />
                                                  : <Award size={14} className="text-orange-400 mb-1" />;
        return (
          <div key={p.id} className="flex flex-col items-center animate-slide-up" style={{ animationDelay: `${i*100}ms` }}>
            {crown}
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl grid place-items-center font-black shadow-inner ring-2 ring-offset-2 ring-offset-slate-900 ${sc.bg} ${sc.fg} ${sc.ring} ${sizes}`}>
              {p.name.slice(0,2).toUpperCase()}
            </div>
            <div className="text-[11px] text-slate-200 mt-1 font-bold max-w-[100px] truncate">{p.name}</div>
            <div className="text-[10px] font-mono font-bold text-amber-300">{fmtMoney(p.netWorth || 0)}</div>
            <div className={`w-full ${heights} rounded-t-xl mt-1 bg-gradient-to-t
              ${posKey === 1 ? 'from-amber-600 to-amber-400/70' :
                posKey === 2 ? 'from-slate-500 to-slate-400/70' :
                                'from-orange-700 to-orange-500/60'}
              grid place-items-start pt-2 justify-items-center shadow-inner-deep`}>
              <div className="text-white/90 font-black text-xl md:text-2xl drop-shadow">
                {posKey === 1 ? '🥇' : posKey === 2 ? '🥈' : '🥉'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============= Chart ============= */
function ChartView({ history, players }) {
  const colors = ['#f59e0b','#3b82f6','#10b981','#f43f5e','#8b5cf6','#06b6d4'];
  if (history.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-xs italic text-slate-500 rounded-lg border border-dashed border-slate-700">
        Cần ít nhất 2 quý dữ liệu để vẽ biểu đồ tài sản ròng
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-2">
      <div className="h-64 md:h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="q" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(1)}tỷ`} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [fmtMoney(v), String(n).split(':').slice(1).join(':') || n]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => {
                const [seat, name] = String(value).split(':');
                return <span className="text-slate-200"><span className="badge badge-xs mr-1">#{seat}</span>{name}</span>;
              }}
            />
            {players.map((p, i) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={`${p.seat}:${p.name}`}
                name={`${p.seat}:${p.name}`}
                stroke={colors[i % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] uppercase text-slate-500 text-center mt-1 font-black tracking-widest">
        📈 Biểu đồ tài sản ròng theo quý (VNĐ)
      </div>
    </div>
  );
}

/* ============= Table ============= */
function RankingTable({ list, myId }) {
  return (
    <div className="rounded-xl border border-slate-700/60 overflow-hidden">
      <div className="grid grid-cols-12 bg-slate-800/80 text-[10px] uppercase font-black tracking-widest text-slate-300 px-2 py-2">
        <div className="col-span-1">Hạng</div>
        <div className="col-span-4">Người chơi</div>
        <div className="col-span-2 text-center">Hạng tín nhiệm</div>
        <div className="col-span-2 text-right">Tình trạng</div>
        <div className="col-span-3 text-right">Tài sản ròng</div>
      </div>
      <div className="divide-y divide-slate-800 text-xs max-h-80 overflow-y-auto">
        {list.map((p) => {
          const sc = seatColor(p.seat);
          const isMe = p.id === myId || p.playerId === myId;
          const rc = CONFIG.ratingColors[p.rating] || CONFIG.ratingColors.D;
          return (
            <div key={p.id || p.playerId}
                 className={`grid grid-cols-12 px-2 py-2 items-center transition-colors
                   ${isMe ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:bg-slate-800/30'}`}>
              <div className="col-span-1 flex items-center gap-1">
                {p.rank === 1 && <Crown  size={14} className="text-amber-400" />}
                {p.rank === 2 && <Medal  size={14} className="text-slate-300" />}
                {p.rank === 3 && <Award  size={14} className="text-orange-400" />}
                {p.rank > 3 && <span className="font-mono text-slate-500 font-bold ml-1">#{p.rank}</span>}
              </div>
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <div className={`badge-seat ${sc.bg} ${sc.fg} shrink-0`}>{p.name?.slice(0,2).toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-200 truncate">
                    {p.name} {isMe && <span className="badge badge-xs badge-warning ml-1">Bạn</span>}
                  </div>
                  <div className="text-[10px] text-slate-500">Ghế #{p.seat ?? 0}</div>
                </div>
              </div>
              <div className="col-span-2 text-center">
                <span className={`badge badge-xs border font-black ${rc}`}>{p.rating}</span>
              </div>
              <div className="col-span-2 text-right">
                <StatusBadge status={p.status} />
              </div>
              <div className="col-span-3 text-right font-mono font-black tabular-nums text-amber-300">
                {fmtMoney(p.netWorth || 0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case 'bankrupt': return <span className="badge badge-xs badge-error font-bold">Phá sản</span>;
    case 'acquired': return <span className="badge badge-xs badge-warning font-bold">Bị thâu</span>;
    case 'active':
    default:         return <span className="badge badge-xs badge-success font-bold">Đang chơi</span>;
  }
}

/* ============= Stats view ============= */
function StatsView({ totalNetWorth, avgNetWorth, sectorStats, macro }) {
  const colors = ['#10b981','#3b82f6','#8b5cf6','#f59e0b'];
  const sectorData = Object.entries(CONFIG.sectors).map(([k, s], i) => ({
    name: s.short || k, fullName: s.name, count: sectorStats?.[k]?.count || 0, revenue: sectorStats?.[k]?.revenue || 0, fill: colors[i]
  }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3 space-y-1.5">
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
          <Users size={12} /> Thị trường chung
        </div>
        <StatRow label="Tổng VCSH toàn thị trường" value={fmtMoney(totalNetWorth)} tone="good" />
        <StatRow label="VCSH trung bình / người" value={fmtMoney(avgNetWorth)} tone="amber" />
        <StatRow label="Số doanh nghiệp vận hành" value={(sectorData.reduce((s,d)=>s+d.count,0)) + ' cơ sở'} />
        {macro && (
          <>
            <StatRow label="Chu kỳ kinh tế" value={CONFIG.phaseNames[macro.phase]} tone="amber" />
            <StatRow label="Niềm tin tiêu dùng" value={`${macro.confidence ?? 0}/100`} />
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center gap-1">
          <TrendingUp size={12}/> Phân bổ theo ngành
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer>
            <BarChart data={sectorData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" name="Cơ sở" radius={[4,4,0,0]}>
                {sectorData.map((d,i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
          {sectorData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} />
              <span className="text-slate-300 font-bold">{d.fullName}</span>
              <span className="ml-auto font-mono text-slate-400">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function StatRow({ label, value, tone }) {
  const cls = tone === 'good' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-slate-200';
  return (
    <div className="flex justify-between items-center text-[11px] py-0.5 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

/* Sector aggregate helper */
function calcSectorStats(plots, players) {
  const out = {};
  (plots || []).forEach(p => {
    if (!p.business || !p.ownerId) return;
    const owner = players?.find(pl => pl.id === p.ownerId);
    const sector = p.business.sector;
    if (!out[sector]) out[sector] = { count: 0, revenue: 0, byOwner: new Map() };
    out[sector].count += 1;
    out[sector].revenue += p.business.revenue || 0;
    if (owner) out[sector].byOwner.set(owner.id, (out[sector].byOwner.get(owner.id) || 0) + 1);
  });
  return out;
}
