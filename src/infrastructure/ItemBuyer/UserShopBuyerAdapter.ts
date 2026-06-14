import type { Result } from '@core/result';
import type { ShopPurchaserContract } from '@application/ItemBuyer/ShopPurchaserContract';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';

export class UserShopBuyerAdapter implements ShopPurchaserContract {
  purchase(_listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    throw new Error('Not implemented');
  }
}
