export type WeaponKind = 'laser' | 'rocket' | 'sword';

export interface Weapon {
  id: string;
  name: string;
  kind: WeaponKind;
  damage: number;
  cooldownMs: number;
  price: number;
}
