import WebSocket from 'ws';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Debug log file
const DEBUG_LOG = path.join(os.tmpdir(), 'zef-tokolosh-debug.log');

export function debugLog(msg: string): void {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try { fs.appendFileSync(DEBUG_LOG, line); } catch {}
}

// ────────────────────────────────────────────────────────────────────
// Pure functions — no side effects, fully testable
// ────────────────────────────────────────────────────────────────────

const PORT_MIN = 27021;
const PORT_MAX = 27040;
const SCAN_TIMEOUT = 800;
const REQUEST_TIMEOUT = 5000;

/** Parse a zef: URI into its type and hash components. */
export function parseZefUri(uri: string): { type: string; hash: string } | null {
    // zef:PngImage/🗿-<64 hex chars>
    const match = uri.match(/^zef:(\w+)\/(🗿-[0-9a-fA-F]{64})$/);
    if (!match) { return null; }
    return { type: match[1], hash: match[2] };
}

/** Map Zef type name to MIME type. */
export function zefTypeToMime(type: string): string {
    const map: Record<string, string> = {
        'PngImage': 'image/png',
        'JpgImage': 'image/jpeg',
        'GifImage': 'image/gif',
        'WebpImage': 'image/webp',
        'SvgImage': 'image/svg+xml',
    };
    return map[type] || 'application/octet-stream';
}

/** Map MIME type to Zef type name. */
export function mimeToZefType(mime: string): string {
    const map: Record<string, string> = {
        'image/png': 'PngImage',
        'image/jpeg': 'JpgImage',
        'image/gif': 'GifImage',
        'image/webp': 'WebpImage',
        'image/svg+xml': 'SvgImage',
    };
    return map[mime] || 'PngImage';
}

/** Build a data: URI from MIME type and base64 data. */
export function buildDataUri(mime: string, base64Data: string): string {
    return `data:${mime};base64,${base64Data}`;
}

/** Build the Markdown link syntax for a zef content-addressed image. */
export function buildZefMarkdownLink(type: string, hash: string, altText?: string): string {
    return `![${altText || ''}](zef:${type}/${hash})`;
}

/** Generate a unique ID for WS request correlation. */
export function generateUid(): string {
    const bytes = crypto.randomBytes(10);
    return '🍃-' + bytes.toString('hex');
}

/** Build the FX.RetrieveFromHashStore WS message. */
export function buildRetrieveMessage(type: string, hash: string, uid: string): object {
    return {
        __type: 'FX.RetrieveFromHashStore',
        __uid: uid,
        hash: {
            __type: 'ZefValueHash',
            data_type: type,
            hash: hash,
        },
    };
}

/** Build the FX.SaveToHashStore WS message. */
export function buildSaveMessage(type: string, base64Data: string, uid: string): object {
    return {
        __type: 'FX.SaveToHashStore',
        __uid: uid,
        value: {
            __type: type,
            data: base64Data,
        },
    };
}

/** Parse a hash store retrieve response. */
export function parseRetrieveResponse(msg: any): { status: 'found'; type: string; data: string } | { status: 'not-found' } | { status: 'error'; message: string } {
    if (msg?.__type === 'ET.HashStoreGetResponse' && msg.value) {
        const val = msg.value;
        if (val.__type && val.data) {
            return { status: 'found', type: val.__type, data: val.data };
        }
        return { status: 'error', message: 'Response value missing type or data' };
    }
    if (msg?.__type === 'ET.HashStoreNotFound') {
        return { status: 'not-found' };
    }
    return { status: 'error', message: `Unexpected response type: ${msg?.__type}` };
}

/** Parse a hash store save response (ET.HashStoreResponse). */
export function parseSaveResponse(msg: any): { status: 'saved'; hash: string } | { status: 'error'; message: string } {
    if (msg?.__type === 'ET.HashStoreResponse' && msg.hash) {
        // hash can be a ZefValueHash object {__type: 'ZefValueHash', data_type: '...', hash: '🗿-...'} or a string
        const hashObj = msg.hash;
        const hashStr = typeof hashObj === 'string' ? hashObj : hashObj?.hash;
        if (hashStr) {
            return { status: 'saved', hash: hashStr };
        }
    }
    return { status: 'error', message: `Could not extract hash from save response: ${JSON.stringify(msg)}` };
}

/** Build a placeholder SVG data URI for an unresolvable zef image. */
export function buildPlaceholderDataUri(type: string, hash: string, reason: string): string {
    const shortHash = hash.length > 16 ? hash.slice(0, 12) + '…' + hash.slice(-8) : hash;
    const label = `${reason}: ${type}/${shortHash}`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='50'>`
        + `<rect fill='%231e1e1e' width='100%25' height='100%25' rx='8'/>`
        + `<text x='50%25' y='50%25' fill='%23888' font-size='11' font-family='monospace' text-anchor='middle' dy='0.35em'>`
        + `⚠️ ${label}</text></svg>`;
    return `data:image/svg+xml,${svg}`;
}

/** Extract all zef: image references from an HTML string. */
export function extractZefImageRefs(html: string): Array<{ type: string; hash: string; fullUri: string }> {
    const refs: Array<{ type: string; hash: string; fullUri: string }> = [];
    const imgRegex = /src=["'](zef:\w+\/🗿-[0-9a-fA-F]{64})["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const parsed = parseZefUri(match[1]);
        if (parsed) {
            refs.push({ ...parsed, fullUri: match[1] });
        }
    }
    return refs;
}

/**
 * Extract matplotlib figure hashes from a persisted side effects text block.
 * Looks for patterns like: what='matplotlib_figure', content='PngImage(🗿-<hash>)'
 * Returns the type and full hash string for each figure.
 */
export function extractFigureRefs(sideEffectsText: string): Array<{ type: string; hash: string }> {
    const refs: Array<{ type: string; hash: string }> = [];
    const figRegex = /what='matplotlib_figure'[\s\S]*?content='(\w+)\('(🗿-[0-9a-fA-F]{64})'\)'/g;
    let match;
    while ((match = figRegex.exec(sideEffectsText)) !== null) {
        refs.push({ type: match[1], hash: match[2] });
    }
    return refs;
}

// ────────────────────────────────────────────────────────────────────
// TokoloshService — singleton managing WS connection + caching
// ────────────────────────────────────────────────────────────────────

/** Response types that indicate a hash store reply. */
const HASH_STORE_RESPONSE_TYPES = new Set([
    'ET.HashStoreGetResponse',
    'ET.HashStoreNotFound',
    'ET.HashStoreResponse',
]);

interface PendingRequest {
    resolve: (msg: any) => void;
    reject: (reason: any) => void;
    timer: NodeJS.Timeout;
    /** The uid used when sending (for cleanup). */
    uid: string;
}

export class TokoloshService {
    private static _instance: TokoloshService;

    private ws: WebSocket | null = null;
    private connected = false;
    private handshakeComplete = false;
    private connectedPort: number | null = null;
    private cache: Map<string, string> = new Map(); // fullUri → data URI
    private pendingRequests: PendingRequest[] = [];
    private connecting: Promise<boolean> | null = null;
    private statusCallback: (() => void) | null = null;

    private constructor() {}

    public static getInstance(): TokoloshService {
        if (!TokoloshService._instance) {
            TokoloshService._instance = new TokoloshService();
        }
        return TokoloshService._instance;
    }

    public get isConnected(): boolean {
        return this.connected && this.handshakeComplete;
    }

    /** Get the port the tokolosh is connected on, or null. */
    public get port(): number | null {
        return this.connectedPort;
    }

    /** Set a callback to be notified when connection status changes. */
    public setStatusCallback(callback: () => void): void {
        this.statusCallback = callback;
    }

    private notifyStatusChange(): void {
        if (this.statusCallback) { this.statusCallback(); }
    }

    /** Try to connect to the tokolosh. Returns true if connected. */
    public async ensureConnected(): Promise<boolean> {
        if (this.isConnected) { return true; }
        if (this.connecting) { return this.connecting; }
        this.connecting = this.connect();
        const result = await this.connecting;
        this.connecting = null;
        return result;
    }

    private async connect(): Promise<boolean> {
        const port = await this.scanPorts();
        if (port === null) {
            debugLog('No tokolosh found on ports ' + PORT_MIN + '-' + PORT_MAX);
            return false;
        }
        debugLog('Found tokolosh on port ' + port);

        return new Promise<boolean>((resolve) => {
            const url = `ws://127.0.0.1:${port}/ws`;
            console.log('TokoloshService: Connecting to', url);

            const ws = new WebSocket(url);
            let handshakeDone = false;

            const timeout = setTimeout(() => {
                if (!handshakeDone) {
                    ws.close();
                    resolve(false);
                }
            }, 5000);

            ws.on('open', () => {
                console.log('TokoloshService: WebSocket open on port', port);
                this.ws = ws;
                this.connectedPort = port;
                this.connected = true;
            });

            ws.on('message', (data: WebSocket.Data) => {
                let msg: any;
                try {
                    msg = JSON.parse(data.toString());
                } catch {
                    return;
                }

                // Handshake
                if (!handshakeDone && msg.__type === 'ET.Welcome') {
                    const hello = {
                        __type: 'ET.ClientHello',
                        client_type: 'zef-vscode-extension',
                        pid: process.pid,
                        wire_format: 'json_like',
                    };
                    ws.send(JSON.stringify(hello));
                    handshakeDone = true;
                    this.handshakeComplete = true;
                    clearTimeout(timeout);
                    debugLog('Handshake complete, tokolosh v' + (msg.version || '?'));
                    resolve(true);
                    this.notifyStatusChange();
                    return;
                }

                // Route responses to pending requests
                this.handleResponse(msg);
            });

            ws.on('close', () => {
                console.log('TokoloshService: Connection closed');
                this.connected = false;
                this.handshakeComplete = false;
                this.ws = null;
                this.connectedPort = null;
                // Reject all pending requests
                for (const req of this.pendingRequests) {
                    clearTimeout(req.timer);
                    req.reject(new Error('Connection closed'));
                }
                this.pendingRequests = [];
                this.notifyStatusChange();
            });

            ws.on('error', (err) => {
                console.error('TokoloshService: WebSocket error', err.message);
            });
        });
    }

    private async scanPorts(): Promise<number | null> {
        for (let port = PORT_MIN; port <= PORT_MAX; port++) {
            const found = await this.tryPort(port);
            if (found) { return port; }
        }
        return null;
    }

    private tryPort(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    try { testWs.close(); } catch {}
                    resolve(false);
                }
            }, SCAN_TIMEOUT);

            let testWs: WebSocket;
            try {
                testWs = new WebSocket(`ws://127.0.0.1:${port}/ws`);
            } catch {
                clearTimeout(timer);
                resolve(false);
                return;
            }

            testWs.on('open', () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    testWs.close();
                    resolve(true);
                }
            });

            testWs.on('error', () => {
                if (!settled) {
                    settled = true;
                    clearTimeout(timer);
                    resolve(false);
                }
            });
        });
    }

    private handleResponse(msg: any): void {
        const type = msg?.__type;
        debugLog('handleResponse: received msg type=' + type + ' __uid=' + (msg?.__uid || 'none') + ' pending=' + this.pendingRequests.length);
        if (!type) { return; }

        // First try to match by __uid if the tokolosh echoes it back
        const uid = msg?.__uid;
        if (uid) {
            const idx = this.pendingRequests.findIndex(r => r.uid === uid);
            if (idx !== -1) {
                const pending = this.pendingRequests[idx];
                this.pendingRequests.splice(idx, 1);
                clearTimeout(pending.timer);
                pending.resolve(msg);
                return;
            }
        }

        // Fallback: match by response type to the oldest pending request (FIFO)
        if (HASH_STORE_RESPONSE_TYPES.has(type) && this.pendingRequests.length > 0) {
            const pending = this.pendingRequests.shift()!;
            clearTimeout(pending.timer);
            pending.resolve(msg);
        }
    }

    /** Send a WS message and wait for a correlated response. */
    private sendAndWait(message: any, timeoutMs: number = REQUEST_TIMEOUT): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.ws || !this.isConnected) {
                reject(new Error('Not connected'));
                return;
            }

            const uid = message.__uid;
            const pending: PendingRequest = {
                resolve, reject, uid,
                timer: setTimeout(() => {
                    const idx = this.pendingRequests.indexOf(pending);
                    if (idx !== -1) { this.pendingRequests.splice(idx, 1); }
                    reject(new Error(`Request timed out after ${timeoutMs}ms`));
                }, timeoutMs),
            };

            this.pendingRequests.push(pending);
            this.ws.send(JSON.stringify(message));
        });
    }

    /**
     * Resolve a zef: image reference to a data URI.
     * Returns the data URI on success, or null on failure.
     * Results are cached for the session.
     */
    public async resolveImage(type: string, hash: string): Promise<string | null> {
        const cacheKey = `zef:${type}/${hash}`;
        debugLog('resolveImage: ' + cacheKey);

        // Cache hit
        const cached = this.cache.get(cacheKey);
        if (cached) { debugLog('resolveImage: cache hit'); return cached; }

        // Ensure connected
        const ok = await this.ensureConnected();
        if (!ok) { return null; }

        const uid = generateUid();
        const msg = buildRetrieveMessage(type, hash, uid);

        try {
            debugLog('resolveImage: sending retrieve request uid=' + uid);
            const response = await this.sendAndWait(msg);
            debugLog('resolveImage: got response type=' + response?.__type);
            const parsed = parseRetrieveResponse(response);

            if (parsed.status === 'found') {
                const mime = zefTypeToMime(parsed.type);
                const dataUri = buildDataUri(mime, parsed.data);
                debugLog('resolveImage: FOUND, dataUri length=' + dataUri.length);
                this.cache.set(cacheKey, dataUri);
                return dataUri;
            }

            debugLog('resolveImage: not found, hash=' + hash);
            return null;
        } catch (err: any) {
            console.error('TokoloshService: Failed to resolve image:', err.message);
            return null;
        }
    }

    /**
     * Upload an image to the hash store.
     * Returns the hash string on success, or null on failure.
     */
    public async uploadImage(type: string, buffer: Buffer): Promise<string | null> {
        const ok = await this.ensureConnected();
        if (!ok) { return null; }

        const base64Data = buffer.toString('base64');
        const uid = generateUid();
        const msg = buildSaveMessage(type, base64Data, uid);

        try {
            const response = await this.sendAndWait(msg);
            const parsed = parseSaveResponse(response);

            if (parsed.status === 'saved') {
                return parsed.hash;
            }

            console.error('TokoloshService: Save failed:', parsed.message);
            return null;
        } catch (err: any) {
            console.error('TokoloshService: Failed to upload image:', err.message);
            return null;
        }
    }

    /** Clear the image cache. */
    public clearCache(): void {
        this.cache.clear();
    }

    /** Dispose the service and close the connection. */
    public dispose(): void {
        if (this.ws) {
            this.ws.close();
        }
        this.cache.clear();
        for (const req of this.pendingRequests) {
            clearTimeout(req.timer);
            req.reject(new Error('Disposed'));
        }
        this.pendingRequests = [];
    }
}
