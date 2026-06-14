import type { ItemName } from "@domain/shared/ItemName";
import type { NeoPoint } from "@domain/shared/NeoPoint";

export type ShopListing = {
  readonly itemName: ItemName;
  readonly price: NeoPoint;
  readonly shopOwner: string;
  readonly shopUrl: string;
  readonly purchaseLink: string;
};
