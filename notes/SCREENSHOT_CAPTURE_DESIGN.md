# Screenshot Capture Design for Svelte Components

> Design document exploring approaches for capturing screenshots of Svelte components rendered in iframes within VS Code webviews.

## Problem Statement

Svelte components in `.zef.md` files are compiled to standalone HTML documents and rendered inside sandboxed iframes (`<iframe sandbox="allow-scripts" srcdoc="...">`). We need a way to capture these rendered components as PNG/JPG images for documentation, sharing, or export.

### Constraints

1. **Nested Iframe Architecture**: Extension Host → Webview (iframe) → Component (iframe with srcdoc)
2. **Sandbox Restrictions**: The inner iframe has `sandbox="allow-scripts"` which limits cross-frame DOM access
3. **VS Code Webview Limitations**: Cannot use arbitrary browser APIs; must work within webview security model
4. **Bundle Size Concerns**: Adding large libraries increases load time for every preview

---

## Explored Approaches

| Approach | Viable? | Complexity | Fidelity | Bundle Impact |
|----------|---------|------------|----------|---------------|
| html2canvas from parent | ❌ No | Low | N/A | ~40KB |
| In-iframe html2canvas + postMessage | ✅ Yes | Medium | Good | ~40KB per component |
| Puppeteer/Playwright backend | ✅ Yes | High | Excellent | ~100MB (dev dep) |
| Canvas foreignObject | ❌ Partial | Medium | Poor | Minimal |

---

## Recommended Approach 1: In-iframe html2canvas with postMessage

### Overview

Inject html2canvas directly into the compiled Svelte component HTML. When a screenshot is requested, the parent webview sends a postMessage to the iframe, which captures its own DOM and sends the image data back.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  VS Code Extension                                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Webview (previewPanel)                       │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  iframe[srcdoc] - Svelte Component      │  │  │
│  │  │  • Compiled Svelte app                  │  │  │
│  │  │  • html2canvas.min.js (injected)        │  │  │
│  │  │  • Screenshot message listener          │  │  │
│  │  └───────────────────────────────────────┬─┘  │  │
│  │                                          │    │  │
│  │         postMessage('captureScreenshot') │    │  │
│  │                         ◄────────────────┘    │  │
│  │         postMessage('screenshotResult')       │  │
│  │                         ─────────────────►    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Modify `svelte-compiler/compiler.ts`

Inject html2canvas and message handler into the compiled HTML:

```typescript
// In compileSvelteClient(), update the HTML template:

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
    }
  </style>
  <script src="${html2canvasUri}"></script>
</head>
<body>
  <div id="app"></div>
  <script>
${bundledCode}
  </script>
  <script>
    // Screenshot capture API
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'captureScreenshot') {
        try {
          const canvas = await html2canvas(document.body, {
            backgroundColor: '#1e1e1e',
            scale: 2, // Retina quality
            logging: false,
            useCORS: true
          });
          
          const dataUrl = canvas.toDataURL('image/png');
          parent.postMessage({
            type: 'screenshotResult',
            blockId: event.data.blockId,
            success: true,
            dataUrl: dataUrl
          }, '*');
        } catch (error) {
          parent.postMessage({
            type: 'screenshotResult',
            blockId: event.data.blockId,
            success: false,
            error: error.message
          }, '*');
        }
      }
    });
  </script>
</body>
</html>`;
```

#### 2. Update `previewPanel.ts` - Add Screenshot Button

Add a screenshot button to the Svelte container tabs bar:

```typescript
// In the section that creates Svelte container tabs:

var screenshotBtn = document.createElement('button');
screenshotBtn.className = 'code-block-screenshot';
screenshotBtn.innerHTML = '📷';
screenshotBtn.title = 'Capture screenshot';
screenshotBtn.onclick = function() {
  var iframe = svelteContainer.querySelector('.svelte-preview-frame');
  if (iframe) {
    iframe.contentWindow.postMessage({
      type: 'captureScreenshot',
      blockId: currentBlockId
    }, '*');
  }
};
svelteTabsBar.appendChild(screenshotBtn);
```

#### 3. Handle Screenshot Response

```typescript
// Add message listener in webview script:

window.addEventListener('message', function(event) {
  var message = event.data;
  
  if (message.type === 'screenshotResult') {
    if (message.success) {
      // Option A: Copy to clipboard
      copyDataUrlToClipboard(message.dataUrl);
      
      // Option B: Send to extension for file save
      vscode.postMessage({
        type: 'saveScreenshot',
        blockId: message.blockId,
        dataUrl: message.dataUrl
      });
    } else {
      console.error('Screenshot failed:', message.error);
    }
  }
});

async function copyDataUrlToClipboard(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob })
  ]);
}
```

### Pros
- **Self-contained**: Everything happens in the browser, no external dependencies
- **Works within sandbox**: postMessage crosses sandbox boundaries
- **Moderate fidelity**: html2canvas handles most CSS correctly
- **User-friendly**: Immediate feedback, clipboard integration

### Cons
- **Bundle size**: html2canvas adds ~40KB to every compiled component
- **CSS limitations**: Some advanced CSS won't render (backdrop-filter, WebGL, etc.)
- **Font timing**: Fonts must be fully loaded before capture
- **Async complexity**: Need to handle loading states

### Mitigations
- Lazy-load html2canvas only when screenshot is first requested
- Add a brief delay (100ms) before capture to ensure fonts are loaded
- Document unsupported CSS features

---

## Recommended Approach 2: Puppeteer Backend Screenshot

### Overview

Use a headless browser (via Puppeteer or Playwright) in the extension's Node.js backend to load the compiled HTML and take a pixel-perfect screenshot.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  VS Code Extension                                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Extension Host (Node.js)                     │  │
│  │  ┌─────────────────────────────┐              │  │
│  │  │  screenshotService.ts       │              │  │
│  │  │  • Puppeteer instance       │              │  │
│  │  │  • page.setContent(html)    │              │  │
│  │  │  • page.screenshot()        │              │  │
│  │  └─────────────────────────────┘              │  │
│  │              ▲                                 │  │
│  │              │ postMessage                     │  │
│  │  ┌───────────┴─────────────────────────────┐  │  │
│  │  │  Webview (previewPanel)                 │  │  │
│  │  │  [Screenshot Button] ──────────────────►│  │  │
│  │  │                                         │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │  iframe - Svelte Component        │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Create `src/screenshotService.ts`

```typescript
import * as puppeteer from 'puppeteer-core';
import * as path from 'path';

let browser: puppeteer.Browser | null = null;

interface ScreenshotResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

/**
 * Get or launch the browser instance
 */
async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browser || !browser.isConnected()) {
    // Try to find Chrome/Chromium
    const executablePath = await findChrome();
    
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

/**
 * Find Chrome executable on the system
 */
async function findChrome(): Promise<string> {
  // Platform-specific paths
  const paths = {
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ],
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ]
  };
  
  const platform = process.platform as keyof typeof paths;
  const candidates = paths[platform] || paths.linux;
  
  for (const candidate of candidates) {
    if (require('fs').existsSync(candidate)) {
      return candidate;
    }
  }
  
  throw new Error('Chrome/Chromium not found. Please install Chrome.');
}

/**
 * Capture a screenshot of the given HTML
 */
export async function captureScreenshot(
  html: string, 
  options: { width?: number; height?: number; scale?: number } = {}
): Promise<ScreenshotResult> {
  const { width = 800, height = 600, scale = 2 } = options;
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    await page.setViewport({ 
      width, 
      height, 
      deviceScaleFactor: scale 
    });
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0' 
    });
    
    // Wait for any animations to settle
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)));
    
    // Get the actual content height
    const bodyHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });
    
    // Resize to fit content
    await page.setViewport({ 
      width, 
      height: Math.max(height, bodyHeight), 
      deviceScaleFactor: scale 
    });
    
    const buffer = await page.screenshot({ 
      type: 'png',
      fullPage: true,
      omitBackground: false
    });
    
    await page.close();
    
    return { success: true, buffer: buffer as Buffer };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || String(error) 
    };
  }
}

/**
 * Cleanup: close browser on extension deactivation
 */
export async function dispose() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

#### 2. Register Command in `extension.ts`

```typescript
import { captureScreenshot, dispose as disposeScreenshot } from './screenshotService';
import * as fs from 'fs';

// In activate():
context.subscriptions.push(
  vscode.commands.registerCommand('zef.screenshotComponent', async (html: string, blockId: number) => {
    const result = await captureScreenshot(html);
    
    if (result.success && result.buffer) {
      // Option 1: Save to file
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`component-${blockId}.png`),
        filters: { 'PNG Images': ['png'] }
      });
      
      if (uri) {
        fs.writeFileSync(uri.fsPath, result.buffer);
        vscode.window.showInformationMessage(`Screenshot saved to ${uri.fsPath}`);
      }
      
      // Option 2: Copy to clipboard (requires additional handling)
    } else {
      vscode.window.showErrorMessage(`Screenshot failed: ${result.error}`);
    }
  })
);

// In deactivate():
export function deactivate() {
  disposeScreenshot();
}
```

#### 3. Handle Message from Webview

```typescript
// In createPreviewPanel(), add to message handler:

case 'screenshotRequest':
  const html = message.html;
  const blockId = message.blockId;
  vscode.commands.executeCommand('zef.screenshotComponent', html, blockId);
  break;
```

### Pros
- **Pixel-perfect fidelity**: Real browser rendering, all CSS features work
- **Handles everything**: Fonts, animations, WebGL, backdrop-filter, etc.
- **No bundle bloat**: Screenshot logic is in backend, not in component HTML
- **Consistent results**: Same rendering engine for all captures

### Cons
- **Large dependency**: puppeteer-core is smaller, but still needs Chrome installed
- **Cold start latency**: First screenshot takes 1-2 seconds to launch browser
- **Memory usage**: Headless Chrome uses ~100-200MB RAM
- **Platform issues**: Chrome path detection varies by OS

### Mitigations
- Use `puppeteer-core` (no bundled Chromium) to reduce install size
- Keep browser instance alive between screenshots (lazy singleton)
- Add a loading indicator while screenshot is in progress
- Provide clear error message if Chrome isn't found
- Consider caching warm browser instance

---

## Recommendation

### For MVP / Quick Implementation: **Approach 1 (html2canvas)**

Lower complexity, no external dependencies, works today. Good enough for most components.

### For Production Quality: **Approach 2 (Puppeteer)**

Higher fidelity, handles edge cases, professional-quality output. Worth the additional setup for a polished product.

### Hybrid Approach

Could implement both:
1. Default to html2canvas for quick captures
2. Offer "High-quality screenshot" option that uses Puppeteer backend
3. Fall back to html2canvas if Chrome isn't available

---

## Open Questions

1. **Where should screenshots be saved?** 
   - Clipboard only?
   - File save dialog?
   - Adjacent to .zef.md file?
   - Configurable?

2. **What resolution/scale?**
   - 1x for web?
   - 2x for retina?
   - Configurable?

3. **Should we capture just the component or include container chrome?**

4. **How to handle interactive state?**
   - Capture current state?
   - Reset to initial state?

5. **Multiple components?**
   - Batch export all components in a file?
   - Individual capture only?

---

## Next Steps

1. Decide on initial approach (recommend html2canvas for MVP)
2. Add html2canvas to assets and update compiler
3. Implement screenshot button and message handling
4. Test with various component styles
5. Add clipboard copy functionality
6. Consider Puppeteer upgrade path for v2
