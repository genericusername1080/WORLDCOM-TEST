
import React, { useState, useEffect, useMemo } from 'react';
import { GameScene, DecisionPoint, GameLevel, ChoiceOutcome } from './types';
import { DECISION_POINTS, HISTORICAL_TIMELINE, QUIZ_QUESTIONS, GAME_LEVELS } from './constants';
import ThreeDWorld from './components/ThreeDWorld';
import HUD from './components/HUD';
import { DecisionModal, QuizModal, TimelineModal, KnowledgeHubModal, LevelTransitionModal } from './components/Modals';
import { Briefcase, BookOpen, Search, Skull, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [scene, setScene] = useState<GameScene>(GameScene.LOADING);
  const [decisionPoints, setDecisionPoints] = useState<DecisionPoint[]>(DECISION_POINTS);
  const [activeDecision, setActiveDecision] = useState<DecisionPoint | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isHudVisible, setIsHudVisible] = useState(true);
  const [weather, setWeather] = useState<'clear' | 'cloudy' | 'rainy'>('clear');
  const [timeOfDay, setTimeOfDay] = useState(9);
  
  // Game State Stats
  const [stockPrice, setStockPrice] = useState(64.50);
  const [suspicion, setSuspicion] = useState(10); // 0-100%

  const currentLevel = useMemo(() => 
    GAME_LEVELS.find(l => l.id === currentLevelId) || GAME_LEVELS[0], 
  [currentLevelId]);

  const filteredDecisions = useMemo(() => 
    decisionPoints.filter(e => e.level <= currentLevelId),
  [decisionPoints, currentLevelId]);

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

  // Game Over Checks
  useEffect(() => {
    if (scene === GameScene.GAMEPLAY) {
        if (suspicion >= 100) {
            setScene(GameScene.GAME_OVER_ARRESTED);
        } else if (stockPrice < 5.00) {
            setScene(GameScene.GAME_OVER_FIRED);
        }
    }
  }, [suspicion, stockPrice, scene]);

  const handleInteract = (id: string) => {
    const point = decisionPoints.find(d => d.id === id);
    if (point && !point.resolved) {
      setActiveDecision(point);
    }
  };

  const handleDecisionMade = (outcome: ChoiceOutcome) => {
    // Update Stats
    setStockPrice(prev => Math.max(0, prev + outcome.stockImpact));
    setSuspicion(prev => Math.min(100, Math.max(0, prev + outcome.suspicionImpact)));

    // Mark Resolved
    setDecisionPoints(prev => prev.map(p => {
        if (activeDecision && p.id === activeDecision.id) {
            return { ...p, resolved: true };
        }
        return p;
    }));

    setActiveDecision(null);
    checkLevelCompletion();
  };

  const checkLevelCompletion = () => {
    // We check via timeout to ensure state updates first, 
    // but React batching makes this tricky. We use the updated list logically.
    // However, since state update is async, we can check remaining unresolved in filtered list minus 1
    const unresolvedCount = filteredDecisions.filter(d => !d.resolved).length;
    if (unresolvedCount <= 1) { // Current one is about to be resolved
      setTimeout(() => setShowQuiz(true), 1000); 
    }
  };

  const handleQuizPass = () => {
    setShowQuiz(false);
    if (currentLevelId < GAME_LEVELS.length) {
      setShowTransition(true);
    } else {
      setScene(GameScene.VICTORY_ESCAPED);
    }
  };

  const advanceLevel = () => {
    setCurrentLevelId(prev => prev + 1);
    setShowTransition(false);
  };

  const toggleWeather = () => {
    setWeather(prev => {
      if (prev === 'clear') return 'cloudy';
      if (prev === 'cloudy') return 'rainy';
      return 'clear';
    });
  };

  const advanceTime = () => setTimeOfDay(prev => (prev + 1) % 24);

  const levelProgress = useMemo(() => {
    const levelDecisions = decisionPoints.filter(e => e.level === currentLevelId);
    const resolved = levelDecisions.filter(e => e.resolved).length;
    return (resolved / levelDecisions.length) * 100;
  }, [decisionPoints, currentLevelId]);

  if (scene === GameScene.LOADING) {
    return (
      <div className="h-screen w-screen bg-[#0a0a1a] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 mb-2 text-center">WORLDCOM</h1>
          <p className="text-slate-500 font-mono text-center mb-8 uppercase tracking-widest text-sm">CFO Simulator</p>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (scene === GameScene.MENU) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="max-w-2xl w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
            <AlertTriangle size={12} /> Confidential
          </div>
          <h1 className="text-7xl font-orbitron font-black mb-4 uppercase tracking-tighter text-white">
            COOK THE <span className="text-red-500">BOOKS</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
            You are Scott Sullivan, CFO of WorldCom. The market is crashing. The CEO demands results. How far will you go to keep the stock price up?
          </p>
          <button 
            onClick={() => setScene(GameScene.GAMEPLAY)}
            className="group relative inline-flex items-center justify-center gap-3 px-12 py-4 bg-white hover:bg-slate-200 text-slate-900 font-orbitron font-bold rounded-xl transition-all hover:scale-105"
          >
            ENTER OFFICE <Briefcase size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (scene === GameScene.GAME_OVER_ARRESTED) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center border-8 border-red-600">
        <Skull size={80} className="text-red-500 mb-6" />
        <h1 className="text-6xl font-orbitron font-black text-red-500 mb-4">ARRESTED</h1>
        <p className="text-2xl text-white mb-8">Suspicion level reached 100%. The FBI has raided the building.</p>
        <div className="text-slate-400 font-mono mb-8">SENTENCE: 5 YEARS FEDERAL PRISON</div>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg">TRY AGAIN</button>
      </div>
    );
  }

  if (scene === GameScene.GAME_OVER_FIRED) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <Briefcase size={80} className="text-slate-500 mb-6" />
        <h1 className="text-6xl font-orbitron font-black text-white mb-4">FIRED</h1>
        <p className="text-2xl text-slate-300 mb-8">The stock price plummeted. Bernie Ebbers removed you as CFO.</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg">TRY AGAIN</button>
      </div>
    );
  }

  if (scene === GameScene.VICTORY_ESCAPED) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-2xl p-8 bg-slate-900 border border-emerald-500/20 rounded-2xl shadow-2xl">
          <h1 className="text-5xl font-orbitron font-black text-white mb-4">GAME OVER</h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed font-light">
             You kept the fraud going until 2002. But the house of cards always falls.
          </p>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 text-left space-y-2 font-mono text-sm">
            <div>FINAL STOCK PRICE: <span className="text-emerald-400">${stockPrice.toFixed(2)}</span></div>
            <div>FRAUD COMMITTED: <span className="text-red-400">$11 BILLION</span></div>
            <div>OUTCOME: <span className="text-white">CONVICTED</span></div>
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg transition-all">
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      {/* Reusing ThreeDWorld with evidence mapped to decision points */}
      <ThreeDWorld 
        evidence={filteredDecisions.map(d => ({
            id: d.id,
            name: d.title,
            description: d.problem,
            found: d.resolved,
            position: d.position,
            level: d.level,
            document: { title: d.title, content: d.problem } // adapter
        }))} 
        onInteract={handleInteract} 
        onToggleHUD={() => setIsHudVisible(!isHudVisible)}
        weather={weather}
        timeOfDay={timeOfDay}
      />
      
      <HUD 
        decisionPoints={filteredDecisions}
        progress={levelProgress}
        stockPrice={stockPrice}
        suspicion={suspicion}
        isVisible={isHudVisible}
        weather={weather}
        onToggleWeather={toggleWeather}
        onOpenQuiz={() => setShowQuiz(true)}
        onOpenTimeline={() => setShowTimeline(true)}
        onOpenKnowledge={() => setShowKnowledge(true)}
        onAdvanceTime={advanceTime}
        timeOfDay={timeOfDay}
        currentLevel={currentLevel}
        onCheckCompletion={checkLevelCompletion}
        currentDate={currentLevel.title}
      />

      <DecisionModal 
        decisionPoint={activeDecision}
        isOpen={!!activeDecision}
        onClose={() => setActiveDecision(null)}
        onDecide={handleDecisionMade}
      />
      
      <QuizModal 
        questions={QUIZ_QUESTIONS.filter(q => q.level === currentLevelId)} 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)}
        onPass={handleQuizPass}
      />
      
      <TimelineModal 
        events={HISTORICAL_TIMELINE} 
        isOpen={showTimeline} 
        onClose={() => setShowTimeline(false)} 
      />

      <KnowledgeHubModal 
        isOpen={showKnowledge} 
        onClose={() => setShowKnowledge(false)} 
      />

      <LevelTransitionModal 
        isOpen={showTransition} 
        nextLevel={GAME_LEVELS.find(l => l.id === currentLevelId + 1) || GAME_LEVELS[0]} 
        onAdvance={advanceLevel} 
      />
      
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className={`w-4 h-4 border border-slate-500/50 rounded-full flex items-center justify-center transition-opacity duration-300 ${isHudVisible ? 'opacity-100' : 'opacity-30'}`}>
          <div className="w-1 h-1 bg-red-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default App;
