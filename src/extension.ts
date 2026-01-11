import * as vscode from 'vscode';
import { CodeBlockProvider, findCodeBlockAtPosition, findPythonCodeBlocks } from './codeBlockParser';
import { createPreviewPanel, updatePreview, getPanel } from './previewPanel';

let terminal: vscode.Terminal | undefined;

// Decoration type for highlighting Python code blocks with a gray background
const codeBlockDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    isWholeLine: true,
    borderRadius: '3px',
});

function updateDecorations(editor: vscode.TextEditor) {
    if (!editor.document.fileName.endsWith('.zef.md')) {
        return;
    }

    const blocks = findPythonCodeBlocks(editor.document);
    const decorations: vscode.DecorationOptions[] = blocks.map(block => ({
        range: block.range,
    }));

    editor.setDecorations(codeBlockDecorationType, decorations);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Zef extension activated');

    // Register CodeLens provider for .zef.md files
    const codeLensProvider = new CodeBlockProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { pattern: '**/*.zef.md' },
            codeLensProvider
        )
    );

    // Apply decorations to active editor on activation
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    // Update decorations when active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateDecorations(editor);
            }
        })
    );

    // Update decorations when document changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (editor && event.document === editor.document) {
                updateDecorations(editor);
                // Also update preview panel if open
                if (getPanel() && editor.document.fileName.endsWith('.zef.md')) {
                    updatePreview(editor.document);
                }
            }
        })
    );

    // Register command to run a specific code block
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlock', (code: string) => {
            runCode(code);
        })
    );

    // Register command to run code block at cursor
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlockAtCursor', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // Only work in .zef.md files
            if (!editor.document.fileName.endsWith('.zef.md')) {
                vscode.window.showWarningMessage('Zef: Only works in .zef.md files');
                return;
            }

            const block = findCodeBlockAtPosition(editor.document, editor.selection.active);
            if (block) {
                runCode(block.code);
            } else {
                vscode.window.showWarningMessage('Zef: Cursor is not inside a Python code block');
            }
        })
    );

    // Register command to open preview panel
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.openPreview', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !editor.document.fileName.endsWith('.zef.md')) {
                vscode.window.showWarningMessage('Zef: Open a .zef.md file first');
                return;
            }
            createPreviewPanel(context);
        })
    );
}

function runCode(code: string) {
    // Get or create terminal
    if (!terminal || terminal.exitStatus !== undefined) {
        terminal = vscode.window.createTerminal('Zef Python');
    }
    terminal.show();
    terminal.sendText(code);
}

export function deactivate() {
    if (terminal) {
        terminal.dispose();
    }
}
