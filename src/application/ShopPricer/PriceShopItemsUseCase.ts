import { NeoPoint } from "@domain/shared/NeoPoint";
import type { IPriceChecker } from "@application/shared/IPriceChecker";
import type { IShopPricerPage } from "@application/ShopPricer/IShopPricerPage";

const UNDERCUT_AMOUNT = NeoPoint.from(100);

export class PriceShopItemsUseCase {
  constructor(
    private readonly page: IShopPricerPage,
    private readonly pricer: IPriceChecker,
  ) {}

  execute(): void {
    for (const row of this.page.getRows()) {
      row.onImageClick(async () => {
        const result = await this.pricer.getPrice(row.itemName);
        if (result.isErr()) return;
        const marketPrice = result.unwrap().price;
        row.setPriceField(marketPrice.subtract(UNDERCUT_AMOUNT));
      });
    }
  }
}
