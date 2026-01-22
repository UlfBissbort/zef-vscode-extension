# Zef

Lightweight Jupyter-style notebooks in Markdown. Write executable documents with code, results, and visualizations — all in plain `.zef.md` files.

## Why Zef?

Zef brings the power of Jupyter notebooks to Markdown files:

- **Lightweight** — Plain text files, no special notebook format
- **Executable** — Run code blocks directly in VS Code
- **Embeddable results** — Output is stored inline, share files with results included
- **Beautiful rendering** — Dark theme preview with mermaid diagrams and syntax highlighting
- **Svelte components** — Define and render interactive components inline

## Features

### Code Execution

Execute code blocks in multiple languages:

- **Python** — Full support with expression output (like Jupyter cells)
- **Rust** — Compile and run
- **JavaScript / TypeScript** — Bun execution

The final expression of a code block is captured as **output** — just like Jupyter. Side effects are tracked and can be displayed.

**Run code:**
- Click the **▶ Run** button above any code block
- Press **Shift+Enter** to run the block at cursor
- Press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows) as alternative

### Embedded Results

Results from code execution can be embedded directly in the Markdown file. This allows you to share `.zef.md` files complete with the outputs — like Jupyter notebooks, but in plain Markdown.

### Content-Addressed Storage

For large inputs or outputs, Zef uses a **content-hashing system**:

- Any value can be identified by its content hash
- Hashes serve as compact placeholders in your document
- Sync with the Zef Distributed Hash Store happens transparently
- Links never go stale — no version conflicts or cache invalidation

### Live Preview

Press **Cmd+Shift+V** to open a beautifully rendered preview:

- Elegant dark theme with minimalist styling
- **Mermaid diagrams** rendered automatically
- Syntax highlighting for all major languages
- Live updates as you type

### Svelte Components

Define Svelte components directly in code blocks:

- Components are compiled and rendered inline
- Interactive UI elements in your documents
- Compiled output can be embedded for sharing

## Usage

1. Create a file with `.zef.md` extension
2. Write markdown with code blocks:

```markdown
# My Analysis

Some explanatory text...

​```python
data = [1, 2, 3, 4, 5]
sum(data) / len(data)  # Output: 3.0
​```

​```mermaid
graph LR
    A[Input] --> B[Process]
    B --> C[Output]
​```
```

3. Click **▶ Run** to execute code blocks
4. Press **Cmd+Shift+V** to open the preview panel

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Zef: Run Code Block | — | Run the code block (via CodeLens) |
| Zef: Run Code Block at Cursor | Shift+Enter | Run block at cursor |
| Zef: Open Preview | Cmd+Shift+V | Open rendered preview panel |
| Zef: Select Python Interpreter | — | Choose Python environment |
| Zef: Restart Kernel | — | Restart the execution kernel |

## Building from Source

```bash
git clone https://github.com/UlfBissbort/zef-vscode-extension.git
cd zef-vscode-extension

npm install
npm run compile
npx vsce package
code --install-extension zef-*.vsix --force
```

After installing, reload VS Code: **Cmd+Shift+P** → **Reload Window**

## Documentation

- **[Internal Architecture](notes/INTERNAL_ARCHITECTURE.md)** — How the extension works under the hood
- **[Architecture Overview](notes/ARCHITECTURE.md)** — High-level design and file structure

## Requirements

- VS Code 1.85.0 or higher
- Python 3.x (for Python code execution)
- Bun (for JS/TS execution) — install from https://bun.sh
- Node.js (for building from source)
- Rust toolchain (optional, for Rust code execution)

## License

MIT
