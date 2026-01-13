# Zef Markdown Runner: Implementation Plan

A minimal VS Code extension to run Python code blocks in `.zef.md` files.

---

## Key Decisions

| Question | Answer |
|----------|--------|
| Separate repo? | **Yes** - cleaner, publishable independently |
| Local install first? | **Yes** - use `code --install-extension` with `.vsix` |
| Publish to store later? | **Yes** - once stable, publish to VS Code Marketplace |

---

## Phase 1: Minimal Viable Extension

**Goal:** See "▶ Run" above a code block, click it, see output.

### Step 1.1: Scaffold the Extension

```bash
# Create new extension project
npx yo code
# Choose: New Extension (TypeScript)
# Name: zef-md-runner
```

**Files created:**
```
zef-md-runner/
├── package.json       # Extension manifest
├── src/
│   └── extension.ts   # Main entry point
├── tsconfig.json
└── .vscode/
    └── launch.json    # F5 to debug
```

**Test:** Press F5 in VS Code → new window opens with extension loaded.

---

### Step 1.2: Register for `.zef.md` Files

Add to `package.json`:
```json
{
  "activationEvents": ["onLanguage:markdown"],
  "contributes": {
    "languages": [{
      "id": "zefmd",
      "extensions": [".zef.md"],
      "configuration": "./language-configuration.json"
    }]
  }
}
```

**Test:** Create a `.zef.md` file → extension activates.

---

### Step 1.3: Add CodeLens Provider

In `extension.ts`:
- Parse document for ```python blocks
- Return CodeLens for each block

**Test:** Open `.zef.md` file → see "▶ Run Block" above each code block.

---

### Step 1.4: Execute Code on Click

Start simple: use VS Code's built-in Jupyter integration.

```typescript
vscode.commands.executeCommand('jupyter.execSelectionInteractive', codeString)
```

**Requires:** User has Jupyter extension installed.

**Test:** Click "▶ Run Block" → code runs in Jupyter Interactive window.

---

### Step 1.5: Package and Install Locally

```bash
npm install -g @vscode/vsce
vsce package  # Creates zef-md-runner-0.0.1.vsix
code --install-extension zef-md-runner-0.0.1.vsix
```

**Test:** Extension works in normal VS Code (not just debug mode).

---

## Phase 2: Polish

### Step 2.1: Add Keyboard Shortcut

`Shift+Enter` runs block at cursor.

### Step 2.2: Better Output Display

Show inline decorations or dedicated output panel.

### Step 2.3: Multiple Language Support

Support `zef`, `rust`, etc. (not just Python).

---

## Phase 3: Publish

1. Create publisher account on VS Code Marketplace
2. `vsce publish`
3. Users can install via Extensions panel

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Jupyter extension not installed | Show error message with install link |
| Regex misses edge cases | Add tests for block parsing |
| CodeLens doesn't appear | Check activation events are correct |
| Output doesn't show | Fall back to output channel |

---

## First Testable Milestone

**After Step 1.4, you should be able to:**

1. Open a `.zef.md` file
2. See "▶ Run Block" above each ```python block
3. Click it
4. See output in Jupyter Interactive window

**Time estimate:** ~1-2 hours to get here.

---

## File Structure (Minimal)

```
zef-md-runner/
├── package.json
├── src/
│   ├── extension.ts      # Activation, command registration
│   └── codeLensProvider.ts  # Find blocks, provide CodeLens
└── README.md
```

---

## Commands to Run

```bash
# 1. Scaffold
mkdir zef-md-runner && cd zef-md-runner
npm init -y
npm install --save-dev @types/vscode typescript

# 2. Create minimal package.json (see above)
# 3. Create src/extension.ts (see above)

# 4. Build
npx tsc

# 5. Package
npx vsce package

# 6. Install locally
code --install-extension zef-md-runner-0.0.1.vsix
```

---

## Next Action

**Create the repo at `/Users/ulf/dev/zef-md-runner` and scaffold the extension.**
