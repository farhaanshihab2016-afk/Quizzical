export type GamePhase = 'setup' | 'playing' | 'finale';

export interface PresetHost {
  id: string;
  name: string;
  title: string;
  tagline: string;
  persona: string;
  image: string;
}

export type HostSelection =
  | { kind: 'preset'; id: string }
  | { kind: 'custom'; name: string; persona: string };

export interface ActiveHost {
  id?: string;
  name: string;
  title?: string;
  persona: string;
  image: string;
}

export interface GameSettings {
  host: HostSelection;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rounds: number;
}

export interface RoundData {
  question: string;
  options: string[];
  answerIndex: number;
  intro: string;
  onCorrect: string;
  onWrong: string;
  hint: string;
  fact: string;
}

export interface RevealState {
  choice: number | null;
  correct: boolean;
  timedOut: boolean;
  points: number;
}

export interface LeaderboardEntry {
  id: string;
  heroName: string;
  hostName: string;
  category: string;
  score: number;
  correct: number;
  rounds: number;
  date: string;
}

export interface PlayerProfile {
  heroName: string;
  highScore: number;
  totalGames: number;
  bestStreak: number;
}
