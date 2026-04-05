import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Shared Playwright config for the demo UI. Pass the absolute path to `apps/demo-ui`
 * so tests and webServer run correctly from the monorepo root or from that package.
 */
export function createDemoUiPlaywrightConfig(demoUiRoot: string) {
  const port = Number(process.env.PLAYWRIGHT_DEMO_PORT ?? 3001);
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

  return defineConfig({
    testDir: path.join(demoUiRoot, 'e2e'),
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
      baseURL,
      trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
      ? undefined
      : {
          command: process.env.CI
            ? `node scripts/run-next.cjs start -- -p ${port} -H 127.0.0.1`
            : `node scripts/run-next.cjs dev -- -p ${port} -H 127.0.0.1`,
          cwd: demoUiRoot,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...process.env,
            PORT: String(port),
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3000',
          },
        },
  });
}
