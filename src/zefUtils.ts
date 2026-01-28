import * as vscode from 'vscode';

/**
 * Check if a document should be treated as a Zef markdown document.
 * Returns true for .zef.md files, .py files with """md blocks, .rs files with /*md blocks,
 * and also for regular .md files when the zef.treatAllMarkdownAsZef setting is enabled.
 */
export function isZefDocument(document: vscode.TextDocument): boolean {
    if (document.fileName.endsWith('.zef.md')) return true;
    if (document.fileName.endsWith('.py')) return true;
    if (document.fileName.endsWith('.rs')) return true;
    if (document.fileName.endsWith('.md')) {
        const config = vscode.workspace.getConfiguration('zef');
        return config.get<boolean>('treatAllMarkdownAsZef', false);
    }
    return false;
}

/**
 * Check if a document is a Python file that can be previewed.
 */
export function isZefPythonFile(document: vscode.TextDocument): boolean {
    return document.fileName.endsWith('.py');
}

/**
 * Check if a document is a Rust file that can be previewed.
 */
export function isZefRustFile(document: vscode.TextDocument): boolean {
    return document.fileName.endsWith('.rs');
}

/**
 * Check if a URI should be treated as a Zef markdown file.
 * Used for file decorations and other URI-based checks.
 */
export function isZefUri(uri: vscode.Uri): boolean {
    if (uri.fsPath.endsWith('.zef.md')) return true;
    if (uri.fsPath.endsWith('.py')) return true;
    if (uri.fsPath.endsWith('.rs')) return true;
    if (uri.fsPath.endsWith('.md')) {
        const config = vscode.workspace.getConfiguration('zef');
        return config.get<boolean>('treatAllMarkdownAsZef', false);
    }
    return false;
}
