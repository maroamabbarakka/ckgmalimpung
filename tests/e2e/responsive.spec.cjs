const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174';
const USERNAME = process.env.E2E_USERNAME || 'admin';
const PIN = process.env.E2E_PIN || '123456';

const viewports = [
  { name: 'narrow-phone', width: 320, height: 740 },
  { name: 'small-phone', width: 360, height: 780 },
  { name: 'modern-phone', width: 390, height: 844 },
  { name: 'large-phone', width: 430, height: 932 },
  { name: 'small-tablet', width: 768, height: 1024 }
];

test.setTimeout(120000);

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', USERNAME);
  await page.fill('input[name="pin"]', PIN);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));

  expect(metrics.documentScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

for (const viewport of viewports) {
  test(`mobile responsive shell: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await login(page);
    await expect(page.locator('body')).toContainText('TERSANJUNG', { timeout: 60000 });
    await expectNoHorizontalOverflow(page);

    await page.goto(`${BASE_URL}/loket`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('AMBIL NOMOR ANTREAN', { timeout: 60000 });
    await expectNoHorizontalOverflow(page);

    await page.goto(`${BASE_URL}/pos2`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/pos 2/i, { timeout: 60000 });
    await expectNoHorizontalOverflow(page);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Dashboard Data TERSANJUNG', { timeout: 60000 });
    await expectNoHorizontalOverflow(page);
  });
}

for (const viewport of viewports) {
  test(`mobile responsive heavy routes: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await login(page);

    await page.goto(`${BASE_URL}/pos1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/pos 1/i, { timeout: 60000 });
    await expectNoHorizontalOverflow(page);

    await page.goto(`${BASE_URL}/pos7`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/pos 7/i, { timeout: 60000 });
    await expectNoHorizontalOverflow(page);

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Admin CKG Malimpung', { timeout: 60000 });
    await expectNoHorizontalOverflow(page);
  });
}
