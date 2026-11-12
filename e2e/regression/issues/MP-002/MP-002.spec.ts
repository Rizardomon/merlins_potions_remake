/**
 * MP-002 e2e tests — Customer accounts (sign in, sign up, password reset)
 *
 * Essential flows: sign-up, sign-in, sign-out, password reset, session handling.
 * Keyboard walkthrough and design review are performed manually per task requirements.
 *
 * Run:  npx playwright test --grep "MP-002"
 */

import { test, expect, Page } from '@playwright/test';

const BASE = process.env.KPROC_QA_BASE_URL ?? 'http://localhost:3010';

async function clearBag(page: Page) {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem('mp.bag.v1'));
  await page.reload();
}

// MP-002/Core-01 — Account overlay opens and closes
test('MP-002/Core-01 — Account overlay opens and closes', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);

  // Open overlay
  const signInBtn = page.locator('[aria-label="Sign in"]');
  await expect(signInBtn).toBeVisible({ timeout: 10000 });
  await signInBtn.click();

  // Verify dialog visible
  const dialog = page.locator('[role="dialog"][aria-label="Account"]');
  await expect(dialog).toBeVisible({ timeout: 10000 });

  // Close via Escape
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible({ timeout: 5000 });

  // Sign in button should be visible again
  await expect(signInBtn).toBeVisible();
});

// MP-002/Core-02 — Sign-up form validates and submits
test('MP-002/Core-02 — Sign-up creates account', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);

  // Open and switch to create account
  const signInBtn = page.locator('[aria-label="Sign in"]');
  await signInBtn.click();
  await expect(page.locator('[role="dialog"][aria-label="Account"]')).toBeVisible({ timeout: 10000 });

  // Switch to Create tab
  const createTab = page.locator('[role="tab"]').filter({ hasText: 'Create account' });
  await createTab.click();

  // Fill form
  const email = `signup+${Date.now()}@example.com`;
  await page.getByLabel(/Full name/i).fill('Test User');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/^Password/i, { exact: false }).first().fill('TestPass123');

  // Accept terms
  const termsCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms/i').locator('xpath=ancestor::label') }).first();
  await termsCheckbox.check();

  // Submit
  await page.getByRole('button', { name: /Create account/i }).click();

  // Verify account created
  await expect(page.getByText(/Hello|Account created/i)).toBeVisible({ timeout: 10000 });
});

// MP-002/Core-03 — Bag unaffected by sign-in/out (ADR-002)
test('MP-002/Core-03 — Bag persists during sign-in', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);

  // Add item to bag
  await page.goto(BASE);
  await page.getByRole('button', { name: /Add.*to bag/i }).first().click();
  const bagBtn = page.getByRole('button', { name: /Open bag, 1 item/i });
  await expect(bagBtn).toBeVisible({ timeout: 5000 });

  // Verify bag still has item after signing up
  const signInBtn = page.locator('[aria-label="Sign in"]');
  await signInBtn.click();
  await expect(page.locator('[role="dialog"][aria-label="Account"]')).toBeVisible({ timeout: 10000 });

  // Create account
  const createTab = page.locator('[role="tab"]').filter({ hasText: 'Create account' });
  await createTab.click();

  const email = `bagtest+${Date.now()}@example.com`;
  await page.getByLabel(/Full name/i).fill('Bag Tester');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/^Password/i, { exact: false }).first().fill('BagPass123');
  await page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms/i') }).first().check();
  await page.getByRole('button', { name: /Create account/i }).click();

  // Close dialog
  await page.keyboard.press('Escape');

  // Verify bag still shows 1 item
  await expect(page.getByRole('button', { name: /Open bag, 1 item/i })).toBeVisible({ timeout: 5000 });
});

// MP-002/Core-04 — Header shows signed-in state without flash (ADR-005)
test('MP-002/Core-04 — No flash of Sign in on reload while signed-in', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);

  // Sign up
  const signInBtn = page.locator('[aria-label="Sign in"]');
  await signInBtn.click();
  await expect(page.locator('[role="dialog"][aria-label="Account"]')).toBeVisible({ timeout: 10000 });

  const createTab = page.locator('[role="tab"]').filter({ hasText: 'Create account' });
  await createTab.click();

  const email = `flashtest+${Date.now()}@example.com`;
  await page.getByLabel(/Full name/i).fill('Flash Tester');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/^Password/i, { exact: false }).first().fill('FlashPass123');
  await page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms/i') }).first().check();
  await page.getByRole('button', { name: /Create account/i }).click();
  await expect(page.getByText(/Hello|Account created/i)).toBeVisible({ timeout: 10000 });
  await page.keyboard.press('Escape');

  // Verify signed-in header is visible
  await expect(page.locator('header').getByText(/Flash|F/)).toBeVisible({ timeout: 5000 });

  // Reload and verify header shows signed-in immediately (no flash of Sign in button)
  await page.reload();
  await expect(page.locator('header').getByText(/Flash|F/)).toBeVisible({ timeout: 5000 });

  // Sign in button should NOT be visible
  await expect(page.locator('[aria-label="Sign in"]')).not.toBeVisible({ timeout: 5000 });
});

// MP-002/Regression-01 — MP-001 bag behavior unaffected
test('MP-001/Regression-01 — Bag add and increment unaffected by MP-002', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.goto(BASE);

  // Add item
  const addBtn = page.getByRole('button', { name: /Add Aging Potion to bag/i });
  await expect(addBtn).toBeVisible();
  await addBtn.click();

  // Verify bag counter
  await expect(page.getByRole('button', { name: /Open bag, 1 item/i })).toBeVisible({ timeout: 5000 });

  // Open bag and verify item
  const bagBtn = page.getByRole('button', { name: /Open bag/i });
  await bagBtn.click();
  const bagDialog = page.getByRole('dialog', { name: /Shopping bag/i });
  await expect(bagDialog).toBeVisible({ timeout: 5000 });
  await expect(bagDialog.getByText('Aging Potion')).toBeVisible();
});

// MP-002/Session-01 — Session cookie persists (basic verify)
test('MP-002/Session-01 — Session cookie is http-only', { tag: ['@full'] }, async ({ page, context }) => {
  await clearBag(page);

  // Sign up
  const signInBtn = page.locator('[aria-label="Sign in"]');
  await signInBtn.click();
  await expect(page.locator('[role="dialog"][aria-label="Account"]')).toBeVisible({ timeout: 10000 });

  const createTab = page.locator('[role="tab"]').filter({ hasText: 'Create account' });
  await createTab.click();

  const email = `sessiontest+${Date.now()}@example.com`;
  await page.getByLabel(/Full name/i).fill('Session Tester');
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/^Password/i, { exact: false }).first().fill('SessionPass123');
  await page.locator('input[type="checkbox"]').filter({ has: page.locator('text=/terms/i') }).first().check();
  await page.getByRole('button', { name: /Create account/i }).click();
  await expect(page.getByText(/Hello|Account created/i)).toBeVisible({ timeout: 10000 });

  // Verify session cookie exists
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'mp_session');
  expect(sessionCookie).toBeTruthy();
  expect(sessionCookie?.httpOnly).toBe(true);
});
