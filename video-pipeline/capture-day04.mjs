import { chromium } from 'playwright';
import { existsSync, mkdirSync, readdirSync, renameSync } from 'fs';
import path from 'path';
const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const MOCK = {"palette":[{"hex":"#0052ff","name":"Stripe Blue","role":"primary"},{"hex":"#000000","name":"Pure Black","role":"text"},{"hex":"#ffffff","name":"Pure White","role":"background"},{"hex":"#873eff","name":"Vivid Purple","role":"accent"},{"hex":"#ff6201","name":"Vibrant Orange","role":"accent"},{"hex":"#34a853","name":"Forest Green","role":"accent"},{"hex":"#ffd100","name":"Golden Yellow","role":"accent"},{"hex":"#ea4335","name":"Coral Red","role":"accent"},{"hex":"#fafbfd","name":"Ice Blue","role":"background"},{"hex":"#171d27","name":"Charcoal Navy","role":"secondary"},{"hex":"#0090da","name":"Sky Blue","role":"secondary"},{"hex":"#72716d","name":"Warm Gray","role":"neutral"}],"primary_colors":["#0052ff"],"background_colors":["#ffffff","#fafbfd"],"accent_colors":["#873eff","#ff6201","#34a853","#ffd100","#ea4335"],"text_colors":["#000000","#171d27"],"summary":"Modern fintech palette with Stripe's signature electric blue, complemented by vibrant accent colors. High contrast and contemporary digital aesthetics.","css_code":":root {\n  --stripe-blue: #0052ff;\n  --pure-black: #000000;\n  --pure-white: #ffffff;\n  --vivid-purple: #873eff;\n  --vibrant-orange: #ff6201;\n  --forest-green: #34a853;\n  --golden-yellow: #ffd100;\n  --coral-red: #ea4335;\n}","raw_count":46};

(async () => {
  console.log('🎬 Day 4: Palette Extractor');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport:{width:1080,height:1080}, recordVideo:{dir:OUTPUT_DIR,size:{width:1080,height:1080}}, deviceScaleFactor:2 });
  const page = await context.newPage();
  await page.route('**/api/extract', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(MOCK)}));
  await page.goto('https://palette-arcane.netlify.app', {waitUntil:'networkidle',timeout:10000}).catch(()=>{});
  await page.waitForTimeout(2500);
  await page.locator('#urlInput').click();
  await page.keyboard.type('https://stripe.com', {delay:40});
  await page.waitForTimeout(600);
  await page.locator('#extractBtn').click();
  await page.waitForTimeout(4500);
  await page.waitForTimeout(2500);
  await page.evaluate(()=>window.scrollBy({top:350,behavior:'smooth'}));
  await page.waitForTimeout(3000);
  await page.evaluate(()=>window.scrollBy({top:400,behavior:'smooth'}));
  await page.waitForTimeout(3000);
  await context.close(); await browser.close();
  const files = readdirSync(OUTPUT_DIR).filter(f=>f.endsWith('.webm'));
  if(files.length>0){renameSync(path.join(OUTPUT_DIR,files.sort().pop()),path.join(OUTPUT_DIR,'palette.webm'));console.log('✅ palette.webm')}
})();
