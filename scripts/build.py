#!/usr/bin/env python3
"""
Zef VSCode Extension Build Script

This script automates the build, install, and version management process
to prevent common issues like stale build artifacts and version conflicts.

Usage:
    python scripts/build.py          # Build only
    python scripts/build.py --install # Build and install
    python scripts/build.py --clean   # Clean build (removes out/, node_modules/.cache)
    python scripts/build.py --bump patch|minor|major  # Bump version and build
"""

import subprocess
import sys
import json
import os
import shutil
import re
from pathlib import Path
from datetime import datetime

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(msg, color=Colors.CYAN):
    print(f"{color}{Colors.BOLD}▶{Colors.END} {msg}")

def success(msg):
    print(f"{Colors.GREEN}✓{Colors.END} {msg}")

def warn(msg):
    print(f"{Colors.YELLOW}⚠{Colors.END} {msg}")

def error(msg):
    print(f"{Colors.RED}✗{Colors.END} {msg}")

def run(cmd, cwd=None, check=True):
    """Run a shell command and return the result."""
    log(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        error(f"Command failed: {result.stderr}")
        sys.exit(1)
    return result

def get_project_root():
    """Get the project root directory."""
    return Path(__file__).parent.parent

def get_package_json():
    """Read package.json."""
    with open(get_project_root() / "package.json") as f:
        return json.load(f)

def save_package_json(data):
    """Write package.json."""
    with open(get_project_root() / "package.json", "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

def get_version():
    """Get current version from package.json."""
    return get_package_json()["version"]

def bump_version(bump_type):
    """Bump version in package.json."""
    pkg = get_package_json()
    version = pkg["version"]
    major, minor, patch = map(int, version.split("."))
    
    if bump_type == "patch":
        patch += 1
    elif bump_type == "minor":
        minor += 1
        patch = 0
    elif bump_type == "major":
        major += 1
        minor = 0
        patch = 0
    else:
        error(f"Invalid bump type: {bump_type}")
        sys.exit(1)
    
    new_version = f"{major}.{minor}.{patch}"
    pkg["version"] = new_version
    save_package_json(pkg)
    
    # Also update package-lock.json if it exists
    lock_path = get_project_root() / "package-lock.json"
    if lock_path.exists():
        with open(lock_path) as f:
            lock = json.load(f)
        lock["version"] = new_version
        if "packages" in lock and "" in lock["packages"]:
            lock["packages"][""]["version"] = new_version
        with open(lock_path, "w") as f:
            json.dump(lock, f, indent=2)
            f.write("\n")
    
    success(f"Bumped version: {version} → {new_version}")
    return new_version

def clean_build():
    """Clean build artifacts."""
    root = get_project_root()
    
    # Clean out/ directory
    out_dir = root / "out"
    if out_dir.exists():
        log("Removing out/ directory")
        shutil.rmtree(out_dir)
        success("Removed out/")
    
    # Clean node_modules cache
    cache_dir = root / "node_modules" / ".cache"
    if cache_dir.exists():
        log("Removing node_modules/.cache")
        shutil.rmtree(cache_dir)
        success("Removed node_modules/.cache")
    
    # Clean old vsix files
    for vsix in root.glob("*.vsix"):
        log(f"Removing {vsix.name}")
        vsix.unlink()
        success(f"Removed {vsix.name}")

def remove_old_extension_versions(current_version):
    """Remove old installed extension versions."""
    extensions_dir = Path.home() / ".vscode" / "extensions"
    if not extensions_dir.exists():
        return
    
    pattern = re.compile(r"ulfbissbort\.zef-(\d+\.\d+\.\d+)")
    for ext_dir in extensions_dir.iterdir():
        match = pattern.match(ext_dir.name)
        if match and match.group(1) != current_version:
            log(f"Removing old extension: {ext_dir.name}")
            shutil.rmtree(ext_dir)
            success(f"Removed {ext_dir.name}")

def compile_typescript():
    """Compile TypeScript."""
    root = get_project_root()
    log("Compiling TypeScript...")
    run("tsc -p ./", cwd=root)
    success("TypeScript compiled")

def package_extension():
    """Package the extension as .vsix."""
    root = get_project_root()
    version = get_version()
    
    log(f"Packaging extension v{version}...")
    result = run("npx vsce package --allow-missing-repository", cwd=root)
    
    vsix_path = root / f"zef-{version}.vsix"
    if vsix_path.exists():
        size_mb = vsix_path.stat().st_size / (1024 * 1024)
        success(f"Created {vsix_path.name} ({size_mb:.2f} MB)")
        return vsix_path
    else:
        error("Failed to create .vsix file")
        sys.exit(1)

def install_extension(vsix_path):
    """Install the extension in VS Code."""
    log(f"Installing {vsix_path.name}...")
    run(f"code --install-extension {vsix_path} --force")
    success(f"Installed extension")

def verify_installation(version):
    """Verify the extension is correctly installed."""
    extensions_dir = Path.home() / ".vscode" / "extensions" / f"ulfbissbort.zef-{version}"
    if not extensions_dir.exists():
        error(f"Extension directory not found: {extensions_dir}")
        return False
    
    preview_panel = extensions_dir / "out" / "previewPanel.js"
    if not preview_panel.exists():
        error(f"previewPanel.js not found in installed extension")
        return False
    
    success(f"Verified installation at {extensions_dir}")
    return True

def main():
    args = sys.argv[1:]
    
    do_clean = "--clean" in args
    do_install = "--install" in args
    bump_type = None
    
    if "--bump" in args:
        idx = args.index("--bump")
        if idx + 1 < len(args):
            bump_type = args[idx + 1]
        else:
            error("--bump requires a type: patch, minor, or major")
            sys.exit(1)
    
    root = get_project_root()
    os.chdir(root)
    
    print(f"\n{Colors.BOLD}Zef VSCode Extension Builder{Colors.END}\n")
    
    # Clean if requested
    if do_clean:
        log("Clean build requested")
        clean_build()
        print()
    
    # Bump version if requested
    if bump_type:
        bump_version(bump_type)
        print()
    
    version = get_version()
    log(f"Building version {version}")
    print()
    
    # Compile
    compile_typescript()
    print()
    
    # Package
    vsix_path = package_extension()
    print()
    
    # Install if requested
    if do_install:
        # Remove old versions first
        remove_old_extension_versions(version)
        print()
        
        install_extension(vsix_path)
        print()
        
        if verify_installation(version):
            print()
            success(f"Extension v{version} is ready!")
            warn("Remember to reload VS Code (Cmd+Shift+P → 'Developer: Reload Window')")
        else:
            error("Installation verification failed")
            sys.exit(1)
    else:
        print()
        success(f"Build complete: {vsix_path.name}")
        log(f"To install: python scripts/build.py --install")

if __name__ == "__main__":
    main()
