# Svelte Component Props Design

**Goal**: Allow static JSON-like data to be passed as props to Svelte components in `.zef.md` files, enabling data-driven component specialization.

---

## Background

### Current Architecture

Svelte components in `.zef.md` files are currently self-contained:

```markdown
```svelte
<script>
  // Data is defined inline
  let items = $state(['Task 1', 'Task 2']);
</script>
{#each items as item}<p>{item}</p>{/each}
` ` `
```

The compilation flow:
1. User writes Svelte code in ` ```svelte ` block
2. User clicks "Compile" button
3. `extension.ts` → `svelteExecutor.ts` → `compiler.ts`
4. Compiler generates entry code: `mount(Component, { target })`
5. Result HTML embedded in iframe

**Key insight**: The `mount()` call passes no props. This is where external data would be injected.

### Desired Capability

```markdown
Provide props somehow: { items: ['A', 'B', 'C'] }

```svelte
<script>
  let { items } = $props();  // Svelte 5 props rune
</script>
{#each items as item}<p>{item}</p>{/each}
` ` `
```

---

## Design 1: Props Frontmatter Block (Recommended)

### Overview

Add a dedicated `props` code block that defines JSON/YAML data for the following Svelte component.

### Syntax

```markdown
```props id="myData"
{
  "items": [
    {"name": "Task 1", "done": false},
    {"name": "Task 2", "done": true}
  ],
  "title": "My Todo List",
  "maxItems": 10
}
` ` `

```svelte props="myData"
<script>
  let { items, title, maxItems } = $props();
</script>
<h1>{title}</h1>
{#each items as item}
  <p class:done={item.done}>{item.name}</p>
{/each}
` ` `
```

### Key Features

1. **Explicit linking**: Props block has `id`, Svelte block references via `props` attribute
2. **Valid JSON/YAML**: Syntax highlighting and validation
3. **Visible data**: Data is clearly displayed in the document
4. **Reusable**: Multiple Svelte blocks can reference same props

### Implementation Plan

#### 1. Parser Modifications (`codeBlockParser.ts`)

```typescript
interface PropsBlock {
  id: string;
  content: string;
  parsed: Record<string, unknown>;
  line: number;
}

interface CodeBlock {
  // existing fields...
  propsId?: string;  // Reference to props block
}

// Add to parsing logic
function parsePropsBlocks(markdown: string): Map<string, PropsBlock> {
  const propsRegex = /```props\s+id=["'](\w+)["']\s*\n([\s\S]*?)```/g;
  const propsMap = new Map<string, PropsBlock>();
  
  let match;
  while ((match = propsRegex.exec(markdown)) !== null) {
    const id = match[1];
    const content = match[2].trim();
    try {
      const parsed = JSON.parse(content);
      propsMap.set(id, { id, content, parsed, line: /* calculate */ });
    } catch (e) {
      // Store error for display
      propsMap.set(id, { id, content, parsed: {}, line: 0, error: e.message });
    }
  }
  return propsMap;
}

// Modify svelte block parsing
function parseSvelteBlock(/* ... */): CodeBlock {
  // Extract props="..." attribute from fence
  const propsMatch = fence.match(/props=["'](\w+)["']/);
  return {
    // existing fields...
    propsId: propsMatch?.[1]
  };
}
```

#### 2. Executor Modifications (`svelteExecutor.ts`)

```typescript
export async function compileSvelteComponent(
  svelteSource: string,
  extensionPath: string,
  props?: Record<string, unknown>  // NEW parameter
): Promise<SvelteCompileResult> {
  // ...
  
  return new Promise((resolve) => {
    const proc = spawn(bunPath, ['run', compilerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Write source AND props to stdin
    const input = JSON.stringify({
      source: svelteSource,
      props: props ?? {}
    });
    proc.stdin.write(input);
    proc.stdin.end();
    
    // ... rest unchanged
  });
}
```

#### 3. Compiler Modifications (`svelte-compiler/compiler.ts`)

```typescript
interface CompilerInput {
  source: string;
  props: Record<string, unknown>;
}

async function compileSvelteClient(input: CompilerInput): Promise<CompileResult> {
  const { source, props } = input;
  
  // ... compilation unchanged ...
  
  // Modified entry code with props
  const propsJson = JSON.stringify(props);
  const entryCode = `
import { mount } from 'svelte';
import Component from './${tempId}.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  const target = document.getElementById('app') || document.body;
  const props = ${propsJson};
  mount(Component, { target, props });
}
`;
  // ... rest unchanged
}

async function main() {
  const rawInput = await Bun.stdin.text();
  
  let input: CompilerInput;
  try {
    input = JSON.parse(rawInput);
  } catch {
    // Backwards compatibility: treat as raw source
    input = { source: rawInput, props: {} };
  }
  
  const result = await compileSvelteClient(input);
  console.log(JSON.stringify(result));
}
```

#### 4. Extension Coordination (`extension.ts`)

```typescript
async function compileSvelteBlock(
  context: vscode.ExtensionContext, 
  code: string, 
  blockId?: number,
  props?: Record<string, unknown>  // NEW
): Promise<void> {
  try {
    const result = await compileSvelteComponent(code, context.extensionPath, props);
    // ... rest unchanged
  }
}

// In the run handler
setOnRunCode(async (code, blockId, language) => {
  if (language === 'svelte') {
    // Look up props by reference
    const propsId = /* get from block metadata */;
    const props = propsId ? propsMap.get(propsId)?.parsed : undefined;
    
    compileSvelteBlock(context, code, blockId, props);
  }
});
```

#### 5. Preview Panel Updates (`previewPanel.ts`)

- Render `props` blocks with JSON syntax highlighting
- Show validation errors for malformed JSON
- Visual indicator linking props to component

### Error Handling

| Error | Handling |
|-------|----------|
| Invalid JSON in props block | Show error badge on props block, don't compile |
| Props ID not found | Show error in Svelte block, "Unknown props: xyz" |
| Orphan props block | Warning indicator, no action required |
| Runtime props mismatch | Svelte will show undefined - that's OK |

### Pros

- ✅ Clear separation of data and component
- ✅ Visible, editable data in document
- ✅ JSON syntax highlighting and validation
- ✅ Reusable props across multiple components
- ✅ Explicit linking prevents ambiguity

### Cons

- ⚠️ More verbose than inline
- ⚠️ Need to track block relationships
- ⚠️ Two blocks for one component

---

## Design 2: Inline Props Directive

### Overview

Embed props directly in the Svelte code block using a special HTML comment directive.

### Syntax

```markdown
```svelte
<!--- zef-props
{
  "items": ["Task 1", "Task 2"],
  "title": "My Todo List"
}
--->
<script>
  let { items, title } = $props();
</script>
<h1>{title}</h1>
{#each items as item}<p>{item}</p>{/each}
` ` `
```

### Key Features

1. **Single block**: Props and component together
2. **Minimal syntax**: Just add a comment directive
3. **Easy migration**: Add directive to existing components
4. **Stripped before compile**: Svelte never sees the directive

### Implementation Plan

#### 1. Directive Extraction (new utility function)

```typescript
// src/propsExtractor.ts

interface ExtractedProps {
  props: Record<string, unknown>;
  cleanSource: string;
  error?: string;
}

export function extractPropsDirective(source: string): ExtractedProps {
  // Match multi-line directive
  const directiveRegex = /<!---\s*zef-props\s*([\s\S]*?)\s*--->/;
  const match = source.match(directiveRegex);
  
  if (!match) {
    return { props: {}, cleanSource: source };
  }
  
  const propsContent = match[1].trim();
  const cleanSource = source.replace(directiveRegex, '').trim();
  
  try {
    const props = JSON.parse(propsContent);
    return { props, cleanSource };
  } catch (e) {
    return { 
      props: {}, 
      cleanSource: source,
      error: `Invalid JSON in zef-props: ${e.message}` 
    };
  }
}
```

#### 2. Extension Integration (`extension.ts`)

```typescript
import { extractPropsDirective } from './propsExtractor';

async function compileSvelteBlock(
  context: vscode.ExtensionContext, 
  code: string, 
  blockId?: number
): Promise<void> {
  try {
    // Extract props from directive
    const { props, cleanSource, error } = extractPropsDirective(code);
    
    if (error) {
      vscode.window.showErrorMessage(`Zef: ${error}`);
      return;
    }
    
    // Compile with extracted props and cleaned source
    const result = await compileSvelteComponent(
      cleanSource, 
      context.extensionPath, 
      props
    );
    
    // ... rest unchanged
  }
}
```

#### 3. Executor Updates (`svelteExecutor.ts`)

Same as Design 1 - accept `props` parameter and pass to compiler.

#### 4. Compiler Updates (`svelte-compiler/compiler.ts`)

Same as Design 1 - inject props into mount() call.

### YAML Support (Optional Enhancement)

```typescript
import * as yaml from 'js-yaml';

export function extractPropsDirective(source: string): ExtractedProps {
  const directiveRegex = /<!---\s*zef-props\s*([\s\S]*?)\s*--->/;
  const match = source.match(directiveRegex);
  
  if (!match) {
    return { props: {}, cleanSource: source };
  }
  
  const propsContent = match[1].trim();
  const cleanSource = source.replace(directiveRegex, '').trim();
  
  try {
    // Try JSON first, fall back to YAML
    let props: Record<string, unknown>;
    try {
      props = JSON.parse(propsContent);
    } catch {
      props = yaml.load(propsContent) as Record<string, unknown>;
    }
    return { props, cleanSource };
  } catch (e) {
    return { 
      props: {}, 
      cleanSource: source,
      error: `Invalid props data: ${e.message}` 
    };
  }
}
```

**YAML Example:**
```svelte
<!--- zef-props
items:
  - name: Task 1
    done: false
  - name: Task 2
    done: true
title: My Todo List
--->
<script>
  let { items, title } = $props();
</script>
```

### Error Handling

| Error | Handling |
|-------|----------|
| Invalid JSON/YAML | Show error message, don't compile |
| Missing closing `--->' | Parse error, show in preview |
| Empty props | Valid - compile with empty {} |

### Pros

- ✅ Minimal syntax overhead
- ✅ Single block - component is self-contained
- ✅ Easy to add to existing components
- ✅ Low implementation effort
- ✅ Intuitive for developers

### Cons

- ⚠️ Large props data clutters the component
- ⚠️ Props not reusable across components
- ⚠️ JSON in HTML comment is slightly awkward

---

## Recommendation

### Primary: Design 2 (Inline Directive)

**Rationale:**
- Simpler implementation (1 new file, small modifications)
- Better ergonomics for typical use cases
- Self-contained components are easier to understand
- Faster to implement and iterate

### Secondary: Design 1 (Props Block)

**Consider adding later when:**
- Users need large datasets
- Users want to share props across components
- Use cases emerge requiring separation

---

## Implementation Priority

### Phase 1: Inline Directive (Design 2)

1. Create `src/propsExtractor.ts` - directive extraction
2. Modify `svelteExecutor.ts` - accept props parameter
3. Modify `compiler.ts` - inject props into mount()
4. Modify `extension.ts` - extract and pass props
5. Test with sample components

### Phase 2: Props Block (Design 1) - Future

1. Extend parser for props blocks
2. Add props block rendering to preview
3. Implement ID-based linking
4. Add validation and error display

---

## Testing Plan

### Unit Tests

```typescript
describe('extractPropsDirective', () => {
  it('returns empty props when no directive', () => {
    const result = extractPropsDirective('<p>Hello</p>');
    expect(result.props).toEqual({});
    expect(result.cleanSource).toBe('<p>Hello</p>');
  });
  
  it('extracts JSON props', () => {
    const source = `<!--- zef-props {"name": "test"} --->
<p>{name}</p>`;
    const result = extractPropsDirective(source);
    expect(result.props).toEqual({ name: 'test' });
    expect(result.cleanSource).toBe('<p>{name}</p>');
  });
  
  it('returns error for invalid JSON', () => {
    const source = `<!--- zef-props {invalid} --->
<p>test</p>`;
    const result = extractPropsDirective(source);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

- Component with props renders correctly
- Props values available via `$props()`
- Error shown for invalid props
- Backwards compatibility: components without props still work

---

## Open Questions

1. **Should props support expressions?** e.g., `Date.now()` - probably no, keep static
2. **Should we support TypeScript types for props?** Future enhancement
3. **Hot reload on props change?** Already works - props are in source
4. **Max props size?** Practical limit from JSON in memory - monitor

---

## Appendix: Full Implementation Diff (Design 2)

### New File: `src/propsExtractor.ts`

```typescript
export interface ExtractedProps {
  props: Record<string, unknown>;
  cleanSource: string;
  error?: string;
}

export function extractPropsDirective(source: string): ExtractedProps {
  const directiveRegex = /<!---\s*zef-props\s*([\s\S]*?)\s*--->/;
  const match = source.match(directiveRegex);
  
  if (!match) {
    return { props: {}, cleanSource: source };
  }
  
  const propsContent = match[1].trim();
  const cleanSource = source.replace(directiveRegex, '').trim();
  
  try {
    const props = JSON.parse(propsContent);
    return { props, cleanSource };
  } catch (e: any) {
    return { 
      props: {}, 
      cleanSource: source,
      error: `Invalid JSON in zef-props: ${e.message}` 
    };
  }
}
```

### Modified: `svelteExecutor.ts`

```diff
 export async function compileSvelteComponent(
   svelteSource: string,
-  extensionPath: string
+  extensionPath: string,
+  props?: Record<string, unknown>
 ): Promise<SvelteCompileResult> {
   // ...
   
   return new Promise((resolve) => {
     // ...
     
-    proc.stdin.write(svelteSource);
+    const input = JSON.stringify({
+      source: svelteSource,
+      props: props ?? {}
+    });
+    proc.stdin.write(input);
     proc.stdin.end();
```

### Modified: `compiler.ts`

```diff
+interface CompilerInput {
+  source: string;
+  props: Record<string, unknown>;
+}

-async function compileSvelteClient(source: string): Promise<CompileResult> {
+async function compileSvelteClient(input: CompilerInput): Promise<CompileResult> {
+  const { source, props } = input;
   
   // ... (compilation unchanged)
   
+  const propsJson = JSON.stringify(props);
   const entryCode = `
 import { mount } from 'svelte';
 import Component from './${tempId}.js';

 function init() {
   const target = document.getElementById('app') || document.body;
-  mount(Component, { target });
+  const props = ${propsJson};
+  mount(Component, { target, props });
 }
 `;

 async function main() {
-  const source = await Bun.stdin.text();
+  const rawInput = await Bun.stdin.text();
+  
+  let input: CompilerInput;
+  try {
+    input = JSON.parse(rawInput);
+  } catch {
+    input = { source: rawInput, props: {} };
+  }
   
-  const result = await compileSvelteClient(source);
+  const result = await compileSvelteClient(input);
```

### Modified: `extension.ts`

```diff
+import { extractPropsDirective } from './propsExtractor';

 async function compileSvelteBlock(
   context: vscode.ExtensionContext, 
   code: string, 
   blockId?: number
 ): Promise<void> {
   try {
+    const { props, cleanSource, error } = extractPropsDirective(code);
+    
+    if (error) {
+      vscode.window.showErrorMessage(`Zef: ${error}`);
+      return;
+    }
+    
-    const result = await compileSvelteComponent(code, context.extensionPath);
+    const result = await compileSvelteComponent(cleanSource, context.extensionPath, props);
```
