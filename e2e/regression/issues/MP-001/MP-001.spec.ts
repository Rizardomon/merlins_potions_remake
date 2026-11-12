/**
 * MP-001 regression tests — Estrutura inicial do storefront.
 *
 * Cada test corresponde a exatamente um cenário MP-001/R-NN do fragment.
 * Smoke: apenas leitura/navegação. Full: muta estado da sacola.
 *
 * Run smoke:  npx playwright test --grep @smoke
 * Run full:   npx playwright test --grep @full
 */

import { test, expect, Page } from '@playwright/test';

const BASE = process.env.KPROC_QA_BASE_URL ?? 'http://localhost:3010';

async function clearBag(page: Page) {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.removeItem('mp.bag.v1'));
  await page.reload();
}

// MP-001/R-01 — Barra de anúncio de frete grátis
test('MP-001/R-01 — Barra de anúncio de frete grátis', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const banner = page.getByRole('banner').filter({ hasText: 'Free shipping on orders over $50' }).first();
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Free shipping on orders over $50');
});

// MP-001/R-02 — Header com marca, busca, Sign in e botão Bag com contador
test('MP-001/R-02 — Header com marca, busca, Sign in e botão Bag', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await clearBag(page);
  await expect(page.getByRole('link', { name: "Merlin's Potions — home" })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  const bagBtn = page.getByRole('button', { name: /Open bag/i });
  await expect(bagBtn).toBeVisible();
  await bagBtn.click();
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible();
});

// MP-001/R-03 — Navegação de categorias com Potions ativa e demais com badge Soon
test('MP-001/R-03 — Navegação de categorias com badge Soon', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const nav = page.getByRole('navigation', { name: 'Product categories' });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Potions')).toBeVisible();
  for (const cat of ['Ingredients', 'Books', 'Supplies', 'Charms', 'Clearance']) {
    await expect(nav.getByText(cat)).toBeVisible();
    await expect(nav.getByText('Soon').first()).toBeVisible();
  }
  // Categorias inativas não navegam
  const url = page.url();
  await nav.getByText('Ingredients').click();
  await expect(page).toHaveURL(url);
});

// MP-001/R-04 — Catálogo: heading, contagem e estrutura dos cards
test('MP-001/R-04 — Catálogo com 6 cards completos', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const region = page.getByRole('region', { name: 'Potions catalogue' });
  await expect(region.getByRole('heading', { name: 'Potions', level: 1 })).toBeVisible();
  await expect(region.getByText('Catalogue · 06 items')).toBeVisible();
  const cards = page.getByRole('button', { name: /View details for/ });
  await expect(cards).toHaveCount(6);
  // Verifica estrutura do primeiro card
  const first = page.getByRole('button', { name: 'View details for Aging Potion' });
  await expect(first.getByText('No. 01')).toBeVisible();
  await expect(first.getByRole('img', { name: 'Aging Potion' })).toBeVisible();
  await expect(first.getByRole('heading', { name: 'Aging Potion' })).toBeVisible();
  await expect(first.getByText('US$ 12.99')).toBeVisible();
  await expect(first.getByText('4 ingredients')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Aging Potion to bag' })).toBeVisible();
});

// MP-001/R-05 — Quick-add não abre drawer e incrementa contador
test('MP-001/R-05 — Quick-add não abre drawer de detalhe', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  await expect(page.getByRole('dialog', { name: 'Product detail' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: /Open bag, 1 item/i })).toBeVisible();
});

// MP-001/R-06 — Busca por nome filtra e restaura
test('MP-001/R-06 — Busca por nome filtra catálogo', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const search = page.getByRole('searchbox', { name: 'Search potions' });
  await search.fill('love');
  await expect(page.getByRole('button', { name: /View details for/ })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View details for Love Potion' })).toBeVisible();
  await search.clear();
  await expect(page.getByRole('button', { name: /View details for/ })).toHaveCount(6);
});

// MP-001/R-07 — Busca sem correspondência exibe estado vazio
test('MP-001/R-07 — Busca sem match exibe estado vazio com Clear search', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const search = page.getByRole('searchbox', { name: 'Search potions' });
  await search.fill('zzzzz');
  await expect(page.getByRole('button', { name: /View details for/ })).toHaveCount(0);
  const clearBtn = page.getByRole('button', { name: /Clear search/i });
  await expect(clearBtn).toBeVisible();
  await clearBtn.click();
  await expect(page.getByRole('button', { name: /View details for/ })).toHaveCount(6);
});

// MP-001/R-08 — Ordenação por preço com chip ativo
test('MP-001/R-08 — Ordenação por preço com chip ativo', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const sortGroup = page.getByRole('group', { name: 'Sort options' });
  await expect(sortGroup.getByRole('button', { name: 'Featured', pressed: true })).toBeVisible();

  await sortGroup.getByRole('button', { name: 'Price: low to high' }).click();
  await expect(sortGroup.getByRole('button', { name: 'Price: low to high', pressed: true })).toBeVisible();
  const pricesAsc = await page.locator('[class*="price"], [class*="Price"]').allTextContents();
  // extrai valores numéricos e verifica ordem crescente
  const nums = (texts: string[]) =>
    texts
      .map((t) => parseFloat(t.replace(/[^0-9.]/g, '')))
      .filter((n) => !isNaN(n) && n > 0);
  const asc = nums(pricesAsc);
  expect(asc).toEqual([...asc].sort((a, b) => a - b));

  await sortGroup.getByRole('button', { name: 'Price: high to low' }).click();
  await expect(sortGroup.getByRole('button', { name: 'Price: high to low', pressed: true })).toBeVisible();
  const pricesDesc = await page.locator('[class*="price"], [class*="Price"]').allTextContents();
  const desc = nums(pricesDesc);
  expect(desc).toEqual([...desc].sort((a, b) => b - a));
});

// MP-001/R-09 — Drawer de detalhe com stepper e total dinâmico
test('MP-001/R-09 — Drawer de detalhe com stepper e add to bag', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.getByRole('button', { name: 'View details for Aging Potion' }).click();
  const dialog = page.getByRole('dialog', { name: 'Product detail' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Aging Potion' })).toBeVisible();
  await expect(dialog.getByText('Potion · No. 01')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Aging Potion' })).toBeVisible();
  await expect(dialog.getByText('US$ 12.99').first()).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Use / Effect' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Add to bag/ })).toBeVisible();

  await dialog.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(dialog.getByRole('button', { name: 'Add to bag · US$ 25.98' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Add to bag · US$ 25.98' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[role="status"]').filter({ hasText: /Potion added/i })).toBeVisible();
});

// MP-001/R-10 — Toast de adição com texto, duração e ação View bag
test('MP-001/R-10 — Toast de adição com View bag e auto-dismiss', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  const toast = page.locator('[role="status"]').filter({ hasText: /Potion added/i });
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Potion added');
  await expect(toast.getByRole('button', { name: 'View bag' })).toBeVisible();

  // auto-dismiss após ~2.5s
  await page.waitForTimeout(3500);
  await expect(toast).not.toBeVisible();

  // View bag abre drawer
  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  const toast2 = page.locator('[role="status"]').filter({ hasText: /Potion added/i });
  await expect(toast2).toBeVisible();
  await toast2.getByRole('button', { name: 'View bag' }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible();
});

// MP-001/R-11 — Drawer da sacola: conteúdo, progresso de frete e edição
test('MP-001/R-11 — Drawer da sacola com itens e progresso de frete', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  await page.getByRole('button', { name: /Open bag/i }).click();
  const dialog = page.getByRole('dialog', { name: 'Shopping bag' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Your bag' })).toBeVisible();
  await expect(dialog.getByRole('progressbar')).toBeVisible();
  await expect(dialog.getByText(/away from free shipping/)).toBeVisible();
  await expect(dialog.getByText('Aging Potion')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Increase quantity of Aging Potion' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Remove Aging Potion from bag' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Checkout' })).toBeVisible();

  await dialog.getByRole('button', { name: 'Increase quantity of Aging Potion' }).click();
  await expect(dialog.getByText('US$ 25.98').first()).toBeVisible();

  await dialog.getByRole('button', { name: 'Remove Aging Potion from bag' }).click();
  // remove linha; como só havia 1 item, sacola deve ficar vazia
  await expect(dialog.getByText('Aging Potion')).not.toBeVisible();
  await expect(dialog.getByText(/empty|cauldron/i)).toBeVisible();
});

// MP-001/R-12 — Persistência da sacola após reload
test('MP-001/R-12 — Sacola persiste após reload da página', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);
  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  await page.getByRole('button', { name: 'Add Bulgeye Potion to bag' }).click();
  await expect(page.getByRole('button', { name: /Open bag, 2 items/i })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /Open bag, 2 items/i })).toBeVisible();

  await page.getByRole('button', { name: /Open bag/i }).click();
  const dialog = page.getByRole('dialog', { name: 'Shopping bag' });
  await expect(dialog.getByText('Aging Potion')).toBeVisible();
  await expect(dialog.getByText('Bulgeye Potion')).toBeVisible();
  await expect(dialog.getByText('US$ 22.98')).toBeVisible();
});

// MP-001/R-13 — Newsletter: submit válido exibe confirmação
test('MP-001/R-13 — Newsletter submit válido exibe confirmação', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const region = page.getByRole('region', { name: 'Newsletter signup' });
  await region.scrollIntoViewIfNeeded();
  await expect(region.getByRole('textbox', { name: 'Email address' })).toBeVisible();
  await expect(region.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  await region.getByRole('textbox', { name: 'Email address' }).fill('owl@example.com');
  await region.getByRole('button', { name: 'Subscribe' }).click();
  await expect(region.getByText("You're on the list. Watch your inbox for owl post.")).toBeVisible();
});

// MP-001/R-14 — Footer com links de seção, redes sociais e copyright
test('MP-001/R-14 — Footer com links e copyright', { tag: ['@smoke', '@full'] }, async ({ page }) => {
  await page.goto(BASE);
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  const companyNav = footer.getByRole('navigation', { name: 'Company links' });
  for (const link of ['Company', 'Contact us', 'Shipping', 'Returns', 'Careers']) {
    await expect(companyNav.getByRole('link', { name: link })).toBeVisible();
  }
  const socialNav = footer.getByRole('navigation', { name: 'Social media links' });
  for (const link of ['Facebook', 'X', 'Pinterest', 'Tumblr']) {
    await expect(socialNav.getByRole('link', { name: link })).toBeVisible();
  }
  await expect(footer.getByText("© 2026 Merlin's Potions")).toBeVisible();
});

// MP-001/R-15 — Escape fecha drawers de detalhe e sacola
test('MP-001/R-15 — Escape fecha drawer de detalhe e drawer da sacola', { tag: ['@full'] }, async ({ page }) => {
  await clearBag(page);

  await page.getByRole('button', { name: 'View details for Aging Potion' }).click();
  await expect(page.getByRole('dialog', { name: 'Product detail' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Product detail' })).not.toBeVisible();

  await page.getByRole('button', { name: 'Add Aging Potion to bag' }).click();
  await page.getByRole('button', { name: /Open bag/i }).click();
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Shopping bag' })).not.toBeVisible();
});
