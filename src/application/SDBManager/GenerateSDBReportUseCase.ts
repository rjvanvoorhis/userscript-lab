import type { Result } from '@core/result';
import { Ok } from '@core/result';
import type { IInventory } from '@application/shared/IInventory';

export type SDBReport = {
  readonly totalItems: number;
  readonly totalUniqueItems: number;
  readonly entries: ReadonlyArray<{ name: string; quantity: number; location: string }>;
};

export class GenerateSDBReportUseCase {
  constructor(private readonly inventory: IInventory) {}

  async execute(): Promise<Result<SDBReport>> {
    const result = await this.inventory.listAll();

    return result.chainAsync(async entries => {
      const totalItems = entries.reduce((sum, e) => sum + e.quantity, 0);

      return Ok.from({
        totalItems,
        totalUniqueItems: entries.length,
        entries: entries.map(e => ({
          name: e.itemName.toString(),
          quantity: e.quantity,
          location: e.location,
        })),
      });
    });
  }
}
