/**
 * Capture Day 2: Startup or Feature?
 * Intercepts API call to show perfect results.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:5173';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MOCK_RESPONSE = {
  verdict: "startup",
  title: "This is a startup — a $4B market.",
  summary: "Sales intelligence is a massive, proven market. Companies like ZoomInfo charge $15K+/year. Clear willingness to pay and daily usage by sales teams.",
  score: 68,
  criteria: [
    { name: "Standalone value", score: 9, note: "Solves lead generation end-to-end" },
    { name: "Willingness to pay", score: 9, note: "Sales teams already pay $1K+/mo for this" },
    { name: "Market size", score: 8, note: "Every B2B company needs qualified leads" },
    { name: "Defensibility", score: 7, note: "Data moat grows with usage and enrichment" },
    { name: "Differentiation", score: 5, note: "Crowded market — needs a sharp vertical angle" },
    { name: "Technical depth", score: 8, note: "Web scraping + NLP + data enrichment pipeline" },
    { name: "Retention", score: 9, note: "Sales teams use prospecting tools daily" },
    { name: "Revenue clarity", score: 9, note: "SaaS subscription with per-seat pricing" }
  ],
  similar: ["ZoomInfo", "Apollo.io", "Lusha", "Clearbit", "Hunter.io"],
  advice: "The market is proven — ZoomInfo alone does $1.2B ARR. Your play: go niche. Pick one vertical (e.g. agencies, startups) and build the best data tool for that specific audience."
};

(async () => {
  console.log('🎬 Capturing Day 2: Startup or Feature?');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1080, height: 1080 } },
    deviceScaleFactor: 2, colorScheme: 'light'
  });

  const page = await context.newPage();

  // Intercept the API call and return mock data
  await page.route('**/api/analyze', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RESPONSE)
    });
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1. Hero (2.5s)
  await page.waitForTimeout(2500);

  // 2. Type idea (3s)
  const input = page.locator('#ideaInput');
  await input.click();
  await page.waitForTimeout(300);
  await page.keyboard.type('An AI tool that scrapes company data and finds decision-makers for sales teams', { delay: 30 });
  await page.waitForTimeout(800);

  // 3. Click Analyze — API is mocked, results appear fast (4s)
  await page.locator('#analyzeBtn').click();
  await page.waitForTimeout(4500);

  // 4. Results should be showing — wait for animations (2s)
  await page.waitForTimeout(2000);

  // 5. Scroll to scores + criteria (3s)
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(3000);

  // 6. Scroll to competitors + advice (3s)
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(3000);

  await context.close();
  await browser.close();

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    const finalPath = path.join(OUTPUT_DIR, 'startup-or-feature.webm');
    renameSync(path.join(OUTPUT_DIR, latest), finalPath);
    console.log(`✅ Video saved: ${finalPath}`);
  }
})();
