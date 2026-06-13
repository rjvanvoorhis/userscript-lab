import type { Competitor } from '@domain/shared/Competitor';
import type { NeoPoint } from '@domain/shared/NeoPoint';

export type BetOutcome = {
  readonly competitor: Competitor;
  readonly betAmount: NeoPoint;
  readonly payout: NeoPoint;
  readonly won: boolean;
};
