import type { Result } from '@core/result';
import type { IBetAdvisor } from '@application/BetForecast/IBetAdvisor';
import type { IBetSubmitter } from '@application/BetForecast/IBetSubmitter';

export class PlaceOptimalBetsUseCase {
  constructor(
    private readonly advisor: IBetAdvisor,
    private readonly submitter: IBetSubmitter,
  ) {}

  async execute(): Promise<Result<void>> {
    return (await this.advisor.getRecommendations()).chainAsync(recs =>
      this.submitter.placeAllBets(recs),
    );
  }
}
