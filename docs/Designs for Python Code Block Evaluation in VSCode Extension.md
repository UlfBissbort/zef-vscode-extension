# Designs for Python Code Block Evaluation in VSCode Extension

This document presents three design approaches for implementing Python code block evaluation in the Zef VSCode extension, inspired by the zef-radar-desktop implementation.

## Background: How zef-radar-desktop Works

The zef-radar-desktop uses a **Rust + Python subprocess** architecture:

1. **Python Detection** (`python.rs`): Scans PATH, pyenv, conda, virtualenvs, poetry for Python installations
2. **Configuration** (`config.rs`): Persists `default_python` and `notebook_venv` to a JSON config file
3. **Kernel Management** (`kernel.rs`): Spawns Python as a child process, manages lifecycle
4. **Python Kernel** (`zef_kernel.py`): Runs a read-eval-print loop, receives JSON via stdin, returns JSON via stdout
5. **Communication Protocol**: `{"code": "...", "cell_id": "..."}` → `{"status": "ok|error", "result": "...", "stdout": "...", "stderr": "...", "error": {...}}`

Key insight: The Python process is **persistent** (REPL-like), maintaining namespace between cell executions.

---

## Design 1: Pure TypeScript + Child Process

### Overview
Call Python directly from TypeScript using Node.js `child_process`, without any Rust component.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│ VSCode Extension (TypeScript)                           │
│  ├── extension.ts (activation, commands)                │
│  ├── pythonDetector.ts (find Python installations)      │
│  ├── kernelManager.ts (spawn/manage Python process)     │
│  └── configManager.ts (persist settings)                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ spawn, stdin/stdout JSON
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Python Kernel (zef_kernel.py)                           │
│  - Persistent namespace                                 │
│  - JSON protocol over stdio                             │
│  - Same as zef-radar-desktop                            │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Python Detection** (`src/pythonDetector.ts`)
   - Use `which -a python3` to find system Pythons
   - Scan `~/.pyenv/versions/*/bin/python`
   - Scan conda: `~/anaconda3/envs/*/bin/python`, `~/miniconda3/envs/*/bin/python`
   - Scan virtualenvs: `~/.virtualenvs/*/bin/python`, `./venv/bin/python`
   - Validate each with `python --version`
   - Return array of `{path, version, source, displayName}`

2. **Configuration** (`src/configManager.ts`)
   - Use VSCode's `workspace.getConfiguration('zef')` for settings
   - Store `zef.defaultPython` and `zef.notebookVenv` 
   - Provide commands to set/get Python path
   - Settings UI in VSCode's settings panel

3. **Kernel Manager** (`src/kernelManager.ts`)
   - Spawn Python process: `child_process.spawn(pythonPath, ['-u', kernelScriptPath])`
   - Use `-u` for unbuffered output
   - Read stdout line-by-line for JSON responses
   - Write JSON commands to stdin
   - Handle process lifecycle (start, restart, shutdown)
   - Check if process is alive before executing

4. **Kernel Script** (`kernel/zef_kernel.py`)
   - Copy directly from zef-radar-desktop (it's portable)
   - Bundle with extension

5. **Commands**
   - `zef.selectPython`: Show quickpick of detected Pythons
   - `zef.runBlock`: Execute code block, show output in preview
   - `zef.restartKernel`: Kill and restart Python process
   - `zef.shutdownKernel`: Gracefully stop Python

6. **UI Integration**
   - Update webview to show real output (not hardcoded)
   - Show execution status (running spinner, success, error)
   - Pass messages from kernelManager to webview

### Review Iteration 1

**Can this be simplified?**
- Yes: We could skip detection and just let user pick a path. But auto-detection is user-friendly.
- No: The kernel protocol is already minimal (JSON over stdio).

**Will it work?**
- Yes: Node.js child_process is well-supported, same pattern used by many extensions (Python, Jupyter).
- Potential issue: Windows paths (but we're macOS focused for now).

**Does it solve the problem?**
- Yes: Users can select venv, execute code blocks, see output.

**What could go wrong?**
- **Process zombie**: If extension crashes, Python process might orphan. → Mitigation: Cleanup in `deactivate()` and `onDidDispose`.
- **Buffering issues**: Python output might buffer. → Mitigation: Use `-u` flag and `flush=True`.
- **Path with spaces**: Python path might have spaces. → Mitigation: Quote paths properly.
- **Kernel script location**: How to find the bundled script? → Use `context.extensionPath + '/kernel/zef_kernel.py'`.

### Review Iteration 2

**Refinement:**
- Add timeout for kernel responses (cell execution shouldn't hang forever)
- Add execution queue (don't send new code while previous is running)
- Add cancellation support (kill current execution)

**Is criticism valid?**
- Yes, all points are valid. Added mitigations.

### Final Design 1 Summary

**Pros:**
- Simple, pure TypeScript
- No native compilation needed
- Easy to debug and maintain
- Same kernel script as zef-radar

**Cons:**
- Slightly slower startup (spawn overhead each time)
- Must bundle Python kernel script
- No Rust performance benefits (though not needed for this use case)

---

## Design 2: Rust Native Module via NAPI-RS

### Overview
Compile Python execution logic in Rust, expose to Node.js via NAPI-RS bindings.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│ VSCode Extension (TypeScript)                           │
│  ├── extension.ts                                       │
│  └── calls native module                                │
└─────────────────────────────────────────────────────────┘
                          │
                          │ NAPI-RS bindings
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Rust Native Module (*.node)                             │
│  ├── python.rs (detection - reuse from radar)          │
│  ├── kernel.rs (process management - reuse from radar) │
│  └── lib.rs (NAPI-RS exports)                          │
└─────────────────────────────────────────────────────────┘
                          │
                          │ spawn, stdin/stdout
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Python Kernel (zef_kernel.py)                           │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Create Rust project** with NAPI-RS
   ```bash
   npx @napi-rs/cli new
   ```

2. **Port Rust code from zef-radar-desktop**
   - Copy `python.rs`, `kernel.rs`, `config.rs`
   - Adapt for NAPI-RS exports

3. **Expose functions to Node.js**
   ```rust
   #[napi]
   fn detect_pythons() -> Vec<PythonInfo> { ... }
   
   #[napi]
   fn execute_cell(code: String, cell_id: String, python_path: String) -> CellResult { ... }
   ```

4. **Build for multiple platforms**
   - macOS: aarch64, x86_64
   - Linux: x86_64
   - Windows: x86_64

5. **Use from TypeScript**
   ```typescript
   import { detectPythons, executeCell } from './native';
   ```

### Review Iteration 1

**Can this be simplified?**
- The NAPI-RS layer adds complexity but enables code reuse from zef-radar.
- Could simplify by only exposing essential functions.

**Will it work?**
- Yes, NAPI-RS is mature and used in production.
- VSCode extensions can include native modules.

**Does it solve the problem?**
- Yes, same functionality as Design 1.

**What could go wrong?**
- **Platform binaries**: Must distribute prebuilt binaries for each platform.
- **Build complexity**: CI/CD must build for all platforms.
- **Node.js version mismatch**: Native modules tied to Node.js ABI version.
- **Extension size**: Binary adds ~2-5MB to extension.
- **VSCode restrictions**: Marketplace might flag native code.

### Review Iteration 2

**Is this worth the complexity?**
- For simple Python execution: **No**. The overhead doesn't justify the benefits.
- If we needed: heavy computation, direct FFI, or wanted to share code with zef-radar: **Maybe**.

**Recommendation:** This design is overkill for the current use case.

### Final Design 2 Summary

**Pros:**
- Code reuse with zef-radar-desktop
- Rust performance (not really needed here)
- Type-safe bindings

**Cons:**
- Complex build system
- Platform-specific binaries
- Extension size increase
- Harder to debug
- Overkill for subprocess management

---

## Design 3: Language Server Protocol (LSP) Approach

### Overview
Implement a Python "kernel server" that runs as a separate process and communicates via a simple protocol (similar to LSP but custom).

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│ VSCode Extension (TypeScript)                           │
│  └── KernelClient (connects to server)                  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ TCP/IPC socket, JSON-RPC
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Zef Kernel Server (Python)                              │
│  ├── server.py (socket listener, request router)       │
│  ├── kernel.py (actual execution, namespace)           │
│  └── Can run independently or be spawned by extension  │
└─────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Python Kernel Server** (`kernel_server.py`)
   - Start TCP server on random available port
   - Write port to stdout so extension can connect
   - Handle JSON-RPC style requests
   - Multiple concurrent connections (for future multi-document support)

2. **TypeScript Client** (`src/kernelClient.ts`)
   - Spawn server process
   - Read port from stdout
   - Connect via TCP socket
   - Send/receive JSON-RPC messages

3. **Protocol**
   ```json
   // Request
   {"jsonrpc": "2.0", "id": 1, "method": "execute", "params": {"code": "...", "cell_id": "..."}}
   
   // Response
   {"jsonrpc": "2.0", "id": 1, "result": {"status": "ok", "output": "...", ...}}
   ```

4. **Lifecycle**
   - Extension spawns server on activation
   - Server runs until extension deactivates
   - Multiple documents can share one server

### Review Iteration 1

**Can this be simplified?**
- TCP/JSON-RPC is more complex than simple stdio
- For single-document use, stdio is simpler
- But TCP enables: multiple connections, remote execution, debugging tools

**Will it work?**
- Yes, this is how Jupyter works
- But it's overengineered for our needs

**Does it solve the problem?**
- Yes, but with unnecessary complexity

**What could go wrong?**
- **Port conflicts**: Random port might be blocked. → Use dynamic port selection.
- **Firewall issues**: Some systems block local TCP. → Could use IPC instead.
- **Reconnection**: If server crashes, need reconnection logic.
- **Overhead**: TCP has more overhead than stdio.

### Review Iteration 2

**Is this worth the complexity?**
- For current needs: **No**
- For future needs (multi-document, remote kernels, kernel sharing): **Maybe**

**Recommendation:** This design is for future extensibility. Start with Design 1, migrate to Design 3 if needed.

### Final Design 3 Summary

**Pros:**
- Clean separation of concerns
- Future-proof for remote execution
- Multiple document support
- Follows established patterns (Jupyter, LSP)

**Cons:**
- More complex than needed now
- Socket handling adds code
- Slightly higher latency
- More failure modes

---

## Recommendation

### Start with Design 1 (Pure TypeScript + Child Process)

**Rationale:**
1. **Simplest implementation** - Get something working quickly
2. **No build complexity** - Pure TypeScript + bundled Python script
3. **Same kernel script** - Can copy from zef-radar-desktop
4. **Easy to debug** - Standard Node.js patterns
5. **Low risk** - Well-established approach used by Python/Jupyter extensions

**Future path:**
- If we need Rust code sharing → Consider Design 2
- If we need multi-document/remote kernels → Migrate to Design 3
- Current needs are fully met by Design 1

---

## Implementation Checklist for Design 1

### Phase 1: Python Detection & Configuration
- [ ] Create `src/pythonDetector.ts` - scan for Python installations
- [ ] Create `src/configManager.ts` - manage settings
- [ ] Add `zef.defaultPython` and `zef.notebookVenv` to `package.json` settings
- [ ] Implement `zef.selectPython` command with QuickPick UI
- [ ] Show detected Pythons with version and source

### Phase 2: Kernel Management
- [ ] Copy `zef_kernel.py` to `kernel/` directory
- [ ] Create `src/kernelManager.ts` - spawn/manage Python process
- [ ] Implement execute, restart, shutdown methods
- [ ] Handle process lifecycle and cleanup
- [ ] Add execution timeout and cancellation

### Phase 3: UI Integration
- [ ] Update CodeLens "Run" to actually execute code
- [ ] Send real output to webview preview
- [ ] Show execution state (running, success, error)
- [ ] Display stdout, result, and errors in Output tab
- [ ] Display side effects in Side Effects tab (if tracked)

### Phase 4: Polish
- [ ] Add status bar item showing current Python
- [ ] Add kernel restart button
- [ ] Handle edge cases (no Python, invalid venv, etc.)
- [ ] Add helpful error messages

---

## Appendix: Key Files from zef-radar-desktop to Reuse

1. **`zef_kernel.py`** - Copy verbatim, it's self-contained
2. **Python detection logic** - Port to TypeScript (simpler than Rust FFI)
3. **Communication protocol** - Same JSON format

The main adaptation is replacing Rust's `std::process::Command` with Node.js `child_process.spawn`.
