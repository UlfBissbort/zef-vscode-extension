/**
 * End-to-end test: inject JS-captured variables into the Python kernel
 * and verify they're accessible in Python code.
 */

import { describe, test, expect, afterAll } from 'bun:test';
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

const KERNEL_SCRIPT = path.join(import.meta.dir, '..', 'kernel', 'zef_kernel.py');

class TestKernel {
    private process: ChildProcess;
    private rl: readline.Interface;
    private ready: Promise<void>;

    constructor() {
        this.process = spawn('python3', ['-u', KERNEL_SCRIPT], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        this.rl = readline.createInterface({ input: this.process.stdout!, terminal: false });
        this.ready = new Promise((resolve) => {
            const handler = (line: string) => {
                const msg = JSON.parse(line);
                if (msg.status === 'ready') {
                    this.rl.removeListener('line', handler);
                    resolve();
                }
            };
            this.rl.on('line', handler);
        });
    }

    async waitReady() { await this.ready; }

    async send(msg: any): Promise<any> {
        return new Promise((resolve) => {
            const handler = (line: string) => {
                this.rl.removeListener('line', handler);
                resolve(JSON.parse(line));
            };
            this.rl.on('line', handler);
            this.process.stdin!.write(JSON.stringify(msg) + '\n');
        });
    }

    async execute(code: string): Promise<any> {
        return this.send({ code, cell_id: 'test' });
    }

    async injectVariables(variables: Record<string, any>): Promise<any> {
        return this.send({ command: 'inject_variables', variables });
    }

    kill() {
        this.process.kill();
    }
}

let kernel: TestKernel;

describe('e2e: inject JS variables into Python kernel', () => {

    test('setup kernel', async () => {
        kernel = new TestKernel();
        await kernel.waitReady();
    });

    test('inject simple variables and use in Python', async () => {
        const ack = await kernel.injectVariables({ x: 42, name: "Alice" });
        expect(ack.status).toBe('ok');
        expect(ack.command).toBe('inject_variables');

        const result = await kernel.execute('x * 2');
        expect(result.status).toBe('ok');
        expect(result.result).toBe('84');
    });

    test('injected string accessible', async () => {
        const result = await kernel.execute('name.upper()');
        expect(result.result).toBe("'ALICE'");
    });

    test('inject object (becomes Python dict)', async () => {
        await kernel.injectVariables({
            config: { host: "localhost", port: 8080, debug: true }
        });
        const result = await kernel.execute('config["port"]');
        expect(result.result).toBe('8080');
    });

    test('inject array (becomes Python list)', async () => {
        await kernel.injectVariables({ items: [10, 20, 30] });
        const result = await kernel.execute('sum(items)');
        expect(result.result).toBe('60');
    });

    test('inject null (becomes Python None)', async () => {
        await kernel.injectVariables({ nothing: null });
        const result = await kernel.execute('nothing is None');
        expect(result.result).toBe('True');
    });

    test('inject boolean', async () => {
        await kernel.injectVariables({ flag: true });
        const result = await kernel.execute('flag');
        expect(result.result).toBe('True');
    });

    test('inject nested structure', async () => {
        await kernel.injectVariables({
            data: [
                { name: "Alice", scores: [95, 87] },
                { name: "Bob", scores: [72, 88] }
            ]
        });
        const result = await kernel.execute('data[0]["scores"][0]');
        expect(result.result).toBe('95');
    });

    test('later injection overwrites earlier values', async () => {
        await kernel.injectVariables({ x: 100 });
        const result = await kernel.execute('x');
        expect(result.result).toBe('100');
    });

    test('Python code can modify injected variables', async () => {
        await kernel.execute('x = x + 1');
        const result = await kernel.execute('x');
        expect(result.result).toBe('101');
    });

    test('inject count reported', async () => {
        const ack = await kernel.injectVariables({ a: 1, b: 2, c: 3 });
        expect(ack.count).toBe(3);
    });

    afterAll(() => {
        kernel?.kill();
    });
});
