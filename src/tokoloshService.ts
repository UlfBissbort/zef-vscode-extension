/* +++
ET.TypeScriptFile('🍃-d2a65aca2ec5d83feb31',
  tag_=[],
  created=Time('2026-08-12 16:13:26 +0800')
)
+++ */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { StoreBridge } from './storeBridge';

const DEBUG_LOG = path.join(os.tmpdir(), 'zef-tokolosh-debug.log');
const HASH = /^🗿-[0-9a-fA-F]{64}$/;
const IMAGE_MIMES: Record<string, string> = {
    PngImage: 'image/png', JpgImage: 'image/jpeg', GifImage: 'image/gif',
    WebpImage: 'image/webp', SvgImage: 'image/svg+xml',
};

export function debugLog(msg: string): void {
    try { fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`); } catch {}
}
export function zefTypeToMime(type: string): string { return IMAGE_MIMES[type] || 'application/octet-stream'; }
export function mimeToZefType(mime: string): string {
    return Object.keys(IMAGE_MIMES).find(type => IMAGE_MIMES[type] === mime) || 'PngImage';
}
export function buildDataUri(mime: string, base64Data: string): string { return `data:${mime};base64,${base64Data}`; }
export function generateUid(): string { return '🍃-' + crypto.randomBytes(10).toString('hex'); }

// These are bridge requests, not handwritten ZefNet envelopes. The runtime
// constructs native FX values and uses the private Tokolosh coordinator.
export function buildRetrieveMessage(type: string, hash: string, _uid?: string): object {
    if (!HASH.test(hash)) { throw new Error('Invalid Merkle hash'); }
    return { operation: 'execute', command: {
        __type: 'FX.RetrieveFromHashStore', hash: { __type: 'MerkleHash', data_type: type, hash },
    } };
}
export function buildSaveMessage(type: string, base64Data: string, _uid?: string): object {
    if (!IMAGE_MIMES[type]) { throw new Error(`Unsupported upload type: ${type}`); }
    // SVG's JSON-like codec carries UTF-8 text, unlike raster image codecs.
    const data = type === 'SvgImage' ? Buffer.from(base64Data, 'base64').toString('utf8') : base64Data;
    return { operation: 'execute', command: { __type: 'FX.SaveToHashStore', value: { __type: type, data } } };
}
export function parseRetrieveResponse(msg: any): { status: 'found'; type: string; data: string } | { status: 'error'; message: string } {
    if (typeof msg?.__type === 'string' && IMAGE_MIMES[msg.__type] && typeof msg.data === 'string') {
        return { status: 'found', type: msg.__type,
            data: msg.__type === 'SvgImage' ? Buffer.from(msg.data, 'utf8').toString('base64') : msg.data };
    }
    return { status: 'error', message: 'Store did not return a supported image value' };
}
export function parseSaveResponse(msg: any): { status: 'saved'; hash: string } | { status: 'error'; message: string } {
    if (msg?.hash?.__type === 'MerkleHash' && typeof msg.hash.hash === 'string' && HASH.test(msg.hash.hash)
        && msg.receipt?.status === 'merged' && msg.receipt?.guarantee === 'physical_records') {
        return { status: 'saved', hash: msg.hash.hash };
    }
    return { status: 'error', message: 'Store save did not return a MerkleHash and physical-merge receipt' };
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

export type TokoloshConnectionPhase = 'idle' | 'discovering' | 'opening' | 'registered' | 'unavailable' | 'closed';
export interface TokoloshConnectionSnapshot {
    phase: TokoloshConnectionPhase;
    port: number | null;
    endpoint: string | null;
    error: string | null;
}

/** Store client using the installed runtime's native local Tokolosh transport. */
export class TokoloshService {
    private static _instance: TokoloshService;
    private bridge = new StoreBridge();
    private cache = new Map<string, string>();
    private textCache = new Map<string, string>();
    private connecting: Promise<boolean> | null = null;
    private phase: TokoloshConnectionPhase = 'idle';
    private lastError: string | null = null;
    private endpoint: string | null = null;
    private statusCallback: (() => void) | null = null;

    private constructor() {}
    public static getInstance(): TokoloshService {
        if (!this._instance) { this._instance = new TokoloshService(); }
        return this._instance;
    }
    public get isConnected(): boolean { return this.phase === 'registered'; }
    public get port(): number | null { return null; }
    public get snapshot(): TokoloshConnectionSnapshot {
        return { phase: this.phase, port: null, endpoint: this.endpoint, error: this.lastError };
    }
    public setStatusCallback(callback: () => void): void { this.statusCallback = callback; }
    private notifyStatusChange(): void { this.statusCallback?.(); }
    private failed(error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        debugLog(`Zef Store: ${message}`);
        if (this.phase === 'closed') { return; }
        this.phase = 'unavailable';
        this.lastError = message;
        this.notifyStatusChange();
    }
    private succeeded(): void {
        if (this.phase === 'closed') { return; }
        this.phase = 'registered';
        this.lastError = null;
        this.notifyStatusChange();
    }
    public async ensureConnected(): Promise<boolean> {
        if (this.phase === 'closed') { return false; }
        if (this.connecting) { return this.connecting; }
        this.phase = 'discovering';
        this.notifyStatusChange();
        this.connecting = (async () => {
            try {
                const result = await this.bridge.request({ operation: 'probe' });
                this.endpoint = result.socket_path;
                this.succeeded();
                return this.phase !== 'closed';
            } catch (error) { this.failed(error); return false; }
        })();
        try { return await this.connecting; } finally { this.connecting = null; }
    }
    private async request(request: object): Promise<any> {
        const result = await this.bridge.request(request);
        this.succeeded();
        return result;
    }
    public async resolveTextValue(type: string, hash: string): Promise<string | null> {
        const key = `${type}/${hash}`;
        const cached = this.textCache.get(key);
        if (cached !== undefined) { return cached; }
        try {
            const value = await this.request(buildRetrieveMessage(type, hash));
            if (value?.__type !== type) { throw new Error(`Store returned a different type than ${type}`); }
            // Entity text fields are literal strings, never implicitly base64.
            const text = typeof value.content === 'string' ? value.content : typeof value.data === 'string' ? value.data : null;
            if (text === null) { throw new Error('Store value has no text content'); }
            this.textCache.set(key, text);
            return text;
        } catch (error) { this.failed(error); return null; }
    }
    public async resolveImage(type: string, hash: string): Promise<string | null> {
        const key = `${type}/${hash}`;
        const cached = this.cache.get(key);
        if (cached !== undefined) { return cached; }
        try {
            const parsed = parseRetrieveResponse(await this.request(buildRetrieveMessage(type, hash)));
            if (parsed.status !== 'found') { throw new Error(parsed.message); }
            if (parsed.type !== type) { throw new Error(`Store returned ${parsed.type}, expected ${type}`); }
            const uri = buildDataUri(zefTypeToMime(parsed.type), parsed.data);
            this.cache.set(key, uri);
            return uri;
        } catch (error) { this.failed(error); return null; }
    }
    public async uploadZefValue(type: string, buffer: Buffer): Promise<string | null> {
        try {
            const result = await this.request(buildSaveMessage(type, buffer.toString('base64')));
            const parsed = parseSaveResponse(result);
            if (parsed.status !== 'saved') { throw new Error(parsed.message); }
            if (result.hash.data_type !== type) { throw new Error('Store returned a different hash type'); }
            return parsed.hash;
        } catch (error) { this.failed(error); return null; }
    }
    public clearCache(): void { this.cache.clear(); this.textCache.clear(); }
    public dispose(): void {
        this.phase = 'closed';
        this.bridge.dispose();
        this.clearCache();
        this.notifyStatusChange();
    }
}
