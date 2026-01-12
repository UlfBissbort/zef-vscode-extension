# Svelte Component Rendering Approaches for Zef

## Problem Statement
We want to render Svelte components in the Zef preview panel in a way that:
1. Shows the **actual component** as it would appear in a real app
2. Allows **interactive behavior** (clicks, state changes, animations)
3. Supports **future extensibility** (props from code blocks, component composition)

## Current Implementation: SSR
Currently we compile with `generate: 'server'` and render static HTML. This loses all interactivity.

---

## Approach 1: Client-Only Compilation (Recommended)

### How It Works
1. Compile with `generate: 'client'` instead of `'server'`
2. Output is a JavaScript module that exports a component class
3. Load in a sandboxed iframe with Svelte runtime
4. Use `mount()` to instantiate the component

### Implementation
```typescript
// Compile to client-side JS
const compiled = compile(source, {
  generate: 'client',  // <-- Client-side JS instead of SSR
  css: 'injected',
  name: 'Component'
});

// The output is JS that can be loaded as a module
// It imports from 'svelte/internal/client'
```

### Output to Iframe
```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    { "imports": { "svelte": "...", "svelte/internal/client": "..." } }
  </script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { mount } from 'svelte';
    // Inline the compiled component code here
    ${compiledCode}
    mount(Component, { target: document.getElementById('app') });
  </script>
</body>
</html>
```

### Pros
- ✅ Fully interactive components with state, events, transitions
- ✅ Simpler than SSR + hydration
- ✅ Components behave exactly as in production
- ✅ Supports lifecycle hooks (onMount, onDestroy)
- ✅ Supports animations and transitions

### Cons
- ❌ Requires bundled Svelte runtime (~40KB)
- ❌ Need to handle module resolution (importmap or bundled)
- ❌ Small delay before component renders (JS must execute)

### Svelte Runtime Options
1. **CDN**: Use esm.sh or unpkg for Svelte modules
2. **Bundled**: Include pre-bundled Svelte runtime in extension assets
3. **IIFE**: Bundle component + runtime into single IIFE script

---

## Approach 2: Custom Element Compilation

### How It Works
1. Compile with `customElement: true`
2. Output is a self-registering custom element
3. Just load the script and use `<my-component></my-component>`

### Implementation
```typescript
const compiled = compile(source, {
  customElement: true,
  css: 'injected',
  name: 'ZefComponent'
});
```

### Output to Iframe
```html
<!DOCTYPE html>
<html>
<body>
  <zef-component></zef-component>
  <script type="module">
    ${compiledCode}
  </script>
</body>
</html>
```

### Pros
- ✅ Self-contained, works in any HTML context
- ✅ Standard web platform API
- ✅ No need for explicit mount() call
- ✅ Good for component library documentation

### Cons
- ❌ Requires `<svelte:options tag="...">` in component or auto-generation
- ❌ Props handling is slightly different (attributes vs properties)
- ❌ Less commonly used pattern

---

## Approach 3: IIFE Bundle with Runtime

### How It Works
1. Compile to client-side JS
2. Bundle with Svelte runtime into single IIFE
3. Execute IIFE in iframe, no module system needed

### Implementation
```typescript
// Pre-compile a Svelte bundle that includes runtime
// This is done once at build time for the extension

// At runtime, inject component code into template
const iframeHtml = `
  <script>${svelteRuntimeBundle}</script>
  <script>
    ${transformedComponentCode}
    SvelteRuntime.mount(Component, { target: document.body });
  </script>
`;
```

### Pros
- ✅ No module system or importmap needed
- ✅ Works in strictest CSP environments
- ✅ Fast loading (single script)

### Cons
- ❌ Larger payload (includes full runtime each time)
- ❌ More complex build process
- ❌ Component code transformation is trickier

---

## Recommended Approach: Client Compilation with CDN

For Zef, I recommend **Approach 1 with CDN modules**:

1. Compile with `generate: 'client'`
2. Use esm.sh CDN for Svelte runtime in importmap
3. Transform compiled code to remove imports (inline them)
4. Render in iframe with module script

### Why?
- Simplest implementation
- Full interactivity
- CDN caching makes runtime load fast
- No bundling complexity

### Implementation Steps
1. Update `compiler.ts` to use `generate: 'client'`
2. Transform compiled code for browser execution
3. Update iframe HTML template with importmap
4. Handle CSS injection

---

## Future: Props from Code Blocks

Once client-side rendering works, we can add:
```markdown
```svelte-props
{
  "name": "World",
  "count": 42
}
```

```svelte
<script>
  export let name;
  export let count;
</script>
<p>Hello {name}! Count: {count}</p>
```
```

The compiler would extract props and pass to `mount()`:
```javascript
mount(Component, {
  target: document.getElementById('app'),
  props: { name: "World", count: 42 }
});
```
