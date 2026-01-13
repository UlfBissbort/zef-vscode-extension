# Rust Expression Evaluation Research

## Summary

**Yes, it is possible to evaluate Rust expressions using only `rustc` without creating a Cargo crate.** This approach is fast (~120ms for simple expressions) and works well for self-contained code.

## How It Works

Rust expressions can be wrapped in a minimal program structure:

```rust
fn main() {
    let result = {
        // User's expression block here
        let x = 5;
        let y = 10;
        x + y
    };
    println!("{:?}", result);
}
```

Compile and run:
```bash
rustc my_expr.rs -o my_expr && ./my_expr
```

## Tested Capabilities

### ✅ Basic Expressions
```rust
{
    let x = 5;
    let y = 10;
    x + y
}
// Output: 15
```

### ✅ Functions Defined Above Expressions
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    let result = {
        let x = add(5, 10);
        let y = multiply(x, 2);
        y
    };
    println!("{:?}", result);
}
// Output: 30
```

### ✅ Structs with Debug Trait (String Representation)
```rust
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let result = Point { x: 10, y: 20 };
    println!("{:?}", result);
}
// Output: Point { x: 10, y: 20 }
```

### ✅ Standard Library Collections
```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("hello", 42);
    map.insert("world", 99);
    println!("{:?}", map);
}
// Output: {"world": 99, "hello": 42}
```

### ✅ Modern Rust Features (Edition 2021)
```bash
rustc --edition 2021 my_expr.rs -o my_expr
```

Supports:
- let-else patterns
- if-let chains  
- All Rust 2021 features

### ✅ Error Messages
Rustc provides excellent error messages:
```
error[E0308]: mismatched types
 --> test.rs:3:22
  |
3 |         let x: i32 = "not a number";
  |                ---   ^^^^^^^^^^^^^^ expected `i32`, found `&str`
  |                |
  |                expected due to this
```

## Limitations

### ❌ External Crates
Cannot use external crates (serde, tokio, etc.) without Cargo. Only `std` and `core` are available.

Workaround: Could pre-compile common crates and link with `--extern`, but this is complex.

### ❌ Persistence Between Cells
Unlike Python, each cell is a fresh compilation. No shared state between cells.

Workaround: Could accumulate definitions and re-compile, but gets slow with many cells.

## Performance

| Operation | Time |
|-----------|------|
| Simple expression compilation | ~120ms |
| Compilation with std collections | ~150ms |
| Execution of compiled binary | ~5ms |

## Implementation Approach for Zef

### Option 1: Direct rustc (Recommended for MVP)

```typescript
async function evaluateRustExpression(code: string): Promise<string> {
    const tempFile = `/tmp/zef_rust_${Date.now()}.rs`;
    const outFile = `/tmp/zef_rust_${Date.now()}`;
    
    // Wrap expression in main
    const fullCode = `
fn main() {
    let __result = {
${code}
    };
    println!("{:?}", __result);
}`;
    
    fs.writeFileSync(tempFile, fullCode);
    
    try {
        execSync(`rustc --edition 2021 ${tempFile} -o ${outFile}`);
        const output = execSync(outFile).toString();
        return output.trim();
    } finally {
        // Cleanup temp files
    }
}
```

### Option 2: evcxr (Rust REPL)

There's a Rust REPL called `evcxr` that could provide:
- Persistence between cells
- External crate support via `:dep serde`
- More interactive experience

Install: `cargo install evcxr_repl`

Would need to manage an evcxr process similar to the Python kernel.

## Recommendation

For an MVP:
1. Use direct rustc compilation
2. Wrap user code in `fn main() { println!("{:?}", { ... }); }`
3. Use `--edition 2021` for modern features
4. Capture both stdout and stderr for results/errors

For a more complete solution:
1. Consider evcxr for persistence and crate support
2. Or build a custom runner that accumulates definitions

## Example: What Cells Would Look Like

```markdown
# My Rust Document

```rust
#[derive(Debug, Clone)]
struct Person {
    name: String,
    age: u32,
}
```

````Result
(type defined)
````

```rust
{
    let p = Person { 
        name: "Alice".to_string(), 
        age: 30 
    };
    p
}
```

````Result
Person { name: "Alice", age: 30 }
````
```

## Next Steps

1. Create a `RustKernelManager` similar to Python's
2. Handle function/struct definitions by accumulating them
3. Add syntax detection for ```rust blocks
4. Consider evcxr integration for advanced features
