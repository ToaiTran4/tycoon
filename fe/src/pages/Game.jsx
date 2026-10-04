import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../lib/useGame.js';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Map from '../components/Map.jsx';
import Financials from '../components/Financials.jsx';
import ActionPanel from '../components/ActionPanel.jsx';

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { data, error, conn, token, mutate } = useGame(code);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);

  useEffect(() => {
    if (data?.myPending) {
      handlePreview(data.myPending);
    }
  }, [data?.myPending]);

  if (error) return <div className="p-8 text-center text-error font-bold">Lỗi: {error}</div>;
  if (!data) return <div className="p-8 text-center opacity-50">Đang tải dữ liệu game...</div>;

  const { game, macro, dice, players, plots, myState, myApLeft, me } = data;
  const myPending = data.myPending || [];

  const handlePlotClick = (plot) => {
    setSelectedPlot(plot);
  };

  const handleAddAction = async (action) => {
    const newActions = [...myPending, action];
    try {
      await api.putActions(code, newActions, token);
      mutate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRemoveAction = async (index) => {
    const newActions = myPending.filter((_, i) => i !== index);
    try {
      await api.putActions(code, newActions, token);
      mutate();
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePreview = async (actions) => {
    try {
      const res = await api.previewActions(code, actions, token);
      setPreviewResult(res);
    } catch (e) {
      console.warn('Preview failed', e);
    }
  };

  const handleReady = async (ready) => {
    try {
      await api.setReady(code, ready, token);
      mutate();
    } catch (e) {
      alert(e.message);
    }
  };

  if (game?.status === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-300 p-4">
        <div className="card bg-base-100 shadow-xl w-full max-w-lg border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center">Phòng chờ: {game.code}</h2>
            <div className="divider"></div>
            <div className="flex flex-col gap-2 mb-6">
              <span className="text-sm font-bold opacity-60 uppercase">Người chơi ({players.length})</span>
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-base-200 px-3 py-2 rounded-lg">
                  <span className="font-bold">{p.name} {p.id === game.hostPlayerId ? '👑' : ''}</span>
                  <span className={p.status === 'active' ? 'text-success' : 'text-error'}>{p.status}</span>
                </div>
              ))}
            </div>
            {me?.id === game.hostPlayerId ? (
              <button 
                onClick={() => api.startGame(code, token).then(mutate).catch(e => alert(e.message))}
                className="btn btn-primary w-full"
                disabled={players.length < 2}
              >
                Bắt đầu Game
              </button>
            ) : (
              <div className="text-center italic opacity-60">Đang chờ chủ phòng bắt đầu...</div>
            )}
            <button onClick={() => navigate('/')} className="btn btn-ghost btn-sm mt-4">Thoát</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300 p-2 md:p-4">
      <Header game={game} macro={macro} dice={dice} conn={conn} />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Financials & Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Financials myState={myState} />
          
          <div className="bg-base-100 p-4 rounded-box shadow-md">
            <Map 
              plots={plots} 
              players={players} 
              onPlotClick={handlePlotClick} 
              selectedPlotId={selectedPlot?.id} 
            />
          </div>
        </div>

        {/* Right Column: Actions & Info */}
        <div className="lg:col-span-4 flex flex-col gap-4">
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
            meReady={me?.ready}
          />
        </div>
      </div>

      {/* Footer / Info */}
      <div className="mt-8 text-center text-[10px] opacity-40">
        Chest Tycoon Engine v1.0 • {new Date(data.now).toLocaleString()}
      </div>
    </div>
  );
}
