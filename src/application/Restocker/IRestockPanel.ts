import type { NeoPoint } from "@domain/shared/NeoPoint";

export type RestockConfig = {
  readonly autobuyEnabled: boolean;
  readonly autorefreshEnabled: boolean;
  readonly refreshFrequencyMs: number;
  readonly shopId: string;
  readonly minProfitMargin: NeoPoint;
};

export interface IRestockPanel {
  mount(shops: Record<string, string>, initial: RestockConfig): void;
  onConfigChange(handler: (config: RestockConfig) => void): void;
  onRefreshPrices(handler: () => void): void;
  setBestItem(name: string, value: string, profitable: boolean): void;
}
