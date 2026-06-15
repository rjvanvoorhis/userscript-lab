import type { PlaceOptimalBetsUseCase } from '@application/BetForecast/PlaceOptimalBetsUseCase';
import { BetForecastPresenter } from './BetForecastPresenter';

export class BetForecastController {
  private readonly presenter: BetForecastPresenter;

  constructor(useCase: PlaceOptimalBetsUseCase) {
    this.presenter = new BetForecastPresenter(useCase);
  }

  start(): Promise<void> {
    return this.presenter.start();
  }
}
