#!/usr/bin/env python3
"""
Zef VS Code Extension Build Script
===================================

Build, package, and install the Zef extension with version management.

Usage:
    python build.py              # Build and install (default)
    python build.py --no-install # Build only, don't install
    python build.py --clean      # Clean build artifacts first
    python build.py --bump patch # Bump version (patch/minor/major)
    
Examples:
    python build.py                     # Quick build and install
    python build.py --clean             # Clean build and install
    python build.py --bump patch        # Bump patch version, build and install
    python build.py --no-install        # Just build the .vsix
"""

import subprocess
import sys
import os
import json
import shutil
import re
from pathlib import Path

# Extension directory (where this script lives)
ROOT = Path(__file__).parent

# Terminal colors
class C:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(msg):
    """Print a step message."""
    print(f"\n{C.CYAN}{C.BOLD}▶{C.END} {msg}")

def success(msg):
    """Print success message."""
    print(f"  {C.GREEN}✓{C.END} {msg}")

def warn(msg):
    """Print warning message."""
    print(f"  {C.YELLOW}⚠{C.END} {msg}")

def error(msg):
    """Print error message."""
    print(f"  {C.RED}✗{C.END} {msg}")

def info(msg):
    """Print info message."""
    print(f"  ℹ️  {msg}")

def run(cmd, cwd=ROOT, check=True, shell=False):
    """Run a command and return (success, output)."""
    try:
        if shell:
            result = subprocess.run(
                cmd, shell=True, cwd=cwd,
                capture_output=True, text=True, timeout=120
            )
        else:
            result = subprocess.run(
                cmd, cwd=cwd,
                capture_output=True, text=True, timeout=120
            )
        output = result.stdout + result.stderr
        if check and result.returncode != 0:
            return False, output
        return True, output
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def get_version():
    """Get version from package.json."""
    with open(ROOT / "package.json") as f:
        return json.load(f).get("version", "0.0.0")

def set_version(new_version):
    """Set version in package.json and package-lock.json."""
    # Update package.json
    pkg_path = ROOT / "package.json"
    with open(pkg_path) as f:
        pkg = json.load(f)
    old_version = pkg["version"]
    pkg["version"] = new_version
    with open(pkg_path, "w") as f:
        json.dump(pkg, f, indent=2)
        f.write("\n")
    
    # Update package-lock.json if exists
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

def bump_version(bump_type):
    """Bump version: patch, minor, or major."""
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
        error(f"Invalid bump type: {bump_type}. Use: patch, minor, major")
        sys.exit(1)
    
    new_version = ".".join(map(str, parts))
    old_version = set_version(new_version)
    success(f"Version bumped: {old_version} → {new_version}")
    return new_version

def clean_build():
    """Clean build artifacts."""
    log("Cleaning build artifacts...")
    
    # Clean out/ directory
    out_dir = ROOT / "out"
    if out_dir.exists():
        shutil.rmtree(out_dir)
        success("Removed out/")
    
    # Clean node_modules cache
    cache_dir = ROOT / "node_modules" / ".cache"
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
        success("Removed node_modules/.cache")
    
    # Clean old vsix files
    for vsix in ROOT.glob("*.vsix"):
        vsix.unlink()
        success(f"Removed {vsix.name}")

def remove_old_extensions(keep_version):
    """Remove old installed extension versions."""
    extensions_dir = Path.home() / ".vscode" / "extensions"
    if not extensions_dir.exists():
        return
    
    pattern = re.compile(r"ulfbissbort\.zef-(\d+\.\d+\.\d+)")
    removed = False
    for ext_dir in extensions_dir.iterdir():
        match = pattern.match(ext_dir.name)
        if match and match.group(1) != keep_version:
            shutil.rmtree(ext_dir)
            success(f"Removed old extension: {ext_dir.name}")
            removed = True
    
    if not removed:
        info("No old extension versions to clean")

def check_requirements():
    """Check Node.js and npm are available."""
    log("Checking requirements...")
    
    ok, out = run(["node", "--version"])
    if ok:
        success(f"Node.js {out.strip()}")
    else:
        error("Node.js not found. Please install Node.js first.")
        sys.exit(1)
    
    ok, out = run(["npm", "--version"])
    if ok:
        success(f"npm {out.strip()}")
    else:
        error("npm not found. Please install npm first.")
        sys.exit(1)

def install_dependencies():
    """Install npm dependencies if needed."""
    log("Checking dependencies...")
    node_modules = ROOT / "node_modules"
    
    if node_modules.exists():
        # Quick check - skip if package.json hasn't changed
        info("node_modules exists, skipping npm install")
        return True
    
    log("Installing dependencies...")
    ok, out = run(["npm", "install"])
    if ok:
        success("Dependencies installed")
        return True
    else:
        error(f"npm install failed:\n{out}")
        return False

def compile_typescript():
    """Compile TypeScript."""
    log("Compiling TypeScript...")
    ok, out = run(["npm", "run", "compile"])
    if ok:
        success("TypeScript compiled")
        return True
    else:
        error(f"Compilation failed:\n{out}")
        return False

def package_extension():
    """Package extension as .vsix."""
    log("Packaging extension...")
    version = get_version()
    
    # Remove old vsix files
    for old_vsix in ROOT.glob("*.vsix"):
        old_vsix.unlink()
    
    ok, out = run(["npx", "vsce", "package", "--allow-missing-repository"])
    
    vsix_file = ROOT / f"zef-{version}.vsix"
    if vsix_file.exists():
        size_mb = vsix_file.stat().st_size / (1024 * 1024)
        success(f"Created {vsix_file.name} ({size_mb:.2f} MB)")
        return vsix_file
    else:
        # Try to find any vsix file created
        vsix_files = list(ROOT.glob("*.vsix"))
        if vsix_files:
            success(f"Created {vsix_files[0].name}")
            return vsix_files[0]
        error(f"Packaging failed:\n{out}")
        return None

def install_extension(vsix_path):
    """Install extension to VS Code."""
    log("Installing extension...")
    ok, out = run(["code", "--install-extension", str(vsix_path.absolute()), "--force"])
    
    if ok or "successfully installed" in out.lower():
        success(f"Installed {vsix_path.name}")
        return True
    else:
        error(f"Installation failed:\n{out}")
        return False

def verify_installation(version):
    """Verify the extension is correctly installed."""
    ext_dir = Path.home() / ".vscode" / "extensions" / f"ulfbissbort.zef-{version}"
    if not ext_dir.exists():
        warn(f"Extension directory not found (may take a moment to appear)")
        return False
    
    preview_panel = ext_dir / "out" / "previewPanel.js"
    if preview_panel.exists():
        success(f"Verified at {ext_dir}")
        return True
    return False

def main():
    args = set(sys.argv[1:])
    
    # Parse arguments
    do_clean = "--clean" in args
    do_install = "--no-install" not in args
    bump_type = None
    
    if "--bump" in args:
        # Find the bump type argument
        arg_list = sys.argv[1:]
        try:
            idx = arg_list.index("--bump")
            bump_type = arg_list[idx + 1] if idx + 1 < len(arg_list) else None
        except (ValueError, IndexError):
            pass
        
        if not bump_type or bump_type.startswith("-"):
            error("--bump requires a type: patch, minor, or major")
            print("  Example: python build.py --bump patch")
            sys.exit(1)
    
    # Header
    print(f"\n{C.BOLD}{'=' * 50}{C.END}")
    print(f"{C.BOLD}  Zef VS Code Extension Builder{C.END}")
    print(f"{C.BOLD}{'=' * 50}{C.END}")
    
    # Clean if requested
    if do_clean:
        clean_build()
    
    # Bump version if requested
    if bump_type:
        bump_version(bump_type)
    
    version = get_version()
    info(f"Version: {version}")
    info(f"Directory: {ROOT}")
    
    # Check requirements
    check_requirements()
    
    # Install dependencies
    if not install_dependencies():
        sys.exit(1)
    
    # Compile
    if not compile_typescript():
        sys.exit(1)
    
    # Package
    vsix_path = package_extension()
    if not vsix_path:
        sys.exit(1)
    
    # Install
    if do_install:
        # Clean old versions
        remove_old_extensions(version)
        
        if not install_extension(vsix_path):
            sys.exit(1)
        
        verify_installation(version)
        
        # Success!
        print(f"\n{C.BOLD}{'=' * 50}{C.END}")
        print(f"{C.GREEN}{C.BOLD}  ✓ Build & Install Complete!{C.END}")
        print(f"{C.BOLD}{'=' * 50}{C.END}")
        print(f"\n  {C.YELLOW}Reload VS Code:{C.END} Cmd+Shift+P → 'Reload Window'\n")
    else:
        print(f"\n{C.BOLD}{'=' * 50}{C.END}")
        print(f"{C.GREEN}{C.BOLD}  ✓ Build Complete!{C.END}")
        print(f"{C.BOLD}{'=' * 50}{C.END}")
        print(f"\n  VSIX: {vsix_path.name}")
        print(f"  To install: python build.py\n")

if __name__ == "__main__":
    main()
