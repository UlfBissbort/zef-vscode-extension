# JavaScript Execution Implementation Plan

## Design Iterations

### Iteration 1: Basic Approach

**Approach**: Execute JS code with bun, capture last expression value using eval().

```javascript
// User code
const x = 5;
console.log("hello");
x * 2

// Wrapped as:
const result = eval(userCode);
console.error("__RESULT__:" + result);
```

**Critique**:
- ✅ Simple and works for sync code
- ❌ Doesn't work for async code (`await` outside async function)
- ❌ Needs proper object serialization (not just `+ result`)
- ⚠️ eval in same context - could conflict with wrapper variables

---

### Iteration 2: Async Support

**Approach**: Wrap all code in async IIFE to support top-level await.

```javascript
const result = await eval(`(async () => {
    ${userCode}
})()`);
```

**Problem**: This doesn't return the last expression value - it returns undefined.

**Better approach**: Transform the last expression to be assigned:

```javascript
(async () => {
    let __zef_result;
    const x = 5;
    console.log("hello");
    __zef_result = x * 2  // Last expression assigned
    return __zef_result;
})()
```

**Critique**:
- ✅ Works for async code
- ✅ Works for sync code
- ⚠️ Expression detection needed (like Rust) - what's the last expression?
- ❌ More complex parsing required

---

### Iteration 3: Simpler Expression Detection

**Key Insight**: In JS, the last expression without a semicolon OR any expression is valid.
Unlike Rust, we can be simpler:

1. Find the last non-empty, non-comment line
2. If it doesn't end with `;`, add `__zef_result = ` before it
3. If it ends with `;`, still assign it (statements that return values)

**Actually even simpler**: Just use eval() with IIFE and return the eval result:

```javascript
(async () => {
    // User code runs here
    const x = 5;
    console.log("hello");
    return x * 2;  // Last expression returned
})()
```

**But wait** - we need to transform the user's code to return the last expression.

**Simplest approach**: Use a wrapper script that reads user code from a file:

```javascript
// zef_js_runner.js
const fs = require('fs');
const userCode = fs.readFileSync(process.argv[2], 'utf-8');
const resultFile = process.argv[3];

(async () => {
    try {
        // Transform: make last non-semicolon line a return
        const result = await eval(`(async () => {\n${userCode}\n})()`);
        fs.writeFileSync(resultFile, JSON.stringify(result));
    } catch (e) {
        fs.writeFileSync(resultFile, JSON.stringify({ __error: e.message, __stack: e.stack }));
    }
})();
```

**Critique**:
- ✅ Simple - no complex parsing
- ❌ eval(`(async () => { ... })()`) doesn't automatically return last expression
- Need to explicitly handle return value

---

### Iteration 4: Proper Expression Return

**Key Realization**: JavaScript `eval()` DOES return the last expression value:

```javascript
eval('5 + 3')  // Returns 8
eval('const x = 5; x * 2')  // Returns 10
```

The issue is only with async - we need the IIFE to return the value.

**Solution**: Don't use async wrapper for sync code. Detect if code uses `await`:

1. Check if code contains `await` keyword (not in string/comment)
2. If no await: `eval(userCode)` directly
3. If has await: wrap in async IIFE and transform last expression

**Simpler**: Always use async wrapper, but transform last expression:

```typescript
function wrapJsCode(code: string): string {
    const lines = code.trim().split('\n');
    
    // Find last non-empty, non-comment line
    let lastExprIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*')) {
            lastExprIndex = i;
            break;
        }
    }
    
    if (lastExprIndex >= 0) {
        const lastLine = lines[lastExprIndex].trim();
        // If doesn't end with ; or }, prepend return
        if (!lastLine.endsWith(';') && !lastLine.endsWith('}')) {
            lines[lastExprIndex] = 'return ' + lines[lastExprIndex];
        } else if (!lastLine.startsWith('return')) {
            // Even if ends with ;, try to return it
            // Remove trailing ; and add return
            const withoutSemi = lastLine.replace(/;$/, '');
            lines[lastExprIndex] = 'return ' + withoutSemi;
        }
    }
    
    return `(async () => {\n${lines.join('\n')}\n})()`;
}
```

**Critique**:
- ✅ Handles both sync and async
- ⚠️ Over-transforms - what about blocks like `if (x) { }` at the end?
- ⚠️ What about `for` loops or `while` at the end?
- Need smarter detection

---

### Iteration 5: Statement vs Expression Detection

**Better approach**: Don't transform if last line is clearly a statement:

Statement indicators:
- `if`, `for`, `while`, `switch`, `try`, `class`, `function` declarations
- Lines ending with `}`

Expression indicators:
- Doesn't start with statement keywords
- Doesn't end with `}`
- Could be: variable, function call, literal, operator expression

```typescript
function isStatement(line: string): boolean {
    const trimmed = line.trim();
    const statementKeywords = [
        'if', 'for', 'while', 'switch', 'try', 'class', 
        'function', 'const', 'let', 'var', 'return', 'throw',
        'import', 'export'
    ];
    
    // Check if starts with statement keyword followed by space or (
    for (const kw of statementKeywords) {
        if (trimmed.startsWith(kw + ' ') || trimmed.startsWith(kw + '(')) {
            return true;
        }
    }
    
    // Ends with } usually means block statement
    if (trimmed.endsWith('}')) {
        return true;
    }
    
    return false;
}
```

**Critique**:
- ✅ More accurate
- ⚠️ Still not perfect - what about arrow functions?
- ⚠️ What about `const x = 5;` - that's a statement but has a value

**Decision**: For MVP, be conservative:
- If ends with `;` → try to return the value (remove `;`, add `return`)
- If ends with `}` → don't transform (likely statement block)
- Otherwise → add `return`

---

### Iteration 6: Final Design

**Approach**:
1. Write user code to temp file
2. Generate wrapper that reads code and uses eval
3. Capture stdout separately from result (result goes to file)
4. Parse result/error from file

**Wrapper template** (`zef_js_executor.js`):

```javascript
const fs = require('fs');
const util = require('util');

const userCodeFile = process.argv[2];
const resultFile = process.argv[3];

const userCode = fs.readFileSync(userCodeFile, 'utf-8');

// Transform last expression for return
function transformForReturn(code) {
    const lines = code.trimEnd().split('\n');
    
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//')) continue;
        
        // Skip if clearly a statement block
        if (line.endsWith('}')) break;
        
        // Add return before last expression
        if (line.endsWith(';')) {
            lines[i] = lines[i].replace(/;(\s*)$/, '');
        }
        if (!line.startsWith('return ')) {
            lines[i] = 'return ' + lines[i];
        }
        break;
    }
    
    return lines.join('\n');
}

const transformed = transformForReturn(userCode);
const wrapped = `(async () => {\n${transformed}\n})()`;

(async () => {
    try {
        const result = await eval(wrapped);
        const output = {
            status: 'ok',
            result: util.inspect(result, { depth: 5, colors: false })
        };
        fs.writeFileSync(resultFile, JSON.stringify(output));
    } catch (e) {
        const output = {
            status: 'error',
            error: {
                name: e.name,
                message: e.message,
                stack: e.stack
            }
        };
        fs.writeFileSync(resultFile, JSON.stringify(output));
    }
})();
```

**Critique**:
- ✅ Clean separation of stdout (side effects) and result (in file)
- ✅ Handles async code
- ✅ Good error handling
- ⚠️ Transform might break some edge cases
- ⚠️ eval in wrapper context - could conflict

---

### Final Implementation Plan

## Module: `src/jsExecutor.ts`

### Core Functions

```typescript
interface JsCellResult {
    cell_id: string;
    status: 'ok' | 'error';
    result: string | null;
    stdout: string;
    stderr: string;
    side_effects: SideEffect[];
    error: {
        type: string;
        message: string;
        traceback: string;
    } | null;
}

async function executeJs(code: string, cellId: string): Promise<JsCellResult>
async function isBunAvailable(): Promise<boolean>
async function getBunPath(): Promise<string>
```

### Implementation Steps

1. **Check bun availability** - Look in common paths like `~/.bun/bin/bun`

2. **Write user code to temp file** - `/tmp/zef_js_{id}.js`

3. **Create executor script** - Uses eval in async IIFE, writes result to file

4. **Execute with bun** - Capture stdout/stderr

5. **Parse result file** - Get structured result or error

6. **Cleanup temp files**

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/jsExecutor.ts` | CREATE - New module for JS execution |
| `src/extension.ts` | MODIFY - Add JS code block support |
| `src/codeBlockParser.ts` | MODIFY - Already supports js blocks |
| `src/previewPanel.ts` | MODIFY - Add Run button for js blocks |

### Expression Transform Logic

```typescript
function transformForReturn(code: string): string {
    const lines = code.trimEnd().split('\n');
    
    // Find last non-empty, non-comment line
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        // Skip empty and comments
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }
        
        // Skip statement blocks that end with }
        if (line.endsWith('}')) {
            // But check if it's an arrow function or object literal
            // For now, be conservative and skip
            break;
        }
        
        // Remove trailing semicolon if present
        let modifiedLine = lines[i];
        if (line.endsWith(';')) {
            modifiedLine = modifiedLine.replace(/;\s*$/, '');
        }
        
        // Add return if not already present
        if (!modifiedLine.trim().startsWith('return ')) {
            const leadingWhitespace = modifiedLine.match(/^(\s*)/)?.[1] || '';
            const content = modifiedLine.trim();
            modifiedLine = leadingWhitespace + 'return ' + content;
        }
        
        lines[i] = modifiedLine;
        break;
    }
    
    return lines.join('\n');
}
```

### Testing Checklist

- [ ] Simple expression: `5 + 3`
- [ ] With console.log: `console.log("hi"); 42`
- [ ] Object result: `{ name: "test" }`
- [ ] Array result: `[1, 2, 3].map(x => x * 2)`
- [ ] Async code: `await Promise.resolve(42)`
- [ ] Function definition: `function add(a, b) { return a + b }; add(1, 2)`
- [ ] Error: `throw new Error("oops")`
- [ ] Syntax error: `const x = `
- [ ] No expression (just statement): `const x = 5;`
- [ ] Arrow function result: `(() => 42)()`

### Edge Cases

1. **Code ends with `}`** - Don't transform (might break block)
2. **Code has `return` already** - Don't double-add
3. **Empty code** - Return undefined
4. **Only comments** - Return undefined
5. **Multi-line expression** - Only transform last line (simplified)

### Limitations (Acceptable for MVP)

1. **No require/import from npm** - Would need package.json setup
2. **No persistent state** - Each cell is fresh execution
3. **Transform might fail on complex expressions** - Users can add explicit `return`
4. **No TypeScript** - Just JavaScript (bun does support TS though)
