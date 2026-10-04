import { fmtMoney, fmtPctQ } from '../lib/format.js';
import { CONFIG } from '../lib/config.js';
import {
  Wallet, Landmark, LineChart, Award, PiggyBank, Building2,
  BadgeDollarSign, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

export default function Financials({ myState, quarter }) {
  if (!myState) return null;
  const { balances, rating, loans, bonds, shares, history } = myState;
  const last = history?.[history.length - 1];
  const prev = history?.[history.length - 2];

  const cash       = balances?.CASH || 0;
  const deposit    = balances?.DEPOSIT || 0;
  const land       = balances?.LAND || 0;
  const buildings  = (balances?.BUILDINGS || 0) - (balances?.ACC_DEPR || 0);
  const bankLoan   = balances?.BANK_LOAN || 0;
  const bondsPay   = balances?.BONDS_PAYABLE || 0;
  const tax        = balances?.TAX_PAYABLE || 0;
  const arrears    = balances?.ARREARS || 0;
  const capital    = (balances?.PAID_IN_CAPITAL || 0) + (balances?.RETAINED_EARNINGS || 0);
  const totalAssets = cash + deposit + land + Math.max(0, buildings) + (balances?.GOODWILL || 0);
  const totalLiab   = Math.abs(bankLoan) + Math.abs(bondsPay) + Math.abs(tax) + Math.abs(arrears);
  const netWorth  = last?.netWorth ?? (totalAssets - totalLiab);
  const netPrev   = prev?.netWorth ?? netWorth;
  const netDelta  = netWorth - netPrev;
  const de        = totalLiab === 0 ? 0 : (capital === 0 ? 99 : +(totalLiab / capital).toFixed(2));

  const ratingCls = CONFIG.ratingColors[rating] || CONFIG.ratingColors.D;

  return (
    <div className="space-y-3">
      {/* Top metric strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <GameStat
          icon={<Wallet size={16} />}
          label="Tiền mặt"
          value={fmtMoney(cash)}
          accent="emerald"
        />
        <GameStat
          icon={<PiggyBank size={16} />}
          label="Tiền gửi NH"
          value={fmtMoney(deposit)}
          accent="blue"
          sub={deposit > 0 ? fmtPctQ(myState._depositRate || (deposit * 0.005)) : ''}
        />
        <GameStat
          icon={<LineChart size={16} />}
          label="Tài sản ròng"
          value={fmtMoney(netWorth)}
          accent="amber"
          sub={
            netDelta === 0 ? '' :
            <span className={netDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {netDelta >= 0 ? <ArrowUpRight size={11} className="inline" /> : <ArrowDownRight size={11} className="inline" />}
              {' '}{netDelta >= 0 ? '+' : ''}{fmtMoney(netDelta)}
            </span>
          }
        />
        <div className="game-card p-0">
          <div className={`h-full rounded-xl p-3 flex flex-col justify-between border ${ratingCls}`}>
            <div className="flex items-center justify-between">
              <Award size={16} className={ratingCls.split(' ')[0]} />
              <span className="text-[10px] uppercase font-black tracking-widest opacity-70">Xếp hạng</span>
            </div>
            <div className="flex items-end justify-between">
              <span className={`text-3xl font-black italic drop-shadow-md ${ratingCls.split(' ')[0]}`}>
                {rating}
              </span>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">D/E</div>
                <div className="font-mono font-bold text-sm tabular-nums" style={{ color: de > 2 ? '#f87171' : de > 1 ? '#fbbf24' : '#34d399' }}>
                  {de}×
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance sheet 3-way split (Tài sản / Nợ / Vốn chủ) */}
      <div className="game-card">
        <div className="game-card-header">
          <div className="game-card-title">
            <BadgeDollarSign size={14} className="text-amber-400" /> BẢNG CÂN ĐỐI NHANH
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Q{quarter || 1}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 text-xs">
          <Side label="TÀI SẢN" tone="good" items={[
            ['💵 Tiền mặt', cash],
            ['🏦 Tiền gửi', deposit],
            ['🌾 Đất đai', land],
            ['🏢 Công trình (GTCL)', buildings],
          ]} total={totalAssets} />
          <Side label="NỢ PHẢI TRẢ" tone="bad" items={[
            ['🏛️ Vay NH', Math.abs(bankLoan)],
            ['📜 Trái phiếu', Math.abs(bondsPay)],
            ['🧾 Thuế phải nộp', Math.abs(tax)],
            ['⚠️ Nợ quá hạn', Math.abs(arrears)],
          ]} total={totalLiab} />
          <Side label="VỐN CHỦ SỞ HỮU" tone="amber" items={[
            ['📈 Vốn góp', balances?.PAID_IN_CAPITAL || 0],
            ['💸 LN giữ lại', balances?.RETAINED_EARNINGS || 0],
            ...(shares ? [['📊 Cổ phiếu lưu hành', `${shares.float || 0}/${(shares.outstanding || 0) + (shares.float || 0)}`]] : []),
          ]} total={capital} sub={`Tổng VCSH: ${fmtMoney(netWorth)}`} />
        </div>
      </div>

      {/* Debt instruments */}
      {(loans?.length > 0 || bonds?.length > 0) && (
        <div className="game-card">
          <div className="game-card-header">
            <div className="game-card-title">
              <Landmark size={14} className="text-blue-400" /> CÔNG CỤ NỢ
            </div>
          </div>
          <div className="p-3 grid gap-2 md:grid-cols-2 max-h-48 overflow-y-auto">
            {loans?.map(l => (
              <Instrument key={'L'+l.id} kind="Vay NH" origin={l.originQuarter} maturity={l.maturityQuarter}
                principal={l.principal} rate={(l.spread)*4} quarter />
            ))}
            {bonds?.map(b => (
              <Instrument key={'B'+b.id} kind="Trái phiếu" origin={b.originQuarter} maturity={b.maturityQuarter}
                principal={b.principal} rate={(b.coupon)*4} coupon quarter />
            ))}
            {(!loans?.length && !bonds?.length) && (
              <div className="md:col-span-2 text-center text-xs text-slate-500 italic py-3">
                Không có khoản vay/trái phiếu nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GameStat({ icon, label, value, sub, accent = 'emerald' }) {
  const accentMap = {
    emerald: { bg: 'from-emerald-500/10', text: 'text-emerald-300', ring: 'hover:border-emerald-500/40' },
    blue:    { bg: 'from-blue-500/10',    text: 'text-sky-300',     ring: 'hover:border-sky-500/40' },
    amber:   { bg: 'from-amber-500/10',   text: 'text-amber-300',   ring: 'hover:border-amber-500/40' },
    violet:  { bg: 'from-violet-500/10',  text: 'text-violet-300',  ring: 'hover:border-violet-500/40' },
  };
  const a = accentMap[accent] || accentMap.emerald;
  return (
    <div className={`game-card p-3 bg-gradient-to-br ${a.bg} to-slate-900/60 ${a.ring}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{label}</span>
        <span className={`${a.text} opacity-80`}>{icon}</span>
      </div>
      <div className={`font-mono font-bold text-lg tabular-nums ${a.text}`}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5 text-slate-400">{sub}</div>}
    </div>
  );
}

function Side({ label, tone, items, total, sub }) {
  const toneCls = {
    good:  'border-emerald-500/30 text-emerald-300',
    bad:   'border-rose-500/30 text-rose-300',
    amber: 'border-amber-500/30 text-amber-300',
  }[tone];
  return (
    <div className={`rounded-lg border bg-slate-900/60 p-2.5 ${toneCls}`}>
      <div className={`text-[10px] uppercase font-black tracking-widest mb-1.5 pb-1.5 border-b ${toneCls} border-current border-opacity-20`}>
        {label}
      </div>
      <div className="space-y-1">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between items-center text-[11px] gap-2">
            <span className="text-slate-400 truncate">{k}</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums whitespace-nowrap">
              {typeof v === 'number' ? fmtMoney(v) : v}
            </span>
          </div>
        ))}
      </div>
      <div className={`mt-2 pt-1.5 border-t border-current border-opacity-20 flex justify-between items-baseline gap-2`}>
        <span className="text-[10px] uppercase font-black opacity-70">Tổng</span>
        <span className={`font-mono font-black tabular-nums ${toneCls.split(' ')[1]}`}>
          {typeof total === 'number' ? fmtMoney(total) : total}
        </span>
      </div>
      {sub && <div className="mt-1 text-[10px] opacity-70">{sub}</div>}
    </div>
  );
}

function Instrument({ kind, origin, maturity, principal, rate, coupon, quarter }) {
  const remain = Math.max(0, (maturity || 0) - (quarter || origin || 0));
  const isBond = !!coupon;
  return (
    <div className={`rounded-lg border p-2.5 text-xs transition-colors
      ${isBond ? 'border-violet-500/30 bg-violet-500/5' : 'border-blue-500/30 bg-blue-500/5'}
      hover:border-opacity-60`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`badge badge-xs font-bold ${isBond ? 'badge-primary' : 'badge-secondary'}`}>
          {kind}
        </span>
        <span className="text-[10px] text-slate-400">Q{origin}→Q{maturity}</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="font-mono font-bold text-slate-100 tabular-nums">{fmtMoney(principal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Còn {remain} quý đến đáo hạn</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400">Lãi suất</div>
          <div className={`font-mono font-bold tabular-nums ${isBond ? 'text-violet-300' : 'text-sky-300'}`}>
            {(rate*100).toFixed(1)}%/năm
          </div>
        </div>
      </div>
    </div>
  );
}
