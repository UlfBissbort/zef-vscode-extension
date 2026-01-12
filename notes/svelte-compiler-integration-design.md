# Svelte Compiler Integration - Final Design

## Overview

Integrate Svelte component compilation using Bun and the Svelte compiler. Users can write `\`\`\`svelte` blocks, click "Compile", and see rendered HTML in the preview. Compiled output is stored in the markdown file for reproducibility.

---

## Architecture

```
┌──────────────────┐     ┌────────────────────────┐     ┌───────────────────┐
│  VS Code         │────▶│ svelte-compiler.ts     │────▶│  Output           │
│  Extension       │     │ (Bun script)           │     │                   │
└──────────────────┘     └────────────────────────┘     │  • MD: ````html   │
       │                          │                     │  • Preview iframe │
       │ stdin: svelte source     │ stdout: JSON        │  • Compile time   │
       └──────────────────────────┘                     └───────────────────┘
```

---

## User Experience

### Markdown File Structure
```markdown
Some prose...

```svelte
<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Clicked {count} times
</button>

<style>
  button { color: #98c379; }
</style>
```

````rendered-html
<style>button { color: #98c379; }</style>
<button>Clicked 0 times</button>
````

More prose...
```

### Preview Panel UI

**Tab structure:**
```
[Rendered] [Source Code]                    ⏱ 12.5ms   [Compile]   Svelte
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   ┌────────────────────────────┐                                        │
│   │  Clicked 0 times           │  (rendered in sandboxed iframe)        │
│   └────────────────────────────┘                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- **Tabs:** "Rendered" (default, shows component) | "Source Code" (shows svelte code)
- **Compile Time:** Green text showing "⏱ 12.5ms" (updates after each compile)
- **Compile Button:** Green button similar to "Run" for code blocks
- **Language Indicator:** "Svelte" aligned right

---

## Implementation

### 1. Svelte Compiler Script (`svelte-compiler/compiler.ts`)

```typescript
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';

interface CompileResult {
  success: boolean;
  html?: string;
  error?: string;
  compileTime: string;
}

async function main() {
  const source = await Bun.stdin.text();
  const overallStart = performance.now();
  
  try {
    // Compile to SSR
    const compileStart = performance.now();
    const compiled = compile(source, {
      generate: 'server',
      css: 'injected',
      name: 'Component'
    });
    const compileEnd = performance.now();
    
    // Write to temp file for dynamic import
    const tempPath = `/tmp/svelte-component-${Date.now()}.js`;
    await Bun.write(tempPath, compiled.js.code);
    
    try {
      // Import and render
      const Component = await import(tempPath);
      const { html, css } = render(Component.default || Component);
      
      // Combine CSS and HTML
      const fullHtml = css?.code 
        ? `<style>${css.code}</style>\n${html}` 
        : html;
      
      const result: CompileResult = {
        success: true,
        html: fullHtml,
        compileTime: (compileEnd - compileStart).toFixed(2)
      };
      
      console.log(JSON.stringify(result));
    } finally {
      // Cleanup temp file
      await Bun.file(tempPath).exists() && await Bun.$`rm ${tempPath}`;
    }
    
  } catch (error: any) {
    const result: CompileResult = {
      success: false,
      error: error.message,
      compileTime: '0'
    };
    console.log(JSON.stringify(result));
  }
}

main();
```

### 2. Code Block Parser Updates (`codeBlockParser.ts`)

```typescript
// Update regex to include svelte
const regex = /```(python|rust|javascript|js|typescript|ts|svelte)\s*\n([\s\S]*?)```/g;

// In CodeBlock interface, add:
interface CodeBlock {
  // ... existing fields
  renderedHtmlRange?: vscode.Range;
  renderedHtmlContent?: string;
}

// After finding svelte block, look for rendered-html
if (language === 'svelte') {
  const afterBlock = text.slice(endOffset);
  const renderedMatch = afterBlock.match(/^\s*\n````rendered-html\s*\n([\s\S]*?)````/);
  if (renderedMatch) {
    const startOffset = endOffset + renderedMatch.index!;
    const endOffset = startOffset + renderedMatch[0].length;
    block.renderedHtmlRange = new vscode.Range(
      document.positionAt(startOffset),
      document.positionAt(endOffset)
    );
    block.renderedHtmlContent = renderedMatch[1].trim();
  }
}
```

### 3. Extension Updates (`extension.ts`)

```typescript
// Add svelte compilation handler
async function compileSvelte(
  code: string, 
  blockId: number, 
  documentUri: vscode.Uri
) {
  const startTime = Date.now();
  
  // Run Bun compiler script
  const extensionPath = context.extensionPath;
  const compilerScript = path.join(extensionPath, 'svelte-compiler', 'compiler.ts');
  
  const result = await runBunScript(compilerScript, code);
  
  if (result.success) {
    // Write rendered-html block back to document
    await updateRenderedHtmlBlock(documentUri, blockId, result.html);
    
    // Update preview with result
    sendSvelteResult(blockId, {
      html: result.html,
      compileTime: result.compileTime
    });
  } else {
    // Show error in preview
    sendSvelteError(blockId, result.error);
  }
}

// Function to update/insert rendered-html block in document
async function updateRenderedHtmlBlock(
  documentUri: vscode.Uri, 
  blockId: number, 
  html: string
) {
  const document = await vscode.workspace.openTextDocument(documentUri);
  const blocks = findCodeBlocks(document);
  const svelteBlock = blocks.find(b => b.blockId === blockId && b.language === 'svelte');
  
  if (!svelteBlock) return;
  
  const edit = new vscode.WorkspaceEdit();
  const renderedBlock = `\n\n\`\`\`\`rendered-html\n${html}\n\`\`\`\``;
  
  if (svelteBlock.renderedHtmlRange) {
    // Replace existing
    edit.replace(documentUri, svelteBlock.renderedHtmlRange, renderedBlock);
  } else {
    // Insert after svelte block
    const insertPosition = svelteBlock.range.end;
    edit.insert(documentUri, insertPosition, renderedBlock);
  }
  
  await vscode.workspace.applyEdit(edit);
}
```

### 4. Preview Panel Updates (`previewPanel.ts`)

#### CSS Additions
```css
/* Svelte compile time display */
.compile-time {
  font-size: 0.65rem;
  color: #98c379;
  margin-left: auto;
  margin-right: 8px;
  opacity: 0.8;
}

/* Svelte compile button */
.code-block-compile {
  padding: 4px 12px;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: #61afef;
  background: rgba(97, 175, 239, 0.1);
  border: 1px solid rgba(97, 175, 239, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;
}

.code-block-compile:hover {
  background: rgba(97, 175, 239, 0.2);
  border-color: rgba(97, 175, 239, 0.5);
}

/* Rendered iframe container */
.svelte-rendered-iframe {
  width: 100%;
  border: none;
  min-height: 100px;
  background: transparent;
}
```

#### JavaScript Updates
```javascript
// Handle svelte blocks
if (lang === 'svelte') {
  // Create container with tabs
  var svelteContainer = document.createElement('div');
  svelteContainer.className = 'code-block-container svelte-container';
  svelteContainer.setAttribute('data-block-id', currentBlockId);
  
  // Create tabs bar
  var svelteTabsBar = document.createElement('div');
  svelteTabsBar.className = 'code-block-tabs';
  
  // Tabs: Rendered | Source Code
  var svelteTabs = ['Rendered', 'Source Code'];
  // ... tab creation code (similar to mermaid)
  
  // Compile time display (initially hidden)
  var compileTimeDisplay = document.createElement('span');
  compileTimeDisplay.className = 'compile-time';
  compileTimeDisplay.id = 'compile-time-' + currentBlockId;
  compileTimeDisplay.style.display = 'none';
  svelteTabsBar.appendChild(compileTimeDisplay);
  
  // Compile button
  var compileBtn = document.createElement('button');
  compileBtn.className = 'code-block-compile';
  compileBtn.id = 'compile-btn-' + currentBlockId;
  compileBtn.innerHTML = '▶ Compile';
  compileBtn.onclick = function() {
    compileBtn.innerHTML = 'Compiling...';
    vscode.postMessage({
      type: 'compileSvelte',
      code: codeContent,
      blockId: currentBlockId
    });
  };
  svelteTabsBar.appendChild(compileBtn);
  
  // Language indicator
  var svelteLangIndicator = document.createElement('div');
  svelteLangIndicator.className = 'code-block-lang';
  svelteLangIndicator.textContent = 'Svelte';
  svelteTabsBar.appendChild(svelteLangIndicator);
  
  // Rendered content (iframe)
  var renderedContent = document.createElement('div');
  renderedContent.className = 'code-block-content svelte-rendered active';
  renderedContent.id = 'svelte-rendered-' + currentBlockId;
  
  if (existingRenderedHtml) {
    var iframe = createSvelteIframe(existingRenderedHtml);
    renderedContent.appendChild(iframe);
  } else {
    renderedContent.innerHTML = '<span style="color: var(--text-dim);">Click Compile to render component</span>';
  }
  
  // Source code content
  var sourceContent = document.createElement('div');
  sourceContent.className = 'code-block-content svelte-source-code';
  // ... copy the pre element
  
  // Assemble
  // ...
}

// Helper: Create sandboxed iframe for Svelte component
function createSvelteIframe(html) {
  var iframe = document.createElement('iframe');
  iframe.className = 'svelte-rendered-iframe';
  iframe.sandbox = 'allow-scripts';
  iframe.srcdoc = '<!DOCTYPE html><html><head><style>' +
    'body { margin: 0; padding: 16px; background: #0a0a0a; color: #fafafa; ' +
    'font-family: -apple-system, BlinkMacSystemFont, sans-serif; }' +
    '</style></head><body>' + html + '</body></html>';
  
  // Auto-resize iframe to content height
  iframe.onload = function() {
    try {
      iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
    } catch(e) {}
  };
  
  return iframe;
}

// Handle compile result message
window.addEventListener('message', function(event) {
  var message = event.data;
  
  if (message.type === 'svelteResult') {
    var blockId = message.blockId;
    
    // Update compile button
    var compileBtn = document.getElementById('compile-btn-' + blockId);
    if (compileBtn) {
      compileBtn.innerHTML = '▶ Compile';
    }
    
    // Show compile time
    var compileTimeDisplay = document.getElementById('compile-time-' + blockId);
    if (compileTimeDisplay) {
      compileTimeDisplay.textContent = '⏱ ' + message.compileTime + 'ms';
      compileTimeDisplay.style.display = 'block';
    }
    
    // Update rendered content
    var renderedContent = document.getElementById('svelte-rendered-' + blockId);
    if (renderedContent) {
      renderedContent.innerHTML = '';
      var iframe = createSvelteIframe(message.html);
      renderedContent.appendChild(iframe);
    }
  }
  
  if (message.type === 'svelteError') {
    var blockId = message.blockId;
    
    var compileBtn = document.getElementById('compile-btn-' + blockId);
    if (compileBtn) {
      compileBtn.innerHTML = '▶ Compile';
    }
    
    var renderedContent = document.getElementById('svelte-rendered-' + blockId);
    if (renderedContent) {
      renderedContent.innerHTML = '<span style="color: #e06c75;">Error: ' + 
        escapeHtml(message.error) + '</span>';
    }
  }
});
```

---

## Dependencies

### Required
- **Bun**: Already required for JS/TS execution
- **Svelte**: npm package (`svelte`) for compiler

### Svelte Installation Options

**Option A: Require in user's project**
```bash
# User runs in their project
bun add svelte
```

**Option B: Bundle with extension**
- Download svelte package to `assets/svelte/`
- Set `NODE_PATH` or use bundler

**Recommendation:** Option A for now (simpler). Document requirement clearly.

---

## File Changes Summary

| File | Changes |
|------|---------|
| `svelte-compiler/compiler.ts` | **NEW** - Bun script for compilation |
| `codeBlockParser.ts` | Add svelte to regex, parse rendered-html blocks |
| `extension.ts` | Add `compileSvelte()`, `updateRenderedHtmlBlock()` |
| `previewPanel.ts` | Add svelte block UI, compile button, iframe rendering |
| `package.json` | Add svelte compile command? (optional) |

---

## Testing Checklist

- [ ] Basic component compiles and renders
- [ ] Component with `<style>` block
- [ ] Component with `<script>` and reactivity (static render)
- [ ] Compile error handling
- [ ] Compile time display
- [ ] Existing rendered-html block updates on recompile
- [ ] Missing rendered-html block gets inserted
- [ ] Multiple svelte blocks in same document
- [ ] Large component output

---

## Future Enhancements

1. **Interactivity**: Use client-side compilation for live components
2. **Expand Modal**: Full-screen view for complex components
3. **Props Support**: Pass props to components
4. **Hot Reload**: Auto-recompile on source change
5. **Svelte 5 Runes**: Support modern Svelte syntax
