import { scrapeAndSave } from './src/scraper';
import { pruneHtml } from './src/pruner';
import * as fs from 'fs';
import * as path from 'path';

async function extract(url: string, name: string) {
  console.log(`\n--- Extracting ${name} ---`);
  const { html, screenshotPath } = await scrapeAndSave(url);
  const prunedHtml = pruneHtml(html);
  
  const tempDir = path.join(process.cwd(), 'temp');
  fs.writeFileSync(path.join(tempDir, `${name}-pruned.html`), prunedHtml);
  
  // Save the new screenshot path so we can predictably find it later
  const newScreenshotPath = path.join(tempDir, `${name}-screenshot.png`);
  fs.renameSync(screenshotPath, newScreenshotPath);

  console.log(`Saved screenshot to ${newScreenshotPath}`);
  console.log(`Saved pruned HTML to temp/${name}-pruned.html`);
}

async function main() {
  await extract('https://makayoga.space/', 'makayoga');
}

main().catch(console.error);
