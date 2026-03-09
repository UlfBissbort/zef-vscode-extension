import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { extractDeclaredVariables } from './evalAndCapture';
import type { JsonValue } from './executionLog';

const execAsync = promisify(exec);

export interface SideEffect {
    what: string;
    content: string;
}

export interface TsCellResult {
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
    capturedVariables: Record<string, JsonValue>;
    nonSerializable: string[];
}

/**
 * Keywords that cannot be returned - these are statements, not expressions
 * Includes TypeScript-specific keywords
 */
const STATEMENT_KEYWORDS = [
    'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while',
    'do', 'switch', 'try', 'catch', 'finally', 'throw', 'break', 'continue',
    'return', 'import', 'export', 'debugger', 'with',
    // TypeScript-specific
    'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'abstract'
];

/**
 * Extract import statements from code (they need to be hoisted to top level)
 */
export function extractImports(code: string): { imports: string[], remainingCode: string } {
    const lines = code.split('\n');
    const imports: string[] = [];
    const remaining: string[] = [];
    
    let inMultilineImport = false;
    let multilineImport = '';
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Handle multiline imports
        if (inMultilineImport) {
            multilineImport += '\n' + line;
            if (trimmed.includes(';') || (trimmed.includes('}') && trimmed.includes('from'))) {
                imports.push(multilineImport);
                inMultilineImport = false;
                multilineImport = '';
            }
            continue;
        }
        
        // Check for import statement start
        if (trimmed.startsWith('import ')) {
            // Check if it's a complete single-line import
            if (trimmed.includes(';') || (trimmed.includes('from') && trimmed.match(/from\s+['"][^'"]+['"]\s*;?\s*$/))) {
                imports.push(line);
            } else {
                // Start of multiline import
                inMultilineImport = true;
                multilineImport = line;
            }
        } else {
            remaining.push(line);
        }
    }
    
    return {
        imports,
        remainingCode: remaining.join('\n')
    };
}

/**
 * Transform TypeScript code to return the last expression value
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
 * Generate the TypeScript wrapper script.
 * varNames: top-level variable names to capture after execution.
 */
function generateTsWrapper(userCode: string, resultFile: string, varNames: string[]): string {
    // Extract and hoist imports
    const { imports, remainingCode } = extractImports(userCode);

    // Transform the remaining code for return
    const transformed = transformForReturn(remainingCode);

    // Insert capture code before the final return (added by transformForReturn) or at end.
    // Only checks the LAST non-empty line to avoid matching return inside function bodies.
    const lines = transformed.split('\n');
    const captureLines = varNames.map(n =>
        `try { const __v = ${n}; const __s = JSON.stringify(__v); if (__s !== undefined && __s.length < 1000000) __zef_captured[${JSON.stringify(n)}] = JSON.parse(__s); else __zef_nonser.push(${JSON.stringify(n)}); } catch { __zef_nonser.push(${JSON.stringify(n)}); }`
    );
    let lastIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim()) { lastIdx = i; break; }
    }
    if (lastIdx >= 0 && lines[lastIdx].trim().startsWith('return ')) {
        lines.splice(lastIdx, 0, ...captureLines);
    } else {
        lines.push(...captureLines);
    }
    const codeWithCapture = lines.join('\n');

    // Indent user code for inside the try block
    const indentedCode = codeWithCapture.split('\n').map(l => '        ' + l).join('\n');

    // Escape the result file path
    const escapedResultFile = resultFile.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    // Build the complete script
    let script = `import { writeFileSync } from 'fs';
import { inspect } from 'util';
`;

    // Add user imports
    if (imports.length > 0) {
        script += imports.join('\n') + '\n';
    }

    script += `
const __zef_captured: Record<string, any> = {};
const __zef_nonser: string[] = [];

(async () => {
    try {
${indentedCode}
    } catch (e: any) {
        writeFileSync('${escapedResultFile}', JSON.stringify({
            status: 'error',
            error: { name: e.name || 'Error', message: e.message || String(e), stack: e.stack || '' },
            variables: __zef_captured,
            nonSerializable: __zef_nonser
        }));
        process.exit(0);
    }
})().then((result) => {
    writeFileSync('${escapedResultFile}', JSON.stringify({
        status: 'ok',
        result: result === undefined ? null : inspect(result, { depth: 5, colors: false }),
        variables: __zef_captured,
        nonSerializable: __zef_nonser
    }));
}).catch((e: any) => {
    writeFileSync('${escapedResultFile}', JSON.stringify({
        status: 'error',
        error: { name: e.name || 'Error', message: e.message || String(e), stack: e.stack || '' },
        variables: __zef_captured,
        nonSerializable: __zef_nonser
    }));
});
`;

    return script;
}

// Cache the bun path
let cachedBunPath: string | null = null;

/**
 * Get the path to the bun executable, checking settings first
 */
export async function getBunPath(): Promise<string> {
    if (cachedBunPath) {
        return cachedBunPath;
    }
    
    // First check if user has configured a custom path in settings
    const config = vscode.workspace.getConfiguration('zef');
    const configuredPath = config.get<string>('bunPath');
    
    if (configuredPath) {
        try {
            // Try to run it to verify it works
            await execAsync(`"${configuredPath}" --version`);
            cachedBunPath = configuredPath;
            return configuredPath;
        } catch {
            // Configured path is invalid, fall back to auto-detection
        }
    }
    
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    
    // Common locations for bun
    const possiblePaths = [
        'bun', // Try PATH first (works on all platforms)
        path.join(os.homedir(), '.bun', 'bin', `bun${ext}`),  // Standard bun location (all platforms)
    ];
    
    // Add platform-specific paths
    if (!isWindows) {
        possiblePaths.push('/usr/local/bin/bun');
        possiblePaths.push('/opt/homebrew/bin/bun'); // macOS Homebrew ARM
    }
    
    // Try each path by actually running bun --version
    for (const bunPath of possiblePaths) {
        try {
            await execAsync(`"${bunPath}" --version`);
            cachedBunPath = bunPath;
            return bunPath;
        } catch {
            // Try next path
        }
    }
    
    // Try to find via platform-appropriate command
    try {
        const findCmd = isWindows ? 'where bun' : 'which bun';
        const { stdout } = await execAsync(findCmd);
        const bunPath = stdout.trim().split('\n')[0]; // Take first result on Windows
        if (bunPath) {
            cachedBunPath = bunPath;
            return bunPath;
        }
    } catch {
        // Command failed
    }
    
    throw new Error('Bun not found. Please install Bun (https://bun.sh)');
}

/**
 * Check if bun is available
 */
export async function isBunAvailable(): Promise<boolean> {
    try {
        await getBunPath();
        return true;
    } catch {
        return false;
    }
}

/**
 * Execute TypeScript code using bun and return the result
 */
export async function executeTs(code: string, cellId: string): Promise<TsCellResult> {
    const tmpDir = os.tmpdir();
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const tsFile = path.join(tmpDir, `zef-ts-${uniqueId}.ts`);
    const resultFile = path.join(tmpDir, `zef-ts-result-${uniqueId}.json`);

    // Extract top-level variable names using the TS parser
    const varNames = extractDeclaredVariables(code);

    try {
        // Get bun path
        const bunPath = await getBunPath();

        // Generate and write the TypeScript file
        const tsCode = generateTsWrapper(code, resultFile, varNames);
        await fs.writeFile(tsFile, tsCode);

        // Execute with bun
        let stdout = '';
        let stderr = '';

        try {
            const result = await execAsync(`"${bunPath}" run "${tsFile}"`, {
                timeout: 30000, // 30 second timeout
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            });
            stdout = result.stdout;
            stderr = result.stderr;
        } catch (execError: any) {
            // Command failed - could be compilation or runtime error
            stdout = execError.stdout || '';
            stderr = execError.stderr || '';

            // If no result file was created, return the error
            try {
                await fs.access(resultFile);
            } catch {
                // No result file - compilation error
                return {
                    cell_id: cellId,
                    status: 'error',
                    result: null,
                    stdout,
                    stderr,
                    side_effects: stdout ? [{ what: 'stdout', content: stdout }] : [],
                    error: {
                        type: 'CompilationError',
                        message: stderr || execError.message || 'TypeScript compilation failed',
                        traceback: stderr
                    },
                    capturedVariables: {},
                    nonSerializable: []
                };
            }
        }

        // Read the result file
        let resultData: { status: string; result?: string; error?: { name: string; message: string; stack?: string }; variables?: Record<string, JsonValue>; nonSerializable?: string[] };
        try {
            const resultContent = await fs.readFile(resultFile, 'utf-8');
            resultData = JSON.parse(resultContent);
        } catch {
            // No result file or invalid JSON
            return {
                cell_id: cellId,
                status: 'error',
                result: null,
                stdout,
                stderr,
                side_effects: stdout ? [{ what: 'stdout', content: stdout }] : [],
                error: {
                    type: 'ExecutionError',
                    message: 'No result produced',
                    traceback: stderr
                },
                capturedVariables: {},
                nonSerializable: []
            };
        }

        const capturedVariables = resultData.variables || {};
        const nonSerializable = resultData.nonSerializable || [];

        // Build side effects
        const sideEffects: SideEffect[] = [];
        if (stdout) {
            sideEffects.push({ what: 'stdout', content: stdout });
        }
        if (stderr) {
            sideEffects.push({ what: 'stderr', content: stderr });
        }

        if (resultData.status === 'ok') {
            return {
                cell_id: cellId,
                status: 'ok',
                result: resultData.result || null,
                stdout,
                stderr,
                side_effects: sideEffects,
                error: null,
                capturedVariables,
                nonSerializable
            };
        } else {
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
                },
                capturedVariables,
                nonSerializable
            };
        }
        
    } finally {
        // Clean up temp files
        try {
            await fs.unlink(tsFile);
        } catch { /* ignore */ }
        try {
            await fs.unlink(resultFile);
        } catch { /* ignore */ }
    }
}
