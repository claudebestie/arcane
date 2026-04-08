import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:5173';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MOCK = {
  technologies: [
    { name:'Next.js 14', category:'Framework', confidence:'high', evidence:'Detected via __next scripts and x-nextjs header', monthly_cost:'Free', icon:'⚛️' },
    { name:'React 18', category:'Framework', confidence:'high', evidence:'React DOM bundle detected in page source', monthly_cost:'Free', icon:'⚛️' },
    { name:'Vercel', category:'Hosting', confidence:'high', evidence:'x-vercel-id header present', monthly_cost:'$20/mo', icon:'▲' },
    { name:'Contentful', category:'CMS', confidence:'medium', evidence:'Contentful CDN URLs found in image sources', monthly_cost:'$300/mo', icon:'📝' },
    { name:'Google Analytics 4', category:'Analytics', confidence:'high', evidence:'gtag.js with GA4 measurement ID', monthly_cost:'Free', icon:'📊' },
    { name:'Stripe.js', category:'Payment', confidence:'high', evidence:'js.stripe.com script loaded', monthly_cost:'Usage-based', icon:'💳' },
    { name:'Cloudflare CDN', category:'CDN', confidence:'high', evidence:'cf-ray header detected', monthly_cost:'$20/mo', icon:'☁️' },
    { name:'Segment', category:'Analytics', confidence:'medium', evidence:'cdn.segment.com script tag found', monthly_cost:'$120/mo', icon:'📈' },
    { name:'Tailwind CSS', category:'CSS', confidence:'high', evidence:'Utility class patterns detected', monthly_cost:'Free', icon:'🎨' },
    { name:'Intercom', category:'Chat', confidence:'high', evidence:'Intercom widget script loaded', monthly_cost:'$74/mo', icon:'💬' },
    { name:'Sentry', category:'Monitoring', confidence:'medium', evidence:'sentry.io script detected', monthly_cost:'$26/mo', icon:'🐛' },
    { name:'LaunchDarkly', category:'Other', confidence:'low', evidence:'Feature flag SDK patterns found', monthly_cost:'$10/mo', icon:'🚩' },
  ],
  total_estimated_cost: '$570 - $800/mo',
  summary: 'A modern Next.js stack hosted on Vercel with Contentful as headless CMS. Strong analytics setup with GA4 and Segment. Intercom for support, Sentry for monitoring. Well-architected but the CMS cost dominates the budget.'
};

(async () => {
  console.log('🎬 Capturing Day 3: Stack Detector');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1080, height: 1080 } },
    deviceScaleFactor: 2, colorScheme: 'dark'
  });
  const page = await context.newPage();

  await page.route('**/api/detect', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK) });
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1. Hero (2.5s)
  await page.waitForTimeout(2500);

  // 2. Type URL (2.5s)
  await page.locator('#urlInput').click();
  await page.waitForTimeout(200);
  await page.keyboard.type('https://stripe.com', { delay: 40 });
  await page.waitForTimeout(600);

  // 3. Click SCAN (4s for loading + results)
  await page.locator('#detectBtn').click();
  await page.waitForTimeout(4500);

  // 4. Results showing — pause (2.5s)
  await page.waitForTimeout(2500);

  // 5. Scroll to tech list (3s)
  await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
  await page.waitForTimeout(3000);

  // 6. Scroll to more techs (3s)
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(3000);

  await context.close();
  await browser.close();

  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    renameSync(path.join(OUTPUT_DIR, latest), path.join(OUTPUT_DIR, 'stackdetector.webm'));
    console.log('✅ stackdetector.webm saved');
  }
})();
