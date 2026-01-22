# Auto-Installation Feature

## Implementation Date: January 2026

## Feature Overview

Added automatic runtime installation for non-technical users on macOS and Linux.

## User Experience

When a runtime is missing, users now see:

**On macOS/Linux:**
- **"Install Now"** - Runs installation command in terminal automatically
- **"Manual Install"** - Opens installation webpage
- **"Configure Path"** - Opens settings
- **"View Docs"** - Opens documentation

**On Windows:**
- **"Install It"** - Opens installation webpage
- **"Configure Path"** - Opens settings  
- **"View Docs"** - Opens documentation

## Installation Commands

| Runtime | macOS | Linux | Windows |
|---------|-------|-------|---------|
| Python | `brew install python3` | `sudo apt install -y python3` | `winget install Python.Python.3.12` |
| Rust | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh -s -- -y` | Same as macOS | `winget install Rustlang.Rustup` |
| Bun | `curl -fsSL https://bun.sh/install \| bash` | Same as macOS | `powershell -c "irm bun.sh/install.ps1 \| iex"` |

## Implementation Details

### New Function: `installRuntime()`

Location: `src/extension.ts`

```typescript
async function installRuntime(runtime: 'python' | 'rust' | 'bun'): Promise<void> {
    // Creates terminal and runs platform-appropriate install command
    // Shows progress notification
    // Prompts to reload VS Code after installation
}
```

### Updated Function: `handleMissingRuntime()`

- Detects platform (`process.platform`)
- Shows "Install Now" only on macOS/Linux
- Falls back to manual install on Windows

## Platform Support Status

| Platform | Auto-Install | Manual Install | Tested |
|----------|--------------|----------------|--------|
| macOS | ✅ Yes | ✅ Yes | ✅ |
| Linux | ✅ Yes | ✅ Yes | ⏳ TODO |
| Windows | ❌ No | ✅ Yes | ⏳ TODO |

### Windows Notes

Windows auto-install is technically possible via `winget`, but:
- Requires admin privileges in some cases
- More complex terminal handling (PowerShell vs cmd)
- Future enhancement: Add Windows support with proper UAC handling

### Linux Notes

- Uses `apt` by default, falls back to `dnf`
- May require `sudo` password
- Works in most common distros (Ubuntu, Debian, Fedora)

## Files Changed

| File | Changes |
|------|---------|
| `src/extension.ts` | Added `installRuntime()` function, updated `handleMissingRuntime()` |
| `docs/RUNTIME_REQUIREMENTS.md` | Added Quick Start section about auto-install |

## Testing Checklist

- [x] macOS: Bun installation
- [x] macOS: Rust installation  
- [x] macOS: Python installation
- [ ] Linux: All runtimes (TODO)
- [ ] Windows: Manual install fallback (TODO)
