import type { Result } from '@core/result';
import type { BetRecommendation } from '@application/BetForecast/BetAdvisorContract';

export interface BetSubmitterContract {
  placeAllBets(recommendations: BetRecommendation[]): Promise<Result<void>>;
}
