/**
 * Pure functions for generating Jupyter Notebook (.ipynb) files.
 * 
 * No side effects, no vscode imports. String/data in, string out.
 */

/**
 * A cell suitable for notebook export.
 */
export interface NotebookCell {
    type: 'code' | 'markdown';
    content: string;
}

/**
 * Converts a content string into the ipynb source array format.
 * Each line ends with '\n' except the last.
 */
function toSourceArray(content: string): string[] {
    const lines = content.split('\n');
    return lines.map((line, i) => i < lines.length - 1 ? line + '\n' : line);
}

/**
 * Generates a Jupyter Notebook JSON string from an array of cells.
 * 
 * Pure function: cells in, JSON string out.
 * No execution results are included — only source code and markdown.
 * 
 * @param cells Array of cells with type ('code' | 'markdown') and content
 * @returns Pretty-printed JSON string of the .ipynb file
 */
export function generateNotebook(cells: NotebookCell[]): string {
    const nbCells = cells
        .filter(cell => cell.content.trim().length > 0)
        .map(cell => {
            if (cell.type === 'code') {
                return {
                    cell_type: 'code',
                    metadata: {},
                    source: toSourceArray(cell.content.trim()),
                    execution_count: null,
                    outputs: []
                };
            } else {
                return {
                    cell_type: 'markdown',
                    metadata: {},
                    source: toSourceArray(cell.content.trim())
                };
            }
        });

    const notebook = {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {
            kernelspec: {
                display_name: 'Python 3',
                language: 'python',
                name: 'python3'
            },
            language_info: {
                name: 'python',
                version: '3.11.0'
            }
        },
        cells: nbCells
    };

    return JSON.stringify(notebook, null, 1);
}

/**
 * Parses a markdown document into cells for notebook export.
 * 
 * Fenced code blocks (```python, ```rust, etc.) become code cells.
 * Everything between code blocks becomes markdown cells.
 * Result, Side Effects, and rendered-html output blocks are skipped.
 * 
 * Pure function: markdown string in, NotebookCell[] out.
 */
export function parseMarkdownCells(markdown: string): NotebookCell[] {
    const lines = markdown.split('\n');
    const cells: NotebookCell[] = [];
    let currentMarkdown: string[] = [];
    let currentCode: string[] = [];
    let inCodeBlock = false;
    let inOutputBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();

        if (inOutputBlock) {
            // Skip output blocks (````Result, ````Side Effects, ````rendered-html)
            if (trimmed.startsWith('````')) {
                inOutputBlock = false;
            }
            continue;
        }

        if (inCodeBlock) {
            if (trimmed === '```') {
                // End of code block
                cells.push({ type: 'code', content: currentCode.join('\n') });
                currentCode = [];
                inCodeBlock = false;
            } else {
                currentCode.push(line);
            }
            continue;
        }

        // Check for output block start (````Result, ````Side Effects, ````rendered-html)
        if (trimmed.startsWith('````')) {
            inOutputBlock = true;
            // Flush any pending markdown
            if (currentMarkdown.length > 0) {
                const md = currentMarkdown.join('\n');
                if (md.trim()) {
                    cells.push({ type: 'markdown', content: md });
                }
                currentMarkdown = [];
            }
            continue;
        }

        // Check for code block start (```python, ```rust, etc.)
        const codeMatch = trimmed.match(/^```(\w+)/);
        if (codeMatch) {
            // Flush any pending markdown
            if (currentMarkdown.length > 0) {
                const md = currentMarkdown.join('\n');
                if (md.trim()) {
                    cells.push({ type: 'markdown', content: md });
                }
                currentMarkdown = [];
            }
            codeLanguage = codeMatch[1];
            inCodeBlock = true;
            currentCode = [];
            continue;
        }

        // Regular markdown line
        currentMarkdown.push(line);
    }

    // Flush remaining markdown
    if (currentMarkdown.length > 0) {
        const md = currentMarkdown.join('\n');
        if (md.trim()) {
            cells.push({ type: 'markdown', content: md });
        }
    }

    return cells;
}

/**
 * Parses a Python file with #%% cell delimiters into notebook cells.
 * Reuses the same logic as the preview panel's parsePyCells.
 * 
 * Pure function: Python source in, NotebookCell[] out.
 */
export function parsePythonCells(source: string): NotebookCell[] {
    const lines = source.split('\n');
    const cells: NotebookCell[] = [];
    let currentLines: string[] = [];

    function flushCell() {
        if (currentLines.length > 0) {
            const content = currentLines.join('\n');
            const trimmed = content.trim();

            // Check if it's a markdown cell (only a triple-quoted string)
            for (const quote of ['"""', "'''"]) {
                if (trimmed.startsWith(quote) && trimmed.endsWith(quote) && trimmed.length > 6) {
                    cells.push({ type: 'markdown', content: trimmed.slice(3, -3) });
                    currentLines = [];
                    return;
                }
            }

            // Otherwise it's a code cell
            if (trimmed.length > 0) {
                cells.push({ type: 'code', content: content });
            }
            currentLines = [];
        }
    }

    for (const line of lines) {
        if (/^#\s*%%/.test(line.trimStart())) {
            flushCell();
        } else {
            currentLines.push(line);
        }
    }
    flushCell();

    return cells;
}

/**
 * Parses a Python file with """md block markers into notebook cells.
 * Falls back for files without #%% delimiters.
 * 
 * Pure function: Python source in, NotebookCell[] out.
 */
export function parsePythonLegacyCells(source: string): NotebookCell[] {
    const lines = source.split('\n');
    const cells: NotebookCell[] = [];
    let currentType: 'code' | 'markdown' = 'code';
    let currentContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (currentType === 'code') {
            const trimmed = line.trimStart();
            if (trimmed.startsWith('"""md') || trimmed.startsWith("'''md")) {
                // Flush code
                const code = currentContent.join('\n');
                if (code.trim()) {
                    cells.push({ type: 'code', content: code });
                }
                currentContent = [];
                currentType = 'markdown';

                const quoteType = trimmed.startsWith('"""md') ? '"""md' : "'''md";
                const afterMarker = trimmed.substring(quoteType.length);
                if (afterMarker.trim()) {
                    currentContent.push(afterMarker);
                }
            } else {
                currentContent.push(line);
            }
        } else {
            const closingIndex = line.indexOf('"""') !== -1 ? line.indexOf('"""') : line.indexOf("'''");
            if (closingIndex !== -1) {
                const beforeClosing = line.substring(0, closingIndex);
                if (beforeClosing.trim()) {
                    currentContent.push(beforeClosing);
                }
                const md = currentContent.join('\n');
                if (md.trim()) {
                    cells.push({ type: 'markdown', content: md });
                }
                currentContent = [];
                currentType = 'code';
            } else {
                currentContent.push(line);
            }
        }
    }

    // Flush remaining
    const remaining = currentContent.join('\n');
    if (remaining.trim()) {
        cells.push({ type: currentType, content: remaining });
    }

    return cells;
}
