import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { fmtMoney, fmtPctQ, fmtNumber, SECTOR_NAMES } from '../lib/format.js';
import { CONFIG } from '../lib/config.js';
import {
  TrendingDown, TrendingUp, Activity, Percent, Landmark,
  AlertTriangle, Award, Users, Warehouse, Newspaper,
  Sparkles, Scale, Banknote, PiggyBank, HelpCircle,
} from 'lucide-react';

const SECTOR_ICON = { agri: '🌾', real_estate: '🏘️', tech: '💻', tourism: '🏖️' };
const SECTOR_COLOR = { agri: '#10b981', real_estate: '#3b82f6', tech: '#8b5cf6', tourism: '#f59e0b' };

export default function MarketPanel({ macro, macroHistory, activeEvents, listings, dice, players, myState }) {
  const [tab, setTab] = useState('overview');

  return (
    <div className="flex flex-col gap-3">
      {/* Top headline */}
      <div className="game-card relative z-30 !overflow-visible group">
        <div className="game-card-header">
          <div className="game-card-title">
            <Newspaper size={14} className="text-amber-400" /> BẢN TIN THỊ TRƯỜNG
          </div>
          <span className="text-[10px] text-slate-500">Di chuột để xem điểm tin</span>
          <span className={`badge badge-xs font-bold border ${CONFIG.phaseColors[macro.phase]}`}>
            <Activity size={10} className="mr-1" />
            Giai đoạn: {CONFIG.phaseNames[macro.phase]}
          </span>
        </div>
        <div className="absolute left-2 right-2 top-full z-[70] mt-2 origin-top opacity-0 pointer-events-none -translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
          <div className="rounded-xl border border-slate-600 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
            <HeadlineSentence macro={macro} dice={dice} players={players} />
          {/* 6 macro metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
            <Metric icon={<PiggyBank size={13} />} label="Tiền gửi" value={fmtPctQ(macro.depositRate)} />
            <Metric icon={<Banknote size={13} />} label="Lãi vay" value={fmtPctQ(macro.lendingBase)} tone={macro.lendingBase > 0.05 ? 'warn' : 'ok'} />
            <Metric icon={<Landmark size={13} />} label="Room tín dụng"
              value={`${fmtNumber(macro.creditUsed)}/${fmtNumber(macro.creditRoom)}`}
              tone={macro.creditRoom === 0 ? 'warn' : (macro.creditUsed / (macro.creditRoom || 1)) > 0.8 ? 'warn' : 'ok'}
              sub={`${Math.round((macro.creditUsed / (macro.creditRoom || 1)) * 100)}% dùng`}
            />
            <Metric icon={<Users size={13} />} label="Thất nghiệp" value={fmtPctQ(macro.unemployment)} tone={macro.unemployment > 0.08 ? 'warn' : 'ok'} />
            <Metric icon={<Scale size={13} />} label="CPI index" value={fmtNumber(macro.cpi)} />
            <Metric icon={<Warehouse size={13} />} label="Giá đất" value={fmtNumber(macro.landIndex)} tone="good" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="game-card">
        <div className="game-card-header !py-2">
          <div className="tabs tabs-boxed tabs-sm w-full">
            {[
              ['overview', '🏢 Tổng quan'],
              ['sectors',  '📊 Ngành'],
              ['events',   '⚡ Sự kiện'],
              ['history',  '📈 Lịch sử'],
            ].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`tab tab-xs md:tab-sm flex-1 ${tab === k ? 'tab-active !bg-amber-500/20 !text-amber-300 border-b-2 border-amber-500' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3">
          {tab === 'overview' && <OverviewTab macro={macro} myState={myState} />}
          {tab === 'sectors'  && <SectorsTab sectors={macro.sectors} />}
          {tab === 'events'   && <EventsTab events={activeEvents} />}
          {tab === 'history'  && <HistoryTab history={macroHistory} />}
        </div>
      </div>

      {/* Role log feed (narrative) */}
      <RoleNewsFeed macro={macro} players={players} />
    </div>
  );
}

/* ============== Headline sentence ============== */
function HeadlineSentence({ macro, dice, players }) {
  const sum = (dice?.a || 0) + (dice?.b || 0);
  const totalNet = players?.reduce((s, p) => s + (p.netWorth || 0), 0) || 0;
  return (
    <div className="rounded-lg bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10
                    border border-amber-500/20 p-3 animate-slide-up">
      <div className="text-[11px] text-slate-400 uppercase font-black tracking-wider mb-1 flex items-center gap-1">
        <Sparkles size={12} className="text-amber-400" /> Điểm tin
      </div>
      <div className="text-sm text-slate-200 leading-relaxed">
        Kinh tế đang trong giai đoạn <b className={phaseText(macro.phase)}>{CONFIG.phaseNames[macro.phase]}</b>.
        Xúc xắc quý trước ra <b className="text-amber-300">{dice?.a ?? '?'}</b> +{' '}
        <b className="text-amber-300">{dice?.b ?? '?'}</b> ={' '}
        <b className="text-amber-300">{sum || '?'}</b>.
        Tổng tài sản thị trường hiện tại: <b className="text-emerald-300">{fmtMoney(totalNet)}</b>.
        Niềm tin người tiêu dùng đang ở mức{' '}
        <b className={macro.confidence >= 60 ? 'text-emerald-300' : macro.confidence < 45 ? 'text-rose-300' : 'text-amber-300'}>{fmtNumber(macro.confidence)}</b> điểm.
      </div>
    </div>
  );
}
function phaseText(p) {
  return p === 'boom' ? 'text-emerald-300' : p === 'recession' ? 'text-rose-300' : 'text-sky-300';
}

/* ============== Metric ============== */
function Metric({ icon, label, value, sub, tone = 'ok' }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-300' :
    tone === 'warn' ? 'text-amber-300' :
    tone === 'bad'  ? 'text-rose-300' : 'text-slate-100';
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 px-3 py-2 hover:border-amber-500/30 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">
        {icon} {label}
      </div>
      <div className={`font-mono font-bold text-sm ${toneCls} tabular-nums`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ============== Overview Tab ============== */
function OverviewTab({ macro, myState }) {
  return (
    <div className="space-y-3">
      {/* Bank + investors + gov summary */}
      <div className="grid grid-cols-3 gap-2">
        <MiniCard title="🏦 Ngân hàng" items={[
          ['Vốn', `${fmtNumber(macro.bank?.capital ?? 0)}`],
          ['Nợ cho vay', `${fmtNumber(macro.bank?.loans ?? 0)}`],
          ['Tiền gửi', `${fmtNumber(macro.bank?.deposits ?? 0)}`],
        ]} />
        <MiniCard title="💼 Nhà đầu tư" items={[
          ['Tiền mặt', `${fmtNumber(macro.investors?.cash ?? 0)}`],
          ['TP nắm giữ', `${fmtNumber(macro.investors?.bondsHeld ?? 0)}`],
        ]} />
        <MiniCard title="🏛️ Chính phủ" items={[
          ['Quỹ', `${fmtMoney(macro.gov?.cash ?? 0)}`],
        ]} />
      </div>
      <div className="rounded-lg border border-dashed border-slate-700/70 px-3 py-2 text-[11px] text-slate-400">
        Giá rao bán và thanh lý được hiển thị khi di chuột lên ô đất tương ứng trên bản đồ thành phố.
      </div>
    </div>
  );
}

function MiniCard({ title, items }) {
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-700/70 p-2">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{title}</div>
      <div className="space-y-0.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">{k}</span>
            <span className="font-mono font-bold text-slate-100 tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============== Sectors Tab ============== */
function SectorsTab({ sectors }) {
  if (!sectors) return null;
  const keys = Object.keys(sectors);
  const bars = keys.map(k => {
    const s = sectors[k];
    const util = (s.util ?? 0) * 100;
    return {
      key: k, name: SECTOR_NAMES[k] || k, icon: SECTOR_ICON[k] || '📦',
      price: s.price, npcCap: s.npcCap, demand: s.demand, supply: s.supply,
      util, growth: (s.priceGrowth ?? 0) * 100,
    };
  });
  return (
    <div className="space-y-3">
      <div className="h-40 w-full">
        <ResponsiveContainer>
          <BarChart data={bars} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="icon" stroke="#94a3b8" fontSize={16} />
            <YAxis stroke="#94a3b8" tickFormatter={(v) => fmtNumber(v)} fontSize={10} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [typeof v === 'number' ? fmtNumber(Math.round(v)) : v, n]}
            />
            <Bar dataKey="price" name="Giá" radius={[4,4,0,0]}>
              {bars.map((b,i) => <Cell key={i} fill={SECTOR_COLOR[b.key]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {bars.map(b => (
          <div key={b.key} className="rounded-lg bg-slate-900/60 border border-slate-700/70 p-3 hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{b.icon}</span>
                <span className="font-bold text-slate-200">{b.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {b.growth >= 0 ? <TrendingUp size={13} className="text-emerald-400" /> : <TrendingDown size={13} className="text-rose-400" />}
                <span className={`font-mono font-bold text-xs ${b.growth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {b.growth >= 0 ? '+' : ''}{b.growth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <SStat label="Giá" value={fmtNumber(b.price)} bold />
              <SStat label="Cầu" value={fmtNumber(b.demand)} />
              <SStat label="Cung" value={fmtNumber(b.supply)} />
              <SStat label="Sử dụng" value={`${b.util.toFixed(0)}%`}
                tone={b.util >= 85 ? 'good' : b.util < 40 ? 'warn' : 'ok'} />
            </div>
            {/* Util bar */}
            <div className="mt-2 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, b.util)}%`,
                  background: `linear-gradient(90deg, ${SECTOR_COLOR[b.key]}, ${SECTOR_COLOR[b.key]}aa)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SStat({ label, value, tone, bold }) {
  const cls =
    tone === 'good' ? 'text-emerald-300' :
    tone === 'warn' ? 'text-amber-300' : 'text-slate-200';
  return (
    <div>
      <div className="text-slate-500 uppercase tracking-wider text-[9px] font-black">{label}</div>
      <div className={`font-mono tabular-nums ${cls} ${bold ? 'font-bold' : ''}`}>{value}</div>
    </div>
  );
}

/* ============== Events Tab ============== */
function EventsTab({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center text-xs text-slate-500 italic rounded-lg border border-dashed border-slate-700 p-6">
        <Sparkles size={30} className="mx-auto mb-2 opacity-50" />
        Không có sự kiện đặc biệt nào đang diễn ra
        <div className="text-[10px] mt-2 opacity-60">Sự kiện bắt đầu xuất hiện từ quý 3</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="rounded-lg bg-gradient-to-r from-amber-500/15 to-rose-500/10
                                border border-amber-500/30 p-3 animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-500/20 grid place-items-center text-amber-300">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <b className="text-amber-200 text-sm">Sự kiện #{i+1}</b>
                <span className="badge badge-xs badge-warning font-bold">
                  Còn {e.remaining} quý
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">{e.name || e.id || 'Sốc thị trường'}</div>
              {e.description && <div className="text-[11px] text-slate-400 mt-1">{e.description}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============== History Tab ============== */
function HistoryTab({ history }) {
  if (!history || history.length === 0) {
    return <div className="text-center text-xs text-slate-500 italic p-6">Chưa có dữ liệu lịch sử</div>;
  }
  const chart = history.slice(-16).map((h, i) => ({
    q: `Q${i + 1}`,
    Lãi: +((h.policyRate ?? 0) * 4 * 100).toFixed(1),
    LP: +((h.inflation ?? 0) * 4 * 100).toFixed(1),
    TT: +((h.growth ?? 0) * 4 * 100).toFixed(1),
    NT: Math.round(h.confidence ?? 0),
  }));
  return (
    <div className="space-y-3">
      <div className="h-48 w-full">
        <ResponsiveContainer>
          <LineChart data={chart} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="q" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [`${Number(v).toFixed(1)}%`, n]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Lãi" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="LP"  stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="TT"  stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="NT"  stroke="#f59e0b" strokeWidth={2} dot={false} yAxisId={undefined} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
        <LegendDot color="#3b82f6" label="Lãi suất (%/năm)" />
        <LegendDot color="#ef4444" label="Lạm phát (%/năm)" />
        <LegendDot color="#10b981" label="Tăng trưởng (%/năm)" />
        <LegendDot color="#f59e0b" label="Niềm tin (điểm)" />
      </div>
    </div>
  );
}
function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-900/60 border border-slate-700/60 px-2 py-1.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

/* ============== Role News Feed ============== */
function RoleNewsFeed({ macro, players }) {
  const topPlayer = [...(players || [])].sort((a,b) => (b.netWorth||0) - (a.netWorth||0))[0];
  const poorest = [...(players || [])].sort((a,b) => (a.netWorth||0) - (b.netWorth||0))[0];
  const items = [
    { role: '👨‍👩‍👧‍👦 Người dân', tone: 'blue',
      text: `Thị trường lao động ${macro.unemployment > 0.07 ? 'phân cực, nhiều người thất nghiệp' : 'ổn định, lương tăng nhẹ'}. Người dân ưu tiên tiêu dùng ngành ${pickSectorByDemand(macro.sectors)}.` },
    { role: '🏦 Ngân hàng', tone: 'sky',
      text: `Room tín dụng còn ${fmtNumber(Math.max(0,(macro.creditRoom||0)-(macro.creditUsed||0)))} tỷ, tỷ lệ nợ quá hạn ${macro.bank?.arrears ? 'tăng' : 'ổn định'}. Hạn chế cho vay hạng D.` },
    { role: '💼 Nhà đầu tư', tone: 'violet',
      text: `Sẵn sàng mua trái phiếu hạng A/B với coupon cạnh tranh. Cổ phiếu doanh nghiệp ${topPlayer ? `${topPlayer.name} được quan tâm nhiều` : 'tiềm năng đang được săn đón'}.` },
    { role: '🏛️ Chính phủ', tone: 'amber',
      text: `Kích cầu bằng chi ngân sách. Theo dõi chặt chẽ lạm phát ${(macro.inflation*400).toFixed(1)}%/năm ${(macro.inflation > 0.07) ? '→ có thể siết tiền' : '→ trong ngưỡng cho phép'}.` },
    ...(poorest && poorest.netWorth < 5000 ? [{
      role: '⚠️ Kế toán', tone: 'rose',
      text: `${poorest.name} đang có tài sản ròng thấp (${fmtMoney(poorest.netWorth)}). Cảnh báo phá sản nếu tiếp tục thua lỗ.`,
    }] : []),
    ...(topPlayer ? [{
      role: '🏆 Bảng vàng', tone: 'gold',
      text: `${topPlayer.name} đang dẫn đầu với ${fmtMoney(topPlayer.netWorth)} tài sản ròng (hạng tín nhiệm ${topPlayer.rating}).`,
    }] : []),
  ];
  const toneCls = {
    blue:   'border-blue-500/30 bg-blue-500/5',
    sky:    'border-sky-500/30 bg-sky-500/5',
    violet: 'border-violet-500/30 bg-violet-500/5',
    amber:  'border-amber-500/30 bg-amber-500/5',
    rose:   'border-rose-500/30 bg-rose-500/5',
    gold:   'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-500/10',
  };
  return (
    <div className="game-card relative z-20 !overflow-visible group">
      <div className="game-card-header">
        <div className="game-card-title">
          <Award size={14} className="text-amber-400" /> CẨM NANG
        </div>
        <button className="btn btn-ghost btn-xs text-slate-400" title="Mở cẩm nang" aria-label="Mở cẩm nang">
          <HelpCircle size={16} />
        </button>
      </div>
      <div className="absolute left-2 right-2 top-full z-[70] mt-2 max-h-80 origin-top overflow-y-auto rounded-xl border border-slate-600 bg-slate-950/95 p-3 opacity-0 pointer-events-none -translate-y-1 shadow-2xl backdrop-blur transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0">
          {items.map((it, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2.5 text-xs animate-slide-in ${toneCls[it.tone]}`}
                 style={{ animationDelay: `${i*40}ms` }}>
              <div className="font-black tracking-wide text-slate-200 mb-0.5">{it.role}</div>
              <div className="text-slate-300 leading-snug">{it.text}</div>
            </div>
          ))}
        </div>
    </div>
  );
}
function pickSectorByDemand(sectors) {
  if (!sectors) return 'đa dạng';
  const arr = Object.entries(sectors).map(([k,s]) => [k, (s?.demand || 0) - (s?.supply || 0)]);
  arr.sort((a,b) => b[1] - a[1]);
  const top = arr[0];
  return SECTOR_NAMES[top[0]] || 'dịch vụ';
}
