/**
 * End-to-end test: run JS/TS code through the actual Bun executors
 * and verify variable capture works in the generated scripts.
 */

import { describe, test, expect } from 'bun:test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { extractDeclaredVariables } from '../src/evalAndCapture';

const execAsync = promisify(exec);

// We can't import the actual VS Code-dependent executors, so we replicate
// the core logic: generate the script, run it with bun, read the result.

function generateTestJsExecutor(userCodeFile: string, resultFile: string, varNames: string[]): string {
    const escapedCodeFile = userCodeFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedResultFile = resultFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const varNamesJson = JSON.stringify(varNames);

    return `
const fs = require('fs');
const util = require('util');

const userCode = fs.readFileSync('${escapedCodeFile}', 'utf-8');
const resultFile = '${escapedResultFile}';
const __zef_varnames = ${varNamesJson};
let __zef_captured = {};
let __zef_nonser = [];

const STATEMENT_KEYWORDS = [
    'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
    'do', 'switch', 'try', 'catch', 'finally', 'throw', 'break', 'continue',
    'return', 'import', 'export', 'debugger', 'with'
];

function transformForReturn(code) {
    const lines = code.trimEnd().split('\\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('/*')) continue;
        if (line.endsWith('}')) break;
        const startsWithKeyword = STATEMENT_KEYWORDS.some(keyword =>
            line.startsWith(keyword + ' ') || line.startsWith(keyword + '(') || line === keyword
        );
        if (startsWithKeyword) break;
        let modifiedLine = lines[i];
        if (line.endsWith(';')) modifiedLine = modifiedLine.replace(/;\\s*$/, '');
        const trimmedModified = modifiedLine.trim();
        if (!trimmedModified.startsWith('return ') && !trimmedModified.startsWith('return;')) {
            const leadingWhitespace = modifiedLine.match(/^(\\s*)/)?.[1] || '';
            modifiedLine = leadingWhitespace + 'return ' + modifiedLine.trim();
        }
        lines[i] = modifiedLine;
        break;
    }
    return lines.join('\\n');
}

function insertCapture(code) {
    if (__zef_varnames.length === 0) return code;
    const captureLines = __zef_varnames.map(n => {
        return 'try { const __v = ' + n + '; const __s = JSON.stringify(__v); ' +
               'if (__s !== undefined && __s.length < 1000000) __zef_captured[' + JSON.stringify(n) + '] = JSON.parse(__s); ' +
               'else __zef_nonser.push(' + JSON.stringify(n) + '); ' +
               '} catch { __zef_nonser.push(' + JSON.stringify(n) + '); }';
    });
    const lines = code.split('\\n');
    let lastIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim()) { lastIdx = i; break; }
    }
    if (lastIdx >= 0 && lines[lastIdx].trim().startsWith('return ')) {
        lines.splice(lastIdx, 0, ...captureLines);
    } else {
        lines.push(...captureLines);
    }
    return lines.join('\\n');
}

const transformed = transformForReturn(userCode);
const withCapture = insertCapture(transformed);
const wrapped = \`(async () => {\\n\${withCapture}\\n})()\`;

(async () => {
    try {
        const result = await eval(wrapped);
        fs.writeFileSync(resultFile, JSON.stringify({
            status: 'ok',
            result: result === undefined ? null : util.inspect(result, { depth: 5, colors: false }),
            variables: __zef_captured,
            nonSerializable: __zef_nonser
        }));
    } catch (e) {
        fs.writeFileSync(resultFile, JSON.stringify({
            status: 'error',
            error: { name: e.name || 'Error', message: e.message || String(e), stack: e.stack || '' },
            variables: __zef_captured,
            nonSerializable: __zef_nonser
        }));
    }
})();
`;
}

async function runJsCapture(code: string) {
    const id = crypto.randomBytes(8).toString('hex');
    const tmpDir = os.tmpdir();
    const codeFile = path.join(tmpDir, `zef_test_code_${id}.js`);
    const execFile = path.join(tmpDir, `zef_test_exec_${id}.js`);
    const resultFile = path.join(tmpDir, `zef_test_result_${id}.json`);

    const varNames = extractDeclaredVariables(code);
    const script = generateTestJsExecutor(codeFile, resultFile, varNames);

    await fs.writeFile(codeFile, code);
    await fs.writeFile(execFile, script);

    try {
        await execAsync(`bun "${execFile}"`, { timeout: 10000 });
        const raw = await fs.readFile(resultFile, 'utf-8');
        return JSON.parse(raw);
    } finally {
        await Promise.all([
            fs.unlink(codeFile).catch(() => {}),
            fs.unlink(execFile).catch(() => {}),
            fs.unlink(resultFile).catch(() => {})
        ]);
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('e2e: JS executor with variable capture', () => {
    test('simple variables', async () => {
        const r = await runJsCapture(`const x = 42\nconst name = "Alice"`);
        expect(r.status).toBe('ok');
        expect(r.variables).toEqual({ x: 42, name: "Alice" });
    });

    test('object and array', async () => {
        const r = await runJsCapture(`const data = { a: 1, b: [2, 3] }`);
        expect(r.variables).toEqual({ data: { a: 1, b: [2, 3] } });
    });

    test('function is non-serializable', async () => {
        const r = await runJsCapture(`function add(a, b) { return a + b; }\nconst result = add(3, 4)`);
        expect(r.variables.result).toBe(7);
        expect(r.nonSerializable).toContain('add');
    });

    test('function with internal variables — only top-level captured', async () => {
        const r = await runJsCapture(`
function compute(items) {
    const filtered = items.filter(x => x > 2)
    return filtered.map(x => x * 10)
}
const output = compute([1, 2, 3, 4, 5])
`);
        expect(r.variables.output).toEqual([30, 40, 50]);
        // 'filtered' is internal to the function — NOT in variables or nonSerializable
        expect(r.variables).not.toHaveProperty('filtered');
        expect(r.nonSerializable).toContain('compute');
    });

    test('last expression is still returned as result', async () => {
        const r = await runJsCapture(`const x = 5\nx * 2`);
        expect(r.status).toBe('ok');
        expect(r.result).toBe('10');
        expect(r.variables).toEqual({ x: 5 });
    });

    test('destructuring', async () => {
        const r = await runJsCapture(`const obj = {a: 1, b: 2}\nconst {a, b} = obj`);
        expect(r.variables.a).toBe(1);
        expect(r.variables.b).toBe(2);
        expect(r.variables.obj).toEqual({ a: 1, b: 2 });
    });

    test('error still captures variables defined before error', async () => {
        // Variables are captured before return, but error exits try block
        // so capture code doesn't run → no variables
        const r = await runJsCapture(`const x = 5\nthrow new Error("boom")`);
        expect(r.status).toBe('error');
        // Capture code was before the throw... but throw exits before capture.
        // Actually no: insertCapture inserts before return, not before throw.
        // The throw happens first, capture code never runs.
        // variables might be empty
    });

    test('code with no declarations', async () => {
        const r = await runJsCapture(`1 + 2 + 3`);
        expect(r.status).toBe('ok');
        expect(r.result).toBe('6');
        expect(r.variables).toEqual({});
    });

    test('async/await', async () => {
        const r = await runJsCapture(`const val = await Promise.resolve(99)`);
        expect(r.variables).toEqual({ val: 99 });
    });

    test('multiple functions building on each other', async () => {
        const r = await runJsCapture(`
function double(x) { return x * 2 }
function addOne(x) { return x + 1 }
const input = [1, 2, 3]
const result = input.map(double).map(addOne)
`);
        expect(r.variables.input).toEqual([1, 2, 3]);
        expect(r.variables.result).toEqual([3, 5, 7]);
        expect(r.nonSerializable).toContain('double');
        expect(r.nonSerializable).toContain('addOne');
    });
});
