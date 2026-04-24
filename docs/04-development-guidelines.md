# Development Guidelines & Protocol

## 1. Specification-Driven Development (SDD)
To ensure system stability, this project strictly adheres to Specification-Driven Development. 
**Before any new feature or structural change is coded:**
1. The developer and agent MUST discuss the change.
2. The relevant specification file in `docs/` MUST be updated.
3. Only after the specification update is committed, coding may begin.

## 2. Modifying the Pruner Rules
The `src/pruner.ts` file acts as the primary defense mechanism against LLM context limits.
- **Rule of Thumb:** If an HTML tag or attribute does not directly contribute to user interaction or visual intent, it must be stripped.
- When adding new allowed attributes (e.g., adding `aria-expanded`), ensure it is documented in the commit message and does not bloat the output file size by more than 10%.

## 3. Emulation First
Always test structural navigation or schema changes via the **Antigravity Emulation Workflow** (as defined in `03-workflow-spec.md`) before attempting to write programmatic Playwright or API-interaction code. This ensures the theoretical model is sound without wasting API credits.

## 4. Hash Immutability
Never hardcode MD5 hashes in the programmatic Spider flow. Hashes must always be generated natively based on the pruned DOM. Hardcoding hashes defeats the state-deduplication logic and will result in infinite loops during graph traversal.
