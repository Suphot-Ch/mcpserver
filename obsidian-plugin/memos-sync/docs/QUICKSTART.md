# Quick Start Guide

## Installation (5 min)

### Windows
```powershell
./install.ps1
```

### macOS/Linux
```bash
chmod +x install.sh
./install.sh
```

### Manual
Copy to: `~/.obsidian/plugins/obsidian-memos-sync/`

---

## Configuration (5 min)

### 1️⃣ Get API Token
- Open Memos: https://your-memos.com
- Settings → Access Tokens
- Create new (or copy existing)
- Copy token: `memos_pat_...`

### 2️⃣ Configure Plugin
- Obsidian Settings → Memos Sync Settings
- Paste Host URL: `https://your-memos.com`
- Paste API Token: `memos_pat_...`
- Click **Test Connection** ✅

### 3️⃣ Enable Auto Sync (Optional)
- Enable "Auto Sync"
- Set interval (e.g., 300000 = 5 min)

---

## Usage

### Sync Now
**Ribbon:** Click sync icon ↔️ in left sidebar
**Command:** Ctrl+P → "Sync with Memos"

### Edit in Obsidian
```
Open: Memos/[note].md
Edit: Change content (keep frontmatter)
Sync: Click sync button
Result: Changes appear on Memos server
```

### Edit on Memos
```
Open: https://memos.example.com
Edit: Change memo
Sync: Click sync in Obsidian
Result: Changes appear in Obsidian
```

---

## Common Tasks

| Task | Steps |
|------|-------|
| **Add title to note** | Add `# Title` at top of content (above text) |
| **Delete note** | Delete from Memos web, sync (if enabled) |
| **Change sync folder** | Settings → Notes Folder |
| **Sync every minute** | Settings → Sync Interval = 60000 |
| **View sync status** | Command: "Open Sync Modal" |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Connection failed | Verify URL, token, click Test Connection |
| Notes not updating | Reload Obsidian (Ctrl+Shift+R) |
| Can't find settings | Settings → Community Plugins → Memos Sync |
| Empty sync folder | Make sure bidirectional sync is enabled |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Sync Now | Ctrl+P → "Sync with Memos" |
| Open Settings | Ctrl+, (comma) |
| Open Sync Modal | Ctrl+P → "Open Sync Modal" |
| Reload Obsidian | Ctrl+Shift+R (Developer Toggle) |

---

## File Format

Each synced note has frontmatter (auto-managed):

```markdown
---
uid: AbCdEf123...
name: memos/AbCdEf123...
---

# Your Title Here

Your content...
```

✅ **Safe to edit:** Everything after `---`
❌ **Don't touch:** `uid`, `name` fields

---

## Tips

1. **Use one editor at a time** - Edit in Obsidian OR Memos, not both
2. **Check before deleting** - Deleted notes can't be recovered
3. **Test connection first** - Ensure API token is valid
4. **Monitor console** - Press Ctrl+Shift+I to see sync logs
5. **Use auto-sync** - Let plugin handle updates automatically

---

## Getting Help

- **Check README.md** for detailed documentation
- **Open dev console** (Ctrl+Shift+I) and search `[Memos Sync]` for logs
- **Review settings** - Most issues are config-related

---

**Ready to sync? 🚀**

Next: Configure plugin in Settings → Memos Sync Settings
