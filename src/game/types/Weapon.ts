export type WeaponType = 'laser' | 'rocket' | 'sword';

interface WeaponBase {
  id: string;
  name: string;
  damage: number;
  cooldownMs: number;
  price: number;
}

export interface LaserWeapon extends WeaponBase {
  type: 'laser';
  projectileSpeed: number;
  range: number;
}

export interface RocketWeapon extends WeaponBase {
  type: 'rocket';
  projectileSpeed: number;
  range: number;
  explosionRadius: number;
  homingDelayMs: number;
  maxTurnRateDeg: number;
  launchCurveDurationMs: number;
  launchCurveDeg: number;
}

export interface SwordWeapon extends WeaponBase {
  type: 'sword';
  range: number;
  arcDegrees: number;
}

export type Weapon = LaserWeapon | RocketWeapon | SwordWeapon;
