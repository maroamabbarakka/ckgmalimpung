const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const USERNAME = process.env.E2E_USERNAME || 'admin';
const PIN = process.env.E2E_PIN || '123456';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
];

test.setTimeout(120000);

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', USERNAME);
  await page.fill('input[name="pin"]', PIN);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}

for (const viewport of viewports) {
  test(`dental completeness card is usable on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    const dentalCardTitle = page.getByText('Gigi & Mulut', { exact: true });
    await expect(dentalCardTitle).toBeVisible({ timeout: 60000 });
    await dentalCardTitle.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-dental-card.png`), fullPage: true });
    await dentalCardTitle.click();
    await expect(page.getByText('Kelengkapan Pemeriksaan Gigi & Mulut', { exact: true })).toBeVisible();
    await expect(page.getByText('Belum diperiksa dan data legacy yang perlu diverifikasi', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-dental-popup.png`), fullPage: true });

    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}
