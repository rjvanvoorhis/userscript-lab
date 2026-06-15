import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve('./src/core'),
      '@domain': resolve('./src/domain'),
      '@application': resolve('./src/application'),
      '@infrastructure': resolve('./src/infrastructure'),
      '@presentation': resolve('./src/presentation'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
      ],
    },
  },
})
