#!/usr/bin/env python3
"""
Zef VS Code Extension Build & Install Script
=============================================

Compiles, packages, and installs the Zef extension with friendly output.
"""

import subprocess
import sys
import os
import json
import shutil
from pathlib import Path

# Extension directory
EXT_DIR = Path(__file__).parent

def run(cmd: list[str], cwd: Path = EXT_DIR) -> tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=120
        )
        output = result.stdout + result.stderr
        return result.returncode == 0, output
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)

def print_step(emoji: str, message: str):
    """Print a step message."""
    print(f"\n{emoji}  {message}")

def print_success(message: str):
    """Print success message."""
    print(f"   ✅ {message}")

def print_error(message: str):
    """Print error message."""
    print(f"   ❌ {message}")

def print_info(message: str):
    """Print info message."""
    print(f"   ℹ️  {message}")

def get_version() -> str:
    """Get version from package.json."""
    pkg_path = EXT_DIR / "package.json"
    if pkg_path.exists():
        with open(pkg_path) as f:
            return json.load(f).get("version", "0.0.0")
    return "0.0.0"

def check_node():
    """Check if Node.js is installed."""
    print_step("🔍", "Checking Node.js...")
    success, output = run(["node", "--version"])
    if success:
        version = output.strip()
        print_success(f"Node.js {version} found")
        return True
    else:
        print_error("Node.js not found. Please install Node.js first.")
        return False

def check_npm():
    """Check if npm is installed."""
    print_step("📦", "Checking npm...")
    success, output = run(["npm", "--version"])
    if success:
        version = output.strip()
        print_success(f"npm {version} found")
        return True
    else:
        print_error("npm not found. Please install npm first.")
        return False

def install_dependencies():
    """Install npm dependencies."""
    print_step("📥", "Installing dependencies...")
    
    # Check if node_modules exists
    node_modules = EXT_DIR / "node_modules"
    if node_modules.exists():
        print_info("node_modules exists, running npm install to update...")
    
    success, output = run(["npm", "install"])
    if success:
        print_success("Dependencies installed")
        return True
    else:
        # Handle EPERM error by using absolute path
        print_info("Retrying with explicit working directory...")
        env = os.environ.copy()
        try:
            result = subprocess.run(
                ["npm", "install"],
                cwd=str(EXT_DIR.absolute()),
                capture_output=True,
                text=True,
                env=env
            )
            if result.returncode == 0:
                print_success("Dependencies installed")
                return True
        except:
            pass
        
        print_error(f"Failed to install dependencies:\n{output}")
        return False

def compile_typescript():
    """Compile TypeScript."""
    print_step("🔨", "Compiling TypeScript...")
    success, output = run(["npm", "run", "compile"])
    if success:
        print_success("TypeScript compiled successfully")
        return True
    else:
        print_error(f"Compilation failed:\n{output}")
        return False

def package_extension():
    """Package extension as .vsix."""
    print_step("📦", "Packaging extension...")
    
    version = get_version()
    vsix_file = EXT_DIR / f"zef-{version}.vsix"
    
    # Remove old vsix if exists
    for old_vsix in EXT_DIR.glob("*.vsix"):
        old_vsix.unlink()
        print_info(f"Removed old {old_vsix.name}")
    
    success, output = run([
        "npx", "vsce", "package",
        "--allow-missing-repository"
    ])
    
    if success and vsix_file.exists():
        size_kb = vsix_file.stat().st_size / 1024
        print_success(f"Packaged: {vsix_file.name} ({size_kb:.1f} KB)")
        return True
    else:
        # Try to find any vsix file created
        vsix_files = list(EXT_DIR.glob("*.vsix"))
        if vsix_files:
            print_success(f"Packaged: {vsix_files[0].name}")
            return True
        print_error(f"Packaging failed:\n{output}")
        return False

def install_extension():
    """Install extension to VS Code."""
    print_step("⚡", "Installing extension to VS Code...")
    
    version = get_version()
    vsix_file = EXT_DIR / f"zef-{version}.vsix"
    
    if not vsix_file.exists():
        # Try to find any vsix file
        vsix_files = list(EXT_DIR.glob("*.vsix"))
        if vsix_files:
            vsix_file = vsix_files[0]
        else:
            print_error("No .vsix file found")
            return False
    
    success, output = run([
        "code", "--install-extension",
        str(vsix_file.absolute()),
        "--force"
    ])
    
    if success or "successfully installed" in output.lower():
        print_success(f"Extension installed: {vsix_file.name}")
        return True
    else:
        print_error(f"Installation failed:\n{output}")
        return False

def main():
    """Main build and install process."""
    print("=" * 50)
    print("🚀 Zef VS Code Extension Builder")
    print("=" * 50)
    
    version = get_version()
    print(f"\n📋 Version: {version}")
    print(f"📁 Directory: {EXT_DIR}")
    
    # Check requirements
    if not check_node():
        sys.exit(1)
    
    if not check_npm():
        sys.exit(1)
    
    # Build steps
    if not install_dependencies():
        sys.exit(1)
    
    if not compile_typescript():
        sys.exit(1)
    
    if not package_extension():
        sys.exit(1)
    
    if not install_extension():
        sys.exit(1)
    
    # Success!
    print("\n" + "=" * 50)
    print("🎉 Build & Install Complete!")
    print("=" * 50)
    print("\n📌 Next steps:")
    print("   1. Reload VS Code (Cmd+Shift+P → 'Reload Window')")
    print("   2. Open a .zef.md file")
    print("   3. See '▶ Run' above Python blocks")
    print("   4. Press Cmd+Shift+V for preview panel")
    print()

if __name__ == "__main__":
    main()
