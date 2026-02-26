# Zef VS Code Extension - Architecture

## Goal

A VS Code extension that enables working with `.zef.md` files — executable markdown with beautiful rendering.

### Core Features
1. **Execute code blocks** - Run Python, Rust, JavaScript, TypeScript from markdown
2. **Beautiful preview** - Elegant dark theme with syntax highlighting
3. **Live editing** - Gray background on code blocks, live preview updates
4. **Structured output** - Result and Side Effects displayed as zef expressions

## Overview

Zef is a VS Code extension that enables interactive code execution within `.zef.md` markdown files. It provides a notebook-like experience with code blocks that can be executed, displaying results and side effects inline.

## File Structure

```
zef-vscode-extension/
├── src/                      # TypeScript extension source
│   ├── extension.ts          # Main entry point & command registration
│   ├── previewPanel.ts       # Webview panel for rendered markdown + results
│   ├── codeBlockParser.ts    # Parses code blocks from markdown
│   ├── kernelManager.ts      # Manages Python kernel subprocess
│   ├── configManager.ts      # Settings & Python interpreter selection
│   ├── pythonDetector.ts     # Discovers available Python interpreters
│   ├── notebookExport.ts     # Pure functions: .py/.zef.md → Jupyter .ipynb
│   ├── htmlExport.ts         # Pure functions: rendered preview → self-contained HTML
│   ├── rustExecutor.ts       # Rust code execution via Bun
│   ├── jsExecutor.ts         # JavaScript execution via Bun
│   └── tsExecutor.ts         # TypeScript execution via Bun
├── kernel/
│   └── zef_kernel.py         # Python kernel subprocess
├── package.json              # Extension manifest & commands
├── build.py                  # Build, package & install script
└── tsconfig.json             # TypeScript configuration
```

## Core Components

### 1. Extension Entry Point (`extension.ts`)

The main activation point that:
- Registers commands (`zef.runBlock`, `zef.openPreview`, `zef.selectPython`, etc.)
- Sets up CodeLens provider for "Run" buttons above code blocks
- Manages status bar item showing current Python interpreter
- Handles keyboard shortcuts (Shift+Enter, Cmd+Enter for execution)
- Coordinates between the preview panel and kernel manager
- Routes code execution to appropriate executor (Python, Rust, JS, TS)

### 2. Preview Panel (`previewPanel.ts`)

A webview that renders `.zef.md` files with:
- **Three tabs per code block**: Code | Result | Side Effects
- **Run button**: Executes the code block
- **Syntax highlighting**: Custom `highlightCode()` function for Python/Rust/JS/TS
- **Result display**: Shows evaluated expression with Python syntax highlighting
- **Side effects display**: Shows stdout/stderr as structured zef expressions with Python highlighting
- **Scroll sync**: Clicking code blocks scrolls to source

The webview uses:
- `marked` for markdown parsing
- Custom inline syntax highlighter (not highlight.js) supporting keywords, strings, numbers, comments, functions, types

### 3. Code Block Parser (`codeBlockParser.ts`)

Parses markdown to find:
- Code blocks: ` ```python `, ` ```rust `, ` ```javascript `, ` ```typescript `
- Result blocks: ` ````Result ` or ` ````Output `
- Side Effects blocks: ` ````Side Effects `

Each block is tracked by `blockId` for associating results with their source code.

### 4. Kernel Manager (`kernelManager.ts`)

Manages a persistent Python subprocess:
- Starts `kernel/zef_kernel.py` with the selected Python interpreter
- Sends JSON requests: `{"code": "...", "cell_id": "..."}`
- Receives JSON responses with status, result, stdout, stderr, side_effects, error
- Maintains namespace across executions (like Jupyter)
- Provides output channel for debugging

### 5. Python Kernel (`kernel/zef_kernel.py`)

A subprocess that:
- Maintains a persistent Python namespace (`InteractiveInterpreter`)
- Executes code and captures:
  - **Result**: The repr of the last expression
  - **stdout/stderr**: Captured as side effects
  - **Errors**: Type, message, and traceback
- Uses `SideEffectCapture` to track individual print() calls

### 6. Other Executors

- **Rust Executor**: Uses Bun to run Rust code via wasm
- **JS/TS Executor**: Uses Bun for JavaScript/TypeScript execution

## Data Flow

```
┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  .zef.md file  │──────│  codeBlockParser │──────│  Preview Panel  │
└────────────────┘      └──────────────────┘      └────────┬────────┘
                                                           │
                                                    [Run Button]
                                                           │
                                                           ▼
┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ Python Kernel  │◄─────│  kernelManager   │◄─────│   extension.ts  │
│ (subprocess)   │      │  (JSON protocol) │      │  (coordinator)  │
└────────────────┘      └──────────────────┘      └─────────────────┘
        │                                                  │
        │  CellResult                                      │
        │  {status, result, side_effects, ...}             │
        └──────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Update Preview      │
                    │  - Result tab        │
                    │  - Side Effects tab  │
                    │  - Syntax highlight  │
                    └──────────────────────┘
```

## Key Features

### Syntax Highlighting
- Custom tokenizer in `previewPanel.ts` (`highlightCode()` function)
- Supports: Python, Rust, JavaScript, TypeScript
- Highlights: keywords, strings, numbers, comments, functions, types
- **Code tab**: Uses language from code fence (python/rust/js/ts)
- **Result tab**: Always uses Python highlighting (zef expressions)
- **Side Effects tab**: Always uses Python highlighting

### Code Block Structure in `.zef.md`

```markdown
# My Document

```python
x = 1 + 2
x
```
````Result
3
````
````Side Effects
[]
````
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Shift+Enter | Run code block at cursor |
| Cmd+Enter | Run code block at cursor |
| Cmd+Shift+V | Open Zef preview panel |

### Commands

| Command | Description |
|---------|-------------|
| `zef.runBlock` | Run a specific code block |
| `zef.runBlockAtCursor` | Run block at current cursor position |
| `zef.openPreview` | Open the preview panel |
| `zef.selectPython` | Choose Python interpreter |
| `zef.settings` | Open settings panel |
| `zef.restartKernel` | Restart the Python kernel |
| `zef.showKernelOutput` | Show kernel debug output |

## Build & Development

```bash
# Build, package, and install
python build.py

# Or manually:
npm run compile          # Compile TypeScript
npx vsce package         # Create .vsix
code --install-extension zef-0.0.3.vsix
```

## Configuration

Settings in VS Code:
- `zef.defaultPython`: Path to default Python interpreter
- `zef.notebookVenv`: Path to virtual environment (priority over defaultPython)

## Design Decisions

1. **Webview for preview** (not Custom Editor) - Simpler, side-by-side editing
2. **Persistent Python kernel** (not terminal) - Maintains state across executions like Jupyter
3. **Dark theme** - Matches AKB aesthetic: #0a0a0a bg, #fafafa text, minimal
4. **Custom syntax highlighter** - Inline in webview, avoids external library loading complexity
5. **Tab-based output** - Code | Result | Side Effects tabs for clean organization
6. **Zef expressions for results** - Output displayed as Python-like zef expressions

### Export Modules (Functional Core / Imperative Shell)

Both `notebookExport.ts` and `htmlExport.ts` follow the same architecture:
- **Pure functions only** in the module — no `fs`, no `vscode`, no side effects
- **Side effects at the boundary** — file I/O, save dialogs, asset loading all happen in the message handler in `previewPanel.ts`
- Functions receive data, return data. The caller decides what to do with it.

**`htmlExport.ts`** exports the rendered preview as a single self-contained HTML file:
- `detectFeatures(markdown)` — scans for `$$`/`$` math and ` ```mermaid ` fences
- `inlineKatexFonts(css, fonts)` — replaces font `url()` references with base64 data URIs
- `getExportCss(maxWidth)` — returns a clean CSS subset of the preview theme (deliberate duplication from `getWebviewContent` CSS — the export CSS is a standalone subset, not a shared abstraction)
- `generateStandaloneHtml(input)` — assembles the complete HTML with conditionally embedded mermaid/KaTeX

KaTeX fonts (19 woff2 files, ~276KB total) are base64-inlined into the CSS so the HTML is fully self-contained with no external dependencies. Mermaid.js (~3.2MB) is embedded inline when mermaid diagrams are detected. Total file size: ~3.5MB with mermaid+math, ~300KB with math only, ~50KB for plain markdown.

**Svelte/HTML rendered block embedding:**
- `embedRenderedBlocks(html, svelteExports)` — post-processes rendered HTML. For svelte blocks: per-component mode selection (source/rendered/both). For HTML blocks: always renders as iframe.
- `SvelteBlockExport` interface: `{ mode: 'source' | 'rendered' | 'both', renderedHtml?: string }`
- Data flows from the webview: the modal collects iframe.srcdoc for each compiled component and sends it with the export message.

**Export modal (per-component Svelte selection):**
When the document contains Svelte components, clicking "Export HTML" opens a modal in the webview:
- Lists each Svelte component with source preview and rendered status
- Per-component toggle: Source | Rendered | Both (Rendered/Both disabled if not compiled)
- "Compile Unrendered" button: triggers compilation, modal updates live when results arrive (via svelteResult message handler)
- The webview is the single source of truth: compiled HTML comes from iframe.srcdoc, selections come from the modal.
