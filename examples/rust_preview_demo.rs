/*md
# Zef Rust File Preview Demo

This is a Rust file with embedded markdown documentation!

Try pressing **Cmd+Shift+V** to see the rendered preview.

## Features

- LaTeX equations: $E = mc^2$
- Mermaid diagrams
- Code with syntax highlighting

```mermaid
graph LR
    A[Rust File] --> B[md blocks]
    B --> C[Rendered Preview]
```
*/

use std::f64::consts::PI;

/*md
## Geometry Module

The area of a circle:

$$A = \pi r^2$$
*/

pub struct Circle {
    pub radius: f64,
}

impl Circle {
    /*md
    ### Circle Methods

    Calculate properties of a circle.    
    
    We can also use latex here:
    $$C = 2 \pi r$$


    or use inline math: $C = 2 \pi r$.
    or mermaid diagrams:

    ```mermaid
    graph TD
        A[Circle] --> B[Area]
        A --> C[Circumference]
    ```


    */
    
    pub fn new(radius: f64) -> Self {
        Circle { radius }
    }
    
    pub fn area(&self) -> f64 {
        PI * self.radius * self.radius
    }
    
    pub fn circumference(&self) -> f64 {
        2.0 * PI * self.radius
    }
}

/*md
## Example Usage
*/

fn main() {
    let c = Circle::new(5.0);
    println!("Area: {}", c.area());
    println!("Circumference: {}", c.circumference());
}
