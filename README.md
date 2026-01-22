# Zef

A VS Code extension for working with `.zef.md` files — executable markdown with beautiful rendering.

## Features

### Code Block Execution
- **▶ Run** buttons appear above Python code blocks
- **Shift+Enter** runs the code block at cursor
- Executes in a dedicated terminal

### Live Preview
- **Cmd+Shift+V** opens a beautifully rendered preview panel
- Elegant dark theme with Apple-inspired minimalist styling
- Syntax highlighting for Python, Rust, JavaScript, TypeScript
- Live updates as you type

### Editor Integration
- Gray background highlighting for code blocks
- Works with any `.zef.md` file

## Usage

1. Create a file with `.zef.md` extension
2. Write markdown with code blocks:

```markdown
# My Analysis

Some explanatory text...

​```python
print("Hello from Zef!")
x = 42
​```

​```rust
fn main() {
    println!("Hello, Rust!");
}
​```
```

3. Click **▶ Run** above a Python block to execute
4. Press **Cmd+Shift+V** to open the preview panel

## Building from Source

```bash
# Clone the repo
git clone https://github.com/UlfBissbort/zef-vscode-extension.git
cd zef-vscode-extension

# Build and install (recommended)
python3 build.py

# Or manually:
npm install
npm run compile
npx vsce package --allow-missing-repository
code --install-extension zef-*.vsix --force
```

After installing, reload VS Code: **Cmd+Shift+P** → **Reload Window**

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| Zef: Run Code Block | — | Run the code block (via CodeLens) |
| Zef: Run Code Block at Cursor | Shift+Enter | Run block where cursor is |
| Zef: Open Preview to Side | Cmd+Shift+V | Open rendered preview panel |

## Requirements

- VS Code 1.85.0 or higher
- Node.js (for building)
- Python (for build.py script)

## License

MIT
