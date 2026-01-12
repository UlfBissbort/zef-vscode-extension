# Svelte Render Test

A simple test to check if rendered-html blocks work on load.



In Rust:
```rust
println!("The answer is {}", 40 + 2);
1.2345
```
````Result
1.2345
````
````Side Effects
[
    ET.UnmanagedEffect(
        what='stdout',
        content='The answer is 42'
    )
]
````





Or Svelte
```svelte
<script>
  let clicked = 0;
</script>

<button on:click={() => clicked++}>
  {clicked === 0 ? 'Click me' : `Clicked ${clicked}×`}
</button>

<style>
  button {
    padding: 12px 28px;
    font-size: 14px;
    font-weight: 500;
    color: #fafafa;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  button::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea);
    background-size: 300% 100%;
    z-index: -1;
    border-radius: 10px;
    animation: gradient 3s linear infinite;
    opacity: 0.5;
    transition: opacity 0.3s;
  }
  button:hover::before { opacity: 1; }
  button:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3); }
  @keyframes gradient { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
</style>
```







The end