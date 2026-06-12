/**
 * StorageContract
 * Defines the interface for storage adapters.
 * Any storage implementation (localStorage, IndexedDB, etc.) must implement this contract.
 */

export interface StorageContract {
  /**
   * Get a value from storage
   * @param key The storage key
   * @returns The stored value or null if not found
   */
  get(key: string): Promise<unknown>

  /**
   * Set a value in storage
   * @param key The storage key
   * @param value The value to store
   */
  set(key: string, value: unknown): Promise<void>

  /**
   * Remove a value from storage
   * @param key The storage key
   */
  remove(key: string): Promise<void>

  /**
   * Check if a key exists in storage
   * @param key The storage key
   */
  has(key: string): Promise<boolean>

  /**
   * Clear all storage
   */
  clear(): Promise<void>
}
