# LaTeX/Math Equation Rendering Implementation Plan

## Overview

Add LaTeX math equation rendering to Zef markdown preview, supporting both inline (`$...$`) and block (`$$...$$`) equations using the same syntax as Obsidian and standard academic markdown.

## Research Findings

### Obsidian Syntax (Standard)
- **Inline equations**: `$e^{2i\pi} = 1$` → renders inline with text
- **Display/Block equations**: `$$\begin{vmatrix}a & b\\ c & d\end{vmatrix}=ad-bc$$` → renders centered on its own line
- Alternative LaTeX delimiters: `\(...\)` for inline, `\[...\]` for display (optional)

### Reference Implementation Analysis (blog-page.html)
The reference uses **KaTeX** with auto-render:
- CSS from CDN: `katex@0.16.9/dist/katex.min.css`
- JS: `katex.min.js` + `contrib/auto-render.min.js`
- Initialization: `renderMathInElement(document.body, { delimiters: [...] })`

---

## Options Analysis

### Option A: KaTeX (Recommended)
**Pros:**
- Fast rendering (much faster than MathJax)
- Smaller bundle size (~200KB CSS+JS)
- High-quality typesetting
- Same library used in reference implementation
- Auto-render extension handles delimiter detection

**Cons:**
- Fewer LaTeX commands supported than MathJax (but covers 95%+ of common use)
- Need to bundle or load from CDN

### Option B: MathJax
**Pros:**
- Most complete LaTeX support
- Industry standard

**Cons:**
- Slower rendering
- Larger bundle (~2MB+)
- More complex configuration
- Overkill for most use cases

### Decision: **KaTeX** 
Reason: Faster, lighter, sufficient for typical documentation/notes. Same as reference.

---

## Implementation Options

### Option 1: CDN Loading (Simplest)
Load KaTeX from CDN at runtime.

**Pros:**
- No bundling needed
- Always latest version
- Minimal extension size increase

**Cons:**
- Requires internet connection
- Slight delay on first load

### Option 2: Bundle Locally (Most Robust)
Bundle KaTeX files in extension's `assets/` folder (like mermaid.min.js).

**Pros:**
- Works offline
- Consistent version
- No CDN dependency

**Cons:**
- Increases extension size (~200KB)
- Need to manually update

### Decision: **Option 2 - Bundle Locally**
Reason: Consistency with mermaid.js approach, offline support, user experience.

---

## Detailed Implementation Strategy

### Step 1: Add KaTeX Assets
- Download `katex.min.js` (~100KB) to `assets/katex.min.js`
- Download `katex.min.css` (~20KB) to `assets/katex.min.css`
- Download `auto-render.min.js` (~5KB) to `assets/katex-auto-render.min.js`
- Download `fonts/` folder to `assets/fonts/` (needed by KaTeX CSS)

### Step 2: Update previewPanel.ts - Asset URIs
In `createPreviewPanel()` (~line 107), the extension assets folder is already configured for mermaid:
```typescript
const extensionAssetsUri = vscode.Uri.file(path.join(context.extensionPath, 'assets'));
localResourceRoots.push(extensionAssetsUri);
```

In `updatePreview()` (~line 225), add KaTeX URIs similar to mermaid:
```typescript
let katexCssUri = '';
let katexJsUri = '';
let katexAutoRenderUri = '';
if (extensionPath) {
    katexCssUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionPath, 'assets', 'katex.min.css'))
    ).toString();
    katexJsUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionPath, 'assets', 'katex.min.js'))
    ).toString();
    katexAutoRenderUri = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(extensionPath, 'assets', 'katex-auto-render.min.js'))
    ).toString();
}
```

### Step 3: Update getWebviewContent() Function
Pass the new URIs to the function and:

1. **Add CSS link in `<head>`:**
```html
<link rel="stylesheet" href="${katexCssUri}">
```

2. **Add CSS overrides for dark theme styling** (matching reference):
```css
.katex-display {
    margin: 2em 0;
    overflow-x: auto;
    overflow-y: hidden;
    text-align: center;
}

.katex {
    font-size: 1.1em;
    color: inherit;
}

.katex-display .katex {
    font-size: 1.21em;
}
```

3. **Add JS scripts before closing `</body>`:**
```html
<script defer src="${katexJsUri}"></script>
<script defer src="${katexAutoRenderUri}"></script>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        if (typeof renderMathInElement !== 'undefined') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ],
                throwOnError: false,
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
            });
        }
    });
</script>
```

### Step 4: Handle Code Block Conflicts
**Critical Issue:** Math delimiters should NOT be processed inside:
- `<code>` blocks (inline code)
- `<pre>` blocks (code blocks)
- Mermaid diagrams

**Solution:** The `ignoredTags` option in auto-render handles this:
```javascript
ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
```

### Step 5: Font Path Handling
KaTeX CSS references fonts relatively. Since we're bundling, we need to ensure fonts are accessible.

**Options:**
1. Copy fonts to `assets/fonts/` and CSS will find them (same relative path)
2. Use a modified CSS with absolute font paths

**Decision:** Option 1 - copy fonts preserving structure.

---

## Iteration 1: Critical Review

### Can this be simplified?
- ✅ Using auto-render is already the simplest approach (no manual parsing)
- ✅ Bundling locally is simpler than CDN fallback logic
- ⚠️ Could skip `\(...\)` and `\[...\]` delimiters, but they're standard LaTeX and cost nothing

### Will it work?
- ✅ Same pattern as mermaid.js which works
- ✅ auto-render is designed exactly for this use case
- ⚠️ Font paths need verification after bundling
- ⚠️ Need to ensure scripts load in correct order (defer should handle this)

### Does it solve the problem?
- ✅ Inline `$...$` equations: Yes
- ✅ Block `$$...$$` equations: Yes
- ✅ Obsidian-compatible syntax: Yes
- ✅ Dark theme styling: Yes (with CSS overrides)

### What could go wrong?
1. **Font loading fails** → Equations render with wrong fonts
   - Mitigation: Verify font paths; test with fallback fonts
2. **Script timing issues** → Math not rendered on first load
   - Mitigation: Use DOMContentLoaded; add retry logic if needed
3. **Escaping issues** → `$` in code gets processed as math
   - Mitigation: `ignoredTags` handles `<pre>` and `<code>`
4. **Performance with many equations** → Slow preview updates
   - Mitigation: KaTeX is fast; monitor and optimize if needed
5. **Conflicts with markdown parser** → `$` interferes with parsing
   - Mitigation: auto-render runs AFTER markdown→HTML, so no conflict

---

## Iteration 2: Refined Analysis

### Font Path Issue - Deeper Look
KaTeX CSS has entries like:
```css
@font-face {
    font-family: KaTeX_Main;
    src: url(fonts/KaTeX_Main-Regular.woff2) format('woff2');
}
```

When CSS is loaded via webview URI, the relative path `fonts/` needs to resolve correctly.

**Test Plan:**
1. Bundle with structure: `assets/katex.min.css` and `assets/fonts/*.woff2`
2. Verify CSS loads fonts correctly in webview
3. If fails, create modified CSS with absolute webview URIs for fonts

### Script Loading Order
Using `defer` ensures scripts load after HTML parsing but before DOMContentLoaded.
Order: katex.min.js → auto-render.min.js → our init script

This should work because:
- `defer` scripts execute in order
- Our init runs on DOMContentLoaded, after all deferred scripts

### Edge Cases
1. **Single `$` not as math** (e.g., "costs $5")
   - KaTeX auto-render requires matching pairs; lone `$` ignored
   - But `$5$` would render as math (number 5)
   - Obsidian has same behavior - acceptable

2. **Nested delimiters** (e.g., `$$x = $inner$$$`)
   - auto-render handles this correctly
   - Outer delimiter wins

3. **Escaped delimiters** (`\$`)
   - User can escape with `\$` to prevent math rendering

---

## Final Implementation Plan

### Files to Create/Modify

#### 1. Download KaTeX Assets
```bash
# In assets/ directory:
curl -o katex.min.js https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js
curl -o katex.min.css https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css  
curl -o katex-auto-render.min.js https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js

# Create fonts directory and download all fonts
mkdir -p fonts
# Download woff2 files from https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/fonts/
```

#### 2. Modify `previewPanel.ts`

**A. Update `updatePreview()` function (~line 225)**
- Add KaTeX CSS and JS URI generation (similar to mermaid)

**B. Update `getWebviewContent()` function signature (~line 461)**
- Add parameters: `katexCssUri`, `katexJsUri`, `katexAutoRenderUri`

**C. Add to HTML `<head>`:**
- Link to KaTeX CSS

**D. Add CSS styling for math blocks**
- `.katex-display` margin and overflow styles
- `.katex` font-size adjustments for dark theme

**E. Add scripts before `</body>`:**
- Load KaTeX JS files
- Initialize auto-render on DOMContentLoaded

---

## Testing Plan

### Unit Tests
1. Inline equation: `$E = mc^2$` renders inline
2. Block equation: `$$\int_0^1 x^2 dx$$` renders centered
3. Complex equation: Matrix, fractions, Greek letters
4. Code block: `$x$` inside code block NOT rendered as math
5. Mermaid: Math delimiters in mermaid NOT affected

### Visual Tests
1. Font rendering looks correct (not fallback fonts)
2. Dark theme colors match rest of preview
3. Long equations scroll horizontally (no overflow)
4. Spacing between equation and surrounding text

### Edge Cases
1. Single `$` in text (price "$5") - should NOT break
2. Empty delimiters `$$$$` - should not crash
3. Invalid LaTeX `$\invalidcommand$` - should show error gracefully
4. Mixed inline and block on same line

---

## Uncertainties and Risks

### Medium Risk: Font Loading
- **Uncertainty:** Whether relative font paths work in webview
- **Test:** Try rendering a simple equation after bundling
- **Fallback:** Modify CSS to use absolute webview URIs

### Low Risk: Performance
- **Uncertainty:** Impact on large documents with many equations
- **Test:** Create document with 50+ equations
- **Fallback:** Debounce re-rendering if needed

### Low Risk: Markdown Parser Interaction
- **Uncertainty:** Whether marked.js affects `$` characters
- **Test:** Verify `$...$` survives markdown parsing
- **Fallback:** Pre-process to protect math, post-process to restore

---

## Success Criteria

1. ✅ `$...$` renders inline math (Obsidian-compatible)
2. ✅ `$$...$$` renders display math (Obsidian-compatible)
3. ✅ Math inside code blocks is NOT rendered
4. ✅ Fonts load correctly (not system fallbacks)
5. ✅ Dark theme styling matches Zef aesthetic
6. ✅ Works offline (no CDN dependency)
7. ✅ Extension size increase < 500KB

---

## Estimated Effort

- Download and bundle KaTeX: 15 min
- Modify previewPanel.ts: 30 min
- Testing and debugging: 30 min
- **Total: ~1.5 hours**
