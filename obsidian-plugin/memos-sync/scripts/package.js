#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

// Create dist directory
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// Files to copy for distribution
const files = [
  'main.js',
  'manifest.json',
  'styles.css',
  'package.json'
];

console.log('📦 Packaging plugin for distribution...\n');

let copied = 0;
files.forEach(file => {
  const src = path.join(ROOT, file);
  const dst = path.join(DIST, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`✅ ${file}`);
    copied++;
  } else {
    console.log(`⚠️  Missing: ${file}`);
  }
});

console.log(`\n✅ Packaged ${copied} files to dist/`);
console.log('\n📁 Distribution ready at: dist/\n');
