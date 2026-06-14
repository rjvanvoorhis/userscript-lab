import { Ok, type Result } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';
import { NeoPoint } from '@domain/shared';
import { HISTORICAL_PRICE_API_BASE } from '@core/constants';

export type SnapshotItem = {
  ImgURL: string;
  Price: string | null;
  LastPrice: string | null;
}

export type Snapshot = Record<string, SnapshotItem>;
type ItemData = Record<string, number>;

export class HistoricalPriceAdapter implements IPriceChecker {

  constructor (private _data: ItemData){}

  static async fetchSnapshot(url: string = HISTORICAL_PRICE_API_BASE): Promise<Snapshot> {
    const result = await fetch(url);
    return result.json();
  }

  static async fromUrl(url: string = HISTORICAL_PRICE_API_BASE) {
    return HistoricalPriceAdapter.fromSnapshot(await HistoricalPriceAdapter.fetchSnapshot(url));
  }

  static fromSnapshot(snapshot: Snapshot){
      const data: ItemData = Object.fromEntries(Object.entries(snapshot).map(([key, value]) => ([key, Number.parseInt(value.Price || value.LastPrice || "0")])));
      return new HistoricalPriceAdapter(data);
  }

  async getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    const price = NeoPoint.from(this._data[ItemName.name] || 0);
    return Ok.from({
      itemName,
      price
    })
  }
}
