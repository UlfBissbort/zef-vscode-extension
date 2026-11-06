import { execFile, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/** Use the managed runtime, not the notebook's possibly Zef-free interpreter. */
export function storePythonPath(): string {
    const override = process.env.ZEF_STORE_PYTHON;
    if (override) { return override; }
    const parent = process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support', 'Zef')
        : path.join(os.homedir(), '.local', 'share', 'zef');
    const python = path.join(parent, 'zef_venv', 'bin', 'python');
    if (!fs.existsSync(python)) {
        throw new Error('Zef runtime not found. Run the Zef installer or set ZEF_STORE_PYTHON to a Python executable with the current Zef library.');
    }
    return python;
}

/** Fixed-operation JSON boundary; Python owns native Store serialization/routing. */
export class StoreBridge {
    private children = new Set<ChildProcess>();
    private disposed = false;
    private active = 0;
    private queue: Array<{ request: object; resolve: (value: any) => void; reject: (error: Error) => void }> = [];

    request(request: object): Promise<any> {
        if (this.disposed) { return Promise.reject(new Error('Store client disposed')); }
        if (this.queue.length >= 128) { return Promise.reject(new Error('Store request queue is full')); }
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });
            this.drain();
        });
    }

    private drain(): void {
        while (!this.disposed && this.active < 4 && this.queue.length) {
            const next = this.queue.shift()!;
            this.active++;
            this.execute(next.request).then(next.resolve, next.reject).finally(() => {
                this.active--;
                this.drain();
            });
        }
    }

    private execute(request: object): Promise<any> {
        return new Promise((resolve, reject) => {
            const python = storePythonPath();
            const script = path.join(__dirname, '..', 'kernel', 'zef_store_bridge.py');
            const child = execFile(python, ['-u', script], {
                timeout: 40000, maxBuffer: 48 * 1024 * 1024,
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
            }, (error, stdout, stderr) => {
                this.children.delete(child);
                if (this.disposed) { reject(new Error('Store client disposed')); return; }
                if (error) {
                    reject(new Error(`Zef Store runtime failed (${error.message}). ${stderr.slice(-2000)}`));
                    return;
                }
                try {
                    const response = JSON.parse(stdout);
                    if (response.ok !== true) { throw new Error(response.error || 'Store request failed'); }
                    resolve(response.result);
                } catch (error) { reject(error); }
            });
            this.children.add(child);
            child.stdin?.on('error', error => { child.kill(); reject(error); });
            child.stdin?.end(JSON.stringify(request));
        });
    }

    dispose(): void {
        this.disposed = true;
        for (const pending of this.queue.splice(0)) { pending.reject(new Error('Store client disposed')); }
        for (const child of this.children) { child.kill(); }
        this.children.clear();
    }
}
