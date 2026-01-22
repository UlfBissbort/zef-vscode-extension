import * as vscode from 'vscode';
import { isZefDocument } from './zefUtils';

// Diagnostic collection for JSON validation errors
let jsonDiagnostics: vscode.DiagnosticCollection;

/**
 * Interface representing a JSON code block in the document
 */
interface JsonCodeBlock {
    range: vscode.Range;
    code: string;
    codeStartLine: number;  // Line where the actual JSON content starts (after ```)
    codeStartOffset: number; // Offset where JSON content starts within the document
}

/**
 * Find all JSON code blocks in a markdown document
 */
function findJsonBlocks(document: vscode.TextDocument): JsonCodeBlock[] {
    const blocks: JsonCodeBlock[] = [];
    const text = document.getText();
    
    // Match ```json ... ``` or ```JSON ... ``` blocks
    const regex = /```[jJ][sS][oO][nN]\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        const blockStartOffset = match.index;
        const codeContent = match[1];
        
        // Find where the actual JSON content starts (after the opening ``` line)
        const openingLine = text.slice(blockStartOffset).indexOf('\n') + 1;
        const codeStartOffset = blockStartOffset + openingLine;
        
        const startPos = document.positionAt(blockStartOffset);
        const endPos = document.positionAt(match.index + match[0].length);
        const codeStartPos = document.positionAt(codeStartOffset);
        
        blocks.push({
            range: new vscode.Range(startPos, endPos),
            code: codeContent,
            codeStartLine: codeStartPos.line,
            codeStartOffset: codeStartOffset
        });
    }
    
    return blocks;
}

/**
 * Parse JSON.parse error message to extract position
 * Error messages are typically like:
 * - "Unexpected token x in JSON at position Y"
 * - "Unexpected end of JSON input"
 */
function parseJsonError(error: SyntaxError, code: string): { line: number; column: number; message: string } {
    const message = error.message;
    
    // Try to extract position from error message
    const posMatch = message.match(/at position (\d+)/);
    
    if (posMatch) {
        const position = parseInt(posMatch[1], 10);
        
        // Convert offset to line/column
        const lines = code.slice(0, position).split('\n');
        const line = lines.length - 1;
        const column = lines[lines.length - 1].length;
        
        return { line, column, message };
    }
    
    // For "Unexpected end of JSON input", point to the end
    if (message.includes('end of JSON')) {
        const lines = code.split('\n');
        const lastLine = lines.length - 1;
        const lastColumn = lines[lastLine].length;
        return { line: lastLine, column: lastColumn, message };
    }
    
    // Default to start of block
    return { line: 0, column: 0, message };
}

/**
 * Validate JSON blocks in a document and report diagnostics
 */
export function validateJsonBlocks(document: vscode.TextDocument): void {
    if (!jsonDiagnostics) {
        return;
    }
    
    // Only validate Zef documents
    if (!isZefDocument(document)) {
        jsonDiagnostics.delete(document.uri);
        return;
    }
    
    const diagnostics: vscode.Diagnostic[] = [];
    const blocks = findJsonBlocks(document);
    
    for (const block of blocks) {
        const code = block.code.trim();
        
        // Skip empty blocks
        if (!code) {
            continue;
        }
        
        try {
            JSON.parse(code);
            // Valid JSON - no diagnostic needed
        } catch (error) {
            if (error instanceof SyntaxError) {
                const errorInfo = parseJsonError(error, code);
                
                // Calculate the absolute position in the document
                // errorInfo.line is relative to the code block content
                const absoluteLine = block.codeStartLine + errorInfo.line;
                
                // Create a range for the error
                // Highlight from the error position to end of line, or just a few characters
                const lineText = document.lineAt(absoluteLine).text;
                const startColumn = errorInfo.column;
                const endColumn = Math.min(startColumn + 10, lineText.length);
                
                const range = new vscode.Range(
                    absoluteLine,
                    startColumn,
                    absoluteLine,
                    endColumn
                );
                
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Invalid JSON: ${errorInfo.message}`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.source = 'zef-json';
                
                diagnostics.push(diagnostic);
            }
        }
    }
    
    jsonDiagnostics.set(document.uri, diagnostics);
}

/**
 * Initialize the JSON validator
 */
export function initJsonValidator(context: vscode.ExtensionContext): void {
    // Create diagnostic collection
    jsonDiagnostics = vscode.languages.createDiagnosticCollection('zef-json');
    context.subscriptions.push(jsonDiagnostics);
    
    // Validate on document open
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            validateJsonBlocks(document);
        })
    );
    
    // Validate on document change (with debounce built into VS Code)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            validateJsonBlocks(event.document);
        })
    );
    
    // Validate on document save
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            validateJsonBlocks(document);
        })
    );
    
    // Clear diagnostics when document closes
    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(document => {
            jsonDiagnostics.delete(document.uri);
        })
    );
    
    // Validate all currently open Zef documents
    vscode.workspace.textDocuments.forEach(document => {
        validateJsonBlocks(document);
    });
}

/**
 * Dispose the JSON validator resources
 */
export function disposeJsonValidator(): void {
    if (jsonDiagnostics) {
        jsonDiagnostics.dispose();
    }
}
