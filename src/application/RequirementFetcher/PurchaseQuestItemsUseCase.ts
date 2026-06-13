import type { Result } from '@core/result';
import { Ok } from '@core/result';
import { pool } from '@core/concurrency/pool';
import { NeoPoint } from '@domain/shared/NeoPoint';
import type { ItemBuyerContract } from '@application/shared/ItemBuyerContract';
import type { QuestRequirement } from '@domain/RequirementFetcher/QuestRequirement';
import type { ShopListing } from '@domain/shared/ShopListing';

export type PurchaseResult = {
  readonly requirement: QuestRequirement;
  readonly outcome: Result<ShopListing>;
};

export class PurchaseQuestItemsUseCase {
  constructor(
    private readonly buyer: ItemBuyerContract,
    private readonly maxPriceMultiplier: number = 1.2,
  ) {}

  async execute(requirements: QuestRequirement[]): Promise<Result<PurchaseResult[]>> {
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
