import type { Result } from '@core/result';
import type { BetRecommendation } from '@application/BetForecast/IBetAdvisor';

export interface IBetSubmitter {
  placeAllBets(recommendations: BetRecommendation[]): Promise<Result<void>>;
}
