import type { RobotBuild } from './RobotBuild';

export interface QuestionStats {
  answered: number;
  correct: number;
  mathAnswered: number;
  mathCorrect: number;
  englishAnswered: number;
  englishCorrect: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  wins: number;
  losses: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerSave {
  id: string;
  name: string;
  money: number;
  wins: number;
  losses: number;
  completedMissionIds: string[];
  unlockedPartIds: string[];
  ownedPartIds: string[];
  currentBuild: RobotBuild;
  questionStats: QuestionStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerStorageState {
  version: 1;
  currentPlayerId: string | null;
  players: PlayerSave[];
}

export type BattleResult = 'victory' | 'defeat';
