export type EnemyKind = 'basic' | 'fast' | 'shooter' | 'boss';

export interface Enemy {
  id: string;
  name: string;
  kind: EnemyKind;
  health: number;
  speed: number;
  damage: number;
  contactDamageCooldownMs?: number;
}
