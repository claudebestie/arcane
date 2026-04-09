import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MOCK = {"title":"Warm Ember Luxe","vibe":"Japanese minimalism meets warm earth tones — quiet luxury with handcrafted warmth","color_palette":["#2C1810","#8B6F47","#D4A574","#F5E6D3","#1A1A1A"],"color_names":["Dark Umber","Warm Bronze","Desert Sand","Cream Linen","Charcoal Black"],"typography_suggestion":"Cormorant Garamond + DM Sans","keywords":["japanese ceramic","warm candlelight","linen texture","minimal interior","earth tones","handcraft wood","wabi sabi","warm shadows"],"sections":[{"label":"Mood","description":"Quiet luxury, understated warmth, intentional simplicity"},{"label":"Textures","description":"Raw linen, unglazed ceramic, matte paper, soft wax"},{"label":"Typography","description":"Elegant serif for headings, clean sans for body — breathing space"},{"label":"Layout","description":"Generous whitespace, asymmetric grids, editorial pacing"}],"style_notes":"This brand should feel like walking into a quiet room with warm light. Nothing shouts. Every detail is intentional. Think Aesop meets Muji — premium without pretension.","images":[{"url":"https://images.unsplash.com/photo-1602607613009-6f5f2d174017?w=800","thumb":"https://images.unsplash.com/photo-1602607613009-6f5f2d174017?w=400","credit":"Alesia Kazantceva","keyword":"japanese ceramic"},{"url":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800","thumb":"","credit":"Photo","keyword":"warm candlelight"},{"url":"https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800","thumb":"","credit":"Photo","keyword":"minimal interior"},{"url":"https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800","thumb":"","credit":"Photo","keyword":"earth tones"},{"url":"https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800","thumb":"","credit":"Photo","keyword":"linen texture"}]};

(async () => {
  console.log('🎬 Day 5: Moodboard Generator');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport:{width:1080,height:1080}, recordVideo:{dir:OUTPUT_DIR,size:{width:1080,height:1080}}, deviceScaleFactor:2 });
  const page = await context.newPage();
  await page.route('**/api/generate', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(MOCK)}));
  await page.goto('https://moodboard-arcane.netlify.app', {waitUntil:'networkidle',timeout:10000}).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.locator('#promptInput').click();
  await page.keyboard.type('A luxury candle brand inspired by Japanese minimalism', {delay:30});
  await page.waitForTimeout(600);
  await page.locator('#generateBtn').click();
  await page.waitForTimeout(4500);
  await page.waitForTimeout(2500);
  await page.evaluate(()=>window.scrollBy({top:300,behavior:'smooth'}));
  await page.waitForTimeout(3000);
  await page.evaluate(()=>window.scrollBy({top:400,behavior:'smooth'}));
  await page.waitForTimeout(3000);
  await context.close(); await browser.close();
  const files = readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.webm'));
  if(files.length>0){renameSync(path.join(OUTPUT_DIR,files.sort().pop()),path.join(OUTPUT_DIR,'moodboard.webm'));console.log('✅ moodboard.webm')}
})();
