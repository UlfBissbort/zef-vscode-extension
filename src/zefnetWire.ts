/* +++
ET.TypeScriptFile('🍃-95e741d58a8bd1258575',
  tag_=[],
  created=Time('2026-08-27 14:30:14 +0800')
)
+++ */

import * as crypto from 'crypto';

/** Narrow, dependency-free implementation of the Zef Messaging session (version 1)
 * and the ZefNet v2 routed envelope ([[wire-format]]).
 *
 * Source of truth: zef/crates/zefnet_message_encoding. This module intentionally
 * supports only the binary session and JSON-like data records needed by the
 * extension's local Tokolosh service client.
 */
const ARRAY1 = 0x28;
const ARRAY2 = 0x29;
const NIL = 0x07;
const UINT8 = 0x4f;
const ENTITY_UID = 0x21;
const STRING_SHORT = 0x11;
const STRING_MEDIUM = 0x12;
const STRING_LONG = 0x13;
const VERSION = 1;
const ROUTED_VERSION = 2;
const JSON_LIKE = 1;
const TARGET_OFFSET = 31;
const MAX_PATH_ELEMENTS = 9;
const SESSION_FRAME_SIZE = 45;
const ZEF_PROCESS_TYPE = Uint8Array.from([226, 230, 195, 22, 20]);
const DATA_JSON_LIKE_TYPE = Uint8Array.from([31, 35, 64, 72, 89]);
const DELIVERY_ERROR_TYPE = Uint8Array.from([186, 194, 62, 7, 134]);
const CLIENT_HELLO_TYPE = Uint8Array.from([12, 112, 33, 116, 136]);
const SESSION_ACCEPTED_TYPE = Uint8Array.from([254, 184, 126, 6, 137]);
const SESSION_REJECTED_TYPE = Uint8Array.from([212, 162, 32, 29, 252]);
const DISCONNECT_TYPE = Uint8Array.from([219, 28, 244, 24, 36]);
const DISCONNECT_ACCEPTED_TYPE = Uint8Array.from([188, 118, 0, 40, 164]);

export type NodeIdentifier = Uint8Array;
export type MessageId = Uint8Array;

export class ZefNetWireError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ZefNetWireError';
    }
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

function requireBytes(value: Uint8Array, length: number, name: string): void {
    if (value.length !== length) {
        throw new ZefNetWireError(`${name} must contain exactly ${length} bytes`);
    }
}

function requireRange(bytes: Uint8Array, start: number, length: number, name: string): void {
    if (start < 0 || length < 0 || start + length > bytes.length) {
        throw new ZefNetWireError(`${name} is truncated`);
    }
}

function requireHeader(bytes: Uint8Array, offset: number, expected: number, name: string): void {
    requireRange(bytes, offset, 1, name);
    if (bytes[offset] !== expected) {
        throw new ZefNetWireError(`${name} has header 0x${bytes[offset].toString(16)}, expected 0x${expected.toString(16)}`);
    }
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
    requireRange(bytes, offset, 8, 'u64');
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(offset, true);
}

function writeU64LE(bytes: Uint8Array, offset: number, value: bigint): void {
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setBigUint64(offset, value, true);
}

function typedUid(type: Uint8Array, id: MessageId): Uint8Array {
    requireBytes(type, 5, 'entity type');
    requireBytes(id, 10, 'message ID');
    return Uint8Array.from([ENTITY_UID, ...type, ...id]);
}

function validateArray2(bytes: Uint8Array): void {
    requireRange(bytes, 0, 9, 'Array2');
    requireHeader(bytes, 0, ARRAY2, 'Array2');
    const declared = readU64LE(bytes, 1);
    const actual = BigInt(bytes.length - 9);
    if (declared !== actual) {
        throw new ZefNetWireError(`Array2 body size ${declared} does not match ${actual}`);
    }
}

function validateNodeIdentifier(bytes: Uint8Array, offset: number, name: string): NodeIdentifier {
    requireRange(bytes, offset, 16, name);
    requireHeader(bytes, offset, ENTITY_UID, name);
    return bytes.slice(offset, offset + 16);
}

function validateMessageId(value: MessageId): void {
    requireBytes(value, 10, 'message ID');
}

function encodeArray2(body: Uint8Array): Uint8Array {
    const output = new Uint8Array(9 + body.length);
    output[0] = ARRAY2;
    writeU64LE(output, 1, BigInt(body.length));
    output.set(body, 9);
    return output;
}

function encodeText(text: string): Uint8Array {
    const payload = new TextEncoder().encode(text);
    let headerSize: number;
    let header: number;
    if (payload.length <= 0xff) {
        headerSize = 2;
        header = STRING_SHORT;
    } else if (payload.length <= 0xffff) {
        headerSize = 3;
        header = STRING_MEDIUM;
    } else {
        headerSize = 9;
        header = STRING_LONG;
    }
    const output = new Uint8Array(headerSize + payload.length);
    output[0] = header;
    if (headerSize === 2) {
        output[1] = payload.length;
    } else if (headerSize === 3) {
        new DataView(output.buffer).setUint16(1, payload.length, true);
    } else {
        writeU64LE(output, 1, BigInt(payload.length));
    }
    output.set(payload, headerSize);
    return output;
}

function decodeText(bytes: Uint8Array, offset: number): string {
    requireRange(bytes, offset, 1, 'text payload');
    const header = bytes[offset];
    let headerSize: number;
    let length: number;
    if (header === STRING_SHORT) {
        requireRange(bytes, offset, 2, 'short text payload');
        headerSize = 2;
        length = bytes[offset + 1];
    } else if (header === STRING_MEDIUM) {
        requireRange(bytes, offset, 3, 'medium text payload');
        headerSize = 3;
        length = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset + 1, true);
        if (length <= 0xff) { throw new ZefNetWireError('text payload uses a non-canonical medium header'); }
    } else if (header === STRING_LONG) {
        requireRange(bytes, offset, 9, 'long text payload');
        headerSize = 9;
        const wireLength = readU64LE(bytes, offset + 1);
        if (wireLength > BigInt(Number.MAX_SAFE_INTEGER)) { throw new ZefNetWireError('text payload is too large'); }
        length = Number(wireLength);
        if (length <= 0xffff) { throw new ZefNetWireError('text payload uses a non-canonical long header'); }
    } else {
        throw new ZefNetWireError(`text payload has unsupported header 0x${header.toString(16)}`);
    }
    if (offset + headerSize + length !== bytes.length) {
        throw new ZefNetWireError('text payload length does not consume the complete routed record');
    }
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(offset + headerSize));
    } catch {
        throw new ZefNetWireError('text payload is not valid UTF-8');
    }
}

function validateSessionFrame(bytes: Uint8Array, expectedType: Uint8Array, name: string): { id: MessageId; identity: NodeIdentifier; encoding: number } {
    if (bytes.length !== SESSION_FRAME_SIZE) { throw new ZefNetWireError(`${name} has invalid size ${bytes.length}`); }
    validateArray2(bytes);
    requireHeader(bytes, 9, ENTITY_UID, `${name} message UID`);
    if (!equalBytes(bytes.slice(10, 15), expectedType)) { throw new ZefNetWireError(`expected ${name}`); }
    requireHeader(bytes, 25, UINT8, `${name} version`);
    if (bytes[26] !== VERSION) { throw new ZefNetWireError(`unsupported ${name} version ${bytes[26]}`); }
    const identity = validateNodeIdentifier(bytes, 27, `${name} identity`);
    requireHeader(bytes, 43, UINT8, `${name} payload encoding`);
    return { id: bytes.slice(15, 25), identity, encoding: bytes[44] };
}

export function randomMessageId(): MessageId {
    return crypto.randomBytes(10);
}

export function nodeIdentifierFromUid(uid: string, entityType: Uint8Array = ZEF_PROCESS_TYPE): NodeIdentifier {
    if (!/^🍃-[0-9a-f]{20}$/i.test(uid)) { throw new ZefNetWireError(`invalid Zef UID ${uid}`); }
    requireBytes(entityType, 5, 'node entity type');
    const suffix = uid.slice('🍃-'.length);
    const id = Uint8Array.from(Buffer.from(suffix, 'hex'));
    requireBytes(id, 10, 'node UID');
    return Uint8Array.from([ENTITY_UID, ...entityType, ...id]);
}

/** Extract the 10-byte wire message ID carried by a canonical Zef UID. */
export function messageIdFromUid(uid: string): MessageId {
    return nodeIdentifierFromUid(uid).slice(6);
}

export function encodeClientHello(id: MessageId, client: NodeIdentifier): Uint8Array {
    validateMessageId(id);
    requireBytes(client, 16, 'client identity');
    validateNodeIdentifier(client, 0, 'client identity');
    return encodeArray2(Uint8Array.from([
        ...typedUid(CLIENT_HELLO_TYPE, id),
        UINT8, VERSION,
        ...client,
        UINT8, JSON_LIKE,
    ]));
}

export function decodeSessionAccepted(bytes: Uint8Array, expectedId: MessageId): NodeIdentifier {
    validateMessageId(expectedId);
    const frame = validateSessionFrame(bytes, SESSION_ACCEPTED_TYPE, 'SessionAccepted');
    if (!equalBytes(frame.id, expectedId)) { throw new ZefNetWireError('SessionAccepted refers to another ClientHello'); }
    if (frame.encoding !== JSON_LIKE) { throw new ZefNetWireError(`SessionAccepted selected unsupported payload encoding ${frame.encoding}`); }
    return frame.identity;
}

export function decodeSessionRejected(bytes: Uint8Array, expectedId: MessageId): string {
    validateMessageId(expectedId);
    validateArray2(bytes);
    requireRange(bytes, 0, 27, 'SessionRejected');
    requireHeader(bytes, 9, ENTITY_UID, 'SessionRejected message UID');
    if (!equalBytes(bytes.slice(10, 15), SESSION_REJECTED_TYPE) || !equalBytes(bytes.slice(15, 25), expectedId)) {
        throw new ZefNetWireError('invalid or uncorrelated SessionRejected');
    }
    requireHeader(bytes, 25, UINT8, 'SessionRejected version');
    if (bytes[26] !== VERSION) { throw new ZefNetWireError(`unsupported SessionRejected version ${bytes[26]}`); }
    return decodeText(bytes, 27);
}

export function encodeDisconnect(id: MessageId): Uint8Array {
    validateMessageId(id);
    return encodeArray2(Uint8Array.from([...typedUid(DISCONNECT_TYPE, id), UINT8, VERSION]));
}

export function isDisconnectAccepted(bytes: Uint8Array, expectedId: MessageId): boolean {
    try {
        validateMessageId(expectedId);
        if (bytes.length !== 27) { return false; }
        validateArray2(bytes);
        return bytes[9] === ENTITY_UID && equalBytes(bytes.slice(10, 15), DISCONNECT_ACCEPTED_TYPE)
            && equalBytes(bytes.slice(15, 25), expectedId) && bytes[25] === UINT8 && bytes[26] === VERSION;
    } catch {
        return false;
    }
}

/** A ZefNet address: one entity, or `[domain…, destination]` ([[wire-format]] §3.3). */
export type Path = NodeIdentifier[];

function encodePath(path: Path, name: string): number[] {
    if (path.length < 1 || path.length > MAX_PATH_ELEMENTS) { throw new ZefNetWireError(`${name} must contain 1 to ${MAX_PATH_ELEMENTS} entities`); }
    path.forEach((element, index) => {
        requireBytes(element, 16, `${name}[${index}]`);
        validateNodeIdentifier(element, 0, `${name}[${index}]`);
    });
    // One element is written as a bare EntityUid, as the Rust encoder does.
    return path.length === 1 ? [...path[0]] : [ARRAY1, 16 * path.length, ...path.flatMap((element) => [...element])];
}

function decodePath(bytes: Uint8Array, offset: number, name: string): { path: Path; end: number } {
    requireRange(bytes, offset, 1, name);
    let start: number;
    let content: number;
    if (bytes[offset] === ENTITY_UID) {
        start = offset;
        content = 16;
    } else if (bytes[offset] === ARRAY1) {
        requireRange(bytes, offset, 2, name);
        start = offset + 2;
        content = bytes[offset + 1];
    } else if (bytes[offset] === ARRAY2) {
        const length = readU64LE(bytes, offset + 1);
        if (length > BigInt(16 * MAX_PATH_ELEMENTS)) { throw new ZefNetWireError(`${name} is too long`); }
        start = offset + 9;
        content = Number(length);
    } else {
        throw new ZefNetWireError(`${name} has header 0x${bytes[offset].toString(16)}, expected an EntityUid or Array of them`);
    }
    if (content % 16 !== 0 || content === 0 || content > 16 * MAX_PATH_ELEMENTS) { throw new ZefNetWireError(`${name} has invalid length ${content}`); }
    requireRange(bytes, start, content, name);
    const path: Path = [];
    for (let index = 0; index < content / 16; index++) {
        path.push(validateNodeIdentifier(bytes, start + 16 * index, `${name}[${index}]`));
    }
    return { path, end: start + content };
}

function requireCounter(value: number, name: string): void {
    if (!Number.isInteger(value) || value < 0 || value > 255) { throw new ZefNetWireError(`${name} must be an unsigned byte`); }
}

/** Encode a v2 JSON-like data record. `origin` null means no replies are possible. */
export function encodeDataMessageJsonLike(origin: Path | null, target: Path, id: MessageId, payload: string, hops: number = 0, attempts: number = 0): Uint8Array {
    validateMessageId(id);
    requireCounter(hops, 'hops');
    requireCounter(attempts, 'attempts');
    return encodeArray2(Uint8Array.from([
        UINT8, ROUTED_VERSION,
        UINT8, hops,
        UINT8, attempts,
        ...typedUid(DATA_JSON_LIKE_TYPE, id),
        ...encodePath(target, 'target'),
        ...(origin === null ? [NIL, 0] : encodePath(origin, 'origin')),
        ...encodeText(payload),
    ]));
}

export interface DecodedRoutedRecord {
    kind: Uint8Array;
    id: MessageId;
    hops: number;
    attempts: number;
    target: Path;
    origin: Path | null;
    payloadOffset: number;
}

export interface DecodedDataMessageJsonLike {
    origin: Path | null;
    target: Path;
    id: MessageId;
    hops: number;
    attempts: number;
    payload: string;
}

export interface DecodedDeliveryError {
    origin: Path | null;
    target: Path;
    id: MessageId;
    /** The id of the message that could not be delivered, as zef_core derives it. */
    failedId: MessageId;
}

/** Decode the v2 envelope shared by every routed record ([[wire-format]] §3.2). */
export function decodeRoutedRecord(bytes: Uint8Array): DecodedRoutedRecord {
    validateArray2(bytes);
    requireRange(bytes, 0, TARGET_OFFSET + 1, 'routed record');
    requireHeader(bytes, 9, UINT8, 'routed version');
    if (bytes[10] !== ROUTED_VERSION) { throw new ZefNetWireError(`unsupported routed version ${bytes[10]}`); }
    requireHeader(bytes, 11, UINT8, 'hops');
    requireHeader(bytes, 13, UINT8, 'attempts');
    requireHeader(bytes, 15, ENTITY_UID, 'routed message UID');
    const target = decodePath(bytes, TARGET_OFFSET, 'target');
    let origin: Path | null = null;
    let payloadOffset: number;
    requireRange(bytes, target.end, 1, 'origin');
    if (bytes[target.end] === NIL) {
        requireRange(bytes, target.end, 2, 'nil origin');
        if (bytes[target.end + 1] !== 0) { throw new ZefNetWireError('nil origin is not canonical'); }
        payloadOffset = target.end + 2;
    } else {
        const decoded = decodePath(bytes, target.end, 'origin');
        origin = decoded.path;
        payloadOffset = decoded.end;
    }
    if (payloadOffset >= bytes.length) { throw new ZefNetWireError('routed record has no payload'); }
    return { kind: bytes.slice(16, 21), id: bytes.slice(21, 31), hops: bytes[12], attempts: bytes[14], target: target.path, origin, payloadOffset };
}

export function decodeDataMessageJsonLike(bytes: Uint8Array): DecodedDataMessageJsonLike {
    const record = decodeRoutedRecord(bytes);
    if (!equalBytes(record.kind, DATA_JSON_LIKE_TYPE)) { throw new ZefNetWireError('routed record is not DataMessageJsonLike'); }
    return { origin: record.origin, target: record.target, id: record.id, hops: record.hops, attempts: record.attempts,
             payload: decodeText(bytes, record.payloadOffset) };
}

/** Recognize a delivery error. Its payload is a Zef-binary ET.ZefNetDeliveryError
 * that this client does not decode; zef_core gives the error the failed message's
 * id with the top bit of its first byte flipped, which is enough to fail the call. */
export function decodeDeliveryError(bytes: Uint8Array): DecodedDeliveryError {
    const record = decodeRoutedRecord(bytes);
    if (!equalBytes(record.kind, DELIVERY_ERROR_TYPE)) { throw new ZefNetWireError('routed record is not DeliveryError'); }
    const failedId = record.id.slice();
    failedId[0] ^= 0x80;
    return { origin: record.origin, target: record.target, id: record.id, failedId };
}
