import type { Result } from '@core/result';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';
import type { IDocument } from '@application/shared/IDocument';

export interface IShopPurchaser {
  purchase(listing: ShopListing, document?: IDocument): Promise<Result<PurchaseAttempt>>;
}
