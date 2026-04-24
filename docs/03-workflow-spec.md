# Workflow Specification

## 1. Antigravity Emulation Workflow (Current Best Practice)
This is the locked-in best working pipeline, bypassing the Gemini API to avoid quota exhaustion and brittleness during MVP.

### Execution Steps
1. **Extraction**: Developer or Agent modifies `extract.ts` to include the target URL.
2. **Execute Scraper**: Run `npx tsx extract.ts`. The system saves `<name>-pruned.html` and `<name>-screenshot.png` to the `temp/` folder.
3. **Agent Handoff**: The Antigravity agent uses `view_file` to read the pruned HTML.
4. **VLM Synthesis**: Antigravity evaluates the DOM following the rules in `src/vlm.ts` to generate the strictly typed `SemanticElement[]`.
5. **State Wrapping & Output**: Antigravity manually constructs the `RelationalStateNode` (assigning semantic hashes like `root_hash123`) and saves it using `write_to_file` into `test-maps/<name>/`.

## 2. Fully Automated BFS Spider Workflow
This is the programmatic API execution pipeline.

### Execution Steps
1. **Initialize API**: Start the local express server (`npm start`).
2. **Trigger Crawl**: Send an HTTP GET request to `/api/v1/map?url=<target>&depth=2`.
3. **BFS Loop**: 
   - Spider lands on root, hashes the pruned DOM, and generates the MD5 `state_hash`.
   - Spider calls `vlm.ts` to hit the Gemini API.
   - Spider iterates through the response array. If an element has `is_navigation: true`, it pushes the selector to the queue.
   - Spider navigates down the queue, rendering the new state, hashing it, and assigning that new hash retroactively to the parent's `target_state_hash`.
   - Halts when `depth` is met or queue is empty.
