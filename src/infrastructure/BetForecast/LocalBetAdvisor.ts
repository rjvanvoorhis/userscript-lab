import { Ok } from '@core/result';
import type { Result } from '@core/result';
import type { BetAdvisorContract, BetRecommendation } from '@application/BetForecast/BetAdvisorContract';
import type { Competitor } from '@domain/shared/Competitor';
import { NeoPoint } from '@domain/shared/NeoPoint';
import type { BetOutcome } from '@domain/BetForecast/BetOutcome';
import type { BetPageScraper } from '@infrastructure/BetForecast/BetPageScraper';
import type { BetRecordAdapter } from '@infrastructure/BetForecast/BetRecordAdapter';

const MIN_ROI_THRESHOLD = 0.05;
const DEFAULT_BET_AMOUNT = NeoPoint.from(50);

export class LocalBetAdvisor implements BetAdvisorContract {
  constructor(
    private readonly scraper: BetPageScraper,
    private readonly records: BetRecordAdapter,
  ) {}

  async getRecommendations(): Promise<Result<BetRecommendation[]>> {
    const [competitorsResult, historyResult] = await Promise.all([
      this.scraper.scrapeCompetitors(),
      this.records.loadHistory(),
    ]);

    const outcomes = historyResult.isOK() ? historyResult.unwrap().outcomes : [];

    return competitorsResult.chainAsync(async competitors => {
      const recs: BetRecommendation[] = competitors.flatMap(competitor => {
        const impliedOdds = this.calculateImpliedOdds(competitor, outcomes as BetOutcome[]);
        const expectedROI = impliedOdds * competitor.odds - 1;
        if (expectedROI < MIN_ROI_THRESHOLD) return [];
        return [{ competitorName: competitor.name, amount: DEFAULT_BET_AMOUNT }];
      });
      return Ok.from(recs);
    });
  }

  private calculateImpliedOdds(competitor: Competitor, outcomes: BetOutcome[]): number {
    const relevant = outcomes.filter(o => o.competitor.name === competitor.name);
    if (relevant.length === 0) {
      const wins = competitor.recentRecord.filter(r => r > 0).length;
      return competitor.recentRecord.length > 0 ? wins / competitor.recentRecord.length : 0.5;
    }
    return relevant.filter(o => o.won).length / relevant.length;
  }
}
