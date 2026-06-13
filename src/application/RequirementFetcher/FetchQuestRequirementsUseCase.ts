import type { Result } from '@core/result';
import { Ok } from '@core/result';
import type { NavigatorContract } from '@application/shared/NavigatorContract';
import type { PriceCheckerContract } from '@application/shared/PriceCheckerContract';
import type { InventoryContract } from '@application/shared/InventoryContract';
import type { QuestRequirement } from '@domain/RequirementFetcher/QuestRequirement';
import type { ItemName } from '@domain/shared/ItemName';

export interface QuestPageScraperContract {
  scrapeRequiredItems(doc: Document): ItemName[];
}

export class FetchQuestRequirementsUseCase {
  constructor(
    private readonly navigator: NavigatorContract,
    private readonly scraper: QuestPageScraperContract,
    private readonly inventory: InventoryContract,
    private readonly pricer: PriceCheckerContract,
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
