export type WeaponType = 'laser' | 'rocket' | 'sword';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  cooldownMs: number;
  projectileSpeed?: number;
  range?: number;
  explosionRadius?: number;
  arcDegrees?: number;
  price: number;
}
