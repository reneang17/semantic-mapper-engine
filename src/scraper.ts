import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

export async function scrapeAndSave(url: string): Promise<{ html: string; screenshotPath: string }> {
  // Ensure /temp directory exists
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log(`[Scraper] Launching Playwright browser...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log(`[Scraper] Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const screenshotName = `screenshot-${Date.now()}.png`;
  const screenshotPath = path.join(tempDir, screenshotName);

  console.log(`[Scraper] Capturing full-page screenshot to ${screenshotPath}...`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`[Scraper] Extracting raw HTML outerHTML...`);
  const html = await page.evaluate(() => document.documentElement.outerHTML);

  await browser.close();
  console.log(`[Scraper] Browser closed.`);

  return { html, screenshotPath };
}
