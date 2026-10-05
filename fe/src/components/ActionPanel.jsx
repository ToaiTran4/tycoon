import { useMemo, useState } from 'react';
import { CONFIG, seatColor } from '../lib/config.js';
import { fmtMoney, fmtPctQ } from '../lib/format.js';
import {
  Hammer, Landmark, Factory, Coins, LandPlot, Users,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, Eye,
  ChevronRight, Building2, BadgeIndianRupee, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROCESS_ORDER = ['withdraw','sellPlot','borrow','issueBond','issueShares','bid','claimIdle','build','upgrade','convert','repay','deposit','setWorkers','setReinvest'];
const AP_COST_MAP = { withdraw:0, deposit:0, borrow:0, repay:0, setWorkers:0, setReinvest:0,
  bid:1, build:1, upgrade:1, convert:1, sellPlot:1, issueBond:1, issueShares:1, claimIdle:1 };

const LABEL = {
  withdraw: 'Rút tiền gửi', deposit: 'Gửi tiền tiết kiệm',
  borrow: 'Vay ngân hàng', repay: 'Trả nợ ngân hàng',
  issueBond: 'Phát hành trái phiếu', issueShares: 'Phát hành cổ phiếu',
  bid: 'Đấu giá đất', build: 'Xây nhà máy', upgrade: 'Nâng cấp', convert: 'Đổi ngành',
  sellPlot: 'Bán ô đất', claimIdle: 'Mua lại ô bỏ trống',
  setWorkers: 'Điều chỉnh nhân công', setReinvest: 'Tỷ lệ tái đầu tư (R&D)',
};

export default function ActionPanel({
  selectedPlot, myState, myPending, myApLeft,
  onAddAction, onRemoveAction, onPreview, previewResult,
  onReady, meReady, disabled, quarter,
}) {
  const [tab, setTab] = useState('build');
  const [amount, setAmount] = useState('');
  const [sector, setSector] = useState('agri');
  const [bondTerm, setBondTerm] = useState(8);
  const [workerVal, setWorkerVal] = useState('');
  const [fraction, setFraction] = useState(20);
  const [actionTab, setActionTab] = useState('queue');
  const [actionHistory, setActionHistory] = useState([]);
  const selectedLoanId = useMemo(() => myState?.loans?.[0]?.id, [myState?.loans]);

  const isBankrupt = myState?.status === 'bankrupt' || myState?.status === 'acquired';
  const disabledAll = disabled || isBankrupt;
  const plot = selectedPlot;
  const owned = plot && myState && plot.ownerId === myState.id;
  const addAction = (action) => {
    setActionHistory(history => [{ ...action, loggedAt: Date.now() }, ...history].slice(0, 30));
    onAddAction(action);
  };

  return (
    <div className="game-card flex flex-col h-full min-h-[520px]">
      {/* Header */}
      <div className="game-card-header">
        <div className="game-card-title">
          <Sparkles size={14} className="text-amber-400" /> HÀNH ĐỘNG
          <span className={`badge badge-sm ml-1 ${myApLeft > 0 ? 'badge-success' : 'badge-error'} border-0 font-black`}>
            ◆ {myApLeft} AP
          </span>
        </div>
        <button
          onClick={() => onReady(!meReady)}
          disabled={disabledAll}
          className={`btn-game btn btn-xs md:btn-sm ${meReady ? 'btn-success' : 'btn-primary border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950'}`}
        >
          {meReady ? <CheckCircle2 size={14} className="mr-1" /> : null}
          {meReady ? 'Đã sẵn sàng' : 'Sẵn sàng'}
        </button>
      </div>

      {/* Selected plot context */}
      <div className="px-3 pt-3">
        <div className="rounded-lg bg-slate-900/60 border border-slate-700/70 px-3 py-2 text-xs">
          {plot ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">
                  Ô đất #{plot.id} · {CONFIG.tierNames[plot.tier]}
                </span>
                <span className={`badge badge-xs font-bold ${plot.ownerId ? 'badge-outline' : 'badge-ghost'}`}>
                  {plot.ownerId === myState?.id ? 'Bạn sở hữu' : plot.ownerId ? 'Thuê ngoài' : 'Công cộng'}
                </span>
              </div>
              {plot.landValue != null && (
                <div className="text-amber-300 font-mono mt-0.5">💲 {fmtMoney(plot.landValue)}</div>
              )}
              {plot.business && (
                <div className="mt-1 text-sky-300 font-bold">
                  🏭 {CONFIG.sectors[plot.business.sector].name} Lv {plot.business.level}
                  {plot.business.status !== 'operating' && <span className="ml-1 text-amber-300">({plot.business.status})</span>}
                </div>
              )}
              {(plot.idleQuarters || 0) > 0 && (
                <div className={`text-[11px] mt-1 ${(plot.idleQuarters >= CONFIG.idle.claimAfter && !owned) ? 'text-rose-300' : 'text-slate-400'}`}>
                  ⚠ Bỏ trống {plot.idleQuarters} quý
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 italic flex items-center gap-1.5">
              <Eye size={13} /> Chọn một ô trên bản đồ để thực hiện hành động đất đai
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-3">
        <div className="tabs tabs-boxed tabs-sm w-full grid grid-cols-4">
          {[
            ['build',   <><Factory size={12}/><span className="ml-1 hidden md:inline">Xây/Nâng</span></>],
            ['finance', <><Coins   size={12}/><span className="ml-1 hidden md:inline">Tài chính</span></>],
            ['land',    <><LandPlot size={12}/><span className="ml-1 hidden md:inline">Đất đai</span></>],
            ['capital', <><TrendingUp size={12}/><span className="ml-1 hidden md:inline">Vốn</span></>],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`tab ${tab === k ? 'tab-active !bg-amber-500/20 !text-amber-300 border-b-2 border-amber-500' : '!min-h-0 py-1'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2">
        <AnimatePresence mode="wait">
          <motion.div key={tab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {tab === 'build' && (
              <BuildTab
                plot={plot} owned={owned} sector={sector} setSector={setSector}
                myState={myState} quarter={quarter}
                workerVal={workerVal} setWorkerVal={setWorkerVal}
                disabled={disabledAll} add={(x) => add(x, myApLeft, addAction)}
              />
            )}
            {tab === 'finance' && (
              <FinanceTab
                myState={myState} amount={amount} setAmount={setAmount}
                disabled={disabledAll} add={(x) => add(x, myApLeft, addAction)}
                selectedLoanId={selectedLoanId}
              />
            )}
            {tab === 'land' && (
              <LandTab
                plot={plot} owned={owned} amount={amount} setAmount={setAmount}
                disabled={disabledAll} add={(x) => add(x, myApLeft, addAction)}
                myState={myState}
              />
            )}
            {tab === 'capital' && (
              <CapitalTab
                myState={myState} amount={amount} setAmount={setAmount}
                bondTerm={bondTerm} setBondTerm={setBondTerm}
                fraction={fraction} setFraction={setFraction}
                disabled={disabledAll} add={(x) => add(x, myApLeft, addAction)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Preview */}
        {previewResult && (
          <div className="mt-2 rounded-lg bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10
                          border border-amber-500/30 p-3 text-xs">
            <div className="font-bold text-amber-300 mb-1 flex items-center gap-1">
              <Eye size={13} /> Xem trước sau khi chốt quý
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Tiền mặt dự kiến:</span>
              <span className={`font-mono font-bold tabular-nums ${(previewResult.cashAfter || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {fmtMoney(previewResult.cashAfter)}
              </span>
            </div>
            {previewResult.warnings?.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {previewResult.warnings.slice(0, 3).map((w, i) => (
                  <div key={i} className="text-amber-300 flex items-start gap-1">
                    <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending actions and local action history */}
      <div className="border-t border-slate-700/70 p-3">
        <div className="tabs tabs-boxed tabs-sm grid grid-cols-2 mb-2">
          <button onClick={() => setActionTab('queue')} className={`tab ${actionTab === 'queue' ? 'tab-active !bg-amber-500/20 !text-amber-300' : ''}`}>
            Hàng chờ ({myPending?.length || 0})
          </button>
          <button onClick={() => setActionTab('history')} className={`tab ${actionTab === 'history' ? 'tab-active !bg-amber-500/20 !text-amber-300' : ''}`}>
            Lịch sử ({actionHistory.length})
          </button>
        </div>
        {actionTab === 'history' ? (
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {actionHistory.length > 0 ? actionHistory.map((a, i) => (
              <div key={`${a.loggedAt}-${i}`} className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-mono">{i + 1}</span>
                <span className="truncate text-slate-200">{LABEL[a.type] || a.type}</span>
                {a.plotId != null && <span className="text-slate-500">Ô #{a.plotId}</span>}
              </div>
            )) : <div className="text-[11px] italic text-slate-500 text-center py-3">Chưa có hành động trong phiên này</div>}
          </div>
        ) : <>
        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2 flex items-center justify-between">
          <span>Hàng chờ · {myPending?.length || 0}</span>
          <span className="text-slate-500 font-mono">Thứ tự: {PROCESS_ORDER.filter(t => myPending?.some(a => a.type === t)).length > 0
            ? PROCESS_ORDER.filter(t => myPending?.some(a => a.type === t)).map(t => shortName(t)).join('→')
            : '—'}</span>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {myPending?.length > 0 ? (
            myPending.map((a, i) => {
              const cost = AP_COST_MAP[a.type] ?? 0;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i*25 }}
                  key={i} className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-900/50 px-2.5 py-1.5 text-xs hover:border-amber-500/40 transition-colors"
                >
                  <span className="text-amber-400/70 font-black w-5">{i+1}</span>
                  <span className={`badge badge-xs font-bold ${cost > 0 ? 'badge-warning' : 'badge-ghost'}`}>◆{cost}</span>
                  <div className="flex-1 min-w-0 truncate text-slate-200">
                    <b>{LABEL[a.type] || a.type}</b>
                    {a.plotId != null && <span className="text-slate-400"> · Ô #{a.plotId}</span>}
                    {a.sector  != null && <span className="text-slate-400"> · {CONFIG.sectors[a.sector]?.name}</span>}
                    {a.amount  != null && <span className="text-emerald-300 font-mono"> · {fmtMoney(a.amount)}</span>}
                    {a.rate    != null && <span className="text-sky-300 font-mono"> · {(a.rate*100).toFixed(0)}% R&D</span>}
                    {a.term    != null && <span className="text-violet-300 font-mono"> · kỳ {a.term}Q</span>}
                    {a.fraction != null && <span className="text-amber-300 font-mono"> · {(a.fraction*100).toFixed(0)}% CP</span>}
                    {a.workers != null && <span className="text-blue-300 font-mono"> · 👷 {a.workers}</span>}
                  </div>
                  <button onClick={() => onRemoveAction(i)}
                    className="btn btn-ghost btn-xs text-rose-400 hover:bg-rose-500/10 !min-h-0 h-6 w-6 p-0 grid place-items-center">
                    <XCircle size={14} />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <div className="text-[11px] italic text-slate-500 text-center py-3">
              Chưa chọn hành động nào cho quý này
            </div>
          )}
        </div>

        {myPending?.length > 0 && (
          <button onClick={() => onPreview(myPending)}
            className="w-full mt-2 btn-game btn btn-xs btn-outline btn-primary">
            <Eye size={12} className="mr-1" /> Xem trước kết quả
          </button>
        )}
        </>}
      </div>
    </div>
  );
}

function add(action, apLeft, onAdd) {
  const cost = AP_COST_MAP[action.type] ?? 0;
  if (cost > 0 && apLeft <= 0) {
    alert('Hết Điểm Hành Động (AP) cho quý này');
    return;
  }
  onAdd(action);
}

function shortName(t) {
  switch (t) {
    case 'withdraw': return 'Rút'; case 'deposit': return 'Gửi';
    case 'borrow':   return 'Vay'; case 'repay':   return 'Trả nợ';
    case 'issueBond':return 'TP';  case 'issueShares': return 'CP';
    case 'bid':      return 'Đấu'; case 'claimIdle': return 'Claim';
    case 'build':    return 'Xây'; case 'upgrade': return 'Up';
    case 'convert':  return 'Đổi'; case 'sellPlot': return 'Bán';
    case 'setWorkers': return 'LĐ'; case 'setReinvest': return 'RnD';
    default: return t.slice(0,3);
  }
}

/* ========= Build tab ========= */
function BuildTab({ plot, owned, sector, setSector, myState, quarter, workerVal, setWorkerVal, disabled, add }) {
  if (!plot) return empty('Chọn ô đất trước');
  if (!owned) return empty('Chỉ thao tác trên ô đất của bạn');
  const b = plot.business;

  return (
    <div className="space-y-2 text-xs">
      {!b ? (
        <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
          <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400">Xây công trình mới</div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {Object.entries(CONFIG.sectors).map(([k, s]) => (
              <button key={k} onClick={() => setSector(k)}
                className={`btn btn-xs ${sector === k ? 'btn-primary border-0' : 'btn-outline btn-sm'} !h-auto py-2 flex-col !gap-0`}>
                <span className="text-base">{s.icon}</span>
                <span className="text-[10px] font-bold">{s.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-2">
            <span>Chi phí xây Lv1:</span>
            <b className="text-amber-300 font-mono">{fmtMoney(CONFIG.sectors[sector].build[0])}</b>
          </div>
          <button disabled={disabled} onClick={() => add({ type: 'build', plotId: plot.id, sector })}
            className="btn-game btn btn-primary btn-sm w-full border-0 bg-gradient-to-r from-emerald-500 to-teal-600">
            <Hammer size={14} className="mr-1" /> Xây mới (1 AP)
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nâng cấp công trình</span>
              <span className="badge badge-xs font-bold">Lv {b.level} / 3</span>
            </div>
            {b.level < 3 ? (
              <>
                <div className="flex justify-between text-[11px] text-slate-400 mb-2">
                  <span>Chi phí nâng lên Lv {b.level + 1}:</span>
                  <b className="text-amber-300 font-mono">{fmtMoney(CONFIG.sectors[b.sector].build[b.level])}</b>
                </div>
                <button disabled={disabled} onClick={() => add({ type: 'upgrade', plotId: plot.id })}
                  className="btn-game btn btn-sm w-full btn-primary border-0 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <Building2 size={14} className="mr-1" /> Nâng cấp (1 AP)
                </button>
              </>
            ) : (
              <div className="text-[11px] text-emerald-300 text-center py-2">✅ Đã đạt cấp tối đa</div>
            )}
          </div>

          {/* Convert */}
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
            <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400">Đổi ngành (1 AP)</div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {Object.entries(CONFIG.sectors).filter(([k]) => k !== b.sector).map(([k, s]) => (
                <button key={k} disabled={disabled}
                  onClick={() => add({ type: 'convert', plotId: plot.id, sector: k })}
                  className="btn btn-outline btn-xs !h-auto py-2 flex-col !gap-0">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-[10px] font-bold">→ {s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workers */}
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
            <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400 flex justify-between">
              <span>Điều chỉnh nhân công</span>
              <span className="text-slate-300">👷 Hiện tại: <b>{b.workers}</b>/{CONFIG.levels.workers[b.level-1]}</span>
            </div>
            <div className="flex gap-2">
              <input type="number" className="input input-bordered input-sm flex-1"
                placeholder="Số công nhân (0 AP)"
                value={workerVal} onChange={e => setWorkerVal(e.target.value)} />
              <button disabled={disabled}
                onClick={() => {
                  const v = parseInt(workerVal); if (!isNaN(v) && v >= 0) {
                    add({ type: 'setWorkers', plotId: plot.id, workers: v });
                    setWorkerVal('');
                  }
                }}
                className="btn btn-sm btn-outline"><Users size={14} /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[0, Math.floor(CONFIG.levels.workers[b.level-1]/2), CONFIG.levels.workers[b.level-1]].map(w => (
                <button key={w} disabled={disabled} onClick={() => add({ type: 'setWorkers', plotId: plot.id, workers: w })}
                  className="btn btn-xs btn-ghost">
                  👷 {w}
                </button>
              ))}
            </div>
          </div>

          {/* Reinvest */}
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
            <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400 flex justify-between">
              <span>Tỷ lệ R&D / Tái đầu tư</span>
              <span className="text-slate-300">HT: <b>{(b.rndRate||0)*100}%</b></span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {CONFIG.rndRates.map(r => (
                <button key={r} disabled={disabled}
                  onClick={() => add({ type: 'setReinvest', plotId: plot.id, rate: r })}
                  className={`btn btn-xs ${b.rndRate === r ? 'btn-secondary' : 'btn-ghost'} font-bold`}>
                  {(r*100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= Finance tab ========= */
function FinanceTab({ myState, amount, setAmount, disabled, add, selectedLoanId }) {
  const bal = myState?.balances || {};
  const minLoan = 500;
  const amtVal = parseInt(amount);
  const valid = !isNaN(amtVal) && amtVal > 0;

  return (
    <div className="space-y-2 text-xs">
      <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-3">
        <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-slate-400">Số tiền</div>
        <input type="number" className="input input-bordered input-sm w-full mb-2 font-mono"
          placeholder="Triệu đồng..." value={amount} onChange={e => setAmount(e.target.value)} />
        <div className="grid grid-cols-3 gap-1 mb-2">
          {[500, 1000, 5000].map(v => (
            <button key={v} onClick={() => setAmount(String(v))} className="btn btn-xs btn-ghost">
              {fmtMoney(v)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button disabled={disabled || !valid || (bal.DEPOSIT || 0) <= 0}
            onClick={() => { add({ type: 'withdraw', amount: Math.min(amtVal, bal.DEPOSIT || 0) }); setAmount(''); }}
            className="btn btn-sm btn-outline btn-primary">
            💸 Rút tiền gửi
          </button>
          <button disabled={disabled || !valid || (bal.CASH || 0) <= 0}
            onClick={() => { add({ type: 'deposit', amount: Math.min(amtVal, bal.CASH || 0) }); setAmount(''); }}
            className="btn btn-sm btn-outline btn-success">
            🏦 Gửi tiết kiệm
          </button>
          <button disabled={disabled || !valid || amtVal < minLoan}
            onClick={() => { add({ type: 'borrow', amount: amtVal }); setAmount(''); }}
            className="btn btn-sm btn-outline btn-warning">
            🏛️ Vay ngân hàng
            <span className="ml-1 badge badge-xs badge-warning">≥ {fmtMoney(minLoan)}</span>
          </button>
          <button disabled={disabled || !valid || !myState?.loans?.length}
            onClick={() => {
              const loan = (myState.loans || []).find(l => l.id === selectedLoanId) || myState.loans[0];
              if (loan) { add({ type: 'repay', loanId: loan.id, amount: Math.min(amtVal, loan.principal) }); setAmount(''); }
            }}
            className="btn btn-sm btn-outline btn-error">
            💳 Trả nợ
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
          <div>💵 Tiền mặt: <b className="text-slate-200">{fmtMoney(bal.CASH || 0)}</b></div>
          <div>🏦 Tiền gửi: <b className="text-slate-200">{fmtMoney(bal.DEPOSIT || 0)}</b></div>
        </div>
      </div>
    </div>
  );
}

/* ========= Land tab ========= */
function LandTab({ plot, owned, amount, setAmount, disabled, add, myState }) {
  if (!plot) return empty('Chọn ô đất trên bản đồ');
  const amtVal = parseInt(amount);
  const valid = !isNaN(amtVal) && amtVal > 0;
  const claimable = !owned && plot.ownerId != null && (plot.idleQuarters || 0) >= CONFIG.idle.claimAfter;

  return (
    <div className="space-y-2 text-xs">
      <input type="number" className="input input-bordered input-sm w-full font-mono"
        placeholder="Giá (triệu)..." value={amount} onChange={e => setAmount(e.target.value)} />
      {!plot.ownerId ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="mb-1 text-[10px] uppercase font-black tracking-widest text-emerald-300">Đấu giá ô đất công cộng (1 AP)</div>
          <div className="text-slate-300 mb-2">
            Đất {CONFIG.tierNames[plot.tier]} · Giá tham khảo: <b className="font-mono text-amber-300">{fmtMoney(plot.landValue || CONFIG.landBase[plot.tier])}</b>
          </div>
          <button disabled={disabled || !valid}
            onClick={() => { add({ type: 'bid', plotId: plot.id, amount: amtVal }); setAmount(''); }}
            className="btn-game btn btn-sm w-full btn-success border-0 bg-gradient-to-r from-emerald-500 to-green-600">
            <BadgeIndianRupee size={14} className="mr-1" /> Đấu giá đất
          </button>
        </div>
      ) : owned ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="mb-1 text-[10px] uppercase font-black tracking-widest text-rose-300">Bạn sở hữu (1 AP)</div>
          <div className="text-slate-300 mb-2">
            Bán ô đất #{plot.id} · Giá dự kiến thu về: <b className="font-mono text-amber-300">{fmtMoney(plot.landValue)}</b>
          </div>
          <button disabled={disabled}
            onClick={() => add({ type: 'sellPlot', plotId: plot.id })}
            className="btn-game btn btn-sm w-full btn-error">
            <Landmark size={14} className="mr-1" /> Bán ô đất
          </button>
        </div>
      ) : claimable ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-1 text-[10px] uppercase font-black tracking-widest text-amber-300 flex items-center gap-1">
            <AlertCircle size={12}/> Ô đất bỏ trống (1 AP)
          </div>
          <div className="text-slate-300 mb-2">
            Ô đất đã bỏ trống <b className="text-rose-300">{plot.idleQuarters}</b> quý.
            Chi phí mua lại: <b className="font-mono text-amber-300">{fmtMoney(Math.round((plot.landValue || CONFIG.landBase[plot.tier]) * CONFIG.idle.claimPremium))}</b>
            <div className="text-[10px] text-slate-400 mt-0.5">(Phải có tiền mặt ≥ 1.15× giá đất)</div>
          </div>
          <button disabled={disabled}
            onClick={() => add({ type: 'claimIdle', plotId: plot.id })}
            className="btn-game btn btn-sm w-full btn-warning border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950">
            ⚖️ Mua lại ô bỏ trống
          </button>
        </div>
      ) : empty('Ô đất này thuộc sở hữu của người khác và chưa bỏ trống đủ lâu để mua lại')}
    </div>
  );
}

/* ========= Capital tab ========= */
function CapitalTab({ myState, amount, setAmount, bondTerm, setBondTerm, fraction, setFraction, disabled, add }) {
  const minBond = 1000;
  const amtVal = parseInt(amount);
  const validAmt = !isNaN(amtVal) && amtVal >= minBond;
  const rating = myState?.rating || 'D';

  return (
    <div className="space-y-2 text-xs">
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
        <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-violet-300">Phát hành Trái phiếu (1 AP)</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input type="number" className="input input-bordered input-sm font-mono col-span-2"
            placeholder={`Số tiền (≥ ${fmtMoney(minBond)})`} value={amount} onChange={e => setAmount(e.target.value)} />
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-[10px] uppercase font-black text-slate-400 w-16 shrink-0">Kỳ hạn:</span>
            {[4, 8].map(t => (
              <button key={t} onClick={() => setBondTerm(t)}
                className={`btn btn-xs flex-1 ${bondTerm === t ? 'btn-primary' : 'btn-ghost'}`}>
                {t} quý
              </button>
            ))}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mb-2 grid grid-cols-2 gap-2">
          <div>Xếp hạng: <b className={ratingClass(rating)}>{rating}</b></div>
          <div>Phí phát hành: <b className="text-amber-300">1%</b></div>
        </div>
        <button disabled={disabled || !validAmt || rating === 'D'}
          onClick={() => { add({ type: 'issueBond', amount: amtVal, term: bondTerm }); setAmount(''); }}
          className="btn-game btn btn-sm w-full border-0 bg-gradient-to-r from-violet-500 to-purple-600">
          📜 Phát hành Trái phiếu
        </button>
        {rating === 'D' && <div className="text-[10px] text-rose-300 mt-1">⚠️ Hạng D không đủ điều kiện phát hành</div>}
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="mb-2 text-[10px] uppercase font-black tracking-widest text-amber-300">Phát hành Cổ phiếu (1 AP)</div>
        <div className="text-[11px] text-slate-300 mb-2">
          Bán {fraction}% cổ phiếu lưu hành cho nhà đầu tư
        </div>
        <div className="px-2 mb-2">
          <input type="range" min={5} max={30} step={5} value={fraction}
            onChange={e => setFraction(parseInt(e.target.value))}
            className="range range-xs range-amber w-full" />
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>5%</span><span>15%</span><span>25%</span><span>30%</span>
          </div>
        </div>
        <button disabled={disabled}
          onClick={() => add({ type: 'issueShares', fraction: fraction / 100 })}
          className="btn-game btn btn-sm w-full btn-warning border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950">
          📊 Phát hành {fraction}% CP
        </button>
        <div className="text-[10px] text-slate-400 mt-1">
          Giảm giá 5%, phí 2% · Pha loãng vốn chủ sở hữu
        </div>
      </div>
    </div>
  );
}

function ratingClass(r) {
  return ({
    A: 'text-amber-300 font-bold',
    B: 'text-sky-300 font-bold',
    C: 'text-orange-300 font-bold',
    D: 'text-rose-400 font-bold',
  })[r] || 'text-slate-300';
}

function empty(msg) {
  return (
    <div className="text-center text-xs italic text-slate-500 rounded-lg border border-dashed border-slate-700 p-6">
      {msg}
    </div>
  );
}
