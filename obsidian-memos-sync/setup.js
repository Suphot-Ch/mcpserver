#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read .env from parent directory
const envPath = path.join(__dirname, '../memos_api/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse .env
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && !key.startsWith('#')) {
    env[key.trim()] = value?.trim();
  }
});

console.log('🔧 Obsidian Memos Sync Setup');
console.log('============================\n');

// Display detected configuration
console.log('Detected configuration from .env:');
console.log(`✓ Memos URL: ${env.MEMOS_BASE_URL}`);
console.log(`✓ Memos Token: ${env.MEMOS_TOKEN ? '***' + env.MEMOS_TOKEN.slice(-10) : 'Not found'}`);
console.log(`✓ Obsidian Vault: ${env.OBSIDIAN_VAULT_PATH}\n`);

// Create default settings data
const defaultSettings = {
  memosApiUrl: env.MEMOS_BASE_URL || 'https://mem.supht.com',
  memosApiToken: env.MEMOS_TOKEN || '',
  vaultPath: env.OBSIDIAN_VAULT_PATH || '',
  autoSync: true,
  syncInterval: 300000,
};

console.log('📝 Plugin configuration ready:');
console.log(JSON.stringify(defaultSettings, null, 2));
console.log('\n✅ Setup complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
console.log('3. Copy to: YOUR_VAULT/.obsidian/plugins/obsidian-memos-sync/');
console.log('4. Reload Obsidian');
