# Changelog

All notable changes to the Zef extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-01-22

### Added

- **Activity Bar Sidebar**: New Zef icon in the VS Code Activity Bar (left sidebar) with tabbed interface:
  - **Status tab**: WebSocket connection status to Zef Cloud with toggle switch
  - **Settings tab**: Runtime configuration (Python, Rust, Bun) and options

- **Zef Cloud Connection**: Connect to Zef Cloud via WebSocket (`wss://zef.app/ws-events`). Toggle on to enable persistent connection that auto-reconnects on VS Code restart.

- **New Setting**: `zef.wsConnectionEnabled` - Enable/disable WebSocket connection to Zef Cloud

## [0.1.3] - 2026-01-22

### Added

- **Treat All Markdown as Zef**: New setting `zef.treatAllMarkdownAsZef` allows power users to enable Zef features (run buttons, live preview, code execution) for all `.md` files, not just `.zef.md` files. Toggle from Settings Panel or VS Code settings.

### Fixed

- **Linux/Windows Keyboard Shortcuts**: Fixed preview keybinding (`Ctrl+Shift+V`) not working on Linux and Windows. Now uses proper `key` + `mac` pattern matching VS Code's markdown preview.

## [0.1.2] - 2026-01-22

### Added

- **Auto-Install Runtimes**: On macOS and Linux, users can now install missing runtimes (Python, Rust, Bun) directly from VS Code with a single click. When a runtime is missing, click "Install Now" and Zef will run the installation in a terminal for you.

- **Runtime Configuration Settings**: New settings for configuring custom paths:
  - `zef.rustcPath` - Custom path to Rust compiler
  - `zef.bunPath` - Custom path to Bun runtime

- **Enhanced Error Messages**: When a runtime is missing, users now see:
  - A clear explanation of what the runtime is and why it's needed
  - "Install Now" button (macOS/Linux) for automatic installation
  - "Manual Install" button to open the official installation page
  - "Configure Path" to set a custom path in settings
  - "View Docs" to open the comprehensive documentation

- **Runtime Status in Settings Panel**: The Zef Settings panel (click the Python icon in status bar) now shows which runtimes are available with ✓ or ⚠ indicators.

- **Comprehensive Documentation**: New [Runtime Requirements Guide](docs/RUNTIME_REQUIREMENTS.md) with:
  - Step-by-step installation instructions for all platforms
  - Troubleshooting section
  - Svelte component documentation

### Fixed

- **Cross-Platform Compatibility**: Fixed runtime detection on Windows:
  - Correct paths for Windows (`.exe` extensions, `Scripts` vs `bin` for Python venvs)
  - Use `where` instead of `which` on Windows
  - Proper home directory detection (`USERPROFILE` on Windows)
  - Added Homebrew paths for Apple Silicon Macs (`/opt/homebrew/bin/`)

### Changed

- Settings panel now shows runtime availability status alongside configuration options
- Improved error messages are now beginner-friendly with explanations

## [0.1.1] - 2026-01-12

### Added
- Initial public release
- Python code execution with persistent kernel
- Rust code execution
- JavaScript/TypeScript execution via Bun
- Svelte component compilation and rendering
- Live preview panel with dark theme
- Mermaid diagram support
- Image paste support
