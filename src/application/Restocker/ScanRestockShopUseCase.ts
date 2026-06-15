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

export type BestItem = {
  readonly name: string;
  readonly profitAmount: number;
};

export type ScanResult = {
  readonly opportunities: RestockOpportunity[];
  readonly bestItem: BestItem | null;
};

export class ScanRestockShopUseCase {
  constructor(
    private readonly navigator: INavigator,
    private readonly scraper: IRestockShopScraper,
    private readonly pricer: IPriceChecker,
    private readonly buyer: IRestockBuyer,
  ) {}

  async execute(config: ScanConfig): Promise<Result<ScanResult>> {
    const doc = this.navigator.currentDocument();
    const listingsResult = this.scraper.scrapeListings(doc);

    return listingsResult.chainAsync(async listings => {
      const opportunities: RestockOpportunity[] = [];
      let bestItem: BestItem | null = null;

      const { results } = await pool(
        listings,
        async listing => {
          const priceResult = await this.pricer.getPrice(listing.itemName);
          if (priceResult.isErr()) return null;
          const marketPrice = priceResult.unwrap().price;
          return { listing, marketPrice };
        },
        { concurrency: config.concurrency ?? 3 },
      );

      for (const result of results) {
        if (!result) continue;
        const { listing, marketPrice } = result;
        const profitAmount = marketPrice.amount - listing.price.amount;

        if (!bestItem || profitAmount > bestItem.profitAmount) {
          bestItem = { name: String(listing.itemName), profitAmount };
        }

        if (profitAmount > config.profitThreshold.amount) {
          const opp: RestockOpportunity = {
            listing,
            marketPrice,
            profit: marketPrice.subtract(listing.price),
          };
          opportunities.push(opp);
          await this.buyer.buy(opp.listing);
        }
      }

      return Ok.from({ opportunities, bestItem });
    });
  }
}
