import { defineConfig, devices } from '@playwright/test';

/**
 * Base URL comes from the environment variable KPROC_QA_BASE_URL.
 * Set it before running: KPROC_QA_BASE_URL=http://localhost:3010 npx playwright test
 *
 * JSON reporter output path is controlled by PLAYWRIGHT_JSON_OUTPUT_NAME.
 * kproc sets this automatically when running via `kproc qa suite run`.
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.KPROC_QA_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/state.json',
      },
      dependencies: ['setup'],
    },
  ],
});
