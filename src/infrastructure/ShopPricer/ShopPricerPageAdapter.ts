import { ItemName } from "@domain/shared/ItemName";
import type { IShopPricerPage, ShopPricerRow } from "@application/ShopPricer/IShopPricerPage";

export class ShopPricerPageAdapter implements IShopPricerPage {
  getRows(): ShopPricerRow[] {
    const form = document.querySelector<HTMLFormElement>(
      'form[action="process_market.phtml"]',
    );
    if (!form) return [];

    return Array.from(form.querySelectorAll("tr")).flatMap((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return [];

      const nameEl = cells[0].querySelector("b");
      const imageEl = cells[1].querySelector<HTMLElement>("input[type='image'], img");
      const priceInput = row.querySelector<HTMLInputElement>(
        "input[name='cost_1']",
      );

      if (!nameEl || !imageEl || !priceInput) return [];

      const rawName = nameEl.textContent?.trim() ?? "";
      let itemName: ItemName;
      try {
        itemName = ItemName.from(rawName);
      } catch {
        return [];
      }

      return [
        {
          itemName,
          onImageClick: (handler) => {
            imageEl.style.cursor = "pointer";
            imageEl.addEventListener("click", handler);
          },
          setPriceField: (price) => {
            priceInput.style.background = "";
            priceInput.value = price.amount.toString();
          },
          markUnavailable: () => {
            priceInput.style.background = "#ffcccc";
            priceInput.value = "0";
          },
        } satisfies ShopPricerRow,
      ];
    });
  }
}
