/**
 * LocalStorageAdapter
 * Implements the StorageContract using browser's localStorage.
 */

import { createLogger } from '@core/logger'
import type { StorageContract } from '@application/shared/StorageContract'

export class LocalStorageAdapter implements StorageContract {
  private readonly logger = createLogger({ context: 'LocalStorageAdapter' })

  async get(key: string): Promise<unknown> {
    try {
      const value = localStorage.getItem(key)
      if (value === null) {
        return null
      }
      return JSON.parse(value)
    } catch (error) {
      this.logger.error(`Failed to get key "${key}"`, error as Error)
      return null
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      this.logger.error(`Failed to set key "${key}"`, error as Error)
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      this.logger.error(`Failed to remove key "${key}"`, error as Error)
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null
    } catch (error) {
      this.logger.error(`Failed to check key "${key}"`, error as Error)
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      this.logger.error('Failed to clear storage', error as Error)
    }
  }
}
