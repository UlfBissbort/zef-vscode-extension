# Rust Execution Implementation Plan

## Design Iterations

### Iteration 1: Initial Design

**Approach**: Create a `RustExecutor` class similar to `KernelManager` that:

1. Takes Rust code as input
2. Wraps it in a template with main() function
3. Compiles with rustc to a temp file
4. Runs the binary
5. Parses output to separate result from side effects
6. Returns structured CellResult

**Template for wrapping code**:
```rust
fn main() {
    // Capture stdout during user code
    let __stdout_capture = std::io::stdout();
    
    // User's code runs here
    let __result = {
        {USER_CODE}
    };
    
    // Output result with marker
    eprintln!("__ZEF_RESULT__:{:?}:__ZEF_END__", __result);
}
```

**Critique**:
- ❌ **Cannot capture stdout from within Rust easily** - Would need complex threading
- ❌ **User code might define functions/structs** - Can't wrap in expression block
- ❌ **User might use main() themselves** - Conflict

---

### Iteration 2: Better Structure Detection

**New Approach**: Detect what kind of code the user wrote:

1. If code contains `fn main()` → Run as-is, just capture output
2. If code contains function/struct definitions → Wrap in module, call final expression
3. If code is pure expression → Wrap in main with result capture

**Code Detection Logic**:
```typescript
function detectCodeType(code: string): 'has_main' | 'has_definitions' | 'expression' {
    if (code.includes('fn main()')) return 'has_main';
    if (/^(fn |struct |enum |impl |trait |use |mod )/m.test(code)) return 'has_definitions';
    return 'expression';
}
```

**Critique**:
- ❌ **Regex is fragile** - Could match inside strings or comments
- ❌ **Still doesn't solve stdout capture** - We need a different approach
- ✅ Structure detection idea is good, but implementation needs work

---

### Iteration 3: Separate stdout/stderr from result

**Key Insight**: We don't need to capture stdout *within* Rust. We can:
1. Let Rust print to stdout normally (these become side effects)
2. Print the result to a **separate file** or use a **unique marker**

**Approach using markers**:
```rust
fn main() {
    // User code (may print to stdout/stderr)
    let __result = {
        {USER_CODE}
    };
    
    // Use a unique marker on stderr to separate from user output
    eprint!("\n__ZEF_RESULT_MARKER_7f3a9b__");
    eprint!("{:?}", __result);
    eprint!("__ZEF_RESULT_END_7f3a9b__\n");
}
```

Then in TypeScript:
```typescript
// Separate user stdout from result using marker
const resultMatch = stderr.match(/__ZEF_RESULT_MARKER_7f3a9b__([\s\S]*?)__ZEF_RESULT_END_7f3a9b__/);
const result = resultMatch ? resultMatch[1] : null;
const userStdout = stdout;  // All stdout is from user
const userStderr = stderr.replace(/__ZEF_RESULT_MARKER.*__ZEF_RESULT_END_7f3a9b__/, '').trim();
```

**Critique**:
- ✅ **Clean separation** - stdout is user, stderr has result with marker
- ❌ **What if user prints the marker?** - Unlikely but possible. Use UUID.
- ❌ **Still doesn't handle definitions + expressions** - Need two-part wrapping

---

### Iteration 4: Handling Definitions

**Key Insight**: Rust code in a cell can be:
1. **Pure expression**: `5 + 3` or `{ let x = 5; x * 2 }`
2. **Definitions only**: `fn foo() { }` (no return value expected)
3. **Definitions + expression**: Functions defined, then an expression block

**Solution**: Look for trailing expression block `{ ... }`:

```rust
// User writes:
fn add(a: i32, b: i32) -> i32 { a + b }

{
    add(5, 10)
}

// We generate:
fn add(a: i32, b: i32) -> i32 { a + b }

fn main() {
    let __result = {
        add(5, 10)
    };
    eprint!("__ZEF_RESULT__\n{:?}\n__ZEF_END__", __result);
}
```

**Detection logic**:
```typescript
function splitCodeAndExpression(code: string): { definitions: string, expression: string | null } {
    // Look for a trailing standalone block { ... }
    const blockMatch = code.match(/\n\s*(\{[\s\S]*\})\s*$/);
    if (blockMatch) {
        return {
            definitions: code.slice(0, code.lastIndexOf(blockMatch[1])),
            expression: blockMatch[1]
        };
    }
    // Check if entire code is an expression (no definitions)
    if (!/^(fn |struct |enum |impl |trait |use |mod |const |static |type )/m.test(code)) {
        return { definitions: '', expression: code };
    }
    // Just definitions, no expression to evaluate
    return { definitions: code, expression: null };
}
```

**Critique**:
- ❌ **Trailing block detection is fragile** - What about `fn foo() { }` at the end?
- ❌ **A block could be part of a match arm or if statement**
- ✅ **Core idea is sound** - Need better parsing

---

### Iteration 5: Explicit Marker for Expression

**New Idea**: Use a comment marker to denote "evaluate this":

```rust
fn add(a: i32, b: i32) -> i32 { a + b }

// @eval
add(5, 10)
```

Or simpler: **Last line without semicolon is the expression**

```rust
fn add(a: i32, b: i32) -> i32 { a + b }

add(5, 10)  // No semicolon = evaluate and return
```

This is how Rust works naturally! In a block, the last expression without `;` is the return value.

**Detection**:
```typescript
function extractExpression(code: string): { setup: string, expr: string | null } {
    const lines = code.trim().split('\n');
    const lastLine = lines[lines.length - 1].trim();
    
    // If last line doesn't end with ; or } (closing a definition), it's an expression
    if (!lastLine.endsWith(';') && !lastLine.endsWith('}')) {
        return {
            setup: lines.slice(0, -1).join('\n'),
            expr: lastLine
        };
    }
    
    // Check for trailing block expression { ... }
    // (This handles multi-line expressions)
    const blockMatch = code.match(/\n(\{[^{}]*\})\s*$/);
    if (blockMatch) {
        return {
            setup: code.slice(0, code.lastIndexOf(blockMatch[1])),
            expr: blockMatch[1]
        };
    }
    
    return { setup: code, expr: null };
}
```

**Critique**:
- ✅ **Natural Rust style** - Matches how blocks work
- ⚠️ **Last line might be multi-line expression** - Need to handle
- ⚠️ **What about `}` being last character of an expression?** - e.g., `Point { x: 1, y: 2 }`
- Need more robust parsing

---

### Iteration 6: Simpler Approach

**Key Realization**: We're overcomplicating this. For MVP:

1. **Treat ALL code as potentially evaluatable**
2. **Wrap in main, attempt compilation**
3. **If it fails, try wrapping differently or show error**

**Simple Template**:
```rust
#![allow(unused)]  // Silence unused warnings

{USER_DEFINITIONS}

fn main() {{
    let __zef_result = {{
        {EXPRESSION_OR_UNIT}
    }};
    eprintln!("__ZEF_RESULT_START__");
    eprintln!("{{:?}}", __zef_result);
    eprintln!("__ZEF_RESULT_END__");
}}
```

If user code has no expression (just definitions), we use `()` as the expression.

**Critique**:
- ✅ **Simple to implement**
- ✅ **Handles most cases**
- ⚠️ **User might write `fn main()` themselves** - Check for this, run as-is
- ⚠️ **Expression needs Debug trait** - Will fail for non-Debug types

---

### Iteration 7: Final Design

**Addressing remaining concerns**:

1. **Check for `fn main()`** → If present, run code as-is
2. **Require Debug for results** → Document this limitation, could auto-derive later
3. **Use file for result** → More robust than markers

**Final Implementation Strategy**:

```typescript
interface RustCellResult {
    status: 'ok' | 'error';
    result: string | null;          // Debug representation of final value
    side_effects: SideEffect[];     // stdout, stderr from user code
    error: {
        type: string;
        message: string;
        location?: { line: number, column: number };
    } | null;
}

async function executeRust(code: string): Promise<RustCellResult> {
    const execId = uuid();
    const srcFile = `/tmp/zef_rust_${execId}.rs`;
    const outFile = `/tmp/zef_rust_${execId}`;
    const resultFile = `/tmp/zef_rust_${execId}_result.txt`;
    
    // Step 1: Detect code type
    const hasMain = /fn\s+main\s*\(\s*\)/.test(code);
    
    // Step 2: Generate wrapped code
    let wrappedCode: string;
    if (hasMain) {
        // User has main, run as-is but inject result capture
        wrappedCode = code;  // TODO: Could inject result capture
    } else {
        // Detect if last non-empty line is an expression
        const { setup, expr } = extractExpression(code);
        wrappedCode = generateWrapper(setup, expr, resultFile);
    }
    
    // Step 3: Write and compile
    await fs.writeFile(srcFile, wrappedCode);
    
    const compileResult = await exec(`rustc --edition 2021 ${srcFile} -o ${outFile}`);
    if (compileResult.stderr) {
        // Parse rustc errors
        return parseCompileError(compileResult.stderr);
    }
    
    // Step 4: Run
    const runResult = await exec(outFile);
    
    // Step 5: Parse results
    const result = await fs.readFile(resultFile, 'utf-8').catch(() => null);
    
    return {
        status: 'ok',
        result: result,
        side_effects: [
            { what: 'stdout', content: runResult.stdout },
            { what: 'stderr', content: runResult.stderr }
        ].filter(e => e.content),
        error: null
    };
}
```

**Critique**:
- ✅ **Clean separation using result file** - No marker parsing
- ✅ **Handles both expression and non-expression code**
- ✅ **Good error handling**
- ⚠️ **What if program doesn't exit cleanly?** → Need timeout
- ⚠️ **What about infinite loops?** → Need timeout
- ⚠️ **Temp file cleanup** → Need finally block

---

## Final Implementation Plan

### Module: `src/rustExecutor.ts`

**Exports**:
- `executeRust(code: string, cellId: string): Promise<CellResult>` - Main function
- `RustExecutor` class (optional, for future REPL-like state)

### Implementation Steps

#### Step 1: Create the template generator

```typescript
function generateRustWrapper(code: string, resultFile: string): string {
    const { setup, expr } = extractExpression(code);
    const exprCode = expr || '()';  // Unit type if no expression
    
    return `
#![allow(unused)]
use std::io::Write;

${setup}

fn main() {
    let __zef_result = {
        ${exprCode}
    };
    
    // Write result to file (avoids mixing with stdout)
    if let Ok(mut f) = std::fs::File::create("${resultFile}") {
        let _ = writeln!(f, "{:?}", __zef_result);
    }
}
`;
}
```

#### Step 2: Expression extraction

```typescript
function extractExpression(code: string): { setup: string; expr: string | null } {
    const trimmed = code.trim();
    
    // Check if has main - don't wrap
    if (/fn\s+main\s*\(/.test(trimmed)) {
        return { setup: trimmed, expr: null };
    }
    
    // Split into lines, find last expression
    const lines = trimmed.split('\n');
    
    // Work backwards to find expression (line not ending in ; or })
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('//')) continue;
        
        // If ends with } and isn't part of a definition, might be block expression
        // If doesn't end with ; or }, it's likely an expression
        if (!line.endsWith(';') && !line.startsWith('fn ') && 
            !line.startsWith('struct ') && !line.startsWith('enum ') &&
            !line.startsWith('impl ') && !line.startsWith('mod ')) {
            
            // Found potential expression
            return {
                setup: lines.slice(0, i).join('\n'),
                expr: lines.slice(i).join('\n')
            };
        }
        
        // Hit a definition, no expression
        break;
    }
    
    return { setup: code, expr: null };
}
```

#### Step 3: Main executor function

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export interface SideEffect {
    what: string;
    content: string;
}

export interface RustCellResult {
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

export async function executeRust(code: string, cellId: string): Promise<RustCellResult> {
    const execId = crypto.randomBytes(8).toString('hex');
    const tmpDir = os.tmpdir();
    const srcFile = path.join(tmpDir, `zef_rust_${execId}.rs`);
    const outFile = path.join(tmpDir, `zef_rust_${execId}`);
    const resultFile = path.join(tmpDir, `zef_rust_${execId}_result.txt`);
    
    try {
        // Generate wrapped code
        const wrappedCode = generateRustWrapper(code, resultFile);
        
        // Write source file
        await fs.writeFile(srcFile, wrappedCode);
        
        // Compile
        try {
            await execAsync(`rustc --edition 2021 "${srcFile}" -o "${outFile}"`, {
                timeout: 30000  // 30 second compile timeout
            });
        } catch (e: any) {
            // Compilation failed
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout: '',
                stderr: e.stderr || '',
                side_effects: [],
                error: {
                    type: 'CompilationError',
                    message: 'Failed to compile Rust code',
                    traceback: e.stderr || e.message
                }
            };
        }
        
        // Execute
        let stdout = '';
        let stderr = '';
        try {
            const result = await execAsync(`"${outFile}"`, {
                timeout: 30000  // 30 second execution timeout
            });
            stdout = result.stdout;
            stderr = result.stderr;
        } catch (e: any) {
            // Runtime error
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout: e.stdout || '',
                stderr: e.stderr || '',
                side_effects: [],
                error: {
                    type: 'RuntimeError',
                    message: 'Rust program exited with error',
                    traceback: e.stderr || e.message
                }
            };
        }
        
        // Read result from file
        let resultValue: string | null = null;
        try {
            resultValue = (await fs.readFile(resultFile, 'utf-8')).trim();
        } catch {
            // No result file - code had no expression
            resultValue = null;
        }
        
        // Build side effects
        const sideEffects: SideEffect[] = [];
        if (stdout.trim()) {
            sideEffects.push({ what: 'stdout', content: stdout });
        }
        if (stderr.trim()) {
            sideEffects.push({ what: 'stderr', content: stderr });
        }
        
        return {
            cell_id: cellId,
            status: 'ok',
            result: resultValue,
            stdout,
            stderr,
            side_effects: sideEffects,
            error: null
        };
        
    } finally {
        // Cleanup temp files
        await Promise.all([
            fs.unlink(srcFile).catch(() => {}),
            fs.unlink(outFile).catch(() => {}),
            fs.unlink(resultFile).catch(() => {})
        ]);
    }
}
```

#### Step 4: Integration with extension.ts

1. Add Rust detection to `findPythonCodeBlocks` → rename to `findCodeBlocks`
2. Support ` ```rust ` blocks
3. Route to appropriate executor based on language

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/rustExecutor.ts` | CREATE - New module for Rust execution |
| `src/extension.ts` | MODIFY - Add Rust code block support |
| `src/codeBlockParser.ts` | MODIFY - Detect Rust blocks |
| `src/previewPanel.ts` | MODIFY - Render Rust results |

### Testing Checklist

- [ ] Simple expression: `5 + 3`
- [ ] Block expression: `{ let x = 5; x * 2 }`
- [ ] With function: `fn add(a: i32, b: i32) -> i32 { a + b }\nadd(1, 2)`
- [ ] With struct: `#[derive(Debug)]\nstruct P { x: i32 }\nP { x: 5 }`
- [ ] With println: `println!("hello"); 42`
- [ ] Compile error: `let x: i32 = "string";`
- [ ] Runtime panic: `panic!("oops")`
- [ ] Infinite loop timeout: `loop {}`
- [ ] No expression (just definitions): `fn foo() {}`

### Edge Cases Handled

1. **User includes `fn main()`** → Detected, could warn or handle specially
2. **Expression doesn't impl Debug** → Compile error, clear message
3. **Infinite loop** → 30 second timeout
4. **Large output** → Truncate stdout/stderr
5. **Multiple expressions** → Only last one is evaluated
6. **Concurrent executions** → Unique temp file names with crypto.randomBytes

### Not Handled (Future Work)

1. **External crates** → Would need Cargo integration
2. **Persistent state** → Each cell is fresh compile
3. **Incremental compilation** → Could cache for speed
4. **Async code** → Would need tokio runtime injection
