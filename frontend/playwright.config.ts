import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', testMatch: '*.spec.ts', timeout: 60000, workers: 1,
  use: { baseURL: process.env['BASE_URL'] || 'http://127.0.0.1:8765', channel: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: ['fr','ar'].flatMap(lang => [1366,1920].map(width => ({ name: `${lang}-${width}`, metadata: { lang }, use: { viewport: { width, height: width === 1366 ? 768 : 1080 } } }))),
});
