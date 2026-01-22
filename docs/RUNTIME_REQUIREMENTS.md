# Runtime Requirements Guide

This guide explains the runtime dependencies required to execute different types of code blocks in Zef.

## Overview

Zef supports executing code in multiple languages:

| Language | Runtime Required | Install Guide |
|----------|-----------------|---------------|
| Python | Python 3.x | [Python Setup](#python) |
| Rust | rustc compiler | [Rust Setup](#rust) |
| JavaScript | Bun | [Bun Setup](#bun) |
| TypeScript | Bun | [Bun Setup](#bun) |
| Svelte | Bun | [Bun Setup](#bun) |

---

## Python

### What is Python?

Python is a versatile programming language widely used for data analysis, automation, web development, and more. In Zef, Python code blocks maintain state between executions—like Jupyter notebooks.

### Do I Need It?

You need Python if you want to run `python` code blocks in your `.zef.md` files.

### How to Install

**macOS:**
```bash
# Using Homebrew (recommended)
brew install python

# Or download from python.org
open https://www.python.org/downloads/
```

**Windows:**
```bash
# Using winget
winget install Python.Python.3.12

# Or download installer from python.org
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install python3

# Fedora
sudo dnf install python3
```

### Verify Installation

```bash
python3 --version
# Should output: Python 3.x.x
```

### Configure in Zef

1. Open Command Palette: `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)
2. Type "Zef: Settings" and press Enter
3. Select "Python Interpreter"
4. Choose from auto-detected interpreters or enter a custom path

**Custom Path Setting:**
```json
{
  "zef.defaultPython": "/path/to/python3"
}
```

---

## Rust

### What is Rust?

Rust is a systems programming language focused on safety, speed, and concurrency. It's great for performance-critical code. In Zef, Rust code blocks are compiled and executed, with the last expression returned as output.

### Do I Need It?

You need Rust if you want to run `rust` code blocks in your `.zef.md` files.

### How to Install

**All Platforms (Recommended):**

Visit [rustup.rs](https://rustup.rs/) or run:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

This installs:
- `rustc` - The Rust compiler
- `cargo` - The Rust package manager
- `rustup` - The toolchain installer

After installation, restart your terminal or run:
```bash
source $HOME/.cargo/env
```

**macOS with Homebrew:**
```bash
brew install rust
```

### Verify Installation

```bash
rustc --version
# Should output: rustc 1.x.x
```

### Configure in Zef

If Rust is installed via rustup, Zef will auto-detect it. For custom installations:

1. Open Command Palette: `Cmd+Shift+P`
2. Type "Zef: Settings"
3. Select "Rust Compiler"
4. Choose "Configure Custom Path"

**Custom Path Setting:**
```json
{
  "zef.rustcPath": "/path/to/rustc"
}
```

---

## Bun

### What is Bun?

Bun is a fast, all-in-one JavaScript runtime. It's used in Zef to execute JavaScript, TypeScript, and compile Svelte components. Bun is significantly faster than Node.js for these tasks.

### Do I Need It?

You need Bun if you want to run:
- `javascript` or `js` code blocks
- `typescript` or `ts` code blocks  
- `svelte` component blocks

### How to Install

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**macOS with Homebrew:**
```bash
brew install oven-sh/bun/bun
```

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Verify Installation

```bash
bun --version
# Should output: 1.x.x
```

### Configure in Zef

If Bun is installed to the default location (`~/.bun/bin/bun`), Zef will auto-detect it. For custom installations:

1. Open Command Palette: `Cmd+Shift+P`
2. Type "Zef: Settings"  
3. Select "Bun Runtime (JS/TS)"
4. Choose "Configure Custom Path"

**Custom Path Setting:**
```json
{
  "zef.bunPath": "/path/to/bun"
}
```

---

## Troubleshooting

### "Runtime not found" Error

When you see this error, Zef couldn't find the required runtime. The error message provides two options:

1. **Configure Path** - Opens settings to specify a custom path if the runtime is installed in a non-standard location
2. **Install Instructions** - Opens the official installation page for the runtime

### Checking Runtime Status

1. Open Command Palette: `Cmd+Shift+P`
2. Type "Zef: Settings"
3. Look for ✓ (available) or ⚠ (not found) next to each runtime

### Common Issues

**Python not detected:**
- Ensure Python 3 is in your PATH
- Try setting `zef.defaultPython` to the full path

**Rust not detected after installation:**
- Restart VS Code after installing Rust
- Ensure `~/.cargo/bin` is in your PATH
- Try running `source $HOME/.cargo/env`

**Bun not detected:**
- Restart VS Code after installing Bun
- Ensure `~/.bun/bin` is in your PATH

---

## Settings Reference

| Setting | Description | Default |
|---------|-------------|---------|
| `zef.defaultPython` | Path to Python interpreter | Auto-detect |
| `zef.notebookVenv` | Path to virtual environment | None |
| `zef.rustcPath` | Path to Rust compiler | Auto-detect |
| `zef.bunPath` | Path to Bun runtime | Auto-detect |

---

## Need Help?

- [GitHub Issues](https://github.com/UlfBissbort/zef-vscode-extension/issues)
- [README](https://github.com/UlfBissbort/zef-vscode-extension#readme)
