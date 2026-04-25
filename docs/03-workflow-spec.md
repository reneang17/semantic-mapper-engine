# Workflow Specification

## 1. Manual Emulation Workflow
This pipeline bypasses the Spider and the API entirely, relying on Antigravity for manual root-page extraction.
1. **Extraction**: Run `npx tsx extract.ts` for a specific URL. The system saves `<name>-pruned.html`.
2. **VLM Synthesis**: Antigravity reads the pruned HTML and generates the JSON `SemanticElement[]`.
3. **State Wrapping**: Antigravity wraps the payload into `RelationalStateNode` (assigning a pseudo-hash) and saves it to `test-maps/`.

## 2. Hybrid Spider Emulation Workflow (Current Best Practice)
This is the locked-in best working pipeline. It utilizes the programmatic BFS Spider for traversing the web, but pauses execution to allow the Antigravity agent to emulate the VLM API via a file-watching handshake.
1. **Trigger Crawl**: Ensure `GEMINI_API_KEY` is not set. Send a GET request to `/api/v1/map?url=<target>&depth=<depth>` via the express server or a local run script.
2. **Spider Pauses**: The Spider navigates to a state, hashes it (MD5), writes the `prunedHtml` to `temp/emulation-request.html`, and enters a `while` loop, waiting for a response file.
3. **Agent Intervention**: Antigravity reads `temp/emulation-request.html` and synthesizes the JSON array payload `SemanticElement[]` for that specific view.
4. **Agent Responds**: Antigravity writes the JSON array to `temp/emulation-response.json`.
5. **Spider Resumes**: The Spider detects the response, ingests the array, deletes the temp files, and uses Playwright to recursively click `is_navigation: true` elements to traverse the BFS graph.

## 3. Fully Automated API Workflow
This is the programmatic API execution pipeline.
1. **Initialize API**: Start the local express server (`npm start`) with `GEMINI_API_KEY` configured in `.env`.
2. **Trigger Crawl**: Send an HTTP GET request to `/api/v1/map?url=<target>&depth=<depth>`.
3. **BFS Loop**: 
   - Spider lands on root, generates the MD5 `state_hash`.
   - Spider calls `vlm.ts` which hits the Gemini API directly.
   - Spider iterates through the response array, clicking elements with `is_navigation: true`.
   - Halts when `depth` is met or queue is empty.
