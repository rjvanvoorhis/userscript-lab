import type { Result } from '@core/result';
import { Ok } from '@core/result';
import type { INavigator } from '@application/shared/INavigator';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { IInventory } from '@application/shared/IInventory';
import type { QuestRequirement } from '@domain/RequirementFetcher/QuestRequirement';
import type { ItemName } from '@domain/shared/ItemName';

export interface QuestPageScraperContract {
  scrapeRequiredItems(doc: Document): ItemName[];
}

export class FetchQuestRequirementsUseCase {
  constructor(
    private readonly navigator: INavigator,
    private readonly scraper: QuestPageScraperContract,
    private readonly inventory: IInventory,
    private readonly pricer: IPriceChecker,
  ) {}

  async execute(): Promise<Result<QuestRequirement[]>> {
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
}
