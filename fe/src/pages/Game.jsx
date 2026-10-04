import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../lib/useGame.js';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Map from '../components/Map.jsx';
import Financials from '../components/Financials.jsx';
import ActionPanel from '../components/ActionPanel.jsx';

export default function Game() {
  const { code } = useParams();
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

  const { game, macro, dice, players, plots, myState, myPending, myApLeft, me } = data;

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
