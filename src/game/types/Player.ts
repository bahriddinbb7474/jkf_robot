import type { RobotBuild } from './RobotBuild';

export interface Player {
  id: string;
  name: string;
  money: number;
  build: RobotBuild;
  completedMissionIds: string[];
}
