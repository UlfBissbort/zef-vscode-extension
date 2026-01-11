# Zef VS Code Extension - Architecture Overview

## Goal

A VS Code extension that enables working with `.zef.md` files — executable markdown with beautiful rendering.

### Core Features
1. **Execute Python code blocks** - Run Python directly from markdown
2. **Beautiful preview** - Elegant dark theme rendering with syntax highlighting
3. **Live editing** - Gray background on code blocks, live preview updates

---

## Project Structure

```
/Users/ulf/dev/zef-vscode-extension/
├── package.json          # Extension manifest, commands, keybindings
├── tsconfig.json         # TypeScript config
├── build.py              # Python build script (npm install → compile → package → install)
├── README.md             # User documentation
├── LICENSE               # MIT
├── .gitignore
├── src/
│   ├── extension.ts      # Entry point, activates extension, registers commands
│   ├── codeBlockParser.ts # Finds ```python blocks, provides CodeLens
│   └── previewPanel.ts   # Webview preview panel with markdown rendering
├── out/                  # Compiled JavaScript (gitignored)
└── node_modules/         # Dependencies (gitignored)
```

---

## Dependencies

- **marked** (^11.0.0) - Markdown parser
- **highlight.js** (installed, not yet integrated) - Syntax highlighting

---

## Current State

### Working
- ✅ CodeLens "▶ Run" buttons above Python blocks
- ✅ Shift+Enter to run block at cursor
- ✅ Cmd+Shift+V to open preview panel
- ✅ Gray background decoration on code blocks
- ✅ Live preview updates on document change
- ✅ Elegant dark theme (AKB-inspired)
- ✅ Language badges on code blocks

### Needs Fixing
- ❌ Syntax highlighting broken (custom lexer has bugs - missing spaces)
- **Next step**: Switch to highlight.js for proper syntax highlighting

---

## Key Files

### extension.ts
- Registers CodeLens provider for `**/*.zef.md`
- Registers commands: `zef.runBlock`, `zef.runBlockAtCursor`, `zef.openPreview`
- Creates terminal for code execution
- Applies decorations (gray background) to code blocks

### codeBlockParser.ts
- `findPythonCodeBlocks(document)` - Regex to find ```python blocks
- `findCodeBlockAtPosition(document, position)` - Find block at cursor
- `CodeBlockProvider` - Implements `CodeLensProvider` for "▶ Run" buttons

### previewPanel.ts
- `createPreviewPanel()` - Creates webview in column 2
- `updatePreview()` - Renders markdown to HTML
- `getWebviewContent()` - Full HTML with CSS theme and JS highlighting
- **TODO**: Replace custom lexer with highlight.js

---

## Commands & Keybindings

| Command | Keybinding | When |
|---------|------------|------|
| `zef.runBlock` | — | Via CodeLens click |
| `zef.runBlockAtCursor` | Shift+Enter | In .zef.md files |
| `zef.openPreview` | Cmd+Shift+V | In .zef.md files |

---

## Build & Install

```bash
# One command (recommended)
python3 build.py

# Manual steps
npm install
npm run compile
npx vsce package --allow-missing-repository
code --install-extension zef-*.vsix --force
```

---

## Design Decisions

1. **Webview for preview** (not Custom Editor) - Simpler, side-by-side editing
2. **Terminal execution** (not Jupyter) - Lighter weight, will add custom Zef runner later
3. **Dark theme** - Matches AKB aesthetic: #0a0a0a bg, #fafafa text, minimal
4. **highlight.js** (pending) - Better than custom lexer, 190+ languages

---

## Next Steps

1. Integrate highlight.js in previewPanel.ts
2. Test syntax highlighting for Python, Rust, JS, TS
3. Consider: Custom Zef runner instead of Python terminal
4. Consider: Custom markdown parser using Zef
