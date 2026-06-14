import type { Result } from '@core/result';
import type { IBetSubmitter } from '@application/BetForecast/IBetSubmitter';
import type { BetRecommendation } from '@application/BetForecast/IBetAdvisor';

export class BetSubmitterAdapter implements IBetSubmitter {
  placeAllBets(_recommendations: BetRecommendation[]): Promise<Result<void>> {
    throw new Error('Not implemented');
  }
}
