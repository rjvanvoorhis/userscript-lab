import { defineConfig } from 'tsdown'
import { resolve } from 'node:path'

const userscriptBanner = `// ==UserScript==
// @name        New script mozilla.org
// @namespace   Violentmonkey Scripts
// @icon        data:image/png;base64,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
// @version     1.0.0
//
// @match       https://*.neopets.com/*
// @grant       none
//
// @author      -
// @description
// ==/UserScript==

`;

export default defineConfig({
  entry: ['src/entries/main.ts'],
  outDir: 'dist',
  format: 'iife',
  banner: userscriptBanner,
  deps: {
    alwaysBundle: ['crypto-js'],
  },
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
