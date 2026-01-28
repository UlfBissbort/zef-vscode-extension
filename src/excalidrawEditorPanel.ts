import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Manages the Excalidraw editor webview panel.
 * Opens as a separate tab where users can edit Excalidraw drawings.
 */
export class ExcalidrawEditorPanel {
    public static currentPanel: ExcalidrawEditorPanel | undefined;
    private static readonly viewType = 'zef.excalidrawEditor';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    
    private _currentBlockId: string | undefined;
    private _currentDocumentUri: vscode.Uri | undefined;
    private _onSaveCallback: ((blockId: string, data: object) => void) | undefined;

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'ready':
                        // Webview is ready, send any pending data
                        console.log('[ExcalidrawEditorPanel] Webview ready');
                        break;
                    case 'saveExcalidraw':
                        console.log('[ExcalidrawEditorPanel] Save request, blockId:', this._currentBlockId);
                        if (this._onSaveCallback && this._currentBlockId) {
                            this._onSaveCallback(this._currentBlockId, message.data);
                        }
                        break;
                    case 'excalidrawChanged':
                        // Live update - update the document with new data
                        console.log('[ExcalidrawEditorPanel] Live update, blockId:', this._currentBlockId, 'hasCallback:', !!this._onSaveCallback);
                        if (this._onSaveCallback && this._currentBlockId) {
                            this._onSaveCallback(this._currentBlockId, message.data);
                        } else {
                            console.log('[ExcalidrawEditorPanel] Missing callback or blockId');
                        }
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Opens the Excalidraw editor panel with the given data.
     */
    public static open(
        extensionUri: vscode.Uri,
        data: object,
        blockId: string,
        documentUri: vscode.Uri,
        onSave: (blockId: string, data: object) => void
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it and update data
        if (ExcalidrawEditorPanel.currentPanel) {
            ExcalidrawEditorPanel.currentPanel._panel.reveal(column);
            ExcalidrawEditorPanel.currentPanel.loadData(data, blockId, documentUri, onSave);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            ExcalidrawEditorPanel.viewType,
            'Excalidraw Editor',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'assets', 'excalidraw-editor')
                ]
            }
        );

        ExcalidrawEditorPanel.currentPanel = new ExcalidrawEditorPanel(panel, extensionUri);
        ExcalidrawEditorPanel.currentPanel.loadData(data, blockId, documentUri, onSave);
    }

    /**
     * Loads Excalidraw data into the editor.
     */
    public loadData(
        data: object,
        blockId: string,
        documentUri: vscode.Uri,
        onSave: (blockId: string, data: object) => void
    ) {
        this._currentBlockId = blockId;
        this._currentDocumentUri = documentUri;
        this._onSaveCallback = onSave;

        // Send data to the webview
        this._panel.webview.postMessage({
            type: 'loadExcalidraw',
            data: data
        });
    }

    /**
     * Request save from the editor.
     */
    public requestSave() {
        this._panel.webview.postMessage({
            type: 'requestSave'
        });
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = 'Excalidraw Editor';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get paths to the bundled assets
        const editorPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'excalidraw-editor');
        
        // Main JS and CSS files
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(editorPath, 'excalidraw-editor.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(editorPath, 'index.css'));
        
        // We need to handle all the chunk files
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
        ExcalidrawEditorPanel.currentPanel = undefined;

        // Clean up our resources
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
