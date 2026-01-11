import * as vscode from 'vscode';

export interface CodeBlock {
    range: vscode.Range;
    code: string;
    language: string;
    blockId?: number;
    resultRange?: vscode.Range;       // Range of the associated Result block (if exists)
    resultContent?: string;           // Content of the Result block
    sideEffectsRange?: vscode.Range;  // Range of the Side Effects block (if exists)
    sideEffectsContent?: string;      // Content of the Side Effects block
}

/**
 * Find all Python code blocks in a markdown document
 * Also detects associated ````Result and ````Side Effects blocks
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
        
        // Look for Result and Side Effects blocks after the code block
        // They can appear in any order, both are optional
        let searchOffset = endOffset;
        const afterCodeBlock = text.slice(endOffset);
        
        // Check for Result block (with optional whitespace before)
        const resultMatch = afterCodeBlock.match(/^\s*\n````(?:Result|Output)\s*\n([\s\S]*?)````/);
        if (resultMatch) {
            const resultStartOffset = endOffset + resultMatch.index!;
            const resultEndOffset = resultStartOffset + resultMatch[0].length;
            
            block.resultRange = new vscode.Range(
                document.positionAt(resultStartOffset),
                document.positionAt(resultEndOffset)
            );
            block.resultContent = resultMatch[1].trim();
            searchOffset = resultEndOffset;
        }
        
        // Check for Side Effects block (after Result block if present)
        const afterResult = text.slice(searchOffset);
        const sideEffectsMatch = afterResult.match(/^\s*\n````Side Effects\s*\n([\s\S]*?)````/);
        if (sideEffectsMatch) {
            const seStartOffset = searchOffset + sideEffectsMatch.index!;
            const seEndOffset = seStartOffset + sideEffectsMatch[0].length;
            
            block.sideEffectsRange = new vscode.Range(
                document.positionAt(seStartOffset),
                document.positionAt(seEndOffset)
            );
            block.sideEffectsContent = sideEffectsMatch[1].trim();
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
