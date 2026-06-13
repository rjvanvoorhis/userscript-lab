import type { Result } from '@core/result';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type BetRecommendation = {
  readonly competitorName: string;
  readonly amount: NeoPoint;
};

export interface BetAdvisorContract {
  getRecommendations(): Promise<Result<BetRecommendation[]>>;
}
