import { Ok, type Result } from '@core/result';
import type { IPriceChecker } from '@application/shared/IPriceChecker';
import type { IStorage } from '@application/shared/IStorage';
import { ItemName } from '@domain/shared/ItemName';
import type { ItemPrice } from '@domain/shared/ItemPrice';
import { NeoPoint } from '@domain/shared';
import { HISTORICAL_PRICE_API_BASE, HISTORICAL_PRICE_CACHE_KEY } from '@core/constants';

export type SnapshotItem = {
  ImgURL: string;
  Price: string | null;
  LastPrice: string | null;
}

export type Snapshot = Record<string, SnapshotItem>;
export type ItemData = Record<string, number>;

export class HistoricalPriceAdapter implements IPriceChecker {

  constructor (private readonly _data: ItemData){}

  static async fetchSnapshot(url: string = HISTORICAL_PRICE_API_BASE): Promise<Snapshot> {
    const result = await fetch(url);
    return result.json();
  }

  static async fromUrl(url: string = HISTORICAL_PRICE_API_BASE) {
    return HistoricalPriceAdapter.fromSnapshot(await HistoricalPriceAdapter.fetchSnapshot(url));
  }

  static fromSnapshot(snapshot: Snapshot): HistoricalPriceAdapter {
    const data: ItemData = Object.fromEntries(
      Object.entries(snapshot).map(([key, value]) => [
        key,
        Number.parseInt(value.Price || value.LastPrice || "0"),
      ]),
    );
    return new HistoricalPriceAdapter(data);
  }

  static async loadCached(storage: IStorage): Promise<HistoricalPriceAdapter> {
    const cached = await storage.get(HISTORICAL_PRICE_CACHE_KEY);
    if (cached) return HistoricalPriceAdapter.fromData(cached as ItemData);
    const snapshot = await HistoricalPriceAdapter.fetchSnapshot();
    const adapter = HistoricalPriceAdapter.fromSnapshot(snapshot);
    await storage.set(HISTORICAL_PRICE_CACHE_KEY, adapter.getData());
    return adapter;
  }

  static fromData(data: ItemData): HistoricalPriceAdapter {
    return new HistoricalPriceAdapter(data);
  }

  getData(): ItemData {
    return this._data;
  }

  async getPrice(itemName: ItemName): Promise<Result<ItemPrice>> {
    console.log(`There are ${Object.entries(this._data).length} items in the database`);
    const price = NeoPoint.from(this._data[itemName.value] || 0);
    return Ok.from({
      itemName,
      price
    })
  }
}
