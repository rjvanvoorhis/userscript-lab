import type { Result } from '@core/result';
import type { IShopListingSource } from '@application/ItemBuyer/IShopListingSource';
import type { NeoPoint } from '@domain/shared/NeoPoint';
import type { ItemName } from '@domain/shared/ItemName';
import type { ShopListing } from '@domain/shared/ShopListing';

export class ShopWizardAdapter implements IShopListingSource {
  fetchListings(_itemName: ItemName, _maxPrice: NeoPoint): Promise<Result<ShopListing[]>> {
    throw new Error('Not implemented');
  }
}
