+++
ET.MarkdownDocument('🍃-aef85698dec05d5163dd',
  title='vscode-markdown-code-execution',
  importance=1,
  tag_=[],
  created=Time('2026-01-23 08:21:48 +0800')
)
+++

# 🧪 Running Python Code Blocks from Markdown in VS Code


---

## The Goal

We want this to work:

```
document.zef.md
━━━━━━━━━━━━━━━

# My Analysis

Here's some context...

```python
import pandas as pd
df = pd.read_csv("data.csv")
df.head()
```

And then more explanation...
```

☝️ When your cursor is in that Python block, press a key and **boom** — it runs in IPython, just like `# %%` cells in `.py` files!

---

## 🤔 How Does VS Code Do This for `.py` Files?

First, let's understand the magic behind `# %%`:

### The Python Extension's Approach

1. **Detects cell markers** (`# %%`) in Python files
2. **Adds CodeLens** ("Run Cell" clickable links above cells)
3. **Sends code to IPython** via the Jupyter extension
4. **Shows output** in an interactive window

```python
# %% Cell 1
x = 42

# %% Cell 2  
print(x)  # This runs in the same kernel, so x exists!
```

Key insight: **The Python extension doesn't execute code itself** — it delegates to the Jupyter extension, which manages the IPython kernel.

---

## 🛠️ Options for `.zef.md` Files

Let's explore from simplest to most sophisticated:

### Option 1: Command + Selection 🥉

**The lazy way:** Just select code and run it.

1. Select the code block text
2. Run command: `Python: Run Selection/Line in Python Terminal`

**Pros:** Works today, no extension needed
**Cons:** Manual selection, no kernel persistence, no inline output

---

### Option 2: Snippets + Keybindings 🥈

Create a keybinding that:
1. Detects you're in a fenced code block
2. Extracts the code
3. Sends to Python terminal

```json
// keybindings.json
{
  "key": "shift+enter",
  "command": "extension.runMarkdownCodeBlock",
  "when": "editorLangId == markdown"
}
```

**Pros:** Feels native
**Cons:** Need to write the extension yourself

---

### Option 3: Custom VS Code Extension 🥇

This is the real solution. Here's the architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  .zef.md file   │ ──▶ │  Your Extension  │ ──▶ │  Jupyter Ext    │
│  (markdown)     │     │  (detects blocks)│     │  (runs code)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────┐
                                                  │  IPython Kernel │
                                                  └─────────────────┘
```

---

## 🏗️ Building the Extension (The Good Stuff)

VS Code gives us several powerful APIs. Let's explore them!

### API 1: Document Symbol Provider

Detect code blocks as "symbols" VS Code understands:

```typescript
class MarkdownCodeBlockProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(document: TextDocument): DocumentSymbol[] {
    // Parse markdown, find ```python blocks
    // Return them as symbols
  }
}
```

This makes code blocks show up in the **Outline view** and **breadcrumbs**!

---

### API 2: CodeLens Provider

Add "▶ Run" buttons above code blocks:

```typescript
class RunCodeLensProvider implements CodeLensProvider {
  provideCodeLenses(document: TextDocument): CodeLens[] {
    const blocks = findPythonCodeBlocks(document);
    return blocks.map(block => new CodeLens(
      block.range,
      {
        title: "▶ Run",
        command: "zefmd.runCodeBlock",
        arguments: [block]
      }
    ));
  }
}
```

Now you see:

```
▶ Run
```python
print("hello!")
```
```

---

### API 3: The Jupyter Extension API

Here's the secret sauce. The Jupyter extension **exposes an API** for running code!

```typescript
// Get the Jupyter extension
const jupyter = vscode.extensions.getExtension('ms-toolsai.jupyter');
const api = await jupyter.activate();

// Run code in a kernel
api.runCode(codeString, kernelSpec);
```

Actually... it's a bit more complex. You need to:

1. Get or create an **Interactive Window**
2. Submit code to it
3. Handle output

```typescript
// The real pattern
await vscode.commands.executeCommand(
  'jupyter.execSelectionInteractive',
  codeString
);
```

---

### API 4: Notebook Rendering (Nuclear Option)

VS Code has a **Notebook API**. You could make `.zef.md` files render AS notebooks!

```typescript
class ZefNotebookSerializer implements NotebookSerializer {
  deserializeNotebook(content: Uint8Array): NotebookData {
    const markdown = content.toString();
    const cells = parseMarkdownToCells(markdown);
    return new NotebookData(cells);
  }
}
```

Now your markdown IS a notebook:
- Each code block = executable cell
- Each text section = markdown cell
- Full notebook features (output, kernel, etc.)

**This is probably overkill**, but it's powerful!

---

## 🎯 The Recommended Approach

Here's what I'd build:

### Minimal Viable Extension

```
zefmd-runner/
├── extension.ts     # Main entry
├── codeBlockParser.ts   # Finds ```python blocks
├── codeLensProvider.ts  # Adds "Run" buttons
└── jupyterRunner.ts     # Sends code to kernel
```

### Key Components

**1. Parse code blocks:**
```typescript
function findCodeBlocks(doc: TextDocument): CodeBlock[] {
  const text = doc.getText();
  const regex = /```python\n([\s\S]*?)```/g;
  // ... return blocks with ranges
}
```

**2. Register CodeLens:**
```typescript
vscode.languages.registerCodeLensProvider(
  { pattern: '**/*.zef.md' },
  new RunCodeLensProvider()
);
```

**3. Register command:**
```typescript
vscode.commands.registerCommand('zefmd.runBlock', async (block) => {
  await vscode.commands.executeCommand(
    'jupyter.execSelectionInteractive',
    block.code
  );
});
```

**4. Add keybinding:**
```json
{
  "key": "shift+enter",
  "command": "zefmd.runBlockAtCursor",
  "when": "resourceExtname == .md"
}
```

---

## 🌟 Extra Credit: Inline Output

Want output to appear **in the document** like a real notebook?

Use **Notebook Cell Outputs** or **decorations**:

```typescript
// Create a decoration type for output
const outputDecoration = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: 'Output: 42',
    color: '#888'
  }
});

// Apply it below the code block
editor.setDecorations(outputDecoration, [outputRange]);
```

Or go full notebook with a **Custom Editor**:
- Register for `*.zef.md` files
- Render as interactive notebook
- Save back to markdown

---

## 📊 Comparison Table

| Approach | Effort | UX | Persistence |
|----------|--------|-----|-------------|
| Select + Run | None | 😐 | ❌ |
| Keybinding | Low | 🙂 | ❌ |
| CodeLens Extension | Medium | 😊 | ✅ (via Jupyter) |
| Full Notebook Renderer | High | 🤩 | ✅ |

---

## 🚀 Quick Start

Want to try this today? Here's the fastest path:

1. **Install** [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) — it supports code block execution!

2. Or use **VS Code's built-in** "Run Selection in Terminal":
   - Select code block
   - `Cmd+Shift+P` → "Run Selection"

3. For the real deal, scaffold an extension:
   ```bash
   npx yo code
   # Choose "New Extension (TypeScript)"
   ```

---

## 💡 Key Takeaways

1. **VS Code's Python cells** use Jupyter under the hood
2. **Jupyter exposes APIs** for running code
3. **CodeLens** gives you clickable buttons in the editor
4. **Custom extensions** can add any behavior to any file type
5. **Notebooks API** is the nuclear option for full interactivity

The easiest win: **CodeLens + Jupyter command execution**

The power move: **Custom notebook serializer for .zef.md**

---
