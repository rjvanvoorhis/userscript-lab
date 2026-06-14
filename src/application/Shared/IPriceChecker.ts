import type { Result } from '@core/result';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export interface IPriceChecker {
  getPrice(itemName: ItemName): Promise<Result<ItemPrice>>;
}
