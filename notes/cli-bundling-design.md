# Bundling the Zef CLI in the VSCode Extension

How to build, bundle, and install the `zef` CLI tool from the VSCode extension so it's available system-wide in the user's terminal.

---

## Problem

When a user installs the Zef VSCode extension, two things should happen automatically:

1. The Tokolosh daemon gets installed and started (✅ already working via `zef-install` binary)
2. The `zef` CLI tool gets installed and is available as `zef` in any terminal session, even after reboots

The CLI needs to work on macOS, Linux, and Windows (inside WSL).

---

## Design Iteration

### Strategy v1 — Naive

> Bundle all 3 zef-cli binaries. On activation, copy the right one to `~/.local/bin/zef`.

**Criticism:**

- `~/.local/bin` may not be in PATH on all systems. macOS has no default `.local/bin` in PATH. Ubuntu adds it via `.profile` but only if the directory exists at login time.
- Modifying shell profiles (`.zshrc`, `.bashrc`) from a VSCode extension is invasive — users don't expect extensions to touch their dotfiles.
- On Windows, installing into WSL requires copying through `/mnt/c/` — added complexity.
- VSIX size grows by ~7MB (3 CLI binaries).

**Verdict:** The PATH concern is valid. The WSL concern is standard. The size is acceptable.

### Strategy v2 — Use UV's PATH setup

> UV's installer (which runs as step 1 of `zef-install install`) already adds `~/.local/bin` to shell profiles. Rely on that.

**Insight:** Since we install UV first, `~/.local/bin` is already set up in PATH for new terminal sessions. We don't need to touch dotfiles ourselves.

**Criticism:**

- What if UV was already installed via Homebrew (`/opt/homebrew/bin/uv`) and the UV installer was skipped? Then `~/.local/bin` was never added to PATH.
- On macOS with zsh, `~/.local/bin` only exists in PATH after the UV installer modifies `~/.zshenv`.

**Verdict:** Mostly valid. We should verify PATH membership after install and show an advisory if needed. But in practice, UV's installer handles this well.

### Strategy v3 — Final Design

Key simplification: **On Windows, the `zef` CLI runs inside WSL** (the user explicitly stated this). The tokolosh daemon runs inside WSL, and `zef` connects to it via `localhost:27021`. So we need the **Linux binary inside WSL**, not a Windows native binary.

This means:
- macOS ARM → install `zef-macos-arm64` to `~/.local/bin/zef`
- Linux x64 → install `zef-linux-x86_64` to `~/.local/bin/zef`
- Windows → install **both**:
  - `zef-linux-x86_64` into WSL at `~/.local/bin/zef` (for WSL terminal use)
  - `zef-windows-x86_64.exe` natively at `%LOCALAPPDATA%\Zef\zef.exe` (for PowerShell/cmd use)

Both the WSL and native Windows CLI binaries connect to the tokolosh via `ws://localhost:27021`. WSL2 automatically forwards ports to the Windows host, so the native `zef.exe` can reach the daemon running inside WSL.

We build all 3 variants (macOS, Linux, Windows) via the Makefile, and all 3 are bundled in the extension.

---

## Final Architecture

```
Extension activation
    │
    ├── checkInstallation()
    │   └── runs: zef-install check
    │       └── returns: {venv_exists: false}
    │
    ├── runInstallation()         ← existing, runs 7-step daemon install
    │   └── runs: zef-install install
    │       └── Step 1: UV install → sets up ~/.local/bin in PATH
    │       └── Steps 2-7: venv, wheel, daemon, service
    │
    └── installCli()              ← NEW
        ├── macOS/Linux:
        │   ├── mkdir -p ~/.local/bin
        │   ├── cp resources/bin/zef-{platform} ~/.local/bin/zef
        │   └── chmod 755 ~/.local/bin/zef
        │
        └── Windows (both native + WSL):
            ├── Native:
            │   ├── mkdir %LOCALAPPDATA%\Zef
            │   ├── copy resources/bin/zef-windows-x86_64.exe → %LOCALAPPDATA%\Zef\zef.exe
            │   └── Add %LOCALAPPDATA%\Zef to user PATH via setx (if not already there)
            │
            └── WSL:
                ├── Copy resources/bin/zef-linux-x86_64 to temp dir
                ├── wsl mkdir -p ~/.local/bin
                ├── wsl cp /mnt/c/.../zef ~/.local/bin/zef
                └── wsl chmod 755 ~/.local/bin/zef
```

---

## Build Pipeline

### Step 1: Add Makefile to zef-cli

```makefile
BINARY_NAME := zef
DIST_DIR    := dist

MAC_TARGET     := aarch64-apple-darwin
LINUX_TARGET   := x86_64-unknown-linux-gnu
WINDOWS_TARGET := x86_64-pc-windows-gnu

all: mac linux windows

mac:
	cargo build --release
	mkdir -p $(DIST_DIR)
	cp target/release/$(BINARY_NAME) $(DIST_DIR)/$(BINARY_NAME)-macos-arm64

linux:
	cargo zigbuild --target $(LINUX_TARGET) --release
	mkdir -p $(DIST_DIR)
	cp target/$(LINUX_TARGET)/release/$(BINARY_NAME) $(DIST_DIR)/$(BINARY_NAME)-linux-x86_64

windows:
	cargo zigbuild --target $(WINDOWS_TARGET) --release
	mkdir -p $(DIST_DIR)
	cp target/$(WINDOWS_TARGET)/release/$(BINARY_NAME).exe $(DIST_DIR)/$(BINARY_NAME)-windows-x86_64.exe
```

### Step 2: Update extension's build.py

Add the zef-cli binaries to `copy_installer_binaries()`:

```python
# In addition to installer binaries:
CLI_BINARIES = {
    "zef-macos-arm64":           "zef-macos-arm64",
    "zef-linux-x86_64":          "zef-linux-x86_64",
    "zef-windows-x86_64.exe":    "zef-windows-x86_64.exe",
}
CLI_DIST = ROOT.parent / "zef-cli" / "dist"
```

### Step 3: Extension resources

```
resources/
└── bin/
    ├── zef-install-macos-arm64          (1.0 MB)  ← installer
    ├── zef-install-linux-x86_64         (993 KB)  ← installer
    ├── zef-install-windows-x86_64.exe   (1.6 MB)  ← installer
    ├── zef-macos-arm64                  (2.1 MB)  ← CLI
    ├── zef-linux-x86_64                (2.0 MB)  ← CLI (also used in WSL on Windows)
    └── zef-windows-x86_64.exe          (3.2 MB)  ← CLI (native Windows)
```

Total binaries: **~10.9 MB** (VSIX goes from 9.8 MB to ~20 MB)

---

## TypeScript Implementation

### New function: `installCli()`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

function getCliBinaryName(): string | null {
    const platform = process.platform;
    const arch = process.arch;

    if (platform === 'darwin' && arch === 'arm64') return 'zef-macos-arm64';
    if (platform === 'linux' && arch === 'x64')   return 'zef-linux-x86_64';
    if (platform === 'win32' && arch === 'x64')    return 'zef-linux-x86_64'; // Linux binary for WSL
    return null;
}

export async function installCli(context: vscode.ExtensionContext): Promise<boolean> {
    const binaryName = getCliBinaryName();
    if (!binaryName) return false;

    const src = path.join(context.extensionPath, 'resources', 'bin', binaryName);
    if (!fs.existsSync(src)) return false;

    if (process.platform === 'win32') {
        // Install both: Linux binary into WSL + Windows native binary
        const wslOk = installCliWsl(src);
        const nativeOk = installCliWindowsNative(context);
        return wslOk || nativeOk;
    } else {
        return installCliUnix(src);
    }
}

function installCliUnix(src: string): boolean {
    const dest = path.join(os.homedir(), '.local', 'bin', 'zef');
    const destDir = path.dirname(dest);

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755);

    log(`Installed zef CLI to ${dest}`);
    return true;
}

function installCliWsl(src: string): boolean {
    // Copy binary to a Windows-accessible temp location
    const tmpDir = os.tmpdir();
    const tmpPath = path.join(tmpDir, 'zef');
    fs.copyFileSync(src, tmpPath);

    // Convert Windows path to WSL /mnt/c/... path
    const wslPath = tmpPath.replace(/^([A-Za-z]):/, (_m, drive) =>
        `/mnt/${drive.toLowerCase()}`
    ).replace(/\\/g, '/');

    execSync(`wsl mkdir -p ~/.local/bin`);
    execSync(`wsl cp "${wslPath}" ~/.local/bin/zef`);
    execSync(`wsl chmod 755 ~/.local/bin/zef`);

    // Clean up temp file
    fs.unlinkSync(tmpPath);

    log('Installed zef CLI into WSL at ~/.local/bin/zef');
    return true;
}

function installCliWindowsNative(context: vscode.ExtensionContext): boolean {
    // Install native Windows zef.exe to %LOCALAPPDATA%\Zef\
    const winBinary = path.join(context.extensionPath, 'resources', 'bin', 'zef-windows-x86_64.exe');
    if (!fs.existsSync(winBinary)) return false;

    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return false;

    const destDir = path.join(localAppData, 'Zef');
    const dest = path.join(destDir, 'zef.exe');

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(winBinary, dest);

    // Add to user PATH if not already there
    try {
        const currentPath = execSync('echo %PATH%', { shell: 'cmd.exe' }).toString().trim();
        if (!currentPath.includes(destDir)) {
            execSync(`setx PATH "%PATH%;${destDir}"`, { shell: 'cmd.exe' });
            log(`Added ${destDir} to user PATH`);
        }
    } catch {
        log('Could not add to PATH automatically');
    }

    log(`Installed zef.exe to ${dest}`);
    return true;
}
```

### Activation flow update

```typescript
checkInstallation(context).then(async (status) => {
    if (status && status.venv_exists) {
        console.log('Zef extension: Tokolosh environment detected');
        // Still check if CLI is installed
        installCli(context);
        return;
    }
    console.log('Zef extension: starting auto-setup');
    const installed = await runInstallation(context);
    if (installed) {
        installCli(context);
    }
});
```

---

## Binary Sizes

| Binary | Size | Purpose |
|--------|------|---------|
| `zef-install-macos-arm64` | 1.0 MB | Installer (macOS) |
| `zef-install-linux-x86_64` | 993 KB | Installer (Linux) |
| `zef-install-windows-x86_64.exe` | 1.6 MB | Installer (Windows → WSL) |
| `zef-macos-arm64` | 2.1 MB | CLI (macOS) |
| `zef-linux-x86_64` | 2.0 MB | CLI (Linux + Windows/WSL) |
| `zef-windows-x86_64.exe` | 3.2 MB | CLI (Windows native) |
| **Total binaries** | **~10.9 MB** | |
| Current VSIX (no CLI) | 9.8 MB | |
| **Projected VSIX** | **~20 MB** | |

---

## Platform Matrix

| User's OS | Installer binary | CLI binary | CLI install location |
|-----------|-----------------|------------|---------------------|
| macOS ARM64 | `zef-install-macos-arm64` | `zef-macos-arm64` | `~/.local/bin/zef` |
| Linux x86_64 | `zef-install-linux-x86_64` | `zef-linux-x86_64` | `~/.local/bin/zef` |
| Windows x64 | `zef-install-windows-x86_64.exe` | `zef-linux-x86_64` | WSL `~/.local/bin/zef` |
| Windows x64 | (same) | `zef-windows-x86_64.exe` | `%LOCALAPPDATA%\Zef\zef.exe` |

On Windows, **both** CLI binaries are installed:
- The Linux binary inside WSL (for WSL terminal sessions)
- The Windows binary natively (for PowerShell/cmd)
- Both connect to the same tokolosh at `ws://localhost:27021` — WSL2 port forwarding makes this transparent

---

## PATH Availability

The `~/.local/bin` directory is added to PATH by UV's installer script, which runs as step 1 of `zef-install install`. In practice:

| OS | How `~/.local/bin` gets into PATH |
|----|----------------------------------|
| macOS (zsh) | UV installer appends to `~/.zshenv` |
| Linux (bash) | UV installer appends to `~/.bashrc`; also in `~/.profile` on Debian/Ubuntu if dir exists |
| WSL (bash) | UV installer appends to `~/.bashrc` |

After installation, the user needs to **open a new terminal** (or `source ~/.zshenv` / `source ~/.bashrc`) for `zef` to be available. This is standard for any CLI installation.

> [!note]
> If the user already had UV installed via Homebrew (not via the shell installer), `~/.local/bin` may not be in PATH. In this case, the extension should show an advisory: "Add `~/.local/bin` to your PATH to use the `zef` command."

---

## What Could Go Wrong

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `~/.local/bin` not in PATH | Low (UV installer adds it) | Show advisory message if `which zef` fails |
| WSL not installed on Windows | Low (installer step 0 checks) | Installer aborts with clear error |
| Disk space | Very low (2MB) | Negligible |
| Binary permissions wrong | Very low | Explicit `chmod 755` |
| User already has `zef` from cargo | Medium | Overwrite only `~/.local/bin/zef`, leave `~/.cargo/bin/zef` untouched. `~/.local/bin` may come before or after `~/.cargo/bin` in PATH — user can manage this |
| Extension updates ship newer CLI | Medium | Always overwrite `~/.local/bin/zef` when extension installs daemon for the first time. On subsequent activations, only copy if binary is missing |

---

## Implementation Checklist

- [ ] Create Makefile in zef-cli (mirror zef-installer's pattern)
- [ ] Build all 3 zef-cli targets: `make all`
- [ ] Copy all 3 CLI binaries to `resources/bin/`
- [ ] Update `build.py` to copy CLI binaries alongside installer binaries
- [ ] Add `installCli()` function to `src/installer.ts`
- [ ] Call `installCli()` after successful daemon install in `extension.ts`
- [ ] On Windows: install both WSL (`~/.local/bin/zef`) and native (`%LOCALAPPDATA%\Zef\zef.exe`)
- [ ] On Windows: add `%LOCALAPPDATA%\Zef` to user PATH via `setx`
- [ ] Add `~/.local/bin` PATH advisory message if CLI not found after install
- [ ] Test on macOS: verify `~/.local/bin/zef` works in new terminal
- [ ] Update `.gitignore` (resources/bin/ already ignored)
- [ ] Test VSIX packaging: verify 6 binaries included, size ~20MB
