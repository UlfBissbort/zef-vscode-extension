# Introducing the Zef VSCode Plugin

**Jupyter notebooks, evolved. Write Markdown. Run Python. Reproduce anything.**

---

## The 10-Second Pitch

The Zef VSCode Plugin turns `.zef.md` files into executable documents. Write prose and Python together. Run code blocks interactively. Every result is automatically tracked and reproducible.

---

## See It in Action

This document you're reading? It's executable. Try it:

```python
sales = [1200, 800, 1500, 950]
total = sum(sales)
print(f"Q1 Total: ${total:,}")
```

Check the tabs above: **Code** | **Output** | **Side Effects**

---

## Functions Are Stored by Hash

When you define a function, Zef stores it by its content hash—like git, but for functions:

```python
def average(numbers):
    """Calculate the arithmetic mean."""
    return sum(numbers) / len(numbers)

# Try it out
avg = average(sales)
print(f"Average sale: ${avg:.2f}")
```

The function `average` now has a unique hash (e.g., `#a7f2c3`). Same code = same hash, everywhere, forever.

---

## Build on Previous Blocks

Code blocks share state, just like notebooks. But with a key difference: Zef tracks the entire lineage.

```python
# Build on 'sales' from above
growth_target = total * 1.2
print(f"Next quarter target: ${growth_target:,.0f}")

# Define a reusable function
def calculate_growth(current, target):
    return ((target - current) / current) * 100

growth = calculate_growth(total, growth_target)
print(f"Required growth: {growth:.0f}%")
```

Every function and value is tracked by hash. Six months later, you can reproduce this exact result.

---

## Why Not Just Use Jupyter?

| | Jupyter | Zef |
|---|---------|-----|
| **Editor** | Basic web UI | Full VS Code |
| **State** | Hidden, fragile | Tracked, reproducible |
| **Sharing** | Export files | Share by hash |
| **Dependencies** | requirements.txt 🙏 | Locked by hash |

---

## The Power of Content-Addressing

Here's the key insight: when code is identified by *what it does* (its hash) rather than *where it lives* (a file path), powerful things become possible:

```python
# Imagine this pipeline:
# raw_data (#d1) → clean (#f1) → analyze (#f2) → result (#d2)

raw_data = [100, None, 250, 75, None, 420]

def clean(data):
    """Remove None values."""
    return [x for x in data if x is not None]

def analyze(data):
    """Basic statistics."""
    return {
        'count': len(data),
        'total': sum(data),
        'average': sum(data) / len(data),
        'min': min(data),
        'max': max(data)
    }

result = analyze(clean(raw_data))
print(result)
```

**What Zef tracks:**
- `raw_data` → hash of the input
- `clean` → hash of the function
- `analyze` → hash of the function  
- `result` → hash of the output

The complete provenance is recorded. Need to audit how a result was computed? It's all there.

---

## Everything You Love About VS Code

Unlike Jupyter's web editor, you're in VS Code. That means:

- All your extensions work
- Real debugger integration
- Git integration that makes sense
- Vim/Emacs bindings, multi-cursor, whatever you prefer
- Proper autocomplete and intellisense

```python
# Use any Python library you'd normally use
import datetime
print(f"Document executed: {datetime.datetime.now()}")
```

---

## Get Started

1. Install the Zef VSCode extension
2. Create any file ending in `.zef.md`
3. Write Python in fenced code blocks
4. Open the preview panel (Cmd+Shift+P → "Zef: Open Preview")
5. Run your code

**That's it.** Your Markdown is now executable, trackable, and shareable.

---

## What's Next?

- Define functions that persist in the Zef codebase
- Share code with other Zef users by hash
- Build reproducible data pipelines
- Never wonder "how did I compute this?" again

Welcome to reproducible interactive computing. 🚀
