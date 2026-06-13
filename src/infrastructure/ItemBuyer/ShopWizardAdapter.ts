import type { Result } from '@core/result';
import type { ShopListingSourceContract } from '@application/ItemBuyer/ShopListingSourceContract';
import type { NeoPoint } from '@domain/shared/NeoPoint';
import type { ItemName } from '@domain/shared/ItemName';
import type { ShopListing } from '@domain/shared/ShopListing';

export class ShopWizardAdapter implements ShopListingSourceContract {
  fetchListings(_itemName: ItemName, _maxPrice: NeoPoint): Promise<Result<ShopListing[]>> {
    throw new Error('Not implemented');
  }
}
