import { defineConfig, devices } from '@playwright/test';

// FE_PORT / E2E_BASE_URL point at a stack seeded with `SEED=smoke` (see docs/LOCAL_DEV.md)
const FE_PORT = process.env.FE_PORT || '3011';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${FE_PORT}`;

export default defineConfig({
  testDir: __dirname,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: undefined,
});
