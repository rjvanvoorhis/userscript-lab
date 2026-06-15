import { sleep } from "@core/concurrency/sleep";
import { Signal } from "@core/Signal";
import { HISTORICAL_PRICE_CACHE_KEY } from "@core/constants";
import { NEOPETS_SHOPS } from "@core/shops";
import { NeoPoint } from "@domain/shared/NeoPoint";
import type { BestItem, RestockConfig } from "@application/Restocker/IRestockPanel";
import type { ScanRestockShopUseCase } from "@application/Restocker/ScanRestockShopUseCase";
import { HistoricalPriceAdapter } from "@infrastructure/PriceChecker/HistoricalPriceAdapter";
import { LocalStorageAdapter } from "@infrastructure/shared/LocalStorageAdapter";
import { NavigatorAdapter } from "@infrastructure/shared/NavigatorAdapter";
import { RestockPanelAdapter } from "@infrastructure/Restocker/RestockPanelAdapter";

const STORAGE_KEY = "restocker_config";

type PersistedConfig = {
  readonly autobuyEnabled: boolean;
  readonly autorefreshEnabled: boolean;
  readonly refreshFrequencyMs: number;
  readonly shopId: string;
  readonly minProfitMarginAmount: number;
};

function toPersistedConfig(config: RestockConfig): PersistedConfig {
  return { ...config, minProfitMarginAmount: config.minProfitMargin.amount };
}

function fromPersistedConfig(data: PersistedConfig): RestockConfig {
  return { ...data, minProfitMargin: NeoPoint.from(data.minProfitMarginAmount) };
}

export class RestockPresenter {
  private readonly storage = new LocalStorageAdapter();
  private readonly navigator = new NavigatorAdapter();
  private readonly panel = new RestockPanelAdapter();

  constructor(private readonly useCase: ScanRestockShopUseCase) {}

  async start(defaults: RestockConfig): Promise<void> {
    const stored = await this.storage.get(STORAGE_KEY) as PersistedConfig | null;
    const config: RestockConfig = stored
      ? { ...fromPersistedConfig(stored), shopId: defaults.shopId }
      : defaults;

    const configSignal = new Signal<RestockConfig>(config);
    const bestItemSignal = new Signal<BestItem | null>(null);

    const shopNames = Object.fromEntries(
      Object.entries(NEOPETS_SHOPS).map(([id, { name }]) => [id, name]),
    );

    this.panel.mount(shopNames, configSignal, bestItemSignal);

    this.panel.onConfigChange(async (next) => {
      const prevShopId = configSignal.value.shopId;
      configSignal.set(next);
      await this.storage.set(STORAGE_KEY, toPersistedConfig(next));
      if (next.shopId !== prevShopId) {
        const shop = NEOPETS_SHOPS[next.shopId];
        if (shop) await this.navigator.navigateTo(shop.url);
      }
    });

    this.panel.onRefreshPrices(async () => {
      await this.storage.remove(HISTORICAL_PRICE_CACHE_KEY);
      const fresh = await HistoricalPriceAdapter.fetchSnapshot();
      const freshPricer = HistoricalPriceAdapter.fromSnapshot(fresh);
      await this.storage.set(HISTORICAL_PRICE_CACHE_KEY, freshPricer.getData());
      await this.navigator.navigateTo(this.navigator.currentDocument().location.href);
    });

    await this.run(configSignal, bestItemSignal);
  }

  private async run(
    configSignal: Signal<RestockConfig>,
    bestItemSignal: Signal<BestItem | null>,
  ): Promise<void> {
    const config = configSignal.value;
    if (!config.autobuyEnabled && !config.autorefreshEnabled) return;

    if (config.autobuyEnabled && await this.scanAndBuy(configSignal, bestItemSignal)) return;

    if (config.autorefreshEnabled) {
      await sleep(config.refreshFrequencyMs);
      await this.navigator.navigateTo(this.navigator.currentDocument().location.href);
    }
  }

  private async scanAndBuy(
    configSignal: Signal<RestockConfig>,
    bestItemSignal: Signal<BestItem | null>,
  ): Promise<boolean> {
    const config = configSignal.value;
    const result = await this.useCase.execute({ profitThreshold: config.minProfitMargin });
    if (result.isErr()) return false;

    const { bestItem, purchased } = result.unwrap();

    if (bestItem) {
      const sign = bestItem.profitAmount >= 0 ? "+" : "-";
      const abs = Math.abs(bestItem.profitAmount).toLocaleString();
      bestItemSignal.set({
        name: bestItem.name,
        value: `${sign}${abs} NP`,
        profitable: bestItem.profitAmount > 0,
      });
    }

    if (purchased) {
      const next = { ...config, autobuyEnabled: false, autorefreshEnabled: false };
      configSignal.set(next);
      await this.storage.set(STORAGE_KEY, toPersistedConfig(next));
    }

    return purchased;
  }
}
