import { Ok, Err, type Result } from "@core/result";
import { ItemName } from "@domain/shared/ItemName";
import { NeoPoint } from "@domain/shared/NeoPoint";
import type { ShopListing } from "@domain/shared/ShopListing";
import type { IRestockShopScraper } from "@application/Restocker/IRestockShopScraper";

export class RestockShopScraper implements IRestockShopScraper {
  scrapeListings(doc: Document): Result<ShopListing[]> {
    const grid = doc.querySelector(".shop-grid");
    if (!grid) return Err.from("shop-grid not found on page");

    const shopUrl = doc.location.href;
    const listings: ShopListing[] = [];

    for (const item of grid.querySelectorAll(".shop-item")) {
      const imgEl = item.querySelector<HTMLElement>(".item-img");
      if (!imgEl) continue;

      const purchaseLink = imgEl.dataset.link;
      const rawName = imgEl.dataset.name;
      const rawPrice = imgEl.dataset.price;

      if (!purchaseLink || !rawName || !rawPrice) continue;

      let itemName: ItemName;
      let price: NeoPoint;
      try {
        itemName = ItemName.from(rawName);
        price = NeoPoint.from(Number.parseInt(rawPrice.replace(/,/g, ""), 10));
      } catch {
        console.error(`Failed to parse listing: ${rawName}`);
        continue;
      }

      listings.push({ itemName, price, shopOwner: "NPC", shopUrl, purchaseLink });
    }

    return Ok.from(listings);
  }
}
