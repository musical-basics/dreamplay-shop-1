#!/usr/bin/env node
/**
 * DreamPlay Asset Organizer
 * 
 * Watches the /ingest/ folder for new image files and automatically
 * categorizes + moves them into the correct assets/images/[category]/ folder.
 * 
 * Usage:
 *   node scripts/organize-assets.js           # watch mode (runs forever)
 *   node scripts/organize-assets.js --seed    # seed from local Product Images path
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const INGEST_DIR = path.join(REPO_ROOT, 'ingest');
const ASSETS_DIR = path.join(REPO_ROOT, 'assets', 'images');

// ── Category Rules ──────────────────────────────────────────────────────────
// Each rule: { dir: 'subfolder', keywords: ['keyword', ...] }
// First match wins (order matters — most specific first).
const CATEGORY_RULES = [
  { dir: 'ds65',         keywords: ['ds 6.5', 'ds6.5', '6.5'] },
  { dir: 'ds60',         keywords: ['ds 6.0', 'ds6.0', '6.0', 'gold ds'] },
  { dir: 'ds55',         keywords: ['ds 5.5', 'ds5.5', '5.5'] },
  { dir: 'go',           keywords: ['dreamplay go', 'go -', 'go black', 'go white'] },
  { dir: 'hero',         keywords: ['hero', 'new hero', 'hero image'] },
  { dir: 'merch',        keywords: ['hoodie', 'tshirt', 't-shirt', 't shirt', 'merch', 'apparel', 'sweatshirt'] },
  { dir: 'bundles',      keywords: ['bundle', 'package', 'kit'] },
  { dir: 'backgrounds',  keywords: ['background', 'bg', 'interior', 'hallway', 'room', 'studio bg'] },
  { dir: 'editorial',    keywords: ['editorial', 'lifestyle', 'photoshoot'] },
  { dir: 'uncategorized', keywords: [] }, // fallback
];

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif']);

// ── Categorize ───────────────────────────────────────────────────────────────
function categorize(filename) {
  const lower = filename.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.dir === 'uncategorized') return rule.dir;
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.dir;
  }
  return 'uncategorized';
}

// ── Ensure directories exist ─────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[organize] Created directory: ${path.relative(REPO_ROOT, dir)}`);
  }
}

// ── Process a single file ────────────────────────────────────────────────────
function processFile(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    console.log(`[organize] Skipping non-image: ${path.basename(srcPath)}`);
    return;
  }

  const filename = path.basename(srcPath);
  const category = categorize(filename);
  const destDir = path.join(ASSETS_DIR, category);
  ensureDir(destDir);

  let destPath = path.join(destDir, filename);

  // Handle filename collisions
  if (fs.existsSync(destPath)) {
    const ts = Date.now();
    const noExt = path.basename(filename, ext);
    destPath = path.join(destDir, `${noExt}-${ts}${ext}`);
  }

  fs.renameSync(srcPath, destPath);
  console.log(`[organize] ✓ ${filename} → assets/images/${category}/${path.basename(destPath)}`);
}

// ── Watch mode ───────────────────────────────────────────────────────────────
function startWatch() {
  ensureDir(INGEST_DIR);
  console.log(`[organize] 👀 Watching ${INGEST_DIR} for new images...`);
  console.log(`[organize] Drag image files into the /ingest/ folder to auto-sort them.`);

  // Process any files already in ingest (in case watcher was offline)
  fs.readdirSync(INGEST_DIR).forEach(f => {
    const p = path.join(INGEST_DIR, f);
    if (fs.statSync(p).isFile()) processFile(p);
  });

  // Watch for new files
  fs.watch(INGEST_DIR, { persistent: true }, (event, filename) => {
    if (!filename) return;
    const filePath = path.join(INGEST_DIR, filename);

    // Small delay to ensure file write is complete
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          processFile(filePath);
        }
      } catch (err) {
        console.error(`[organize] ✗ Error processing ${filename}: ${err.message}`);
      }
    }, 500);
  });
}

// ── Seed from local DreamPlay Assets folder ───────────────────────────────────
function seedAssets() {
  const LOCAL_ASSETS = '/Users/lionelyu/Documents/DreamPlay Assets/Product Images';
  
  if (!fs.existsSync(LOCAL_ASSETS)) {
    console.error('[seed] ✗ Local assets folder not found:', LOCAL_ASSETS);
    process.exit(1);
  }

  console.log('[seed] 🌱 Seeding from:', LOCAL_ASSETS);
  let count = 0;

  function walkDir(dir) {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const ext = path.extname(entry).toLowerCase();
        if (!IMAGE_EXTENSIONS.has(ext)) continue;
        if (ext === '.psd' || ext === '.psb') continue; // skip source files

        const category = categorize(entry);
        const destDir = path.join(ASSETS_DIR, category);
        ensureDir(destDir);

        const destPath = path.join(destDir, entry);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(fullPath, destPath);
          console.log(`[seed] ✓ ${entry} → assets/images/${category}/`);
          count++;
        } else {
          console.log(`[seed] ~ Skipped (exists): ${entry}`);
        }
      }
    }
  }

  walkDir(LOCAL_ASSETS);
  console.log(`[seed] 🎉 Done! Seeded ${count} images.`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--seed')) {
  seedAssets();
} else {
  startWatch();
}
