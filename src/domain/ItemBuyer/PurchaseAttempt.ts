import type { ShopListing } from '@domain/shared/ShopListing';

export type PurchaseAttempt = {
  readonly listing: ShopListing;
  readonly succeeded: boolean;
  readonly failureReason?: string;
};
