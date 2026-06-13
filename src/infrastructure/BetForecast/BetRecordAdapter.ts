import type { Result } from '@core/result';
import type { BetOutcome } from '@domain/BetForecast/BetOutcome';

export type BetHistory = {
  readonly outcomes: readonly BetOutcome[];
};

export class BetRecordAdapter {
  loadHistory(): Promise<Result<BetHistory>> {
    throw new Error('Not implemented');
  }

  saveHistory(_history: BetHistory): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
