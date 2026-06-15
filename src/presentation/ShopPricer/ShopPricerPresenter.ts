import type { PriceShopItemsUseCase } from '@application/ShopPricer/PriceShopItemsUseCase';

export class ShopPricerPresenter {
  constructor(private readonly useCase: PriceShopItemsUseCase) {}

  start(): void {
    this.useCase.execute();
  }
}
