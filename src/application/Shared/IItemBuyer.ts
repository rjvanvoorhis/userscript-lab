import type { Result } from '@core/result';
import type { ItemName } from '@domain/shared/ItemName';
import type { NeoPoint } from '@domain/shared/NeoPoint';
import type { ShopListing } from '@domain/shared/ShopListing';

export interface IItemBuyer {
  buyItem(itemName: ItemName, maxPrice: NeoPoint): Promise<Result<ShopListing>>;
}
