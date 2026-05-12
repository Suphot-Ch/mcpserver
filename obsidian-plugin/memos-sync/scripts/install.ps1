# Obsidian Memos Sync Plugin - Installation Script (Windows)

Write-Host "🔄 Obsidian Memos Sync - Windows Installation" -ForegroundColor Cyan
Write-Host ""

# Get Obsidian plugins directory
$ObsidianDir = "$env:APPDATA\.obsidian\plugins"
$PluginDir = "$ObsidianDir\obsidian-memos-sync"

# Check if .obsidian exists
if (-not (Test-Path $ObsidianDir)) {
    Write-Host "❌ Error: Obsidian plugins directory not found" -ForegroundColor Red
    Write-Host "   Expected: $ObsidianDir" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure Obsidian is installed and has created the .obsidian directory."
    exit 1
}

Write-Host "📁 Obsidian plugins folder: $ObsidianDir" -ForegroundColor Green
Write-Host ""

# Remove old plugin if exists
if (Test-Path $PluginDir) {
    Write-Host "🔄 Removing old installation..."
    Remove-Item -Path $PluginDir -Recurse -Force
}

# Create plugin directory
Write-Host "📦 Creating plugin directory..."
New-Item -ItemType Directory -Path $PluginDir -Force | Out-Null

# Copy plugin files
Write-Host "📋 Copying plugin files..."
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$filesToCopy = @(
    "main.js",
    "manifest.json",
    "styles.css"
)

foreach ($file in $filesToCopy) {
    $source = Join-Path $ScriptDir $file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $PluginDir
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Missing: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Reload Obsidian (Ctrl+R or close and reopen)"
Write-Host "   2. Enable plugin: Settings → Community Plugins → Memos Sync"
Write-Host "   3. Configure: Settings → Memos Sync Settings"
Write-Host "      - Add Memos Host URL"
Write-Host "      - Add API Token"
Write-Host "      - Click 'Test Connection'"
Write-Host ""
Write-Host "🎉 Ready to sync!" -ForegroundColor Cyan
