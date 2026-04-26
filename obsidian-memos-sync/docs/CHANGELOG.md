# Changelog

All notable changes to Obsidian Memos Sync plugin.

## [1.1.0] - 2026-04-26

### ✨ Added
- **UID Validation** - Validates memo UIDs before sync, skips invalid ones
- **Smart Filename Generation** - Uses title → first line → UUID fallback
- **Better Push Logic** - Fixed `resolveUid()` in memoMap building
- **Detailed Logging** - Console logs show exactly what's syncing
- **Timestamp Tracking** - Tracks last sync time in settings and frontmatter

### 🐛 Fixed
- Push logic was using `m.uid` instead of `resolveUid(m)` - causing nulls
- Conflict detection had incorrect logic - removed complex conditions
- Title extraction failed for `#Title` (no space) - now supports both
- Added `getFirstLine()` fallback when no heading found
- `sanitizeFilename()` ensures Windows/Mac/Linux compatibility

### 📝 Documentation
- Added comprehensive README.md
- Added QUICKSTART.md for new users
- Added TROUBLESHOOTING.md for common issues
- Added this CHANGELOG.md

### 🚀 Improvements
- Larger file size (20.1kb) due to better error handling
- More console output for debugging
- Better error messages and logging

### ⚙️ Changes
- Removed complex conflict detection (now uses last-write-wins)
- Simplified push logic (compare body only)
- Changed filename strategy (smart detection)

---

## [1.0.0] - 2026-04-25

### ✨ Initial Release

**Core Features:**
- Bidirectional sync (Obsidian ↔ Memos)
- Pull memos from server to local notes
- Push edits from Obsidian to Memos
- Auto-sync with configurable intervals
- Manual sync via ribbon button
- Settings UI for configuration
- Delete local notes when removed from Memos

**Technical:**
- Uses Memos API v1
- Bearer token authentication
- Paginated fetch (100 memos per page)
- Frontmatter-based metadata storage
- TypeScript + Obsidian Plugin API

**Limitations:**
- Single sync folder (not multiple)
- Root-level files only (no subfolders)
- Simple title extraction (required space after #)
- Basic conflict handling

---

## Migration Guide

### From 1.0.0 to 1.1.0

**No data loss** - All existing notes preserved

**What changed:**
1. New notes will have better filenames
2. Old UUID-named files stay as-is (rename manually if desired)
3. Better error detection and reporting
4. Console logs are more detailed

**Recommended actions:**
1. Update plugin
2. Clear any notes with `uid: undefined`
3. Re-sync if needed
4. Read QUICKSTART.md for tips

---

## Known Issues

### Current Version (1.1.0)
- None reported

### Workarounds for Edge Cases
- **Empty memos** → Use filename fallback (uuid)
- **Very long titles** → Truncated to 200 chars
- **Special characters** → Stripped for filename safety
- **Rapid edits** → May merge if within same sync interval

---

## Roadmap (Future Versions)

### 1.2.0 (Planned)
- [ ] Support for sub-folders in sync
- [ ] Selective memo syncing (by tag/type)
- [ ] Conflict resolution UI (choose which version)
- [ ] Sync history and logs
- [ ] Custom filename templates

### 2.0.0 (Future)
- [ ] Multi-folder support
- [ ] Advanced filtering (query-based)
- [ ] Encrypted storage for tokens
- [ ] Sync statistics dashboard
- [ ] Bulk operations (archive, move)

---

## Versioning

Using semantic versioning: MAJOR.MINOR.PATCH

- **MAJOR** - Breaking changes
- **MINOR** - New features
- **PATCH** - Bug fixes

---

## Support

### Reporting Bugs
Include:
1. Version (check Settings → Community Plugins)
2. Error message
3. Steps to reproduce
4. Console logs (`Ctrl+Shift+I`)

### Requesting Features
Describe:
1. What you want to do
2. Why it would be useful
3. Any alternatives considered

---

## Credits

Built with:
- [Obsidian Plugin API](https://docs.obsidian.md/)
- [Memos](https://usememos.com/)
- TypeScript
- Node.js

---

## License

MIT License - Use and modify freely

---

## Archive

### 0.1.0 - 0.9.0 (Private Beta)
Early testing and development versions. Not released publicly.
