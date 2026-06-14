import type { Result } from '@core/result';
import { Ok, Err } from '@core/result';
import type { IItemBuyer } from '@application/shared/IItemBuyer';
import type { IShopListingSource } from '@application/ItemBuyer/IShopListingSource';
import type { IShopPurchaser } from '@application/ItemBuyer/IShopPurchaser';
import type { ItemName } from '@domain/shared/ItemName';
import type { NeoPoint } from '@domain/shared/NeoPoint';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';

export class BuyItemUseCase implements IItemBuyer {
  constructor(
    private readonly source: IShopListingSource,
    private readonly purchaser: IShopPurchaser,
  ) {}

  async buyItem(itemName: ItemName, maxPrice: NeoPoint): Promise<Result<ShopListing>> {
    const listingsResult = await this.source.fetchListings(itemName, maxPrice);
    return listingsResult.chainAsync(async listings => {
      const sorted = listings.sort((a, b) => a.price.amount - b.price.amount);
      if (sorted.length === 0) {
        return Err.from(`No listings found for "${itemName}" under ${maxPrice}`);
      }
      for (const listing of sorted) {
        const attempt = await this.attemptPurchase(listing);
        if (attempt.succeeded) return Ok.from(listing);
      }
      return Err.from(`All listings exhausted for "${itemName}" — none successfully purchased`);
    });
  }

  private async attemptPurchase(listing: ShopListing): Promise<PurchaseAttempt> {
    const result = await this.purchaser.purchase(listing);
    return result.unwrapOr({ listing, succeeded: false, failureReason: 'Purchase failed' });
  }
}
