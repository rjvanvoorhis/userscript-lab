import type { Result } from '@core/result';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export interface PriceCheckerContract {
  getPrice(itemName: ItemName): Promise<Result<ItemPrice>>;
}
