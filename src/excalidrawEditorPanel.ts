import * as vscode from 'vscode';

/**
 * Generate a unique ID for an excalidraw block.
 * Uses timestamp + random component for uniqueness.
 */
export function generateExcalidrawUid(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Manages Excalidraw editor webview panels.
 * Supports multiple panels for editing different excalidraw blocks.
 */
export class ExcalidrawEditorPanel {
    // Map of panel key (documentUri:uid) to panel instance
    private static panels: Map<string, ExcalidrawEditorPanel> = new Map();
    private static readonly viewType = 'zef.excalidrawEditor';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    
    private _uid: string;
    private _documentUri: vscode.Uri;
    private _onSaveCallback: ((uid: string, data: object) => void) | undefined;
    private _currentData: object | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        uid: string,
        documentUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._uid = uid;
        this._documentUri = documentUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready (or was re-created after window drag)
                        // Re-send current data so the editor can initialize
                        if (this._currentData) {
                            this._panel.webview.postMessage({
                                type: 'loadExcalidraw',
                                data: this._currentData
                            });
                        }
                        break;
                    case 'saveExcalidraw':
                        if (this._onSaveCallback) {
                            this._onSaveCallback(this._uid, message.data);
                        }
                        break;
                    case 'excalidrawChanged':
                        // Live update - update the document with new data
                        this._currentData = message.data;
                        if (this._onSaveCallback) {
                            this._onSaveCallback(this._uid, message.data);
                        }
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Get the unique key for a panel based on document URI and block UID.
     */
    private static getPanelKey(documentUri: vscode.Uri, uid: string): string {
        return `${documentUri.toString()}:${uid}`;
    }

    /**
     * Opens or reveals an Excalidraw editor panel for the given block.
     * @param extensionUri The extension's URI (for accessing assets)
     * @param data The excalidraw data (must include 'uid' property)
     * @param uid The unique ID of the excalidraw block
     * @param documentUri The document containing the excalidraw block
     * @param onSave Callback when data is saved/changed
     */
    public static open(
        extensionUri: vscode.Uri,
        data: object,
        uid: string,
        documentUri: vscode.Uri,
        onSave: (uid: string, data: object) => void
    ) {
        const key = ExcalidrawEditorPanel.getPanelKey(documentUri, uid);
        
        // Check if panel already exists for this block
        const existingPanel = ExcalidrawEditorPanel.panels.get(key);
        if (existingPanel) {
            // Reveal existing panel and update callback
            existingPanel._panel.reveal();
            existingPanel._onSaveCallback = onSave;
            existingPanel._currentData = data;
            // Send updated data in case it changed externally
            existingPanel._panel.webview.postMessage({
                type: 'loadExcalidraw',
                data: data
            });
            return;
        }

        // Determine the view column - prefer beside the active editor
        const column = vscode.ViewColumn.Beside;

        // Create a new panel
        const panel = vscode.window.createWebviewPanel(
            ExcalidrawEditorPanel.viewType,
            `Excalidraw - ${uid.substring(0, 8)}`,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'assets', 'excalidraw-editor')
                ]
            }
        );

        const editorPanel = new ExcalidrawEditorPanel(panel, extensionUri, uid, documentUri);
        editorPanel._onSaveCallback = onSave;
        editorPanel._currentData = data;

        // Register in the map
        ExcalidrawEditorPanel.panels.set(key, editorPanel);

        // Send initial data
        panel.webview.postMessage({
            type: 'loadExcalidraw',
            data: data
        });
    }

    /**
     * Close all panels associated with a specific document.
     */
    public static closeAllForDocument(documentUri: vscode.Uri): void {
        const prefix = documentUri.toString() + ':';
        for (const [key, panel] of ExcalidrawEditorPanel.panels) {
            if (key.startsWith(prefix)) {
                panel.dispose();
            }
        }
    }

    /**
     * Get all active panel UIDs for a document.
     */
    public static getActiveUidsForDocument(documentUri: vscode.Uri): string[] {
        const prefix = documentUri.toString() + ':';
        const uids: string[] = [];
        for (const key of ExcalidrawEditorPanel.panels.keys()) {
            if (key.startsWith(prefix)) {
                const uid = key.substring(prefix.length);
                uids.push(uid);
            }
        }
        return uids;
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get paths to the bundled assets
        const editorPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'excalidraw-editor');
        
        // Main JS and CSS files
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(editorPath, 'excalidraw-editor.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(editorPath, 'index.css'));
        
        // Base URI for dynamic imports
        const baseUri = webview.asWebviewUri(editorPath);

        // Use a nonce to allow inline scripts
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} data: blob:; connect-src ${webview.cspSource};">
    <link rel="stylesheet" href="${stylesUri}">
    <title>Excalidraw Editor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; background: #121212; }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            flex-direction: column;
            gap: 16px;
        }
        .loading-icon { font-size: 48px; }
    </style>
</head>
<body>
    <div id="root">
        <div class="loading">
            <div class="loading-icon">✏️</div>
            <div>Loading Excalidraw...</div>
        </div>
    </div>
    <script nonce="${nonce}">
        // Set the base URL for dynamic imports
        window.EXCALIDRAW_ASSET_PATH = "${baseUri}/";
        
        // VSCode API
        const vscode = acquireVsCodeApi();
        window.vscodeApi = vscode;
    </script>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }

    public dispose() {
        // Remove from the map
        const key = ExcalidrawEditorPanel.getPanelKey(this._documentUri, this._uid);
        ExcalidrawEditorPanel.panels.delete(key);

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
