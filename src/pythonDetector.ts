import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

export interface PythonInfo {
    path: string;
    version: string;
    source: string;
    displayName?: string;
}

/**
 * Detect all available Python installations on the system
 */
export function detectPythons(): PythonInfo[] {
    const pythons: PythonInfo[] = [];
    const seenPaths = new Set<string>();

    // 1. Find pythons in PATH using `which -a`
    for (const name of ['python3', 'python']) {
        const paths = findInPath(name);
        for (const p of paths) {
            const info = validatePython(p, 'PATH', undefined, seenPaths);
            if (info) pythons.push(info);
        }
    }

    // 2. Check for local virtual environments
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const localVenvs = [
                path.join(folder.uri.fsPath, 'venv', 'bin', 'python'),
                path.join(folder.uri.fsPath, '.venv', 'bin', 'python'),
                path.join(folder.uri.fsPath, 'dev_venv', 'bin', 'python'),
            ];
            for (const venvPath of localVenvs) {
                if (fs.existsSync(venvPath)) {
                    const venvName = path.basename(path.dirname(path.dirname(venvPath)));
                    const info = validatePython(venvPath, 'venv (workspace)', venvName, seenPaths);
                    if (info) pythons.push(info);
                }
            }
        }
    }

    // 3. Check for pyenv versions
    const homeDir = process.env.HOME || '';
    if (homeDir) {
        const pyenvVersions = path.join(homeDir, '.pyenv', 'versions');
        if (fs.existsSync(pyenvVersions)) {
            try {
                const entries = fs.readdirSync(pyenvVersions);
                for (const entry of entries) {
                    const pythonPath = path.join(pyenvVersions, entry, 'bin', 'python');
                    if (fs.existsSync(pythonPath)) {
                        const info = validatePython(pythonPath, 'pyenv', entry, seenPaths);
                        if (info) pythons.push(info);
                    }
                }
            } catch (e) {
                // Ignore errors reading pyenv
            }
        }

        // 4. Check for conda environments
        for (const condaDir of ['anaconda3', 'miniconda3']) {
            const condaBase = path.join(homeDir, condaDir);
            
            // Base conda python
            const basePython = path.join(condaBase, 'bin', 'python');
            if (fs.existsSync(basePython)) {
                const info = validatePython(basePython, 'conda', 'base', seenPaths);
                if (info) pythons.push(info);
            }
            
            // Conda environments
            const envsDir = path.join(condaBase, 'envs');
            if (fs.existsSync(envsDir)) {
                try {
                    const envs = fs.readdirSync(envsDir);
                    for (const env of envs) {
                        const envPython = path.join(envsDir, env, 'bin', 'python');
                        if (fs.existsSync(envPython)) {
                            const info = validatePython(envPython, 'conda', env, seenPaths);
                            if (info) pythons.push(info);
                        }
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        }

        // 5. Check for virtualenvs
        const venvDirs = [
            path.join(homeDir, '.virtualenvs'),
            path.join(homeDir, '.local', 'share', 'virtualenvs'),
            path.join(homeDir, 'venvs'),
            path.join(homeDir, '.venvs'),
        ];
        for (const venvDir of venvDirs) {
            if (fs.existsSync(venvDir)) {
                try {
                    const envs = fs.readdirSync(venvDir);
                    for (const env of envs) {
                        const envPython = path.join(venvDir, env, 'bin', 'python');
                        if (fs.existsSync(envPython)) {
                            const info = validatePython(envPython, 'virtualenv', env, seenPaths);
                            if (info) pythons.push(info);
                        }
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        }
    }

    return pythons;
}

/**
 * Find all instances of a command in PATH using `which -a`
 */
function findInPath(name: string): string[] {
    try {
        const output = execSync(`which -a ${name}`, { encoding: 'utf-8', timeout: 5000 });
        return output.trim().split('\n').filter(p => p.length > 0);
    } catch (e) {
        return [];
    }
}

/**
 * Validate a Python path and get its version
 */
function validatePython(
    pythonPath: string,
    source: string,
    displayName: string | undefined,
    seen: Set<string>
): PythonInfo | null {
    try {
        // Resolve to real path to avoid duplicates
        const realPath = fs.realpathSync(pythonPath);
        
        // Keep the original path for venvs (they need symlinks to work)
        const pathToUse = source.includes('venv') || source.includes('virtualenv') 
            ? pythonPath 
            : realPath;
        
        if (seen.has(realPath)) {
            return null;
        }
        seen.add(realPath);

        // Get Python version
        const versionOutput = execSync(`"${pathToUse}" --version`, { 
            encoding: 'utf-8', 
            timeout: 5000,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const version = versionOutput.trim().replace('Python ', '');

        return {
            path: pathToUse,
            version,
            source,
            displayName,
        };
    } catch (e) {
        return null;
    }
}

/**
 * Normalize a venv path to point to the Python executable
 */
export function normalizeVenvPath(inputPath: string): string | null {
    // Expand ~ to home directory
    let p = inputPath;
    if (p.startsWith('~/')) {
        const homeDir = process.env.HOME || '';
        p = path.join(homeDir, p.slice(2));
    }

    // If path ends with bin/python, use it directly
    if (p.endsWith('/bin/python') || p.endsWith('/bin/python3')) {
        if (fs.existsSync(p)) {
            return p;
        }
        return null;
    }

    // Check if it's a venv directory with bin/python
    const pythonPath = path.join(p, 'bin', 'python');
    if (fs.existsSync(pythonPath)) {
        return pythonPath;
    }

    const python3Path = path.join(p, 'bin', 'python3');
    if (fs.existsSync(python3Path)) {
        return python3Path;
    }

    // Maybe it's a direct python executable
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
    }

    return null;
}
