/**
 * ARCANE STUDIO — Video Capture Pipeline
 * Captures a 20s demo video of a project using Playwright.
 *
 * Usage: node capture.mjs <project-url> <output-name>
 * Example: node capture.mjs http://localhost:5173 grademywebsite
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const PROJECT_URL = process.argv[2] || 'http://localhost:5173';
const OUTPUT_NAME = process.argv[3] || 'demo';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── GRADEMYWEBSITE SCENARIO ──
async function scenarioGradeMyWebsite(page) {
  // 1. Show hero for 2s
  await page.waitForTimeout(2000);

  // 2. Type URL into input
  const input = page.locator('#urlInput');
  await input.click();
  await page.waitForTimeout(500);
  await input.fill('');
  await page.keyboard.type('https://arcane-studio.com', { delay: 50 });
  await page.waitForTimeout(800);

  // 3. Click Grade button
  await page.locator('#gradeBtn').click();
  await page.waitForTimeout(1500);

  // 4. Wait for loading animation
  await page.waitForTimeout(3000);

  // 5. If results appear, let them animate
  try {
    await page.waitForSelector('#results[style*="block"]', { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Scroll down to see category cards
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(2000);

    // Scroll to findings
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(2000);
  } catch {
    // API might fail, show loading state for a bit then use simulated results
    console.log('API timeout — using simulated data');

    // Inject simulated results via page.evaluate
    await page.evaluate(() => {
      document.getElementById('hero').style.display = 'none';
      document.getElementById('loading').style.display = 'none';
      document.getElementById('results').style.display = 'block';
      document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => el.classList.add('in'));
      document.querySelectorAll('.reveal-stagger > *').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });

      const scores = { performance: 72, seo: 85, accessibility: 68, bestPractices: 91 };
      const overall = Math.round((72+85+68+91)/4);

      // Ring
      const ring = document.getElementById('ringFill');
      const circ = 2 * Math.PI * 90;
      ring.style.strokeDasharray = circ;
      ring.style.strokeDashoffset = circ - (overall/100)*circ;
      ring.style.stroke = '#eab308';
      document.getElementById('totalScore').textContent = overall;
      document.getElementById('siteUrl').textContent = 'arcane-studio.com';
      const v = document.getElementById('verdict');
      v.className = 'verdict-badge verdict-ok';
      v.textContent = '⚠ Needs work';
      document.getElementById('verdictText').textContent = "There are issues affecting your site's performance and visibility.";

      const catData = [
        { key:'performance', label:'Performance', icon:'⚡', color:'#c8ff00' },
        { key:'seo', label:'SEO', icon:'🔍', color:'#6366f1' },
        { key:'accessibility', label:'Accessibility', icon:'♿', color:'#06b6d4' },
        { key:'bestPractices', label:'Best Practices', icon:'🛡', color:'#f59e0b' }
      ];
      document.getElementById('catCards').innerHTML = catData.map(c => {
        const s = scores[c.key];
        const bar = s >= 80 ? '#22c55e' : s >= 50 ? '#eab308' : '#ef4444';
        return `<div class="cat-card spotlight"><div class="cat-header"><div class="cat-icon" style="background:${c.color}15">${c.icon}</div><div class="cat-score-sm" style="color:${bar}">${s}</div></div><div class="arcane-label" style="margin-bottom:12px">${c.label}</div><div class="score-bar"><div class="score-bar-fill" style="width:${s}%;background:${bar}"></div></div></div>`;
      }).join('');

      const findings = [
        { icon:'fail', sym:'✗', title:'Largest Contentful Paint — 3.8 s', desc:'Main content takes too long to render.' },
        { icon:'warn', sym:'!', title:'Total Blocking Time — 380 ms', desc:'Main thread blocked during page load.' },
        { icon:'pass', sym:'✓', title:'Cumulative Layout Shift — 0.01', desc:'Visual elements remain stable.' },
        { icon:'pass', sym:'✓', title:'Uses HTTPS', desc:'All pages served over HTTPS.' },
        { icon:'pass', sym:'✓', title:'Document has a meta description', desc:'Meta descriptions help search results.' },
        { icon:'warn', sym:'!', title:'Render-blocking resources — 620 ms', desc:'CSS and JS delay first paint.' },
        { icon:'fail', sym:'✗', title:'Unused JavaScript — 280 KB', desc:'Reduce unused JS for better performance.' },
      ];
      document.getElementById('findings').innerHTML = findings.map(f =>
        `<div class="finding-row"><div class="finding-icon ${f.icon}">${f.sym}</div><div><div class="finding-title">${f.title}</div><div class="finding-desc">${f.desc}</div></div></div>`
      ).join('');
    });

    await page.waitForTimeout(3000);

    // Scroll through results
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(2500);
  }
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

  // Navigate
  await page.goto(PROJECT_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
    console.log('Navigation timeout, continuing...');
  });
  await page.waitForTimeout(1000);

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

  // Close and save video
  await context.close();
  await browser.close();

  // Find the recorded video
  const { readdirSync } = await import('fs');
  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    const { renameSync } = await import('fs');
    const finalPath = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.webm`);
    renameSync(path.join(OUTPUT_DIR, latest), finalPath);
    console.log(`✅ Video saved: ${finalPath}`);
    console.log(`📝 To convert to MP4: ffmpeg -i ${finalPath} -c:v libx264 -preset fast -crf 23 -t 20 ${path.join(OUTPUT_DIR, OUTPUT_NAME + '.mp4')}`);
  } else {
    console.log('❌ No video file found');
  }
})();
