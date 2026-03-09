/**
 * Pure data structure tracking execution history across all code blocks.
 * Immutable-style: each mutation returns a new state.
 */

import * as crypto from 'crypto';

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ExecutionRecord {
    language: string;
    contentHash: string;
    capturedVariables: Record<string, JsonValue>;
    nonSerializable: string[];
    executedAt: number;
    durationMs: number;
}

export interface ExecutionLog {
    records: ExecutionRecord[];
    mergedNamespace: Record<string, JsonValue>;
}

// ─── Pure functions ──────────────────────────────────────────────────────────

export function emptyLog(): ExecutionLog {
    return { records: [], mergedNamespace: {} };
}

export function addRecord(log: ExecutionLog, record: ExecutionRecord): ExecutionLog {
    const records = [...log.records, record];
    return { records, mergedNamespace: recomputeNamespace(records) };
}

export function clearLog(): ExecutionLog {
    return emptyLog();
}

export function contentHash(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex').slice(0, 16);
}

function recomputeNamespace(records: ExecutionRecord[]): Record<string, JsonValue> {
    const merged: Record<string, JsonValue> = {};
    for (const record of records) {
        Object.assign(merged, record.capturedVariables);
    }
    return merged;
}

// ─── Singleton (session state, not persisted) ────────────────────────────────

let currentLog: ExecutionLog = emptyLog();

export function getLog(): ExecutionLog {
    return currentLog;
}

export function pushRecord(record: ExecutionRecord): ExecutionLog {
    currentLog = addRecord(currentLog, record);
    return currentLog;
}

export function resetLog(): ExecutionLog {
    currentLog = emptyLog();
    return currentLog;
}
