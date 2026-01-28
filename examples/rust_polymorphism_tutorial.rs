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


We can also illustrate the concepts with Excalidraw diagrams:
```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "uid": "mkxuxnk65hefxoe3n",
  "elements": [
    {
      "id": "QDPPvRVgz16GRwlbruY_0",
      "type": "rectangle",
      "x": 297.515625,
      "y": 468.5625,
      "width": 415.44531250000006,
      "height": 69.93359375,
      "angle": 0,
      "strokeColor": "#ada7a7",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a0",
      "roundness": {
        "type": 3
      },
      "seed": 966513295,
      "version": 57,
      "versionNonce": 2057685089,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594652002,
      "link": null,
      "locked": false
    },
    {
      "id": "v0oOoGOu7yGuDMpco2O6B",
      "type": "rectangle",
      "x": 315.203125,
      "y": 476.8359375,
      "width": 52.296875,
      "height": 50.4765625,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a1",
      "roundness": null,
      "seed": 75924353,
      "version": 85,
      "versionNonce": 1337340175,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594647051,
      "link": null,
      "locked": false
    },
    {
      "id": "Eu6KghuC8K-l7x0TpoFY3",
      "type": "rectangle",
      "x": 380.94112451149203,
      "y": 476.828125,
      "width": 52.313063477015895,
      "height": 50.49218749999996,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a2",
      "roundness": null,
      "seed": 1389128545,
      "version": 145,
      "versionNonce": 1594570543,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594647051,
      "link": null,
      "locked": false
    },
    {
      "id": "UaPfEMwzAKb7w2f8cJUTg",
      "type": "rectangle",
      "x": 446.27706201149203,
      "y": 476.828125,
      "width": 52.313063477015895,
      "height": 50.49218749999996,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a3",
      "roundness": null,
      "seed": 1405769537,
      "version": 187,
      "versionNonce": 1713011023,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594647051,
      "link": null,
      "locked": false
    },
    {
      "id": "e4y0LF5ojRUFMJt5-vs-k",
      "type": "rectangle",
      "x": 513.33203125,
      "y": 476.8359375,
      "width": 52.296875,
      "height": 50.4765625,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a4",
      "roundness": null,
      "seed": 1693648609,
      "version": 130,
      "versionNonce": 1190603361,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594648818,
      "link": null,
      "locked": false
    },
    {
      "id": "PiET4ub9o59KG_3PM8Gur",
      "type": "rectangle",
      "x": 579.070030761492,
      "y": 476.828125,
      "width": 52.313063477015895,
      "height": 50.49218749999996,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a5",
      "roundness": null,
      "seed": 2102437263,
      "version": 190,
      "versionNonce": 306525761,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594648818,
      "link": null,
      "locked": false
    },
    {
      "id": "1H0TiU2-DVHFlGgflnkJL",
      "type": "rectangle",
      "x": 644.405968261492,
      "y": 476.828125,
      "width": 52.313063477015895,
      "height": 50.49218749999996,
      "angle": 0,
      "strokeColor": "#846358",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "frameId": null,
      "index": "a6",
      "roundness": null,
      "seed": 498207425,
      "version": 232,
      "versionNonce": 61261345,
      "isDeleted": false,
      "boundElements": null,
      "updated": 1769594648818,
      "link": null,
      "locked": false
    }
  ],
  "appState": {
    "viewBackgroundColor": "#121212",
    "currentItemStrokeColor": "#846358",
    "currentItemBackgroundColor": "transparent",
    "currentItemFillStyle": "solid",
    "currentItemStrokeWidth": 2,
    "currentItemRoughness": 1,
    "currentItemOpacity": 100,
    "currentItemFontFamily": 5,
    "currentItemFontSize": 20,
    "currentItemTextAlign": "left",
    "currentItemRoundness": "sharp",
    "gridSize": 20
  },
  "files": {}
}
```

## Part 1: Enum-Based Polymorphism

Enums are perfect when you have a **closed set** of types known at compile time.

### Algebraic Data Types: The Mathematics

Rust enums are **sum types**. The cardinality (number of possible values) is:

$$|A + B + C| = |A| + |B| + |C|$$

For our `Shape` enum:
- `Circle` carries 1 `f64` (radius)
- `Rectangle` carries 2 `f64`s (width, height)  
- `Triangle` carries 2 `f64`s (base, height)

The **discriminant** (tag) tells us which variant we have. Memory layout:

$$\text{size}(\text{Shape}) = \text{size}(\text{tag}) + \max(\text{size}(\text{Circle}), \text{size}(\text{Rectangle}), \text{size}(\text{Triangle}))$$

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

### How VTables Work

A trait object `&dyn Drawable` is a **fat pointer** with two components:

```mermaid
graph LR
    subgraph "Fat Pointer (&dyn Drawable)"
        P1[data_ptr] 
        P2[vtable_ptr]
    end
    
    subgraph "Circle Instance"
        D[radius: 5.0]
    end
    
    subgraph "VTable for Circle"
        V1["drop()"]
        V2["size: 8"]
        V3["align: 8"]
        V4["area() → 0x7f42"]
        V5["name() → 0x7f56"]
    end
    
    P1 --> D
    P2 --> V1
    
    style P1 fill:#667eea,color:#fff
    style P2 fill:#10b981,color:#fff
    style V4 fill:#f59e0b,color:#fff
    style V5 fill:#f59e0b,color:#fff
```

Each type implementing `Drawable` gets its own vtable (generated at compile time):

$$\text{vtable} = [\text{drop}, \text{size}, \text{align}, \text{area}_{\text{impl}}, \text{name}_{\text{impl}}]$$

The runtime cost is one pointer indirection per method call:

$$\text{Cost}_{\text{dynamic}} = \text{Cost}_{\text{static}} + O(1) \text{ vtable lookup}$$
*/

fn print_areas_dynamic(shapes: &[&dyn Drawable]) {
    for shape in shapes {
        println!("{}: area = {:.2}", shape.name(), shape.area());
    }
}

/*md
## Part 3: Comparison

### Memory Layout Comparison

```mermaid
graph TB
    subgraph "Enum: Vec&lt;Shape&gt;"
        direction LR
        E1["[tag|radius]"]
        E2["[tag|w|h]"]
        E3["[tag|b|h]"]
    end
    
    subgraph "Trait Objects: Vec&lt;&dyn Drawable&gt;"
        direction LR
        T1["[ptr|vptr]"]
        T2["[ptr|vptr]"]
    end
    
    subgraph "Heap Data"
        H1["Circle{r}"]
        H2["Rect{w,h}"]
    end
    
    T1 --> H1
    T2 --> H2
    
    style E1 fill:#667eea,color:#fff
    style E2 fill:#667eea,color:#fff
    style E3 fill:#667eea,color:#fff
    style T1 fill:#10b981,color:#fff
    style T2 fill:#10b981,color:#fff
```

| Property | Enum | Trait Object |
|----------|------|--------------|
| **Memory** | Inline, size of largest variant | Fat pointer (16 bytes on 64-bit) |
| **Cache** | Contiguous, cache-friendly | Pointer chasing, less cache-friendly |
| **Extension** | Closed (modify enum) | Open (impl Trait) |

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
