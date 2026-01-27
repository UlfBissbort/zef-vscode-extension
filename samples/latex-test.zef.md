# LaTeX Math Test

This document tests LaTeX equation rendering in Zef.

## Inline Math

Einstein's famous equation: $E = mc^2$

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$.

Greek letters work too: $\alpha, \beta, \gamma, \delta, \epsilon$.

## Display Math (Block Equations)

The Gaussian integral:

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

Matrix notation:

$$\begin{bmatrix} a & b \\ c & d \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} = \begin{bmatrix} ax + by \\ cx + dy \end{bmatrix}$$

Euler's identity:

$$e^{i\pi} + 1 = 0$$

## Code Blocks Should Not Render

This should show as code, not math:

```python
# This $x$ should not be rendered as math
price = "$5.00"
formula = "$E = mc^2$"
print(formula)
```

## Edge Cases

- Price: $5 (single dollar, not math)
- Inline code: `$x$` should not render
- Multiple on one line: $a^2$ and $b^2$ and $c^2$
