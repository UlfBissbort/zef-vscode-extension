/**
 * Zef Installer & CLI — delegates to bundled Rust binaries.
 *
 * The zef-install binary outputs NDJSON (one JSON object per line) during
 * installation, which we parse to drive a VSCode progress notification.
 *
 * Bundled binaries in resources/bin/:
 *   Installer:
 *     - zef-install-macos-arm64
 *     - zef-install-linux-x86_64
 *     - zef-install-windows-x86_64.exe
 *   CLI:
 *     - zef-macos-arm64
 *     - zef-linux-x86_64
 *     - zef-windows-x86_64.exe
 */

import { spawn, execSync } from 'child_process';
import * as readline from 'readline';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ── Types matching the Rust StepResult / InstallStatus ────────────────────

interface StepSuccess {
    status: 'success';
    step: string;
    message: string;
}

interface StepFailed {
    status: 'failed';
    step: string;
    error: string;
}

interface StepSkipped {
    status: 'skipped';
    step: string;
    reason: string;
}

type StepResult = StepSuccess | StepFailed | StepSkipped;

interface InstallStatus {
    platform: string;
    uv_installed: boolean;
    uv_path: string | null;
    venv_exists: boolean;
    venv_path: string;
}

// ── Human-readable step labels ────────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
    check_wsl:      'Checking WSL...',
    ensure_uv:      'Setting up UV package manager...',
    create_venv:    'Creating Python environment...',
    download_wheel: 'Downloading Zef...',
    install_wheel:  'Installing Zef...',
    write_daemon:   'Writing daemon script...',
    create_service: 'Creating system service...',
    start_service:  'Starting Tokolosh daemon...',
};

// ── Output channel for observability ──────────────────────────────────────

let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('Zef Installer');
    }
    return outputChannel;
}

function log(msg: string): void {
    const ch = getOutputChannel();
    const timestamp = new Date().toISOString().slice(11, 23);
    ch.appendLine(`[${timestamp}] ${msg}`);
}

// ── Binary resolution ─────────────────────────────────────────────────────

/**
 * Returns the path to the bundled zef-install binary for the current platform,
 * or null if no matching binary exists.
 */
function getInstallerBinaryPath(context: vscode.ExtensionContext): string | null {
    const platform = process.platform;   // 'darwin' | 'linux' | 'win32'
    const arch = process.arch;           // 'arm64' | 'x64' | ...

    let binaryName: string;

    if (platform === 'darwin' && arch === 'arm64') {
        binaryName = 'zef-install-macos-arm64';
    } else if (platform === 'linux' && arch === 'x64') {
        binaryName = 'zef-install-linux-x86_64';
    } else if (platform === 'win32' && arch === 'x64') {
        binaryName = 'zef-install-windows-x86_64.exe';
    } else {
        return null;
    }

    const binPath = path.join(context.extensionPath, 'resources', 'bin', binaryName);
    return fs.existsSync(binPath) ? binPath : null;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Check the current Tokolosh installation status.
 * Runs: `zef-install check`
 * Returns the parsed status, or null if the binary is missing or check fails.
 */
export async function checkInstallation(
    context: vscode.ExtensionContext
): Promise<InstallStatus | null> {
    const bin = getInstallerBinaryPath(context);
    if (!bin) {
        log(`No installer binary for ${process.platform}-${process.arch}`);
        return null;
    }

    log(`Running: ${bin} check`);

    return new Promise((resolve) => {
        const proc = spawn(bin, ['check']);
        let stdout = '';

        proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });

        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const status = JSON.parse(stdout);
                    log(`Check result: ${JSON.stringify(status)}`);
                    resolve(status);
                } catch {
                    log('Failed to parse check output');
                    resolve(null);
                }
            } else {
                log(`Check exited with code ${code}`);
                resolve(null);
            }
        });

        proc.on('error', (err) => {
            log(`Check error: ${err.message}`);
            resolve(null);
        });
    });
}

/**
 * Run the full Tokolosh installation with a progress notification.
 * Runs: `zef-install install`
 * Parses NDJSON from stdout to drive progress updates.
 * Returns true on success, false on failure.
 */
export async function runInstallation(
    context: vscode.ExtensionContext
): Promise<boolean> {
    const bin = getInstallerBinaryPath(context);
    if (!bin) {
        log(`No installer binary for ${process.platform}-${process.arch}`);
        vscode.window.showErrorMessage(
            `No zef-install binary found for ${process.platform}-${process.arch}. ` +
            'Please install Zef manually.'
        );
        return false;
    }

    const ch = getOutputChannel();
    ch.show(true); // Show the output channel but don't steal focus

    log(`Running: ${bin} install`);
    log(`Platform: ${process.platform}, Arch: ${process.arch}`);

    return vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Setting up Zef',
            cancellable: false,
        },
        async (progress) => {
            return new Promise<boolean>((resolve) => {
                const proc = spawn(bin, ['install']);
                const rl = readline.createInterface({ input: proc.stdout });

                const totalSteps = 7;
                let completedSteps = 0;
                const increment = 100 / totalSteps;

                rl.on('line', (line) => {
                    try {
                        const result: StepResult = JSON.parse(line);
                        const label = STEP_LABELS[result.step] || result.step;

                        switch (result.status) {
                            case 'success':
                                completedSteps++;
                                log(`✓ ${result.step}: ${result.message}`);
                                progress.report({
                                    message: label,
                                    increment,
                                });
                                break;

                            case 'skipped':
                                completedSteps++;
                                log(`⊘ ${result.step}: ${result.reason}`);
                                progress.report({
                                    message: `${label} (skipped)`,
                                    increment,
                                });
                                break;

                            case 'failed':
                                log(`✗ ${result.step}: ${result.error}`);
                                vscode.window.showErrorMessage(
                                    `Zef setup failed at "${result.step}": ${result.error}`
                                );
                                break;
                        }
                    } catch {
                        // Non-JSON line — ignore
                    }
                });

                proc.stderr.on('data', (data: Buffer) => {
                    const msg = data.toString().trim();
                    if (msg) { log(`stderr: ${msg}`); }
                });

                proc.on('close', (code) => {
                    log(`Install exited with code ${code}`);
                    if (code === 0) {
                        vscode.window.showInformationMessage(
                            'Zef Tokolosh daemon is running!'
                        );
                        resolve(true);
                    } else {
                        if (completedSteps === 0) {
                            vscode.window.showErrorMessage(
                                'Zef installation failed. Check the Output panel for details.'
                            );
                        }
                        resolve(false);
                    }
                });

                proc.on('error', (err) => {
                    vscode.window.showErrorMessage(
                        `Failed to run zef-install: ${err.message}`
                    );
                    resolve(false);
                });
            });
        }
    );
}

// ── CLI Installation ──────────────────────────────────────────────────────

/**
 * Returns the name of the bundled CLI binary for the current platform.
 * On Windows, returns the Linux binary (for WSL installation).
 */
function getCliBinaryName(): string | null {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin' && arch === 'arm64') { return 'zef-macos-arm64'; }
    if (platform === 'linux' && arch === 'x64') { return 'zef-linux-x86_64'; }
    if (platform === 'win32' && arch === 'x64') { return 'zef-linux-x86_64'; } // Linux binary for WSL
    return null;
}

/**
 * Install the zef CLI binary to a user-accessible location.
 *
 * - macOS / Linux: copies to ~/.local/bin/zef
 * - Windows: copies Linux binary into WSL ~/.local/bin/zef
 *
 * Skips if the same version is already installed at the target path.
 */
export async function installCli(
    context: vscode.ExtensionContext
): Promise<boolean> {
    const binaryName = getCliBinaryName();
    if (!binaryName) {
        log(`No CLI binary for ${process.platform}-${process.arch}`);
        return false;
    }

    const src = path.join(context.extensionPath, 'resources', 'bin', binaryName);
    if (!fs.existsSync(src)) {
        log(`CLI binary not found: ${src}`);
        return false;
    }

    try {
        if (process.platform === 'win32') {
            return installCliWsl(src);
        } else {
            return installCliUnix(src);
        }
    } catch (err: any) {
        log(`CLI installation failed: ${err.message}`);
        return false;
    }
}

/**
 * Install CLI on macOS / Linux: copy to ~/.local/bin/zef
 */
function installCliUnix(src: string): boolean {
    const dest = path.join(os.homedir(), '.local', 'bin', 'zef');
    const destDir = path.dirname(dest);

    // Skip if already identical (same size = same build)
    if (fs.existsSync(dest)) {
        const srcStat = fs.statSync(src);
        const dstStat = fs.statSync(dest);
        if (srcStat.size === dstStat.size) {
            log(`CLI already up to date at ${dest}`);
            return true;
        }
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755);

    log(`Installed zef CLI to ${dest}`);
    return true;
}

/**
 * Install Linux CLI binary into WSL at ~/.local/bin/zef
 */
function installCliWsl(src: string): boolean {
    try {
        // Copy binary to a Windows temp location
        const tmpPath = path.join(os.tmpdir(), 'zef');
        fs.copyFileSync(src, tmpPath);

        // Convert Windows path to WSL /mnt/c/... path
        const wslPath = tmpPath
            .replace(/^([A-Za-z]):/, (_m, drive: string) => `/mnt/${drive.toLowerCase()}`)
            .replace(/\\/g, '/');

        execSync('wsl mkdir -p ~/.local/bin');
        execSync(`wsl cp "${wslPath}" ~/.local/bin/zef`);
        execSync('wsl chmod 755 ~/.local/bin/zef');

        // Clean up temp file
        fs.unlinkSync(tmpPath);

        log('Installed zef CLI into WSL at ~/.local/bin/zef');
        return true;
    } catch (err: any) {
        log(`WSL CLI install failed: ${err.message}`);
        return false;
    }
}
