import * as vscode from 'vscode';

export interface CodeBlock {
    range: vscode.Range;
    code: string;
    language: string;
    blockId?: number;
    outputRange?: vscode.Range;  // Range of the associated output block (if exists)
    outputContent?: string;      // Content of the output block
}

/**
 * Find all Python code blocks in a markdown document
 * Also detects associated ````Output blocks directly after
 */
export function findPythonCodeBlocks(document: vscode.TextDocument): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const text = document.getText();
    
    // Match ```python ... ``` blocks
    const regex = /```python\s*\n([\s\S]*?)```/g;
    let match;
    let blockId = 0;
    
    while ((match = regex.exec(text)) !== null) {
        blockId++;
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        
        const block: CodeBlock = {
            range: new vscode.Range(startPos, endPos),
            code: match[1].trim(),
            language: 'python',
            blockId: blockId
        };
        
        // Check for output block directly after (with optional whitespace)
        const afterCodeBlock = text.slice(endOffset);
        const outputMatch = afterCodeBlock.match(/^\s*\n````Output\s*\n([\s\S]*?)````/);
        
        if (outputMatch) {
            const outputStartOffset = endOffset + outputMatch.index!;
            const outputEndOffset = outputStartOffset + outputMatch[0].length;
            
            block.outputRange = new vscode.Range(
                document.positionAt(outputStartOffset),
                document.positionAt(outputEndOffset)
            );
            block.outputContent = outputMatch[1].trim();
        }
        
        blocks.push(block);
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
 * Find a code block by its blockId
 */
export function findCodeBlockById(
    document: vscode.TextDocument,
    blockId: number
): CodeBlock | undefined {
    const blocks = findPythonCodeBlocks(document);
    return blocks.find(block => block.blockId === blockId);
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
                arguments: [block.code, block.blockId]
            });
            codeLenses.push(codeLens);
        }

        return codeLenses;
    }
}
