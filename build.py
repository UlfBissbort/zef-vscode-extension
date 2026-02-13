#!/usr/bin/env python3
"""
Zef VS Code Extension Build Tool
=================================

A friendly CLI tool for building, testing, and publishing the Zef extension.

INTERACTIVE MODE (default):
    python build.py
    
    Shows a menu to select what you want to do:
    - Local development (compile + install locally)
    - Publish to marketplace
    
COMMAND LINE MODE:
    python build.py dev              # Build and install locally
    python build.py publish          # Compile, package, publish to marketplace
    python build.py dev --clean      # Clean build + install locally
    python build.py publish --bump patch  # Bump version and publish

OPTIONS:
    --clean           Remove build artifacts before building
    --bump TYPE       Bump version (patch/minor/major) before building
    --dry-run         Show what would happen without doing it
    --help            Show this help message
"""

import subprocess
import sys
import os
import json
import shutil
import re
from pathlib import Path
from typing import Optional, Tuple

# Extension directory (where this script lives)
ROOT = Path(__file__).parent

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Terminal Colors & Formatting
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class C:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'

def header(text: str):
    """Print a section header."""
    width = 60
    print(f"\n{C.BOLD}{C.CYAN}{'━' * width}{C.END}")
    print(f"{C.BOLD}{C.CYAN}  {text}{C.END}")
    print(f"{C.BOLD}{C.CYAN}{'━' * width}{C.END}\n")

def step(msg: str):
    """Print a step being performed."""
    print(f"{C.CYAN}{C.BOLD}▶{C.END} {msg}")

def success(msg: str):
    """Print a success message."""
    print(f"  {C.GREEN}✓{C.END} {msg}")

def warn(msg: str):
    """Print a warning message."""
    print(f"  {C.YELLOW}⚠{C.END} {msg}")

def error(msg: str):
    """Print an error message."""
    print(f"  {C.RED}✗{C.END} {msg}")

def info(msg: str):
    """Print an info message."""
    print(f"  {C.DIM}ℹ{C.END} {msg}")

def explain(msg: str):
    """Print an explanation (dimmed)."""
    print(f"  {C.DIM}{msg}{C.END}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Command Execution
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def run(cmd: list, cwd: Path = ROOT, capture: bool = True) -> Tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd, cwd=cwd,
            capture_output=capture, text=True, timeout=300
        )
        output = (result.stdout or '') + (result.stderr or '')
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "Command timed out after 5 minutes"
    except FileNotFoundError:
        return False, f"Command not found: {cmd[0]}"
    except Exception as e:
        return False, str(e)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Version Management
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def get_version() -> str:
    """Get version from package.json."""
    with open(ROOT / "package.json") as f:
        return json.load(f).get("version", "0.0.0")

def set_version(new_version: str) -> str:
    """Set version in package.json and package-lock.json. Returns old version."""
    pkg_path = ROOT / "package.json"
    with open(pkg_path) as f:
        pkg = json.load(f)
    old_version = pkg["version"]
    pkg["version"] = new_version
    with open(pkg_path, "w") as f:
        json.dump(pkg, f, indent=2)
        f.write("\n")
    
    lock_path = ROOT / "package-lock.json"
    if lock_path.exists():
        with open(lock_path) as f:
            lock = json.load(f)
        lock["version"] = new_version
        if "packages" in lock and "" in lock["packages"]:
            lock["packages"][""]["version"] = new_version
        with open(lock_path, "w") as f:
            json.dump(lock, f, indent=2)
            f.write("\n")
    
    return old_version

def bump_version(bump_type: str) -> str:
    """Bump version and return new version."""
    version = get_version()
    parts = list(map(int, version.split(".")))
    
    if bump_type == "patch":
        parts[2] += 1
    elif bump_type == "minor":
        parts[1] += 1
        parts[2] = 0
    elif bump_type == "major":
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    else:
        error(f"Invalid bump type: {bump_type}")
        sys.exit(1)
    
    new_version = ".".join(map(str, parts))
    old_version = set_version(new_version)
    success(f"Version bumped: {old_version} → {new_version}")
    return new_version

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Build Operations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def clean_build():
    """Remove build artifacts for a fresh build."""
    step("Cleaning build artifacts...")
    explain("Removes out/, node_modules/.cache, and old .vsix files")
    
    out_dir = ROOT / "out"
    if out_dir.exists():
        shutil.rmtree(out_dir)
        success("Removed out/")
    
    cache_dir = ROOT / "node_modules" / ".cache"
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
        success("Removed node_modules/.cache")
    
    for vsix in ROOT.glob("*.vsix"):
        vsix.unlink()
        success(f"Removed {vsix.name}")

def remove_old_extensions(keep_version: str):
    """Remove old extension versions from VS Code extensions folder."""
    extensions_dir = Path.home() / ".vscode" / "extensions"
    if not extensions_dir.exists():
        return
    
    pattern = re.compile(r"ulfbissbort\.zef-(\d+\.\d+\.\d+)")
    for ext_dir in extensions_dir.iterdir():
        match = pattern.match(ext_dir.name)
        if match and match.group(1) != keep_version:
            shutil.rmtree(ext_dir)
            success(f"Removed old: {ext_dir.name}")

def check_requirements():
    """Verify Node.js and npm are installed."""
    step("Checking build requirements...")
    explain("Node.js and npm are required to compile TypeScript and package the extension")
    
    ok, out = run(["node", "--version"])
    if ok:
        success(f"Node.js {out.strip()}")
    else:
        error("Node.js not found. Install from https://nodejs.org/")
        sys.exit(1)
    
    ok, out = run(["npm", "--version"])
    if ok:
        success(f"npm {out.strip()}")
    else:
        error("npm not found")
        sys.exit(1)

def compile_typescript():
    """Compile TypeScript source to JavaScript."""
    step("Compiling TypeScript...")
    explain("Transpiles src/*.ts to out/*.js using the TypeScript compiler")
    
    ok, out = run(["npm", "run", "compile"])
    if ok:
        success("TypeScript compiled successfully")
        return True
    else:
        error("Compilation failed:")
        print(out)
        return False

def copy_installer_binaries():
    """Copy zef-install binaries from ../zef-installer/dist/ into resources/bin/."""
    installer_dist = ROOT.parent / "zef-installer" / "dist"
    bin_dir = ROOT / "resources" / "bin"
    
    binaries = {
        "zef-install-macos-arm64":          "zef-install-macos-arm64",
        "zef-install-linux-x86_64":         "zef-install-linux-x86_64",
        "zef-install-windows-x86_64.exe":   "zef-install-windows-x86_64.exe",
    }
    
    if not installer_dist.exists():
        warn(f"Installer dist not found at {installer_dist}")
        warn("Run 'make all' in ../zef-installer/ first")
        return
    
    bin_dir.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    for src_name, dst_name in binaries.items():
        src = installer_dist / src_name
        dst = bin_dir / dst_name
        if src.exists():
            shutil.copy2(src, dst)
            if not dst_name.endswith('.exe'):
                dst.chmod(0o755)
            size_kb = dst.stat().st_size / 1024
            success(f"  {dst_name} ({size_kb:.0f} KB)")
            copied += 1
        else:
            warn(f"  Missing: {src_name}")
    
    if copied > 0:
        success(f"Copied {copied} installer binary(ies) to resources/bin/")
    else:
        warn("No installer binaries found — VSIX will have no installer")

def package_extension() -> Optional[Path]:
    """Create .vsix package file."""
    step("Packaging extension...")
    explain("Creates a .vsix file containing all extension files")
    
    # Copy installer binaries from zef-installer before packaging
    copy_installer_binaries()
    
    version = get_version()
    for old_vsix in ROOT.glob("*.vsix"):
        old_vsix.unlink()
    
    ok, out = run(["npx", "vsce", "package", "--allow-missing-repository"])
    
    vsix_file = ROOT / f"zef-{version}.vsix"
    if vsix_file.exists():
        size_mb = vsix_file.stat().st_size / (1024 * 1024)
        success(f"Created {vsix_file.name} ({size_mb:.2f} MB)")
        return vsix_file
    else:
        vsix_files = list(ROOT.glob("*.vsix"))
        if vsix_files:
            success(f"Created {vsix_files[0].name}")
            return vsix_files[0]
        error("Packaging failed:")
        print(out)
        return None

def install_local(vsix_path: Path) -> bool:
    """Install extension to local VS Code."""
    step("Installing to VS Code...")
    explain("Uses 'code --install-extension' to install in your local VS Code")
    
    version = get_version()
    remove_old_extensions(version)
    
    ok, out = run(["code", "--install-extension", str(vsix_path.absolute()), "--force"])
    
    if ok or "successfully installed" in out.lower():
        success(f"Installed {vsix_path.name}")
        
        # Verify installation
        ext_dir = Path.home() / ".vscode" / "extensions" / f"ulfbissbort.zef-{version}"
        if ext_dir.exists():
            success(f"Verified at {ext_dir}")
        
        return True
    else:
        error("Installation failed:")
        print(out)
        return False

def publish_marketplace() -> bool:
    """Publish extension to VS Code Marketplace."""
    step("Publishing to VS Code Marketplace...")
    explain("Uploads the extension to marketplace.visualstudio.com")
    explain("Requires a Personal Access Token (PAT) - see: https://code.visualstudio.com/api/working-with-extensions/publishing-extension")
    
    # Verify PAT first
    ok, out = run(["npx", "vsce", "verify-pat", "UlfBissbort"])
    if not ok:
        error("Personal Access Token verification failed")
        print(out)
        info("Run: npx vsce login UlfBissbort")
        return False
    success("PAT verified")
    
    # Publish
    ok, out = run(["npx", "vsce", "publish", "--allow-missing-repository"])
    
    if ok and "DONE" in out:
        success("Published to marketplace!")
        version = get_version()
        info(f"URL: https://marketplace.visualstudio.com/items?itemName=UlfBissbort.zef")
        info(f"Note: May take 5-10 minutes to appear with version {version}")
        return True
    elif "already exists" in out:
        warn(f"Version {get_version()} already exists on marketplace")
        info("Bump version with: python build.py publish --bump patch")
        return False
    else:
        error("Publishing failed:")
        print(out)
        return False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# High-Level Workflows
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def workflow_dev(clean: bool = False, bump_type: Optional[str] = None):
    """
    Local Development Workflow
    
    Compiles the TypeScript code, packages it as a .vsix file, and installs
    it directly into your local VS Code. Perfect for testing changes during
    development.
    
    Steps:
    1. Clean build artifacts (optional)
    2. Bump version (optional)
    3. Compile TypeScript → out/*.js
    4. Package as .vsix
    5. Install to local VS Code
    6. Remove old extension versions
    
    After this, reload VS Code (Cmd+Shift+P → 'Reload Window') to use the
    updated extension.
    """
    header("Local Development Build")
    print(f"  {C.DIM}Compiles, packages, and installs the extension to your local VS Code.{C.END}")
    print(f"  {C.DIM}Use this during development to test your changes.{C.END}\n")
    
    if clean:
        clean_build()
        print()
    
    if bump_type:
        step(f"Bumping version ({bump_type})...")
        bump_version(bump_type)
        print()
    
    version = get_version()
    info(f"Version: {version}")
    info(f"Directory: {ROOT}")
    print()
    
    check_requirements()
    print()
    
    if not compile_typescript():
        sys.exit(1)
    print()
    
    vsix_path = package_extension()
    if not vsix_path:
        sys.exit(1)
    print()
    
    if not install_local(vsix_path):
        sys.exit(1)
    
    # Success message
    print(f"\n{C.BOLD}{'━' * 60}{C.END}")
    print(f"{C.GREEN}{C.BOLD}  ✓ Build & Install Complete!{C.END}")
    print(f"{C.BOLD}{'━' * 60}{C.END}")
    print(f"\n  {C.YELLOW}Next step:{C.END} Reload VS Code")
    print(f"  {C.DIM}Cmd+Shift+P → 'Developer: Reload Window'{C.END}\n")

def workflow_publish(clean: bool = False, bump_type: Optional[str] = None):
    """
    Marketplace Publishing Workflow
    
    Compiles and packages the extension, then publishes it to the VS Code
    Marketplace so others can install it. This makes your extension available
    to all VS Code users worldwide.
    
    Steps:
    1. Clean build artifacts (optional)
    2. Bump version (required for new release)
    3. Compile TypeScript
    4. Package as .vsix
    5. Verify Personal Access Token
    6. Upload to marketplace
    
    Requirements:
    - Valid Personal Access Token from Azure DevOps
    - Run 'npx vsce login UlfBissbort' if token expired
    
    After publishing, the extension will be available at:
    https://marketplace.visualstudio.com/items?itemName=UlfBissbort.zef
    """
    header("Publish to Marketplace")
    print(f"  {C.DIM}Compiles, packages, and publishes the extension to the VS Code Marketplace.{C.END}")
    print(f"  {C.DIM}Makes your extension available to all VS Code users.{C.END}\n")
    
    if clean:
        clean_build()
        print()
    
    if bump_type:
        step(f"Bumping version ({bump_type})...")
        bump_version(bump_type)
        print()
    
    version = get_version()
    info(f"Version: {version}")
    info(f"Directory: {ROOT}")
    print()
    
    check_requirements()
    print()
    
    if not compile_typescript():
        sys.exit(1)
    print()
    
    vsix_path = package_extension()
    if not vsix_path:
        sys.exit(1)
    print()
    
    if not publish_marketplace():
        sys.exit(1)
    
    # Success message
    print(f"\n{C.BOLD}{'━' * 60}{C.END}")
    print(f"{C.GREEN}{C.BOLD}  ✓ Published Successfully!{C.END}")
    print(f"{C.BOLD}{'━' * 60}{C.END}")
    print(f"\n  {C.CYAN}Extension:{C.END} UlfBissbort.zef v{version}")
    print(f"  {C.CYAN}URL:{C.END} https://marketplace.visualstudio.com/items?itemName=UlfBissbort.zef")
    print(f"\n  {C.DIM}Note: May take 5-10 minutes for the marketplace to update.{C.END}\n")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Interactive Menu
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def interactive_menu():
    """Show interactive menu to select build mode."""
    header("Zef Extension Builder")
    
    version = get_version()
    print(f"  Current version: {C.BOLD}{version}{C.END}")
    print(f"  Directory: {C.DIM}{ROOT}{C.END}")
    print()
    
    print(f"  {C.BOLD}What would you like to do?{C.END}")
    print()
    print(f"  {C.CYAN}[1]{C.END} {C.BOLD}Local Development{C.END}")
    print(f"      {C.DIM}Compile, package, and install to your local VS Code.{C.END}")
    print(f"      {C.DIM}Use this to test changes during development.{C.END}")
    print()
    print(f"  {C.CYAN}[2]{C.END} {C.BOLD}Publish to Marketplace{C.END}")
    print(f"      {C.DIM}Compile, package, and publish to the VS Code Marketplace.{C.END}")
    print(f"      {C.DIM}Makes your extension available to all VS Code users.{C.END}")
    print()
    print(f"  {C.CYAN}[3]{C.END} {C.BOLD}Publish with Version Bump{C.END}")
    print(f"      {C.DIM}Bump version ({version} → {'.'.join(map(str, list(map(int, version.split('.')))[:2] + [int(version.split('.')[2]) + 1]))}), then publish.{C.END}")
    print(f"      {C.DIM}Use this for releasing new versions.{C.END}")
    print()
    print(f"  {C.DIM}[q] Quit{C.END}")
    print()
    
    try:
        choice = input(f"  {C.BOLD}Enter choice [1-3, q]:{C.END} ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\n")
        sys.exit(0)
    
    if choice == '1':
        workflow_dev()
    elif choice == '2':
        workflow_publish()
    elif choice == '3':
        workflow_publish(bump_type="patch")
    elif choice in ('q', 'quit', 'exit'):
        print()
        sys.exit(0)
    else:
        print(f"\n  {C.RED}Invalid choice. Please enter 1, 2, 3, or q.{C.END}")
        sys.exit(1)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLI Entry Point
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def print_help():
    """Print help message."""
    print(__doc__)
    print("COMMANDS:")
    print("  dev        Build and install locally (for development)")
    print("  publish    Build and publish to VS Code Marketplace")
    print()
    print("OPTIONS:")
    print("  --clean         Clean build artifacts first")
    print("  --bump TYPE     Bump version before building (patch/minor/major)")
    print("  --help          Show this help message")
    print()
    print("EXAMPLES:")
    print("  python build.py              # Interactive menu")
    print("  python build.py dev          # Quick local build and install")
    print("  python build.py dev --clean  # Clean build, then install")
    print("  python build.py publish --bump patch  # Bump version and publish")
    print()

def main():
    """Main entry point."""
    args = sys.argv[1:]
    
    # Help flag
    if "--help" in args or "-h" in args:
        print_help()
        sys.exit(0)
    
    # Parse options
    clean = "--clean" in args
    bump_type = None
    
    if "--bump" in args:
        idx = args.index("--bump")
        if idx + 1 < len(args) and not args[idx + 1].startswith("-"):
            bump_type = args[idx + 1]
        else:
            error("--bump requires a type: patch, minor, or major")
            sys.exit(1)
    
    # Filter out options to get command
    command_args = [a for a in args if not a.startswith("-") and a not in ("patch", "minor", "major")]
    
    if not command_args:
        # No command specified - show interactive menu
        interactive_menu()
    elif command_args[0] == "dev":
        workflow_dev(clean=clean, bump_type=bump_type)
    elif command_args[0] == "publish":
        workflow_publish(clean=clean, bump_type=bump_type)
    else:
        error(f"Unknown command: {command_args[0]}")
        print("  Use 'dev' for local development or 'publish' for marketplace.")
        print("  Run 'python build.py --help' for more information.")
        sys.exit(1)

if __name__ == "__main__":
    main()
