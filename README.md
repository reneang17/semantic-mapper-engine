# Semantic Mapper Engine

> 🏆 **Current State: Best Working Version (Antigravity Emulation)**
> This version locks in the highly successful "Antigravity Emulation" pipeline. Instead of relying on a programmatic API connection which burns through tokens and can be hard to debug, this version stabilizes the core scraping, pruning, and BFS relational mapping logic by relying on a human-in-the-loop AI Agent (Antigravity) acting as the Vision-Language Model endpoint.

Semantic Mapper Engine is a Node.js/TypeScript developer tool designed to bridge the gap between AI Agents and web navigation intuitively. 

Instead of relying on brittle CSS paths or XPaths, this engine crawls a webpage, rigorously prunes the DOM, and utilizes a state-of-the-art Vision-Language Model to evaluate the visual layout. It generates a deterministic, flat, relational directory of JSON configurations - an API-like semantic layer that allows downstream agents to interact with dynamic SPA web environments through robust human-like intents (e.g., `submit_login`, `navigate_home`) without crashing their semantic token limits!

## Motivation & Architecture
AI agents attempting web automation frequently break when web developers change class names or DOM structures. Furthermore, passing an agent an entire nested sitemap's worth of HTML or JSON inevitably obliterates their limited token context processing window. 

By leveraging **Playwright** for headless visual rendering and **Cheerio** to aggressively shed token-heavy non-interactive nodes, this project minimizes context requirements. It maximizes mapping accuracy by using highly resilient attributes (`aria-label`, `role`, `data-testid`).

### The Antigravity Emulation Workflow
During this MVP development, we actively emulated the Gemini API functionality using the **Antigravity agent**. This allowed us to strictly validate our DOM string stripping capabilities and thoroughly test the relational BFS architecture without incrementally exhausting real VLM API quotas.

The pipeline works as follows:
1. **Data Extraction**: Using `extract.ts`, Playwright renders the page and takes a screenshot, while Cheerio aggressively prunes the DOM. This results in a heavily token-optimized HTML file saved to the `temp/` directory.
2. **The Handoff (Agent as API)**: Instead of an HTTP request to an API, the pruned HTML content and screenshots are provided directly to the Antigravity agent in the chat interface.
3. **VLM Processing**: The agent analyzes the DOM, finds interactive nodes, infers intents, and synthesizes unique `target_state_hash` values to build the Breadth-First-Search (BFS) relational connections.
4. **JSON Generation & Saving State**: The agent generates structured JSON maps strictly adhering to the schema, which are then saved directly into the `test-maps/` directory to natively mimic the automated spider's output. 

## Relational BFS Spider Crawling
The mapping engine utilizes an intrinsic **Breadth-First-Search (BFS)** autonomous crawler to thoroughly traverse target domains natively:
1. It reads the current localized visual DOM view and hashes it (`crypto.createHash('md5')`) to instantly prevent infinite loop recursion traps.
2. It generates a single mapping array file containing localized interaction targets (e.g., `adjust_brightness`, `navigate_portfolio`) capturing highly granular `available_options` and `interaction_steps`.
3. If a targeted interaction navigates to a localized modal or entirely distinct view, it computes a `target_state_hash` pointer onto that element and exhaustively queues the targeted view for rendering.
4. Downstream agents simply pivot around a localized layout pointer, isolating loaded JSON nodes to drastically slash Required Context Limit constraints!

## JSON Map Schema
To maintain a robust relational graph, the system relies on strict JSON schemas. 

### The AI VLM Payload
When evaluating a DOM state, the Vision-Language Model must strictly return an array of elements following this schema:
```json
[
  {
    "intent": "string (e.g., 'enter_email', 'navigate_home')",
    "selector": "string (the most robust CSS/XPath selector possible)",
    "action_type": "string ('type', 'click', 'select', 'drag')",
    "semantic_label": "string (the human-readable text or icon meaning)",
    "is_navigation": "boolean (true ONLY if interacting navigates to a different view)",
    "available_options": ["array of strings (ONLY IF element is a <select> dropdown, etc.)"],
    "interaction_steps": "string (Explain exact DOM manipulation required)",
    "target_state_hash": "string (optional - added by the spider if this navigates somewhere new)"
  }
]
```

### The State Wrapper
The spider wraps the AI's payload into an isolated container that represents the page state:
```json
{
    "state_hash": "string (The MD5 hash of the pruned HTML, or a semantic hash in test-maps)",
    "depth": "number (How many clicks deep from the root)",
    "url": "string (The browser URL)",
    "elements": [ ... The AI VLM Payload array ... ]
}
```

## Setup & Installation

Ensure you have Node 18+ installed on your system.

```bash
# Install NPM dependencies
npm install

# Install Playwright browser dependencies
npx playwright install chromium

# Compile Typescript Engine Source
npm run build
```

## Usage: Manual Emulation Workflow
To manually run the emulation pipeline to extract single root pages for the Antigravity agent:
```bash
npx tsx extract.ts
```
This script visits target URLs, prunes their DOMs, and outputs `-pruned.html` files into the `temp/` folder. The agent can read these to generate new schemas.

## Usage: Hybrid Spider Emulation (Current Best Practice)
This hybrid pipeline runs the automated BFS Spider but pauses the crawl so the Antigravity agent can emulate the VLM API endpoint.
1. Ensure `GEMINI_API_KEY` is not set in `.env`.
2. Start the local server: `npm start`
3. Trigger the crawl for your target depth (e.g., `depth=2`):
```bash
curl "http://localhost:3000/api/v1/map?url=https://makayoga.space/&depth=2"
```

### 🤖 Antigravity Execution Instructions: Hybrid Spider Pipeline
If you are the Antigravity agent and the user asks you to "execute the hybrid spider pipeline" for a target URL, follow these exact steps:
1. **Trigger Crawl**: Use `run_command` to hit the local express server endpoint as shown above. The Spider will navigate, hash the DOM, and pause.
2. **Watch the Request**: Use the `command_status` tool to observe the server. Wait until the Spider writes the pruned HTML to `temp/emulation-request.html` and pauses.
3. **Read the DOM**: Use the `view_file` tool to read `temp/emulation-request.html`.
4. **Act as the VLM**: Analyze the HTML as instructed in `src/vlm.ts`. Identify interactive elements and infer intents.
5. **Synthesize the JSON Payload**: Generate the JSON array strictly adhering to the "AI VLM Payload" schema. (Do NOT wrap it in the State Wrapper; the Spider handles that).
6. **Save the Response**: Use `write_to_file` to save the JSON array to `temp/emulation-response.json`.
7. **Iterate Automatically**: The Spider will detect the response, ingest it, automatically use Playwright to click the nodes (`is_navigation: true`), traverse the graph, and pause again for your next input. Repeat steps 2-6 until the BFS crawl finishes!

## Usage: Automated Pipeline
If you wish to use the fully automated pipeline (requires API key):
1. Create a `.env` file and set `GEMINI_API_KEY=your-key`.
2. Boot up the express web pipeline:
```bash
npm start
# or
node dist/server.js
```
3. Generate a completely exhausted relational state-mapping directory architecture dynamically via standard HTTP routing (`depth` param restricts crawling limits):
```bash
curl "http://localhost:3000/api/v1/map?url=https://makayoga.space/&depth=2"
```

## Agentic Testing & Output Maps
Included natively in the repository are the local `test-maps/` directories hosting completely mapped topologies of demonstrative Web interfaces (e.g., Makayoga, Portfolio, Mozilla Forms).

**Note on File Names**: You will notice files named like `schedule_hash111.json`. During the manual emulation phase, these names were chosen manually using semantic, human-readable prefixes and fake hashes (like `111`) to make debugging and graph-visualization easier for humans. In a fully programmatic run, the spider generates raw MD5 hashes (e.g., `c46751c0...json`) to ensure deterministic state deduplication.
