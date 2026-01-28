"""md
# Zef Python File Preview Demo

This is a Python file with embedded markdown documentation!

Try pressing **Cmd+Shift+V** to see the rendered preview.

## Features

- LaTeX equations: $E = mc^2$
- Mermaid diagrams (below)
- Code with syntax highlighting

```mermaid
graph LR
    A[Python File] --> B["""md blocks]
    B --> C[Rendered Preview]
```
"""

import math
from dataclasses import dataclass

"""md
## Data Analysis Module

The quadratic formula:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
"""

@dataclass
class Point:
    x: float
    y: float

def distance(p1: Point, p2: Point) -> float:
    """md
    ### Distance Function
    
    Computes Euclidean distance between two points:
    
    $$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
    """
    return math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2)

"""md
## Example Usage
"""

if __name__ == "__main__":
    a = Point(0, 0)
    b = Point(3, 4)
    print(f"Distance: {distance(a, b)}")  # Should print 5.0
