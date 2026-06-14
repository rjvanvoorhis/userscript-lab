import { attemptAsync, Ok, Err, type Result } from "@core/result";
import type { IShopPurchaser } from "@application/ItemBuyer/IShopPurchaser";
import type { ShopListing } from "@domain/shared/ShopListing";
import type { PurchaseAttempt } from "@domain/ItemBuyer/PurchaseAttempt";
import type { ICaptchaSolver } from "@infrastructure/ItemBuyer/CaptchaSolver";
import type { IDocument } from "@application/shared/IDocument";

export class NPCShopBuyerAdapter implements IShopPurchaser {
  constructor(
    private readonly solver: ICaptchaSolver,
    private readonly document: IDocument,
  ) {}

  private isSoldOut() {
    return this.document.containsText("SOLD OUT!");
  }

  private getCaptchaImage() {
    const el = this.document.querySelector<HTMLInputElement>("input[type='image']");
    if (!el) {
      return Err.from<string>(new Error("Captcha image not found"));
    }
    return Ok.from(el.src);
  }

  async purchase(listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    if (this.isSoldOut()) {
      return Ok.from({ listing, succeeded: false });
    }
    return (
      await this.getCaptchaImage().chainAsync((url) => this.solver.solve(url))
    ).chainAsync((coords) =>
      attemptAsync(async () => {
        const body = new URLSearchParams();
        body.append("current_offer", listing.price.toString());
        body.append("x", coords.x.toString());
        body.append("y", coords.y.toString());
        const response = await fetch(this.document.getHref(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          method: "POST",
          body,
        });
        if ((await response.text()).includes("accept your offer")) {
          return { listing, succeeded: true };
        }

        return { listing, succeeded: false };
      }),
    );
  }
}
