import type { Result } from '@core/result';
import type { RestockBuyerContract } from '@application/Restocker/RestockBuyerContract';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';

export class RestockBuyAdapter implements RestockBuyerContract {
  buy(_listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    throw new Error('Not implemented');
  }
}
