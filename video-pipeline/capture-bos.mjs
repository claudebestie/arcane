/**
 * Capture all back-office videos for Arcane Studio projects.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(import.meta.dirname, 'output', 'bos');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

async function captureBO(name, url, scenario) {
  console.log(`🎬 Capturing: ${name}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1280, height: 800 } },
    deviceScaleFactor: 2, colorScheme: 'dark'
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await scenario(page);
  await context.close();
  await browser.close();

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    renameSync(path.join(OUTPUT_DIR, latest), path.join(OUTPUT_DIR, `${name}.webm`));
    console.log(`  ✅ Saved ${name}.webm`);
  }
}

const BASE = path.resolve(import.meta.dirname, '..', 'fake-bos');

// 1. Pulse Analytics (fake BO)
await captureBO('pulse-analytics', `file://${BASE}/pulse-analytics/index.html`, async (page) => {
  await page.waitForTimeout(2000);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(2000);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(2000);
  // Hover over chart bars
  for (let x = 400; x < 900; x += 30) {
    await page.mouse.move(x, 400);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(1500);
});

// 2. NomadPay (fake BO)
await captureBO('nomadpay', `file://${BASE}/nomadpay/index.html`, async (page) => {
  await page.waitForTimeout(2000);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(2000);
  await page.mouse.wheel(0, 250);
  await page.waitForTimeout(2000);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(1500);
});

console.log('\n🏁 All BO captures done!');
