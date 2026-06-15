import { attemptAsync } from '@core/result';
import type { Result } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';
import { NeoPoint } from '@domain/shared';
import { LEGACY_SHOP_WIZARD_AJAX_URL, SHOP_WIZARD_URL } from '@core/constants';
import { extractShopWizardResults } from './ShopWizardResultsExtractor';
import type { ExtractorFunc } from './ShopWizardResultsExtractor';

export class LegacyShopWizardAdapter implements IPriceChecker {
  constructor(
    private readonly attempts: number = 5,
    private readonly extract: ExtractorFunc = extractShopWizardResults,
  ) {}

  getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    return attemptAsync(async () => {
      const prices: number[] = [];

      for (let i = 0; i < this.attempts; i++) {
        const body = new URLSearchParams({
          type: 'process_wizard',
          feedset: '0',
          shopwizard: itemName.value,
          table: 'shop',
          criteria: 'exact',
          min_price: '0',
          max_price: '999999',
        });

        const response = await fetch(LEGACY_SHOP_WIZARD_AJAX_URL, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': SHOP_WIZARD_URL,
          },
          body: body.toString(),
        });

        const html = await response.text();
        prices.push(...this.extract(html).map(l => l.price.amount));
      }

      if (prices.length === 0) {
        throw new Error(`No prices found for "${itemName.value}"`);
      }

      return { itemName, price: NeoPoint.from(Math.min(...prices)) };
    });
  }
}
