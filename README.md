# Zef VS Code Extension

Run Python code blocks from `.zef.md` files.

## Features

- **CodeLens**: "▶ Run" buttons appear above each Python code block in `.zef.md` files
- **Keyboard shortcut**: `Shift+Enter` runs the code block at cursor
- Executes code in a dedicated terminal

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

### Testing Locally

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Open a `.zef.md` file
4. See "▶ Run" above Python code blocks

## Usage

Create a file like `example.zef.md`:

```markdown
# My Analysis

​```python
print("Hello from Zef!")
x = 42
​```

​```python
print(f"x is {x}")
​```
```

Click "▶ Run" or press `Shift+Enter` inside a code block.
