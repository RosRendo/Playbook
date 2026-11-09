#!/usr/bin/env bash
# Install Product Shipping OS Skills Globally on macOS/Linux
set -e

echo -e "\033[0;36m📦 Installing Product Shipping OS Skills...\033[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/../.agents/skills"
TARGET_DIR="$HOME/.gemini/config/skills"

mkdir -p "$TARGET_DIR"

for skill in "$SOURCE_DIR"/*/; do
    skill_name=$(basename "$skill")
    echo -e "\033[0;32m -> Installing skill: $skill_name\033[0m"
    cp -r "$skill" "$TARGET_DIR/"
done

echo -e "\033[0;36m✨ All skills successfully installed globally!\033[0m"
echo -e "You can now use /ship-mvp, /ship-arch, /ship-design, /ship-slice, /ship-pay, /ship-test, /ship-scale, /ship-audit, /ship-fix in any project!"
