import type { Result } from '@core/result';
import type { BetAdvisorContract } from '@application/BetForecast/BetAdvisorContract';
import type { BetSubmitterContract } from '@application/BetForecast/BetSubmitterContract';

export class PlaceOptimalBetsUseCase {
  constructor(
    private readonly advisor: BetAdvisorContract,
    private readonly submitter: BetSubmitterContract,
  ) {}

  async execute(): Promise<Result<void>> {
    return (await this.advisor.getRecommendations()).chainAsync(recs =>
      this.submitter.placeAllBets(recs),
    );
  }
}
