
import React from 'react';
import { Search, Book, HelpCircle, User, Wind, Activity } from 'lucide-react';
import { EvidenceItem } from '../types';

interface HUDProps {
  evidence: EvidenceItem[];
  progress: number;
  onOpenQuiz: () => void;
  onOpenTimeline: () => void;
  onOpenKnowledge: () => void;
  currentDate: string;
}

const HUD: React.FC<HUDProps> = ({ 
  evidence, 
  progress, 
  onOpenQuiz, 
  onOpenTimeline, 
  onOpenKnowledge, 
  currentDate 
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-lg flex gap-8 font-mono text-sm">
          <div>
            <div className="text-emerald-400 font-bold">WCOM</div>
            <div className="text-xl">$14.25</div>
            <div className="text-red-400 text-xs">▼ -2.34%</div>
          </div>
          <div className="opacity-50 border-r border-slate-700" />
          <div>
            <div className="text-emerald-400 font-bold">DJIA</div>
            <div className="text-xl">9,796.03</div>
            <div className="text-red-400 text-xs">▼ -0.45%</div>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-lg text-right font-mono">
          <div className="text-emerald-400 text-lg font-bold">{currentDate}</div>
          <div className="text-slate-400 text-sm">Forensic Audit Phase 1</div>
        </div>
      </div>

      {/* Middle Panels */}
      <div className="flex justify-between items-center h-full my-4">
        {/* Left: Investigation */}
        <div className="w-72 h-3/4 flex flex-col pointer-events-auto">
          <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-t-xl backdrop-blur-xl flex items-center justify-between">
            <span className="font-orbitron text-emerald-400 text-sm tracking-widest flex items-center gap-2">
              <Search size={16} /> INVESTIGATION
            </span>
            <div className="relative w-12 h-12">
               <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="stroke-slate-700 fill-none"
                  strokeWidth="3"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="stroke-emerald-400 fill-none transition-all duration-500"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-emerald-400">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
          <div className="bg-slate-950/80 border-x border-b border-emerald-500/20 rounded-b-xl overflow-y-auto p-2 backdrop-blur-md flex-grow scrollbar-thin scrollbar-thumb-emerald-500">
            {evidence.map(item => (
              <div key={item.id} className={`p-2 mb-2 rounded flex items-center gap-3 transition-colors ${item.found ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : 'opacity-40 bg-slate-800/50'}`}>
                <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                  {item.found ? 'DOC' : '???'}
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">{item.found ? item.name : 'Unknown File'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{item.found ? item.description : 'Locked'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Knowledge Base */}
        <div className="w-80 h-3/4 flex flex-col pointer-events-auto">
           <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-t-xl backdrop-blur-xl">
             <span className="font-orbitron text-sky-400 text-sm tracking-widest flex items-center gap-2">
              <Book size={16} /> CASE FILE
            </span>
           </div>
           <div className="bg-slate-950/80 border-x border-b border-emerald-500/20 rounded-b-xl overflow-y-auto p-4 backdrop-blur-md flex-grow text-xs leading-relaxed text-slate-300">
              <h4 className="text-amber-400 font-bold mb-2 uppercase tracking-tighter flex items-center gap-1">
                <User size={12}/> Key Figures
              </h4>
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <span className="text-lg">👔</span>
                  <div>
                    <div className="text-white font-bold">Bernard Ebbers</div>
                    <div className="text-[10px] opacity-60">CEO - The Telecom Cowboy</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className="text-white font-bold">Scott Sullivan</div>
                    <div className="text-[10px] opacity-60">CFO - Fraud Architect</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <span className="text-lg">🔍</span>
                  <div>
                    <div className="text-white font-bold">Cynthia Cooper</div>
                    <div className="text-[10px] opacity-60">VP Audit - The Whistleblower</div>
                  </div>
                </div>
              </div>
              <h4 className="text-amber-400 font-bold mb-2 uppercase tracking-tighter">Current Status</h4>
              <p className="mb-4">
                We are investigating massive discrepancies in line cost reporting. Initial samples suggest $3.8B in improper capitalization.
              </p>
              <button 
                onClick={onOpenKnowledge}
                className="w-full py-2 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/30 rounded text-sky-400 font-bold transition-all"
              >
                VIEW FULL BRIEFING
              </button>
           </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-center gap-4 pointer-events-auto mb-4">
        <button onClick={onOpenTimeline} className="px-6 py-3 bg-slate-900/90 border border-slate-700 hover:border-emerald-500 rounded-lg flex items-center gap-2 group transition-all backdrop-blur-md">
          <Activity size={18} className="text-emerald-400 group-hover:scale-110" />
          <span className="font-bold text-sm">TIMELINE</span>
        </button>
        <button onClick={onOpenQuiz} className="px-6 py-3 bg-slate-900/90 border border-slate-700 hover:border-emerald-500 rounded-lg flex items-center gap-2 group transition-all backdrop-blur-md">
          <HelpCircle size={18} className="text-emerald-400 group-hover:scale-110" />
          <span className="font-bold text-sm">QUIZ</span>
        </button>
        <div className="px-6 py-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center gap-2 backdrop-blur-md">
          <Wind size={18} className="text-emerald-400" />
          <span className="font-bold font-mono text-xs">LOCATION: CLINTON, MS - HQ</span>
        </div>
      </div>
      
      {/* Footer hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 uppercase tracking-[0.2em]">
        W/A/S/D to move • Mouse to look • E to investigate • AUDIT STATUS: ACTIVE
      </div>
    </div>
  );
};

export default HUD;
