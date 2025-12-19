
import React, { useState, useEffect } from 'react';
import { GameScene, EvidenceItem } from './types';
import { INITIAL_EVIDENCE, HISTORICAL_TIMELINE, QUIZ_QUESTIONS, FRAUD_METHODS } from './constants';
import ThreeDWorld from './components/ThreeDWorld';
import HUD from './components/HUD';
import { DocumentModal, QuizModal, TimelineModal } from './components/Modals';
import { Shield, BookOpen, Search, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [scene, setScene] = useState<GameScene>(GameScene.LOADING);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [activeDoc, setActiveDoc] = useState<EvidenceItem | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Loading Simulation
  useEffect(() => {
    if (scene === GameScene.LOADING) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setScene(GameScene.MENU), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [scene]);

  const handleEvidenceFound = (id: string) => {
    setEvidence(prev => prev.map(item => {
      if (item.id === id && !item.found) {
        const updated = { ...item, found: true };
        setActiveDoc(updated);
        return updated;
      }
      return item;
    }));
  };

  const progress = (evidence.filter(e => e.found).length / evidence.length) * 100;

  if (scene === GameScene.LOADING) {
    return (
      <div className="h-screen w-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400 mb-2 text-center">WORLDCOM</h1>
          <p className="text-slate-500 font-mono text-center mb-8 uppercase tracking-widest text-sm">Forensic Audit Simulator</p>
          
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-emerald-500/60 uppercase">
            <span>Loading 3D Env...</span>
            <span>{loadingProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (scene === GameScene.MENU) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#0a0a1a] to-[#1a0a2a] flex items-center justify-center p-8 relative overflow-hidden">
        {/* Animated Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-2xl w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
            <Shield size={12} /> SEC Internal Taskforce
          </div>
          <h1 className="text-7xl font-orbitron font-black mb-4">
            <span className="text-emerald-400">WORLD</span>
            <span className="text-white">COM</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 font-light tracking-wide max-w-lg mx-auto">
            Step into 2002. Uncover the largest accounting fraud in U.S. history through forensic audit exploration.
          </p>

          <div className="grid gap-4 max-w-sm mx-auto">
            <button 
              onClick={() => setScene(GameScene.GAMEPLAY)}
              className="group relative flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-orbitron font-bold rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              <Search size={20} /> START INVESTIGATION
            </button>
            <button 
              onClick={() => setShowKnowledge(true)}
              className="flex items-center justify-center gap-3 py-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-white font-bold rounded-xl transition-all"
            >
              <BookOpen size={20} className="text-emerald-400" /> READ CASE BRIEF
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800/50 flex justify-center gap-12 text-slate-500 font-mono text-xs uppercase tracking-widest">
            <div>Missisipi HQ</div>
            <div>June 2002</div>
            <div>Phase: Discovery</div>
          </div>
        </div>
        
        {/* Knowledge Modal (from menu) */}
        <TimelineModal events={HISTORICAL_TIMELINE} isOpen={showKnowledge} onClose={() => setShowKnowledge(false)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      <ThreeDWorld 
        evidence={evidence} 
        onInteract={handleEvidenceFound} 
        weather="clear"
      />
      
      <HUD 
        evidence={evidence}
        progress={progress}
        onOpenQuiz={() => setShowQuiz(true)}
        onOpenTimeline={() => setShowTimeline(true)}
        onOpenKnowledge={() => setShowKnowledge(true)}
        currentDate="JUNE 12, 2002"
      />

      {/* Modals */}
      <DocumentModal 
        doc={activeDoc?.document || null} 
        isOpen={!!activeDoc} 
        onClose={() => setActiveDoc(null)} 
      />
      
      <QuizModal 
        questions={QUIZ_QUESTIONS} 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
      />
      
      <TimelineModal 
        events={HISTORICAL_TIMELINE} 
        isOpen={showTimeline} 
        onClose={() => setShowTimeline(false)} 
      />

      <TimelineModal 
        events={HISTORICAL_TIMELINE} 
        isOpen={showKnowledge} 
        onClose={() => setShowKnowledge(false)} 
      />
      
      {/* Visual FX: Vignette */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      
      {/* Crosshair */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className="w-4 h-4 border border-emerald-500/50 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-emerald-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default App;
