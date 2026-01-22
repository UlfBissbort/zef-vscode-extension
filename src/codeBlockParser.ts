import * as vscode from 'vscode';
import { isZefDocument } from './zefUtils';

export interface CodeBlock {
    range: vscode.Range;
    code: string;
    language: string;                 // 'python', 'rust', 'javascript', 'js', 'typescript', 'ts', or 'svelte'
    blockId?: number;
    resultRange?: vscode.Range;       // Range of the associated Result block (if exists)
    resultContent?: string;           // Content of the Result block
    sideEffectsRange?: vscode.Range;  // Range of the Side Effects block (if exists)
    sideEffectsContent?: string;      // Content of the Side Effects block
    renderedHtmlRange?: vscode.Range; // Range of the rendered-html block (for svelte)
    renderedHtmlContent?: string;     // Content of the rendered-html block
}

/**
 * Find all code blocks (Python, Rust, JavaScript, TypeScript, Svelte) in a markdown document
 * Also detects associated ````Result, ````Side Effects, and ````rendered-html blocks
 */
export function findCodeBlocks(document: vscode.TextDocument): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const text = document.getText();
    
    // Match ```python ... ```, ```rust ... ```, ```javascript ... ```, ```js ... ```, 
    // ```typescript ... ```, ```ts ... ```, and ```svelte ... ``` blocks
    const regex = /```(python|rust|javascript|js|typescript|ts|svelte)\s*\n([\s\S]*?)```/g;
    let match;
    let blockId = 0;
    
    while ((match = regex.exec(text)) !== null) {
        blockId++;
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        const language = match[1];  // 'python' or 'rust'
        
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        
        const block: CodeBlock = {
            range: new vscode.Range(startPos, endPos),
            code: match[2].trim(),
            language: language,
            blockId: blockId
        };
        
        // Look for Result and Side Effects blocks after the code block
        // They can appear in any order, both are optional
        let searchOffset = endOffset;
        const afterCodeBlock = text.slice(endOffset);
        
        // For Svelte blocks, look for ````rendered-html block (4 backticks)
        if (language === 'svelte') {
            const renderedMatch = afterCodeBlock.match(/^\s*\n````rendered-html\s*\n([\s\S]*?)````/);
            if (renderedMatch) {
                const renderedStartOffset = endOffset + renderedMatch.index!;
                const renderedEndOffset = renderedStartOffset + renderedMatch[0].length;
                
                block.renderedHtmlRange = new vscode.Range(
                    document.positionAt(renderedStartOffset),
                    document.positionAt(renderedEndOffset)
                );
                block.renderedHtmlContent = renderedMatch[1].trim();
                searchOffset = renderedEndOffset;
            }
        } else {
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
    const blocks = findCodeBlocks(document);
    return blocks.find(block => block.range.contains(position));
}

/**
 * Find a code block by its blockId
 */
export function findCodeBlockById(
    document: vscode.TextDocument,
    blockId: number
): CodeBlock | undefined {
    const blocks = findCodeBlocks(document);
    return blocks.find(block => block.blockId === blockId);
}

/**
 * CodeLens provider that adds "▶ Run" above each code block (Python, Rust, JS/TS)
 * and "▶ Compile" above Svelte blocks
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
        // Only provide CodeLenses for Zef documents
        if (!isZefDocument(document)) {
            return [];
        }
        
        const codeLenses: vscode.CodeLens[] = [];
        const blocks = findCodeBlocks(document);

        for (const block of blocks) {
            // Place CodeLens at the start of the code block
            // Use different command for Svelte blocks
            if (block.language === 'svelte') {
                const codeLens = new vscode.CodeLens(block.range, {
                    title: '▶ Compile',
                    command: 'zef.compileSvelte',
                    arguments: [block.code, block.blockId]
                });
                codeLenses.push(codeLens);
            } else {
                const codeLens = new vscode.CodeLens(block.range, {
                    title: '▶ Run',
                    command: 'zef.runBlock',
                    arguments: [block.code, block.blockId, block.language]
                });
                codeLenses.push(codeLens);
            }
        }

        return codeLenses;
    }
}
