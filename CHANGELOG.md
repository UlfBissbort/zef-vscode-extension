# Changelog

All notable changes to the Zef extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.16] - 2026-02-13

### Added

- **Tokolosh Auto-Setup**: The extension now bundles the `zef-install` binary for macOS, Linux, and Windows. On first activation, it detects whether the Tokolosh daemon environment exists and installs it automatically — no user interaction required. The full 7-step installation (UV, Python venv, Zef wheel download, daemon script, system service) runs in the background with a progress notification. A dedicated "Zef Installer" output channel provides timestamped step-by-step logs for observability.

- **Obsidian-Style Callouts**: Blockquote callouts using `> [!type]` syntax now render with styled containers and SVG icons. Supports `tip`, `info`, `note`, `warning`, `caution`, `danger`, `error`, `success`, `check`, `example`, and `quote` types.

- **Jump to Source**: Clicking a code block header in the preview navigates the editor to the corresponding source line. Works correctly when the preview panel has focus.

- **Draggable Preview Width**: The rendered preview tab now has a draggable edge to resize width interactively. Width adjustment applies only to the rendered view, not code tabs.

### Improved

- **Code Block Highlighting**: Active code block detection now uses precise block ID matching for more reliable highlighting when executing code.

- **Foldable Code Blocks**: Code block folding logic has been rewritten for consistency across different block types.

- **Button Alignment**: Toolbar button alignment corrected across code block, Mermaid, and Svelte panels.

## [0.1.15] - 2026-02-11

### Added

- **Toggle Full Height for Code Blocks**: Code blocks longer than 25 lines are now collapsed by default with a scrollbar. A vertical arrow toggle button allows expanding to full height.

### Improved

- **Consistent Toggle Button Styling**: Toggle buttons across code blocks, Mermaid diagrams, and Excalidraw now use larger icons and a faint blue background when active for better visibility.

- **Svelte Expand Button**: Replaced text "Expand" button with an icon-only pop-out button matching the Mermaid diagram style.

## [0.1.14] - 2026-02-11

### Added

- **Excalidraw Inline Editing**: Excalidraw diagrams can now be edited directly in the preview panel (embedded) or opened in a detached editor window. Includes adjustable editor height via drag handle.

- **Compile All Svelte**: New "Compile All Svelte" button in the preview panel to compile all Svelte components in the document at once.

- **Svelte Full Panel Support**: Svelte components can be expanded to a full panel view with HTML caching for faster re-renders.

- **Draggable Resize Handles**: Preview iframes (Svelte, HTML) now have drag handles to resize their height.

- **Expandable Mermaid Diagrams**: Mermaid diagrams can be expanded to full width for better readability. Diagrams now render at full container width by default.

- **Wide Code Blocks**: Code blocks now render wider with a minimum width for better readability.

### Improved

- **Svelte Error Messages**: Error reports now show detailed location info (line, column, code frame) with a copy button, rendered directly in the panel instead of inside an iframe.

- **Excalidraw Images**: Excalidraw images now render at full width in the preview.

## [0.1.12] - 2026-01-28

### Added

- **Rust File Preview**: Support for `.rs` files with `/*md ... */` markdown blocks. Press `Cmd+Shift+P` → "Zef: Show Preview" on any Rust file to see rendered documentation.

- **Python File Preview**: Support for `.py` files with `"""md ... """` markdown blocks. Self-documenting Python scripts with live preview.

- **Rust Polymorphism Tutorial**: New example file `rust_polymorphism_tutorial.rs` demonstrating:
  - Enums vs Traits comparison with Mermaid diagrams
  - Algebraic data type mathematics (sum types, memory layout)
  - VTable structure and dynamic dispatch visualization
  - Fully compilable and runnable Rust code

### Fixed

- **LaTeX Aligned Environments**: Fixed `\\` line breaks in LaTeX aligned/matrix environments being converted to single backslash by markdown parser.

- **Indented Markdown Blocks**: Fixed dedent for `/*md` blocks inside functions/structs where indentation wasn't properly removed.

## [0.1.8] - 2026-01-27

### Added

- **LaTeX Math Equations**: Full support for LaTeX math rendering using KaTeX.
  - Inline math: `$E = mc^2$` renders inline with text
  - Display math: `$$...$$` renders as centered block equations
  - Supports Greek letters, matrices, fractions, integrals, and more
  - Math inside code blocks is correctly excluded from rendering
  - Obsidian-compatible syntax

## [0.1.7] - 2026-01-27

### Added

- **Mermaid SVG Export**: Added an "SVG" export button to the Mermaid diagram title bar. Click to save the rendered diagram as a standalone SVG file with embedded dark theme styles.

## [0.1.6] - 2026-01-22

### Added

- **Document Settings Drawer**: Elegant slide-in settings panel in the Zef View (gear icon in top-right corner) for per-document configuration.

- **TOML Frontmatter Support**: Documents can now use `---zef` frontmatter blocks with TOML syntax for per-document settings. Settings are only written when they differ from defaults.

- **Persist Output Settings**: Control what gets saved to the document after code execution:
  - **Svelte**: `persist_output` (rendered HTML) - default: false
  - **Python**: `persist_output` (Result blocks), `persist_side_effects` (Side Effects blocks) - default: true
  - **Rust**: `persist_output` (Result blocks), `persist_side_effects` (Side Effects blocks) - default: true

- **Bidirectional Settings Sync**: Settings drawer UI reflects document frontmatter state, and checkbox changes automatically update the `---zef` TOML block in the document.

### Example

```markdown
---zef
[svelte]
persist_output = true

[python]
persist_output = false
---

# My Document
```

## [0.1.5] - 2026-01-22

### Added

- **Configurable View Width**: New `zef.viewWidthPercent` setting (70-150%) to adjust the Zef View width. Default is 100% (680px). Accessible via slider in the Settings tab of the Zef sidebar.

- **Live View Width Adjustment**: The Zef View automatically re-renders when the width slider is adjusted, with 0.5 second debounce for smooth interaction.

- **Improved Markdown Rendering**:
  - Blank lines between content blocks are now preserved (Obsidian-style)
  - Horizontal rules (`---`) are now more prominent with thicker, brighter styling

- **Enhanced Code Block Support**:
  - JSON code blocks with syntax highlighting
  - Zen notation code blocks with Python-style highlighting
  - HTML code blocks with Rendered/Code tabs and iframe preview
  - HTML modal view with expand button for full-screen viewing

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
