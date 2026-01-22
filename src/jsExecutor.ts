import { exec } from 'child_process';
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

export interface JsCellResult {
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
 * Keywords that cannot be returned - these are statements, not expressions
 */
const STATEMENT_KEYWORDS = [
    'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
    'do', 'switch', 'try', 'catch', 'finally', 'throw', 'break', 'continue',
    'return', 'import', 'export', 'debugger', 'with'
];

/**
 * Transform JavaScript code to return the last expression value
 */
export function transformForReturn(code: string): string {
    const lines = code.trimEnd().split('\n');
    
    // Find last non-empty, non-comment line
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        // Skip empty and comments
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }
        
        // Skip statement blocks that end with }
        // (could be if/for/while/function definition)
        if (line.endsWith('}')) {
            break;
        }
        
        // Check if line starts with a statement keyword - can't return these
        const startsWithKeyword = STATEMENT_KEYWORDS.some(keyword => 
            line.startsWith(keyword + ' ') || line.startsWith(keyword + '(') || line === keyword
        );
        if (startsWithKeyword) {
            break;
        }
        
        // Remove trailing semicolon if present
        let modifiedLine = lines[i];
        if (line.endsWith(';')) {
            modifiedLine = modifiedLine.replace(/;\s*$/, '');
        }
        
        // Add return if not already present
        const trimmedModified = modifiedLine.trim();
        if (!trimmedModified.startsWith('return ') && !trimmedModified.startsWith('return;')) {
            const leadingWhitespace = modifiedLine.match(/^(\s*)/)?.[1] || '';
            const content = modifiedLine.trim();
            modifiedLine = leadingWhitespace + 'return ' + content;
        }
        
        lines[i] = modifiedLine;
        break;
    }
    
    return lines.join('\n');
}

/**
 * Generate the JavaScript executor script
 */
function generateJsExecutor(userCodeFile: string, resultFile: string): string {
    // Escape paths for JavaScript string
    const escapedCodeFile = userCodeFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const escapedResultFile = resultFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    return `
const fs = require('fs');
const util = require('util');

const userCode = fs.readFileSync('${escapedCodeFile}', 'utf-8');
const resultFile = '${escapedResultFile}';

// Keywords that cannot be returned - these are statements, not expressions
const STATEMENT_KEYWORDS = [
    'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
    'do', 'switch', 'try', 'catch', 'finally', 'throw', 'break', 'continue',
    'return', 'import', 'export', 'debugger', 'with'
];

// Transform last expression for return
function transformForReturn(code) {
    const lines = code.trimEnd().split('\\n');
    
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        if (!line || line.startsWith('//') || line.startsWith('/*')) {
            continue;
        }
        
        if (line.endsWith('}')) {
            break;
        }
        
        // Check if line starts with a statement keyword
        const startsWithKeyword = STATEMENT_KEYWORDS.some(keyword => 
            line.startsWith(keyword + ' ') || line.startsWith(keyword + '(') || line === keyword
        );
        if (startsWithKeyword) {
            break;
        }
        
        let modifiedLine = lines[i];
        if (line.endsWith(';')) {
            modifiedLine = modifiedLine.replace(/;\\s*$/, '');
        }
        
        const trimmedModified = modifiedLine.trim();
        if (!trimmedModified.startsWith('return ') && !trimmedModified.startsWith('return;')) {
            const leadingWhitespace = modifiedLine.match(/^(\\s*)/)?.[1] || '';
            const content = modifiedLine.trim();
            modifiedLine = leadingWhitespace + 'return ' + content;
        }
        
        lines[i] = modifiedLine;
        break;
    }
    
    return lines.join('\\n');
}

const transformed = transformForReturn(userCode);
const wrapped = \`(async () => {\\n\${transformed}\\n})()\`;

(async () => {
    try {
        const result = await eval(wrapped);
        const output = {
            status: 'ok',
            result: result === undefined ? null : util.inspect(result, { depth: 5, colors: false })
        };
        fs.writeFileSync(resultFile, JSON.stringify(output));
    } catch (e) {
        const output = {
            status: 'error',
            error: {
                name: e.name || 'Error',
                message: e.message || String(e),
                stack: e.stack || ''
            }
        };
        fs.writeFileSync(resultFile, JSON.stringify(output));
    }
})();
`;
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
    
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    
    // Common bun locations for auto-detection
    const possiblePaths = [
        'bun',  // Try PATH first (works on all platforms)
        path.join(os.homedir(), '.bun', 'bin', `bun${ext}`),  // Standard bun location (all platforms)
    ];
    
    // Add platform-specific paths
    if (!isWindows) {
        possiblePaths.push('/usr/local/bin/bun');
        possiblePaths.push('/usr/bin/bun');
        possiblePaths.push('/opt/homebrew/bin/bun'); // macOS Homebrew ARM
    }
    
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
export async function getBun(): Promise<string> {
    if (cachedBunPath === undefined) {
        cachedBunPath = await getBunPath();
    }
    if (!cachedBunPath) {
        throw new Error('Bun runtime not found');
    }
    return cachedBunPath;
}

/**
 * Execute JavaScript code and return the result
 */
export async function executeJs(code: string, cellId: string): Promise<JsCellResult> {
    const execId = crypto.randomBytes(8).toString('hex');
    const tmpDir = os.tmpdir();
    const userCodeFile = path.join(tmpDir, `zef_js_user_${execId}.js`);
    const executorFile = path.join(tmpDir, `zef_js_executor_${execId}.js`);
    const resultFile = path.join(tmpDir, `zef_js_result_${execId}.json`);
    
    // Get bun path
    const bunPath = await getBun();
    
    try {
        // Write user code to file
        await fs.writeFile(userCodeFile, code);
        
        // Generate and write executor script
        const executorCode = generateJsExecutor(userCodeFile, resultFile);
        await fs.writeFile(executorFile, executorCode);
        
        // Execute with bun
        let stdout = '';
        let stderr = '';
        try {
            const result = await execAsync(`"${bunPath}" "${executorFile}"`, {
                timeout: 30000  // 30 second timeout
            });
            stdout = result.stdout;
            stderr = result.stderr;
        } catch (e: any) {
            // Execution failed (could be syntax error before our handler)
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout: e.stdout || '',
                stderr: e.stderr || '',
                side_effects: [],
                error: {
                    type: 'RuntimeError',
                    message: 'JavaScript execution failed',
                    traceback: e.stderr || e.message || 'Unknown error'
                }
            };
        }
        
        // Read result from file
        let resultData: { status: string; result?: string; error?: any } = { status: 'ok' };
        try {
            const resultJson = await fs.readFile(resultFile, 'utf-8');
            resultData = JSON.parse(resultJson);
        } catch {
            // Result file not created - likely syntax error
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout,
                stderr,
                side_effects: [],
                error: {
                    type: 'ExecutionError',
                    message: 'Failed to get result',
                    traceback: stderr || 'Unknown error'
                }
            };
        }
        
        // Build side effects
        const sideEffects: SideEffect[] = [];
        if (stdout.trim()) {
            sideEffects.push({ what: 'stdout', content: stdout.trim() });
        }
        if (stderr.trim()) {
            sideEffects.push({ what: 'stderr', content: stderr.trim() });
        }
        
        if (resultData.status === 'error') {
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout,
                stderr,
                side_effects: sideEffects,
                error: {
                    type: resultData.error?.name || 'Error',
                    message: resultData.error?.message || 'Unknown error',
                    traceback: resultData.error?.stack || ''
                }
            };
        }
        
        return {
            cell_id: cellId,
            status: 'ok',
            result: resultData.result || null,
            stdout,
            stderr,
            side_effects: sideEffects,
            error: null
        };
        
    } finally {
        // Cleanup temp files
        await Promise.all([
            fs.unlink(userCodeFile).catch(() => {}),
            fs.unlink(executorFile).catch(() => {}),
            fs.unlink(resultFile).catch(() => {})
        ]);
    }
}
