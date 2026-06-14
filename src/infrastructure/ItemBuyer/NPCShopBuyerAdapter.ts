import type { Result } from '@core/result';
import type { ShopPurchaserContract } from '@application/ItemBuyer/ShopPurchaserContract';
import type { ShopListing } from '@domain/shared/ShopListing';
import type { PurchaseAttempt } from '@domain/ItemBuyer/PurchaseAttempt';
import type { ICaptchaSolver } from '@infrastructure/ItemBuyer/CaptchaSolver';

export class NPCShopBuyerAdapter implements ShopPurchaserContract {
  constructor (private solver: ICaptchaSolver){}
  
  purchase(_listing: ShopListing): Promise<Result<PurchaseAttempt>> {
    throw new Error('Not implemented');
  }

  private solveCaptcha(imgUrl: string){}
}
