import type { ItemName } from "@domain/shared/ItemName";
import type { NeoPoint } from "@domain/shared/NeoPoint";

export type ShopPricerRow = {
  readonly itemName: ItemName;
  readonly onImageClick: (handler: () => void) => void;
  readonly setPriceField: (price: NeoPoint) => void;
  readonly markUnavailable: () => void;
};

export interface IShopPricerPage {
  getRows(): ShopPricerRow[];
}
