import type { Result } from '@core/result';
import type { INavigator } from '@application/shared/INavigator';
import type { Competitor } from '@domain/shared/Competitor';

export class BetPageScraper {
  constructor(_navigator: INavigator) {}

  scrapeCompetitors(): Promise<Result<Competitor[]>> {
    throw new Error('Not implemented');
  }
}
