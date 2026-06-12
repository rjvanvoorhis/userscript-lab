import { describe, it, expect } from 'vitest'
import { LocalStorageAdapter } from '@infrastructure/Shared'

describe('LocalStorageAdapter', () => {
  it('should implement StorageContract', () => {
    const adapter = new LocalStorageAdapter()
    expect(adapter).toBeDefined()
    expect(adapter.get).toBeDefined()
    expect(adapter.set).toBeDefined()
    expect(adapter.remove).toBeDefined()
    expect(adapter.has).toBeDefined()
    expect(adapter.clear).toBeDefined()
  })

  it('should handle storage operations', async () => {
    const adapter = new LocalStorageAdapter()
    const testKey = 'test-key'
    const testValue = { data: 'test' }

    // Set a value
    await adapter.set(testKey, testValue)

    // Get the value
    const retrieved = await adapter.get(testKey)
    expect(retrieved).toEqual(testValue)

    // Check existence
    const exists = await adapter.has(testKey)
    expect(exists).toBe(true)

    // Remove the value
    await adapter.remove(testKey)
    const afterRemoval = await adapter.get(testKey)
    expect(afterRemoval).toBeNull()
  })
})
