export type PartSlot = 'body' | 'head' | 'legs' | 'armor' | 'color';

export interface Part {
  id: string;
  name: string;
  slot: PartSlot;
  price: number;
}
