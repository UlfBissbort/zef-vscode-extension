# Cross-Platform Zef VSCode Extension Installer

How to cleanly separate installation logic per platform — and how to install the Zef wheel inside WSL from a Windows-hosted VSCode extension.

---

## Platform Separation Architecture

The installer should have **one entry point** and **three distinct platform backends**, each in its own module. No platform-specific code in the orchestrator.

```
src/
└── installer/
    ├── index.ts          # Orchestrator: detect platform → delegate
    ├── types.ts          # Shared types (StepResult, InstallerConfig)
    ├── macos.ts          # macOS: curl + uv + launchd
    ├── linux.ts          # Linux: curl + uv + systemd
    └── windows.ts        # Windows: wsl.exe wrapper → runs linux.ts steps inside WSL
```

### The Orchestrator (`index.ts`)

```typescript
import * as macos from './macos';
import * as linux from './linux';
import * as windows from './windows';

function getPlatformInstaller(): PlatformInstaller {
    switch (process.platform) {
        case 'darwin':  return macos;
        case 'linux':   return linux;
        case 'win32':   return windows;
        default: throw new Error(`Unsupported: ${process.platform}`);
    }
}
```

Each platform module exports the same interface:

```typescript
interface PlatformInstaller {
    checkPrerequisites(): Promise<PrereqResult>;
    installUv(): Promise<StepResult>;
    createVenv(venvPath: string): Promise<StepResult>;
    downloadWheel(): Promise<StepResult>;
    installWheel(venvPath: string): Promise<StepResult>;
    writeDaemon(supportDir: string): Promise<StepResult>;
    createService(venvPath: string, supportDir: string): Promise<StepResult>;
    startService(): Promise<StepResult>;
}
```

### Why Full Separation?

Each platform has genuinely different concerns:

| Step | macOS | Linux | Windows (WSL) |
|------|-------|-------|---------------|
| Install UV | `curl \| sh` | `curl \| sh` | `wsl -- sh -c 'curl \| sh'` |
| Create venv | `uv venv` | `uv venv` | `wsl -- uv venv` |
| Download wheel | macOS ARM wheel | Linux x86_64 wheel | **Linux** x86_64 wheel (runs in WSL!) |
| Service | launchd plist | systemd unit | systemd unit **inside WSL** |
| Paths | `~/Library/Application Support/Zef/` | `~/.local/share/zef/` | `/home/<user>/.local/share/zef/` (WSL filesystem) |

Mixing these with `if/else` in a single file creates unreadable spaghetti. Separate files keep each platform's logic self-contained and testable.

---

## Windows + WSL: The Full Story

### Why WSL?

Zef is a Python library with a Rust core compiled for **Unix** (macOS ARM, Linux x86_64). There is no Windows-native wheel. Running Zef on Windows requires running inside WSL, where the Linux wheel works natively.

This is actually a clean architectural fit:
- WSL provides a real Linux environment
- The Tokolosh daemon runs as a Linux process inside WSL
- VS Code already has world-class WSL integration
- From the user's perspective, it just works

### Step 0: Detecting WSL Availability

Before anything else, the Windows installer must verify WSL is installed and functional.

```typescript
// windows.ts
async function checkWslAvailable(): Promise<{ available: boolean; distros: string[] }> {
    try {
        const { stdout } = await execAsync('wsl --list --quiet', {
            encoding: 'utf-8',
            timeout: 10_000,
        });
        // wsl --list outputs distro names, one per line
        // On systems with no WSL, this command fails entirely
        const distros = stdout
            .replace(/\0/g, '')  // WSL outputs UTF-16, may have null bytes
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return { available: distros.length > 0, distros };
    } catch {
        return { available: false, distros: [] };
    }
}
```

**Key gotcha**: `wsl --list` outputs UTF-16LE on some Windows versions. The null bytes between ASCII characters need to be stripped.

If WSL is not installed, the extension should:
1. Show an error: *"Zef requires Windows Subsystem for Linux (WSL). Please install it first."*
2. Offer a button to open `https://learn.microsoft.com/en-us/windows/wsl/install`
3. Alternatively, offer to run `wsl --install` (requires admin/elevation — tricky from a VS Code extension)

### Step 1: Running Commands Inside WSL

Every shell command in the Linux installer becomes a `wsl` command on Windows:

```typescript
// Linux runs:     curl -LsSf https://astral.sh/uv/install.sh | sh
// Windows runs:   wsl -- sh -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
```

The wrapper pattern:

```typescript
async function wslExec(command: string, timeout = 60_000): Promise<ExecResult> {
    // -d specifies which distro (default if omitted)
    // -- separates wsl args from the command
    // sh -c wraps the command so pipes and redirects work
    return execAsync(`wsl -- sh -c '${command.replace(/'/g, "'\\''")}'`, {
        timeout,
        encoding: 'utf-8',
    });
}
```

### Step 2: UV Inside WSL

UV installs to `~/.local/bin/uv` inside the WSL filesystem — a completely separate home directory from Windows.

```typescript
// Check if UV exists inside WSL
async function findUvInWsl(): Promise<string | null> {
    try {
        const { stdout } = await wslExec('which uv || echo ""');
        const p = stdout.trim();
        return p || null;
    } catch {
        return null;
    }
}

// Install UV inside WSL
async function installUvInWsl(): Promise<boolean> {
    const result = await wslExec(
        'curl -LsSf https://astral.sh/uv/install.sh | sh',
        120_000
    );
    return result.exitCode === 0;
}
```

### Step 3: Venv + Wheel Inside WSL

The venv lives inside the WSL filesystem. The Linux x86_64 wheel is downloaded and installed inside WSL:

```typescript
async function createVenvInWsl(wslVenvPath: string): Promise<boolean> {
    // Path is a Linux path inside WSL, e.g. /home/user/.local/share/zef/tokolosh_venv
    await wslExec(`mkdir -p "$(dirname ${wslVenvPath})"`);
    const result = await wslExec(
        `~/.local/bin/uv venv --python 3.14 "${wslVenvPath}"`,
        300_000
    );
    return result.exitCode === 0;
}

async function downloadAndInstallWheelInWsl(wslVenvPath: string): Promise<boolean> {
    const url = LINUX_X86_64_WHEEL_URL;  // Always Linux wheel for WSL
    const filename = LINUX_X86_64_WHEEL_FILENAME;

    // Download inside WSL
    await wslExec(`curl -L -o "/tmp/${filename}" "${url}"`, 300_000);

    // Install inside WSL
    const result = await wslExec(
        `~/.local/bin/uv pip install --python "${wslVenvPath}/bin/python" "/tmp/${filename}"`,
        120_000
    );

    // Cleanup
    await wslExec(`rm -f "/tmp/${filename}"`);
    return result.exitCode === 0;
}
```

### Step 4: Daemon Service Inside WSL

The Tokolosh daemon runs as a systemd service inside WSL. Modern WSL2 supports systemd natively (since September 2022, WSL 0.67.6+).

```typescript
async function checkSystemdInWsl(): Promise<boolean> {
    try {
        const { stdout } = await wslExec('ps -p 1 -o comm=');
        return stdout.trim() === 'systemd';
    } catch {
        return false;
    }
}
```

If systemd is available → create a systemd user service (same as the Linux installer).

If systemd is NOT available → the daemon must be started via a simple `wsl -- <venv>/bin/python <daemon.py> &` background process. Less robust (no auto-restart), but functional.

To enable systemd in WSL, the user needs `/etc/wsl.conf`:
```ini
[boot]
systemd=true
```
Then `wsl --shutdown` and restart. The extension can check and guide the user.

### Step 5: WebSocket Connectivity

The Tokolosh listens on `localhost:27022` inside WSL. Due to WSL2's networking:
- **WSL2**: `localhost` forwarding from Windows to WSL works automatically for listening ports (since Windows 10 build 18945). So the VS Code extension on Windows can connect to `ws://localhost:27022` and reach the Tokolosh inside WSL.
- **WSL1**: Shares the same network namespace as Windows. `localhost` just works.

No special networking configuration needed.

### Writing the Daemon Script Into WSL

The `tokolosh.py` script must be written to the WSL filesystem. From Windows:

```typescript
async function writeDaemonToWsl(wslSupportDir: string, scriptContent: string): Promise<boolean> {
    // Use wsl to write the file — avoids Windows↔WSL path translation issues
    // Pipe the content through stdin
    const escaped = scriptContent.replace(/'/g, "'\\''");
    const result = await wslExec(
        `mkdir -p "${wslSupportDir}" && cat > "${wslSupportDir}/tokolosh_daemon.py" << 'ZEFEOF'\n${scriptContent}\nZEFEOF`
    );
    return result.exitCode === 0;
}
```

**Why not write to the Windows filesystem and access from WSL?** Accessing Windows files from WSL via `/mnt/c/...` is slow (9p filesystem). The daemon script should live in the native WSL ext4 filesystem for performance.

---

## Windows Path Translation Cheat Sheet

| Concept | Windows Path | WSL Path |
|---------|-------------|----------|
| User home | `C:\Users\Alice` | `/home/alice` |
| Support dir | N/A (lives in WSL) | `~/.local/share/zef/` |
| Venv | N/A (lives in WSL) | `~/.local/share/zef/tokolosh_venv` |
| Access Windows from WSL | `C:\Users\Alice\file.txt` | `/mnt/c/Users/Alice/file.txt` |

The extension should **never** use Windows paths for WSL operations. All paths passed to `wslExec()` are Linux paths.

---

## User Experience Flow on Windows

```
Extension activates on Windows
        │
        ▼
Check: is WSL available? (wsl --list)
        │
  ┌─────┴──────┐
  │ NO          │ YES
  │             │
  ▼             ▼
Show error:   Check: does venv exist in WSL?
"Install WSL"   (wsl -- test -f ~/.local/share/zef/tokolosh_venv/bin/python)
  │             │
  │       ┌─────┴──────┐
  │       │ YES        │ NO
  │       │            │
  │       ▼            ▼
  │     Skip         Prompt: "Set Up Zef in WSL?"
  │     install        │
  │       │            ▼
  │       │     withProgress:
  │       │       1. Install UV in WSL
  │       │       2. Create venv in WSL
  │       │       3. Download Linux wheel in WSL
  │       │       4. Install wheel in WSL
  │       │       5. Write daemon script in WSL
  │       │       6. Create systemd service in WSL (if available)
  │       │       7. Start daemon in WSL
  │       │            │
  │       └─────┬──────┘
  │             │
  │             ▼
  │     Connect to ws://localhost:27022
  │     (forwarded from WSL automatically)
  │             │
  │             ▼
  │     Extension operational
```

---

## Summary of Key Principles

1. **One interface, three implementations.** The orchestrator doesn't know about `launchctl` or `wsl.exe`. Each platform module encapsulates its own complexity.

2. **WSL is treated as a Linux environment.** The Windows installer delegates everything to the Linux installer, but runs each command through `wsl --`. Download the Linux wheel, not a Windows wheel.

3. **All WSL paths are Linux paths.** Never convert to `C:\...` format. Let WSL handle its own filesystem.

4. **Prerequisites are checked first.** On Windows: WSL must exist and have at least one distro. On all platforms: UV is installed or installable.

5. **Networking just works.** WSL2 `localhost` forwarding means the Tokolosh inside WSL is reachable from the Windows-side extension at `ws://localhost:27022`.

6. **systemd is preferred but optional.** If WSL doesn't have systemd enabled, fall back to a background process. Guide the user to enable systemd for reliability.
