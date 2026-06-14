import type { Result } from '@core/result';
import type { ShopListing } from '@domain/shared/ShopListing';

export interface IRestockShopScraper {
  scrapeListings(doc: Document): Result<ShopListing[]>;
}
