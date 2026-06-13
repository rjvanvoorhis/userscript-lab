import type { Result } from '@core/result';
import type { PriceCheckerContract } from '@application/shared/PriceCheckerContract';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export class GetItemPriceUseCase implements PriceCheckerContract {
  constructor(
    private readonly historical: PriceCheckerContract,
    private readonly live: PriceCheckerContract,
  ) {}

  async getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    const result = await this.historical.getPrice(itemName);
    if (result.isOK()) return result;
    return this.live.getPrice(itemName);
  }
}
