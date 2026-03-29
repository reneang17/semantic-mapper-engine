import * as dotenv from 'dotenv';
dotenv.config();

import { spiderCrawl } from './src/spider';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const urlParam = process.argv[2];
  if (!urlParam) {
    console.error('Usage: npx ts-node generate-maps.ts <url>');
    process.exit(1);
  }

  // Parse hostname and convert dots to underscores, e.g., 'makayoga.space' -> 'makayoga_space'
  let siteName: string;
  try {
    const parsedUrl = new URL(urlParam);
    siteName = parsedUrl.hostname.replace(/\./g, '_');
  } catch (err) {
    console.error('Invalid URL provided:', urlParam);
    process.exit(1);
  }

  const testMapsDir = path.join(process.cwd(), 'test-maps', siteName);
  
  // Recreate the target directory
  if (fs.existsSync(testMapsDir)) {
    fs.rmSync(testMapsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testMapsDir, { recursive: true });

  console.log(`[Generate Maps] Starting spider crawl on ${urlParam} (Max Depth 2)`);
  
  try {
    const result = await spiderCrawl(urlParam, 2);
    
    // Deconstruct and write out the relmap structure natively
    if (result && result.states) {
        for (const [hash, state] of Object.entries(result.states)) {
            const fileName = (hash === result.root_hash) ? 'root.json' : `${hash}.json`;
            const filePath = path.join(testMapsDir, fileName);
            fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
            console.log(`[Generate Maps] Wrote: ${fileName}`);
        }
        console.log(`[Generate Maps] Successfully completed mapping ${urlParam} into ${testMapsDir}`);
    } else {
        console.error('[Generate Maps] Spider crawl returned empty relational map structure.');
    }
  } catch (error) {
    console.error('[Generate Maps] Error during execution:', error);
  }
}

main();
