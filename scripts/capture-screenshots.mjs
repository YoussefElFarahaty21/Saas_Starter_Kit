/**
 * Captures portfolio screenshots for Upwork / README.
 * Prerequisites: frontend on :5173, backend on :5000
 *
 * Optional auth (for dashboard shots): set in backend/.env
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Usage: node scripts/capture-screenshots.mjs
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const backendEnv = loadEnvFile(path.join(root, 'backend', '.env'));
const email = process.env.SCREENSHOT_EMAIL || backendEnv.ADMIN_EMAIL;
const password = process.env.SCREENSHOT_PASSWORD || backendEnv.ADMIN_PASSWORD;

async function waitForLoaded(page, urlPath) {
  await page.waitForSelector('.navbar, .dashboard-layout, .landing-layout, .auth-layout', {
    timeout: 15000,
  });

  // Wait out skeleton loaders
  await page
    .locator('.skeleton-card, .skeleton-row, .skeleton-line')
    .first()
    .waitFor({ state: 'detached', timeout: 20000 })
    .catch(() => {});

  // Route-specific ready signals (content after loading finishes)
  const readyByRoute = {
    '/billing': () =>
      page.getByRole('heading', { name: /billing/i }).waitFor({ timeout: 15000 }).then(() =>
        page
          .getByText(/current plan|choose a plan|upgrade plan|no active subscription/i)
          .first()
          .waitFor({ timeout: 15000 }),
      ),
    '/team': () =>
      page.getByRole('heading', { name: /^team$/i }).waitFor({ timeout: 15000 }).then(() =>
        page
          .getByText(/members|create your team|team invites are a pro feature/i)
          .first()
          .waitFor({ timeout: 15000 }),
      ),
    '/keys': () =>
      page.getByRole('heading', { name: /api keys/i }).waitFor({ timeout: 15000 }).then(() =>
        page
          .getByText(/generate new key|no api keys|loading keys/i)
          .first()
          .waitFor({ timeout: 15000 })
          .then(() =>
            page
              .getByText(/loading keys/i)
              .waitFor({ state: 'hidden', timeout: 15000 })
              .catch(() => {}),
          ),
      ),
    '/integrations': () =>
      page.getByRole('heading', { name: /integrations/i }).waitFor({ timeout: 15000 }).then(() =>
        page.getByText(/slack|outgoing webhooks/i).first().waitFor({ timeout: 15000 }),
      ),
    '/dashboard': () =>
      page.getByText(/welcome back/i).waitFor({ timeout: 15000 }).then(() =>
        page
          .getByText(/api calls used today|loading usage/i)
          .first()
          .waitFor({ timeout: 15000 })
          .then(() =>
            page
              .getByText(/loading usage/i)
              .waitFor({ state: 'hidden', timeout: 15000 })
              .catch(() => {}),
          ),
      ),
    '/profile': () =>
      page.getByText(/profile|account|password/i).first().waitFor({ timeout: 15000 }),
  };

  const waitReady = readyByRoute[urlPath];
  if (waitReady) await waitReady();

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
}

async function shot(page, name, urlPath) {
  const file = path.join(outDir, name);
  await page.goto(`${baseUrl}${urlPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForLoaded(page, urlPath);
  // Avoid capturing API JSON error pages
  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('"error"') && bodyText.includes('Route not found')) {
    throw new Error(`Got API error page for ${urlPath}`);
  }
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Saved ${name}`);
}

async function login(page) {
  if (!email || !password) {
    console.warn('No ADMIN_EMAIL/ADMIN_PASSWORD — skipping authenticated screenshots.');
    return false;
  }
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20000 });
  if (page.url().includes('/onboarding')) {
    // Skip onboarding if shown
    const skip = page.getByRole('button', { name: /skip/i });
    if (await skip.count()) {
      await skip.click();
      await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {});
    }
  }
  return true;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    await shot(page, '01-landing.png', '/');
    await shot(page, '02-login.png', '/login');

    // Dark mode landing
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const toggle = page.locator('button[aria-label*="dark" i], button[aria-label*="light" i], .theme-toggle');
    if (await toggle.count()) {
      await toggle.first().click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, '01b-landing-dark.png'), fullPage: false });
      console.log('Saved 01b-landing-dark.png');
    }

    const ok = await login(page);
    if (ok) {
      await shot(page, '03-dashboard.png', '/dashboard');

      for (const [file, route] of [
        ['04-billing.png', '/billing'],
        ['05-team.png', '/team'],
        ['06-integrations.png', '/integrations'],
        ['07-api-keys.png', '/keys'],
        ['08-profile.png', '/profile'],
      ]) {
        await shot(page, file, route);
      }

      // Prefer dark dashboard for portfolio variety
      const dashToggle = page.locator('.theme-toggle');
      if (await dashToggle.count()) {
        await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
        await waitForLoaded(page, '/dashboard');
        await dashToggle.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(outDir, '03b-dashboard-dark.png'),
          fullPage: false,
        });
        console.log('Saved 03b-dashboard-dark.png');
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots written to ${outDir}`);
  console.log('Use these images in your Upwork project gallery and README.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
