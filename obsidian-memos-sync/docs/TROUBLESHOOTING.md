# Troubleshooting Guide

## Connection Issues

### ❌ "Connection failed" or "API error"

**Check:**
1. ✅ Verify Memos URL is correct
   - Format: `https://your-memos.com` (no trailing slash)
   - Not: `https://your-memos.com/`

2. ✅ Verify API token
   - Copy from: Memos → Settings → Access Tokens
   - Format: `memos_pat_...` (starts with "memos_pat_")
   - Not expired or revoked

3. ✅ Check connectivity
   - Can you access Memos in browser?
   - VPN connected if needed?
   - Firewall/proxy blocking?

**Fix:**
```
1. Settings → Memos Sync Settings
2. Delete and re-paste credentials
3. Click "Test Connection"
4. Should show: "✅ Connected! Found X memos."
```

---

## Sync Not Working

### ❌ Memos not updating when I edit in Obsidian

**Likely cause:** Push (Obsidian → Memos) is failing

**Debug:**
1. Open Obsidian dev console: `Ctrl+Shift+I`
2. Click "Console" tab
3. Look for errors with `[Memos Sync]`
4. Note any error messages

**Check:**
- ✅ "Push Changes to Memos" is enabled
- ✅ File is in correct folder (`Memos/`)
- ✅ File has valid frontmatter (`uid`, `name`)
- ✅ API token has write permission

**If Error: "uid undefined"**
- Delete the note (both Obsidian & Memos)
- Update plugin to latest version
- Re-sync to create with valid UID

---

### ❌ Obsidian notes not updating when I edit on Memos

**Likely cause:** Pull (Memos → Obsidian) is skipped or failing

**Debug:**
1. Manual sync: Click sync button
2. Check "Pulled X memos. Writing notes..."
3. Open console: Look for errors

**Check:**
- ✅ "Create Notes from Memos" is enabled
- ✅ Notes folder exists and is writable
- ✅ No file permission issues
- ✅ Disk has free space

**If Creating Duplicates:**
- Check sync folder for duplicate files
- Delete and re-sync
- Only one file per memo UID should exist

---

## Filename Issues

### ❌ All notes have UUID filenames (e.g., `AbCdEf123.md`)

**Cause:** Memos have no titles, using fallback

**Fix - Option A (Recommended):**
1. Edit memo in Obsidian
2. Add title at top: `# My Title`
3. Sync
4. Filename updates automatically ✅

**Fix - Option B:**
1. Edit each memo on Memos web
2. Add text at start (will use as fallback)
3. Sync
4. Filename updates ✅

---

### ❌ Filename has strange characters

**Cause:** Special characters removed for safety

**Expected Behavior:**
- `/ \ : * ? " < > |` are removed
- Spaces are preserved
- Max 200 characters

**Example:**
```
Original: "Project #1: Q&A (API)"
Filename: "Project #1 Q&A (API).md"
```

---

## Sync Behavior Issues

### ❌ Syncing too frequently (eating bandwidth)

**Cause:** Sync interval too short

**Fix:**
```
Settings → Sync Interval: 300000 (5 min minimum)
Don't set below 60000 (1 min)
```

**If CPU/battery draining:**
- Increase interval to 600000+ (10 min)
- Disable auto-sync, use manual only
- Check Memos server isn't slow

---

### ❌ Not syncing automatically

**Check:**
1. ✅ "Auto Sync" is enabled (toggle on)
2. ✅ Obsidian is open and focused
3. ✅ Sync interval has passed
4. ✅ No errors in console

**Restart Auto-Sync:**
1. Settings → Disable "Auto Sync"
2. Wait 5 seconds
3. Enable "Auto Sync" again

---

### ❌ Conflict: Both sides changed

**Scenario:**
```
You edit in Obsidian AND on Memos Web
Both changes exist
What happens?
```

**Behavior:**
- Last change wins (local takes priority)
- Check timestamp in frontmatter (`updateTime`)
- Manually resolve if needed

**Prevention:**
- Edit in one place only
- Check timestamps before editing
- Use Obsidian as primary editor

---

## File/Folder Issues

### ❌ "Memos folder not found"

**Cause:** Folder doesn't exist or permission denied

**Fix:**
1. Settings → Notes Folder: confirm path
2. Create folder manually if missing:
   - File explorer → Obsidian vault
   - Create `Memos` folder
3. Check permissions (should be readable/writable)

---

### ❌ Notes in subfolders not syncing

**Note:** Only root-level files in sync folder are synced

**Current behavior:**
```
Synced:      Memos/note.md
NOT synced:  Memos/subfolder/note.md
```

**Workaround:**
- Organize with prefixes: `Memos/work-note.md`
- Use Obsidian tags for grouping
- Create separate Memos folders (manual)

---

### ❌ Can't modify or delete notes

**Possible cause:** File permission issue

**Check:**
- ✅ File is not read-only
- ✅ Folder is writable
- ✅ Not running as restricted user
- ✅ Disk not full

**Fix:**
```
Windows:  Right-click → Properties → uncheck "Read-only"
Mac/Linux: chmod 644 [filename]
```

---

## Console Errors

### `[Memos Sync] Push error: Network error`

**Cause:** Can't reach Memos server

**Fix:**
- Check internet connection
- Verify Memos server is online
- Check firewall/VPN settings
- Try manual sync again

---

### `[Memos Sync] Skipped X memos with invalid UIDs`

**Cause:** Some memos don't have valid UIDs (old plugin bug)

**Fix:**
- Delete affected memos from Memos web
- Update plugin to latest version
- Re-sync creates with valid UIDs

---

### `[Memos Sync] Conflict detected`

**Cause:** Both Obsidian and Memos changed this memo

**Action:** Plugin skips push to avoid overwriting

**Resolution:**
1. Check which version you want
2. Manually edit to preferred version
3. Sync to update other side

---

## Performance Issues

### ⚠️ Slow sync / lag

**Cause:** Too many memos or large content

**Optimize:**
1. Reduce sync frequency (longer interval)
2. Archive old memos (delete or hide)
3. Split large notes
4. Check internet speed

---

### ⚠️ High CPU/memory usage

**Check:**
1. Is sync running? (check status)
2. Is Memos server slow?
3. Many large notes?

**Fix:**
- Disable auto-sync, use manual
- Increase sync interval
- Reduce notes folder size
- Restart Obsidian

---

## Data Loss / Recovery

### 😱 Accidentally deleted notes

**If deleted locally only:**
- Sync will pull from Memos ✅
- Notes recover automatically

**If deleted from Memos web:**
- Can't recover from Obsidian
- Check Memos trash (if available)
- Restore from backup

**Prevention:**
- Enable "Delete Local" only if sure
- Backup Memos regularly
- Test before enabling delete sync

---

## Getting More Help

### Enable Debug Logging

Open console and run:
```javascript
localStorage.setItem('debug', '*')
```

Restart Obsidian and check console for detailed logs.

### Collect Debug Info

When reporting issues, include:
```
1. Obsidian version: Settings → About
2. Plugin version: Settings → Community Plugins
3. Memos version: Memos → Settings → About
4. Full error message from console
5. Steps to reproduce
```

### Clear Plugin Cache

Reset plugin settings (resets credentials!):
```
1. Delete: ~/.obsidian/plugins/obsidian-memos-sync/data.json
2. Restart Obsidian
3. Reconfigure settings
```

---

## Still Not Working?

1. ✅ Read README.md for detailed docs
2. ✅ Check all items in this guide
3. ✅ Try manual sync with fresh credentials
4. ✅ Restart Obsidian (Ctrl+Shift+R)
5. ✅ Reinstall plugin
6. ✅ Report issue with debug info

**Good luck! 🍀**
