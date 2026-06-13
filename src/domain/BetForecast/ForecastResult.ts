import type { Competitor } from '@domain/shared/Competitor';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type ForecastResult = {
  readonly competitor: Competitor;
  readonly impliedOdds: number;
  readonly expectedROI: number;
  readonly recommendedBet: NeoPoint | null;
};
