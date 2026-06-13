import type { Result } from '@core/result';
import type { RestockShopScraperContract } from '@application/Restocker/RestockShopScraperContract';
import type { ShopListing } from '@domain/shared/ShopListing';

export class RestockShopScraper implements RestockShopScraperContract {
  scrapeListings(_doc: Document): Result<ShopListing[]> {
    throw new Error('Not implemented');
  }
}
