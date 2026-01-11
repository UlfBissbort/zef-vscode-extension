import * as vscode from 'vscode';
import { CodeBlockProvider, findCodeBlockAtPosition, findPythonCodeBlocks, findCodeBlockById } from './codeBlockParser';
import { createPreviewPanel, updatePreview, getPanel, scrollPreviewToLine, sendCellResult, setOnRunCode } from './previewPanel';
import { getKernelManager, disposeKernelManager, CellResult } from './kernelManager';
import { getPythonPath, showPythonPicker, showSettingsPanel, setDefaultPython } from './configManager';

let statusBarItem: vscode.StatusBarItem;

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

function updateStatusBar() {
    const pythonPath = getPythonPath();
    if (pythonPath) {
        // Show just the venv name or python version
        const parts = pythonPath.split('/');
        const venvName = parts[parts.length - 3]; // e.g., venv from /path/to/venv/bin/python
        statusBarItem.text = `$(snake) ${venvName}`;
        statusBarItem.tooltip = `Zef Python: ${pythonPath}\nClick to change`;
    } else {
        statusBarItem.text = '$(snake) Select Python';
        statusBarItem.tooltip = 'Click to select Python interpreter for Zef';
    }
    statusBarItem.show();
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Zef extension activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'zef.settings';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

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

    // Sync scroll from editor to preview
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            if (getPanel() && event.textEditor.document.fileName.endsWith('.zef.md')) {
                const visibleRange = event.visibleRanges[0];
                if (visibleRange) {
                    // Scroll preview to the first visible line
                    scrollPreviewToLine(visibleRange.start.line);
                }
            }
        })
    );

    // Update status bar when config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('zef')) {
                updateStatusBar();
            }
        })
    );

    // Register command to run a specific code block
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlock', async (code: string, blockId?: number) => {
            await runCodeInKernel(context, code, blockId);
        })
    );

    // Register command to run code block at cursor
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlockAtCursor', async () => {
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
                await runCodeInKernel(context, block.code);
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
            
            // Set up callback to run code from preview panel
            setOnRunCode((code: string, blockId: number) => {
                runCodeInKernel(context, code, blockId);
            });
            
            createPreviewPanel(context);
        })
    );

    // Register command to select Python
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.selectPython', async () => {
            const pythonPath = await showPythonPicker();
            if (pythonPath) {
                await setDefaultPython(pythonPath);
                updateStatusBar();
                vscode.window.showInformationMessage(`Zef: Python set to ${pythonPath}`);
            }
        })
    );

    // Register settings command
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.settings', async () => {
            await showSettingsPanel();
            updateStatusBar();
        })
    );

    // Register kernel restart command
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.restartKernel', async () => {
            const kernel = getKernelManager(context.extensionPath);
            try {
                await kernel.restart();
                vscode.window.showInformationMessage('Zef: Kernel restarted');
            } catch (e: any) {
                vscode.window.showErrorMessage(`Zef: Failed to restart kernel - ${e.message}`);
            }
        })
    );

    // Register show kernel output command
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.showKernelOutput', () => {
            const kernel = getKernelManager(context.extensionPath);
            kernel.showOutput();
        })
    );
}

async function runCodeInKernel(context: vscode.ExtensionContext, code: string, blockId?: number): Promise<void> {
    const pythonPath = getPythonPath();
    
    if (!pythonPath) {
        const selected = await showPythonPicker();
        if (!selected) {
            vscode.window.showWarningMessage('Zef: No Python interpreter selected');
            return;
        }
        await setDefaultPython(selected);
    }
    
    const finalPythonPath = getPythonPath();
    if (!finalPythonPath) {
        vscode.window.showErrorMessage('Zef: Could not find Python interpreter');
        return;
    }

    const kernel = getKernelManager(context.extensionPath);
    const cellId = `cell-${Date.now()}`;

    try {
        // Show running indicator
        vscode.window.setStatusBarMessage('$(sync~spin) Running code...', 5000);
        
        const result = await kernel.execute(code, cellId, finalPythonPath);
        
        // Send result to preview panel
        if (getPanel() && blockId !== undefined) {
            sendCellResult(blockId, result);
        }
        
        // Write result to the file as an Output block
        if (blockId !== undefined) {
            await writeOutputToFile(blockId, result);
        }
        
        if (result.status === 'error' && result.error) {
            vscode.window.showErrorMessage(`Zef: ${result.error.type}: ${result.error.message}`);
        } else {
            // Show brief success message
            const output = result.stdout || result.result || 'Done';
            const preview = output.length > 50 ? output.substring(0, 50) + '...' : output;
            vscode.window.setStatusBarMessage(`$(check) ${preview}`, 3000);
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Zef: Execution failed - ${e.message}`);
    }
}

/**
 * Write the execution result to the file as an Output block after the code block
 */
async function writeOutputToFile(blockId: number, result: CellResult): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !editor.document.fileName.endsWith('.zef.md')) {
        return;
    }
    
    const document = editor.document;
    const block = findCodeBlockById(document, blockId);
    
    if (!block) {
        return;
    }
    
    // Format the output content
    let outputContent = '';
    if (result.status === 'error' && result.error) {
        outputContent = `Error: ${result.error.type}: ${result.error.message}`;
        if (result.error.traceback) {
            outputContent += '\n' + result.error.traceback;
        }
    } else {
        // Include both stdout and return value
        if (result.stdout && result.stdout.trim()) {
            outputContent += result.stdout.trim();
        }
        if (result.result !== undefined && result.result !== null && result.result !== 'None') {
            if (outputContent) {
                outputContent += '\n---\n';
            }
            outputContent += result.result;
        }
        if (!outputContent) {
            outputContent = '# (no output)';
        }
    }
    
    const outputBlock = '\n````Output\n' + outputContent + '\n````';
    
    await editor.edit(editBuilder => {
        if (block.outputRange) {
            // Replace existing output block
            editBuilder.replace(block.outputRange, outputBlock);
        } else {
            // Insert new output block after the code block
            const insertPosition = block.range.end;
            editBuilder.insert(insertPosition, outputBlock);
        }
    });
}

export function deactivate() {
    disposeKernelManager();
}
