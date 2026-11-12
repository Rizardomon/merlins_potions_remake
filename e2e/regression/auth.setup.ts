import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = '.auth/state.json';

setup('authenticate', async ({ page }) => {
  const username = process.env.KPROC_QA_USERNAME;
  const password = process.env.KPROC_QA_PASSWORD;

  if (!username || !password) {
    if (fs.existsSync(path.resolve(authFile))) {
      console.log('No credentials set; reusing saved session from', authFile);
      return;
    }
    // Application has no authentication — create empty state file so dependent projects work.
    fs.mkdirSync(path.dirname(path.resolve(authFile)), { recursive: true });
    fs.writeFileSync(path.resolve(authFile), JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto(process.env.KPROC_QA_BASE_URL!);
  await page.context().storageState({ path: authFile });
});
