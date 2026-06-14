import type { Result } from '@core/result';
import type { ItemName } from '@domain/shared/ItemName';
import type { InventoryEntry } from '@domain/shared/InventoryEntry';

export interface IInventory {
  findItem(itemName: ItemName): Promise<Result<InventoryEntry | null>>;
  listAll(): Promise<Result<InventoryEntry[]>>;
}
