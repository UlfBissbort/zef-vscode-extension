import { describe, test, expect } from 'bun:test';
import { evalAndCapture, extractDeclaredVariables } from '../src/evalAndCapture';

// ─── extractDeclaredVariables ────────────────────────────────────────────────

describe('extractDeclaredVariables', () => {
    test('const/let/var', () => {
        expect(extractDeclaredVariables('const x = 5')).toEqual(['x']);
        expect(extractDeclaredVariables('let y = 10')).toEqual(['y']);
        expect(extractDeclaredVariables('var z = 15')).toEqual(['z']);
    });

    test('multiple declarations on separate lines', () => {
        expect(extractDeclaredVariables('const x = 1\nlet y = 2\nvar z = 3'))
            .toEqual(['x', 'y', 'z']);
    });

    test('function declarations', () => {
        expect(extractDeclaredVariables('function foo() { return 1; }')).toEqual(['foo']);
        expect(extractDeclaredVariables('async function bar() {}')).toEqual(['bar']);
    });

    test('class declarations', () => {
        expect(extractDeclaredVariables('class MyClass { }')).toEqual(['MyClass']);
    });

    test('object destructuring', () => {
        const vars = extractDeclaredVariables('const { a, b } = obj');
        expect(vars).toContain('a');
        expect(vars).toContain('b');
    });

    test('object destructuring with rename', () => {
        const vars = extractDeclaredVariables('const { original: renamed } = obj');
        expect(vars).toContain('renamed');
        expect(vars).not.toContain('original');
    });

    test('array destructuring', () => {
        const vars = extractDeclaredVariables('const [a, b, c] = arr');
        expect(vars).toContain('a');
        expect(vars).toContain('b');
        expect(vars).toContain('c');
    });

    test('filters out __zef prefixed names', () => {
        expect(extractDeclaredVariables('const __zef_internal = 5')).toEqual([]);
    });

    test('deduplicates', () => {
        expect(extractDeclaredVariables('var x = 1\nvar x = 2')).toEqual(['x']);
    });

    test('export declarations', () => {
        expect(extractDeclaredVariables('export const x = 5')).toEqual(['x']);
        expect(extractDeclaredVariables('export function foo() {}')).toEqual(['foo']);
        expect(extractDeclaredVariables('export class Bar {}')).toEqual(['Bar']);
    });

    test('declarations inside function bodies are picked up by regex but handled by try/catch at capture time', () => {
        // Regex-based extraction picks up ALL declarations (including nested ones).
        // This is safe: the try/catch in the capture code silently skips
        // variables that are out of scope at collection time.
        const vars = extractDeclaredVariables(`
function foo() {
    const internal = 5
    return internal
}
const topLevel = foo()
`);
        expect(vars).toContain('foo');
        expect(vars).toContain('topLevel');
        // Regex DOES pick these up (known limitation), but capture handles it
        expect(vars).toContain('internal');
    });

    test('empty code', () => {
        expect(extractDeclaredVariables('')).toEqual([]);
    });

    test('expression only', () => {
        expect(extractDeclaredVariables('1 + 1')).toEqual([]);
    });
});

// ─── evalAndCapture ──────────────────────────────────────────────────────────

describe('evalAndCapture - primitives', () => {
    test('number', async () => {
        const r = await evalAndCapture('const x = 42');
        expect(r.variables).toEqual({ x: 42 });
        expect(r.nonSerializable).toEqual([]);
        expect(r.error).toBeNull();
    });

    test('string', async () => {
        const r = await evalAndCapture('const s = "hello world"');
        expect(r.variables).toEqual({ s: "hello world" });
    });

    test('boolean', async () => {
        const r = await evalAndCapture('const a = true\nconst b = false');
        expect(r.variables).toEqual({ a: true, b: false });
    });

    test('null', async () => {
        const r = await evalAndCapture('const n = null');
        expect(r.variables).toEqual({ n: null });
    });

    test('float', async () => {
        const r = await evalAndCapture('const pi = 3.14159');
        expect(r.variables).toEqual({ pi: 3.14159 });
    });

    test('negative number', async () => {
        const r = await evalAndCapture('const neg = -42');
        expect(r.variables).toEqual({ neg: -42 });
    });
});

describe('evalAndCapture - compound types', () => {
    test('plain object', async () => {
        const r = await evalAndCapture('const obj = { x: 1, y: "two", z: true }');
        expect(r.variables).toEqual({ obj: { x: 1, y: "two", z: true } });
    });

    test('array', async () => {
        const r = await evalAndCapture('const arr = [1, 2, 3]');
        expect(r.variables).toEqual({ arr: [1, 2, 3] });
    });

    test('nested objects and arrays', async () => {
        const r = await evalAndCapture('const data = { a: [1, { b: true }], c: null }');
        expect(r.variables).toEqual({ data: { a: [1, { b: true }], c: null } });
    });

    test('array of objects', async () => {
        const r = await evalAndCapture('const items = [{ id: 1 }, { id: 2 }]');
        expect(r.variables).toEqual({ items: [{ id: 1 }, { id: 2 }] });
    });

    test('empty object and array', async () => {
        const r = await evalAndCapture('const obj = {}\nconst arr = []');
        expect(r.variables).toEqual({ obj: {}, arr: [] });
    });
});

describe('evalAndCapture - non-serializable types', () => {
    test('function', async () => {
        const r = await evalAndCapture('function foo() { return 1; }');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable).toHaveLength(1);
        expect(r.nonSerializable[0].name).toBe('foo');
        expect(r.nonSerializable[0].type).toBe('function');
    });

    test('arrow function', async () => {
        const r = await evalAndCapture('const fn = () => 42');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable[0].name).toBe('fn');
        expect(r.nonSerializable[0].type).toBe('function');
    });

    test('class', async () => {
        const r = await evalAndCapture('class Foo { constructor() { this.x = 1; } }');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable[0].name).toBe('Foo');
        expect(r.nonSerializable[0].type).toBe('function');
    });

    test('undefined', async () => {
        const r = await evalAndCapture('let x = undefined');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable).toEqual([
            expect.objectContaining({ name: 'x', type: 'undefined' })
        ]);
    });

    test('Symbol', async () => {
        const r = await evalAndCapture('const sym = Symbol("test")');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable[0].name).toBe('sym');
        expect(r.nonSerializable[0].type).toBe('symbol');
    });

    test('BigInt', async () => {
        const r = await evalAndCapture('const big = 42n');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable[0].name).toBe('big');
        expect(r.nonSerializable[0].type).toBe('bigint');
    });

    test('circular reference', async () => {
        const r = await evalAndCapture(`const obj = { a: 1 }\nobj.self = obj`);
        expect(r.variables).toEqual({});
        expect(r.nonSerializable[0].name).toBe('obj');
        expect(r.nonSerializable[0].type).toBe('object');
    });
});

describe('evalAndCapture - mixed serializable and non-serializable', () => {
    test('mix of types', async () => {
        const r = await evalAndCapture(`
const x = 42
const fn = () => 1
const y = "hello"
const sym = Symbol("s")
const arr = [1, 2, 3]
`);
        expect(r.variables).toEqual({ x: 42, y: "hello", arr: [1, 2, 3] });
        expect(r.nonSerializable).toHaveLength(2);
        const nonNames = r.nonSerializable.map(n => n.name).sort();
        expect(nonNames).toEqual(['fn', 'sym']);
    });

    test('object with function values serializes without the function fields', async () => {
        // JSON.stringify silently drops function-valued keys
        const r = await evalAndCapture('const obj = { a: 1, b: () => 2, c: "three" }');
        expect(r.variables).toEqual({ obj: { a: 1, c: "three" } });
    });
});

describe('evalAndCapture - edge cases', () => {
    test('empty code', async () => {
        const r = await evalAndCapture('');
        expect(r.variables).toEqual({});
        expect(r.nonSerializable).toEqual([]);
        expect(r.error).toBeNull();
    });

    test('expression only (no declarations)', async () => {
        const r = await evalAndCapture('1 + 1');
        expect(r.variables).toEqual({});
    });

    test('Date serializes to ISO string', async () => {
        const r = await evalAndCapture('const d = new Date("2024-01-15T00:00:00Z")');
        expect(r.variables.d).toBe("2024-01-15T00:00:00.000Z");
    });

    test('Map serializes to empty object (lossy)', async () => {
        const r = await evalAndCapture('const m = new Map([["a", 1]])');
        // JSON.stringify(new Map()) → "{}" — lossy but doesn't throw
        expect(r.variables).toEqual({ m: {} });
    });

    test('Set serializes to empty object (lossy)', async () => {
        const r = await evalAndCapture('const s = new Set([1, 2, 3])');
        expect(r.variables).toEqual({ s: {} });
    });

    test('variables referencing each other', async () => {
        const r = await evalAndCapture(`const a = 10\nconst b = a * 2\nconst c = a + b`);
        expect(r.variables).toEqual({ a: 10, b: 20, c: 30 });
    });

    test('destructuring captures', async () => {
        const r = await evalAndCapture(`const obj = { x: 1, y: 2 }\nconst { x, y } = obj`);
        expect(r.variables.x).toBe(1);
        expect(r.variables.y).toBe(2);
        expect(r.variables.obj).toEqual({ x: 1, y: 2 });
    });

    test('array destructuring captures', async () => {
        const r = await evalAndCapture(`const arr = [10, 20, 30]\nconst [a, b] = arr`);
        expect(r.variables.a).toBe(10);
        expect(r.variables.b).toBe(20);
        expect(r.variables.arr).toEqual([10, 20, 30]);
    });

    test('async code with await', async () => {
        const r = await evalAndCapture('const x = await Promise.resolve(42)');
        expect(r.variables).toEqual({ x: 42 });
    });

    test('NaN becomes null in JSON', async () => {
        const r = await evalAndCapture('const x = NaN');
        expect(r.variables).toEqual({ x: null });
    });

    test('Infinity becomes null in JSON', async () => {
        const r = await evalAndCapture('const x = Infinity');
        expect(r.variables).toEqual({ x: null });
    });

    test('deeply nested object', async () => {
        const r = await evalAndCapture('const x = { a: { b: { c: { d: 42 } } } }');
        expect(r.variables).toEqual({ x: { a: { b: { c: { d: 42 } } } } });
    });

    test('string with special characters', async () => {
        const r = await evalAndCapture('const s = "hello\\nworld\\t!"');
        expect(r.variables.s).toBe("hello\nworld\t!");
    });

    test('multiline string', async () => {
        const r = await evalAndCapture('const s = `line1\nline2\nline3`');
        expect(r.variables.s).toBe("line1\nline2\nline3");
    });
});

describe('evalAndCapture - error handling', () => {
    test('syntax error', async () => {
        const r = await evalAndCapture('const x = {{{');
        expect(r.error).not.toBeNull();
        expect(r.variables).toEqual({});
    });

    test('runtime error', async () => {
        const r = await evalAndCapture('const x = 5\nthrow new Error("boom")');
        expect(r.error).not.toBeNull();
        expect(r.error!.message).toBe("boom");
        // Variables defined before the error are NOT captured
        // (error exits the try block before collection code runs)
        expect(r.variables).toEqual({});
    });

    test('ReferenceError', async () => {
        const r = await evalAndCapture('const x = nonexistent');
        expect(r.error).not.toBeNull();
        expect(r.error!.name).toBe('ReferenceError');
    });

    test('TypeError', async () => {
        const r = await evalAndCapture('const x = null\nconst y = x.foo.bar');
        expect(r.error).not.toBeNull();
    });
});

describe('evalAndCapture - multi-line functions with internal variables', () => {
    test('function with internal const, then call binding result', async () => {
        const r = await evalAndCapture(`
function processData(items) {
    const filtered = items.filter(x => x > 2)
    const doubled = filtered.map(x => x * 2)
    return doubled
}
const result = processData([1, 2, 3, 4, 5])
`);
        // result should be captured (JSON-serializable array)
        expect(r.variables.result).toEqual([6, 8, 10]);
        // function itself is non-serializable
        expect(r.nonSerializable.map(n => n.name)).toContain('processData');
        // Regex picks up internal vars, but evalAndCapture runs them in one scope
        // so they ARE accessible (unlike the real executor where they're in a different IIFE scope)
        // In the real executor flow, try/catch handles out-of-scope vars silently
        expect(r.error).toBeNull();
    });

    test('long function with multiple internal declarations', async () => {
        const r = await evalAndCapture(`
function analyze(data) {
    const n = data.length
    const sum = data.reduce((a, b) => a + b, 0)
    const mean = sum / n
    const sorted = [...data].sort((a, b) => a - b)
    const median = sorted[Math.floor(n / 2)]
    return { mean, median, n }
}
const stats = analyze([10, 5, 8, 3, 12, 7])
`);
        expect(r.variables.stats).toEqual({ mean: 7.5, median: 8, n: 6 });
        // In evalAndCapture (single scope), regex picks up internal vars and they're
        // accessible. In the real executor (IIFE), they'd be out of scope → silently skipped.
    });

    test('async function then await call', async () => {
        const r = await evalAndCapture(`
async function fetchValue() {
    const raw = await Promise.resolve({ data: [1, 2, 3] })
    const processed = raw.data.map(x => x + 10)
    return processed
}
const values = await fetchValue()
`);
        expect(r.variables.values).toEqual([11, 12, 13]);
        // Internal vars (raw, processed) are accessible in evalAndCapture's single scope
        // but NOT in the real executor's IIFE scope
    });

    test('function returning non-serializable, bound to variable', async () => {
        const r = await evalAndCapture(`
function makeGreeter(name) {
    return function() { return "Hello " + name }
}
const greeter = makeGreeter("Alice")
`);
        // greeter is a function → non-serializable
        expect(r.variables).not.toHaveProperty('greeter');
        expect(r.nonSerializable.map(n => n.name)).toContain('greeter');
        expect(r.nonSerializable.map(n => n.name)).toContain('makeGreeter');
    });

    test('class with methods, then instantiation and data extraction', async () => {
        const r = await evalAndCapture(`
class Calculator {
    constructor(initial) {
        this.value = initial
    }
    add(n) { this.value += n; return this }
    getResult() { return this.value }
}
const calc = new Calculator(10)
calc.add(5).add(3)
const answer = calc.getResult()
`);
        // answer is a plain number → serializable
        expect(r.variables.answer).toBe(18);
        // calc is a Calculator instance — JSON.stringify gives { value: 18 }
        expect(r.variables.calc).toEqual({ value: 18 });
        // Calculator class is non-serializable
        expect(r.nonSerializable.map(n => n.name)).toContain('Calculator');
    });

    test('multiple functions building on each other', async () => {
        const r = await evalAndCapture(`
function tokenize(text) {
    const tokens = text.toLowerCase().split(/\\s+/)
    return tokens
}
function countWords(tokens) {
    const counts = {}
    for (const t of tokens) {
        counts[t] = (counts[t] || 0) + 1
    }
    return counts
}
const text = "the cat sat on the mat"
const tokens = tokenize(text)
const wordCounts = countWords(tokens)
`);
        expect(r.variables.text).toBe("the cat sat on the mat");
        expect(r.variables.tokens).toEqual(["the", "cat", "sat", "on", "the", "mat"]);
        expect(r.variables.wordCounts).toEqual({
            the: 2, cat: 1, sat: 1, on: 1, mat: 1
        });
        // functions are non-serializable
        expect(r.nonSerializable.map(n => n.name).sort()).toEqual(
            expect.arrayContaining(['countWords', 'tokenize'])
        );
    });
});

describe('evalAndCapture - realistic notebook scenarios', () => {
    test('data processing', async () => {
        const r = await evalAndCapture(`
const data = [
    { name: "Alice", score: 95 },
    { name: "Bob", score: 87 },
    { name: "Charlie", score: 92 }
]
const names = data.map(d => d.name)
const avgScore = data.reduce((sum, d) => sum + d.score, 0) / data.length
`);
        expect(r.variables.data).toEqual([
            { name: "Alice", score: 95 },
            { name: "Bob", score: 87 },
            { name: "Charlie", score: 92 }
        ]);
        expect(r.variables.names).toEqual(["Alice", "Bob", "Charlie"]);
        expect(r.variables.avgScore).toBeCloseTo(91.333, 2);
        expect(r.error).toBeNull();
    });

    test('config object', async () => {
        const r = await evalAndCapture(`
const config = {
    host: "localhost",
    port: 8080,
    debug: true,
    tags: ["web", "api"],
    limits: { maxRetries: 3, timeout: 5000 }
}
`);
        expect(r.variables.config).toEqual({
            host: "localhost", port: 8080, debug: true,
            tags: ["web", "api"],
            limits: { maxRetries: 3, timeout: 5000 }
        });
    });

    test('computed results with helper function', async () => {
        const r = await evalAndCapture(`
function square(n) { return n * n; }
const input = [1, 2, 3, 4, 5]
const squares = input.map(square)
const total = squares.reduce((a, b) => a + b, 0)
`);
        expect(r.variables.input).toEqual([1, 2, 3, 4, 5]);
        expect(r.variables.squares).toEqual([1, 4, 9, 16, 25]);
        expect(r.variables.total).toBe(55);
        // function itself is non-serializable
        expect(r.nonSerializable.map(n => n.name)).toContain('square');
    });
});
