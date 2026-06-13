import type { ItemName } from '@domain/shared/ItemName';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type QuestRequirement = {
  readonly itemName: ItemName;
  readonly quantityNeeded: number;
  readonly quantityOwned: number;
  readonly estimatedCost: NeoPoint | null;
};
