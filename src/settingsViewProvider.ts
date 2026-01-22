import * as vscode from 'vscode';
import { isRustAvailable } from './rustExecutor';
import { isBunAvailable } from './jsExecutor';
import { getPythonPath, getNotebookVenv } from './configManager';

/**
 * Provider for the Zef Settings webview in the sidebar
 */
export class ZefSettingsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'zef.settingsView';
    
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = await this._getHtmlContent();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'selectPython':
                    await vscode.commands.executeCommand('zef.selectPython');
                    this._refreshView();
                    break;
                case 'openSettings':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'zef');
                    break;
                case 'restartKernel':
                    await vscode.commands.executeCommand('zef.restartKernel');
                    break;
                case 'showKernelOutput':
                    await vscode.commands.executeCommand('zef.showKernelOutput');
                    break;
                case 'configureRust':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'zef.rustcPath');
                    this._refreshView();
                    break;
                case 'configureBun':
                    await vscode.commands.executeCommand('workbench.action.openSettings', 'zef.bunPath');
                    this._refreshView();
                    break;
                case 'toggleTreatAllMd':
                    const config = vscode.workspace.getConfiguration('zef');
                    const current = config.get<boolean>('treatAllMarkdownAsZef', false);
                    await config.update('treatAllMarkdownAsZef', !current, vscode.ConfigurationTarget.Global);
                    this._refreshView();
                    break;
                case 'installRust':
                    vscode.env.openExternal(vscode.Uri.parse('https://rustup.rs/'));
                    break;
                case 'installBun':
                    vscode.env.openExternal(vscode.Uri.parse('https://bun.sh/'));
                    break;
                case 'refresh':
                    this._refreshView();
                    break;
            }
        });

        // Refresh when configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('zef')) {
                this._refreshView();
            }
        });
    }

    private async _refreshView() {
        if (this._view) {
            this._view.webview.html = await this._getHtmlContent();
        }
    }

    private async _getHtmlContent(): Promise<string> {
        // Get current settings and runtime status
        const pythonPath = getPythonPath();
        const notebookVenv = getNotebookVenv();
        const [rustAvailable, bunAvailable] = await Promise.all([
            isRustAvailable(),
            isBunAvailable()
        ]);
        
        const config = vscode.workspace.getConfiguration('zef');
        const treatAllMd = config.get<boolean>('treatAllMarkdownAsZef', false);
        const rustcPath = config.get<string>('rustcPath', '');
        const bunPath = config.get<string>('bunPath', '');

        // Format Python display
        let pythonDisplay = 'Not configured';
        if (pythonPath) {
            const parts = pythonPath.split('/');
            pythonDisplay = parts[parts.length - 3] || pythonPath; // venv name
        }

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zef Settings</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 10px;
            margin: 0;
        }
        
        h2 {
            font-size: 14px;
            font-weight: 600;
            margin: 16px 0 8px 0;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 4px;
        }
        
        .section {
            margin-bottom: 16px;
        }
        
        .runtime-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
            gap: 8px;
        }
        
        .status-icon {
            width: 16px;
            text-align: center;
        }
        
        .status-ok { color: var(--vscode-testing-iconPassed); }
        .status-warn { color: var(--vscode-testing-iconFailed); }
        
        .runtime-info {
            flex: 1;
            min-width: 0;
        }
        
        .runtime-name {
            font-weight: 500;
        }
        
        .runtime-path {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 11px;
            border-radius: 2px;
        }
        
        button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        button.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        button.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .toggle-row {
            display: flex;
            align-items: center;
            padding: 6px 0;
            gap: 8px;
        }
        
        .checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }
        
        .toggle-label {
            flex: 1;
        }
        
        .actions {
            display: flex;
            gap: 6px;
            margin-top: 12px;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 8px;
            font-size: 24px;
        }
        
        a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="logo">⚡ Zef</div>
    
    <h2>Runtimes</h2>
    <div class="section">
        <div class="runtime-item">
            <span class="status-icon ${pythonPath ? 'status-ok' : 'status-warn'}">${pythonPath ? '✓' : '⚠'}</span>
            <div class="runtime-info">
                <div class="runtime-name">Python</div>
                <div class="runtime-path">${pythonDisplay}</div>
            </div>
            <button onclick="send('selectPython')">Configure</button>
        </div>
        
        <div class="runtime-item">
            <span class="status-icon ${rustAvailable ? 'status-ok' : 'status-warn'}">${rustAvailable ? '✓' : '⚠'}</span>
            <div class="runtime-info">
                <div class="runtime-name">Rust</div>
                <div class="runtime-path">${rustAvailable ? (rustcPath || 'Auto-detected') : 'Not found'}</div>
            </div>
            ${rustAvailable ? 
                `<button onclick="send('configureRust')">Configure</button>` : 
                `<button class="primary" onclick="send('installRust')">Install</button>`
            }
        </div>
        
        <div class="runtime-item">
            <span class="status-icon ${bunAvailable ? 'status-ok' : 'status-warn'}">${bunAvailable ? '✓' : '⚠'}</span>
            <div class="runtime-info">
                <div class="runtime-name">Bun (JS/TS)</div>
                <div class="runtime-path">${bunAvailable ? (bunPath || 'Auto-detected') : 'Not found'}</div>
            </div>
            ${bunAvailable ? 
                `<button onclick="send('configureBun')">Configure</button>` : 
                `<button class="primary" onclick="send('installBun')">Install</button>`
            }
        </div>
    </div>
    
    <h2>Options</h2>
    <div class="section">
        <div class="toggle-row">
            <input type="checkbox" class="checkbox" id="treatAllMd" ${treatAllMd ? 'checked' : ''} onchange="send('toggleTreatAllMd')">
            <label class="toggle-label" for="treatAllMd">Treat all .md files as Zef</label>
        </div>
    </div>
    
    <h2>Kernel</h2>
    <div class="section">
        <div class="actions">
            <button onclick="send('restartKernel')">Restart Kernel</button>
            <button onclick="send('showKernelOutput')">Show Output</button>
        </div>
    </div>
    
    <h2>More</h2>
    <div class="section">
        <button onclick="send('openSettings')">Open All Settings</button>
        <button onclick="send('refresh')" style="margin-left: 6px;">↻ Refresh</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function send(command) {
            vscode.postMessage({ command: command });
        }
    </script>
</body>
</html>`;
    }

    /**
     * Force refresh the view from outside
     */
    public refresh() {
        this._refreshView();
    }
}
