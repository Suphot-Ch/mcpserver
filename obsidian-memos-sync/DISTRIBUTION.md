# Distribution Guide

## Building a Release

### 1. Build the Plugin
```bash
npm run build
```
Output: `main.js` (in root, 20.1kb)

### 2. Package for Distribution
```bash
npm run dist
# or manually:
node scripts/package.js
```

Output: `dist/` folder with:
- main.js
- manifest.json
- styles.css
- package.json

### 3. Verify Distribution
```bash
ls -la dist/
```

Should show 4 files ready for distribution.

---

## Releasing to Users

### Option A: GitHub Release (Recommended)
```bash
# Create zip file
cd dist
zip -r obsidian-memos-sync-v1.1.0.zip .

# Upload to GitHub release
# Then share link to users
```

### Option B: Direct Installation
Users run:
```powershell
./scripts/install.ps1          # Windows
# or
./scripts/install.sh           # macOS/Linux
```

### Option C: Manual
Users copy `dist/*` to:
```
~/.obsidian/plugins/obsidian-memos-sync/
```

---

## Distribution Checklist

Before releasing:

- [ ] Test build locally: `npm run build`
- [ ] No TypeScript errors: `npm run build`
- [ ] All files in `dist/`:
  - [ ] main.js (compiled)
  - [ ] manifest.json (metadata)
  - [ ] styles.css (styling)
  - [ ] package.json (info)
- [ ] Version updated in:
  - [ ] package.json
  - [ ] manifest.json (if versioned)
- [ ] Documentation up-to-date:
  - [ ] docs/README.md
  - [ ] docs/CHANGELOG.md
- [ ] Git status clean:
  - [ ] All changes committed
  - [ ] No unstaged files

---

## Version Bumping

When releasing new version:

1. Update `package.json`:
```json
{
  "version": "1.1.0"
}
```

2. Update `manifest.json` (if it has version):
```json
{
  "version": "1.1.0"
}
```

3. Update `docs/CHANGELOG.md`:
```md
## [1.1.0] - 2026-04-26
### Added
- Feature description
```

4. Commit and tag:
```bash
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push && git push --tags
```

---

## GitHub Release Template

When creating release on GitHub:

**Title:** v1.1.0

**Body:**
```
## 🎉 Version 1.1.0

### ✨ New Features
- Smart filename generation
- UID validation
- Better error logging

### 🐛 Bug Fixes
- Fixed push logic
- Improved conflict detection

### 📚 Documentation
- Added comprehensive guides
- Updated troubleshooting

### 📦 Downloads
- obsidian-memos-sync-v1.1.0.zip

### 🔗 Links
- [README](docs/README.md)
- [Changelog](docs/CHANGELOG.md)
- [Issues](../../issues)
```

---

## File Structure for Release

```
obsidian-memos-sync-v1.1.0.zip
├── main.js              (20.1kb)
├── manifest.json        (292b)
├── styles.css          (1.2kb)
├── package.json        (708b)
└── README.md           (guide)
```

Users extract to: `~/.obsidian/plugins/obsidian-memos-sync/`

---

## Verification

After packaging, verify:

```bash
# Check dist folder
ls -lh dist/

# Check file sizes
file dist/main.js
file dist/manifest.json

# Test build is valid
head -1 dist/main.js  # Should show banner comment
```

---

## Troubleshooting Distribution

### dist/ folder empty?
```bash
npm run build          # Build first
node scripts/package.js  # Then package
```

### Files not copied?
```bash
# Check if files exist in root
ls -l main.js manifest.json styles.css package.json

# Manually copy if needed
cp main.js dist/
cp manifest.json dist/
cp styles.css dist/
```

### Need to rebuild?
```bash
rm dist/*              # Clear old files
npm run dist          # Rebuild everything
```

---

## Continuous Integration

For CI/CD pipeline (GitHub Actions):

```yaml
- name: Build and Package
  run: |
    npm install
    npm run dist
    
- name: Upload Release Asset
  uses: actions/upload-release-asset@v1
  with:
    asset_path: dist/
```

---

## Size Optimization

Current distribution size: ~23KB

To reduce:
- Remove comments from main.js (already minified)
- Don't include package-lock.json (only package.json)
- Keep manifest.json minimal

Trade-off: Readability vs size (currently good balance)

---

**Ready to release! 🚀**
