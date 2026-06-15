import type { Result } from "@core/result";
import type { INavigator } from "@application/shared/INavigator";
import type { IRestockBuyer } from "@application/Restocker/IRestockBuyer";
import type { IShopPurchaser } from "@application/ItemBuyer/IShopPurchaser";
import type { ShopListing } from "@domain/shared/ShopListing";
import type { PurchaseAttempt } from "@domain/ItemBuyer/PurchaseAttempt";
import { DocumentServiceAdapter } from "@infrastructure/shared/DocumentServiceAdapter";

export class RestockBuyAdapter implements IRestockBuyer {
  constructor(
    private readonly purchaser: IShopPurchaser,
    private readonly navigator: INavigator,
  ) {}

  async buy(listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    return (await this.navigator.fetchDocument(listing.purchaseLink)).chainAsync(
      (doc) => this.purchaser.purchase(listing, new DocumentServiceAdapter(doc)),
    );
  }
}
