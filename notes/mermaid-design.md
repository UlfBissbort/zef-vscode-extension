# Mermaid Diagram Rendering in Zef View

## Goal

Render `\`\`\`mermaid` code blocks as visual diagrams in the Zef preview panel, matching Obsidian's behavior.

## Design Decision Summary

Mermaid blocks are **display-only** (not executable), so they bypass the Code/Result/Side Effects tab system used for Python/Rust/JS/TS blocks. They render directly as SVG diagrams.

---

## Implementation Plan

### Step 1: Modify CSP (Content Security Policy)

**File**: `src/previewPanel.ts`

Find the CSP meta tag and add `https://cdn.jsdelivr.net` to:
- `script-src` - to load mermaid.min.js
- `style-src` - mermaid injects inline styles
- `img-src` - mermaid may use data URIs

### Step 2: Add Mermaid Script

Add to HTML before `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
```

### Step 3: Initialize Mermaid

Add to JavaScript section:
```javascript
if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ 
        theme: 'dark',
        startOnLoad: false,
        securityLevel: 'loose'  // needed for some diagram types
    });
}
```

### Step 4: Handle Mermaid Code Blocks

In the code block processing loop (`document.querySelectorAll('pre code').forEach(...)`):

```javascript
var lang = block.className.replace('language-', '');
if (lang === 'mermaid') {
    // Create a mermaid container div
    var mermaidDiv = document.createElement('div');
    mermaidDiv.className = 'mermaid';
    mermaidDiv.textContent = block.textContent;
    // Replace the pre>code structure with the mermaid div
    block.parentNode.parentNode.replaceChild(mermaidDiv, block.parentNode);
} else {
    // Existing syntax highlighting logic
}
```

### Step 5: Run Mermaid Rendering

After all code blocks are processed:
```javascript
if (typeof mermaid !== 'undefined') {
    mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
}
```

### Step 6: Add CSS

```css
.mermaid {
    background: transparent;
    text-align: center;
    padding: 1rem 0;
    margin: 1rem 0;
}
.mermaid svg {
    max-width: 100%;
    height: auto;
}
```

---

## Testing Plan

1. **Basic diagram**: Simple flowchart
   ```mermaid
   graph LR
       A --> B --> C
   ```

2. **Complex diagram**: Sequence diagram with styling
   ```mermaid
   sequenceDiagram
       Alice->>Bob: Hello
       Bob-->>Alice: Hi!
   ```

3. **Error case**: Invalid mermaid syntax (should show error message)

4. **Multiple diagrams**: Document with 3+ mermaid blocks

5. **Mixed content**: Mermaid + Python code blocks in same document

6. **Re-render**: Edit mermaid block and verify preview updates

---

## Potential Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| CSP blocks CDN script | Add CDN to CSP whitelist |
| Script not loaded yet | Check `typeof mermaid !== 'undefined'` |
| Invalid mermaid syntax | Mermaid shows built-in error message |
| Large diagrams overflow | CSS `max-width: 100%` |
| Performance with many diagrams | Not a concern for typical docs |
| Offline usage | Future: bundle mermaid.min.js locally |

---

## Files to Modify

- `src/previewPanel.ts` - Main changes (CSP, script, JS logic, CSS)

---

## Future Enhancements

- Bundle mermaid.js locally for offline support
- Add zoom/pan for large diagrams
- Support mermaid themes (dark/neutral/forest)
- Export diagram as PNG/SVG
