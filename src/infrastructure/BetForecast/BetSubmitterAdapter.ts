import type { Result } from '@core/result';
import type { BetSubmitterContract } from '@application/BetForecast/BetSubmitterContract';
import type { BetRecommendation } from '@application/BetForecast/BetAdvisorContract';

export class BetSubmitterAdapter implements BetSubmitterContract {
  placeAllBets(_recommendations: BetRecommendation[]): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
