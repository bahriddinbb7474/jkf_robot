export type PartSlot = 'body' | 'head' | 'legs' | 'armor' | 'color';

export interface Part {
  id: string;
  name: string;
  slot: PartSlot;
  price: number;
  locked?: boolean;
  maxHpBonus?: number;
  armorBonus?: number;
  speedBonus?: number;
  damageMultiplierBonus?: number;
  colorHex?: string;
}
