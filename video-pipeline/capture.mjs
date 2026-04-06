/**
 * ARCANE STUDIO — Video Capture Pipeline
 * Captures a 20s demo video of a project using Playwright.
 *
 * Usage: node capture.mjs <project-url> <output-name>
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const PROJECT_URL = process.argv[2] || 'http://localhost:5173';
const OUTPUT_NAME = process.argv[3] || 'demo';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── GRADEMYWEBSITE SCENARIO ──
async function scenarioGradeMyWebsite(page) {
  // 1. Hero visible (2.5s)
  await page.waitForTimeout(2500);

  // 2. Type URL with nice typing animation (2s)
  const input = page.locator('#urlInput');
  await input.click();
  await page.waitForTimeout(300);
  await page.keyboard.type('https://arcane-studio.com', { delay: 45 });
  await page.waitForTimeout(600);

  // 3. Click Grade button — show loading briefly (2s)
  await page.locator('#gradeBtn').click();
  await page.waitForTimeout(2000);

  // 4. Skip the API wait — directly trigger demo results via JS
  await page.evaluate(() => {
    // Force demo mode immediately
    window.loadDemo('https://arcane-studio.com', false);
  });
  await page.waitForTimeout(2500);

  // 5. Scroll to show category cards (3s)
  await page.mouse.wheel(0, 280);
  await page.waitForTimeout(3000);

  // 6. Scroll to show detailed findings (3s)
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(3000);

  // 7. Hold on findings for a moment (1s)
  await page.waitForTimeout(1000);
}

// ── MAIN ──
(async () => {
  console.log(`🎬 Capturing ${OUTPUT_NAME} from ${PROJECT_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1080, height: 1080 }
    },
    deviceScaleFactor: 2,
    colorScheme: 'dark'
  });

  const page = await context.newPage();
  await page.goto(PROJECT_URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // Run scenario
  if (OUTPUT_NAME.includes('grademywebsite')) {
    await scenarioGradeMyWebsite(page);
  } else {
    // Default: scroll through the page
    await page.waitForTimeout(2000);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(1500);
    }
  }

  await context.close();
  await browser.close();

  // Rename video file
  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    const finalPath = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.webm`);
    renameSync(path.join(OUTPUT_DIR, latest), finalPath);
    console.log(`✅ Video saved: ${finalPath}`);
  } else {
    console.log('❌ No video file found');
  }
})();
