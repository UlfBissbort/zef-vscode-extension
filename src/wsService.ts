import * as vscode from 'vscode';

const WS_URL = 'wss://zef.app/ws-events';

/**
 * WebSocket connection manager for Zef Cloud
 */
export class ZefWebSocketService {
    private static _instance: ZefWebSocketService;
    private _ws: WebSocket | null = null;
    private _connected: boolean = false;
    private _connectionError: string | null = null;
    private _reconnectTimer: NodeJS.Timeout | null = null;
    private _onStatusChange: ((connected: boolean, error: string | null) => void) | null = null;

    private constructor() {}

    public static getInstance(): ZefWebSocketService {
        if (!ZefWebSocketService._instance) {
            ZefWebSocketService._instance = new ZefWebSocketService();
        }
        return ZefWebSocketService._instance;
    }

    public setStatusCallback(callback: (connected: boolean, error: string | null) => void) {
        this._onStatusChange = callback;
    }

    public get isConnected(): boolean {
        return this._connected;
    }

    public get connectionError(): string | null {
        return this._connectionError;
    }

    public async connect(): Promise<void> {
        if (this._ws) {
            this.disconnect();
        }

        try {
            // Use dynamic import for WebSocket since it's a Node.js API
            const WebSocket = (await import('ws')).default;
            
            this._ws = new WebSocket(WS_URL) as unknown as WebSocket;
            
            (this._ws as any).on('open', () => {
                console.log('Zef WebSocket: Connected to', WS_URL);
                this._connected = true;
                this._connectionError = null;
                this._notifyStatusChange();
                
                // Send initial hello message
                this.sendMessage({
                    type: 'hello',
                    message: 'Hello from VSCode extension',
                    client: 'zef-vscode-extension',
                    version: vscode.extensions.getExtension('UlfBissbort.zef')?.packageJSON.version || 'unknown',
                    timestamp: new Date().toISOString()
                });
                
                vscode.window.showInformationMessage('Zef: Connected to Zef Cloud');
            });

            (this._ws as any).on('message', (data: any) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('Zef WebSocket: Received', message);
                    // Handle incoming messages here
                } catch (e) {
                    console.log('Zef WebSocket: Received raw message', data.toString());
                }
            });

            (this._ws as any).on('close', (code: number, reason: string) => {
                console.log('Zef WebSocket: Disconnected', code, reason);
                this._connected = false;
                this._ws = null;
                this._notifyStatusChange();
                
                // Auto-reconnect if still enabled
                const config = vscode.workspace.getConfiguration('zef');
                if (config.get<boolean>('wsConnectionEnabled', false)) {
                    this._scheduleReconnect();
                }
            });

            (this._ws as any).on('error', (error: Error) => {
                const errorMsg = error.message || 'Unknown error';
                console.error('Zef WebSocket: Error', errorMsg);
                console.error('Zef WebSocket: Full error:', error);
                this._connectionError = `${errorMsg} (URL: ${WS_URL})`;
                this._connected = false;
                this._notifyStatusChange();
                
                // Show error in output channel for debugging
                const channel = vscode.window.createOutputChannel('Zef WebSocket');
                channel.appendLine(`[${new Date().toISOString()}] WebSocket Error:`);
                channel.appendLine(`  URL: ${WS_URL}`);
                channel.appendLine(`  Error: ${errorMsg}`);
                channel.appendLine(`  Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
                channel.show(true);
            });

        } catch (error: any) {
            this._connectionError = error.message || 'Failed to connect';
            this._connected = false;
            this._notifyStatusChange();
            vscode.window.showErrorMessage(`Zef: WebSocket connection failed - ${this._connectionError}`);
        }
    }

    public disconnect(): void {
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        
        if (this._ws) {
            (this._ws as any).close();
            this._ws = null;
        }
        
        this._connected = false;
        this._connectionError = null;
        this._notifyStatusChange();
    }

    public sendMessage(message: object): void {
        if (this._ws && this._connected) {
            (this._ws as any).send(JSON.stringify(message));
        }
    }

    private _scheduleReconnect(): void {
        if (this._reconnectTimer) {
            return;
        }
        
        console.log('Zef WebSocket: Scheduling reconnect in 5 seconds...');
        this._reconnectTimer = setTimeout(() => {
            this._reconnectTimer = null;
            const config = vscode.workspace.getConfiguration('zef');
            if (config.get<boolean>('wsConnectionEnabled', false)) {
                this.connect();
            }
        }, 5000);
    }

    private _notifyStatusChange(): void {
        if (this._onStatusChange) {
            this._onStatusChange(this._connected, this._connectionError);
        }
    }

    public dispose(): void {
        this.disconnect();
    }
}
