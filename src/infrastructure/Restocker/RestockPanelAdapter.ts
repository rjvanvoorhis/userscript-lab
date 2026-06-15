import type { Signal } from "@core/Signal";
import type {
  BestItem,
  IRestockPanel,
  RestockConfig,
} from "@application/Restocker/IRestockPanel";
import { RestockPanel } from "@presentation/Restocker";

export class RestockPanelAdapter implements IRestockPanel {
  private configHandler: ((config: RestockConfig) => void) | null = null;
  private refreshHandler: (() => void) | null = null;

  mount(
    shops: Record<string, string>,
    config: Signal<RestockConfig>,
    bestItem: Signal<BestItem | null>,
  ): void {
    document.body.appendChild(
      RestockPanel({
        shops,
        config,
        bestItem,
        onConfigChange: (c) => this.configHandler?.(c),
        onRefreshPrices: () => this.refreshHandler?.(),
      }),
    );
  }

  onConfigChange(handler: (config: RestockConfig) => void): void {
    this.configHandler = handler;
  }

  onRefreshPrices(handler: () => void): void {
    this.refreshHandler = handler;
  }
}
