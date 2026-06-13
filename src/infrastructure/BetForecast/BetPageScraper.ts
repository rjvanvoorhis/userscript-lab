import type { Result } from '@core/result';
import type { NavigatorContract } from '@application/shared/NavigatorContract';
import type { Competitor } from '@domain/shared/Competitor';

export class BetPageScraper {
  constructor(_navigator: NavigatorContract) {}

  scrapeCompetitors(): Promise<Result<Competitor[]>> {
    throw new Error('Not implemented');
  }
}
