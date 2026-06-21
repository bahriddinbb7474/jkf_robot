export type EnemyKind = 'basic' | 'fast' | 'shooter' | 'boss';
export type EnemyBehavior = 'chase' | 'shooter' | 'boss';

interface EnemyBase {
  id: string;
  name: string;
  kind: EnemyKind;
  behavior: EnemyBehavior;
  health: number;
  speed: number;
  contactDamage: number;
  contactDamageCooldownMs: number;
}

export interface ChaseEnemy extends EnemyBase {
  kind: 'basic' | 'fast';
  behavior: 'chase';
}

export interface ShooterEnemy extends EnemyBase {
  kind: 'shooter';
  behavior: 'shooter';
  preferredDistance: number;
  shootCooldownMs: number;
  projectileDamage: number;
  projectileSpeed: number;
  projectileRange: number;
}

export interface BossEnemy extends EnemyBase {
  kind: 'boss';
  behavior: 'boss';
  preferredDistance: number;
  shootCooldownMs: number;
  projectileDamage: number;
  projectileSpeed: number;
  projectileRange: number;
  radius: number;
}

export type RangedEnemy = ShooterEnemy | BossEnemy;
export type Enemy = ChaseEnemy | RangedEnemy;
