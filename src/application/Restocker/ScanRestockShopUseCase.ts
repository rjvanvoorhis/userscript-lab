import type { Result } from '@core/result';
import { Ok } from '@core/result';
import { pool } from '@core/concurrency/pool';
import type { INavigator } from '@application/shared/INavigator';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { IRestockShopScraper } from '@application/Restocker/IRestockShopScraper';
import type { IRestockBuyer } from '@application/Restocker/IRestockBuyer';
import type { RestockOpportunity } from '@domain/Restocker/RestockOpportunity';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type ScanConfig = {
  readonly profitThreshold: NeoPoint;
  readonly concurrency?: number;
};

export class ScanRestockShopUseCase {
  constructor(
    private readonly navigator: INavigator,
    private readonly scraper: IRestockShopScraper,
    private readonly pricer: IPriceChecker,
    private readonly buyer: IRestockBuyer,
  ) {}

  async execute(config: ScanConfig): Promise<Result<RestockOpportunity[]>> {
    const doc = this.navigator.currentDocument();
    const listingsResult = this.scraper.scrapeListings(doc);

    return listingsResult.chainAsync(async listings => {
      const opportunities: RestockOpportunity[] = [];

      const { results } = await pool(
        listings,
        async listing => {
          const priceResult = await this.pricer.getPrice(listing.itemName);
          if (priceResult.isErr()) return null;

          const marketPrice = priceResult.unwrap().price;
          const profit = marketPrice.subtract(listing.price);
          if (profit.isGreaterThan(config.profitThreshold)) {
            return { listing, marketPrice, profit } satisfies RestockOpportunity;
          }
          return null;
        },
        { concurrency: config.concurrency ?? 3 },
      );

      for (const opp of results) {
        if (!opp) continue;
        opportunities.push(opp);
        await this.buyer.buy(opp.listing);
      }

      return Ok.from(opportunities);
    });
  }
}
