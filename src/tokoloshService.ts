/* +++
ET.TypeScriptFile('🍃-d2a65aca2ec5d83feb31',
  tag_=[],
  created=Time('2026-08-12 16:13:26 +0800')
)
+++ */

import WebSocket from 'ws';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    DecodedDataMessageJsonLike,
    NodeIdentifier,
    decodeDataMessageJsonLike,
    decodeSessionAccepted,
    decodeSessionRejected,
    encodeClientHello,
    encodeDataMessageJsonLike,
    nodeIdentifierFromUid,
    randomMessageId,
} from './zefnetWire';

const DEBUG_LOG = path.join(os.tmpdir(), 'zef-tokolosh-debug.log');
const PORT_MIN = 27021;
const PORT_MAX = 27040;
const ZEFNET_PATH = '/zefnet';
const CONNECT_TIMEOUT = 2000;
const REQUEST_TIMEOUT = 5000;

export function debugLog(msg: string): void {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try { fs.appendFileSync(DEBUG_LOG, line); } catch {}
}

export function zefTypeToMime(type: string): string {
    const map: Record<string, string> = {
        PngImage: 'image/png', JpgImage: 'image/jpeg', GifImage: 'image/gif', WebpImage: 'image/webp', SvgImage: 'image/svg+xml',
    };
    return map[type] || 'application/octet-stream';
}

export function mimeToZefType(mime: string): string {
    const map: Record<string, string> = {
        'image/png': 'PngImage', 'image/jpeg': 'JpgImage', 'image/gif': 'GifImage', 'image/webp': 'WebpImage', 'image/svg+xml': 'SvgImage',
    };
    return map[mime] || 'PngImage';
}

export function buildDataUri(mime: string, base64Data: string): string {
    return `data:${mime};base64,${base64Data}`;
}

export function generateUid(): string {
    return '🍃-' + crypto.randomBytes(10).toString('hex');
}

export function buildRetrieveMessage(type: string, hash: string, uid: string): object {
    return { __type: 'ET.ZefServiceRequest', __uid: uid, command: { __type: 'FX.HashStoreGet', hash: `${type}('${hash}')` } };
}

export function buildSaveMessage(type: string, base64Data: string, uid: string): object {
    return { __type: 'ET.ZefServiceRequest', __uid: uid, command: { __type: 'FX.HashStorePut', value: { __type: type, data: base64Data } } };
}

export function parseRetrieveResponse(msg: any): { status: 'found'; type: string; data: string } | { status: 'not-found' } | { status: 'error'; message: string } {
    if (msg?.__type === 'ET.HashStoreGetResponse' && msg.value?.__type && msg.value?.data) {
        return { status: 'found', type: msg.value.__type, data: msg.value.data };
    }
    if (msg?.__type === 'ET.HashStoreNotFound') { return { status: 'not-found' }; }
    return { status: 'error', message: `Unexpected response type: ${JSON.stringify(msg)}` };
}

export function parseSaveResponse(msg: any): { status: 'saved'; hash: string } | { status: 'error'; message: string } {
    if (msg?.__type === 'ET.HashStoreResponse' && typeof msg.hash === 'string') {
        const match = msg.hash.match(/^[^(]+\('(🗿-[0-9a-fA-F]{64})'\)$/);
        if (match) { return { status: 'saved', hash: match[1] }; }
        if (msg.hash.startsWith('🗿-')) { return { status: 'saved', hash: msg.hash }; }
    }
    return { status: 'error', message: `Could not extract hash from save response: ${JSON.stringify(msg)}` };
}

export function buildPlaceholderDataUri(type: string, hash: string, reason: string): string {
    const shortHash = hash.length > 16 ? hash.slice(0, 12) + '…' + hash.slice(-8) : hash;
    const label = `${reason}: ${type}/${shortHash}`;
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='50'><rect fill='%231e1e1e' width='100%25' height='100%25' rx='8'/><text x='50%25' y='50%25' fill='%23888' font-size='11' font-family='monospace' text-anchor='middle' dy='0.35em'>⚠️ ${label}</text></svg>`;
}

export function extractFigureRefs(sideEffectsText: string): Array<{ type: string; hash: string }> {
    const refs: Array<{ type: string; hash: string }> = [];
    const figRegex = /(?:ET\.MatplotlibFigurePrinted\(|what='matplotlib_figure'[\s\S]*?content=)(\w+)\('(🗿-[0-9a-fA-F]{64})'\)/g;
    let match: RegExpExecArray | null;
    while ((match = figRegex.exec(sideEffectsText)) !== null) { refs.push({ type: match[1], hash: match[2] }); }
    return refs;
}

interface PendingRequest { resolve: (result: any) => void; reject: (reason: Error) => void; timer: NodeJS.Timeout; }
interface ConnectedSocket { ws: WebSocket; port: number; server: NodeIdentifier; }

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function websocketBytes(data: WebSocket.RawData, isBinary: boolean): Uint8Array {
    if (!isBinary) { throw new Error('ZefNet protocol records must be binary WebSocket messages'); }
    if (Array.isArray(data)) { return Buffer.concat(data); }
    if (data instanceof ArrayBuffer) { return new Uint8Array(data); }
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/** A persistent, binary protocol-v1 client for Tokolosh's local ZefNet service endpoint. */
export class TokoloshService {
    private static _instance: TokoloshService;
    private ws: WebSocket | null = null;
    private connected = false;
    private connectedPort: number | null = null;
    private serverIdentity: NodeIdentifier | null = null;
    private readonly clientUid = generateUid();
    private readonly clientIdentity = nodeIdentifierFromUid(this.clientUid);
    private cache = new Map<string, string>();
    private textCache = new Map<string, string>();
    private pendingRequests = new Map<string, PendingRequest>();
    private connecting: Promise<boolean> | null = null;
    private statusCallback: (() => void) | null = null;

    private constructor() {}
    public static getInstance(): TokoloshService {
        if (!TokoloshService._instance) { TokoloshService._instance = new TokoloshService(); }
        return TokoloshService._instance;
    }
    public get isConnected(): boolean { return this.connected && this.ws?.readyState === WebSocket.OPEN; }
    public get port(): number | null { return this.connectedPort; }
    public setStatusCallback(callback: () => void): void { this.statusCallback = callback; }
    private notifyStatusChange(): void { this.statusCallback?.(); }

    public async ensureConnected(): Promise<boolean> {
        if (this.isConnected) { return true; }
        if (this.connecting) { return this.connecting; }
        this.connecting = this.connect();
        try { return await this.connecting; } finally { this.connecting = null; }
    }

    private candidateUrls(): Array<{ url: string; port: number }> {
        const override = process.env.ZEFNET_TOKOLOSH_URL;
        if (override) {
            const parsed = new URL(override);
            return [{ url: override, port: Number(parsed.port) || (parsed.protocol === 'wss:' ? 443 : 80) }];
        }
        return Array.from({ length: PORT_MAX - PORT_MIN + 1 }, (_, index) => {
            const port = PORT_MIN + index;
            return { url: `ws://127.0.0.1:${port}${ZEFNET_PATH}`, port };
        });
    }

    private async connect(): Promise<boolean> {
        for (const candidate of this.candidateUrls()) {
            try {
                const connection = await this.openSession(candidate.url, candidate.port);
                this.installConnectedSocket(connection);
                return true;
            } catch (error: any) {
                debugLog(`ZefNet connection failed at ${candidate.url}: ${error.message}`);
            }
        }
        return false;
    }

    private openSession(url: string, port: number): Promise<ConnectedSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            const helloId = randomMessageId();
            let settled = false;
            const fail = (error: Error): void => {
                if (settled) { return; }
                settled = true;
                clearTimeout(timer);
                try { ws.close(); } catch {}
                reject(error);
            };
            const timer = setTimeout(() => fail(new Error(`session opening timed out after ${CONNECT_TIMEOUT}ms`)), CONNECT_TIMEOUT);
            ws.on('open', () => ws.send(encodeClientHello(helloId, this.clientIdentity), { binary: true }));
            ws.on('message', (data, isBinary) => {
                try {
                    const bytes = websocketBytes(data, isBinary);
                    let server: NodeIdentifier;
                    try {
                        server = decodeSessionAccepted(bytes, helloId);
                    } catch {
                        const rejection = decodeSessionRejected(bytes, helloId);
                        fail(new Error(`Tokolosh rejected ZefNet session: ${rejection}`));
                        return;
                    }
                    settled = true;
                    clearTimeout(timer);
                    ws.removeAllListeners();
                    resolve({ ws, port, server });
                } catch (error: any) { fail(new Error(`invalid ZefNet session response: ${error.message}`)); }
            });
            ws.on('error', error => fail(error));
            ws.on('close', () => fail(new Error('connection closed during session opening')));
        });
    }

    private installConnectedSocket(connection: ConnectedSocket): void {
        this.ws = connection.ws;
        this.connectedPort = connection.port;
        this.serverIdentity = connection.server;
        this.connected = true;
        connection.ws.on('message', (data, isBinary) => this.handleWireMessage(data, isBinary));
        connection.ws.on('error', error => debugLog(`ZefNet WebSocket error: ${error.message}`));
        connection.ws.on('close', () => this.handleDisconnect('connection closed'));
        debugLog(`Registered binary ZefNet protocol-1 session on port ${connection.port}`);
        this.notifyStatusChange();
    }

    private handleWireMessage(data: WebSocket.RawData, isBinary: boolean): void {
        try {
            const message: DecodedDataMessageJsonLike = decodeDataMessageJsonLike(websocketBytes(data, isBinary));
            if (!equalBytes(message.target, this.clientIdentity)) { return; }
            const response = JSON.parse(message.payload);
            if (response?.__type !== 'ET.ZefServiceResponse' || !response.request?.__uid) { return; }
            const pending = this.pendingRequests.get(response.request.__uid);
            if (!pending) { return; }
            this.pendingRequests.delete(response.request.__uid);
            clearTimeout(pending.timer);
            if (typeof response.result?.__type === 'string' && response.result.__type.startsWith('Error.')) {
                pending.reject(new Error(JSON.stringify(response.result)));
            } else {
                pending.resolve(response.result);
            }
        } catch (error: any) {
            // Ignore unrelated routed records, but preserve evidence for protocol failures.
            debugLog(`Ignored invalid or unrelated ZefNet record: ${error.message}`);
        }
    }

    private handleDisconnect(reason: string): void {
        const wasConnected = this.connected || this.ws !== null;
        this.ws = null;
        this.connected = false;
        this.connectedPort = null;
        this.serverIdentity = null;
        for (const pending of this.pendingRequests.values()) {
            clearTimeout(pending.timer);
            pending.reject(new Error(`Tokolosh ${reason}`));
        }
        this.pendingRequests.clear();
        if (wasConnected) { this.notifyStatusChange(); }
    }

    private async sendAndWait(request: any, timeoutMs: number = REQUEST_TIMEOUT): Promise<any> {
        if (!await this.ensureConnected() || !this.ws || !this.serverIdentity) {
            throw new Error('Could not establish a binary ZefNet session with Tokolosh');
        }
        const requestUid = request.__uid;
        if (typeof requestUid !== 'string' || !requestUid) { throw new Error('Zef service request has no UID'); }
        const frame = encodeDataMessageJsonLike(this.clientIdentity, this.serverIdentity, randomMessageId(), JSON.stringify(request));
        return new Promise((resolve, reject) => {
            const pending: PendingRequest = {
                resolve, reject,
                timer: setTimeout(() => {
                    this.pendingRequests.delete(requestUid);
                    reject(new Error(`Tokolosh request timed out after ${timeoutMs}ms`));
                }, timeoutMs),
            };
            this.pendingRequests.set(requestUid, pending);
            this.ws!.send(frame, { binary: true }, error => {
                if (!error) { return; }
                this.pendingRequests.delete(requestUid);
                clearTimeout(pending.timer);
                reject(error);
            });
        });
    }

    public async resolveTextValue(type: string, hash: string): Promise<string | null> {
        const cacheKey = `${type}/${hash}`;
        const cached = this.textCache.get(cacheKey);
        if (cached !== undefined) { return cached; }
        try {
            const result = await this.sendAndWait(buildRetrieveMessage(type, hash, generateUid()));
            const value = result?.__type === 'ET.HashStoreGetResponse' ? result.value : null;
            if (value?.__type !== type) { return null; }
            const text = typeof value.content === 'string' ? value.content : typeof value.data === 'string' ? Buffer.from(value.data, 'base64').toString('utf8') : null;
            if (text === null) { return null; }
            this.textCache.set(cacheKey, text);
            return text;
        } catch (error: any) { debugLog(`Failed to resolve text value: ${error.message}`); return null; }
    }

    public async resolveImage(type: string, hash: string): Promise<string | null> {
        const cacheKey = `${type}/${hash}`;
        const cached = this.cache.get(cacheKey);
        if (cached) { return cached; }
        try {
            const result = await this.sendAndWait(buildRetrieveMessage(type, hash, generateUid()));
            const parsed = parseRetrieveResponse(result);
            if (parsed.status !== 'found') { return null; }
            const dataUri = buildDataUri(zefTypeToMime(parsed.type), parsed.data);
            this.cache.set(cacheKey, dataUri);
            return dataUri;
        } catch (error: any) { debugLog(`Failed to resolve image: ${error.message}`); return null; }
    }

    public async uploadZefValue(type: string, buffer: Buffer): Promise<string | null> {
        try {
            const result = await this.sendAndWait(buildSaveMessage(type, buffer.toString('base64'), generateUid()));
            const parsed = parseSaveResponse(result);
            return parsed.status === 'saved' ? parsed.hash : null;
        } catch (error: any) { debugLog(`Failed to upload value: ${error.message}`); return null; }
    }

    public clearCache(): void { this.cache.clear(); this.textCache.clear(); }
    public dispose(): void {
        const ws = this.ws;
        this.handleDisconnect('service disposed');
        try { ws?.close(); } catch {}
        this.clearCache();
    }
}
