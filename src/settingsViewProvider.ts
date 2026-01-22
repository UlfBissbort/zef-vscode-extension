import * as vscode from 'vscode';
import { isRustAvailable } from './rustExecutor';
import { isBunAvailable } from './jsExecutor';
import { getPythonPath, getNotebookVenv } from './configManager';
import { ZefWebSocketService } from './wsService';

/**
 * Provider for the Zef sidebar webview with Status and Settings tabs
 */
export class ZefSettingsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'zef.settingsView';
    
    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _activeTab: 'status' | 'settings' = 'status';
    private _wsService: ZefWebSocketService;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        this._wsService = ZefWebSocketService.getInstance();
        
        // Set up status change callback
        this._wsService.setStatusCallback(() => {
            this._refreshView();
        });
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
                case 'switchTab':
                    this._activeTab = message.tab;
                    this._refreshView();
                    break;
                case 'toggleWsConnection':
                    await this._toggleWsConnection();
                    break;
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

        // Check initial WebSocket connection state
        const config = vscode.workspace.getConfiguration('zef');
        const wsEnabled = config.get<boolean>('wsConnectionEnabled', false);
        if (wsEnabled) {
            // Auto-reconnect on startup if enabled
            this._wsService.connect();
        }
    }

    private async _toggleWsConnection() {
        const config = vscode.workspace.getConfiguration('zef');
        const currentEnabled = config.get<boolean>('wsConnectionEnabled', false);
        const newEnabled = !currentEnabled;
        
        await config.update('wsConnectionEnabled', newEnabled, vscode.ConfigurationTarget.Global);
        
        if (newEnabled) {
            await this._wsService.connect();
        } else {
            this._wsService.disconnect();
        }
        
        this._refreshView();
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
        const wsEnabled = config.get<boolean>('wsConnectionEnabled', false);

        // Format Python display
        let pythonDisplay = 'Not configured';
        if (pythonPath) {
            const parts = pythonPath.split('/');
            pythonDisplay = parts[parts.length - 3] || pythonPath;
        }

        const statusTab = this._activeTab === 'status';
        const settingsTab = this._activeTab === 'settings';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zef</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 0;
            margin: 0;
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-widget-border);
            background: var(--vscode-sideBar-background);
        }
        
        .tab {
            flex: 1;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            border: none;
            background: transparent;
            color: var(--vscode-foreground);
            opacity: 0.7;
            font-size: 12px;
            font-weight: 500;
        }
        
        .tab:hover {
            opacity: 1;
            background: var(--vscode-list-hoverBackground);
        }
        
        .tab.active {
            opacity: 1;
            border-bottom: 2px solid var(--vscode-focusBorder);
            margin-bottom: -1px;
        }
        
        .content {
            padding: 12px;
        }
        
        h2 {
            font-size: 12px;
            font-weight: 600;
            margin: 14px 0 8px 0;
            color: var(--vscode-foreground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.8;
        }
        
        .section {
            margin-bottom: 12px;
        }
        
        .connection-card {
            background: var(--vscode-input-background);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
        }
        
        .connection-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .connection-title {
            font-weight: 600;
            font-size: 13px;
        }
        
        .toggle-switch {
            position: relative;
            width: 40px;
            height: 20px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .toggle-switch.on {
            background: var(--vscode-button-background);
            border-color: var(--vscode-button-background);
        }
        
        .toggle-switch::after {
            content: '';
            position: absolute;
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            top: 1px;
            left: 1px;
            transition: all 0.2s;
        }
        
        .toggle-switch.on::after {
            left: 21px;
        }
        
        .connection-url {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            word-break: break-all;
        }
        
        .connection-status {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            font-size: 11px;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .status-dot.connected { background: #4caf50; }
        .status-dot.disconnected { background: #9e9e9e; }
        .status-dot.error { background: #f44336; }
        
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
            font-size: 12px;
        }
        
        .runtime-path {
            font-size: 10px;
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
            width: 14px;
            height: 14px;
            cursor: pointer;
        }
        
        .toggle-label {
            flex: 1;
            font-size: 12px;
        }
        
        .actions {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }
        
        .header {
            text-align: center;
            font-size: 18px;
            font-weight: 600;
            padding: 12px 0;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
    </style>
</head>
<body>
    <div class="header">Zef 🌿</div>
    <div class="tabs">
        <button class="tab ${statusTab ? 'active' : ''}" onclick="send('switchTab', 'status')">Status</button>
        <button class="tab ${settingsTab ? 'active' : ''}" onclick="send('switchTab', 'settings')">Settings</button>
    </div>
    
    <div class="content">
        ${statusTab ? this._getStatusContent(wsEnabled) : ''}
        ${settingsTab ? this._getSettingsContent(pythonPath ?? undefined, pythonDisplay, rustAvailable, bunAvailable, rustcPath, bunPath, treatAllMd) : ''}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function send(command, data) {
            vscode.postMessage({ command: command, tab: data });
        }
    </script>
</body>
</html>`;
    }

    private _getStatusContent(wsEnabled: boolean): string {
        const wsConnected = this._wsService.isConnected;
        const wsError = this._wsService.connectionError;
        const statusClass = wsEnabled ? (wsConnected ? 'connected' : 'error') : 'disconnected';
        const statusText = wsEnabled 
            ? (wsConnected ? 'Connected' : (wsError || 'Connecting...'))
            : 'Disconnected';

        return `
            <h2>Connection</h2>
            <div class="connection-card">
                <div class="connection-header">
                    <span class="connection-title">Zef Cloud</span>
                    <div class="toggle-switch ${wsEnabled ? 'on' : ''}" onclick="send('toggleWsConnection')"></div>
                </div>
                <div class="connection-url">wss://zef.app/ws-test2</div>
                <div class="connection-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
    }

    private _getSettingsContent(
        pythonPath: string | undefined,
        pythonDisplay: string,
        rustAvailable: boolean,
        bunAvailable: boolean,
        rustcPath: string,
        bunPath: string,
        treatAllMd: boolean
    ): string {
        return `
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
                    <label class="toggle-label" for="treatAllMd">Treat all .md as Zef</label>
                </div>
            </div>
            
            <h2>More</h2>
            <div class="section">
                <button onclick="send('openSettings')">Open All Settings</button>
            </div>
        `;
    }

    public refresh() {
        this._refreshView();
    }
}
