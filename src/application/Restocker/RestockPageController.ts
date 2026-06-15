import { sleep } from "@core/concurrency/sleep";
import { NeoPoint } from "@domain/shared/NeoPoint";
import type { INavigator } from "@application/shared/INavigator";
import type { IStorage } from "@application/shared/IStorage";
import type { ScanRestockShopUseCase } from "@application/Restocker/ScanRestockShopUseCase";
import type { IRestockPanel, RestockConfig } from "@application/Restocker/IRestockPanel";

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
    // shopId always comes from the URL (defaults); all other settings restored from storage
    const config: RestockConfig = stored
      ? { ...fromPersistedConfig(stored), shopId: defaults.shopId }
      : defaults;

    const shopNames = Object.fromEntries(
      Object.entries(this.shops).map(([id, { name }]) => [id, name]),
    );

    this.panel.mount(shopNames, config);
    this.panel.onConfigChange(async (next) => {
      await this.storage.set(STORAGE_KEY, toPersistedConfig(next));
      if (next.shopId !== config.shopId) {
        const shop = this.shops[next.shopId];
        if (shop) await this.navigator.navigateTo(shop.url);
      }
    });

    await this.run(config);
  }

  private async run(config: RestockConfig): Promise<void> {
    if (!config.autobuyEnabled && !config.autorefreshEnabled) return;

    if (config.autobuyEnabled) {
      const result = await this.scanner.execute({ profitThreshold: config.minProfitMargin });
      if (result.isOK()) {
        const { bestItem } = result.unwrap();
        if (bestItem) {
          const sign = bestItem.profitAmount >= 0 ? '+' : '-';
          const abs = Math.abs(bestItem.profitAmount).toLocaleString();
          this.panel.setBestItem(bestItem.name, `${sign}${abs} NP`);
        }
      }
    }

    if (config.autorefreshEnabled) {
      await sleep(config.refreshFrequencyMs);
      await this.navigator.navigateTo(this.navigator.currentDocument().location.href);
    }
  }
}
