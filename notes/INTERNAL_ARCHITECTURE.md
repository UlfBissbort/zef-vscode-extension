# Zef VS Code Extension - Internal Architecture

A concise guide for developers to understand how the Zef extension works internally.

## Overview

Zef transforms `.zef.md` files into executable notebooks. The extension has three main responsibilities:

1. **Parse** code blocks from markdown
2. **Execute** code in the appropriate runtime (Python, Rust, JS/TS, Svelte)
3. **Render** results in a beautiful preview panel

## Core Components

### Entry Point: `extension.ts`

The coordinator that:
- Registers all VS Code commands (`zef.runBlock`, `zef.openPreview`, etc.)
- Sets up CodeLens providers for "Run" buttons
- Routes code execution to the correct executor
- Writes results back to the source file

### Preview System: `previewPanel.ts`

Manages webview panels for rendered markdown:
- **One panel per document** - stored in `panels: Map<documentUri, WebviewPanel>`
- Renders markdown with custom syntax highlighting
- Creates interactive UI (tabs for Code/Result/Side Effects, Run buttons)
- Communicates with extension via `postMessage` / `onDidReceiveMessage`

### Code Parsing: `codeBlockParser.ts`

Finds executable code blocks and their associated output blocks:
- Tracks `blockId` (sequential index of executable blocks)
- Returns code content, language, and ranges for Result/Side Effects blocks

### Execution Layer

Each language has its own executor:

| File | Language | Runtime |
|------|----------|---------|
| `kernelManager.ts` | Python | Persistent subprocess (like Jupyter) |
| `rustExecutor.ts` | Rust | Bun-based compilation |
| `jsExecutor.ts` | JavaScript | Bun |
| `tsExecutor.ts` | TypeScript | Bun |
| `svelteExecutor.ts` | Svelte | Bun + Svelte compiler |

The Python kernel maintains state across executions via `kernel/zef_kernel.py`.

## Execution Flow

When a user clicks "Run" or "Compile":

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Preview Panel (Webview)                          │
│  User clicks "Run" → postMessage({ type: 'runCode', code, blockId, ... })│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      previewPanel.ts                                     │
│  onDidReceiveMessage → onRunCodeCallback(code, blockId, lang, docUri)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        extension.ts                                      │
│  Routes to: runCodeInKernel() / runRustCode() / compileSvelteBlock()    │
│  Executes via the appropriate executor                                   │
│  Sends result: sendCellResult(blockId, result, documentUri)             │
│  Writes to file: writeOutputToFile(blockId, result, documentUri)        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Insight: Document URI Tracking

The `documentUri` is passed through the entire chain to ensure:
- Results are sent to the **correct** preview panel (not just the first one)
- Output blocks are written to the **correct** source file

This is critical when multiple `.zef.md` files are open simultaneously.

## Message Protocol

### Webview → Extension

```typescript
// Run code
{ type: 'runCode', code: string, blockId: number, language: string }

// Toggle checkbox
{ type: 'toggleCheckbox', index: number, checked: boolean }

// Navigate to source
{ type: 'scrollToSource', line: number }
```

### Extension → Webview

```typescript
// Python/Rust/JS/TS result
{ type: 'cellResult', blockId: number, result: CellResult }

// Svelte compilation result  
{ type: 'svelteResult', blockId: number, result: SvelteResult }

// Scroll sync
{ type: 'scrollToLine', line: number }
```

## Output Storage in Markdown

Results are embedded directly after code blocks using fenced blocks:

```markdown
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

For Svelte components:
```markdown
```svelte
<script>let count = 0;</script>
<button on:click={() => count++}>{count}</button>
```
````rendered-html
<!-- Compiled HTML here -->
````
```

## File Organization

```
src/
├── extension.ts         # Command registration, execution routing
├── previewPanel.ts      # Webview creation, message handling, HTML generation
├── codeBlockParser.ts   # Markdown parsing, block detection
├── kernelManager.ts     # Python subprocess management
├── rustExecutor.ts      # Rust code execution
├── jsExecutor.ts        # JavaScript execution
├── tsExecutor.ts        # TypeScript execution
├── svelteExecutor.ts    # Svelte compilation
├── configManager.ts     # Settings, Python interpreter selection
└── pythonDetector.ts    # Python environment discovery
```

## Design Decisions

1. **Webview over Custom Editor** - Simpler implementation, works alongside the text editor
2. **Per-document panels** - Each `.zef.md` gets its own preview, avoiding cross-file confusion
3. **DocumentUri threading** - Explicit passing of document context through callbacks
4. **Embedded output** - Results stored in the markdown file for reproducibility and sharing
5. **Bun runtime** - Fast execution for JS/TS/Rust/Svelte without heavy dependencies

## Common Extension Points

To add a new language:
1. Create `newLangExecutor.ts` following the pattern of existing executors
2. Add language detection in `codeBlockParser.ts`
3. Route execution in `extension.ts` callback
4. Add syntax highlighting in `previewPanel.ts` webview script
