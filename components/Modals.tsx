
import React, { useState } from 'react';
import { X, Send, ShieldCheck, AlertTriangle } from 'lucide-react';
import { analyzeForensicEvidence } from '../services/geminiService';
import { DocumentContent, QuizQuestion, TimelineEvent } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-emerald-500/20 flex justify-between items-center bg-slate-950/50">
          <h2 className="font-orbitron text-emerald-400 text-sm tracking-widest">{title}</h2>
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

export const DocumentModal: React.FC<{ doc: DocumentContent | null, isOpen: boolean, onClose: () => void }> = ({ doc, isOpen, onClose }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const handleAiAsk = async () => {
    if (!doc || !query) return;
    setLoading(true);
    const result = await analyzeForensicEvidence(doc.title, doc.content, query);
    setAiAnalysis(result);
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="FORENSIC DOCUMENT VIEW">
      {doc && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">{doc.title}</h3>
            <p className="text-slate-300 leading-relaxed font-serif bg-white/5 p-4 rounded border-l-4 border-emerald-500 italic">
              {doc.content}
            </p>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-xl border border-sky-500/20">
            <div className="flex items-center gap-2 text-sky-400 mb-4 font-bold text-sm">
              <ShieldCheck size={18} /> AI AUDIT ASSISTANT
            </div>
            {aiAnalysis ? (
              <div className="mb-4 text-xs bg-slate-950 p-4 rounded text-slate-300 border border-sky-400/10 leading-relaxed">
                {aiAnalysis}
                <button 
                  onClick={() => setAiAnalysis('')} 
                  className="mt-2 text-sky-400 hover:underline block font-bold"
                >
                  Ask another question
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask the AI about the fraud in this doc..."
                  className="flex-grow bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-400 text-white"
                />
                <button 
                  onClick={handleAiAsk}
                  disabled={loading}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white p-2 rounded transition-colors"
                >
                  {loading ? '...' : <Send size={18} />}
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-2">Powered by Gemini AI • Forensic Accounting Module</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const QuizModal: React.FC<{ questions: QuizQuestion[], isOpen: boolean, onClose: () => void }> = ({ questions, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = questions[currentIndex];

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setShowFeedback(true);
  };

  const next = () => {
    setSelected(null);
    setShowFeedback(false);
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KNOWLEDGE ASSESSMENT">
      <div className="space-y-6">
        <div className="bg-slate-950 p-4 rounded-lg border border-emerald-500/10">
          <div className="text-emerald-400 text-[10px] mb-2 font-mono uppercase">Question {currentIndex + 1} of {questions.length}</div>
          <h3 className="text-lg text-white font-bold">{q.question}</h3>
        </div>

        <div className="grid gap-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !showFeedback && handleSelect(i)}
              disabled={showFeedback}
              className={`w-full p-4 rounded-xl text-left border transition-all ${
                showFeedback 
                  ? i === q.correct 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : i === selected ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800/30 border-slate-700 opacity-50'
                  : 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="p-4 bg-white/5 rounded-lg border-l-4 border-emerald-400">
            <p className="text-xs text-slate-300 italic mb-4">{q.explanation}</p>
            <button 
              onClick={next}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded transition-colors"
            >
              NEXT QUESTION
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const TimelineModal: React.FC<{ events: TimelineEvent[], isOpen: boolean, onClose: () => void }> = ({ events, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="FRAUD TIMELINE: 2000-2002">
      <div className="space-y-4">
        {events.map((e, i) => (
          <div key={i} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform" />
              <div className="w-px h-full bg-slate-700 my-1" />
            </div>
            <div className="pb-6">
              <div className="text-emerald-400 font-mono font-bold text-sm">{e.date}</div>
              <div className="text-white text-sm mt-1">{e.event}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
