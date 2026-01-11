# Welcome to Zef: Literate Programming for VS Code

**Zef** brings the power of *literate programming* to your fingertips. Write code that tells a story, where documentation and implementation live together as one cohesive narrative.

## What is Literate Programming?

Literate programming, pioneered by Donald Knuth, inverts the traditional relationship between code and documentation. Instead of writing programs with occasional comments, you write documentation that contains code. The result? Software that is genuinely understandable.

> "Let us change our traditional attitude to the construction of programs: Instead of imagining that our main task is to instruct a computer what to do, let us concentrate rather on explaining to human beings what we want a computer to do." — Donald Knuth

## Getting Started

With Zef, your `.zef.md` files become living documents. Code blocks are not just syntax-highlighted snippets—they're executable, observable, and connected.

```python
# A simple greeting to get us started
message = "Hello, Literate World!"
print(message)
```

Notice the tabs above? Each code block gives you three views:
- **Code**: The source code itself
- **Output**: What happens when the code runs
- **Side Effects**: Any changes to state, files, or the outside world

## The Power of Connected Code

In literate programming, code blocks build upon each other. Variables and state flow naturally through your document:

```python
# Building on our previous work
numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
average = total / len(numbers)
print(f"The average of {numbers} is {average}")
```

This isn't just documentation—it's a runnable notebook that reads like a book.

## Multi-Language Support

Zef supports multiple languages in the same document. Need to prototype an algorithm in Python and then implement it in Rust?

```rust
fn calculate_average(numbers: &[i32]) -> f64 {
    let sum: i32 = numbers.iter().sum();
    sum as f64 / numbers.len() as f64
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let avg = calculate_average(&numbers);
    println!("Average: {}", avg);
}
```

## Why Literate Programming?

1. **Better Understanding**: Code written for humans first is code that lasts
2. **Natural Documentation**: No more outdated comments—the prose *is* the documentation
3. **Thinking Tool**: Writing forces clarity of thought
4. **Onboarding**: New team members can read your codebase like a book

## Start Writing

Create a new `.zef.md` file and begin your journey into literate programming. Your future self (and your teammates) will thank you.

```python
import datetime

# The journey begins now
print(f"Started literate programming journey: {datetime.datetime.now()}")
print("Happy coding! 🚀")
```
