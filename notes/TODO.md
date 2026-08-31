+++
ET.MarkdownDocument('🍃-7e446959c5d975959266',
  title='TODO',
  importance=1,
  tag_=[],
  created=Time('2026-01-28 17:25:48 +0800')
)
+++

# Zef Extension TODOs

## Python File Preview

### Current Implementation
The Python file preview uses a simple state machine to parse `"""md` blocks. This works for basic cases but has limitations.

### TODO: Use Proper Python Parser

**Issue:** The current regex-based parsing cannot reliably handle:
- Nested `"""md` blocks inside outer comments
- `"""md` appearing inside string literals
- Complex quote escaping scenarios
- Mixed `"""` and `'''` quote styles

**Solution:** Use a proper Python tokenizer:
1. Option A: Use `tree-sitter-python` for accurate AST parsing
2. Option B: Use a Python process to tokenize and return structure
3. Option C: Use a TypeScript Python parser library

**Benefits:**
- Reliable detection of string boundaries
- Proper handling of all edge cases
- Future-proof for more complex features

**Priority:** Medium - current implementation works for typical use cases

---

## Other TODOs

- [ ] Code execution for Python file code blocks
- [ ] Result storage in Python files (as `"""Result: ..."""`)
- [ ] Cell-based execution (Jupyter-style)
- [ ] Inline output display in Python files
