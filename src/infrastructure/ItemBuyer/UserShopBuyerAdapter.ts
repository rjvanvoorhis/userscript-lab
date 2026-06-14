import type { Result } from '@core/result';
import type { IShopPurchaser } from '@application/ItemBuyer/IShopPurchaser';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';

export class UserShopBuyerAdapter implements IShopPurchaser {
  purchase(_listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    throw new Error('Not implemented');
  }
}
