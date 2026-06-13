import type { Result } from '@core/result';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';

export interface RestockBuyerContract {
  buy(listing: ShopListing): Promise<Result<PurchaseAttempt>>;
}
