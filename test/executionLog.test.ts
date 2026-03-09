import { describe, test, expect } from 'bun:test';
import { emptyLog, addRecord, clearLog, contentHash, type ExecutionRecord, type ExecutionLog } from '../src/executionLog';

function makeRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
    return {
        language: 'js',
        contentHash: 'abc123',
        capturedVariables: {},
        nonSerializable: [],
        executedAt: Date.now(),
        durationMs: 10,
        ...overrides
    };
}

describe('executionLog - pure functions', () => {
    test('emptyLog', () => {
        const log = emptyLog();
        expect(log.records).toEqual([]);
        expect(log.mergedNamespace).toEqual({});
    });

    test('addRecord with variables', () => {
        let log = emptyLog();
        log = addRecord(log, makeRecord({
            capturedVariables: { x: 42, name: "Alice" }
        }));
        expect(log.records).toHaveLength(1);
        expect(log.mergedNamespace).toEqual({ x: 42, name: "Alice" });
    });

    test('multiple records merge namespaces', () => {
        let log = emptyLog();
        log = addRecord(log, makeRecord({
            language: 'js',
            capturedVariables: { x: 1, y: 2 }
        }));
        log = addRecord(log, makeRecord({
            language: 'ts',
            capturedVariables: { z: 3, w: 4 }
        }));
        expect(log.mergedNamespace).toEqual({ x: 1, y: 2, z: 3, w: 4 });
    });

    test('later records overwrite earlier variables', () => {
        let log = emptyLog();
        log = addRecord(log, makeRecord({
            capturedVariables: { x: 1 }
        }));
        log = addRecord(log, makeRecord({
            capturedVariables: { x: 99 }
        }));
        expect(log.mergedNamespace).toEqual({ x: 99 });
        expect(log.records).toHaveLength(2);
    });

    test('clearLog resets everything', () => {
        let log = emptyLog();
        log = addRecord(log, makeRecord({ capturedVariables: { x: 1 } }));
        log = clearLog();
        expect(log.records).toEqual([]);
        expect(log.mergedNamespace).toEqual({});
    });

    test('immutability: addRecord does not mutate original', () => {
        const log1 = emptyLog();
        const log2 = addRecord(log1, makeRecord({ capturedVariables: { x: 1 } }));
        expect(log1.records).toHaveLength(0);
        expect(log2.records).toHaveLength(1);
    });

    test('contentHash is deterministic', () => {
        const h1 = contentHash('const x = 5');
        const h2 = contentHash('const x = 5');
        const h3 = contentHash('const x = 6');
        expect(h1).toBe(h2);
        expect(h1).not.toBe(h3);
        expect(h1).toHaveLength(16);
    });

    test('records preserve all fields', () => {
        let log = emptyLog();
        const record = makeRecord({
            language: 'ts',
            contentHash: 'deadbeef',
            capturedVariables: { data: [1, 2, 3] },
            nonSerializable: ['myFunc', 'MyClass'],
            executedAt: 1700000000000,
            durationMs: 42
        });
        log = addRecord(log, record);
        expect(log.records[0]).toEqual(record);
    });

    test('realistic multi-block scenario', () => {
        let log = emptyLog();

        // JS block defines data
        log = addRecord(log, makeRecord({
            language: 'js',
            capturedVariables: {
                data: [{ name: "Alice", score: 95 }, { name: "Bob", score: 87 }],
                threshold: 90
            },
            nonSerializable: ['filterFn']
        }));

        // TS block defines more
        log = addRecord(log, makeRecord({
            language: 'ts',
            capturedVariables: {
                config: { host: "localhost", port: 8080 },
                threshold: 85  // overrides JS value
            }
        }));

        // Python block (no captured vars from this side yet)
        log = addRecord(log, makeRecord({
            language: 'python',
            capturedVariables: {}
        }));

        expect(log.records).toHaveLength(3);
        expect(log.mergedNamespace.data).toEqual([
            { name: "Alice", score: 95 }, { name: "Bob", score: 87 }
        ]);
        expect(log.mergedNamespace.threshold).toBe(85); // overridden
        expect(log.mergedNamespace.config).toEqual({ host: "localhost", port: 8080 });
    });
});
