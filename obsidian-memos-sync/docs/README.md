# Obsidian Memos Sync Plugin

Bidirectional sync plugin for Obsidian that syncs notes with Memos.

## Features

- Bidirectional sync (Obsidian ↔ Memos)
- Auto sync at intervals
- Smart filename generation (title → first line → uid)
- UID validation before sync
- Timestamp tracking
- Optional delete sync
- Detailed logging

## Installation

### Automatic (Recommended)

**Windows:**
```powershell
./install.ps1
```

**macOS/Linux:**
```bash
chmod +x install.sh
./install.sh
```

### Manual

Copy plugin folder to:
- Windows: `%APPDATA%\.obsidian\plugins\obsidian-memos-sync\`
- macOS: `~/.obsidian/plugins/obsidian-memos-sync/`
- Linux: `~/.obsidian/plugins/obsidian-memos-sync/`

Then reload Obsidian.

## Configuration

1. Settings → Memos Sync Settings
2. Enter Host URL (e.g., https://memos.example.com)
3. Enter API Token (from Memos → Settings → Access Tokens)
4. Click Test Connection
5. Configure sync options (auto sync, interval, etc)

## Usage

### Manual Sync
- Click sync icon in ribbon OR
- Command: "Sync with Memos"

### Auto Sync
- Enable "Auto Sync" in settings
- Choose interval (default: 5 min)

### Editing

**In Obsidian:**
- Edit any file in Memos folder
- Save and sync
- Changes pushed to Memos

**In Memos:**
- Edit memo on web
- Sync in Obsidian
- Changes pulled automatically

## Filename Generation

Priority order:
1. Markdown heading (`# Title` or `#Title`)
2. First line of content
3. UUID fallback

## Troubleshooting

**Connection failed?**
- Check URL and token
- Click Test Connection

**Notes not syncing?**
- Reload Obsidian
- Check Auto Sync is enabled
- Look for errors in dev console (Ctrl+Shift+I)

**Undefined UIDs?**
- Delete and re-sync
- Make sure plugin is latest version

## API Reference

- Fetch: `GET /api/v1/memos`
- Update: `PATCH /api/v1/memos/{uid}`
- Auth: Bearer token in header

## Security

- Store tokens securely
- Use HTTPS for Memos server
- Don't commit tokens to version control

## License

MIT
