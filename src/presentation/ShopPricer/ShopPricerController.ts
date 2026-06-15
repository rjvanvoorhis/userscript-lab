import type { PriceShopItemsUseCase } from '@application/ShopPricer/PriceShopItemsUseCase';
import { ShopPricerPresenter } from './ShopPricerPresenter';

export class ShopPricerController {
  private readonly presenter: ShopPricerPresenter;

  constructor(useCase: PriceShopItemsUseCase) {
    this.presenter = new ShopPricerPresenter(useCase);
  }

  start(): Promise<void> {
    this.presenter.start();
    return Promise.resolve();
  }
}
