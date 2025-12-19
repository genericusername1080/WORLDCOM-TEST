
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface DocumentContent {
  title: string;
  content: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  found: boolean;
  position: Position;
  document: DocumentContent;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export enum GameScene {
  LOADING = 'LOADING',
  MENU = 'MENU',
  GAMEPLAY = 'GAMEPLAY',
  FINALE = 'FINALE'
}

export interface FraudMethod {
  name: string;
  description: string;
  amount: string;
}

export interface TimelineEvent {
  date: string;
  event: string;
}
