import { defineConfig } from 'tsdown'
import { resolve } from 'node:path'

export default defineConfig({
  entry: ['src/entries/*.ts'],
  outDir: 'dist',
  format: 'iife',
  clean: true,
  resolve: {
    alias: {
      '@core': resolve('./src/core'),
      '@domain': resolve('./src/domain'),
      '@application': resolve('./src/application'),
      '@infrastructure': resolve('./src/infrastructure'),
    },
  },
})
