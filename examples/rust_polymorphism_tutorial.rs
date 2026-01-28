/*md
# Polymorphism in Rust: Enums vs Traits

A practical guide to choosing between **runtime** and **compile-time** polymorphism.

## Overview

Rust offers two main approaches to polymorphism:

```mermaid
graph TB
    P[Polymorphism in Rust] --> E[Enums]
    P --> T[Traits]
    E --> ED[Runtime Dispatch]
    E --> EC[Closed Set of Types]
    T --> TS[Static Dispatch]
    T --> TD[Dynamic Dispatch]
    T --> TO[Open to Extension]
    
    style E fill:#667eea,color:#fff
    style T fill:#10b981,color:#fff
```

| Approach | When to Use |
|----------|------------|
| **Enums** | Known, fixed set of variants |
| **Traits (static)** | Zero-cost abstraction, generics |
| **Traits (dynamic)** | Heterogeneous collections |
*/

/*md
## Part 1: Enum-Based Polymorphism

Enums are perfect when you have a **closed set** of types known at compile time.

### The Problem

We want to represent different shapes and calculate their areas.
*/

#[derive(Debug)]
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
            Shape::Rectangle { width, height } => width * height,
            Shape::Triangle { base, height } => 0.5 * base * height,
        }
    }
    
    fn name(&self) -> &'static str {
        match self {
            Shape::Circle { .. } => "Circle",
            Shape::Rectangle { .. } => "Rectangle",
            Shape::Triangle { .. } => "Triangle",
        }
    }
}

/*md
### Enum Dispatch in Action

The `match` statement gives us exhaustive pattern matching:
*/

fn print_areas_enum(shapes: &[Shape]) {
    for shape in shapes {
        println!("{}: area = {:.2}", shape.name(), shape.area());
    }
}

/*md
## Part 2: Trait-Based Polymorphism

Traits allow an **open set** of types—anyone can implement your trait.

### Defining the Trait
*/

trait Drawable {
    fn area(&self) -> f64;
    fn name(&self) -> &'static str;
}

/*md
### Implementing for Concrete Types
*/

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Drawable for Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }
    
    fn name(&self) -> &'static str {
        "Circle"
    }
}

impl Drawable for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
    
    fn name(&self) -> &'static str {
        "Rectangle"
    }
}

/*md
### Static Dispatch (Generics)

**Zero-cost abstraction**—the compiler generates specialized code for each type.

```mermaid
graph LR
    G[Generic Function] --> M[Monomorphization]
    M --> C1[print_area for Circle]
    M --> C2[print_area for Rectangle]
    
    style M fill:#f59e0b,color:#fff
```
*/

fn print_area_static<T: Drawable>(shape: &T) {
    println!("{}: area = {:.2}", shape.name(), shape.area());
}

/*md
### Dynamic Dispatch (Trait Objects)

Use `dyn Trait` when you need **heterogeneous collections**.

$$\text{Cost} = \text{vtable lookup} \approx \text{one pointer indirection}$$
*/

fn print_areas_dynamic(shapes: &[&dyn Drawable]) {
    for shape in shapes {
        println!("{}: area = {:.2}", shape.name(), shape.area());
    }
}

/*md
## Part 3: Comparison

```mermaid
graph TB
    subgraph Enums
        E1[✓ Pattern matching]
        E2[✓ Data + behavior together]
        E3[✗ Closed to extension]
    end
    
    subgraph Traits
        T1[✓ Open to extension]
        T2[✓ Zero-cost with generics]
        T3[✓ Trait objects for flexibility]
    end
    
    style Enums fill:#667eea,color:#fff
    style Traits fill:#10b981,color:#fff
```
*/

/*md
## Running the Examples
*/

fn main() {
    // Enum approach
    let enum_shapes = vec![
        Shape::Circle { radius: 5.0 },
        Shape::Rectangle { width: 4.0, height: 3.0 },
        Shape::Triangle { base: 6.0, height: 4.0 },
    ];
    
    println!("=== Enum Dispatch ===");
    print_areas_enum(&enum_shapes);
    
    // Trait approach - static dispatch
    println!("\n=== Static Dispatch ===");
    let circle = Circle { radius: 5.0 };
    let rect = Rectangle { width: 4.0, height: 3.0 };
    print_area_static(&circle);
    print_area_static(&rect);
    
    // Trait approach - dynamic dispatch
    println!("\n=== Dynamic Dispatch ===");
    let trait_shapes: Vec<&dyn Drawable> = vec![&circle, &rect];
    print_areas_dynamic(&trait_shapes);
}

/*md
## Key Takeaways

1. **Use enums** when variants are known and fixed
2. **Use traits + generics** for zero-cost polymorphism
3. **Use trait objects** when you need heterogeneous collections
4. The choice depends on your extensibility needs and performance requirements
*/
