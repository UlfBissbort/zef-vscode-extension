import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export interface SvelteCompileResult {
    success: boolean;
    html?: string;
    error?: string;
    compileTime: string;
}

/**
 * Get the path to bun, checking settings first, then common installation locations
 */
async function getBunPath(): Promise<string | null> {
    // First check if user has configured a custom path in settings
    const config = vscode.workspace.getConfiguration('zef');
    const configuredPath = config.get<string>('bunPath');
    
    if (configuredPath) {
        try {
            await execAsync(`"${configuredPath}" --version`);
            return configuredPath;
        } catch {
            // Configured path is invalid, fall back to auto-detection
        }
    }
    
    // Common bun locations for auto-detection
    const possiblePaths = [
        'bun',  // Try PATH first
        path.join(os.homedir(), '.bun', 'bin', 'bun'),  // Standard bun location
        '/usr/local/bin/bun',
        '/usr/bin/bun',
    ];
    
    for (const bunPath of possiblePaths) {
        try {
            await execAsync(`"${bunPath}" --version`);
            return bunPath;
        } catch {
            // Try next path
        }
    }
    
    return null;
}

// Cache the bun path
let cachedBunPath: string | null | undefined = undefined;

/**
 * Check if bun is available and cache the path
 */
export async function isBunAvailable(): Promise<boolean> {
    if (cachedBunPath === undefined) {
        cachedBunPath = await getBunPath();
    }
    return cachedBunPath !== null;
}

/**
 * Get the cached bun path
 */
async function getBun(): Promise<string> {
    if (cachedBunPath === undefined) {
        cachedBunPath = await getBunPath();
    }
    if (cachedBunPath === null) {
        throw new Error('Bun not found');
    }
    return cachedBunPath;
}

/**
 * Compile a Svelte component to HTML using Bun
 * 
 * @param svelteSource The Svelte component source code
 * @param extensionPath The path to the extension directory (for finding compiler.ts)
 * @returns CompileResult with HTML or error
 */
export async function compileSvelteComponent(
    svelteSource: string,
    extensionPath: string
): Promise<SvelteCompileResult> {
    const compilerPath = path.join(extensionPath, 'svelte-compiler', 'compiler.ts');
    
    // Get bun path
    let bunPath: string;
    try {
        bunPath = await getBun();
    } catch (e) {
        return {
            success: false,
            error: 'Bun runtime not found. Please install Bun (https://bun.sh)',
            compileTime: '0'
        };
    }
    
    return new Promise((resolve) => {
        const startTime = performance.now();
        
        // Spawn bun process with full path
        const proc = spawn(bunPath, ['run', compilerPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        proc.on('close', (code) => {
            const elapsed = (performance.now() - startTime).toFixed(2);
            
            if (code !== 0) {
                resolve({
                    success: false,
                    error: stderr || `Compiler exited with code ${code}`,
                    compileTime: elapsed
                });
                return;
            }
            
            try {
                const result = JSON.parse(stdout.trim()) as SvelteCompileResult;
                // The compileTime from the compiler is just compilation,
                // add our overhead for total time
                resolve(result);
            } catch (e) {
                resolve({
                    success: false,
                    error: `Failed to parse compiler output: ${stdout}`,
                    compileTime: elapsed
                });
            }
        });
        
        proc.on('error', (err) => {
            const elapsed = (performance.now() - startTime).toFixed(2);
            resolve({
                success: false,
                error: `Failed to spawn bun: ${err.message}. Is Bun installed?`,
                compileTime: elapsed
            });
        });
        
        // Write source to stdin
        proc.stdin.write(svelteSource);
        proc.stdin.end();
        
        // Timeout after 30 seconds
        setTimeout(() => {
            proc.kill();
            resolve({
                success: false,
                error: 'Compilation timed out after 30 seconds',
                compileTime: '30000'
            });
        }, 30000);
    });
}
