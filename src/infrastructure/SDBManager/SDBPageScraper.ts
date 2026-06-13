import type { SDBPageScraperContract } from '@application/SDBManager/SDBManager';
import type { InventoryEntry } from '@domain/shared/InventoryEntry';

export class SDBPageScraper implements SDBPageScraperContract {
  scrapeEntries(_doc: Document): InventoryEntry[] {
    throw new Error('Not implemented');
  }
}
