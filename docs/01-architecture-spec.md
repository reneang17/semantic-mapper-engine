# Architecture Specification

## 1. System Overview
The Semantic Mapper Engine translates highly volatile Web DOMs into a deterministic, relational database of JSON objects. This allows AI Agents to consume the site structurally without navigating brittle HTML or exceeding token limits.

## 2. Core Modules

### 2.1. The Scraper (`src/scraper.ts`)
- **Technology**: Playwright (Chromium Headless).
- **Responsibility**: Loads a target URL natively, waiting for network idle states to ensure all Single Page Application (SPA) client-side rendering is complete. Captures a full-page PNG screenshot and the raw `outerHTML`.

### 2.2. The Pruner (`src/pruner.ts`)
- **Technology**: Cheerio.
- **Responsibility**: Aggressively strips out all non-interactive, styling, and structural metadata from the raw HTML to preserve LLM token context.
- **Constraints**: Preserves only interactive tags (e.g., `<button>`, `<a>`, `<input>`, `<select>`) and highly resilient semantic attributes (`id`, `name`, `role`, `aria-label`, `data-testid`).

### 2.3. The VLM Engine (`src/vlm.ts`) / Antigravity Emulation
- **Technology**: Google Gemini 2.5 Pro (or Antigravity Emulation).
- **Responsibility**: Processes the pruned DOM and screenshot to infer human-readable intents and return a strictly formatted JSON array of actionable elements. 

### 2.4. The Relational BFS Spider (`src/spider.ts`)
- **Responsibility**: Crawls the web autonomously utilizing Breadth-First-Search. 
- **Mechanism**:
  - Validates visual states using MD5 hashing of the pruned DOM.
  - Dynamically synthesizes relationships by assigning a `target_state_hash` when a click triggers a new modal, view, or page.
  - Avoids infinite loop recursion by strictly tracking `visitedHashes`.

## 3. Data Flow
1. URL Input -> Scraper -> Raw HTML + Image
2. Raw HTML -> Pruner -> Pruned HTML
3. Pruned HTML + Image -> VLM Engine -> JSON Payload Array
4. Spider -> Wraps Payload -> Assigns MD5 Hash -> Checks Visited -> Links to Parent -> Saves State
