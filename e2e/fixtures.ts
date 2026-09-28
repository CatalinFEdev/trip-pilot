import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const rawDir = resolve('coverage/e2e/raw');

export const test = base.extend<{ recordCoverage: void }>({
  recordCoverage: [
    async ({ page }, use, testInfo) => {
      if (!testInfo.project.metadata['coverage']) {
        await use();
        return;
      }

      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      try {
        await use();
      } finally {
        const entries = await page.coverage.stopJSCoverage();
        if (testInfo.status === 'passed') {
          await mkdir(rawDir, { recursive: true });
          await writeFile(
            resolve(rawDir, `${randomUUID()}.json`),
            JSON.stringify(entries.filter((entry) => entry.url.startsWith('http://127.0.0.1:4200/'))),
          );
        }
      }
    },
    { auto: true },
  ],
});

export { expect };
