# Installing Python + Zef During VSCode Extension Activation

A technical tutorial on bootstrapping a complete Python environment (Python, UV, venv, Zef wheel) when the Zef VSCode extension is first installed or activated — without requiring any CLI or manual steps from the user.

---

## The Problem

When a user installs the Zef VSCode extension from the marketplace, they may have:
- No Python installed
- No UV installed
- No Zef library installed
- No virtual environment set up

The extension needs all of these to execute Python code blocks in `.zef.md` files. The user should press "Install" in the marketplace and have everything just work.

---

## Architecture Overview: CLI vs VSCode Extension

The **CLI** (`zef-cli`) already solves this exact problem via a 7-step installer in `installer.rs`. But a VSCode extension is a different execution environment:

| Aspect | CLI (Rust binary) | VS Code Extension (TypeScript/Node.js) |
|--------|-------------------|----------------------------------------|
| **Runtime** | Native binary, runs in shell | Node.js process inside VS Code |
| **Shell commands** | `std::process::Command` | `child_process.exec/spawn` |
| **UI for progress** | ratatui TUI (full terminal control) | `vscode.window.withProgress` notifications |
| **Platform detection** | `#[cfg(target_os)]` at compile time | `process.platform` / `process.arch` at runtime |
| **File I/O** | `std::fs` | `fs` (Node.js) or `vscode.workspace.fs` |
| **User interaction** | Keyboard events in TUI | Quick picks, input boxes, notifications |
| **Lifecycle** | Binary starts/stops cleanly | Extension activates/deactivates with VS Code |

The key insight: **the VS Code extension can reuse the exact same installation sequence, but must translate each step into the TypeScript/Node.js idioms**.

---

## The 7 Steps (Same as CLI, Different Execution)

```
┌────────────────────────────────────────────────────────────┐
│  Step 1: Check/Install UV                                  │
│  Step 2: Create venv with Python 3.14                      │
│  Step 3: Download platform-specific Zef wheel              │
│  Step 4: Install Zef wheel into venv                       │
│  Step 5: Write tokolosh daemon script                      │
│  Step 6: Create system service (launchd/systemd)           │
│  Step 7: Start the daemon                                  │
└────────────────────────────────────────────────────────────┘
```

---

## Approach 1: Extension Runs Shell Commands Directly

The most straightforward — and most robust — approach. The extension calls the same shell commands the CLI does, using Node.js `child_process`.

### Why This Is the Right Approach

1. **UV does the heavy lifting**. UV can download Python, create venvs, install wheels — all as a single binary. We just need UV.
2. **Shell commands are cross-platform enough**. `curl` exists on macOS and Linux. Windows is a future concern.
3. **No native dependencies in the extension**. The extension remains pure TypeScript. All native work is delegated to external tools.
4. **Proven path**. The CLI already validates this exact sequence works.

### Implementation Pattern

```typescript
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// ── Step 0: Platform Detection ──────────────────────────────────

function getWheelInfo(): { url: string; filename: string } | null {
    const platform = process.platform;   // 'darwin', 'linux', 'win32'
    const arch = process.arch;           // 'arm64', 'x64'

    if (platform === 'darwin' && arch === 'arm64') {
        return {
            url: 'https://drive.usercontent.google.com/download?id=1L1jHWEqXBbml55JO9bcb8hgZfPKrEaol&export=download&confirm=t',
            filename: 'zef_core-0.1.11-cp310-abi3-macosx_11_0_arm64.whl'
        };
    }
    if (platform === 'linux' && arch === 'x64') {
        return {
            url: 'https://drive.usercontent.google.com/download?id=1i5ytEonkCCwuiOyM3V4W9GJev5pcdTid&export=download&confirm=t',
            filename: 'zef_core-0.1.11-cp310-abi3-manylinux_2_17_x86_64.manylinux2014_x86_64.whl'
        };
    }
    return null;
}

function getDefaultVenvPath(): string {
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Zef', 'tokolosh_venv');
    }
    // Linux
    return path.join(os.homedir(), '.local', 'share', 'zef', 'tokolosh_venv');
}

function getSupportDir(): string {
    if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Zef');
    }
    return path.join(os.homedir(), '.local', 'share', 'zef');
}
```

### The Progress Notification Pattern

VS Code's `withProgress` API provides a non-blocking notification with a progress bar. This is the idiomatic way to show multi-step installation:

```typescript
async function installZefEnvironment(): Promise<boolean> {
    return vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Setting up Zef',
            cancellable: true,
        },
        async (progress, token) => {
            // Step 1: Check/Install UV
            progress.report({ message: 'Checking for UV package manager...', increment: 0 });
            
            if (token.isCancellationRequested) return false;
            const uvPath = await ensureUvInstalled(progress);
            if (!uvPath) return false;

            // Step 2: Create venv
            progress.report({ message: 'Creating Python environment...', increment: 15 });
            
            if (token.isCancellationRequested) return false;
            const venvPath = getDefaultVenvPath();
            const venvOk = await createVenv(uvPath, venvPath);
            if (!venvOk) return false;

            // Step 3: Download wheel
            progress.report({ message: 'Downloading Zef...', increment: 15 });
            
            if (token.isCancellationRequested) return false;
            const wheelPath = await downloadWheel();
            if (!wheelPath) return false;

            // Step 4: Install wheel
            progress.report({ message: 'Installing Zef...', increment: 15 });
            
            if (token.isCancellationRequested) return false;
            const installOk = await installWheel(uvPath, venvPath, wheelPath);
            if (!installOk) return false;

            // Step 5: Write daemon
            progress.report({ message: 'Configuring daemon...', increment: 15 });
            const daemonOk = writeDaemonScript();
            if (!daemonOk) return false;

            // Step 6: Create service
            progress.report({ message: 'Creating system service...', increment: 10 });
            const serviceOk = await createService(venvPath);
            if (!serviceOk) return false;

            // Step 7: Start service
            progress.report({ message: 'Starting Zef daemon...', increment: 15 });
            const startOk = await startService();

            progress.report({ message: 'Done!', increment: 15 });
            return startOk;
        }
    );
}
```

### Each Step in Detail

#### Step 1: Ensure UV is installed

```typescript
async function findUv(): Promise<string | null> {
    // Check PATH first
    try {
        const { stdout } = await execAsync('which uv');
        const p = stdout.trim();
        if (p) return p;
    } catch {}

    // Check common locations
    const home = os.homedir();
    const candidates = [
        path.join(home, '.local', 'bin', 'uv'),
        path.join(home, '.cargo', 'bin', 'uv'),
        '/usr/local/bin/uv',
        '/opt/homebrew/bin/uv',
    ];

    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return null;
}

async function ensureUvInstalled(
    progress: vscode.Progress<{ message?: string; increment?: number }>
): Promise<string | null> {
    let uvPath = await findUv();
    if (uvPath) {
        progress.report({ message: `Found UV at ${uvPath}` });
        return uvPath;
    }

    // Install UV via curl
    progress.report({ message: 'Installing UV (fast Python package manager)...' });
    try {
        await execAsync('curl -LsSf https://astral.sh/uv/install.sh | sh', {
            timeout: 120_000,  // 2 min timeout
        });
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to install UV: ${e.message}`);
        return null;
    }

    // Find it now (it won't be in PATH of this process)
    uvPath = await findUv();
    if (!uvPath) {
        vscode.window.showErrorMessage(
            'UV was installed but could not be found. Try restarting VS Code.'
        );
    }
    return uvPath;
}
```

**Key subtlety**: After installing UV, the current Node.js process's `PATH` is NOT updated. The CLI handles this with `find_uv_path()` checking hardcoded locations — we do the same in TypeScript.

#### Step 2: Create venv with Python 3.14

```typescript
async function createVenv(uvPath: string, venvPath: string): Promise<boolean> {
    // Create parent dirs
    fs.mkdirSync(path.dirname(venvPath), { recursive: true });

    try {
        // UV will auto-download Python 3.14 if not present
        await execAsync(`"${uvPath}" venv --python 3.14 "${venvPath}"`, {
            timeout: 300_000,  // 5 min (Python download can be slow)
        });
        return true;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to create Python environment: ${e.stderr || e.message}`);
        return false;
    }
}
```

**Why UV is critical**: Without UV, we'd need to separately install Python (homebrew? pyenv? system package manager?) and then create a venv. UV handles both: `uv venv --python 3.14` downloads the exact Python version if needed and creates the venv in one command.

#### Step 3: Download wheel

```typescript
async function downloadWheel(): Promise<string | null> {
    const info = getWheelInfo();
    if (!info) {
        vscode.window.showErrorMessage(
            `No Zef wheel available for ${process.platform}/${process.arch}`
        );
        return null;
    }

    const wheelPath = path.join(os.tmpdir(), info.filename);

    try {
        await execAsync(`curl -L -o "${wheelPath}" "${info.url}"`, {
            timeout: 300_000,  // 5 min
        });
        return wheelPath;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to download Zef: ${e.message}`);
        return null;
    }
}
```

**Alternative to curl**: We could use Node.js `https` module or `fetch` (available in Node 18+) to download directly, avoiding the `curl` dependency. However, `curl` is available on macOS and all modern Linux, and the CLI uses it too. Keeping `curl` ensures parity with the CLI installer and avoids dealing with HTTP redirects and Google Drive's download confirmation page in Node.js.

#### Step 4: Install wheel into venv

```typescript
async function installWheel(
    uvPath: string,
    venvPath: string,
    wheelPath: string
): Promise<boolean> {
    const pythonPath = path.join(venvPath, 'bin', 'python');

    try {
        await execAsync(
            `"${uvPath}" pip install --python "${pythonPath}" "${wheelPath}"`,
            { timeout: 120_000 }
        );
        // Clean up wheel
        try { fs.unlinkSync(wheelPath); } catch {}
        return true;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to install Zef: ${e.stderr || e.message}`);
        return false;
    }
}
```

#### Step 5: Write the daemon script

```typescript
// The tokolosh.py script content — embed it as a string constant
// Same approach as the CLI's include_str!(), but in TypeScript
const TOKOLOSH_SCRIPT = `
# ... (full contents of tokolosh.py)
`;

function writeDaemonScript(): boolean {
    const supportDir = getSupportDir();
    const daemonPath = path.join(supportDir, 'tokolosh_daemon.py');

    try {
        fs.mkdirSync(supportDir, { recursive: true });
        fs.writeFileSync(daemonPath, TOKOLOSH_SCRIPT);
        return true;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to write daemon script: ${e.message}`);
        return false;
    }
}
```

#### Step 6 & 7: Create and start system service

```typescript
async function createService(venvPath: string): Promise<boolean> {
    const supportDir = getSupportDir();

    if (process.platform === 'darwin') {
        return createLaunchdPlist(venvPath, supportDir);
    } else if (process.platform === 'linux') {
        return createSystemdService(venvPath, supportDir);
    }
    return false;
}

async function createLaunchdPlist(
    venvPath: string,
    supportDir: string
): Promise<boolean> {
    const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
    const plistPath = path.join(plistDir, 'com.zef.tokolosh.plist');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const daemonPath = path.join(supportDir, 'tokolosh_daemon.py');

    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
    <key>Label</key><string>com.zef.tokolosh</string>
    <key>ProgramArguments</key>
    <array>
        <string>${pythonPath}</string>
        <string>${daemonPath}</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>WorkingDirectory</key><string>${supportDir}</string>
</dict>
</plist>`;

    try {
        fs.mkdirSync(plistDir, { recursive: true });
        fs.writeFileSync(plistPath, plist);
        return true;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to create service: ${e.message}`);
        return false;
    }
}

async function startService(): Promise<boolean> {
    try {
        if (process.platform === 'darwin') {
            const plist = path.join(
                os.homedir(), 'Library', 'LaunchAgents', 'com.zef.tokolosh.plist'
            );
            // Unload first (ignore errors)
            try { await execAsync(`launchctl unload -w "${plist}"`); } catch {}
            await execAsync(`launchctl load -w "${plist}"`);
        } else {
            await execAsync('systemctl --user daemon-reload');
            await execAsync('systemctl --user enable tokolosh');
            await execAsync('systemctl --user start tokolosh');
        }
        return true;
    } catch (e: any) {
        vscode.window.showErrorMessage(`Failed to start daemon: ${e.message}`);
        return false;
    }
}
```

---

## When to Trigger Installation

### Option A: On Extension Activation (Recommended)

Check during `activate()` if the venv exists and is valid. If not, prompt the user:

```typescript
export async function activate(context: vscode.ExtensionContext) {
    // ... existing activation code ...

    // Check if Zef environment is set up
    const venvPath = getDefaultVenvPath();
    const pythonPath = path.join(venvPath, 'bin', 'python');

    if (!fs.existsSync(pythonPath)) {
        const choice = await vscode.window.showInformationMessage(
            'Zef needs to set up a Python environment. This is a one-time setup.',
            'Set Up Now',
            'Later'
        );

        if (choice === 'Set Up Now') {
            const success = await installZefEnvironment();
            if (success) {
                vscode.window.showInformationMessage('Zef environment ready!');
            }
        }
    }
}
```

### Option B: On First Code Execution (Lazy)

Defer installation until the user actually tries to run a Python code block. This avoids surprising the user on install but adds latency on first use.

### Recommendation

**Option A with a non-blocking prompt**. The user installs the extension because they want to use it. A gentle "Set Up Now / Later" notification is non-intrusive and gets them running quickly.

---

## Critical Edge Cases & Mitigations

### 1. PATH Not Updated After UV Install

**Problem**: UV is installed to `~/.local/bin/uv`, but the Node.js process inherits the PATH from when VS Code launched.

**Solution**: `findUv()` checks hardcoded known locations, identical to the CLI's `find_uv_path()`.

### 2. Python Download Can Be Slow

**Problem**: `uv venv --python 3.14` may download a ~50MB Python distribution.

**Solution**: Set generous timeouts (5 minutes), show progress, and make it cancellable.

### 3. Google Drive Download Failures

**Problem**: Google Drive links can fail due to rate limiting, require cookies, or virus scan warnings.

**Solution**: The `confirm=t` parameter bypasses the warning page. For robustness, consider hosting wheels on a more reliable CDN in the future, or using `uv pip install` directly from a PyPI-hosted package.

### 4. macOS Gatekeeper / Quarantine

**Problem**: Downloaded binaries (UV, Python) may be quarantined by macOS.

**Solution**: UV's official installer handles this. The Python downloaded by UV is also not quarantined since UV manages it.

### 5. Permissions

**Problem**: Creating files in `~/Library/LaunchAgents/` or `~/.config/systemd/user/` should work for normal users, but some locked-down systems may prevent it.

**Solution**: Catch and surface errors clearly. The extension should still function for code execution even without the daemon — the daemon is for the Tokolosh connection, not for running code blocks.

### 6. Existing Installation From CLI

**Problem**: User may already have the Zef environment set up via the CLI.

**Solution**: Check `getDefaultVenvPath()` first. If the venv exists and has a valid Python binary, skip installation entirely. Both CLI and extension use the same venv path by convention.

---

## Integration With Existing Extension Code

The existing extension already has relevant infrastructure:

| Existing File | Relevant Code | How It Connects |
|---|---|---|
| `pythonDetector.ts` | `detectPythons()` — scans PATH, venvs, pyenv, conda | Add the Zef default venv to the scan list |
| `configManager.ts` | `getPythonPath()` — resolves configured Python | Fall back to the Zef venv Python if no other is configured |
| `settingsViewProvider.ts` | Sidebar webview with Status/Settings tabs | Add an "Environment" section showing install status |
| `wsService.ts` | WebSocket connection to Zef Cloud | After daemon is installed, can auto-connect to local Tokolosh |

### Wiring It In

In `configManager.ts`, the `getPythonPath()` function should check the Zef venv as a final fallback:

```typescript
export function getPythonPath(): string | null {
    // ... existing checks (notebookVenv, defaultPython, detectPythons) ...

    // Final fallback: Zef's own Python
    const zefPython = path.join(getDefaultVenvPath(), 'bin', 'python');
    if (fs.existsSync(zefPython)) {
        return zefPython;
    }

    return null;
}
```

In `pythonDetector.ts`, add the Zef venv to the detection list:

```typescript
// 6. Check for Zef's managed environment
const zefVenvPython = path.join(getDefaultVenvPath(), 'bin', 'python');
if (fs.existsSync(zefVenvPython)) {
    const info = validatePython(zefVenvPython, 'zef (managed)', 'Zef Environment', seenPaths);
    if (info) pythons.push(info);
}
```

---

## Comparison: Three Alternative Approaches

### Approach 1: Shell Commands via `child_process` (Recommended ✓)

**What**: Extension runs `curl`, `uv`, `launchctl` etc. via `exec/spawn`.

**Pros**: Exact parity with CLI installer. Simple. Battle-tested commands. No native Node.js dependencies.

**Cons**: Depends on `curl` being available. Shell command parsing can be fragile with paths containing spaces.

### Approach 2: Node.js Native HTTP + fs

**What**: Use `https.get` / `fetch` for downloads, `fs` for file ops, skip curl entirely.

**Pros**: No external tool dependencies (except UV itself). Pure Node.js.

**Cons**: Google Drive redirects are complex to handle in Node.js. Must handle streaming to disk. More code to write and maintain. Still needs UV for venv creation.

### Approach 3: Bundle UV Binary in the Extension

**What**: Include UV as a pre-compiled binary inside the extension's `resources/` directory for each platform.

**Pros**: Zero external dependencies. Works offline (for the UV part). No install step for UV.

**Cons**: Bloats extension size significantly (~30MB per platform). Must update the extension to update UV. VSIX size limits may be a concern. Still needs network for Python download and wheel download.

### Verdict

**Approach 1** is the right choice. It's the simplest, mirrors the proven CLI flow, and UV's curl-based installer is officially supported and well-tested. The code is minimal — most of the work is calling the same commands the CLI already validates.

---

## Summary: What the Extension Does on First Launch

```
User installs "Zef" from VS Code Marketplace
            │
            ▼
    activate() runs
            │
            ▼
    Check: does ~/Library/Application Support/Zef/tokolosh_venv/bin/python exist?
            │
    ┌───────┴────────┐
    │ YES            │ NO
    │                │
    │ Skip install   ▼
    │             Show notification: "Set Up Now / Later"
    │                │
    │                ▼ (on "Set Up Now")
    │             withProgress notification:
    │               1. Find or install UV
    │               2. uv venv --python 3.14 <path>
    │               3. curl wheel from Google Drive
    │               4. uv pip install wheel
    │               5. Write tokolosh_daemon.py
    │               6. Create launchd/systemd service
    │               7. Start service
    │                │
    │                ▼
    │             "Zef environment ready!"
    │                │
    └────────────────┘
            │
            ▼
    Extension fully operational
    (Python code blocks, Tokolosh connection, etc.)
```
