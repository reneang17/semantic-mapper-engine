import { chromium, Page } from 'playwright';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { pruneHtml } from './pruner';
import { generateSemanticMap } from './vlm';

// Track visited visual state DOM hashes to prevent infinite loops 
const visitedHashes = new Set<string>();

interface QueueItem {
    url: string;
    actionSequence: string[]; // Selectors required to reach localized state
    depth: number;
    parentSource?: {
        stateHash: string;     // Hash of the parent state JSON where we originated
        elementIndex: number;  // The specific element in that array that triggered this navigation
    };
}

export async function spiderCrawl(baseUrl: string, maxDepth = 2, maxPages = 12): Promise<any> {
    visitedHashes.clear();
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    
    // Flat relational database-like Map storing states via Hash ID
    const statesMap = new Map<string, any>();
    let rootHash = "";
    
    const queue: QueueItem[] = [{ 
        url: baseUrl, 
        actionSequence: [], 
        depth: 0 
    }];

    while(queue.length > 0 && statesMap.size < maxPages) {
        const current = queue.shift();
        if (!current) continue;

        console.log(`[Spider] Navigating action queue [Depth: ${current.depth}] - Evaluating ${current.actionSequence.length} interactions...`);
        
        const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }});
        const page = await context.newPage();

        try {
            await page.goto(current.url, { waitUntil: 'networkidle', timeout: 30000 });
            
            let failedToReachState = false;
            for (const selector of current.actionSequence) {
                const locator = page.locator(selector).first();
                if (await locator.isVisible()) {
                    await locator.click();
                    await page.waitForTimeout(1500); 
                } else {
                    if (current.parentSource) {
                        const parentState = statesMap.get(current.parentSource.stateHash);
                        if (parentState) parentState.elements[current.parentSource.elementIndex].error = `Selector Unreachable`;
                    }
                    failedToReachState = true;
                    break;
                }
            }

            if (failedToReachState) continue;

            await page.waitForTimeout(1000); 

            const rawHtml = await page.evaluate(() => document.documentElement.outerHTML);
            const prunedHtml = pruneHtml(rawHtml);
            const hash = crypto.createHash('md5').update(prunedHtml).digest('hex');
            
            // Retroactively link the parent node's specific interactive element array
            // to this newly discovered structurally valid State Hash!
            if (current.parentSource) {
                const parentState = statesMap.get(current.parentSource.stateHash);
                if (parentState) {
                    parentState.elements[current.parentSource.elementIndex].target_state_hash = hash;
                }
            }

            if (visitedHashes.has(hash)) {
                // State is actively mapped. The parent node now has the pointer ID.
                continue;
            }
            
            visitedHashes.add(hash);
            
            // Pin the initial landing page root
            if (current.depth === 0) rootHash = hash;
            
            let elementsMap: any[] = [];
            try {
                if (!process.env.ANTHROPIC_API_KEY) {
                    console.warn('[Spider] ANTHROPIC_API_KEY missing - generating empty generic structural map');
                } else {
                    elementsMap = await generateSemanticMap(prunedHtml);
                }
            } catch(e) {
                console.error('[Spider] VLM mapping error:', e);
            }

            // Push isolated state container locally
            const stateData = {
                state_hash: hash,
                depth: current.depth,
                url: page.url(),
                elements: elementsMap
            };
            
            statesMap.set(hash, stateData);
            console.log(`[Spider] Mapped state [${hash.substring(0,8)}] successfully. (Stored ${statesMap.size}/${maxPages})`);

            if (current.depth < maxDepth && elementsMap) {
                for (let i = 0; i < elementsMap.length; i++) {
                    const el = elementsMap[i];
                    if (el.is_navigation === true || el.is_navigation === "true") {
                        queue.push({
                            url: current.url,
                            actionSequence: [...current.actionSequence, el.selector], 
                            depth: current.depth + 1,
                            parentSource: {
                                stateHash: hash,
                                elementIndex: i // Track the exact index required to inject the target_state_hash retroactively!
                            }
                        });
                    }
                }
            }
        } finally {
            await context.close();
        }
    }

    await browser.close();
    
    // Deconstruct Map into standard JSON Record serialization format
    const compiledRelationalMap: Record<string, any> = {};
    statesMap.forEach((val, key) => compiledRelationalMap[key] = val);

    return { root_hash: rootHash, states: compiledRelationalMap };
}
