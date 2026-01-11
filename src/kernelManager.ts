import * as vscode from 'vscode';
import * as path from 'path';
import * as readline from 'readline';
import { spawn, ChildProcess } from 'child_process';

export interface SideEffect {
    what: string;      // e.g., 'stdout', 'stderr', 'file_write', etc.
    content: string;   // The content of the side effect
}

export interface CellResult {
    cell_id: string;
    status: 'ok' | 'error';
    result: string | null;
    stdout: string;
    stderr: string;
    side_effects: SideEffect[];
    error: {
        type: string;
        message: string;
        traceback: string;
    } | null;
}

interface ExecuteRequest {
    code: string;
    cell_id: string;
}

interface KernelMessage {
    status: string;
    message?: string;
}

/**
 * Manages a Python kernel subprocess for code execution
 */
export class KernelManager {
    private process: ChildProcess | null = null;
    private pythonPath: string | null = null;
    private rl: readline.Interface | null = null;
    private pendingResolve: ((result: CellResult) => void) | null = null;
    private pendingReject: ((error: Error) => void) | null = null;
    private isReady: boolean = false;
    private readyPromise: Promise<void> | null = null;
    private readyResolve: (() => void) | null = null;
    private outputChannel: vscode.OutputChannel;

    constructor(private extensionPath: string) {
        this.outputChannel = vscode.window.createOutputChannel('Zef Kernel');
    }

    /**
     * Get the path to the kernel script
     */
    private getKernelScriptPath(): string {
        return path.join(this.extensionPath, 'kernel', 'zef_kernel.py');
    }

    /**
     * Start the kernel with the given Python path
     */
    async start(pythonPath: string): Promise<void> {
        // Shutdown existing kernel if any
        await this.shutdown();

        this.pythonPath = pythonPath;
        const kernelScript = this.getKernelScriptPath();

        this.outputChannel.appendLine(`Starting kernel: ${pythonPath} ${kernelScript}`);

        this.process = spawn(pythonPath, ['-u', kernelScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
            throw new Error('Failed to get process streams');
        }

        // Set up readline for stdout
        this.rl = readline.createInterface({
            input: this.process.stdout,
            terminal: false,
        });

        // Handle stderr
        this.process.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            this.outputChannel.appendLine(`[stderr] ${text}`);
        });

        // Handle process exit
        this.process.on('exit', (code) => {
            this.outputChannel.appendLine(`Kernel process exited with code ${code}`);
            this.isReady = false;
            this.process = null;
            this.rl = null;
            
            if (this.pendingReject) {
                this.pendingReject(new Error(`Kernel process exited with code ${code}`));
                this.pendingResolve = null;
                this.pendingReject = null;
            }
        });

        // Handle process errors
        this.process.on('error', (err) => {
            this.outputChannel.appendLine(`Kernel process error: ${err.message}`);
            if (this.pendingReject) {
                this.pendingReject(err);
                this.pendingResolve = null;
                this.pendingReject = null;
            }
        });

        // Set up line handler
        this.rl.on('line', (line: string) => {
            this.handleLine(line);
        });

        // Wait for ready message
        this.readyPromise = new Promise((resolve) => {
            this.readyResolve = resolve;
        });

        await this.readyPromise;
        this.outputChannel.appendLine('Kernel is ready');
    }

    /**
     * Handle a line of output from the kernel
     */
    private handleLine(line: string): void {
        this.outputChannel.appendLine(`[kernel] ${line}`);

        try {
            const message = JSON.parse(line);

            if (message.status === 'ready') {
                this.isReady = true;
                if (this.readyResolve) {
                    this.readyResolve();
                    this.readyResolve = null;
                }
                return;
            }

            if (message.status === 'shutdown') {
                this.isReady = false;
                return;
            }

            // This is a cell result
            if (this.pendingResolve) {
                this.pendingResolve(message as CellResult);
                this.pendingResolve = null;
                this.pendingReject = null;
            }
        } catch (e) {
            this.outputChannel.appendLine(`Failed to parse kernel output: ${e}`);
        }
    }

    /**
     * Check if the kernel is running
     */
    isAlive(): boolean {
        return this.process !== null && this.isReady;
    }

    /**
     * Execute code in the kernel
     */
    async execute(code: string, cellId: string, pythonPath: string): Promise<CellResult> {
        // Start kernel if not running or Python path changed
        if (!this.isAlive() || this.pythonPath !== pythonPath) {
            await this.start(pythonPath);
        }

        if (!this.process?.stdin) {
            throw new Error('Kernel not available');
        }

        const request: ExecuteRequest = {
            code,
            cell_id: cellId,
        };

        const json = JSON.stringify(request);
        this.outputChannel.appendLine(`[send] ${json}`);

        return new Promise((resolve, reject) => {
            this.pendingResolve = resolve;
            this.pendingReject = reject;

            // Set timeout
            const timeout = setTimeout(() => {
                if (this.pendingReject) {
                    this.pendingReject(new Error('Execution timeout'));
                    this.pendingResolve = null;
                    this.pendingReject = null;
                }
            }, 30000); // 30 second timeout

            // Clear timeout when resolved
            const originalResolve = this.pendingResolve;
            this.pendingResolve = (result) => {
                clearTimeout(timeout);
                originalResolve(result);
            };

            this.process!.stdin!.write(json + '\n');
        });
    }

    /**
     * Shutdown the kernel
     */
    async shutdown(): Promise<void> {
        if (this.process?.stdin) {
            try {
                this.process.stdin.write('{"command": "shutdown"}\n');
            } catch (e) {
                // Ignore write errors during shutdown
            }
        }

        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 100));

        // Force kill if still running
        if (this.process) {
            this.process.kill();
            this.process = null;
        }

        this.rl = null;
        this.isReady = false;
        this.pythonPath = null;
        this.pendingResolve = null;
        this.pendingReject = null;

        this.outputChannel.appendLine('Kernel shut down');
    }

    /**
     * Restart the kernel with the same Python path
     */
    async restart(): Promise<void> {
        if (!this.pythonPath) {
            throw new Error('No Python path configured');
        }
        const pythonPath = this.pythonPath;
        await this.shutdown();
        await this.start(pythonPath);
    }

    /**
     * Get the current Python path
     */
    getPythonPath(): string | null {
        return this.pythonPath;
    }

    /**
     * Show the output channel
     */
    showOutput(): void {
        this.outputChannel.show();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.shutdown();
        this.outputChannel.dispose();
    }
}

// Singleton instance
let kernelManager: KernelManager | null = null;

export function getKernelManager(extensionPath: string): KernelManager {
    if (!kernelManager) {
        kernelManager = new KernelManager(extensionPath);
    }
    return kernelManager;
}

export function disposeKernelManager(): void {
    if (kernelManager) {
        kernelManager.dispose();
        kernelManager = null;
    }
}
