import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  Modal,
  Notice,
  TFolder,
  TFile,
} from 'obsidian';

// ── Settings ──────────────────────────────────────────────────────────────────

interface MemosSyncSettings {
  memosApiUrl: string;
  memosApiToken: string;
  autoSync: boolean;
  syncInterval: number;
  createNotes: boolean;
  notesFolder: string;
  bidirectionalSync: boolean;
  syncDeletedNotes: boolean;
  lastSyncTime?: number; // timestamp of last successful sync
}

const DEFAULT_SETTINGS: MemosSyncSettings = {
  memosApiUrl: 'https://mem.supht.com',
  memosApiToken: '',
  autoSync: false,
  syncInterval: 300000, // 5 minutes
  createNotes: true,
  notesFolder: 'Memos',
  bidirectionalSync: true,
  syncDeletedNotes: false, // default off — safer
};

// ── Memos API types ───────────────────────────────────────────────────────────

interface Memo {
  name: string;        // e.g. "memos/AbCdEf..."
  uid: string;
  content: string;
  createTime: string;
  updateTime: string;
  visibility: string;
  tags?: string[];
}

interface ListMemosResponse {
  memos: Memo[];
  nextPageToken?: string;
}

// ── Sync Modal ────────────────────────────────────────────────────────────────

class SyncModal extends Modal {
  plugin: MemosSyncPlugin;
  statusEl!: HTMLElement;

  constructor(app: App, plugin: MemosSyncPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '🔄 Sync with Memos' });

    this.statusEl = contentEl.createEl('div', { cls: 'sync-status' });
    this.statusEl.createEl('p', { text: 'Ready to sync.' });

    const btnRow = contentEl.createEl('div', { cls: 'sync-buttons' });

    const syncBtn = btnRow.createEl('button', {
      text: 'Sync Now',
      cls: 'mod-cta',
    });
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing…';
      await this.runSync();
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync Now';
    });

    btnRow.createEl('button', { text: 'Close' }).addEventListener('click', () =>
      this.close()
    );
  }

  private setStatus(msg: string) {
    const p = this.statusEl.querySelector('p');
    if (p) p.textContent = msg;
  }

  private async runSync() {
    const { settings } = this.plugin;

    if (!settings.memosApiUrl || !settings.memosApiToken) {
      new Notice('⚠️ Please configure Memos API settings first.');
      this.setStatus('❌ Missing API settings.');
      return;
    }

    try {
      this.setStatus('📡 Fetching all memos…');
      let memos = await this.plugin.fetchAllMemos();

      // Validate & filter memos with valid UIDs before sync
      const validMemos = this.plugin.validateAndFilterMemos(memos);
      const skipped = memos.length - validMemos.length;
      this.setStatus(`📥 Pulled ${memos.length} memos${skipped > 0 ? ` (${skipped} invalid)` : ''}. Writing notes…`);

      let created = 0;
      let updated = 0;

      if (settings.bidirectionalSync) {
        await this.plugin.pushChangesToMemos(validMemos);
      }

      if (settings.createNotes) {
        ({ created, updated } = await this.plugin.createNotesFromMemos(validMemos));
      }

      if (settings.syncDeletedNotes) {
        await this.plugin.syncDeletedNotes(validMemos);
      }

      // Mark sync time after successful sync
      this.plugin.settings.lastSyncTime = Date.now();
      await this.plugin.saveSettings();

      const msg =
        `✅ Done — ${validMemos.length}/${memos.length} memos total` +
        (created > 0 ? `, ${created} created` : '') +
        (updated > 0 ? `, ${updated} updated` : '') +
        (skipped > 0 ? `, ${skipped} skipped` : '');

      new Notice(msg);
      this.setStatus(`${msg}\n(${new Date().toLocaleString()})`);
    } catch (err: any) {
      const msg = `❌ Sync failed: ${err.message}`;
      new Notice(msg);
      this.setStatus(msg);
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── Main Plugin ───────────────────────────────────────────────────────────────

export default class MemosSyncPlugin extends Plugin {
  settings!: MemosSyncSettings;
  private autoSyncTimer: number | null = null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MemosSyncSettingTab(this.app, this));

    // Ribbon button
    this.addRibbonIcon('arrows-repeat', 'Sync with Memos', async () => {
      new Notice('🔄 Syncing with Memos…');
      await this.performSync();
    });

    // Commands
    this.addCommand({
      id: 'sync-now',
      name: 'Sync with Memos',
      callback: async () => {
        new Notice('🔄 Syncing with Memos…');
        await this.performSync();
      },
    });

    this.addCommand({
      id: 'open-sync-modal',
      name: 'Open Sync Modal',
      callback: () => new SyncModal(this.app, this).open(),
    });

    if (this.settings.autoSync) {
      this.startAutoSync();
    }
  }

  onunload() {
    this.stopAutoSync();
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    if (this.settings.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  // ── Auto sync ────────────────────────────────────────────────────────────────

  private startAutoSync() {
    this.stopAutoSync();
    this.autoSyncTimer = window.setInterval(
      () => this.performSync(),
      this.settings.syncInterval
    );
  }

  private stopAutoSync() {
    if (this.autoSyncTimer !== null) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  // ── Core sync ────────────────────────────────────────────────────────────────

  private async performSync(): Promise<void> {
    const { settings } = this;
    if (!settings.memosApiUrl || !settings.memosApiToken) return;

    try {
      let memos = await this.fetchAllMemos();

      // Validate & filter memos with valid UIDs before sync
      const validMemos = this.validateAndFilterMemos(memos);
      const skipped = memos.length - validMemos.length;
      if (skipped > 0) {
        console.warn(`[Memos Sync] Skipped ${skipped} memos with invalid UIDs`);
      }

      if (settings.bidirectionalSync) {
        await this.pushChangesToMemos(validMemos);
      }
      if (settings.createNotes) {
        await this.createNotesFromMemos(validMemos);
      }
      if (settings.syncDeletedNotes) {
        await this.syncDeletedNotes(validMemos);
      }

      // Mark sync time after successful sync
      this.settings.lastSyncTime = Date.now();
      await this.saveSettings();

      console.log(
        `[Memos Sync] Auto sync complete — ${validMemos.length}/${memos.length} memos`
      );
    } catch (err: any) {
      console.error('[Memos Sync] Auto sync failed:', err.message);
    }
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  validateAndFilterMemos(memos: Memo[]): Memo[] {
    return memos.filter((memo) => {
      const uid = this.resolveUid(memo);
      if (!uid || uid === 'undefined' || uid.trim() === '') {
        console.warn(
          `[Memos Sync] Invalid UID for memo: ${memo.name} — skipping`
        );
        return false;
      }
      return true;
    });
  }

  // ── Memos API — Paginated fetch ──────────────────────────────────────────────

  async fetchAllMemos(): Promise<Memo[]> {
    const { memosApiUrl, memosApiToken } = this.settings;
    const all: Memo[] = [];
    let pageToken = '';

    do {
      const url = new URL(`${memosApiUrl}/api/v1/memos`);
      url.searchParams.set('pageSize', '100');
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${memosApiToken}` },
      });

      if (!res.ok) {
        throw new Error(`API ${res.status}: ${res.statusText}`);
      }

      const data: ListMemosResponse = await res.json();
      const page = Array.isArray(data) ? data : data.memos ?? [];
      all.push(...page);
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);

    return all;
  }

  // ── Pull: Memos → Obsidian notes ─────────────────────────────────────────────

  async createNotesFromMemos(
    memos: Memo[]
  ): Promise<{ created: number; updated: number }> {
    const folder = this.settings.notesFolder;
    let created = 0;
    let updated = 0;
    const lastSyncTime = this.settings.lastSyncTime || 0;

    // Ensure folder exists
    try { await this.app.vault.createFolder(folder); } catch { /* already exists */ }

    // Pre-pass: count how many memos share the same sanitized title
    // so we can append short uid to disambiguate duplicates
    const titleCount = new Map<string, number>();
    for (const memo of memos) {
      const title = this.extractTitle(memo.content);
      if (title) {
        const key = this.sanitizeFilename(title);
        titleCount.set(key, (titleCount.get(key) || 0) + 1);
      }
    }

    for (const memo of memos) {
      const uid = this.resolveUid(memo);
      if (!uid) continue;

      const memoUpdateTime = this.parseTimestamp(memo.updateTime);

      // Only update if memo changed on server since last sync
      if (memoUpdateTime <= lastSyncTime) continue;

      try {
        // Find existing file by UID (scan folder for uid in frontmatter)
        const existingFile = await this.findFileByUid(folder, uid);

        if (existingFile) {
          // File exists: update it
          const current = await this.app.vault.read(existingFile);
          const localBody = this.extractBody(current);
          const memoBody = memo.content.trim();

          if (localBody !== memoBody) {
            const fileContent = this.memoToMarkdown(memo);

            // Check if filename needs to change (title changed)
            const newName = this.generateFilename(memo, titleCount);
            if (existingFile.name !== `${newName}.md`) {
              // Rename file if title changed
              const newPath = `${folder}/${newName}.md`;
              await this.app.vault.rename(existingFile, newPath);
            } else {
              // Just update content
              await this.app.vault.modify(existingFile, fileContent);
            }
            updated++;
          }
        } else {
          // File doesn't exist: create new one
          const filename = this.generateFilename(memo, titleCount);
          const filepath = `${folder}/${filename}.md`;
          const fileContent = this.memoToMarkdown(memo);
          await this.app.vault.create(filepath, fileContent);
          created++;
        }
      } catch (err: any) {
        console.error(`[Memos Sync] Error syncing ${uid}:`, err.message);
      }
    }

    return { created, updated };
  }

  private async findFileByUid(folder: string, targetUid: string): Promise<TFile | null> {
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return null;

    for (const child of folderObj.children) {
      if (!(child instanceof TFile) || !child.name.endsWith('.md')) continue;

      try {
        const raw = await this.app.vault.read(child);
        const uid = this.extractFrontmatter(raw, 'uid');
        if (uid === targetUid) return child;
      } catch {
        // Continue searching
      }
    }

    return null;
  }

  private generateFilename(memo: Memo, titleCount?: Map<string, number>): string {
    // Smart title generation: title → first line → uid
    const title = this.extractTitle(memo.content);
    const firstLine = this.getFirstLine(memo.content);
    const uid = this.resolveUid(memo) || 'unknown';
    
    if (title) {
      const sanitized = this.sanitizeFilename(title);
      // If more than one memo shares this title, append short uid (8 chars)
      return (titleCount?.get(sanitized) || 0) > 1
        ? `${sanitized} (${uid.slice(0, 8)})`
        : sanitized;
    }

    const baseName = firstLine || uid || 'untitled';
    return this.sanitizeFilename(baseName);
  }

  private memoToMarkdown(memo: Memo): string {
    const uid = this.resolveUid(memo) || 'unknown';

    // Extract title for alias (readable name)
    const title = this.extractTitle(memo.content);
    const firstLine = this.getFirstLine(memo.content);
    const displayName = title || firstLine || uid;
    const aliasLine = displayName !== uid ? `aliases: [${JSON.stringify(displayName)}]` : '';

    const parts = [
      '---',
      `uid: ${uid}`,
      `name: ${memo.name}`,
      `createTime: ${memo.createTime}`,
      `updateTime: ${memo.updateTime}`,
      `lastSyncTime: ${Date.now()}`,
      `visibility: ${memo.visibility}`,
    ];

    if (aliasLine) parts.push(aliasLine);
    parts.push('---', '', memo.content);

    return parts.join('\n');
  }

  // ── Push: Obsidian notes → Memos ─────────────────────────────────────────────

  async pushChangesToMemos(memos: Memo[]): Promise<number> {
    if (!this.settings.bidirectionalSync) return 0;

    const folder = this.settings.notesFolder;
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return 0;

    // Build uid → memo map using resolveUid()
    const memoMap = new Map<string, Memo>();
    for (const m of memos) {
      const uid = this.resolveUid(m);
      if (uid) memoMap.set(uid, m);
    }
    let updated = 0;
    let created = 0;

    for (const child of folderObj.children) {
      if (!(child instanceof TFile) || !child.name.endsWith('.md')) continue;

      try {
        const raw = await this.app.vault.read(child);
        const uid = this.extractFrontmatter(raw, 'uid');
        const memoName = this.extractFrontmatter(raw, 'name');
        const localBody = this.extractBody(raw);

        // Case 1: File has uid → Update existing memo
        if (uid && memoName) {
          const memo = memoMap.get(uid);
          if (!memo) continue;

          const memoBody = memo.content.trim();
          if (localBody === memoBody) continue; // No change

          console.log(`[Memos Sync] Pushing changes for ${child.name}...`);
          const ok = await this.updateMemoApi(memoName, localBody);
          if (ok) {
            updated++;
            console.log(`[Memos Sync] ✅ Pushed: ${child.name}`);
          } else {
            console.error(`[Memos Sync] ❌ Failed to push: ${child.name}`);
          }
        }
        // Case 2: File has no uid → Create new memo
        else if (localBody.trim()) {
          console.log(`[Memos Sync] Creating new memo from ${child.name}...`);
          const newMemoName = await this.createMemoApi(localBody);
          if (newMemoName) {
            // Update file with new uid and name
            await this.updateFileWithMemoInfo(child, newMemoName);
            created++;
            console.log(`[Memos Sync] ✅ Created: ${child.name}`);
          } else {
            console.error(`[Memos Sync] ❌ Failed to create: ${child.name}`);
          }
        }
      } catch (err: any) {
        console.error(`[Memos Sync] Push error ${child.name}:`, err.message);
      }
    }

    if (updated > 0 || created > 0) {
      console.log(`[Memos Sync] Successfully pushed ${updated} change(s), created ${created} new memo(s)`);
    }

    return updated + created;
  }

  private async updateMemoApi(memoName: string, content: string): Promise<boolean> {
    const { memosApiUrl, memosApiToken } = this.settings;
    try {
      const res = await fetch(`${memosApiUrl}/api/v1/${memoName}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${memosApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async createMemoApi(content: string): Promise<string | null> {
    const { memosApiUrl, memosApiToken } = this.settings;
    try {
      const res = await fetch(`${memosApiUrl}/api/v1/memos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memosApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, visibility: 'PRIVATE' }),
      });

      if (!res.ok) return null;

      const data = await res.json() as Memo;
      return data.name; // e.g., "memos/AbCdEf123..."
    } catch (err: any) {
      console.error('[Memos Sync] Create memo error:', err.message);
      return null;
    }
  }

  private async updateFileWithMemoInfo(file: TFile, memoName: string): Promise<void> {
    try {
      const raw = await this.app.vault.read(file);
      const body = this.extractBody(raw);

      // Extract uid from memoName (format: "memos/<uid>")
      const uid = memoName.split('/').pop() || 'unknown';

      // Create new frontmatter
      const memo = { name: memoName, uid } as Partial<Memo>;
      const newContent = [
        '---',
        `uid: ${uid}`,
        `name: ${memoName}`,
        `createTime: ${new Date().toISOString()}`,
        `updateTime: ${new Date().toISOString()}`,
        `lastSyncTime: ${Date.now()}`,
        'visibility: PRIVATE',
        '---',
        '',
        body,
      ].join('\n');

      await this.app.vault.modify(file, newContent);
    } catch (err: any) {
      console.error('[Memos Sync] Update file error:', err.message);
    }
  }

  // ── Sync deleted notes ────────────────────────────────────────────────────────

  async syncDeletedNotes(memos: Memo[]): Promise<void> {
    if (!this.settings.syncDeletedNotes) return;

    const folder = this.settings.notesFolder;
    const folderObj = this.app.vault.getAbstractFileByPath(folder);
    if (!(folderObj instanceof TFolder)) return;

    const uidSet = new Set(memos.map((m) => this.resolveUid(m)).filter(Boolean));

    for (const child of folderObj.children) {
      if (!(child instanceof TFile) || !child.name.endsWith('.md')) continue;

      try {
        const raw = await this.app.vault.read(child);
        const uid = this.extractFrontmatter(raw, 'uid');
        if (uid && !uidSet.has(uid)) {
          await this.app.vault.delete(child);
          console.log(`[Memos Sync] Deleted local note for removed memo: ${uid}`);
        }
      } catch (err: any) {
        console.error(`[Memos Sync] Delete error ${child.name}:`, err.message);
      }
    }
  }

  // ── Frontmatter helpers ───────────────────────────────────────────────────────

  /** Extract title from content: match #Title or # Title (with or without space) */
  private extractTitle(content: string): string | null {
    if (!content) return null;
    const match = content.match(/^#+\s*(.+?)(?:\n|$)/m);
    return match ? match[1].trim() : null;
  }

  /** Get first non-empty line as fallback title */
  private getFirstLine(content: string): string | null {
    if (!content) return null;
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        return trimmed.slice(0, 100); // limit to 100 chars
      }
    }
    return null;
  }

  /** Sanitize string to safe filename (Windows/Mac/Linux compatible) */
  private sanitizeFilename(name: string): string {
    return (
      name
        .replace(/[\\/:*?"<>|]/g, '') // remove forbidden chars
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim()
        .slice(0, 200) // max length
      || 'untitled'
    );
  }

  private resolveUid(memo: Memo): string | null {
    if (memo.uid) return memo.uid;
    if (memo.name) {
      const uid = memo.name.split('/').pop();
      return uid || null;
    }
    return null;
  }

  private extractFrontmatter(content: string, key: string): string | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    const line = match[1].split('\n').find((l) => l.startsWith(`${key}:`));
    return line ? line.slice(key.length + 1).trim() : null;
  }

  private extractFrontmatterAsNumber(content: string, key: string): number | null {
    const val = this.extractFrontmatter(content, key);
    const num = val ? parseInt(val, 10) : null;
    return num && !isNaN(num) ? num : null;
  }

  private parseTimestamp(isoString: string): number {
    return new Date(isoString).getTime();
  }

  private extractBody(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  }
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

class MemosSyncSettingTab extends PluginSettingTab {
  plugin: MemosSyncPlugin;

  constructor(app: App, plugin: MemosSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Memos Sync Settings' });

    // ── API ──
    containerEl.createEl('h3', { text: '🔌 API Configuration' });

    new Setting(containerEl)
      .setName('Host URL')
      .setDesc('Your Memos server URL (e.g. https://mem.supht.com)')
      .addText((t) =>
        t
          .setPlaceholder('https://mem.supht.com')
          .setValue(this.plugin.settings.memosApiUrl)
          .onChange(async (v) => {
            this.plugin.settings.memosApiUrl = v.replace(/\/$/, '');
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('API Token')
      .setDesc('Your Memos API token (memos_pat_…)')
      .addText((t) =>
        t
          .setPlaceholder('memos_pat_...')
          .setValue(this.plugin.settings.memosApiToken)
          .onChange(async (v) => {
            this.plugin.settings.memosApiToken = v.trim();
            await this.plugin.saveSettings();
          })
      );

    // ── Sync ──
    containerEl.createEl('h3', { text: '⏰ Sync Settings' });

    new Setting(containerEl)
      .setName('Auto Sync')
      .setDesc('Sync automatically at a regular interval')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoSync).onChange(async (v) => {
          this.plugin.settings.autoSync = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Sync Interval (ms)')
      .setDesc('How often to sync — 300000 = 5 min')
      .addText((t) =>
        t
          .setPlaceholder('300000')
          .setValue(String(this.plugin.settings.syncInterval))
          .onChange(async (v) => {
            const n = parseInt(v);
            this.plugin.settings.syncInterval = isNaN(n) ? 300000 : n;
            await this.plugin.saveSettings();
          })
      );

    // ── Storage ──
    containerEl.createEl('h3', { text: '📁 Storage' });

    new Setting(containerEl)
      .setName('Notes Folder')
      .setDesc('Vault subfolder where synced memos are saved')
      .addText((t) =>
        t
          .setPlaceholder('Memos')
          .setValue(this.plugin.settings.notesFolder)
          .onChange(async (v) => {
            this.plugin.settings.notesFolder = v || 'Memos';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Create Notes from Memos')
      .setDesc('Write each memo as a Markdown note in the folder above')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.createNotes).onChange(async (v) => {
          this.plugin.settings.createNotes = v;
          await this.plugin.saveSettings();
        })
      );

    // ── Bidirectional ──
    containerEl.createEl('h3', { text: '🔄 Bidirectional Sync' });

    new Setting(containerEl)
      .setName('Push Changes to Memos')
      .setDesc('Send local edits back to the Memos server')
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.bidirectionalSync)
          .onChange(async (v) => {
            this.plugin.settings.bidirectionalSync = v;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Delete Local Notes for Removed Memos')
      .setDesc('⚠️ Removes Obsidian notes when the memo no longer exists in Memos')
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.syncDeletedNotes)
          .onChange(async (v) => {
            this.plugin.settings.syncDeletedNotes = v;
            await this.plugin.saveSettings();
          })
      );

    // ── Test ──
    containerEl.createEl('h3', { text: '✅ Connection' });

    new Setting(containerEl)
      .setName('Test Connection')
      .setDesc('Verify URL and token, and count total memos')
      .addButton((b) =>
        b.setButtonText('Test Connection').onClick(async () => {
          b.setDisabled(true);
          b.setButtonText('Testing…');
          await this.testConnection();
          b.setDisabled(false);
          b.setButtonText('Test Connection');
        })
      );
  }

  private async testConnection() {
    const { memosApiUrl, memosApiToken } = this.plugin.settings;

    if (!memosApiUrl || !memosApiToken) {
      new Notice('⚠️ Please fill in Host URL and API Token first.');
      return;
    }

    try {
      const memos = await this.plugin.fetchAllMemos();
      new Notice(`✅ Connected! Found ${memos.length} memos.`);
    } catch (err: any) {
      new Notice(`❌ Connection failed: ${err.message}`);
    }
  }
}
