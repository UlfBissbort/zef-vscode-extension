import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

export interface SideEffect {
    what: string;
    content: string;
}

export interface RustCellResult {
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

/**
 * Extract the expression part from Rust code.
 * Returns the setup code (definitions that go outside main) and the body (code that goes inside main).
 * The body's last expression (if not ending with ;) becomes the result.
 */
export function extractExpression(code: string): { setup: string; expr: string | null } {
    const trimmed = code.trim();
    
    // Check if has main - don't wrap, run as-is
    if (/fn\s+main\s*\(/.test(trimmed)) {
        return { setup: trimmed, expr: null };
    }
    
    // Parse the code to separate definitions from executable code
    // Definitions: fn, struct, enum, impl, trait, mod, use, const, static, type, and attributes
    const lines = trimmed.split('\n');
    
    let setupLines: string[] = [];
    let bodyLines: string[] = [];
    let inDefinition = false;
    let braceCount = 0;
    let inAttribute = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Track brace count for multi-line definitions
        for (const char of line) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
        
        // Check for attribute (like #[derive(Debug)])
        if (trimmedLine.startsWith('#[')) {
            inAttribute = true;
            setupLines.push(line);
            if (trimmedLine.endsWith(']')) {
                inAttribute = false;
            }
            continue;
        }
        
        if (inAttribute) {
            setupLines.push(line);
            if (trimmedLine.endsWith(']')) {
                inAttribute = false;
            }
            continue;
        }
        
        // Check if this line starts a definition
        const isDefinitionStart = /^\s*(pub\s+)?(fn |struct |enum |impl |trait |mod |use |const |static |type )/.test(line);
        
        if (isDefinitionStart || inDefinition) {
            setupLines.push(line);
            // Check if we're in a multi-line definition
            if (braceCount > 0) {
                inDefinition = true;
            } else if (trimmedLine.endsWith(';') || trimmedLine.endsWith('}')) {
                inDefinition = false;
            }
            continue;
        }
        
        // This is body code (executable code)
        bodyLines.push(line);
    }
    
    // If no body code, no expression
    if (bodyLines.length === 0 || bodyLines.every(l => l.trim() === '')) {
        return { setup: setupLines.join('\n'), expr: null };
    }
    
    // The body is the expression (might be multi-line)
    const body = bodyLines.join('\n').trim();
    
    return { setup: setupLines.join('\n'), expr: body };
}

/**
 * Generate the wrapped Rust code with result capture
 */
export function generateRustWrapper(code: string, resultFile: string): string {
    const { setup, expr } = extractExpression(code);
    
    // If no expression, just compile and run for side effects
    if (!expr) {
        // Check if has main
        if (/fn\s+main\s*\(/.test(setup)) {
            return setup;  // User provided main
        }
        // No expression and no main - wrap in empty main
        return `
#![allow(unused)]

${setup}

fn main() {
    // No expression to evaluate
}
`;
    }
    
    // Escape the result file path for Rust string
    const escapedPath = resultFile.replace(/\\/g, '\\\\');
    
    return `
#![allow(unused)]
use std::io::Write;

${setup}

fn main() {
    let __zef_result = {
        ${expr}
    };
    
    // Write result to file (separates from user stdout)
    if let Ok(mut f) = std::fs::File::create("${escapedPath}") {
        let _ = writeln!(f, "{:?}", __zef_result);
    }
}
`;
}

/**
 * Execute Rust code and return the result
 */
export async function executeRust(code: string, cellId: string): Promise<RustCellResult> {
    const execId = crypto.randomBytes(8).toString('hex');
    const tmpDir = os.tmpdir();
    const srcFile = path.join(tmpDir, `zef_rust_${execId}.rs`);
    const outFile = path.join(tmpDir, `zef_rust_${execId}`);
    const resultFile = path.join(tmpDir, `zef_rust_${execId}_result.txt`);
    
    // Get rustc path
    const rustcPath = await getRustc();
    
    try {
        // Generate wrapped code
        const wrappedCode = generateRustWrapper(code, resultFile);
        
        // Write source file
        await fs.writeFile(srcFile, wrappedCode);
        
        // Compile
        try {
            await execAsync(`"${rustcPath}" --edition 2021 "${srcFile}" -o "${outFile}"`, {
                timeout: 30000  // 30 second compile timeout
            });
        } catch (e: any) {
            // Compilation failed - parse and clean up error message
            const stderr = e.stderr || e.message || 'Unknown compilation error';
            
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout: '',
                stderr: stderr,
                side_effects: [],
                error: {
                    type: 'CompilationError',
                    message: 'Failed to compile Rust code',
                    traceback: cleanRustError(stderr, srcFile)
                }
            };
        }
        
        // Execute
        let stdout = '';
        let stderr = '';
        try {
            const result = await execAsync(`"${outFile}"`, {
                timeout: 30000  // 30 second execution timeout
            });
            stdout = result.stdout;
            stderr = result.stderr;
        } catch (e: any) {
            // Runtime error (panic, non-zero exit, timeout)
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout: e.stdout || '',
                stderr: e.stderr || '',
                side_effects: [],
                error: {
                    type: 'RuntimeError',
                    message: 'Rust program exited with error',
                    traceback: e.stderr || e.message || 'Unknown runtime error'
                }
            };
        }
        
        // Read result from file
        let resultValue: string | null = null;
        try {
            resultValue = (await fs.readFile(resultFile, 'utf-8')).trim();
            if (resultValue === '()') {
                resultValue = null;  // Unit type, no meaningful result
            }
        } catch {
            // No result file - code had no expression to evaluate
            resultValue = null;
        }
        
        // Build side effects
        const sideEffects: SideEffect[] = [];
        if (stdout.trim()) {
            sideEffects.push({ what: 'stdout', content: stdout.trim() });
        }
        if (stderr.trim()) {
            sideEffects.push({ what: 'stderr', content: stderr.trim() });
        }
        
        return {
            cell_id: cellId,
            status: 'ok',
            result: resultValue,
            stdout,
            stderr,
            side_effects: sideEffects,
            error: null
        };
        
    } finally {
        // Cleanup temp files
        await Promise.all([
            fs.unlink(srcFile).catch(() => {}),
            fs.unlink(outFile).catch(() => {}),
            fs.unlink(resultFile).catch(() => {})
        ]);
    }
}

/**
 * Clean up Rust error message by adjusting line numbers
 * The wrapper adds lines, so we need to offset error lines
 */
function cleanRustError(stderr: string, srcFile: string): string {
    // The wrapper adds 5 lines before user code:
    // 1: #![allow(unused)]
    // 2: use std::io::Write;
    // 3: (empty)
    // 4: (user setup starts)
    // And for the expression:
    // fn main() {
    //     let __zef_result = {
    //         (user expr)
    //     };
    // This is complex, for now just clean up the temp file path
    
    // Replace temp file path with <rust>
    const cleaned = stderr.replace(new RegExp(srcFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '<rust>');
    
    return cleaned;
}

/**
 * Get the path to rustc, checking settings first, then common installation locations
 */
async function getRustcPath(): Promise<string | null> {
    // First check if user has configured a custom path in settings
    const config = vscode.workspace.getConfiguration('zef');
    const configuredPath = config.get<string>('rustcPath');
    
    if (configuredPath) {
        try {
            await execAsync(`"${configuredPath}" --version`);
            return configuredPath;
        } catch {
            // Configured path is invalid, fall back to auto-detection
        }
    }
    
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    
    // Common rustc locations for auto-detection
    const possiblePaths = [
        'rustc',  // Try PATH first (works on all platforms)
        path.join(os.homedir(), '.cargo', 'bin', `rustc${ext}`),  // Standard rustup location (all platforms)
    ];
    
    // Add platform-specific paths
    if (!isWindows) {
        possiblePaths.push('/usr/local/bin/rustc');
        possiblePaths.push('/usr/bin/rustc');
        possiblePaths.push('/opt/homebrew/bin/rustc'); // macOS Homebrew ARM
    }
    
    for (const rustcPath of possiblePaths) {
        try {
            await execAsync(`"${rustcPath}" --version`);
            return rustcPath;
        } catch {
            // Try next path
        }
    }
    
    return null;
}

// Cache the rustc path
let cachedRustcPath: string | null | undefined = undefined;

/**
 * Check if rustc is available and cache the path
 */
export async function isRustAvailable(): Promise<boolean> {
    if (cachedRustcPath === undefined) {
        cachedRustcPath = await getRustcPath();
    }
    return cachedRustcPath !== null;
}

/**
 * Get the cached rustc path
 */
export async function getRustc(): Promise<string> {
    if (cachedRustcPath === undefined) {
        cachedRustcPath = await getRustcPath();
    }
    if (!cachedRustcPath) {
        throw new Error('Rust compiler (rustc) not found');
    }
    return cachedRustcPath;
}
