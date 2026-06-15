import type { Result } from '@core/result';
import { Ok } from '@core/result';
import { pool } from '@core/concurrency/pool';
import { NeoPoint } from '@domain/shared/NeoPoint';
import type { INavigator } from '@application/shared/INavigator';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { IInventory } from '@application/shared/IInventory';
import type { IItemBuyer } from '@application/shared/IItemBuyer';
import type { QuestRequirement } from '@domain/RequirementFetcher/QuestRequirement';
import type { ItemName } from '@domain/shared/ItemName';
import type { ShopListing } from '@domain/shared/ShopListing';

export type PurchaseResult = {
  readonly requirement: QuestRequirement;
  readonly outcome: Result<ShopListing>;
};

export interface QuestPageScraperContract {
  scrapeRequiredItems(doc: Document): ItemName[];
}

export class QuestUseCase {
  constructor(
    private readonly navigator: INavigator,
    private readonly scraper: QuestPageScraperContract,
    private readonly inventory: IInventory,
    private readonly pricer: IPriceChecker,
    private readonly buyer: IItemBuyer,
    private readonly maxPriceMultiplier: number = 1.2,
  ) {}

  async fetch(): Promise<Result<QuestRequirement[]>> {
    const doc = this.navigator.currentDocument();
    const itemNames = this.scraper.scrapeRequiredItems(doc);

    const requirements: QuestRequirement[] = await Promise.all(
      itemNames.map(async itemName => {
        const inventoryResult = await this.inventory.findItem(itemName);
        const quantityOwned = inventoryResult.isOK() ? (inventoryResult.unwrap()?.quantity ?? 0) : 0;

        const priceResult = await this.pricer.getPrice(itemName);
        const estimatedCost = priceResult.isOK() ? priceResult.unwrap().price : null;

        return { itemName, quantityNeeded: 1, quantityOwned, estimatedCost };
      }),
    );

    return Ok.from(requirements);
  }

  async purchase(requirements: QuestRequirement[]): Promise<Result<PurchaseResult[]>> {
    const unowned = requirements.filter(r => r.quantityOwned < r.quantityNeeded);

    const { results } = await pool(
      unowned,
      async requirement => {
        const maxPrice = this.resolveMaxPrice(requirement);
        const outcome = await this.buyer.buyItem(requirement.itemName, maxPrice);
        return { requirement, outcome };
      },
      { concurrency: 1 },
    );

    return Ok.from(results);
  }

  private resolveMaxPrice(requirement: QuestRequirement): NeoPoint {
    if (!requirement.estimatedCost) {
      throw new Error(`No estimated cost for "${requirement.itemName}" — cannot determine max price`);
    }
    return NeoPoint.from(Math.floor(requirement.estimatedCost.amount * this.maxPriceMultiplier));
  }
}
