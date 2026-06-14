import type { Result } from "@core/result";
import type { IRestockBuyer } from "@application/Restocker/IRestockBuyer";
import type { IShopPurchaser } from "@application/ItemBuyer/IShopPurchaser";
import type { ShopListing } from "@domain/shared/ShopListing";
import type { PurchaseAttempt } from "@domain/ItemBuyer/PurchaseAttempt";

export class RestockBuyAdapter implements IRestockBuyer {
  constructor(private readonly purchaser: IShopPurchaser) {}

  buy(listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    return this.purchaser.purchase(listing);
  }
}
