import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(demoDir, 'dist');
const siteRoot = path.resolve(demoDir, '..');

function copyRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const from = path.join(src, entry);
    const to = path.join(dest, entry);
    if (statSync(from).isDirectory()) {
      copyRecursive(from, to);
    } else {
      cpSync(from, to);
    }
  }
}

const siteAssetsDir = path.join(siteRoot, 'assets');
rmSync(siteAssetsDir, { recursive: true, force: true });
cpSync(path.join(distDir, 'index.html'), path.join(siteRoot, 'index.html'));
copyRecursive(path.join(distDir, 'assets'), siteAssetsDir);

console.log('Synced demo build to', siteRoot);
