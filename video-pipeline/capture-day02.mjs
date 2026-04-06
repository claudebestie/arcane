/**
 * Capture Day 2: Startup or Feature?
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';

const URL = process.argv[2] || 'http://localhost:5173';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  console.log('🎬 Capturing Day 2: Startup or Feature?');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1080, height: 1080 } },
    deviceScaleFactor: 2, colorScheme: 'light'
  });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1. Hero (2.5s)
  await page.waitForTimeout(2500);

  // 2. Type an idea (3s)
  const input = page.locator('#ideaInput');
  await input.click();
  await page.waitForTimeout(300);
  await page.keyboard.type('An AI tool that scrapes company data and finds decision-makers for sales teams', { delay: 35 });
  await page.waitForTimeout(800);

  // 3. Click Analyze (1s)
  await page.locator('#analyzeBtn').click();
  await page.waitForTimeout(1500);

  // 4. Since API won't work locally, inject fake results directly
  await page.evaluate(() => {
    // Hide loading, show results
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';

    const report = {
      emoji: '🚀', css: 'verdict-startup', pillCss: 'pill-green', pillText: 'Startup',
      verdict: 'This is a startup — a $4B market.',
      desc: 'Sales intelligence is a massive, proven market. Companies like ZoomInfo charge $15K+/year. There\'s clear willingness to pay and strong retention.',
      totalScore: 68,
      scored: [
        { name: 'Standalone value', desc: 'Solves lead gen end-to-end', score: 9, status: 'green' },
        { name: 'Willingness to pay', desc: 'Sales teams pay $1K+/mo for this', score: 9, status: 'green' },
        { name: 'Market size', desc: 'Every B2B company needs leads', score: 8, status: 'green' },
        { name: 'Defensibility', desc: 'Data moat grows with usage', score: 7, status: 'green' },
        { name: 'Differentiation', desc: 'Crowded market, need a sharp angle', score: 5, status: 'amber' },
        { name: 'Technical depth', desc: 'Web scraping + NLP + data enrichment', score: 8, status: 'green' },
        { name: 'Retention', desc: 'Sales teams use this daily', score: 9, status: 'green' },
        { name: 'Revenue clarity', desc: 'SaaS subscription, per-seat pricing', score: 9, status: 'green' }
      ],
      similar: ['ZoomInfo', 'Apollo.io', 'Lusha', 'Clearbit', 'Hunter.io'],
      advice: 'The market is proven — ZoomInfo alone does $1.2B ARR. Your play: go niche. Pick one vertical (e.g. agencies, startups, real estate) and build the best data tool for that specific audience. Don\'t try to compete with ZoomInfo on breadth.'
    };

    // Render using the page's render function
    window.renderResults = window.renderResults || function(){};
    // Manually render since renderResults needs to be in scope
    const r = report;
    const card = document.getElementById('verdictCard');
    card.className = `verdict-card ${r.css} fade-up in`;
    card.innerHTML = `<div class="verdict-emoji">${r.emoji}</div><span class="verdict-pill ${r.pillCss}">${r.pillText}</span><div class="verdict-title">${r.verdict}</div><div class="verdict-desc">${r.desc}</div>`;
    document.getElementById('scoreNum').textContent = r.totalScore;
    const bar = document.getElementById('scoreBar');
    bar.style.width = ((r.totalScore/80)*100) + '%';
    bar.style.background = '#16a34a';
    document.getElementById('criteriaList').innerHTML = r.scored.map(c => `<div class="criteria-card"><div class="criteria-dot dot-${c.status}">${c.score>=7?'✓':c.score>=5?'~':'✗'}</div><div style="flex:1"><div class="criteria-name">${c.name}</div><div class="criteria-sub">${c.desc}</div></div><div class="criteria-score">${c.score}/10</div></div>`).join('');
    document.getElementById('similarList').innerHTML = r.similar.map(s => `<span class="similar-chip">${s}</span>`).join('');
    document.getElementById('advice').textContent = r.advice;
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('in'));
  });

  await page.waitForTimeout(2500);

  // 5. Scroll to see scores (3s)
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(3000);

  // 6. Scroll to criteria (3s)
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(3000);

  // 7. Hold (1s)
  await page.waitForTimeout(1000);

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
