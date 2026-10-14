import { defineConfig, devices } from '@playwright/test';

// Read FE_PORT from environment or default to 4000
const FE_PORT = process.env.FE_PORT || '4000';
const baseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${FE_PORT}`;

export default defineConfig({
  testDir: '/home/ubuntu/credit-workers/task-live-e2e/e2e-live',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
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
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '/home/ubuntu/credit-workers/task-live-e2e/e2e-live/.auth/state.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: undefined,
});
