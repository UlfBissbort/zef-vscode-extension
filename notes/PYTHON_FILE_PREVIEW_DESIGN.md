# Python File Preview Support Design

## Overview

Add Zef preview support for `.py` files, allowing Cmd+Shift+V to open a rendered view with markdown documentation and syntax-highlighted code blocks.

## Motivation

Python files can contain rich documentation in docstrings. With a special `"""md` marker, developers can embed full markdown (including LaTeX, Mermaid, Excalidraw) directly in their Python files and see it rendered beautifully.

## File Format

### Standard Python File
```python
"""md
# My Analysis Module

This module provides tools for data analysis.
"""

import pandas as pd

def analyze(data):
    """md
    ## Analysis Function
    
    Computes statistics on the input data.
    
    $$\bar{x} = \frac{1}{n}\sum_{i=1}^n x_i$$
    """
    return data.describe()
```

### Rendered Preview
The above renders as:
1. H1 "My Analysis Module" with description
2. Python code block: `import pandas as pd`
3. H2 "Analysis Function" with LaTeX formula
4. Python code block: `def analyze(data): ...`

## Implementation Strategy

### Phase 1: Read-Only Preview (MVP)

#### 1. Document Type Detection

Update `src/zefDocument.ts`:

```typescript
export function isZefDocument(document: vscode.TextDocument): boolean {
    if (document.fileName.endsWith('.zef.md')) return true;
    if (document.fileName.endsWith('.py')) return true;  // NEW
    if (document.fileName.endsWith('.md')) {
        const config = vscode.workspace.getConfiguration('zef');
        return config.get<boolean>('treatAllMarkdownAsZef', false);
    }
    return false;
}

export function isZefPythonFile(document: vscode.TextDocument): boolean {
    return document.fileName.endsWith('.py');
}
```

#### 2. Python to Markdown Converter

New function in `src/previewPanel.ts`:

```typescript
/**
 * Converts Python source code to markdown for preview rendering.
 * 
 * Segments marked with """md ... """ are extracted as markdown.
 * All other code is wrapped in ```python fenced blocks.
 * 
 * @param pythonSource The Python file content
 * @returns Markdown string suitable for renderMarkdown()
 */
function convertPythonToMarkdown(pythonSource: string): string {
    const lines = pythonSource.split('\n');
    const segments: Array<{type: 'code' | 'markdown', content: string[]}> = [];
    
    let currentType: 'code' | 'markdown' = 'code';
    let currentContent: string[] = [];
    
    for (const line of lines) {
        if (currentType === 'code') {
            // Check for """md at start of line (allowing leading whitespace)
            if (line.trimStart().startsWith('"""md')) {
                // Save current code segment if non-empty
                if (currentContent.some(l => l.trim())) {
                    segments.push({ type: 'code', content: currentContent });
                }
                currentContent = [];
                currentType = 'markdown';
                
                // If there's content after """md on same line, include it
                const afterMarker = line.substring(line.indexOf('"""md') + 5);
                if (afterMarker.trim()) {
                    currentContent.push(afterMarker);
                }
            } else {
                currentContent.push(line);
            }
        } else {
            // In markdown mode - look for closing """
            const closingIndex = line.indexOf('"""');
            if (closingIndex !== -1) {
                // Include content before the closing """
                const beforeClosing = line.substring(0, closingIndex);
                if (beforeClosing.trim()) {
                    currentContent.push(beforeClosing);
                }
                
                // Save markdown segment
                if (currentContent.length > 0) {
                    segments.push({ type: 'markdown', content: currentContent });
                }
                currentContent = [];
                currentType = 'code';
                
                // If there's code after """ on same line, include it
                const afterClosing = line.substring(closingIndex + 3);
                if (afterClosing.trim()) {
                    currentContent.push(afterClosing);
                }
            } else {
                currentContent.push(line);
            }
        }
    }
    
    // Don't forget the last segment
    if (currentContent.some(l => l.trim())) {
        segments.push({ type: currentType, content: currentContent });
    }
    
    // Convert segments to markdown
    let result = '';
    for (const segment of segments) {
        if (segment.type === 'markdown') {
            result += segment.content.join('\n') + '\n\n';
        } else {
            result += '```python\n' + segment.content.join('\n') + '\n```\n\n';
        }
    }
    
    return result;
}
```

#### 3. Integration in updatePreview()

Modify `updatePreview()` to detect Python files:

```typescript
async function updatePreview() {
    if (!panel || !currentDocument) return;
    
    let sourceText = currentDocument.getText();
    
    // Convert Python files to markdown representation
    if (currentDocument.fileName.endsWith('.py')) {
        sourceText = convertPythonToMarkdown(sourceText);
    }
    
    // Rest of existing logic...
    const cleanText = stripFrontmatter(sourceText);
    // ...
}
```

### Phase 2: Code Execution (Future)

Once preview works, add execution support:

1. **Code Block Identification**: Track which Python segments correspond to which code blocks
2. **Result Storage Format**: 
   ```python
   """Result
   42
   """
   """Side Effects
   [ET.UnmanagedEffect(what='stdout', content='Hello')]
   """
   ```
3. **Write-back Logic**: Insert result blocks after executed code segments
4. **Run Button**: Show CodeLens "Run" buttons for Python segments

### Phase 3: Enhanced Features (Future)

- Cell-based execution (Jupyter-style)
- Inline output display
- Variable inspector
- Import tracking

## Testing Plan

1. **Basic Rendering**
   - Python file with no `"""md` blocks → single code block
   - Python file with `"""md` at top → markdown + code
   - Interleaved `"""md` and code → proper alternation

2. **Edge Cases**
   - Empty `"""md""" ` blocks
   - `"""md` inside a string literal (should NOT trigger)
   - Nested triple quotes (docstrings inside functions)
   - Unicode in markdown sections

3. **Preservation**
   - Existing `.zef.md` behavior unchanged
   - All markdown features work (LaTeX, Mermaid, Excalidraw)

## Files to Modify

| File | Changes |
|------|---------|
| `src/zefDocument.ts` | Add `.py` to `isZefDocument()`, add `isZefPythonFile()` |
| `src/previewPanel.ts` | Add `convertPythonToMarkdown()`, modify `updatePreview()` |
| `package.json` | Add `.py` to activation events (if needed) |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positive `"""md` detection | Require it at line start (after whitespace only) |
| Breaking existing `.zef.md` | Conditional branch, `.py` uses converter, `.md` doesn't |
| Performance on large files | Lazy parsing, only on preview open |
| Confusion with regular docstrings | Document that `"""md` is special |

## Alternatives Considered

1. **Separate Preview Command**: `zef.openPythonPreview` 
   - Rejected: inconsistent UX, same keybinding should work

2. **Sidecar `.py.md` File**: Markdown alongside Python
   - Rejected: requires two files, loses co-location benefit

3. **Parse All Docstrings as Markdown**
   - Rejected: would render regular docstrings incorrectly

## Decision

Proceed with the `"""md` marker approach as it:
- Is explicit and opt-in
- Reuses existing infrastructure
- Provides clear visual distinction
- Can be incrementally enhanced
