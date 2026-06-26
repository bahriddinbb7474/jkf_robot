export type MissionStatus = 'unlocked' | 'locked' | 'completed';

export interface MissionWave {
  enemyIds: string[];
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  requiredCompletedMissionId: string | null;
  rewardMoney: number;
  unlockPartIds: string[];
  waves: MissionWave[];
  bossId: string | null;
}
