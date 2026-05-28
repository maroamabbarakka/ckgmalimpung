const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174';

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(metrics.documentScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.bodyScrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

for (const viewport of [
  { name: 'hd-tv', width: 1366, height: 768 },
  { name: 'full-hd-tv', width: 1920, height: 1080 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
]) {
  test(`public TV display smoke: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${BASE_URL}/tv`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('body')).toContainText('Layar TV TERSANJUNG', { timeout: 30000 });
    await expect(page.locator('body')).not.toContainText('NIK');
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: /aktifkan layar tv/i }).click();
    await expect(page.locator('body')).toContainText('LAYANAN CKG TERPADU', { timeout: 30000 });
    await expect(page.locator('body')).toContainText('Edukasi Kesehatan', { timeout: 30000 });
    await expect(page.locator('body')).toContainText('Antrean Berikutnya', { timeout: 30000 });
    await expect(page.locator('body')).toContainText('Sinkron terakhir', { timeout: 30000 });
    await expect(page.locator('body')).toContainText(/Online|Offline/, { timeout: 30000 });
    await expectNoHorizontalOverflow(page);
  });
}
