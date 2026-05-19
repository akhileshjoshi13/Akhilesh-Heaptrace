import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    // Runs against live GitHub Pages; swap to 'http://localhost:PORT' for local dev
    baseURL: 'https://akhileshjoshi13.github.io/Akhilesh-Heaptrace',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile',   use: { ...devices['Pixel 5'] } },
  ],
})
