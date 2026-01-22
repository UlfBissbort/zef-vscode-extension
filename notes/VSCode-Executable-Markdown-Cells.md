# Executable Code Blocks in Markdown: Building Your Own "Run Cell" Feature


---

## The Goal

You know how VS Code lets you run `# %%` cells in Python files? Super handy!

We want the same thing but for Markdown files with `.zef.md` extension:

```markdown
# My Zef Notes

Some text here...

```python
# Click "Run" to execute this!
print("Hello from markdown!")
```

More text...

```python
# This runs in the same IPython session
x = 42
print(x)
```
```

Click a button (or use a keyboard shortcut) → code runs in IPython → output appears!

---

## How Does VS Code Do It for Python Files?

The `# %%` cell feature comes from the **Python extension** (Pylance + Python). It works like this:

1. **Detects cell markers** in `.py` files (`# %%`)
2. **Adds CodeLens** ("Run Cell" text above each cell)
3. **Sends code** to an IPython kernel when clicked
4. **Shows output** in the "Python Interactive" window

We need to do something similar for Markdown!

---

## The Options

| Approach | Complexity | Power | Best For |
|----------|------------|-------|----------|
| **Notebook Mode** | Low | High | If you're okay converting to `.ipynb` |
| **Code Actions** | Medium | Medium | Simple "run selection" |
| **CodeLens** | Medium | High | The "Run Cell" button experience |
| **Custom Editor** | High | Highest | Full control over everything |
| **Embedded Language** | Medium | High | Proper syntax highlighting too |

Let's explore each!

---

## Option 1: Just Convert to Notebook! 📓

VS Code can treat **any file** as a notebook if you register a `NotebookSerializer`.

```typescript
// Your extension tells VS Code: "I can open .zef.md as a notebook!"
vscode.workspace.registerNotebookSerializer('zef-notebook', new ZefNotebookSerializer())
```

Then you parse the markdown, find code blocks, and present them as notebook cells!

**Pros:**
- Free "run cell" UI (VS Code provides it!)
- Free output rendering
- Free kernel management

**Cons:**
- The file IS the notebook (not markdown anymore)
- Might change how the file is saved

---

## Option 2: Code Actions (Quick Fix Style) 🔧

Code Actions are those little lightbulbs that appear. You can add a "Run this block" action!

```typescript
// When cursor is in a python code block:
provideCodeActions(document, range) {
  if (isInsidePythonBlock(document, range)) {
    return [
      {
        title: "▶ Run Code Block",
        command: "zef.runCodeBlock",
        arguments: [extractCodeBlock(document, range)]
      }
    ]
  }
}
```

**Pros:**
- Works in regular markdown files
- Simple to implement

**Cons:**
- Need to position cursor in block first
- Less discoverable than CodeLens

---

## Option 3: CodeLens (The "Run Cell" Button) 👁️

CodeLens adds clickable text **above** lines of code. This is how Python does "Run Cell"!

```
```python                    ← CodeLens appears here: "▶ Run | ▶ Run Below"
print("hello")
```
```

Here's the high-level pattern:

```typescript
// 1. Find all ```python blocks
provideCodeLenses(document) {
  const blocks = findPythonBlocks(document)
  
  return blocks.map(block => ({
    range: block.range,
    command: {
      title: "▶ Run Block",
      command: "zef.runBlock",
      arguments: [block.code]
    }
  }))
}

// 2. When clicked, send to IPython
commands.registerCommand("zef.runBlock", (code) => {
  // Send to IPython kernel (more on this later!)
  ipythonKernel.execute(code)
})
```

**This is probably what you want!** ✅

---

## Option 4: Custom Editor 🎨

Take full control of how `.zef.md` files render:

```typescript
// Register a custom editor for .zef.md files
vscode.window.registerCustomEditorProvider('zef.markdownEditor', new ZefEditor())
```

Your editor can render markdown + add run buttons inline.

**Pros:**
- Full control over UI
- Can show output inline

**Cons:**
- Lots of work
- Lose standard text editing features

---

## Option 5: Embedded Languages 🧩

VS Code has a concept of "embedded languages"—one file containing multiple languages.

```typescript
// Tell VS Code: "Inside .zef.md, there's Python in code blocks"
vscode.languages.registerDocumentSemanticTokensProvider(
  { pattern: '**/*.zef.md' },
  new EmbeddedPythonTokenProvider()
)
```

This gives you:
- Syntax highlighting for Python inside markdown
- Python IntelliSense in code blocks
- Can combine with CodeLens for execution

---

## The Recommended Approach: CodeLens + IPython Kernel 🎯

Here's the architecture that makes sense:

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  .zef.md file                         │  │
│  │                                                       │  │
│  │  # My Notes                                           │  │
│  │                                                       │  │
│  │  ▶ Run Block   ← CodeLens (clickable!)               │  │
│  │  ```python                                            │  │
│  │  x = 42                                               │  │
│  │  print(x)                                             │  │
│  │  ```                                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ click!                          │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Your Extension                           │  │
│  │                                                       │  │
│  │  1. Parse markdown, find ```python blocks            │  │
│  │  2. Provide CodeLens for each block                   │  │
│  │  3. On click → send to IPython                       │  │
│  │  4. Show output in panel                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ execute                         │
│                           ▼                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           IPython Kernel (Jupyter)                    │  │
│  │                                                       │  │
│  │  Maintains state between executions!                  │  │
│  │  x = 42 is remembered                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Sketch

### Step 1: Register for `.zef.md` files

```typescript
// package.json
{
  "contributes": {
    "languages": [{
      "id": "zefmd",
      "extensions": [".zef.md"]
    }]
  }
}
```

### Step 2: Find code blocks

```typescript
function findPythonBlocks(document: vscode.TextDocument) {
  const text = document.getText()
  const blocks = []
  
  // Regex to find ```python ... ``` blocks
  const regex = /```python\n([\s\S]*?)```/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      code: match[1],
      startLine: document.positionAt(match.index).line,
      endLine: document.positionAt(match.index + match[0].length).line
    })
  }
  
  return blocks
}
```

### Step 3: Provide CodeLens

```typescript
class ZefCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(document: vscode.TextDocument) {
    const blocks = findPythonBlocks(document)
    
    return blocks.map(block => new vscode.CodeLens(
      new vscode.Range(block.startLine, 0, block.startLine, 0),
      {
        title: "▶ Run Block",
        command: "zef.runBlock",
        arguments: [block.code]
      }
    ))
  }
}

// Register it
vscode.languages.registerCodeLensProvider(
  { pattern: '**/*.zef.md' },
  new ZefCodeLensProvider()
)
```

### Step 4: Execute in IPython

You have a few options here:

**Option A: Use VS Code's Jupyter extension**
```typescript
// Piggyback on existing Jupyter infrastructure
vscode.commands.executeCommand(
  'jupyter.execSelectionInteractive',
  code
)
```

**Option B: Your own IPython kernel**
```typescript
// Start IPython and communicate via stdin/stdout
const ipython = spawn('ipython', ['--simple-prompt'])
ipython.stdin.write(code + '\n')
ipython.stdout.on('data', (output) => {
  showOutput(output)
})
```

**Option C: Use Jupyter kernel protocol**
```typescript
// Connect to a Jupyter kernel via ZMQ (most robust)
const kernel = new JupyterKernel()
kernel.execute(code).then(result => showOutput(result))
```

---

## Showing Output

Several options:

### Output Panel
```typescript
const outputChannel = vscode.window.createOutputChannel('Zef')
outputChannel.appendLine(result)
outputChannel.show()
```

### Inline Decorations (fancy!)
```typescript
// Show output right below the code block
const decoration = vscode.window.createTextEditorDecorationType({
  after: {
    contentText: `→ ${result}`,
    color: 'gray'
  }
})
editor.setDecorations(decoration, [range])
```

### Webview Panel (richest)
```typescript
const panel = vscode.window.createWebviewPanel('output', 'Output', ...)
panel.webview.html = `<pre>${result}</pre>`
```

---

## Keyboard Shortcut

Add a "Run Block at Cursor" shortcut:

```typescript
// package.json
{
  "contributes": {
    "keybindings": [{
      "command": "zef.runBlockAtCursor",
      "key": "shift+enter",
      "when": "editorTextFocus && resourceExtname == .zef.md"
    }]
  }
}
```

```typescript
// The command finds which block the cursor is in
commands.registerCommand('zef.runBlockAtCursor', () => {
  const position = editor.selection.active
  const block = findBlockAtPosition(document, position)
  if (block) {
    executeCode(block.code)
  }
})
```

---

## Summary: What You Need

1. **CodeLensProvider** - Shows "▶ Run" above each code block
2. **Block parser** - Finds ```python blocks in markdown
3. **Kernel connection** - IPython/Jupyter for execution
4. **Output display** - Panel, inline, or webview
5. **Keybinding** - Shift+Enter to run

---

## The Minimal Version

If you want to start simple, here's the 80/20:

1. Parse markdown for code blocks (regex)
2. Add CodeLens with "Run" command
3. Send code to `jupyter.execSelectionInteractive` (reuse VS Code's Jupyter!)
4. Let Jupyter's built-in UI show output

That's maybe 100 lines of code and you get:
- Run buttons on every code block
- Shared IPython session (variables persist!)
- Rich output (plots, dataframes, etc.)

