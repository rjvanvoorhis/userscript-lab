import { createLogger } from '@core/logger';
import type { PlaceOptimalBetsUseCase } from '@application/BetForecast/PlaceOptimalBetsUseCase';

const logger = createLogger({ context: 'BetForecastPresenter' });

export class BetForecastPresenter {
  constructor(private readonly useCase: PlaceOptimalBetsUseCase) {}

  async start(): Promise<void> {
    const result = await this.useCase.execute();
    if (result.isErr()) logger.error('Bet placement failed');
  }
}
