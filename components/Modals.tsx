
import React, { useState } from 'react';
import { X, Send, AlertTriangle, TrendingUp, TrendingDown, Scale, ArrowRight, Award, ShieldCheck, User } from 'lucide-react';
import { analyzeForensicEvidence } from '../services/geminiService';
import { DecisionPoint, QuizQuestion, TimelineEvent, KeyFigure, ImpactFact, FraudMethod, GameLevel, ChoiceOutcome } from '../types';
import { KEY_FIGURES, WORLD_IMPACT, FRAUD_METHODS } from '../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="p-4 border-b border-emerald-500/20 flex justify-between items-center bg-slate-950/50">
          <h2 className="font-orbitron text-red-500 text-sm tracking-widest uppercase font-bold flex items-center gap-2">
            <AlertTriangle size={16} /> {title}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export const DecisionModal: React.FC<{ 
  decisionPoint: DecisionPoint | null, 
  isOpen: boolean, 
  onClose: () => void,
  onDecide: (outcome: ChoiceOutcome) => void 
}> = ({ decisionPoint, isOpen, onClose, onDecide }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAiConsult = async (outcome: ChoiceOutcome) => {
    if (!decisionPoint) return;
    setLoading(true);
    const result = await analyzeForensicEvidence(decisionPoint.title, outcome.description, outcome.aiPrompt);
    setAiAnalysis(result);
    setLoading(false);
  };

  if (!decisionPoint) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="EXECUTIVE DECISION REQUIRED">
      <div className="space-y-8">
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <h3 className="text-2xl font-bold text-white mb-2">{decisionPoint.title}</h3>
          <p className="text-lg text-slate-300 leading-relaxed font-light border-l-4 border-red-500 pl-4">
            {decisionPoint.problem}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Honest Option */}
          <div className="p-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 transition-colors group">
            <h4 className="text-sky-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Scale size={16} /> GAAP Compliant
            </h4>
            <div className="text-white font-bold text-lg mb-2">{decisionPoint.options.honest.label}</div>
            <div className="flex gap-4 text-xs font-mono mb-4">
               <span className="text-red-400 flex items-center gap-1"><TrendingDown size={12}/> Stock: {decisionPoint.options.honest.stockImpact}%</span>
               <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={12}/> Suspicion: {decisionPoint.options.honest.suspicionImpact}%</span>
            </div>
            <p className="text-slate-400 text-sm mb-4 min-h-[60px]">{decisionPoint.options.honest.description}</p>
            <div className="flex gap-2">
               <button 
                  onClick={() => onDecide(decisionPoint.options.honest)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded"
                >
                  EXECUTE
               </button>
               <button onClick={() => handleAiConsult(decisionPoint.options.honest)} className="p-3 bg-slate-800 border border-slate-600 rounded text-sky-400 hover:text-white">
                  <User size={18} />
               </button>
            </div>
          </div>

          {/* Fraud Option */}
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/10 hover:bg-red-900/20 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-red-500/20 text-[8px] text-red-400 uppercase font-bold rounded-bl">High Risk</div>
            <h4 className="text-red-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlertTriangle size={16} /> "Creative" Accounting
            </h4>
            <div className="text-white font-bold text-lg mb-2">{decisionPoint.options.fraud.label}</div>
            <div className="flex gap-4 text-xs font-mono mb-4">
               <span className="text-emerald-400 flex items-center gap-1"><TrendingUp size={12}/> Stock: +{decisionPoint.options.fraud.stockImpact}%</span>
               <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> Suspicion: +{decisionPoint.options.fraud.suspicionImpact}%</span>
            </div>
            <p className="text-slate-400 text-sm mb-4 min-h-[60px]">{decisionPoint.options.fraud.description}</p>
             <div className="flex gap-2">
               <button 
                  onClick={() => onDecide(decisionPoint.options.fraud)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  COOK THE BOOKS
               </button>
               <button onClick={() => handleAiConsult(decisionPoint.options.fraud)} className="p-3 bg-slate-800 border border-slate-600 rounded text-sky-400 hover:text-white">
                  <User size={18} />
               </button>
            </div>
          </div>
        </div>

        {/* AI Output Area */}
        {(loading || aiAnalysis) && (
          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-sky-500/20 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 text-sky-400 mb-2 font-bold text-xs tracking-widest uppercase">
              <User size={16} /> Shadow Consultant
            </div>
            {loading ? (
               <div className="text-sky-500/50 text-sm font-mono animate-pulse">Establishing encrypted channel...</div>
            ) : (
               <div className="text-slate-300 text-sm leading-relaxed font-mono">{aiAnalysis}</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export const LevelTransitionModal: React.FC<{ isOpen: boolean, nextLevel: GameLevel, onAdvance: () => void }> = ({ isOpen, nextLevel, onAdvance }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-lg">
      <div className="max-w-md w-full text-center p-8 bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in slide-in-from-bottom duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/50">
          <Award size={48} />
        </div>
        <h2 className="text-emerald-400 font-orbitron text-xs tracking-[0.3em] uppercase mb-2">Quarter Closed</h2>
        <h1 className="text-3xl font-orbitron font-black text-white mb-4">SURVIVED</h1>
        <div className="py-6 border-y border-slate-800 mb-8">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest">Next Fiscal Quarter:</p>
          <div className="text-xl text-white font-bold">{nextLevel.title}</div>
          <p className="text-sky-400 text-xs mt-2 uppercase font-mono">Rank: {nextLevel.rank}</p>
        </div>
        <button 
          onClick={onAdvance}
          className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all hover:scale-105"
        >
          ENTER BOARDROOM <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};


export const QuizModal: React.FC<{ questions: QuizQuestion[], isOpen: boolean, onClose: () => void, onPass: () => void }> = ({ questions, isOpen, onClose, onPass }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[currentIndex];
  if (!q) return null;

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setShowFeedback(true);
  };

  const next = () => {
    if (selected === q.correct) {
      if (currentIndex < questions.length - 1) {
        setSelected(null);
        setShowFeedback(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        onPass();
      }
    } else {
      setShowFeedback(true); // Let them try again or just show they failed
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BOARDROOM INTERROGATION">
      <div className="space-y-6">
        <div className="bg-slate-950 p-6 rounded-xl border border-red-500/10">
          <div className="text-red-400 text-[10px] mb-2 font-mono uppercase font-bold tracking-[0.2em]">High Pressure Question</div>
          <h3 className="text-lg text-white font-bold leading-tight">{q.question}</h3>
        </div>

        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !showFeedback && handleSelect(i)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-xl text-left border transition-all text-sm font-medium ${
                showFeedback 
                  ? i === q.correct 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105' 
                    : i === selected ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800/30 border-slate-700 opacity-50'
                  : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className={`p-4 rounded-xl border-l-4 ${selected === q.correct ? 'bg-emerald-500/10 border-emerald-400' : 'bg-red-500/10 border-red-400'}`}>
            <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">{q.explanation}</p>
            {selected === q.correct ? (
              <button onClick={next} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg transition-colors">
                {currentIndex < questions.length - 1 ? 'NEXT QUESTION' : 'SURVIVE INTERROGATION'}
              </button>
            ) : (
              <button onClick={() => { setShowFeedback(false); setSelected(null); }} className="w-full py-3 bg-red-500 text-white font-bold rounded-lg transition-colors">
                TRY ANOTHER ANSWER
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export const KnowledgeHubModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'people' | 'fraud' | 'impact'>('people');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CORPORATE FILES">
      <div className="space-y-6">
        <div className="flex border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
          {['people', 'fraud', 'impact'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${activeTab === tab ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {activeTab === 'people' && KEY_FIGURES.map((person, i) => (
            <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-2xl border border-emerald-500/20">{person.avatar}</div>
                <div><h4 className="text-white font-bold">{person.name}</h4><p className="text-emerald-400 text-[10px] font-mono uppercase">{person.role}</p></div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-3">{person.description}</p>
              <div className="text-[10px] bg-black/40 p-2 rounded text-slate-400 italic">OUTCOME: {person.outcome}</div>
            </div>
          ))}
          {activeTab === 'fraud' && FRAUD_METHODS.map((method, i) => (
            <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex justify-between items-start mb-2"><h4 className="text-amber-400 font-bold uppercase text-sm">{method.name}</h4><div className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">{method.amount}</div></div>
              <p className="text-slate-300 text-xs leading-relaxed">{method.description}</p>
            </div>
          ))}
          {activeTab === 'impact' && WORLD_IMPACT.map((fact, i) => (
            <div key={i} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex gap-4">
              <div className="flex-grow"><h4 className="text-sky-400 font-bold text-sm mb-1">{fact.title}</h4><p className="text-slate-300 text-xs leading-relaxed">{fact.detail}</p></div>
              {fact.stat && <div className="shrink-0 flex items-center justify-center bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 min-w-[80px]"><div className="text-sky-400 font-black text-xs text-center leading-none">{fact.stat}</div></div>}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export const TimelineModal: React.FC<{ events: TimelineEvent[], isOpen: boolean, onClose: () => void }> = ({ events, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="INVESTIGATION TIMELINE">
      <div className="space-y-4">
        {events.map((e, i) => (
          <div key={i} className="flex gap-4 group">
            <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform" /><div className="w-px h-full bg-slate-700 my-1" /></div>
            <div className="pb-6">
              <div className="text-emerald-400 font-mono font-bold text-sm mb-1">{e.date}</div>
              <div className="text-white text-sm leading-relaxed">{e.event}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
