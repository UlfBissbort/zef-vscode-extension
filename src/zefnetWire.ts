/* +++
ET.TypeScriptFile('🍃-95e741d58a8bd1258575',
  tag_=[],
  created=Time('2026-08-27 14:30:14 +0800')
)
+++ */

import * as crypto from 'crypto';

/** Narrow, dependency-free implementation of ZefNet/Zef Messaging protocol v1.
 *
 * Source of truth: zef/crates/zefnet_message_encoding/docs/wire-format.md.
 * This module intentionally supports only the binary session and JSON-like data
 * frames needed by the extension's local Tokolosh service client.
 */
const ARRAY2 = 0x29;
const UINT8 = 0x4f;
const ENTITY_UID = 0x21;
const STRING_SHORT = 0x11;
const STRING_MEDIUM = 0x12;
const STRING_LONG = 0x13;
const TIME = 0x43;
const VERSION = 1;
const JSON_LIKE = 1;
const COMMON_PREFIX_SIZE = 61;
const RETURN_CONTEXT_SIZE = 43;
const DATA_PAYLOAD_OFFSET = COMMON_PREFIX_SIZE + RETURN_CONTEXT_SIZE;
const SESSION_FRAME_SIZE = 45;
const ZEF_PROCESS_TYPE = Uint8Array.from([226, 230, 195, 22, 20]);
const DATA_JSON_LIKE_TYPE = Uint8Array.from([31, 35, 64, 72, 89]);
const CLIENT_HELLO_TYPE = Uint8Array.from([12, 112, 33, 116, 136]);
const SESSION_ACCEPTED_TYPE = Uint8Array.from([254, 184, 126, 6, 137]);
const SESSION_REJECTED_TYPE = Uint8Array.from([212, 162, 32, 29, 252]);
const DISCONNECT_TYPE = Uint8Array.from([219, 28, 244, 24, 36]);
const DISCONNECT_ACCEPTED_TYPE = Uint8Array.from([188, 118, 0, 40, 164]);
const RETURN_CAPABILITY_TYPE = Uint8Array.from([51, 16, 64, 183, 28]);

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

function validateReturnContext(bytes: Uint8Array, origin: NodeIdentifier, id: MessageId): void {
    requireRange(bytes, COMMON_PREFIX_SIZE, RETURN_CONTEXT_SIZE, 'return context');
    requireHeader(bytes, 61, UINT8, 'return disposition');
    const disposition = bytes[62];
    const gateway = validateNodeIdentifier(bytes, 63, 'return gateway');
    const token = validateNodeIdentifier(bytes, 79, 'return capability');
    requireHeader(bytes, 95, TIME, 'return expiry');
    const coefficient = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigInt64(96, true);
    if (disposition === 0) {
        if (!equalBytes(gateway, origin) || !equalBytes(token, typedUid(RETURN_CAPABILITY_TYPE, id)) || coefficient !== 0n) {
            throw new ZefNetWireError('None return context is not canonical');
        }
        return;
    }
    if (disposition < 1 || disposition > 3) { throw new ZefNetWireError(`unknown return disposition ${disposition}`); }
    if (!equalBytes(token.slice(1, 6), RETURN_CAPABILITY_TYPE)) { throw new ZefNetWireError('return capability has an unexpected entity type'); }
    if (coefficient <= 0n || coefficient % 100000000n !== 0n) {
        throw new ZefNetWireError('return expiry must be a positive whole-second Time');
    }
}

function encodeNoneReturnContext(origin: NodeIdentifier, id: MessageId): Uint8Array {
    const output = new Uint8Array(RETURN_CONTEXT_SIZE);
    output.set([UINT8, 0], 0);
    output.set(origin, 2);
    output.set(typedUid(RETURN_CAPABILITY_TYPE, id), 18);
    output[34] = TIME;
    return output;
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

export function encodeDataMessageJsonLike(origin: NodeIdentifier, target: NodeIdentifier, id: MessageId, payload: string, hops: number = 0): Uint8Array {
    requireBytes(origin, 16, 'origin');
    requireBytes(target, 16, 'target');
    validateNodeIdentifier(origin, 0, 'origin');
    validateNodeIdentifier(target, 0, 'target');
    validateMessageId(id);
    if (!Number.isInteger(hops) || hops < 0 || hops > 255) { throw new ZefNetWireError('hops must be an unsigned byte'); }
    const text = encodeText(payload);
    return encodeArray2(Uint8Array.from([
        UINT8, VERSION,
        UINT8, hops,
        ...origin,
        ...target,
        ...typedUid(DATA_JSON_LIKE_TYPE, id),
        ...encodeNoneReturnContext(origin, id),
        ...text,
    ]));
}

export interface DecodedDataMessageJsonLike {
    origin: NodeIdentifier;
    target: NodeIdentifier;
    id: MessageId;
    payload: string;
}

export function decodeDataMessageJsonLike(bytes: Uint8Array): DecodedDataMessageJsonLike {
    if (bytes.length < DATA_PAYLOAD_OFFSET) { throw new ZefNetWireError(`routed record is too short: ${bytes.length}`); }
    validateArray2(bytes);
    requireHeader(bytes, 9, UINT8, 'routed version');
    if (bytes[10] !== VERSION) { throw new ZefNetWireError(`unsupported routed version ${bytes[10]}`); }
    requireHeader(bytes, 11, UINT8, 'hop count');
    const origin = validateNodeIdentifier(bytes, 13, 'origin');
    const target = validateNodeIdentifier(bytes, 29, 'target');
    requireHeader(bytes, 45, ENTITY_UID, 'routed message UID');
    if (!equalBytes(bytes.slice(46, 51), DATA_JSON_LIKE_TYPE)) { throw new ZefNetWireError('routed record is not DataMessageJsonLike'); }
    const id = bytes.slice(51, 61);
    validateReturnContext(bytes, origin, id);
    return { origin, target, id, payload: decodeText(bytes, DATA_PAYLOAD_OFFSET) };
}
