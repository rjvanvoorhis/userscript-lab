import { Result, attemptAsync } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';
import { SUPER_SHOP_WIZARD_URL } from '@core/constants';
import { NeoPoint } from '@domain/shared';

export class ShopWizardPriceAdapter implements IPriceChecker {
  getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
      return attemptAsync(async () => {
        const url = new URL(SUPER_SHOP_WIZARD_URL);
        url.searchParams.append("q", itemName.value);
        url.searchParams.append("json", "1");
        const result = await fetch(url);
        const data = await result.json();
        return {
          itemName,
          price: NeoPoint.from(Number.parseInt(data.data.prices[0] || "0"))
        }
      })
  }
}
