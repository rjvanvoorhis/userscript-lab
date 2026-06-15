import type { Result } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';

export class LivePriceAdapter implements IPriceChecker {
  constructor(
    private readonly ssw: IPriceChecker,
    private readonly legacy: IPriceChecker,
  ) {}

  async getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    const result = await this.ssw.getPrice(itemName);
    if (result.isOK()) return result;
    return this.legacy.getPrice(itemName);
  }
}
