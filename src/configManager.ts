import * as vscode from 'vscode';
import { detectPythons, normalizeVenvPath, PythonInfo } from './pythonDetector';
import { isRustAvailable } from './rustExecutor';
import { isBunAvailable } from './jsExecutor';

const CONFIG_SECTION = 'zef';

/**
 * Get the configured Python path (notebook venv or default)
 */
export function getPythonPath(): string | null {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    
    // First try notebook venv
    const notebookVenv = config.get<string>('notebookVenv');
    if (notebookVenv) {
        const normalized = normalizeVenvPath(notebookVenv);
        if (normalized) {
            return normalized;
        }
    }
    
    // Then try default python
    const defaultPython = config.get<string>('defaultPython');
    if (defaultPython) {
        return defaultPython;
    }
    
    // Try to auto-detect
    const pythons = detectPythons();
    if (pythons.length > 0) {
        return pythons[0].path;
    }
    
    return null;
}

/**
 * Set the default Python path
 */
export async function setDefaultPython(pythonPath: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    await config.update('defaultPython', pythonPath, vscode.ConfigurationTarget.Global);
}

/**
 * Set the notebook venv path
 */
export async function setNotebookVenv(venvPath: string | null): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    await config.update('notebookVenv', venvPath, vscode.ConfigurationTarget.Global);
}

/**
 * Get the configured notebook venv
 */
export function getNotebookVenv(): string | null {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const venv = config.get<string>('notebookVenv');
    if (venv) {
        return normalizeVenvPath(venv);
    }
    return null;
}

/**
 * Show Python picker and let user select a Python installation
 */
export async function showPythonPicker(): Promise<string | undefined> {
    const pythons = detectPythons();
    
    if (pythons.length === 0) {
        vscode.window.showErrorMessage('No Python installations found');
        return undefined;
    }
    
    interface PythonQuickPickItem extends vscode.QuickPickItem {
        pythonPath: string;
    }
    
    const items: PythonQuickPickItem[] = pythons.map(p => ({
        label: getEmojiForSource(p.source) + ' ' + (p.displayName || p.version),
        description: p.version,
        detail: p.path,
        pythonPath: p.path,
    }));
    
    // Add option to enter custom path
    items.push({
        label: '$(folder) Enter custom path...',
        description: '',
        detail: 'Browse for a Python executable or venv',
        pythonPath: '__custom__',
    });
    
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Python interpreter for Zef',
        matchOnDescription: true,
        matchOnDetail: true,
    });
    
    if (!selected) {
        return undefined;
    }
    
    if (selected.pythonPath === '__custom__') {
        const customPath = await vscode.window.showInputBox({
            prompt: 'Enter path to Python executable or virtual environment',
            placeHolder: '/path/to/venv or /path/to/python',
            validateInput: (value) => {
                if (!value) return 'Path is required';
                const normalized = normalizeVenvPath(value);
                if (!normalized) return 'Could not find Python at this path';
                return null;
            }
        });
        
        if (customPath) {
            return normalizeVenvPath(customPath) || undefined;
        }
        return undefined;
    }
    
    return selected.pythonPath;
}

/**
 * Get emoji for Python source
 */
function getEmojiForSource(source: string): string {
    if (source.includes('venv') || source.includes('virtualenv')) return '📦';
    if (source.includes('conda')) return '🐍';
    if (source.includes('pyenv')) return '🔧';
    if (source.includes('PATH')) return '💻';
    return '🐍';
}

/**
 * Show settings panel for Zef configuration
 */
export async function showSettingsPanel(): Promise<void> {
    const currentPython = getPythonPath();
    const currentVenv = getNotebookVenv();
    
    // Check runtime availability
    const [rustAvailable, bunAvailable] = await Promise.all([
        isRustAvailable(),
        isBunAvailable()
    ]);
    
    const config = vscode.workspace.getConfiguration('zef');
    const rustcPath = config.get<string>('rustcPath');
    const bunPath = config.get<string>('bunPath');
    
    interface SettingsQuickPickItem extends vscode.QuickPickItem {
        action: string;
    }
    
    const items: SettingsQuickPickItem[] = [
        {
            label: `${currentPython ? '$(check)' : '$(warning)'} Python Interpreter`,
            description: currentPython ? `Current: ${currentPython}` : 'Not configured',
            detail: 'Choose which Python to use for running code blocks',
            action: 'selectPython',
        },
        {
            label: `${rustAvailable ? '$(check)' : '$(warning)'} Rust Compiler`,
            description: rustAvailable ? (rustcPath || 'Auto-detected') : 'Not found',
            detail: rustAvailable ? 'Rust is available' : 'Configure path or install from rustup.rs',
            action: 'configureRust',
        },
        {
            label: `${bunAvailable ? '$(check)' : '$(warning)'} Bun Runtime (JS/TS)`,
            description: bunAvailable ? (bunPath || 'Auto-detected') : 'Not found',
            detail: bunAvailable ? 'Bun is available for JavaScript/TypeScript' : 'Configure path or install from bun.sh',
            action: 'configureBun',
        },
        {
            label: '$(folder) Set Notebook Virtual Environment',
            description: currentVenv ? `Current: ${currentVenv}` : 'Not set',
            detail: 'Set a specific venv for notebook execution',
            action: 'setVenv',
        },
        {
            label: '$(refresh) Restart Kernel',
            description: '',
            detail: 'Restart the Python kernel (clears all state)',
            action: 'restartKernel',
        },
        {
            label: '$(output) Show Kernel Output',
            description: '',
            detail: 'Show the kernel output channel for debugging',
            action: 'showOutput',
        },
        {
            label: '$(settings-gear) Open All Settings',
            description: '',
            detail: 'Open VS Code settings for Zef',
            action: 'openSettings',
        },
    ];
    
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Zef Settings',
    });
    
    if (!selected) return;
    
    switch (selected.action) {
        case 'selectPython': {
            const pythonPath = await showPythonPicker();
            if (pythonPath) {
                await setDefaultPython(pythonPath);
                vscode.window.showInformationMessage(`Python set to: ${pythonPath}`);
            }
            break;
        }
        case 'setVenv': {
            const venvPath = await vscode.window.showInputBox({
                prompt: 'Enter path to virtual environment',
                placeHolder: '~/dev/myproject/venv or leave empty to clear',
                value: currentVenv || '',
            });
            
            if (venvPath === undefined) return; // Cancelled
            
            if (venvPath === '') {
                await setNotebookVenv(null);
                vscode.window.showInformationMessage('Notebook venv cleared');
            } else {
                const normalized = normalizeVenvPath(venvPath);
                if (normalized) {
                    await setNotebookVenv(venvPath);
                    vscode.window.showInformationMessage(`Notebook venv set to: ${normalized}`);
                } else {
                    vscode.window.showErrorMessage(`Could not find Python in: ${venvPath}`);
                }
            }
            break;
        }
        case 'configureRust': {
            const action = await vscode.window.showQuickPick([
                { label: '$(gear) Configure Custom Path', action: 'configure' },
                { label: '$(link-external) Install Rust (rustup.rs)', action: 'install' }
            ], {
                placeHolder: 'Rust Compiler Configuration'
            });
            
            if (action?.action === 'configure') {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'zef.rustcPath');
            } else if (action?.action === 'install') {
                vscode.env.openExternal(vscode.Uri.parse('https://rustup.rs/'));
            }
            break;
        }
        case 'configureBun': {
            const action = await vscode.window.showQuickPick([
                { label: '$(gear) Configure Custom Path', action: 'configure' },
                { label: '$(link-external) Install Bun (bun.sh)', action: 'install' }
            ], {
                placeHolder: 'Bun Runtime Configuration'
            });
            
            if (action?.action === 'configure') {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'zef.bunPath');
            } else if (action?.action === 'install') {
                vscode.env.openExternal(vscode.Uri.parse('https://bun.sh/'));
            }
            break;
        }
        case 'restartKernel':
            await vscode.commands.executeCommand('zef.restartKernel');
            break;
        case 'showOutput':
            await vscode.commands.executeCommand('zef.showKernelOutput');
            break;
        case 'openSettings':
            await vscode.commands.executeCommand('workbench.action.openSettings', 'zef');
            break;
    }
}
