import type { Result } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export class GetItemPriceUseCase implements IPriceChecker {
  constructor(
    private readonly historical: IPriceChecker,
    private readonly live: IPriceChecker,
  ) {}

  async getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    const result = await this.historical.getPrice(itemName);
    if (result.isOK()) return result;
    return this.live.getPrice(itemName);
  }
}
