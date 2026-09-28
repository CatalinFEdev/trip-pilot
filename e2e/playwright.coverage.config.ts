import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig(base, {
  metadata: { coverage: true },
  reporter: [['list'], ['./coverage-reporter.mjs']],
});
