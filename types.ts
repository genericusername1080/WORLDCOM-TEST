
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface ChoiceOutcome {
  label: string;
  stockImpact: number;
  suspicionImpact: number;
  description: string;
  aiPrompt: string;
}

export interface DecisionPoint {
  id: string;
  title: string;
  problem: string;
  position: Position;
  resolved: boolean;
  level: number;
  options: {
    honest: ChoiceOutcome;
    fraud: ChoiceOutcome;
  };
}

export interface KeyFigure {
  name: string;
  role: string;
  avatar: string;
  description: string;
  outcome: string;
}

export interface ImpactFact {
  title: string;
  detail: string;
  stat?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  level: number;
}

export enum GameScene {
  LOADING = 'LOADING',
  MENU = 'MENU',
  GAMEPLAY = 'GAMEPLAY',
  GAME_OVER_FIRED = 'GAME_OVER_FIRED',
  GAME_OVER_ARRESTED = 'GAME_OVER_ARRESTED',
  VICTORY_ESCAPED = 'VICTORY_ESCAPED'
}

export enum AuditRank {
  CFO = 'Chief Financial Officer',
  CONTROLLER = 'Corporate Controller',
  CEO = 'Chief Executive Officer',
  VP = 'VP of Internal Audit'
}

export interface GameLevel {
  id: number;
  title: string;
  rank: AuditRank;
  targetEPS: string; 
  description: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface FraudMethod {
  name: string;
  description: string;
  amount: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  found: boolean;
  position: Position;
  level: number;
  document?: {
    title: string;
    content: string;
  };
}

export interface StockDataPoint {
  period: string;
  price: number;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  label: string;
  description: string;
  passiveDecayRate: number; // Stock lost per tick
  suspicionMultiplier: number;
  stockLossMultiplier: number; // Multiplier for honest bad news
  auditorAggression: string; // Description for AI context
}
