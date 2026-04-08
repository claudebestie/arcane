/**
 * Capture fake BOs with NO mouse movement — stable recording.
 * Uses page.evaluate to scroll programmatically instead of mouse.wheel.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(import.meta.dirname, 'output', 'bos');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

async function captureBO(name, url, scrollSteps) {
  console.log(`🎬 ${name}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1280, height: 800 } },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

  // Wait for animations to finish
  await page.waitForTimeout(2000);

  // Smooth scroll via JS — no mouse involved
  for (const step of scrollSteps) {
    await page.evaluate((y) => {
      window.scrollBy({ top: y, behavior: 'smooth' });
    }, step.y);
    await page.waitForTimeout(step.wait);
  }

  await context.close();
  await browser.close();

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    renameSync(path.join(OUTPUT_DIR, latest), path.join(OUTPUT_DIR, `${name}.webm`));
    console.log(`  ✅ ${name}.webm`);
  }
}

const BASE = path.resolve(import.meta.dirname, '..', 'fake-bos');

await captureBO('pulse-analytics', `file://${BASE}/pulse-analytics/index.html`, [
  { y: 0, wait: 3000 },
  { y: 300, wait: 3000 },
  { y: 400, wait: 3000 },
]);

await captureBO('nomadpay', `file://${BASE}/nomadpay/index.html`, [
  { y: 0, wait: 3000 },
  { y: 250, wait: 3000 },
  { y: 300, wait: 3000 },
]);

console.log('Done');
