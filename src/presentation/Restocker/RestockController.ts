import type { ScanRestockShopUseCase } from "@application/Restocker/ScanRestockShopUseCase";
import type { RestockConfig } from "@application/Restocker/IRestockPanel";
import { RestockPresenter } from "./RestockPresenter";

export class RestockController {
  private readonly presenter: RestockPresenter;

  constructor(useCase: ScanRestockShopUseCase) {
    this.presenter = new RestockPresenter(useCase);
  }

  start(defaults: RestockConfig): Promise<void> {
    return this.presenter.start(defaults);
  }
}
