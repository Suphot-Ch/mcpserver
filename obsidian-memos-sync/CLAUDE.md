# Obsidian Memos Sync Plugin

## Overview
An Obsidian plugin that enables syncing notes between Obsidian and the Memos API. Features include manual sync, automatic scheduled sync, and a native UI modal.

## Project Structure
```
obsidian-memos-sync/
├── main.ts           # Plugin entry point with SyncModal and MemosSyncPlugin classes
├── manifest.json     # Plugin metadata for Obsidian
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── esbuild.config.mjs # Build configuration
├── styles.css        # UI styling
└── README.md         # Plugin documentation
```

## Key Components

### main.ts
- **MemosSyncPlugin**: Main plugin class
  - Loads/saves settings
  - Manages sync commands and auto-sync intervals
  - Integrates with Obsidian API

- **SyncModal**: Modal UI for manual sync
  - Displays sync status
  - Provides sync button
  - Shows last sync timestamp

- **MemosSyncSettingTab**: Settings interface
  - API URL and token configuration
  - Auto-sync toggle and interval settings
  - Connection test button

### Settings Schema
```typescript
{
  memosApiUrl: string,       // Memos instance URL
  memosApiToken: string,     // API authentication token
  autoSync: boolean,         // Enable automatic syncing
  syncInterval: number       // Sync interval in milliseconds
}
```

## Build & Development
- `npm install` - Install dependencies
- `npm run dev` - Build with watch mode
- `npm run build` - Production build

## API Integration
Connects to Memos API at `/api/v1/memos` endpoint with Bearer token authentication.

## Future Enhancements
- Bidirectional sync (Obsidian ↔ Memos)
- Selective note syncing with filtering
- Conflict resolution for edited notes
- Sync history and logs
- Custom tag mapping between systems
