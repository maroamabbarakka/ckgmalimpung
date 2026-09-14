import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:5177';
const username = process.env.E2E_USERNAME || 'admin';
const pin = process.env.E2E_PIN || '123456';
const outputDir = path.resolve(process.argv[2] || '../Backups_Tersanjung/dtd-ui-baseline');

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'laptop-1366x768', width: 1366, height: 768 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-360x800', width: 360, height: 800 }
];

const authenticatedPages = [
  ['home', '/'],
  ['simpeg', '/simpeg'],
  ['kunjungan-rumah-awal', '/kunjungan-rumah'],
  ['pos1', '/pos1'],
  ['pos2', '/pos2'],
  ['pos7', '/pos7'],
  ['rapor', '/rapor']
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Masuk Ke Sistem/i }).waitFor();
    await page.screenshot({ path: path.join(outputDir, `${viewport.name}-login.png`), fullPage: true });
    await page.getByLabel('ID Pengguna').fill(username);
    await page.getByLabel('PIN Keamanan').fill(pin);
    await page.getByRole('button', { name: /Masuk Ke Sistem/i }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });

    for (const [name, route] of authenticatedPages) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      report.push({ viewport: viewport.name, page: name, route, ...dimensions, horizontalOverflow: dimensions.scrollWidth > dimensions.clientWidth });
      await page.screenshot({ path: path.join(outputDir, `${viewport.name}-${name}.png`), fullPage: true });

      if (name === 'simpeg') {
        const addStaffButton = page.getByRole('button', { name: /Tambah Staff/i });
        if (await addStaffButton.isVisible().catch(() => false)) {
          await addStaffButton.click();
          await page.waitForTimeout(300);
          const modalScroller = page.locator('.fixed.inset-0 .overflow-y-auto').last();
          if (await modalScroller.isVisible().catch(() => false)) {
            await modalScroller.evaluate((element) => { element.scrollTop = element.scrollHeight; });
          }
          await page.screenshot({ path: path.join(outputDir, `${viewport.name}-simpeg-modal.png`), fullPage: true });
          await page.keyboard.press('Escape');
        }
      }
    }

    await page.goto(`${baseUrl}/tv`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outputDir, `${viewport.name}-tv.png`), fullPage: true });
    await context.close();
  }
} finally {
  await browser.close();
}

await fs.writeFile(path.join(outputDir, 'layout-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`SCREENSHOT_DIR=${outputDir}`);
console.log(`HORIZONTAL_OVERFLOW_COUNT=${report.filter((item) => item.horizontalOverflow).length}`);
