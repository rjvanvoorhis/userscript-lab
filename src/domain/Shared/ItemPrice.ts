import type { ItemName } from '@domain/shared/ItemName';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type ItemPrice = {
  readonly itemName: ItemName;
  readonly price: NeoPoint;
};
