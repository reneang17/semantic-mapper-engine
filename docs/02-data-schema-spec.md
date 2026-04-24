# Data Schema Specification

## 1. Context
This specification dictates the strict JSON formats utilized by the Semantic Mapper Engine. Any new features that modify the data structure MUST update this specification before code implementation.

## 2. The AI VLM Payload Schema
When the Vision-Language Model (or Antigravity emulation) parses the DOM, it must strictly return an array of the following object structure:

```typescript
interface SemanticElement {
  intent: string;              // e.g., 'enter_email', 'navigate_home'
  selector: string;            // The most robust CSS/XPath selector possible
  action_type: string;         // Strictly 'type', 'click', 'select', or 'drag'
  semantic_label: string;      // Human-readable text or icon meaning
  is_navigation: boolean;      // True ONLY if interacting navigates to a different view or modal
  available_options?: string[];// ONLY IF element is a <select> dropdown, radial group, etc.
  interaction_steps: string;   // Exact DOM manipulation required (e.g. 'Click the input box...')
  target_state_hash?: string;  // Retroactively assigned by Spider if navigation occurs
}
```

## 3. The State Wrapper Schema (Relational Node)
The Spider wraps the AI payload into a Node representing the isolated page state. This file is saved to the `test-maps/` directories.

```typescript
interface RelationalStateNode {
  state_hash: string;         // The MD5 hash identifier of the pruned page state
  depth: number;              // Traversal depth from root
  url: string;                // The browser URL when this state was captured
  elements: SemanticElement[];// The AI Payload array
}
```

## 4. Hashing and Deduplication Rules
- **Programmatic Spider:** `state_hash` is generated via `crypto.createHash('md5').update(prunedHtml).digest('hex')`. This guarantees absolute structural deduplication.
- **Emulation Phase:** `state_hash` utilizes human-readable semantic prefixes combined with pseudo-hashes (e.g., `contact_hash444`) to facilitate human visual validation.
