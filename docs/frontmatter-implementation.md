# Zef Frontmatter Implementation Plan

## Feature: Document-Level Settings via `---zef` Frontmatter

### Goal
Allow users to specify per-document settings in a TOML frontmatter block at the top of `.zef.md` files.

### First Setting: Svelte Output Persistence
```toml
---zef
[svelte]
persist_output = false   # Default: true. If false, don't save rendered HTML
---
```

---

## Settings Hierarchy (Future-Proof Design)

```toml
---zef
# Global document settings (future)
# auto_run = false

[svelte]
persist_output = true    # Whether to save rendered-html block after Svelte execution

[python]
# venv = "./my_venv"     # Future: custom venv path

[html]
# persist_output = true  # Future: save rendered HTML output
---
```

---

## Implementation Steps

### Step 1: Create TOML Parser Utility ✅
**File:** `src/frontmatterParser.ts`
- Function: `parseZefFrontmatter(text: string): ZefSettings | null`
- Detect `---zef` at start of file
- Extract content until closing `---`
- Parse as TOML
- Return typed settings object or null

**Test:**
- Input with valid frontmatter → returns parsed settings ✅
- Input without frontmatter → returns null ✅
- Input with invalid TOML → returns null (graceful failure) ✅

### Step 2: Install TOML Parser Dependency ✅
**Command:** `npm install @iarna/toml`
- Lightweight TOML parser
- TypeScript types available

### Step 3: Define Settings Types ✅
**File:** `src/frontmatterParser.ts`
```typescript
interface ZefSettings {
  svelte?: {
    persist_output?: boolean;
  };
  // Future sections:
  // python?: { venv?: string; };
  // html?: { persist_output?: boolean; };
}
```

### Step 4: Integrate with Svelte Execution ✅
**File:** `src/extension.ts`
- Added `shouldPersistSvelteOutput()` check in `writeSvelteResultToFile`
- If `svelte.persist_output === false`, skip saving rendered-html block
- Default behavior (no frontmatter or `true`): save as before

### Step 5: Strip Frontmatter from Preview ✅
**File:** `src/previewPanel.ts`
- Added `stripFrontmatter()` call before rendering markdown
- Frontmatter block is not visible in rendered preview

### Step 6: Test End-to-End 🧪
- Created test files in `samples/`:
  - `test-frontmatter-no-persist.zef.md` - persist_output = false
  - `test-frontmatter-persist.zef.md` - persist_output = true

---

## Implementation Details

### Frontmatter Detection Pattern
```
---zef
<TOML content>
---
```

Regex: `/^---zef\n([\s\S]*?)\n---/`

### Edge Cases
1. No frontmatter → return default settings
2. Empty frontmatter (`---zef\n---`) → return empty settings object
3. Invalid TOML → log warning, return null/defaults
4. Frontmatter not at start of file → ignore (must be first thing)
5. Multiple frontmatter blocks → only parse first one

### Default Values
```typescript
const DEFAULT_SETTINGS: ZefSettings = {
  svelte: {
    persist_output: true  // Default: save rendered output
  }
};
```

---

## Files to Modify

1. **NEW:** `src/frontmatterParser.ts` - Parser utility
2. **MODIFY:** `src/extension.ts` - Call parser, pass settings to Svelte handler
3. **MODIFY:** Svelte execution code - Respect `persist_output` setting
4. **NEW:** `package.json` - Add TOML dependency

---

## Rollout Plan

1. Implement parser (Step 1-3)
2. Add unit test for parser
3. Integrate with Svelte execution (Step 4)
4. Manual testing (Step 5)
5. Commit and push
