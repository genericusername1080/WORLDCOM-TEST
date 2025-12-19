
import React, { useState, useEffect } from 'react';
import { Search, Book, User, Wind, Activity, Sun, Cloud, CloudRain, Clock, Target, Briefcase, TrendingUp, AlertTriangle, Loader2, X, BarChart3, Keyboard, MousePointer, Eye, Hand } from 'lucide-react';
import { DecisionPoint, GameLevel, EvidenceItem } from '../types';
import { WORLD_IMPACT } from '../constants';
import { searchRelevantEvidence } from '../services/geminiService';

interface HUDProps {
  decisionPoints: DecisionPoint[];
  progress: number;
  stockPrice: number;
  suspicion: number;
  isVisible: boolean;
  weather: 'clear' | 'cloudy' | 'rainy';
  timeOfDay: number;
  currentLevel: GameLevel;
  hoveredItem: EvidenceItem | null;
  onToggleWeather: () => void;
  onAdvanceTime: () => void;
  onOpenQuiz: () => void;
  onOpenTimeline: () => void;
  onOpenKnowledge: () => void;
  onOpenMarket: () => void;
  onCheckCompletion: () => void;
  currentDate: string;
}

const HUD: React.FC<HUDProps> = ({ 
  decisionPoints, 
  progress, 
  stockPrice,
  suspicion,
  isVisible,
  weather,
  timeOfDay,
  currentLevel,
  hoveredItem,
  onToggleWeather,
  onAdvanceTime,
  onOpenQuiz, 
  onOpenTimeline, 
  onOpenKnowledge, 
  onOpenMarket,
  currentDate 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filteredIds, setFilteredIds] = useState<string[] | null>(null);

  const WeatherIcon = weather === 'clear' ? Sun : weather === 'cloudy' ? Cloud : CloudRain;
  
  const formatTime = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:00 ${ampm}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
        setFilteredIds(null);
        return;
    }
    
    setIsSearching(true);
    const docs = decisionPoints.map(d => ({
        id: d.id,
        title: d.title,
        content: d.problem
    }));
    
    const ids = await searchRelevantEvidence(searchQuery, docs);
    setFilteredIds(ids);
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
  };

  const clearSearch = () => {
      setSearchQuery('');
      setFilteredIds(null);
  };

  const displayedPoints = decisionPoints.filter(d => 
    filteredIds === null || filteredIds.includes(d.id)
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 overflow-hidden">
      
      {/* Reticle & Interaction Prompt */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 transition-opacity duration-300">
          <div className={`w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] ${hoveredItem ? 'scale-150 bg-emerald-400' : 'opacity-50'}`} />
          {hoveredItem && (
            <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-200 flex flex-col items-center">
                 <div className="bg-black/80 backdrop-blur border border-emerald-500/50 px-4 py-2 rounded flex items-center gap-3">
                     <div className="w-6 h-6 bg-slate-800 border border-slate-600 rounded flex items-center justify-center text-white font-bold text-xs">E</div>
                     <span className="text-emerald-400 font-orbitron text-xs tracking-widest uppercase font-bold">INSPECT EVIDENCE</span>
                 </div>
                 <div className="mt-2 text-white font-bold text-sm bg-black/50 px-3 py-1 rounded shadow-lg">{hoveredItem.name}</div>
            </div>
          )}
      </div>

      {/* Controls Info (Bottom Left) */}
      <div className={`fixed bottom-6 left-6 pointer-events-auto transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-32'}`}>
         <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-lg shadow-xl">
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Keyboard size={12} /> Controls
             </div>
             <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono text-slate-300">
                 <div className="flex items-center gap-2"><span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 text-white">W,A,S,D</span> Move</div>
                 <div className="flex items-center gap-2"><span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 text-white">MOUSE</span> Look</div>
                 <div className="flex items-center gap-2"><span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 text-white">E</span> Interact</div>
                 <div className="flex items-center gap-2"><span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600 text-white">TAB</span> Toggle HUD</div>
             </div>
         </div>
      </div>

      {/* Top Bar */}
      <div className={`flex justify-between items-start pointer-events-auto transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-32'}`}>
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-lg flex gap-8 font-mono text-sm shadow-xl min-w-[300px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-sky-400">
              <Briefcase size={24} />
            </div>
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{currentLevel.rank}</div>
              <div className="text-white font-bold">{currentLevel.title}</div>
            </div>
          </div>
          <div className="opacity-50 border-r border-slate-700" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Suspicion Level</div>
              <div className={`text-[10px] font-bold ${suspicion > 70 ? 'text-red-500' : 'text-emerald-400'}`}>{suspicion}%</div>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-700 ${suspicion > 70 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${suspicion}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-lg text-right font-mono shadow-xl flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-white text-lg font-bold">{currentDate}</div>
            <div className="text-slate-400 text-sm font-bold flex items-center gap-2">
              <Clock size={14} className="text-sky-400" /> {formatTime(timeOfDay)}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onToggleWeather} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <WeatherIcon size={18} />
            </button>
            <button onClick={onAdvanceTime} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Clock size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stock Ticker (Center Top) */}
      <div className={`absolute top-32 left-1/2 -translate-x-1/2 bg-slate-950/90 border-2 ${stockPrice > 20 ? 'border-emerald-500' : 'border-red-500'} px-8 py-4 rounded-full flex items-center gap-6 transition-transform duration-500 pointer-events-auto shadow-2xl ${isVisible ? 'translate-y-0' : '-translate-y-96'}`}>
        <div className="text-center">
           <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">WCOM Stock</div>
           <div className={`text-3xl font-black font-orbitron ${stockPrice > 20 ? 'text-emerald-400' : 'text-red-500'}`}>${stockPrice.toFixed(2)}</div>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div className="text-center">
           <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Wall St Target</div>
           <div className="text-xl font-bold text-white font-mono">{currentLevel.targetEPS}</div>
        </div>
      </div>

      {/* Side Panels (Decisions List) */}
      <div className="flex justify-between items-center h-full my-4 relative pointer-events-none">
        <div className={`w-72 h-2/3 flex flex-col pointer-events-auto transition-transform duration-500 ease-in-out ${isVisible ? 'translate-x-0' : '-translate-x-[110%]'}`}>
          <div className="bg-slate-900/90 border border-red-500/30 p-3 rounded-t-xl backdrop-blur-xl flex items-center justify-between shadow-2xl">
            <span className="font-orbitron text-red-400 text-[10px] tracking-[0.2em] flex items-center gap-2 uppercase font-bold">
              <AlertTriangle size={14} /> Critical Decisions
            </span>
          </div>
          
          {/* Search Bar */}
          <div className="bg-slate-900/80 border-x border-red-500/20 p-2 backdrop-blur-md">
            <div className="relative flex items-center gap-2">
                <div className="relative flex-grow">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search issues..." 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-slate-600 font-mono"
                    />
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    {searchQuery && (
                        <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                            <X size={12} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="p-1.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                    {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border-x border-b border-red-500/20 rounded-b-xl overflow-y-auto p-2 backdrop-blur-md flex-grow scrollbar-thin scrollbar-thumb-red-500 shadow-2xl">
            {displayedPoints.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs italic">
                    {isSearching ? "Analyzing records..." : "No matching records found."}
                </div>
            ) : (
                displayedPoints.map(item => (
                <div key={item.id} className={`p-3 mb-2 rounded flex items-center gap-3 transition-all ${item.resolved ? 'bg-slate-800 border-l-2 border-slate-600 opacity-50' : 'bg-red-500/10 border-l-2 border-red-500 animate-pulse'}`}>
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${item.resolved ? 'bg-slate-700 text-slate-400' : 'bg-red-500 text-white'}`}>
                    {item.resolved ? 'DONE' : '!'}
                    </div>
                    <div>
                    <div className="text-[11px] font-bold text-white uppercase">{item.title}</div>
                    <div className="text-[9px] text-slate-400 uppercase">{item.resolved ? 'Action Taken' : 'Pending Action'}</div>
                    </div>
                </div>
                ))
            )}
            
            {progress === 100 && (
              <button onClick={onOpenQuiz} className="w-full mt-4 py-3 bg-slate-100 hover:bg-white text-slate-900 font-bold text-xs rounded-lg animate-bounce pointer-events-auto uppercase tracking-widest shadow-lg">
                Face The Board
              </button>
            )}
          </div>
        </div>

        {/* Right: Info Feed */}
        <div className={`w-72 h-2/3 flex flex-col pointer-events-auto transition-transform duration-500 ease-in-out ${isVisible ? 'translate-x-0' : '-translate-x-[110%]'}`}>
           <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-t-xl backdrop-blur-xl">
             <span className="font-orbitron text-slate-400 text-[10px] tracking-[0.2em] font-bold uppercase flex items-center gap-2">
              <Book size={14} /> Quarter Brief
            </span>
           </div>
           <div className="bg-slate-950/80 border-x border-b border-slate-700 rounded-b-xl p-4 backdrop-blur-md flex-grow shadow-2xl overflow-y-auto">
              <h3 className="text-white font-bold text-sm mb-2">{currentLevel.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">{currentLevel.description}</p>
              
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Company Status</div>
                {WORLD_IMPACT.slice(0, 2).map((impact, i) => (
                  <div key={i} className="bg-slate-800/50 p-2 rounded border border-slate-700">
                    <div className="text-white font-bold text-[9px] mb-1">{impact.title}</div>
                    <div className="text-slate-400 text-[8px] leading-tight">{impact.detail}</div>
                  </div>
                ))}
              </div>
              <button onClick={onOpenKnowledge} className="mt-6 w-full py-2 bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-bold rounded uppercase tracking-widest hover:bg-slate-700 transition-colors">
                Employee Directory [I]
              </button>
           </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className={`flex justify-center gap-4 pointer-events-auto mb-4 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-32'}`}>
        <button onClick={onOpenTimeline} className="px-6 py-3 bg-slate-900/90 border border-slate-700 hover:border-sky-500 rounded-lg flex items-center gap-2 group transition-all backdrop-blur-md">
          <Activity size={18} className="text-sky-400 group-hover:scale-110" />
          <span className="font-bold text-sm uppercase font-orbitron">History [T]</span>
        </button>
        <button onClick={onOpenMarket} className="px-6 py-3 bg-slate-900/90 border border-slate-700 hover:border-emerald-500 rounded-lg flex items-center gap-2 group transition-all backdrop-blur-md">
          <BarChart3 size={18} className="text-emerald-400 group-hover:scale-110" />
          <span className="font-bold text-sm uppercase font-orbitron">Terminal [M]</span>
        </button>
      </div>
    </div>
  );
};

export default HUD;
