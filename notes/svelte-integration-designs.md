# Svelte Component Integration - Design Options

## Goal

Integrate Svelte component blocks into the Zef VSCode extension. When a user writes a `\`\`\`svelte` code block, it should be compiled and rendered as an interactive component in the Zef preview panel.

**Key Requirements:**
1. **Pure function**: Svelte source in → HTML/component out
2. **Deterministic**: Same input always produces same output
3. **Interactive**: Components should respond to user interaction
4. **Isolated**: Components shouldn't interfere with each other or the preview panel

---

## Display Approach

### Step 1: Embedded Rendering
- Render component inside a fixed-width container matching code blocks
- Add horizontal scrollbar if content overflows
- Container dimensions: max-width of ~600px, flexible height

### Step 2 (Future): Expand Modal
- Add "Expand" button to component container
- Opens component in a full-screen modal overlay
- Better experience for larger/complex components

---

## Design 1: Node.js Child Process Compiler

### Overview
Run the Svelte compiler as a subprocess using Node.js, similar to how we run the Python kernel.

### Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Extension      │────▶│ svelte-compiler  │────▶│  Webview        │
│  (TypeScript)   │     │ (Node.js script) │     │  (iframe)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       │                        │                        │
       │ stdin: svelte source   │ stdout: JSON           │ srcdoc: HTML
       │                        │ {html, css, js}        │
```

### Implementation Steps

1. **Bundle Svelte compiler**
   - Add `svelte` to package.json dependencies
   - Create `svelte-compiler/compiler.js` script

2. **Compiler script interface**
   ```javascript
   // Input: Svelte component source via stdin
   // Output: JSON via stdout
   {
     "success": true,
     "html": "<div class=\"svelte-xyz\">...</div>",
     "css": ".svelte-xyz { ... }",
     "js": "function create_fragment(ctx) { ... }",
     "error": null
   }
   ```

3. **Two-phase compilation**
   - **SSR pass**: `compile(source, { generate: 'ssr' })` → HTML string
   - **Client pass**: `compile(source, { generate: 'client' })` → JS for hydration

4. **Extension integration**
   ```typescript
   // In extension code
   async function compileSvelte(source: string): Promise<SvelteResult> {
     const result = await runNode('svelte-compiler/compiler.js', source);
     return JSON.parse(result);
   }
   ```

5. **Webview embedding**
   - Create sandboxed iframe for each component
   - Set `srcdoc` to compiled HTML + CSS + minimal runtime

### Pros
- Familiar pattern (like Python kernel)
- Full Node.js environment
- Robust error handling

### Cons
- Requires Node.js on user's machine (usually available)
- Two compilation passes for interactivity
- Higher latency (~100-200ms per compile)
- Svelte runtime bundling needed for hydration

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Node not installed | Use VS Code's bundled Node |
| Version mismatch | Pin Svelte version in package.json |
| Subprocess crashes | Graceful error display in preview |

---

## Design 2: Bun-based Compilation

### Overview
Leverage Bun (already used for JS/TS execution) to compile and optionally execute Svelte components.

### Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Extension      │────▶│ svelte-executor  │────▶│  Webview        │
│  (TypeScript)   │     │ (Bun script)     │     │  (iframe)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
       │                        │                        │
       │ file: temp.svelte      │ stdout: JSON           │ srcdoc: HTML
       │                        │ {html, css}            │
```

### Implementation Steps

1. **Create Bun executor script**
   ```typescript
   // svelte-executor.ts (run with Bun)
   import { compile } from 'svelte/compiler';
   
   const source = await Bun.file(Bun.argv[2]).text();
   
   // Compile for SSR
   const result = compile(source, {
     generate: 'ssr',
     css: 'injected'
   });
   
   // Execute SSR to get HTML
   const Component = new Function('return ' + result.js.code)();
   const { html, css } = Component.render();
   
   console.log(JSON.stringify({ html, css: css.code }));
   ```

2. **Install Svelte for Bun**
   - User runs `bun add svelte` in workspace, OR
   - Extension provides pre-bundled svelte module

3. **Extension integration**
   ```typescript
   // Reuse existing Bun execution pattern
   async function compileSvelte(source: string): Promise<SvelteResult> {
     const tempFile = await writeTempFile(source, '.svelte');
     const result = await executeBun('svelte-executor.ts', [tempFile]);
     return JSON.parse(result.stdout);
   }
   ```

4. **Webview embedding**
   - Same as Design 1: sandboxed iframe with srcdoc

### Pros
- Consistent with existing JS/TS execution
- Bun is fast (~10ms compile time)
- Single script handles compile + SSR
- Simpler than Node approach

### Cons
- Requires Bun on user's machine (same as JS/TS blocks)
- Need to handle Svelte package installation
- SSR-only means no interactivity without additional hydration step

### Interactivity Enhancement

For full interactivity, add a second mode:
```typescript
// Generate both SSR (for initial HTML) and client (for interactivity)
const ssrResult = compile(source, { generate: 'ssr' });
const clientResult = compile(source, { generate: 'client', css: 'injected' });

// Return both
console.log(JSON.stringify({
  html: renderSSR(ssrResult),
  clientJs: clientResult.js.code,
  css: clientResult.css.code
}));
```

Webview then hydrates using the client bundle.

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Bun not installed | Fallback to Design 1 (Node) |
| Svelte not installed | Bundle with extension or prompt user |
| SSR execution fails | Display error in component area |

---

## Design 3: In-Browser Compilation

### Overview
Compile and run Svelte components directly in the webview using the browser-compatible Svelte compiler. No subprocess needed.

### Architecture
```
┌─────────────────┐     ┌──────────────────────────────────────────┐
│  Extension      │────▶│           Webview                        │
│  (TypeScript)   │     │  ┌──────────────┐  ┌──────────────────┐  │
└─────────────────┘     │  │ Svelte       │  │ Sandboxed iframe │  │
       │                │  │ Compiler     │─▶│ (component runs) │  │
       │ message:       │  │ (bundled JS) │  │                  │  │
       │ svelte source  │  └──────────────┘  └──────────────────┘  │
                        └──────────────────────────────────────────┘
```

### Implementation Steps

1. **Bundle Svelte compiler with extension**
   ```bash
   # Download browser-compatible Svelte compiler
   curl -o assets/svelte-compiler.js "https://esm.sh/svelte/compiler?bundle"
   # Or use esbuild to bundle
   ```
   - File size: ~300-500KB

2. **Load compiler in webview**
   ```html
   <script src="${svelteCompilerUri}"></script>
   <script>
     // Compiler is available as globalThis.svelte
   </script>
   ```

3. **Compile on-demand in webview JS**
   ```javascript
   function compileSvelteComponent(source, containerId) {
     try {
       const compiled = svelte.compile(source, {
         generate: 'dom',
         css: 'injected',
         name: 'Component'
       });
       
       // Create component in sandboxed iframe
       const iframe = document.createElement('iframe');
       iframe.sandbox = 'allow-scripts';
       iframe.srcdoc = `
         <!DOCTYPE html>
         <html>
         <head><style>${compiled.css.code}</style></head>
         <body>
           <div id="app"></div>
           <script type="module">
             ${compiled.js.code}
             new Component({ target: document.getElementById('app') });
           </script>
         </body>
         </html>
       `;
       
       document.getElementById(containerId).appendChild(iframe);
     } catch (error) {
       // Display error
     }
   }
   ```

4. **Trigger compilation when Svelte block detected**
   ```javascript
   // In webview JS, after DOM ready
   document.querySelectorAll('pre[data-lang="svelte"]').forEach((pre, idx) => {
     const source = pre.textContent;
     const containerId = 'svelte-' + idx;
     // Create container, compile, mount
   });
   ```

### Pros
- **No subprocess latency**: Instant compilation
- **Full interactivity**: Components run natively in DOM
- **No external dependencies**: Everything bundled
- **Works offline**: No CDN needed

### Cons
- **Bundle size**: ~500KB added to extension
- **Security**: eval() of compiled code (mitigated by iframe sandbox)
- **CSP concerns**: May need to adjust Content Security Policy

### Security Model

Each component runs in a sandboxed iframe:
```html
<iframe 
  sandbox="allow-scripts"
  srcdoc="..."
></iframe>
```

- `allow-scripts`: Let component JS run
- NO `allow-same-origin`: Prevents access to parent window
- NO `allow-top-navigation`: Can't navigate parent

Components are fully isolated. Even malicious code can't escape the sandbox.

### Styling Considerations

Iframe content needs to match Zef theme:
```javascript
const srcdoc = `
  <style>
    :root {
      --bg: #0a0a0a;
      --text: #fafafa;
      color-scheme: dark;
    }
    body {
      margin: 0;
      padding: 16px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
  </style>
  ${compiled.css.code}
  ...
`;
```

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| CSP blocks eval | Use blob URLs instead of inline scripts |
| Large bundle | Lazy-load compiler only when Svelte block exists |
| Iframe sizing | Use ResizeObserver to auto-size iframe height |

---

## Comparison Summary

| Aspect | Design 1 (Node.js) | Design 2 (Bun) | Design 3 (Browser) |
|--------|-------------------|----------------|---------------------|
| **Subprocess** | Yes | Yes | No |
| **Dependencies** | Node.js | Bun | None (bundled) |
| **Latency** | ~100-200ms | ~10-50ms | ~5-20ms |
| **Interactivity** | Hydration needed | Hydration needed | Native |
| **Offline** | Yes | Yes | Yes |
| **Bundle size** | +3MB | +3MB | +500KB |
| **Security** | Subprocess isolation | Subprocess isolation | Iframe sandbox |
| **Complexity** | High | Medium | Low-Medium |
| **Consistency** | Different from Mermaid | Matches JS/TS pattern | Matches Mermaid pattern |

---

## Recommendation

**Design 3 (In-Browser Compilation)** is recommended for initial implementation:

1. **Simplest integration**: Follows the same pattern as Mermaid (browser-side rendering)
2. **Fastest**: No subprocess overhead
3. **Full interactivity**: Components just work
4. **Smallest footprint**: ~500KB vs 3MB
5. **Secure**: Iframe sandbox provides strong isolation

### Migration Path
1. Start with Design 3 (browser-based)
2. If performance issues arise with complex components, add Design 2 (Bun) as optional backend
3. Design 1 (Node) as fallback for users without Bun

---

## Implementation Checklist

### Design 3 Implementation

- [ ] Download/bundle Svelte compiler (~500KB)
- [ ] Add compiler loading to webview HTML
- [ ] Detect `svelte` code blocks in preprocessing
- [ ] Create tabbed container: "Component" | "Source Code"
- [ ] Compile source in browser JS
- [ ] Create sandboxed iframe with compiled output
- [ ] Add dark theme base styles to iframe
- [ ] Handle compilation errors (display in component area)
- [ ] Add ResizeObserver for dynamic iframe height
- [ ] Test with sample components
