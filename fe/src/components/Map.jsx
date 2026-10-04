import { CONFIG } from '../../../be/src/engine/config.js';

export default function Map({ plots, players, onPlotClick, selectedPlotId }) {
  if (!plots) return null;

  return (
    <div className="grid grid-cols-6 gap-1 bg-base-300 p-1 rounded-lg aspect-square max-w-2xl mx-auto border-2 border-base-300 shadow-inner">
      {plots.map((plot) => {
        const owner = players.find(p => p.id === plot.ownerId);
        const isSelected = selectedPlotId === plot.id;
        
        return (
          <div
            key={plot.id}
            onClick={() => onPlotClick(plot)}
            className={`
              relative cursor-pointer transition-all duration-200 aspect-square rounded-sm flex flex-col items-center justify-center text-[10px] overflow-hidden
              ${isSelected ? 'ring-2 ring-primary z-10 scale-105 shadow-lg' : 'hover:brightness-110'}
              ${getPlotBg(plot)}
            `}
          >
            {/* Owner badge */}
            {owner && (
              <div className="absolute top-0 right-0 px-1 bg-black/40 text-white font-bold rounded-bl-sm">
                {owner.name[0]}
              </div>
            )}
            
            {/* Business info */}
            {plot.business ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg leading-none">{getSectorEmoji(plot.business.sector)}</span>
                <div className="flex gap-0.5">
                  {[...Array(plot.business.level)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="opacity-30 font-bold uppercase tracking-tighter">
                {plot.tier[0]}
              </span>
            )}

            {/* Price indicator if it's a listing */}
            {/* (This could be expanded later) */}
          </div>
        );
      })}
    </div>
  );
}

function getPlotBg(plot) {
  if (plot.ownerId) {
    if (plot.business) {
      const colors = {
        agri: 'bg-emerald-500 text-emerald-50',
        real_estate: 'bg-blue-500 text-blue-50',
        tech: 'bg-indigo-500 text-indigo-50',
        tourism: 'bg-amber-500 text-amber-50'
      };
      return colors[plot.business.sector] || 'bg-slate-500';
    }
    return 'bg-slate-300';
  }
  
  const tierBgs = {
    core: 'bg-base-200',
    mid: 'bg-base-100',
    edge: 'bg-base-50'
  };
  return tierBgs[plot.tier] || 'bg-base-100';
}

function getSectorEmoji(sector) {
  const emojis = {
    agri: '🌾',
    real_estate: '🏢',
    tech: '💻',
    tourism: '🏖️'
  };
  return emojis[sector] || '❓';
}
