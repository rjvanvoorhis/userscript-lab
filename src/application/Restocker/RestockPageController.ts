import { sleep } from "@core/concurrency/sleep";
import { Signal } from "@core/Signal";
import { NeoPoint } from "@domain/shared/NeoPoint";
import type { INavigator } from "@application/shared/INavigator";
import type { IStorage } from "@application/shared/IStorage";
import type { ScanRestockShopUseCase } from "@application/Restocker/ScanRestockShopUseCase";
import type {
  BestItem,
  IRestockPanel,
  RestockConfig,
} from "@application/Restocker/IRestockPanel";

const STORAGE_KEY = "restocker_config";

type PersistedConfig = {
  readonly autobuyEnabled: boolean;
  readonly autorefreshEnabled: boolean;
  readonly refreshFrequencyMs: number;
  readonly shopId: string;
  readonly minProfitMarginAmount: number;
};

export type ShopEntry = {
  readonly name: string;
  readonly url: string;
};

function toPersistedConfig(config: RestockConfig): PersistedConfig {
  return { ...config, minProfitMarginAmount: config.minProfitMargin.amount };
}

function fromPersistedConfig(data: PersistedConfig): RestockConfig {
  return { ...data, minProfitMargin: NeoPoint.from(data.minProfitMarginAmount) };
}

export class RestockPageController {
  constructor(
    private readonly panel: IRestockPanel,
    private readonly scanner: ScanRestockShopUseCase,
    private readonly navigator: INavigator,
    private readonly storage: IStorage,
    private readonly shops: Record<string, ShopEntry>,
  ) {}

  async start(defaults: RestockConfig): Promise<void> {
    const stored = await this.storage.get(STORAGE_KEY) as PersistedConfig | null;
    const config: RestockConfig = stored
      ? { ...fromPersistedConfig(stored), shopId: defaults.shopId }
      : defaults;

    const configSignal = new Signal<RestockConfig>(config);
    const bestItemSignal = new Signal<BestItem | null>(null);

    const shopNames = Object.fromEntries(
      Object.entries(this.shops).map(([id, { name }]) => [id, name]),
    );

    this.panel.mount(shopNames, configSignal, bestItemSignal);
    this.panel.onConfigChange(async (next) => {
      const prevShopId = configSignal.value.shopId;
      configSignal.set(next);
      await this.storage.set(STORAGE_KEY, toPersistedConfig(next));
      if (next.shopId !== prevShopId) {
        const shop = this.shops[next.shopId];
        if (shop) await this.navigator.navigateTo(shop.url);
      }
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
    const result = await this.scanner.execute({ profitThreshold: config.minProfitMargin });
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
