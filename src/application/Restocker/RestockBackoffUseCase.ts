import { sleep } from '@core/concurrency/sleep';
import { exponentialBackoff } from '@core/concurrency/policies/exponential';
import type { ScanRestockShopUseCase, ScanConfig } from '@application/Restocker/ScanRestockShopUseCase';
import type { RestockOpportunity } from '@domain/Restocker/RestockOpportunity';

export type BackoffConfig = {
  readonly maxCycles: number;
  readonly baseDelayMs?: number;
};

export class RestockBackoffUseCase {
  private readonly policy = exponentialBackoff({ base: 2000, max: 30000 });

  constructor(private readonly scanner: ScanRestockShopUseCase) {}

  async execute(scanConfig: ScanConfig, backoffConfig: BackoffConfig): Promise<RestockOpportunity[]> {
    const all: RestockOpportunity[] = [];

    for (let cycle = 0; cycle < backoffConfig.maxCycles; cycle++) {
      const result = await this.scanner.execute(scanConfig);
      if (result.isOK()) {
        all.push(...result.unwrap());
      }

      if (cycle < backoffConfig.maxCycles - 1) {
        await sleep(this.policy(cycle));
      }
    }

    return all;
  }
}
