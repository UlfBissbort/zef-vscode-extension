# Zef Markdown Code Runner - VS Code Extension Plan

## Project Setup

### Location
**Separate repo:** Yes, keep it independent from zef2.
- Location: `/Users/ulf/dev/zef-vscode-extension` 
- Later publish to VS Code Marketplace
- Can install locally during development

### Local Development Installation
```bash
# From extension directory
npm run compile
# Press F5 in VS Code to launch Extension Development Host
# OR package and install:
npx vsce package
code --install-extension zef-md-runner-0.0.1.vsix
```

---

## Implementation Plan (Small, Testable Steps)

### Phase 1: Skeleton Extension ✅

**Goal:** Extension loads, shows activation message

**Steps:**
1. Scaffold with `npx yo code` (TypeScript)
2. Set activation event: `onLanguage:markdown`
3. Add `console.log("Zef MD Runner activated!")` in activate()
4. Press F5, open any .md file, see message in debug console

**Test:** Message appears when opening markdown file

---

### Phase 2: Detect Code Blocks ✅

**Goal:** Find ```python blocks, log their ranges

**Steps:**
1. Create `src/codeBlockParser.ts`
2. Parse document text with regex: `/```python\n([\s\S]*?)```/g`
3. Return array of `{ range: Range, code: string }`
4. Log found blocks on document open

**Test:** Open .zef.md file, see logged ranges in debug console

---

### Phase 3: Add CodeLens Buttons ✅

**Goal:** "▶ Run" appears above each Python block

**Steps:**
1. Create `src/codeLensProvider.ts`
2. Implement `CodeLensProvider` interface
3. Register for `{ pattern: '**/*.zef.md' }` OR all markdown
4. Return CodeLens at line before each code block
5. Command: `zefmd.runBlock` (placeholder for now)

**Test:** Open .zef.md, see "▶ Run" above Python blocks

---

### Phase 4: Run Code (Minimal) ✅

**Goal:** Clicking "Run" sends code to Python terminal

**Steps:**
1. Register command `zefmd.runBlock`
2. Get/create Python terminal: `vscode.window.createTerminal`
3. Send code: `terminal.sendText(code)`
4. Show terminal

**Test:** Click "Run", code executes in terminal, see output

---

### Phase 5: Keyboard Shortcut ✅

**Goal:** Shift+Enter runs block at cursor

**Steps:**
1. Create `zefmd.runBlockAtCursor` command
2. Find code block containing cursor position
3. Execute that block
4. Add keybinding in `package.json`

**Test:** Cursor in code block, Shift+Enter, code runs

---

### Phase 6: IPython/Jupyter Integration (Optional)

**Goal:** Use Jupyter kernel for persistent state

**Steps:**
1. Check if Jupyter extension available
2. Use `jupyter.execSelectionInteractive` command
3. Fall back to terminal if not available

**Test:** Run two blocks, second block sees first block's variables

---

## File Structure

```
zef-vscode-extension/
├── package.json         # Extension manifest
├── tsconfig.json
├── src/
│   ├── extension.ts     # Entry point
│   ├── codeBlockParser.ts
│   ├── codeLensProvider.ts
│   └── commands.ts      # Run commands
└── README.md
```

---

## package.json Key Parts

```json
{
  "name": "zef-md-runner",
  "activationEvents": ["onLanguage:markdown"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      { "command": "zefmd.runBlock", "title": "Run Code Block" }
    ],
    "keybindings": [
      {
        "command": "zefmd.runBlockAtCursor",
        "key": "shift+enter",
        "when": "editorLangId == markdown"
      }
    ]
  }
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CodeLens not showing | Check file pattern, ensure provider registered |
| Terminal not found | Create new terminal if none exists |
| Jupyter not installed | Graceful fallback to plain terminal |
| Cursor detection wrong | Use document.getWordRangeAtPosition or line-by-line scan |

---

## Success Criteria

After Phase 5, we should be able to:
1. Open any `.zef.md` file
2. See "▶ Run" above each ```python block
3. Click to run OR press Shift+Enter
4. See output in terminal

---

## Next Action

Create the extension skeleton:
```bash
mkdir -p /Users/ulf/dev/zef-vscode-extension
cd /Users/ulf/dev/zef-vscode-extension
npx yo code
# Select: New Extension (TypeScript)
# Name: zef-md-runner
```
