import type { Signal } from "@core/Signal";
import type { NeoPoint } from "@domain/shared/NeoPoint";

export type RestockConfig = {
  readonly autobuyEnabled: boolean;
  readonly autorefreshEnabled: boolean;
  readonly refreshFrequencyMs: number;
  readonly shopId: string;
  readonly minProfitMargin: NeoPoint;
};

export type BestItem = {
  readonly name: string;
  readonly value: string;
  readonly profitable: boolean;
};

export interface IRestockPanel {
  mount(
    shops: Record<string, string>,
    config: Signal<RestockConfig>,
    bestItem: Signal<BestItem | null>,
  ): void;
  onConfigChange(handler: (config: RestockConfig) => void): void;
  onRefreshPrices(handler: () => void): void;
}
