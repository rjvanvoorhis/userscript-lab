import type { Result } from '@core/result';
import type { PriceCheckerContract } from '@application/shared/PriceCheckerContract';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export class HistoricalPriceAdapter implements PriceCheckerContract {
  getPrice(_itemName: ItemName): Promise<Result<ItemPrice>> {
    throw new Error('Not implemented');
  }
}
