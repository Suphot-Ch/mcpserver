#!/bin/bash

# Obsidian Memos Sync Plugin - Installation Script (macOS/Linux)

echo "🔄 Obsidian Memos Sync - macOS/Linux Installation"
echo ""

# Detect OS and set Obsidian path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    OBSIDIAN_DIR="$HOME/.obsidian/plugins"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    OBSIDIAN_DIR="$HOME/.obsidian/plugins"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

PLUGIN_DIR="$OBSIDIAN_DIR/obsidian-memos-sync"

# Check if .obsidian exists
if [ ! -d "$OBSIDIAN_DIR" ]; then
    echo "❌ Error: Obsidian plugins directory not found"
    echo "   Expected: $OBSIDIAN_DIR"
    echo ""
    echo "Make sure Obsidian is installed and has created the .obsidian directory."
    exit 1
fi

echo "📁 Obsidian plugins folder: $OBSIDIAN_DIR"
echo ""

# Remove old plugin if exists
if [ -d "$PLUGIN_DIR" ]; then
    echo "🔄 Removing old installation..."
    rm -rf "$PLUGIN_DIR"
fi

# Create plugin directory
echo "📦 Creating plugin directory..."
mkdir -p "$PLUGIN_DIR"

# Copy plugin files
echo "📋 Copying plugin files..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

FILES=(
    "main.js"
    "manifest.json"
    "styles.css"
)

for file in "${FILES[@]}"; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        cp "$SCRIPT_DIR/$file" "$PLUGIN_DIR/"
        echo "   ✅ $file"
    else
        echo "   ⚠️  Missing: $file"
    fi
done

echo ""
echo "✅ Installation complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Reload Obsidian (Ctrl+R or close and reopen)"
echo "   2. Enable plugin: Settings → Community Plugins → Memos Sync"
echo "   3. Configure: Settings → Memos Sync Settings"
echo "      - Add Memos Host URL"
echo "      - Add API Token"
echo "      - Click 'Test Connection'"
echo ""
echo "🎉 Ready to sync!"
