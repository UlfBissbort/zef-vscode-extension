import * as vscode from 'vscode';

export interface CodeBlock {
    range: vscode.Range;
    code: string;
    language: string;
}

/**
 * Find all Python code blocks in a markdown document
 */
export function findPythonCodeBlocks(document: vscode.TextDocument): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const text = document.getText();
    
    // Match ```python ... ``` blocks
    const regex = /```python\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        
        blocks.push({
            range: new vscode.Range(startPos, endPos),
            code: match[1].trim(),
            language: 'python'
        });
    }
    
    return blocks;
}

/**
 * Find the code block at the given position
 */
export function findCodeBlockAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): CodeBlock | undefined {
    const blocks = findPythonCodeBlocks(document);
    return blocks.find(block => block.range.contains(position));
}

/**
 * CodeLens provider that adds "▶ Run" above each Python code block
 */
export class CodeBlockProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        // Refresh code lenses when document changes
        vscode.workspace.onDidChangeTextDocument(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    provideCodeLenses(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.CodeLens[] {
        const codeLenses: vscode.CodeLens[] = [];
        const blocks = findPythonCodeBlocks(document);

        for (const block of blocks) {
            // Place CodeLens at the start of the code block (the ```python line)
            const codeLens = new vscode.CodeLens(block.range, {
                title: '▶ Run',
                command: 'zef.runBlock',
                arguments: [block.code]
            });
            codeLenses.push(codeLens);
        }

        return codeLenses;
    }
}
