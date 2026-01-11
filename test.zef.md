# Test Zef Markdown

This is a test file for the Zef extension. This is a longer paragraph to ensure that the extension can handle multiple lines of text before and after code blocks. And it goes on to add even more text to simulate a real-world scenario where documentation might be extensive.


```python
print("Hello from Zef!")
x = 42
```

Some more text here.

### Subheading 2

- a
- b

some text

1. First item
2. Second item 
3. Third item
    - Nested item
    - Another nested item


```python
print(f"The answer is {x}")
y = x * 2
print(f"Double is {y}")
```

And a final block:

```python
import datetime
print(f"Current time: {datetime.datetime.now()}")
```


We can also show Rust code blocks.

```rust
fn main() {
    println!("Hello from Rust!");
    let x = 42;
}
```
