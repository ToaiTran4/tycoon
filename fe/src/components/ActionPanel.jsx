import { useState } from 'react';
import { CONFIG } from '../lib/config.js';
import { fmtMoney } from '../lib/format.js';

export default function ActionPanel({ selectedPlot, myState, myPending, myApLeft, onAddAction, onRemoveAction, onPreview, previewResult, onReady, meReady }) {
  const [activeTab, setActiveTab] = useState('build');
  const [amount, setAmount] = useState('');
  const [sector, setSector] = useState('agri');

  const handleAdd = (type, extra = {}) => {
    if (myApLeft <= 0) return;
    onAddAction({ type, ...extra });
  };

  return (
    <div className="card bg-base-100 shadow-md border border-base-300 h-full">
      <div className="card-body p-4 gap-4">
        <div className="flex justify-between items-center">
          <h2 className="card-title text-sm uppercase tracking-widest opacity-60">Hành động ({myApLeft} AP)</h2>
          <button 
            onClick={() => onReady(!meReady)}
            className={`btn btn-sm ${meReady ? 'btn-success' : 'btn-outline btn-primary'}`}
          >
            {meReady ? 'Đã sẵn sàng' : 'Sẵn sàng'}
          </button>
        </div>

        {/* Selected Plot Context */}
        <div className="bg-base-200 p-3 rounded-lg text-xs">
          {selectedPlot ? (
            <div>
              <div className="font-bold">Ô đất #{selectedPlot.id} ({selectedPlot.tier})</div>
              <div>Chủ: {selectedPlot.ownerId === myState?.id ? 'Bạn' : (selectedPlot.ownerId || 'Chưa có')}</div>
              {selectedPlot.business && (
                <div className="text-primary font-bold">
                  {CONFIG.sectors[selectedPlot.business.sector].name} Lvl {selectedPlot.business.level}
                </div>
              )}
            </div>
          ) : (
            <div className="opacity-50 italic">Chọn một ô trên bản đồ để thực hiện hành động</div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed tabs-sm justify-center">
          <button onClick={() => setActiveTab('build')} className={`tab ${activeTab === 'build' ? 'tab-active' : ''}`}>Xây/Sửa</button>
          <button onClick={() => setActiveTab('finance')} className={`tab ${activeTab === 'finance' ? 'tab-active' : ''}`}>Tài chính</button>
          <button onClick={() => setActiveTab('land')} className={`tab ${activeTab === 'land' ? 'tab-active' : ''}`}>Đất đai</button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'build' && selectedPlot && selectedPlot.ownerId === myState?.id && (
            <div className="flex flex-col gap-2">
              {!selectedPlot.business ? (
                <>
                  <select className="select select-bordered select-sm w-full" value={sector} onChange={e => setSector(e.target.value)}>
                    {Object.keys(CONFIG.sectors).map(s => (
                      <option key={s} value={s}>{CONFIG.sectors[s].name}</option>
                    ))}
                  </select>
                  <button onClick={() => handleAdd('build', { plotId: selectedPlot.id, sector })} className="btn btn-primary btn-sm">Xây mới</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleAdd('upgrade', { plotId: selectedPlot.id })} className="btn btn-primary btn-sm" disabled={selectedPlot.business.level >= 3}>Nâng cấp</button>
                  <div className="divider my-0"></div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold opacity-60">Tái đầu tư (R&D)</span>
                    <div className="flex gap-1">
                      {[0, 0.03, 0.06, 0.1].map(r => (
                        <button key={r} onClick={() => handleAdd('setReinvest', { plotId: selectedPlot.id, rate: r })} className="btn btn-xs flex-1">{r*100}%</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="flex flex-col gap-2">
              <input type="number" placeholder="Số tiền..." className="input input-bordered input-sm w-full" value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const val = parseInt(amount);
                    if (!isNaN(val) && val > 0) handleAdd('deposit', { amount: val });
                  }} 
                  className="btn btn-outline btn-sm"
                >
                  Gửi tiền
                </button>
                <button 
                  onClick={() => {
                    const val = parseInt(amount);
                    if (!isNaN(val) && val > 0) handleAdd('withdraw', { amount: val });
                  }} 
                  className="btn btn-outline btn-sm"
                >
                  Rút tiền
                </button>
                <button 
                  onClick={() => {
                    const val = parseInt(amount);
                    if (!isNaN(val) && val > 0) handleAdd('borrow', { amount: val });
                  }} 
                  className="btn btn-outline btn-sm"
                >
                  Vay Bank
                </button>
                <button 
                  onClick={() => {
                    const val = parseInt(amount);
                    if (!isNaN(val) && val > 0) handleAdd('issueBond', { amount: val, term: 8 });
                  }} 
                  className="btn btn-outline btn-sm"
                >
                  Phát hành TP
                </button>
              </div>
            </div>
          )}

          {activeTab === 'land' && selectedPlot && (
            <div className="flex flex-col gap-2">
              {!selectedPlot.ownerId ? (
                <div className="flex flex-col gap-2">
                  <input type="number" placeholder="Giá đấu..." className="input input-bordered input-sm w-full" value={amount} onChange={e => setAmount(e.target.value)} />
                  <button 
                    onClick={() => {
                      const val = parseInt(amount);
                      if (!isNaN(val) && val > 0) handleAdd('bid', { plotId: selectedPlot.id, amount: val });
                    }} 
                    className="btn btn-primary btn-sm"
                  >
                    Đấu giá
                  </button>
                </div>
              ) : selectedPlot.ownerId === myState?.id ? (
                <button onClick={() => handleAdd('sellPlot', { plotId: selectedPlot.id })} className="btn btn-error btn-sm">Rao bán</button>
              ) : (
                <button onClick={() => handleAdd('claimIdle', { plotId: selectedPlot.id })} className="btn btn-warning btn-sm">Mua lại ô bỏ trống</button>
              )}
            </div>
          )}
        </div>

        {/* Pending Actions */}
        <div className="mt-auto pt-4 border-t border-base-300">
          <div className="text-[10px] font-bold opacity-60 mb-2 uppercase">Hành động đã chọn</div>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {myPending?.map((act, i) => (
              <div key={i} className="flex justify-between items-center bg-base-200 px-2 py-1 rounded text-xs">
                <span>{act.type} {act.plotId != null ? `#${act.plotId}` : ''} {act.amount ? fmtMoney(act.amount) : ''}</span>
                <button onClick={() => onRemoveAction(i)} className="btn btn-ghost btn-xs text-error">×</button>
              </div>
            ))}
            {(!myPending || myPending.length === 0) && <div className="text-[10px] opacity-40 italic">Chưa có hành động nào</div>}

          </div>
        </div>

        {/* Preview Results */}
        {previewResult && (
          <div className="mt-2 p-2 bg-info/10 rounded text-[10px] border border-info/20">
            <div className="font-bold text-info">Dự kiến sau khi chốt:</div>
            <div>Tiền mặt: {fmtMoney(previewResult.cashAfter)}</div>
            {previewResult.warnings?.length > 0 && (
              <div className="text-warning mt-1">
                ⚠️ {previewResult.warnings[0]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
