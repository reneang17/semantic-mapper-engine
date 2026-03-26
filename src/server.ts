import express from 'express';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { spiderCrawl } from './spider';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/v1/map', async (req, res) => {
  const targetUrl = req.query.url as string;
  const depth = parseInt(req.query.depth as string) || 2;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target url parameter' });
  }

  try {
    console.log(`[API] Processing mapping request for: ${targetUrl} (Max Depth: ${depth})`);
    
    // Trigger Relational Spider crawl globally
    console.log(`[API] Step 1: Initiating relational agentic BFS crawler...`);
    const crawlerOutput = await spiderCrawl(targetUrl, depth);

    const { root_hash, states } = crawlerOutput;

    // Parse domain strictly to spawn an isolated layout folder
    const parsedUrl = new URL(targetUrl);
    const domain = parsedUrl.hostname.replace(/[^a-zA-Z0-9]/g, '_');
    const mapDir = path.join(process.cwd(), 'test-maps', domain);

    if (!fs.existsSync(mapDir)) {
        fs.mkdirSync(mapDir, { recursive: true });
    }
    
    // Dump every individual state node autonomously into localized files
    for (const [hash, stateData] of Object.entries(states)) {
        const isRoot = hash === root_hash;
        const filename = isRoot ? `root_${hash}.json` : `${hash}.json`;
        fs.writeFileSync(path.join(mapDir, filename), JSON.stringify(stateData, null, 2));
    }

    console.log(`[API] Successfully generated relational map directory for ${domain} containing ${Object.keys(states).length} states`);
    
    return res.json({ 
        message: "Successfully compiled and saved distributed relational maps", 
        root_hash,
        total_states_discovered: Object.keys(states).length,
        map_directory_path: mapDir 
    });
    
  } catch (error) {
    console.error('[API] Error generating relational map:', error);
    return res.status(500).json({ error: 'Failed to extract relational map', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Semantic Mapper Engine listening on port ${port}`);
});
