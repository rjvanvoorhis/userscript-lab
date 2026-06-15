import type { NeoPoint } from '@domain/shared/NeoPoint';

export type ItemListing = {
  readonly shopOwner: string;
  readonly stock: number;
  readonly price: NeoPoint;
  readonly purchaseLink: string;
};
