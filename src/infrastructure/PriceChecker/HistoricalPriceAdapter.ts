import { Ok, type Result } from '@core/result';
import type { PriceCheckerContract } from '@application/shared/PriceCheckerContract';
import { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';
import { NeoPoint } from '@domain/shared';
import { HISTORICAL_PRICE_API_BASE } from '@core/constants';

type SnapshotItem = {
  ImgURL: string;
  Price: string | null;
  LastPrice: string | null;
}

type Snapshot = Record<string, SnapshotItem>;
type ItemData = Record<string, number>;

export class HistoricalPriceAdapter implements PriceCheckerContract {

  constructor (private _data: ItemData){}

  static async fromUrl(url: string = HISTORICAL_PRICE_API_BASE) {
    const result = await fetch(url);
    const snapshot = await result.json();
    return HistoricalPriceAdapter.fromSnapshot(snapshot);
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
