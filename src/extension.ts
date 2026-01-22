import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CodeBlockProvider, findCodeBlockAtPosition, findCodeBlocks, findCodeBlockById, findDisplayCodeBlocks } from './codeBlockParser';
import { createPreviewPanel, updatePreview, getPanel, scrollPreviewToLine, sendCellResult, setOnRunCode, sendSvelteResult, refreshAllPanels } from './previewPanel';
import { getKernelManager, disposeKernelManager, CellResult } from './kernelManager';
import { getPythonPath, showPythonPicker, showSettingsPanel, setDefaultPython } from './configManager';
import { executeRust, RustCellResult, isRustAvailable } from './rustExecutor';
import { executeJs, JsCellResult, isBunAvailable } from './jsExecutor';
import { executeTs, TsCellResult, isBunAvailable as isTsBunAvailable } from './tsExecutor';
import { compileSvelteComponent, SvelteCompileResult } from './svelteExecutor';
import { isZefDocument, isZefUri } from './zefUtils';
import { ZefSettingsViewProvider } from './settingsViewProvider';
import { initJsonValidator, disposeJsonValidator } from './jsonValidator';
import { shouldPersistSvelteOutput } from './frontmatterParser';

let statusBarItem: vscode.StatusBarItem;

// Document paste provider for handling image paste in .zef.md files
class ZefImagePasteProvider implements vscode.DocumentPasteEditProvider {
    async provideDocumentPasteEdits(
        document: vscode.TextDocument,
        ranges: readonly vscode.Range[],
        dataTransfer: vscode.DataTransfer,
        _context: vscode.DocumentPasteEditContext,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentPasteEdit[] | undefined> {
        // Check for image data in clipboard
        const imageItem = dataTransfer.get('image/png') || dataTransfer.get('image/jpeg') || dataTransfer.get('image/gif');
        
        if (!imageItem) {
            return undefined;
        }

        try {
            const imageData = await imageItem.asFile();
            if (!imageData) {
                return undefined;
            }

            const buffer = Buffer.from(await imageData.data());
            
            // Generate unique filename with timestamp
            const timestamp = Date.now();
            // Get extension from the file name if available, else default to png
            const originalName = imageData.name || '';
            const ext = path.extname(originalName).slice(1) || 'png';
            const fileName = `image_${timestamp}.${ext}`;
            
            // Save to same directory as the document
            const docDir = path.dirname(document.uri.fsPath);
            const imagePath = path.join(docDir, fileName);
            
            // Write the image file
            fs.writeFileSync(imagePath, buffer);
            
            // Create the markdown link
            const markdownLink = `![${fileName}](./${fileName})`;
            
            const edit = new vscode.DocumentPasteEdit(markdownLink, 'Insert Image', vscode.DocumentDropOrPasteEditKind.Empty);
            return [edit];
        } catch (error) {
            console.error('Failed to paste image:', error);
            return undefined;
        }
    }
}

// File decoration provider for Zef markdown files
class ZefFileDecorationProvider implements vscode.FileDecorationProvider {
    private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        if (!isZefUri(uri)) {
            return undefined;
        }

        const diagnostics = vscode.languages.getDiagnostics(uri);
        const hasErrors = diagnostics.some(d => d.severity === vscode.DiagnosticSeverity.Error);
        const hasWarnings = diagnostics.some(d => d.severity === vscode.DiagnosticSeverity.Warning);

        if (hasErrors) {
            return {
                badge: '✗',
                color: new vscode.ThemeColor('errorForeground'),
                tooltip: 'Has errors'
            };
        } else if (hasWarnings) {
            return {
                badge: '!',
                color: new vscode.ThemeColor('editorWarning.foreground'),
                tooltip: 'Has warnings'
            };
        } else {
            return {
                color: new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
                tooltip: 'No errors'
            };
        }
    }

    refresh(uri?: vscode.Uri | vscode.Uri[]) {
        this._onDidChangeFileDecorations.fire(uri);
    }
}

let zefFileDecorationProvider: ZefFileDecorationProvider;

// Decoration type for highlighting executable code blocks with a gray background
const codeBlockDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    isWholeLine: true,
    borderRadius: '3px',
});

// Decoration type for highlighting display-only code blocks (zen, json) with a slightly lighter background
const displayCodeBlockDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(128, 128, 128, 0.10)',
    isWholeLine: true,
    borderRadius: '3px',
});

function updateDecorations(editor: vscode.TextEditor) {
    if (!isZefDocument(editor.document)) {
        return;
    }

    // Decorate executable code blocks
    const executableBlocks = findCodeBlocks(editor.document);
    const executableDecorations: vscode.DecorationOptions[] = executableBlocks.map(block => ({
        range: block.range,
    }));
    editor.setDecorations(codeBlockDecorationType, executableDecorations);

    // Decorate display-only code blocks (zen, json)
    const displayBlocks = findDisplayCodeBlocks(editor.document);
    const displayDecorations: vscode.DecorationOptions[] = displayBlocks.map(block => ({
        range: block.range,
    }));
    editor.setDecorations(displayCodeBlockDecorationType, displayDecorations);
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
    console.log('Zef extension: START activation');
    try {

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'zef.settings';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

    // Register the settings view provider for the sidebar
    const settingsViewProvider = new ZefSettingsViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ZefSettingsViewProvider.viewType,
            settingsViewProvider
        )
    );

    // Register file decoration provider for .zef.md files
    zefFileDecorationProvider = new ZefFileDecorationProvider();
    context.subscriptions.push(
        vscode.window.registerFileDecorationProvider(zefFileDecorationProvider)
    );

    // Listen for diagnostic changes to update decorations
    context.subscriptions.push(
        vscode.languages.onDidChangeDiagnostics(event => {
            const zefUris = event.uris.filter(uri => isZefUri(uri));
            if (zefUris.length > 0) {
                zefFileDecorationProvider.refresh(zefUris);
            }
        })
    );

    // Register image paste provider for zef-markdown files
    const imagePasteProvider = new ZefImagePasteProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentPasteEditProvider(
            { language: 'zef-markdown' },
            imagePasteProvider,
            {
                providedPasteEditKinds: [vscode.DocumentDropOrPasteEditKind.Empty],
                pasteMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/*']
            }
        )
    );

    // Register CodeLens provider for .zef.md files (and .md files when setting enabled)
    const codeLensProvider = new CodeBlockProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { pattern: '**/*.md' },
            codeLensProvider
        )
    );

    // Initialize JSON validator for syntax checking in JSON code blocks
    initJsonValidator(context);

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
                if (getPanel() && isZefDocument(editor.document)) {
                    updatePreview(editor.document);
                }
            }
        })
    );

    // Sync scroll from editor to preview
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            if (getPanel() && isZefDocument(event.textEditor.document)) {
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
                // Refresh preview panels when view width changes
                if (event.affectsConfiguration('zef.viewWidthPercent')) {
                    refreshAllPanels();
                }
            }
        })
    );

    console.log('Zef extension: Registering commands...');

    // Register command to run a specific code block
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlock', async (code: string, blockId?: number, language?: string) => {
            if (language === 'rust') {
                await runRustCode(context, code, blockId);
            } else if (language === 'javascript' || language === 'js') {
                await runJsCode(context, code, blockId);
            } else if (language === 'typescript' || language === 'ts') {
                await runTsCode(context, code, blockId);
            } else {
                await runCodeInKernel(context, code, blockId);
            }
        })
    );

    // Register command to compile a Svelte component
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.compileSvelte', async (code: string, blockId?: number) => {
            await compileSvelteBlock(context, code, blockId);
        })
    );
    // Register command to run code block at cursor
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.runBlockAtCursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            // Only work in Zef markdown files (or regular .md when setting enabled)
            if (!isZefDocument(editor.document)) {
                const config = vscode.workspace.getConfiguration('zef');
                const treatAllMd = config.get<boolean>('treatAllMarkdownAsZef', false);
                if (!treatAllMd && editor.document.fileName.endsWith('.md')) {
                    vscode.window.showWarningMessage('Zef: Enable "Treat All Markdown as Zef" in settings to use this feature with .md files');
                } else {
                    vscode.window.showWarningMessage('Zef: Only works in .zef.md files');
                }
                return;
            }

            const block = findCodeBlockAtPosition(editor.document, editor.selection.active);
            if (block) {
                if (block.language === 'rust') {
                    await runRustCode(context, block.code, block.blockId);
                } else if (block.language === 'javascript' || block.language === 'js') {
                    await runJsCode(context, block.code, block.blockId);
                } else if (block.language === 'typescript' || block.language === 'ts') {
                    await runTsCode(context, block.code, block.blockId);
                } else if (block.language === 'svelte') {
                    await compileSvelteBlock(context, block.code, block.blockId);
                } else {
                    await runCodeInKernel(context, block.code, block.blockId);
                }
            } else {
                vscode.window.showWarningMessage('Zef: Cursor is not inside a code block');
            }
        })
    );

    // Register command to open preview panel
    context.subscriptions.push(
        vscode.commands.registerCommand('zef.openPreview', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !isZefDocument(editor.document)) {
                const config = vscode.workspace.getConfiguration('zef');
                const treatAllMd = config.get<boolean>('treatAllMarkdownAsZef', false);
                if (!treatAllMd && editor?.document.fileName.endsWith('.md')) {
                    vscode.window.showWarningMessage('Zef: Enable "Treat All Markdown as Zef" in settings to preview .md files');
                } else {
                    vscode.window.showWarningMessage('Zef: Open a .zef.md file first');
                }
                return;
            }
            
            // Set up callback to run code from preview panel
            // The callback now receives documentUri to correctly target the right panel/file
            setOnRunCode((code: string, blockId: number, language: string, documentUri: vscode.Uri) => {
                if (language === 'rust' || language === 'rs') {
                    runRustCode(context, code, blockId, documentUri);
                } else if (language === 'javascript' || language === 'js') {
                    runJsCode(context, code, blockId, documentUri);
                } else if (language === 'typescript' || language === 'ts') {
                    runTsCode(context, code, blockId, documentUri);
                } else if (language === 'svelte') {
                    compileSvelteBlock(context, code, blockId, documentUri);
                } else {
                    runCodeInKernel(context, code, blockId, documentUri);
                }
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

    console.log('Zef extension: All commands registered successfully');
    } catch (error) {
        console.error('Zef extension: ACTIVATION FAILED:', error);
        vscode.window.showErrorMessage(`Zef extension failed to activate: ${error}`);
    }
}

/**
 * Install a runtime automatically (macOS for now)
 */
async function installRuntime(runtime: 'python' | 'rust' | 'bun'): Promise<void> {
    const isMac = process.platform === 'darwin';
    const isLinux = process.platform === 'linux';
    const isWindows = process.platform === 'win32';
    
    // Installation commands for each platform
    const installCommands: Record<string, Record<string, string>> = {
        python: {
            darwin: 'brew install python3',
            linux: 'sudo apt install -y python3 || sudo dnf install -y python3',
            win32: 'winget install Python.Python.3.12'
        },
        rust: {
            darwin: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
            linux: 'curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y',
            win32: 'winget install Rustlang.Rustup'
        },
        bun: {
            darwin: 'curl -fsSL https://bun.sh/install | bash',
            linux: 'curl -fsSL https://bun.sh/install | bash',
            win32: 'powershell -c "irm bun.sh/install.ps1 | iex"'
        }
    };
    
    const platform = process.platform as string;
    const cmd = installCommands[runtime]?.[platform];
    
    if (!cmd) {
        vscode.window.showErrorMessage(`Auto-installation not yet supported for ${runtime} on ${platform}. Please install manually.`);
        return;
    }
    
    // Show progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Installing ${runtime}...`,
        cancellable: false
    }, async (progress) => {
        progress.report({ message: 'This may take a minute...' });
        
        try {
            // Open a terminal and run the install command
            const terminal = vscode.window.createTerminal({
                name: `Install ${runtime}`,
                shellPath: isWindows ? 'powershell.exe' : '/bin/bash'
            });
            terminal.show();
            terminal.sendText(cmd);
            
            // Show follow-up instructions
            vscode.window.showInformationMessage(
                `Installation started in terminal. After it completes, reload VS Code (Cmd+Shift+P → "Reload Window").`,
                'Reload Now'
            ).then(action => {
                if (action === 'Reload Now') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        } catch (e: any) {
            vscode.window.showErrorMessage(`Failed to start installation: ${e.message}`);
        }
    });
}

/**
 * Handle missing runtime with detailed, beginner-friendly error message
 */
async function handleMissingRuntime(runtime: 'python' | 'rust' | 'bun'): Promise<boolean> {
    const installUrls: Record<string, string> = {
        python: 'https://www.python.org/downloads/',
        rust: 'https://rustup.rs/',
        bun: 'https://bun.sh/'
    };
    
    const docsUrl = 'https://github.com/UlfBissbort/zef-vscode-extension/blob/main/docs/RUNTIME_REQUIREMENTS.md';
    
    const settingKeys: Record<string, string> = {
        python: 'zef.defaultPython',
        rust: 'zef.rustcPath',
        bun: 'zef.bunPath'
    };
    
    // Detailed, beginner-friendly messages explaining what each runtime is
    const descriptions: Record<string, string> = {
        python: 'Python is a programming language. To run Python code blocks, you need Python 3 installed on your computer.',
        rust: 'Rust is a systems programming language. To run Rust code blocks, you need the Rust compiler (rustc) installed.',
        bun: 'Bun is a JavaScript runtime (like Node.js, but faster). It\'s required for running JavaScript, TypeScript, and Svelte components.'
    };
    
    const shortMessages: Record<string, string> = {
        python: 'Python not found',
        rust: 'Rust compiler not found',
        bun: 'Bun runtime not found'
    };
    
    // Check if we can offer auto-install (macOS primarily, but Linux too)
    const canAutoInstall = process.platform === 'darwin' || process.platform === 'linux';
    
    // Build button options based on platform
    const buttons = canAutoInstall 
        ? ['Install Now', 'Manual Install', 'Configure Path', 'View Docs']
        : ['Install It', 'Configure Path', 'View Docs'];
    
    // First show an informational message explaining what's happening
    const action = await vscode.window.showErrorMessage(
        `${shortMessages[runtime]} — ${descriptions[runtime]}`,
        ...buttons
    );
    
    if (action === 'Install Now') {
        // Auto-install for macOS/Linux
        await installRuntime(runtime);
    } else if (action === 'Install It' || action === 'Manual Install') {
        vscode.env.openExternal(vscode.Uri.parse(installUrls[runtime]));
        // Also show a follow-up message
        vscode.window.showInformationMessage(
            `After installing, restart VS Code and try running your code again.`
        );
    } else if (action === 'Configure Path') {
        vscode.commands.executeCommand(
            'workbench.action.openSettings',
            settingKeys[runtime]
        );
    } else if (action === 'View Docs') {
        vscode.env.openExternal(vscode.Uri.parse(docsUrl + '#' + runtime));
    }
    
    return false; // Execution should not continue
}

async function runCodeInKernel(context: vscode.ExtensionContext, code: string, blockId?: number, documentUri?: vscode.Uri): Promise<void> {
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
        
        // Send result to preview panel for the specific document
        if (blockId !== undefined) {
            sendCellResult(blockId, result, documentUri);
        }
        
        // Write result to the file as an Output block
        if (blockId !== undefined) {
            await writeOutputToFile(blockId, result, documentUri);
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
 * Run Rust code and write results to the file
 */
async function runRustCode(context: vscode.ExtensionContext, code: string, blockId?: number, documentUri?: vscode.Uri): Promise<void> {
    // Check if Rust is available
    const rustAvailable = await isRustAvailable();
    if (!rustAvailable) {
        await handleMissingRuntime('rust');
        return;
    }

    const cellId = `rust-cell-${Date.now()}`;

    try {
        // Show running indicator
        vscode.window.setStatusBarMessage('$(sync~spin) Compiling Rust...', 5000);
        
        const result = await executeRust(code, cellId);
        
        // Convert RustCellResult to CellResult format for compatibility
        const cellResult: CellResult = {
            cell_id: result.cell_id,
            status: result.status,
            result: result.result,
            stdout: result.stdout,
            stderr: result.stderr,
            side_effects: result.side_effects,
            error: result.error
        };
        
        // Send result to preview panel for the specific document
        if (blockId !== undefined) {
            sendCellResult(blockId, cellResult, documentUri);
        }
        
        // Write result to the file as an Output block
        if (blockId !== undefined) {
            await writeOutputToFile(blockId, cellResult, documentUri);
        }
        
        if (result.status === 'error' && result.error) {
            vscode.window.showErrorMessage(`Zef Rust: ${result.error.type}: ${result.error.message}`);
        } else {
            // Show brief success message
            const output = result.result || result.stdout || 'Done';
            const preview = output.length > 50 ? output.substring(0, 50) + '...' : output;
            vscode.window.setStatusBarMessage(`$(check) Rust: ${preview}`, 3000);
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Zef Rust: Execution failed - ${e.message}`);
    }
}

async function runJsCode(context: vscode.ExtensionContext, code: string, blockId?: number, documentUri?: vscode.Uri): Promise<void> {
    // Check if Bun is available
    const bunAvailable = await isBunAvailable();
    if (!bunAvailable) {
        await handleMissingRuntime('bun');
        return;
    }

    const cellId = `js-cell-${Date.now()}`;

    try {
        // Show running indicator
        vscode.window.setStatusBarMessage('$(sync~spin) Running JavaScript...', 5000);
        
        const result = await executeJs(code, cellId);
        
        // Convert JsCellResult to CellResult format for compatibility
        const cellResult: CellResult = {
            cell_id: result.cell_id,
            status: result.status,
            result: result.result,
            stdout: result.stdout,
            stderr: result.stderr,
            side_effects: result.side_effects,
            error: result.error
        };
        
        // Send result to preview panel for the specific document
        if (blockId !== undefined) {
            sendCellResult(blockId, cellResult, documentUri);
        }
        
        // Write result to the file as an Output block
        if (blockId !== undefined) {
            await writeOutputToFile(blockId, cellResult, documentUri);
        }
        
        if (result.status === 'error' && result.error) {
            vscode.window.showErrorMessage(`Zef JS: ${result.error.type}: ${result.error.message}`);
        } else {
            // Show brief success message
            const output = result.result || result.stdout || 'Done';
            const preview = output.length > 50 ? output.substring(0, 50) + '...' : output;
            vscode.window.setStatusBarMessage(`$(check) JS: ${preview}`, 3000);
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Zef JS: Execution failed - ${e.message}`);
    }
}

async function runTsCode(context: vscode.ExtensionContext, code: string, blockId?: number, documentUri?: vscode.Uri): Promise<void> {
    // Check if Bun is available (TS uses bun too)
    const bunAvailable = await isTsBunAvailable();
    if (!bunAvailable) {
        await handleMissingRuntime('bun');
        return;
    }

    const cellId = `ts-cell-${Date.now()}`;

    try {
        // Show running indicator
        vscode.window.setStatusBarMessage('$(sync~spin) Running TypeScript...', 5000);
        
        const result = await executeTs(code, cellId);
        
        // Convert TsCellResult to CellResult format for compatibility
        const cellResult: CellResult = {
            cell_id: result.cell_id,
            status: result.status,
            result: result.result,
            stdout: result.stdout,
            stderr: result.stderr,
            side_effects: result.side_effects,
            error: result.error
        };
        
        // Send result to preview panel for the specific document
        if (blockId !== undefined) {
            sendCellResult(blockId, cellResult, documentUri);
        }
        
        // Write result to the file as an Output block
        if (blockId !== undefined) {
            await writeOutputToFile(blockId, cellResult, documentUri);
        }
        
        if (result.status === 'error' && result.error) {
            vscode.window.showErrorMessage(`Zef TS: ${result.error.type}: ${result.error.message}`);
        } else {
            // Show brief success message
            const output = result.result || result.stdout || 'Done';
            const preview = output.length > 50 ? output.substring(0, 50) + '...' : output;
            vscode.window.setStatusBarMessage(`$(check) TS: ${preview}`, 3000);
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Zef TS: Execution failed - ${e.message}`);
    }
}

/**
 * Compile a Svelte component and write the rendered HTML to the file
 */
async function compileSvelteBlock(context: vscode.ExtensionContext, code: string, blockId?: number, documentUri?: vscode.Uri): Promise<void> {
    // Check if Bun is available (required for Svelte compilation)
    const bunAvailable = await isBunAvailable();
    if (!bunAvailable) {
        await handleMissingRuntime('bun');
        return;
    }
    
    try {
        // Show compiling indicator
        vscode.window.setStatusBarMessage('$(sync~spin) Compiling Svelte...', 5000);
        
        const result = await compileSvelteComponent(code, context.extensionPath);
        
        // Send result to preview panel for the specific document
        if (blockId !== undefined) {
            sendSvelteResult(blockId, result, documentUri);
        }
        
        // Write result to the file as a rendered-html block
        if (blockId !== undefined) {
            await writeSvelteResultToFile(blockId, result, documentUri);
        }
        
        if (result.success) {
            // Show compile time in green status bar
            vscode.window.setStatusBarMessage(`$(check) Svelte: Compiled in ${result.compileTime}ms`, 3000);
        } else {
            // Check if error is about Svelte not being found
            if (result.error?.includes('svelte/compiler') || result.error?.includes("Cannot find module")) {
                const action = await vscode.window.showErrorMessage(
                    'Svelte compiler not found. The extension may need to be reinstalled.',
                    'View Docs',
                    'Dismiss'
                );
                if (action === 'View Docs') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/UlfBissbort/zef-vscode-extension/blob/main/docs/RUNTIME_REQUIREMENTS.md#svelte'));
                }
            } else {
                vscode.window.showErrorMessage(`Zef Svelte: ${result.error}`);
            }
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Zef Svelte: Compilation failed - ${e.message}`);
    }
}

/**
 * Write the Svelte compilation result to the file as a rendered-html block
 */
async function writeSvelteResultToFile(blockId: number, result: SvelteCompileResult, documentUri?: vscode.Uri): Promise<void> {
    // Get document from the provided URI, or fall back to active editor
    let document: vscode.TextDocument | undefined;
    let editor: vscode.TextEditor | undefined;
    
    // Use the provided documentUri if available (passed from the panel that initiated the compile)
    const targetDocUri = documentUri;
    if (targetDocUri) {
        editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === targetDocUri.toString());
        if (editor) {
            document = editor.document;
        } else {
            try {
                document = await vscode.workspace.openTextDocument(targetDocUri);
                editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One, true);
            } catch (e) {
                // Silently fail, will try fallback
            }
        }
    }
    
    if (!editor || !document) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        document = editor.document;
    }
    
    if (!isZefDocument(document)) {
        return;
    }
    
    // Check frontmatter settings - if persist_output is false, don't save rendered HTML
    if (!shouldPersistSvelteOutput(document.getText())) {
        return;
    }
    
    const block = findCodeBlockById(document, blockId);
    
    if (!block) {
        return;
    }
    
    // Format the rendered HTML block (5 backticks to distinguish from code blocks)
    let renderedContent = '';
    if (result.success && result.html) {
        renderedContent = result.html;
    } else {
        renderedContent = `<!-- Error: ${result.error || 'Unknown error'} -->`;
    }
    
    const renderedBlock = '\n````rendered-html\n' + renderedContent + '\n````';
    
    await editor.edit(editBuilder => {
        if (block.renderedHtmlRange) {
            editBuilder.replace(block.renderedHtmlRange, renderedBlock);
        } else {
            editBuilder.insert(block.range.end, renderedBlock);
        }
    });
}

/**
 * Write the execution result to the file as an Output block after the code block
 */
async function writeOutputToFile(blockId: number, result: CellResult, documentUri?: vscode.Uri): Promise<void> {
    // Use the provided documentUri if available (passed from the panel that initiated the run)
    let document: vscode.TextDocument | undefined;
    let editor: vscode.TextEditor | undefined;
    
    const targetDocUri = documentUri;
    if (targetDocUri) {
        // Find editor for this document, or open it
        editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === targetDocUri.toString());
        if (editor) {
            document = editor.document;
        } else {
            // Document might be open but not visible, try to get it
            try {
                document = await vscode.workspace.openTextDocument(targetDocUri);
                // We need an editor to make edits, so show the document
                editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One, true);
            } catch (e) {
                // Silently fail, will try fallback
            }
        }
    }
    
    // Fallback to active editor
    if (!editor || !document) {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        document = editor.document;
    }
    
    if (!isZefDocument(document)) {
        return;
    }
    
    const block = findCodeBlockById(document, blockId);
    
    if (!block) {
        return;
    }
    
    // Format the result content - only the evaluated value, NOT stdout
    let resultContent = '';
    if (result.status === 'error' && result.error) {
        resultContent = `Error: ${result.error.type}: ${result.error.message}`;
        if (result.error.traceback) {
            resultContent += '\n' + result.error.traceback;
        }
    } else {
        // Only store the evaluated return value (not stdout)
        if (result.result !== undefined && result.result !== null && result.result !== 'None') {
            resultContent = result.result;
        }
        if (!resultContent) {
            resultContent = '# (no result)';
        }
    }
    
    // Format side effects as ET.UnmanagedEffect entries
    let sideEffectsContent = '';
    const sideEffects = result.side_effects || [];
    if (sideEffects.length > 0) {
        const effectStrings = sideEffects.map(effect => {
            // Escape the content for Python string representation
            const escapedContent = effect.content
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'");
            return `    ET.UnmanagedEffect(\n        what='${effect.what}',\n        content='${escapedContent}'\n    )`;
        });
        sideEffectsContent = '[\n' + effectStrings.join(',\n') + '\n]';
    } else {
        // Always write empty array when no side effects
        sideEffectsContent = '[]';
    }
    
    const resultBlock = '\n````Result\n' + resultContent + '\n````';
    const sideEffectsBlock = '\n````Side Effects\n' + sideEffectsContent + '\n````';
    
    // Determine insert position - need to track where to insert side effects
    // Result block comes first, then side effects block
    await editor.edit(editBuilder => {
        // Handle result block
        if (block.resultRange) {
            editBuilder.replace(block.resultRange, resultBlock);
        } else {
            editBuilder.insert(block.range.end, resultBlock);
        }
    });
    
    // Re-fetch block after first edit to get updated positions
    if (sideEffectsContent) {
        const updatedBlock = findCodeBlockById(document, blockId);
        if (updatedBlock) {
            await editor.edit(editBuilder => {
                if (updatedBlock.sideEffectsRange) {
                    editBuilder.replace(updatedBlock.sideEffectsRange, sideEffectsBlock);
                } else {
                    // Insert after result block
                    const insertPos = updatedBlock.resultRange ? updatedBlock.resultRange.end : updatedBlock.range.end;
                    editBuilder.insert(insertPos, sideEffectsBlock);
                }
            });
        }
    }
}

export function deactivate() {
    disposeKernelManager();
    disposeJsonValidator();
}
