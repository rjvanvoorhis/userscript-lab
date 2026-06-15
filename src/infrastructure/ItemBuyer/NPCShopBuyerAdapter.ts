import { attemptAsync, Ok, Err, type Result } from "@core/result";
import { createLogger } from "@core/logger";
import type { IShopPurchaser } from "@application/ItemBuyer/IShopPurchaser";
import type { ShopListing } from "@domain/shared/ShopListing";
import type { PurchaseAttempt } from "@domain/ItemBuyer/PurchaseAttempt";
import type { ICaptchaSolver } from "@infrastructure/ItemBuyer/CaptchaSolver";
import type { IDocument } from "@application/shared/IDocument";

const logger = createLogger({ context: 'NPCShopBuyerAdapter' });

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
    const item = String(listing.itemName);

    if (this.isSoldOut()) {
      logger.debug('Item sold out, skipping', { item });
      return Ok.from({ listing, succeeded: false });
    }

    return (
      await this.getCaptchaImage()
        .chainAsync((url) => {
          logger.debug('Solving captcha', { item, url });
          return this.solver.solve(url);
        })
        .then((r) => r.tapErr(() => logger.warn('Captcha solve failed', { item })))
    ).chainAsync((coords) =>
      attemptAsync(async () => {
        logger.debug('Submitting purchase', { item, price: listing.price.amount, purchaseLink: listing.purchaseLink, coords });
        const body = new URLSearchParams();
        body.append("current_offer", String(listing.price.amount));
        body.append("x", coords.x.toString());
        body.append("y", coords.y.toString());
        const response = await fetch(listing.purchaseLink, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          method: "POST",
          body,
        });
        const text = await response.text();
        const succeeded = text.includes("accept your offer");
        logger.info('Purchase result', { item, succeeded });
        return { listing, succeeded };
      }),
    );
  }
}
