import type { ItemName } from '@domain/shared/ItemName';

export type InventoryEntry = {
  readonly itemName: ItemName;
  readonly quantity: number;
  readonly location: 'inventory' | 'sdb';
};
