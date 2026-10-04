import { CONFIG } from '../lib/config.js';

export default function Map({ plots, players, onPlotClick, selectedPlotId }) {
  if (!plots) return null;

  return (
    <div className="relative bg-slate-900 p-4 rounded-xl shadow-2xl border-4 border-slate-700 overflow-hidden">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="relative grid grid-cols-6 gap-2 aspect-square max-w-2xl mx-auto">
        {plots.map((plot) => {
          const owner = players.find(p => p.id === plot.ownerId);
          const isSelected = selectedPlotId === plot.id;
          const business = plot.business;
          
          return (
            <div
              key={plot.id}
              onClick={() => onPlotClick(plot)}
              className={`
                group relative cursor-pointer transition-all duration-300 rounded-lg flex flex-col items-center justify-center overflow-hidden border-2
                ${isSelected ? 'ring-4 ring-yellow-400 border-yellow-500 z-20 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-slate-700 hover:border-slate-500 hover:scale-105 z-10'}
                ${getPlotBg(plot)}
              `}
            >
              {/* Tier Label (Floating) */}
              {!owner && (
                <div className="absolute top-1 left-1 text-[8px] font-black uppercase opacity-40 text-slate-400">
                  {plot.tier}
                </div>
              )}

              {/* Owner Badge */}
              {owner && (
                <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold rounded-bl-md border-l border-b border-white/20">
                  {owner.name.substring(0, 3).toUpperCase()}
                </div>
              )}
              
              {/* Visual Content */}
              <div className="flex flex-col items-center justify-center w-full h-full p-1">
                {business ? (
                  <div className="flex flex-col items-center transform group-hover:scale-110 transition-transform duration-300">
                    <img 
                      src={getSectorIcon(business.sector, business.level)} 
                      alt={business.sector}
                      className="w-10 h-10 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
                    />
                    <div className="mt-1 flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-inner ${i < business.level ? 'bg-yellow-400' : 'bg-slate-600'}`}></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="opacity-20 flex flex-col items-center">
                    <div className="text-2xl mb-1">🏗️</div>
                    <span className="text-[8px] font-black tracking-tighter uppercase">{plot.tier}</span>
                  </div>
                )}
              </div>

              {/* Selection Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-yellow-400/10 animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPlotBg(plot) {
  if (plot.ownerId) {
    if (plot.business) {
      const b = plot.business;
      if (b.status === 'construction') return 'bg-gradient-to-br from-slate-700 to-slate-800';
      
      const gradients = {
        agri: 'from-emerald-600 to-emerald-900',
        real_estate: 'from-blue-600 to-blue-900',
        tech: 'from-indigo-600 to-indigo-900',
        tourism: 'from-amber-600 to-amber-900'
      };
      return `bg-gradient-to-br ${gradients[b.sector] || 'from-slate-600 to-slate-900'}`;
    }
    return 'bg-gradient-to-br from-slate-500 to-slate-700';
  }
  
  const tierBgs = {
    core: 'bg-slate-800 hover:bg-slate-700',
    mid: 'bg-slate-850 hover:bg-slate-800',
    edge: 'bg-slate-900 hover:bg-slate-850'
  };
  return tierBgs[plot.tier] || 'bg-slate-900';
}

function getSectorIcon(sector, level) {
  // Using Trae's text_to_image API for high-quality game icons
  const prompts = {
    agri: `game+icon+farm+building+level+${level}+isometric+3d+render+stylized+high+quality`,
    real_estate: `game+icon+office+building+level+${level}+isometric+3d+render+stylized+high+quality`,
    tech: `game+icon+data+center+laboratory+level+${level}+isometric+3d+render+stylized+high+quality`,
    tourism: `game+icon+resort+hotel+level+${level}+isometric+3d+render+stylized+high+quality`
  };
  
  const prompt = prompts[sector] || 'game+icon+building+isometric';
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
}
