import type { Result } from '@core/result';
import { Ok } from '@core/result';
import { SAFETY_DEPOSIT_BOX_URL } from '@core/constants';
import type { InventoryContract } from '@application/shared/InventoryContract';
import type { NavigatorContract } from '@application/shared/NavigatorContract';
import type { ItemName } from '@domain/shared/ItemName';
import type { InventoryEntry } from '@domain/shared/InventoryEntry';

export interface SDBPageScraperContract {
  scrapeEntries(doc: Document): InventoryEntry[];
}

export class SDBManager implements InventoryContract {
  private cache: InventoryEntry[] = [];
  private loaded = false;

  constructor(
    private readonly scraper: SDBPageScraperContract,
    private readonly navigator: NavigatorContract,
    private readonly sdbUrl: string = SAFETY_DEPOSIT_BOX_URL,
  ) {}

  async loadSDB(): Promise<Result<void>> {
    const entries: InventoryEntry[] = [];
    let page = 1;

    while (true) {
      const url = `${this.sdbUrl}?offset=${(page - 1) * 30}`;
      const docResult = await this.navigator.fetchDocument(url);
      if (docResult.isErr()) break;

      const pageEntries = this.scraper.scrapeEntries(docResult.unwrap());
      if (pageEntries.length === 0) break;

      entries.push(...pageEntries);
      page++;
    }

    this.cache = entries;
    this.loaded = true;
    return Ok.from(undefined);
  }

  async findItem(itemName: ItemName): Promise<Result<InventoryEntry | null>> {
    if (!this.loaded) await this.loadSDB();
    const entry = this.cache.find(e => e.itemName.equals(itemName)) ?? null;
    return Ok.from(entry);
  }

  async listAll(): Promise<Result<InventoryEntry[]>> {
    if (!this.loaded) await this.loadSDB();
    return Ok.from([...this.cache]);
  }
}
