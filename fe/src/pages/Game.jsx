import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../lib/useGame.js';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import GameMap from '../components/Map.jsx';
import Financials from '../components/Financials.jsx';
import ActionPanel from '../components/ActionPanel.jsx';
import MarketPanel from '../components/MarketPanel.jsx';
import TabReports from '../components/TabReports.jsx';
import TabRanking from '../components/TabRanking.jsx';
import ResultScreen from '../components/ResultScreen.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, Share2, AlertTriangle, ArrowLeft,
  Crown, Play, Building2, ClipboardList, BarChart3, ChevronDown
} from 'lucide-react';
import { seatColor } from '../lib/config.js';
import { toast, Toaster } from 'sonner';
import { fmtMoney } from '../lib/format.js';

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data, error, conn, token, mutate } = useGame(code);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [bottomTab, setBottomTab] = useState('ranking');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');

  // Auto preview my pending actions on change
  useEffect(() => {
    if (data?.myPending && data.myPending.length > 0) {
      handlePreview(data.myPending);
    } else {
      setPreviewResult(null);
    }
  }, [data?.myPending]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="game-card max-w-lg w-full p-6 text-center">
          <AlertTriangle size={36} className="mx-auto text-rose-400 mb-2" />
          <h2 className="text-xl font-black text-rose-400 mb-2">Lỗi tải game</h2>
          <p className="text-slate-300 text-sm mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <ArrowLeft size={16} className="mr-2" /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto mb-3" />
          <div className="text-slate-300 font-bold">Đang tải dữ liệu game...</div>
          <div className="text-xs text-slate-500 mt-1">Mã phòng: <b className="font-mono">{code}</b></div>
        </div>
      </div>
    );
  }

  const { game, macro, dice, players, plots, listings, myState, ranking, finished, macroHistory, activeEvents } = data;
  const myPending = Array.isArray(data.myPending) ? data.myPending : [];
  const myApLeft = typeof data.myApLeft === 'number' ? data.myApLeft : 3;
  const me = data.me;
  const myId = me?.playerId;
  const Q = game?.quarter || 0;

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="game-card max-w-lg w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 ring-2 ring-rose-500/30 grid place-items-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-rose-400" />
          </div>
          <h2 className="text-2xl font-black text-rose-400 mb-2">Không tìm thấy ván game</h2>
          <p className="text-slate-300 text-sm mb-2">Mã phòng: <b className="font-mono text-amber-300">{code}</b></p>
          <p className="text-slate-400 text-xs mb-5 leading-relaxed">
            Ván game này chưa được tạo, đã bị xóa hoặc vượt quá thời gian lưu trữ.
            Vui lòng tạo ván mới từ trang chủ.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => navigate('/')} className="btn btn-primary">
              <ArrowLeft size={16} className="mr-2" /> Về trang chủ
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-ghost">
              🔄 Tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (game?.status === 'finished' || finished) {
    return (
      <>
        <ResultScreen
          code={game?.code}
          ranking={ranking}
          players={players}
          totalQuarters={game?.totalQuarters}
          onHome={() => navigate('/')}
        />
        <Toaster richColors position="top-right" closeButton theme="dark" />
      </>
    );
  }

  // Lobby screen
  if (game?.status === 'lobby') {
    return <LobbyScreen code={game.code} players={players} me={me} game={game} token={token}
                  onStart={() => api.startGame(code, token).then(mutate).catch(e => toast.error(e.message))}
                  onHome={() => navigate('/')}
                  copyMsg={copyMsg} setCopyMsg={setCopyMsg} />;
  }

  const handlePlotClick = (plot) => setSelectedPlot(plot);

  const handleAddAction = async (action) => {
    const newActions = [...myPending, action];
    try {
      await api.putActions(code, newActions, token);
      toast.success(`Đã thêm hành động: ${labelAction(action)}`);
      mutate();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleRemoveAction = async (index) => {
    const newActions = myPending.filter((_, i) => i !== index);
    try {
      await api.putActions(code, newActions, token);
      mutate();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handlePreview = async (actions) => {
    try {
      const res = await api.previewActions(code, actions, token);
      setPreviewResult(res);
    } catch (e) {
      // Silent
    }
  };

  const handleReady = async (ready) => {
    try {
      await api.setReady(code, ready, token);
      toast(ready ? 'Bạn đã sẵn sàng cho quý này' : 'Đã hủy trạng thái sẵn sàng');
      mutate();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleResolve = async () => {
    try {
      await api.resolve(code, token);
      toast.success('⏭ Đã yêu cầu chốt quý ngay!');
      mutate();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const isBankrupt = myState?.status === 'bankrupt' || myState?.status === 'acquired';

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-5 relative">
      <Toaster richColors position="top-right" closeButton theme="dark" />

      {/* Bankrupt / eliminated banner */}
      <AnimatePresence>
        {isBankrupt && (
          <motion.div
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="sticky top-2 z-50 mb-3 max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-rose-900/90 backdrop-blur px-4 py-3 shadow-2xl flex items-center gap-4">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-rose-500/20 grid place-items-center text-rose-300 animate-pulse">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-rose-300 uppercase tracking-wide">
                  ⚠️ {myState?.status === 'acquired' ? 'Công ty của bạn đã bị thâu tóm' : 'Bạn đã bị phá sản!'}
                </div>
                <div className="text-xs text-rose-200/80 mt-0.5">
                  Bạn đang ở chế độ khán giả — vẫn xem được bảng xếp hạng, báo cáo, thị trường nhưng không thể thực hiện hành động nào.
                </div>
              </div>
              <span className="badge badge-xs badge-error font-black">KHÁN GIẢ</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-[1600px] mx-auto">
        <Header game={game} macro={macro} dice={dice} conn={conn}
                players={players} me={me} onResolve={handleResolve} />
      </div>

      {/* Main 3-column layout */}
      <div className="max-w-[1600px] mx-auto mt-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT: Market + Financials */}
        <div className="xl:col-span-3 flex flex-col gap-4 order-2 xl:order-1">
          <MarketPanel
            macro={macro} macroHistory={macroHistory}
            activeEvents={activeEvents} listings={listings}
            dice={dice} players={players} myState={myState}
          />
        </div>

        {/* MIDDLE: Financials + Map  */}
        <div className="xl:col-span-6 flex flex-col gap-4 order-1 xl:order-2">
          <Financials myState={myState} quarter={game.quarter} compact />
          <div className="game-card p-3 md:p-5">
            <GameMap
              plots={plots} players={players} listings={listings}
              onPlotClick={handlePlotClick}
              selectedPlotId={selectedPlot?.id} myId={myId}
            />
          </div>
        </div>

        {/* RIGHT: Action Panel */}
        <div className="xl:col-span-3 order-3">
          <ActionPanel
            selectedPlot={selectedPlot}
            myState={myState}
            myPending={myPending}
            myApLeft={myApLeft}
            onAddAction={handleAddAction}
            onRemoveAction={handleRemoveAction}
            onPreview={handlePreview}
            previewResult={previewResult}
            onReady={handleReady}
            meReady={!!me?.ready}
            disabled={isBankrupt}
            quarter={game.quarter}
          />
        </div>
      </div>

      {/* Bottom Tabs: Reports / Ranking */}
      <div className="max-w-[1600px] mx-auto mt-4">
        <div className="game-card">
          <div className="game-card-header flex-wrap gap-2">
            <div className="game-card-title">
              <ClipboardList size={14} className="text-amber-400" /> THÔNG TIN CHI TIẾT
            </div>
            <button onClick={() => setDetailsOpen(value => !value)}
              className="btn btn-ghost btn-xs text-slate-400 hover:text-amber-300"
              title={detailsOpen ? 'Ẩn thông tin chi tiết' : 'Mở thông tin chi tiết'}
              aria-label={detailsOpen ? 'Ẩn thông tin chi tiết' : 'Mở thông tin chi tiết'}>
              <ChevronDown size={16} className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {detailsOpen && <div className="p-2 md:p-4">
            <div className="tabs tabs-boxed tabs-sm mb-3 w-fit">
              <button onClick={() => setBottomTab('ranking')}
                className={`tab ${bottomTab==='ranking' ? 'tab-active !bg-amber-500/20 !text-amber-300' : ''}`}>
                <BarChart3 size={13} className="mr-1.5" /> Xếp hạng & Thống kê
              </button>
              <button onClick={() => setBottomTab('reports')}
                className={`tab ${bottomTab==='reports' ? 'tab-active !bg-amber-500/20 !text-amber-300' : ''}`}>
                <Building2 size={13} className="mr-1.5" /> Báo cáo & Sổ cái
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={bottomTab}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
              >
                {bottomTab === 'ranking' && (
                  <TabRanking
                    players={enrichPlayers(players, myState)}
                    myId={myId}
                    finished={finished || game.status === 'finished'}
                    ranking={ranking}
                    plots={plots}
                    macro={macro}
                  />
                )}
                {bottomTab === 'reports' && (
                  <TabReports
                    code={code} token={token}
                    players={players}
                    quarter={game.quarter}
                    myState={myState}
                    myId={myId}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pb-6 text-center">
        <div className="inline-flex items-center gap-3 text-[11px] text-slate-500 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-full">
          <span>🏢 <b className="text-slate-400">Chest · Tycoon Kinh Tế</b> Engine</span>
          <span className="opacity-40">•</span>
          <span>Build: {data.version} · {new Date(data.now).toLocaleString('vi-VN')}</span>
          <span className="opacity-40">•</span>
          <button onClick={() => navigate('/')} className="link link-hover flex items-center gap-1">
            <ArrowLeft size={12}/> Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============= Lobby screen ============= */
function LobbyScreen({ code, players, me, game, token, onStart, onHome, copyMsg, setCopyMsg }) {
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/game/${code}` : '';
  const isHost = me?.playerId === game.hostPlayerId;
  const host = players?.find(p => p.id === game.hostPlayerId);

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); setCopyMsg('code'); setTimeout(() => setCopyMsg(''), 2000); } catch(e) { alert('Không thể sao chép: ' + code); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); setCopyMsg('link'); setTimeout(() => setCopyMsg(''), 2000); } catch(e) { alert('Không thể sao chép: ' + shareLink); }
  };

  return (
    <div className="min-h-screen py-6 px-3 md:py-10 flex flex-col items-center">
      <Toaster richColors position="top-right" closeButton theme="dark" />
      <div className="w-full max-w-3xl space-y-5 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-700/70 backdrop-blur mb-3">
            <Users size={14} className="text-blue-400" />
            <span className="text-[11px] uppercase font-black tracking-widest text-slate-400">SẢNH CHỜ · 2–6 NGƯỜI</span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">
              PHÒNG CHỜ
            </span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2 flex items-center gap-3">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Mã phòng</span>
              <span className="font-mono font-black text-xl text-amber-300 tracking-[0.2em]">{code}</span>
              <button onClick={copyCode} className="btn btn-ghost btn-xs" title="Sao chép mã">
                <Copy size={14} /> {copyMsg === 'code' ? '✓' : ''}
              </button>
            </div>
            <button onClick={copyLink} className="btn btn-sm btn-outline gap-1.5">
              <Share2 size={14} /> {copyMsg === 'link' ? 'Đã sao chép!' : 'Sao chép link'}
            </button>
          </div>
          {shareLink && (
            <div className="mt-2 text-xs text-slate-500 font-mono truncate max-w-md mx-auto bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-800">
              {shareLink}
            </div>
          )}
        </motion.div>

        {/* Game settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="game-card p-4 md:p-5 grid grid-cols-3 gap-3 text-center text-xs">
          <Stat label="Tổng số quý" value={`${game.totalQuarters} quý`} sub={`~${Math.ceil(game.totalQuarters/4)} năm`} />
          <Stat label="Thời gian / quý" value={game.quarterSeconds > 0 ? `${game.quarterSeconds}s` : '∞'} sub={game.quarterSeconds > 0 ? 'Tự động chốt khi hết giờ' : 'Bấm Sẵn sàng để chốt'} />
          <Stat label="Hiện có" value={`${players?.length || 0} / 6`} sub={isHost ? 'Bạn là chủ phòng' : host ? `Chủ: ${host.name}` : ''} />
        </motion.div>

        {/* Player list */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="game-card overflow-hidden">
          <div className="game-card-header">
            <div className="game-card-title">
              <Users size={14} className="text-amber-400" /> DANH SÁCH NGƯỜI CHƠI
            </div>
            <span className={`badge badge-sm font-bold ${players?.length >= 2 ? 'badge-success' : 'badge-warning'}`}>
              {players?.length || 0} người
            </span>
          </div>
          <div className="p-4 space-y-2 min-h-[180px]">
            {(players || []).length === 0 && (
              <div className="text-center text-slate-500 italic py-6">Chưa có người chơi nào...</div>
            )}
            {(players || []).map((p, i) => {
              const sc = seatColor(p.seat);
              const isMe = me?.playerId === p.id;
              const isHostPlayer = game.hostPlayerId === p.id;
              return (
                <motion.div key={p.id || i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.05 }}
                  className={`flex items-center gap-3 rounded-xl border bg-slate-900/50 px-4 py-3 transition-all
                    ${isMe ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30' : 'border-slate-700/70 hover:border-slate-600'}`}
                >
                  <div className={`w-12 h-12 rounded-xl grid place-items-center font-black text-lg ring-2 ring-offset-2 ring-offset-slate-900 shadow-inner ${sc.bg} ${sc.fg} ${sc.ring}`}>
                    {p.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-100 text-base truncate">
                      {p.name}
                      {isMe && <span className="ml-2 badge badge-xs badge-warning">BẠN</span>}
                    </div>
                    <div className="text-[11px] text-slate-500">Ghế #{p.seat}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHostPlayer && (
                      <div className="badge badge-sm badge-warning gap-1 font-bold">
                        <Crown size={11} /> CHỦ PHÒNG
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 6 - (players?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/20 px-4 py-3 opacity-50">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-700 grid place-items-center text-2xl text-slate-600">?</div>
                <div className="text-slate-500 italic text-sm">Chờ người chơi #{(players?.length || 0) + i + 1} tham gia...</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {isHost ? (
            <button
              onClick={onStart}
              disabled={(players?.length || 0) < 2}
              className={`btn-game btn btn-lg border-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-glow-emerald
                ${(players?.length || 0) < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play size={18} className="mr-2" />
              BẮT ĐẦU GAME ({players?.length || 0}/6 người)
            </button>
          ) : (
            <div className="stat-chip !text-sm !py-2 !px-4 italic text-slate-400">
              Đang chờ chủ phòng <b className="text-slate-200 mx-1">{host?.name || ''}</b> bắt đầu ván...
            </div>
          )}
          <button onClick={onHome} className="btn-game btn btn-lg btn-ghost">
            <ArrowLeft size={16} className="mr-2" /> Về trang chủ
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* ========== Helpers ========== */
function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-3">
      <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">{label}</div>
      <div className="font-mono font-bold text-base text-slate-100 tabular-nums mt-1">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function enrichPlayers(players, myState) {
  if (!players) return [];
  return players.map(p => {
    if (myState && p.id === myState.id) return { ...p, ...myState };
    return p;
  });
}

function labelAction(a) {
  const names = {
    withdraw: 'Rút tiền gửi', deposit: 'Gửi tiết kiệm',
    borrow: 'Vay ngân hàng', repay: 'Trả nợ',
    issueBond: 'Phát hành trái phiếu', issueShares: 'Phát hành CP',
    bid: 'Đấu giá đất', build: 'Xây công trình',
    upgrade: 'Nâng cấp', convert: 'Đổi ngành',
    sellPlot: 'Bán ô đất', claimIdle: 'Mua lại ô bỏ trống',
    setWorkers: 'Điều chỉnh nhân công', setReinvest: 'Đặt tỷ lệ R&D',
  };
  let s = names[a.type] || a.type;
  if (a.plotId != null) s += ` #${a.plotId}`;
  if (a.amount != null) s += ` · ${fmtMoney(a.amount)}`;
  return s;
}
