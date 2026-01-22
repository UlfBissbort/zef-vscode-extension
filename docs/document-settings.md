# Document-Level Settings in Zef

Zef supports per-document settings via a `---zef` frontmatter block at the top of your `.zef.md` files. Settings use TOML syntax.

## Basic Usage

Add a `---zef` block at the very beginning of your document:

```toml
---zef
[svelte]
persist_output = false
---

# Your Document Title

Content starts here...
```

## Available Settings

### Svelte Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `persist_output` | boolean | `true` | Whether to save rendered HTML to the document after running Svelte blocks |

**Example:**
```toml
---zef
[svelte]
persist_output = false
---
```

When `persist_output = false`:
- Svelte components still render in the preview
- No `rendered-html` block is added to your file
- Useful for keeping source files clean

When `persist_output = true` (default):
- Rendered HTML is saved as a `rendered-html` block
- Output persists even when not running the kernel
- Useful for documentation and sharing

## Future Settings (Planned)

### Python Settings (coming soon)

```toml
[python]
venv = "./my_project_venv"   # Custom venv path for this document
```

### HTML Settings (coming soon)

```toml
[html]
persist_output = false   # Whether to save rendered HTML output
```

## Notes

- The frontmatter must be at the **very start** of the file
- Empty frontmatter (`---zef\n---`) is valid and uses all defaults
- Invalid TOML is gracefully ignored (defaults are used)
- The frontmatter block is not rendered in the preview
