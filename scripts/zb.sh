#!/bin/bash
# Quick alias to run the Zef build script
# Add this to your .zshrc or .bashrc:
#   alias zb='python3 /path/to/zef-vscode-extension/scripts/build.py'
#
# Or source this file to get the zb function:
#   source /path/to/zef-vscode-extension/scripts/zb.sh

zb() {
    python3 "$(dirname "${BASH_SOURCE[0]}")/build.py" "$@"
}

# If script is executed directly (not sourced), run the build
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    python3 "$(dirname "$0")/build.py" "$@"
fi
