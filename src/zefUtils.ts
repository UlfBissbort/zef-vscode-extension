import * as vscode from 'vscode';

/**
 * Check if a document should be treated as a Zef markdown document.
 * Returns true for .zef.md files, and also for regular .md files when
 * the zef.treatAllMarkdownAsZef setting is enabled.
 */
export function isZefDocument(document: vscode.TextDocument): boolean {
    if (document.fileName.endsWith('.zef.md')) return true;
    if (document.fileName.endsWith('.md')) {
        const config = vscode.workspace.getConfiguration('zef');
        return config.get<boolean>('treatAllMarkdownAsZef', false);
    }
    return false;
}

/**
 * Check if a URI should be treated as a Zef markdown file.
 * Used for file decorations and other URI-based checks.
 */
export function isZefUri(uri: vscode.Uri): boolean {
    if (uri.fsPath.endsWith('.zef.md')) return true;
    if (uri.fsPath.endsWith('.md')) {
        const config = vscode.workspace.getConfiguration('zef');
        return config.get<boolean>('treatAllMarkdownAsZef', false);
    }
    return false;
}
