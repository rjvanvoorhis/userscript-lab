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
    const config = stored ? fromPersistedConfig(stored) : defaults;

    const shopNames = Object.fromEntries(
      Object.entries(this.shops).map(([id, { name }]) => [id, name]),
    );

    this.panel.mount(shopNames, config);
    this.panel.onConfigChange((next) =>
      this.storage.set(STORAGE_KEY, toPersistedConfig(next)),
    );

    await this.run(config);
  }

  private async run(config: RestockConfig): Promise<void> {
    if (!config.autobuyEnabled && !config.autorefreshEnabled) return;

    if (config.autobuyEnabled) {
      await this.scanner.execute({ profitThreshold: config.minProfitMargin });
    }

    if (config.autorefreshEnabled) {
      const shop = this.shops[config.shopId];
      if (!shop) return;
      await sleep(config.refreshFrequencyMs);
      await this.navigator.navigateTo(shop.url);
    }
  }
}
