import type { ShopListing } from '@domain/shared/ShopListing';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type RestockOpportunity = {
  readonly listing: ShopListing;
  readonly marketPrice: NeoPoint;
  readonly profit: NeoPoint;
};
