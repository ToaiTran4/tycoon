import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtMoney, fmtNumber } from '../lib/format.js';
import { ACCOUNT_NAMES_VI, CATEGORY_NAMES_VI } from '../lib/vi.js';
import { CONFIG, seatColor } from '../lib/config.js';
import { BookOpen, FileBarChart, Receipt, Scale, ArrowUpDown } from 'lucide-react';

export default function TabReports({ code, token, players, quarter, myState, myId }) {
  const [tab, setTab] = useState('is');
  const [selPlayer, setSelPlayer] = useState(myId);
  const [selQuarter, setSelQuarter] = useState(Math.max(1, quarter - 1) || 1);
  const [report, setReport] = useState(null);
  const [market, setMarket] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code || !token || selQuarter <= 0) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const r = await api.getReports(code, selQuarter, token);
        if (!alive) return;
        setMarket(r.market);
        if (selPlayer) setReport(r.report);
      } catch (e) { /* noop */ } finally {
        if (alive) setLoading(false);
      }
    })();
    (async () => {
      try {
        const l = await api.getLedger(code, { playerId: selPlayer, quarter: selQuarter, token });
        if (alive) setLedger(l?.entries || []);
      } catch (e) { /* noop */ }
    })();
    return () => { alive = false; };
  }, [code, token, selQuarter, selPlayer]);

  return (
    <div className="game-card">
      <div className="game-card-header flex-wrap gap-2">
        <div className="game-card-title">
          <FileBarChart size={14} className="text-amber-400" /> BÁO CÁO & SỔ CÁI
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="select select-bordered select-xs font-bold"
            value={selPlayer || ''} onChange={e => setSelPlayer(e.target.value)}>
            <option value="">--- Toàn bộ người chơi ---</option>
            {players?.map(p => (
              <option key={p.id} value={p.id}>{p.name} (#{p.seat})</option>
            ))}
          </select>
          <select className="select select-bordered select-xs font-bold"
            value={selQuarter} onChange={e => setSelQuarter(parseInt(e.target.value))}>
            {Array.from({ length: Math.max(1, quarter || 1) }).map((_, i) => (
              <option key={i} value={i + 1}>Quý {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-3 pt-2">
        <div className="tabs tabs-boxed tabs-sm w-full grid grid-cols-4">
          {[
            ['is',  <><Receipt   size={12}/><span className="ml-1 hidden md:inline">KQKD</span></>],
            ['bs',  <><Scale     size={12}/><span className="ml-1 hidden md:inline">BCT</span></>],
            ['cf',  <><ArrowUpDown size={12}/><span className="ml-1 hidden md:inline">LCTT</span></>],
            ['ldg', <><BookOpen  size={12}/><span className="ml-1 hidden md:inline">Sổ cái</span></>],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`tab tab-xs md:tab-sm flex-1 ${tab === k ? 'tab-active !bg-amber-500/20 !text-amber-300' : ''}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 text-xs">
        {loading && <div className="text-center p-4 text-slate-400 italic">Đang tải...</div>}
        {!loading && tab === 'is'  && <IncomeStatement report={report} selQuarter={selQuarter} selName={findName(players, selPlayer)} />}
        {!loading && tab === 'bs'  && <BalanceSheet report={report} selName={findName(players, selPlayer)} />}
        {!loading && tab === 'cf'  && <CashFlow report={report} selName={findName(players, selPlayer)} />}
        {!loading && tab === 'ldg' && <Ledger entries={ledger} />}
      </div>
    </div>
  );
}

function findName(players, id) {
  return players?.find(p => p.id === id)?.name;
}

/* Income Statement */
function IncomeStatement({ report, selQuarter, selName }) {
  if (!report) return noData(`KQKD Quý ${selQuarter}${selName ? ' của ' + selName : ''}`);
  const r = report;
  const revenue = r.revenue || r.REVENUE || 0;
  const cogs    = r.cogs    || r.COGS || 0;
  const wages   = r.wages   || r.WAGES || 0;
  const gross   = revenue - cogs - wages
                - (r.maintenance || r.MAINTENANCE || 0)
                - (r.rnd || r.RND || 0)
                - (r.hr || r.HR_COSTS || 0)
                - (r.depreciation || r.DEPRECIATION || 0);
  const interestIn  = r.interestIncome  || r.INTEREST_INCOME || 0;
  const interestExp = r.interestExpense || r.INTEREST_EXPENSE || 0;
  const otherIn  = (r.disposalGain||r.DISPOSAL_GAIN||0) + (r.revalGain||r.REVAL_GAIN||0) + (r.bargainGain||r.BARGAIN_GAIN||0);
  const otherOut = (r.disposalLoss||r.DISPOSAL_LOSS||0) + (r.revalLoss||r.REVAL_LOSS||0) + (r.fees||r.FEES||0) + (r.idleLandTax||r.IDLE_LAND_TAX||0);
  const ebit  = gross + interestIn - interestExp + otherIn - otherOut;
  const tax   = r.tax || r.TAX_EXPENSE || 0;
  const ni    = r.netIncome || r.NET_INCOME || (ebit - tax);

  const rows = [
    ['+ Doanh thu (Revenue)',                revenue, 'good'],
    ['− Giá vốn (COGS)',                   -cogs, 'bad'],
    ['− Lương nhân viên',                    -wages, 'bad'],
    ['− Bảo trì',                            -(r.maintenance||r.MAINTENANCE||0), 'bad'],
    ['− R&D / Tái đầu tư',                   -(r.rnd||r.RND||0), 'bad'],
    ['− Chi phí tuyển/thôi (HR)',            -(r.hr||r.HR_COSTS||0), 'bad'],
    ['− Khấu hao',                           -(r.depreciation||r.DEPRECIATION||0), 'bad'],
    ['────────── Lợi nhuận gộp (EBITDA-approx)', gross, gross>=0?'good':'bad'],
    ['+ Lãi tiền gửi',                       interestIn, 'good'],
    ['− Lãi vay & coupon TP',               -interestExp, 'bad'],
    ['+ Lãi khác (đánh giá lại, thanh lý...)', otherIn, otherIn>=0?'good':'bad'],
    ['− Chi phí khác + Thuế đất trống',     -otherOut, 'bad'],
    ['────────── EBIT trước thuế',            ebit, ebit>=0?'good':'bad'],
    ['− Thuế thu nhập doanh nghiệp (TNDN)',  -tax, 'bad'],
    ['══════════ LỢI NHUẬN SAU THUẾ',        ni, ni>=0?'good':'bad', true],
  ];
  return (
    <TableStatement title="BÁO CÁO KẾT QUẢ KINH DOANH" subtitle={selName} rows={rows} />
  );
}

/* Balance Sheet */
function BalanceSheet({ report, selName }) {
  if (!report?.balances && !report) return noData('Bảng cân đối');
  const b = report?.balances || report || {};
  const get = (k, d=0) => (b[k] != null && typeof b[k] === 'number') ? b[k] : d;
  const totalAssets =
    get('CASH') + get('DEPOSIT') + get('LAND') +
    Math.max(0, get('BUILDINGS') + get('ACC_DEPR')) +
    Math.max(0, get('GOODWILL'));
  const totalLiab =
    Math.abs(get('BANK_LOAN')) + Math.abs(get('BONDS_PAYABLE')) +
    Math.abs(get('TAX_PAYABLE')) + Math.abs(get('ARREARS'));
  const equity =
    get('PAID_IN_CAPITAL') + get('RETAINED_EARNINGS');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <StatementSide title="TÀI SẢN" tone="good" rows={[
        ['💵 Tiền mặt',            get('CASH')],
        ['🏦 Tiền gửi ngân hàng',  get('DEPOSIT')],
        ['🌾 Đất đai',              get('LAND')],
        ['🏢 Công trình (GTCL)',   Math.max(0, get('BUILDINGS') + get('ACC_DEPR'))],
        ['💠 Lợi thế thương mại',  Math.max(0, get('GOODWILL'))],
      ]} total={totalAssets} />
      <StatementSide title="NỢ PHẢI TRẢ" tone="bad" rows={[
        ['🏛️ Vay ngân hàng',       Math.abs(get('BANK_LOAN'))],
        ['📜 Trái phiếu phát hành',Math.abs(get('BONDS_PAYABLE'))],
        ['🧾 Thuế phải nộp',       Math.abs(get('TAX_PAYABLE'))],
        ['⚠️ Nợ quá hạn',          Math.abs(get('ARREARS'))],
      ]} total={totalLiab} />
      <StatementSide title="VỐN CHỦ SỞ HỮU" tone="amber" rows={[
        ['📈 Vốn góp',             get('PAID_IN_CAPITAL')],
        ['💸 Lợi nhuận giữ lại',   get('RETAINED_EARNINGS')],
      ]} total={equity} footer={`Tổng VCSH = Tài sản − Nợ = ${fmtMoney(totalAssets - totalLiab)}`} />
    </div>
  );
}

function StatementSide({ title, rows, total, tone, footer }) {
  const toneCls = {
    good: 'border-emerald-500/40 text-emerald-300',
    bad:  'border-rose-500/40 text-rose-300',
    amber:'border-amber-500/40 text-amber-300',
  }[tone];
  return (
    <div className={`rounded-lg border ${toneCls} bg-slate-900/50 p-3`}>
      <div className={`text-[10px] uppercase font-black tracking-widest pb-1.5 mb-2 border-b border-current border-opacity-25 ${toneCls}`}>
        {title}
      </div>
      <div className="space-y-1">
        {rows.map(([k,v]) => (
          <div key={k} className="flex justify-between items-center text-[11px] gap-2">
            <span className="text-slate-400 truncate">{k}</span>
            <span className="font-mono font-bold text-slate-200 tabular-nums whitespace-nowrap">{fmtMoney(v)}</span>
          </div>
        ))}
      </div>
      <div className={`mt-2 pt-1.5 border-t border-current border-opacity-25 flex justify-between items-baseline`}>
        <span className="text-[10px] uppercase font-black opacity-75">Tổng</span>
        <span className={`font-mono font-black tabular-nums ${toneCls.split(' ')[1]}`}>{fmtMoney(total)}</span>
      </div>
      {footer && <div className="mt-1 text-[10px] opacity-70">{footer}</div>}
    </div>
  );
}

/* Cash Flow */
function CashFlow({ report, selName }) {
  if (!report) return noData('Lưu chuyển tiền tệ');
  const r = report;
  const op =
    (r.operating || 0) ||
    ((r.revenue || r.REVENUE || 0) + (r.interestIncome || r.INTEREST_INCOME || 0))
    - ((r.cogs || r.COGS || 0) + (r.wages || r.WAGES || 0)
      + (r.maintenance || r.MAINTENANCE || 0) + (r.rnd || r.RND || 0)
      + (r.hr || r.HR_COSTS || 0) + (r.interestExpense || r.INTEREST_EXPENSE || 0)
      + (r.tax || r.TAX_EXPENSE || 0) + (r.idleLandTax || r.IDLE_LAND_TAX || 0));
  const inv = r.investing || 0;
  const fin = r.financing || 0;
  const net = op + inv + fin;

  return (
    <div className="space-y-2">
      <CfSection title="💼 Hoạt động kinh doanh (CFO)" tone="emerald" value={op} items={[
        ['Thu khách hàng (doanh thu + lãi gửi)', (+(r.revenue||r.REVENUE||0) + +(r.interestIncome||r.INTEREST_INCOME||0))],
        ['Chi NSKK (giá vốn, lương, bảo trì, R&D, HR)',
          -(+(r.cogs||r.COGS||0)+(r.wages||r.WAGES||0)+(r.maintenance||r.MAINTENANCE||0)+(r.rnd||r.RND||0)+(r.hr||r.HR_COSTS||0))],
        ['Chi lãi vay & TNDN & thuế đất trống',
          -(+(r.interestExpense||r.INTEREST_EXPENSE||0)+(r.tax||r.TAX_EXPENSE||0)+(r.idleLandTax||r.IDLE_LAND_TAX||0))],
      ]} />
      <CfSection title="📈 Hoạt động đầu tư (CFI)" tone="amber" value={inv} />
      <CfSection title="💰 Hoạt động tài chính (CFF)" tone="violet" value={fin} />
      <div className="rounded-lg border border-slate-700/60 p-3 bg-slate-900/60 flex justify-between items-center">
        <span className="text-[11px] uppercase font-black tracking-widest text-slate-300">Dòng tiền thuần (NET CF)</span>
        <span className={`font-mono font-black text-lg ${net>=0?'text-emerald-300':'text-rose-300'}`}>{fmtMoney(net)}</span>
      </div>
    </div>
  );
}
function CfSection({ title, tone, value, items }) {
  const map = { emerald:'emerald', amber:'amber', violet:'violet', rose:'rose' };
  const c = map[tone] || 'emerald';
  return (
    <div className={`rounded-lg border border-${c}-500/30 bg-${c}-500/5 p-3`}>
      <div className="flex justify-between items-baseline mb-1">
        <span className={`text-[11px] uppercase font-black tracking-widest text-${c}-300`}>{title}</span>
        <span className={`font-mono font-bold tabular-nums ${value>=0?'text-emerald-300':'text-rose-300'}`}>{fmtMoney(value)}</span>
      </div>
      {items && items.length > 0 && (
        <div className="space-y-0.5 border-l-2 border-slate-700/50 pl-3 mt-2">
          {items.map(([k,v]) => (
            <div key={k} className="flex justify-between text-[11px]">
              <span className="text-slate-400 truncate">{k}</span>
              <span className={`font-mono tabular-nums ${v>=0?'text-slate-200':'text-rose-300'}`}>{fmtMoney(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Ledger */
function Ledger({ entries }) {
  if (!entries || entries.length === 0) return noData('Sổ cái trống');
  return (
    <div className="rounded-lg border border-slate-700/60 overflow-hidden">
      <div className="grid grid-cols-12 bg-slate-800/80 text-[10px] uppercase font-black tracking-widest text-slate-300 px-2 py-2 gap-1">
        <div className="col-span-1">Q</div>
        <div className="col-span-3">Nội dung</div>
        <div className="col-span-2 text-right">Loại</div>
        <div className="col-span-2 text-right">Nợ</div>
        <div className="col-span-2 text-right">Có</div>
        <div className="col-span-2 text-right">Số dư</div>
      </div>
      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800 text-[11px]">
        {entries.map((e, i) => {
          const catLabel = CATEGORY_NAMES_VI[e.category] || e.category || 'Khác';
          const lines = e.lines || [];
          const dr = lines.reduce((s, l) => s + (l.dr || 0), 0);
          const cr = lines.reduce((s, l) => s + (l.cr || 0), 0);
          return (
            <div key={i} className="grid grid-cols-12 px-2 py-1.5 gap-1 items-start hover:bg-slate-800/40">
              <div className="col-span-1 text-slate-500 font-mono">{e.quarter}</div>
              <div className="col-span-3">
                <div className="font-bold text-slate-200 truncate">{e.memo}</div>
                {lines.length > 0 && (
                  <details className="mt-1 text-[10px]">
                    <summary className="cursor-pointer text-slate-500">{lines.length} bút toán</summary>
                    <div className="mt-1 space-y-0.5 pl-2 border-l border-slate-700">
                      {lines.map((l, j) => (
                        <div key={j} className="grid grid-cols-3 gap-1">
                          <span className="col-span-1 truncate text-slate-400">{ACCOUNT_NAMES_VI[l.account] || l.account}</span>
                          <span className="col-span-1 text-right text-rose-300 font-mono">{l.dr ? fmtMoney(l.dr) : ''}</span>
                          <span className="col-span-1 text-right text-emerald-300 font-mono">{l.cr ? fmtMoney(l.cr) : ''}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              <div className="col-span-2 text-right">
                <span className="badge badge-xs badge-ghost">{catLabel}</span>
              </div>
              <div className="col-span-2 text-right font-mono text-rose-300 tabular-nums">{dr ? fmtMoney(dr) : '—'}</div>
              <div className="col-span-2 text-right font-mono text-emerald-300 tabular-nums">{cr ? fmtMoney(cr) : '—'}</div>
              <div className="col-span-2 text-right font-mono text-amber-300 font-bold tabular-nums">
                {Math.abs(dr - cr) > 0.5 ? fmtMoney(dr - cr) : '='}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Utils */
function TableStatement({ title, subtitle, rows }) {
  return (
    <div>
      <div className="text-center mb-3">
        <div className="font-black uppercase tracking-widest text-slate-200 text-sm">{title}</div>
        {subtitle && <div className="text-[11px] text-slate-400 mt-0.5">Kỳ báo cáo: <b className="text-slate-200">{subtitle}</b></div>}
      </div>
      <div className="max-h-[380px] overflow-y-auto rounded-lg border border-slate-700/60">
        {rows.map(([k, v, tone, strong], i) => {
          const toneCls =
            tone === 'good' ? (v >= 0 ? 'text-emerald-300' : 'text-rose-300') :
            tone === 'bad'  ? 'text-slate-200' : 'text-slate-300';
          const isHeader = String(k).startsWith('─') || String(k).startsWith('═');
          return (
            <div key={i} className={`grid grid-cols-12 px-3 py-1.5 gap-2 text-[11px]
              ${isHeader ? 'bg-slate-800/60' : 'odd:bg-slate-900/40'}
              ${strong ? 'font-black border-t-2 border-slate-600 pt-2 mt-1' : ''}`}>
              <div className={`col-span-8 ${isHeader ? 'font-black text-slate-300 tracking-wide' : 'text-slate-300'}`}>{k}</div>
              <div className={`col-span-4 text-right font-mono tabular-nums ${toneCls} ${strong ? 'text-sm' : ''}`}>
                {typeof v === 'number' ? fmtMoney(v) : v}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function noData(title) {
  return (
    <div className="text-center text-xs italic text-slate-500 rounded-lg border border-dashed border-slate-700 p-8">
      <FileBarChart size={28} className="mx-auto mb-2 opacity-50" />
      Chưa có dữ liệu: {title}
      <div className="text-[10px] mt-1 opacity-60">Chọn quý đã chốt hoặc người chơi khác</div>
    </div>
  );
}
