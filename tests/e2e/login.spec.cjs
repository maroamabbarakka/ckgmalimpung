const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5174';
const USERNAME = process.env.E2E_USERNAME || 'admin';
const PIN = process.env.E2E_PIN || '123456';

test.setTimeout(90000);

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', USERNAME);
  await page.fill('input[name="pin"]', PIN);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60000 });
}

test('admin can log in and reach beranda', async ({ page }) => {
  await login(page);

  await expect(page.locator('body')).toContainText('TERSANJUNG', { timeout: 60000 });
  await expect(page.locator('body')).toContainText('Keluar', { timeout: 60000 });
  await expect(page.locator('body')).toContainText('Admin', { timeout: 60000 });
});

test('admin session can open admin and dashboard routes', async ({ page }) => {
  await login(page);

  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Admin CKG Malimpung', { timeout: 60000 });
  await expect(page.locator('body')).not.toContainText('MEMULIHKAN SESI', { timeout: 60000 });

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toContainText('MEMULIHKAN SESI', { timeout: 60000 });
  await expect(page.locator('body')).toContainText('Data Kolektif', { timeout: 60000 });
});

test('unknown route shows not found page', async ({ page }) => {
  await login(page);

  await page.goto(`${BASE_URL}/route-tidak-ada`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('Halaman tidak ditemukan', { timeout: 60000 });
  await expect(page.locator('body')).toContainText('Kembali ke Beranda', { timeout: 60000 });
});
