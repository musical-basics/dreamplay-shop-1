/**
 * DreamPlay Asset Seeder
 * Uses Node.js built-in SQLite (Node 22.5+, --experimental-sqlite flag)
 * Run: node --experimental-sqlite scripts/seed.mjs
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'dreamplay.db');
const PUBLIC_ASSETS = path.join(ROOT, 'public', 'assets');
const SOURCE_ROOT = '/Users/lionelyu/Documents/DreamPlay Assets/Product Images';

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.JPG', '.JPEG', '.PNG']);

// ── Product definitions mapped from folder structure ────────────────────────
const PRODUCT_MAP = [
  {
    slug: 'ds-6-0-pro-keyboard',
    name: 'DS 6.0 Pro Keyboard',
    category: 'pianos',
    subcategory: 'DS 6.0',
    price: 239,
    badge: 'Best Seller',
    description: '88 weighted keys, studio-grade sound engine, Bluetooth + USB. Ships August 2026.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard',
    sourceFolders: ['Main Product Renders'],
    filePatterns: ['DS 6.0', 'DS6.0'],
    excludePatterns: ['white', 'White', 'Gold', 'gold', 'nightmare', 'Nightmare', '5.5', '6.5', 'Go', 'Yamaha'],
  },
  {
    slug: 'ds-6-0-white',
    name: 'DS 6.0 Pro — White',
    category: 'pianos',
    subcategory: 'DS 6.0',
    price: 239,
    badge: 'Limited Stock',
    description: '88 weighted keys, ivory finish. Ships August 2026.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard',
    sourceFolders: ['Main Product Renders'],
    filePatterns: ['DS 6.0', 'white', 'White'],
    excludePatterns: ['black', 'Black', 'Gold', 'gold', 'nightmare', '5.5', '6.5'],
  },
  {
    slug: 'ds-6-0-gold',
    name: 'DS 6.0 Gold Edition',
    category: 'pianos',
    subcategory: 'DS 6.0',
    price: 499,
    badge: 'Coming Soon',
    description: 'Hand-polished champagne finish. Limited to 50 units worldwide.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard',
    sourceFolders: ['New Product Drafts/DreamPlay Gold', 'New Product Drafts'],
    filePatterns: ['Gold', 'gold'],
    excludePatterns: [],
  },
  {
    slug: 'ds-6-0-nightmare-black',
    name: 'DS 6.0 Nightmare Black',
    category: 'pianos',
    subcategory: 'DS 6.0',
    price: 259,
    badge: 'New',
    description: 'Matte black finish with premium black key housing. Ships August 2026.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard',
    sourceFolders: ['New Product Drafts/Nightmare Black', 'New Product Drafts/Nightmare Black/Perfect Generations'],
    filePatterns: ['nightmare', 'Nightmare', 'DS 6', 'DreamPlay Black'],
    excludePatterns: [],
  },
  {
    slug: 'ds-5-5-keyboard',
    name: 'DS 5.5 Keyboard',
    category: 'pianos',
    subcategory: 'DS 5.5',
    price: 199,
    badge: null,
    description: '61 weighted keys, compact design. Great for beginners and portability.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard-only',
    sourceFolders: ['Main Product Renders'],
    filePatterns: ['DS 5.5', 'DS5.5'],
    excludePatterns: [],
  },
  {
    slug: 'dreamplay-go',
    name: 'DreamPlay Go',
    category: 'pianos',
    subcategory: 'DreamPlay Go',
    price: 149,
    badge: 'New',
    description: 'Ultra-portable keyboard. Play anywhere.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-one-keyboard',
    sourceFolders: ['DreamPlay Go'],
    filePatterns: ['DreamPlay Go', 'Go'],
    excludePatterns: [],
  },
  {
    slug: 'icon-black-hoodie',
    name: 'ICON Black Hoodie',
    category: 'merch',
    subcategory: 'Hoodies',
    price: 58,
    badge: 'New Drop',
    description: '400gsm heavyweight fleece, tone-on-tone embroidered DreamPlay logo. Unisex sizing.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-signature-black-hoodie',
    sourceFolders: ['New Product Drafts/Hoodies/Hoodie B'],
    filePatterns: ['Hoodie B', 'Embroidered', 'Centered', 'hoodie'],
    excludePatterns: [],
  },
  {
    slug: 'official-black-hoodie',
    name: 'Official Black Hoodie',
    category: 'merch',
    subcategory: 'Hoodies',
    price: 58,
    badge: null,
    description: 'Classic fit DreamPlay hoodie with embroidered logo. Premium fleece.',
    shopify_url: 'https://dreamplay-pianos.myshopify.com/products/dreamplay-official-black-hoodie',
    sourceFolders: ['New Product Drafts/Hoodies/Hoodie A'],
    filePatterns: ['Hoodie A'],
    excludePatterns: [],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getImageFiles(folder) {
  const fullPath = path.join(SOURCE_ROOT, folder);
  if (!fs.existsSync(fullPath)) return [];
  return fs.readdirSync(fullPath)
    .filter(f => IMAGE_EXTS.has(path.extname(f)) && !f.startsWith('.'))
    .map(f => path.join(fullPath, f));
}

function matchesProduct(filename, filePatterns, excludePatterns) {
  const name = path.basename(filename);
  const matches = filePatterns.some(p => name.includes(p));
  const excluded = excludePatterns.some(p => name.includes(p));
  return matches && !excluded;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyImage(src, destDir, filename) {
  ensureDir(destDir);
  const ext = path.extname(src).toLowerCase().replace('.jpeg', '.jpg');
  const safeName = filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const dest = path.join(destDir, safeName + ext);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return dest;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('🌱 DreamPlay Asset Seeder\n');

// Setup DB
const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    price REAL NOT NULL,
    badge TEXT,
    description TEXT,
    shopify_url TEXT
  );
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary INTEGER DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (slug, name, category, subcategory, price, badge, description, shopify_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertImage = db.prepare(`
  INSERT INTO product_images (product_id, url, sort_order, is_primary)
  VALUES (?, ?, ?, ?)
`);
const deleteImages = db.prepare(`DELETE FROM product_images WHERE product_id = ?`);
const getProduct = db.prepare(`SELECT id FROM products WHERE slug = ?`);

// Also seed hero images from Different Angles folder
const HERO_SOURCES = [
  path.join(SOURCE_ROOT, 'Different Angles', 'Hero Image Website.jpg'),
  path.join(SOURCE_ROOT, 'Different Angles', 'Hero Image Website 2.jpg'),
  path.join(SOURCE_ROOT, 'Different Angles', 'New Hero - Gradient.jpg'),
  path.join(SOURCE_ROOT, 'New Product Drafts', 'Hoodies', 'New Hoodies Generations', 'preview_image.jpg'),
  path.join(SOURCE_ROOT, 'New Product Drafts', 'Hoodies', 'New Hoodies Generations', '1775468160513_0_491662536194864.jpg'),
  path.join(SOURCE_ROOT, 'New Product Drafts', 'Editorial Photos', '1775476300888_0_43892634205580094.jpg'),
];

// Copy hero images
const heroDir = path.join(PUBLIC_ASSETS, 'hero');
ensureDir(heroDir);
const heroImages = [];
HERO_SOURCES.forEach((src, i) => {
  if (fs.existsSync(src)) {
    const ext = path.extname(src).toLowerCase();
    const dest = path.join(heroDir, `hero-${i + 1}${ext}`);
    if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
    heroImages.push(`/assets/hero/hero-${i + 1}${ext}`);
    console.log(`  ✓ Hero image ${i + 1}`);
  }
});

// Write hero config
fs.writeFileSync(
  path.join(ROOT, 'src', 'data', 'hero.json'),
  JSON.stringify(heroImages, null, 2)
);

// Process each product
for (const product of PRODUCT_MAP) {
  console.log(`\n📦 ${product.name}`);

  // Insert/update product
  insertProduct.run(
    product.slug, product.name, product.category, product.subcategory,
    product.price, product.badge, product.description, product.shopify_url
  );
  const row = getProduct.get(product.slug);
  const productId = row.id;

  // Clear existing images
  deleteImages.run(productId);

  // Collect matching image files
  const allImages = [];
  for (const folder of product.sourceFolders) {
    const files = getImageFiles(folder);
    for (const file of files) {
      if (matchesProduct(file, product.filePatterns, product.excludePatterns)) {
        allImages.push(file);
      }
    }
  }

  // Deduplicate by basename
  const seen = new Set();
  const unique = allImages.filter(f => {
    const k = path.basename(f);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Copy and register images
  const destDir = path.join(PUBLIC_ASSETS, product.category, product.slug);
  unique.slice(0, 8).forEach((src, i) => {
    const baseName = path.basename(src, path.extname(src));
    const dest = copyImage(src, destDir, baseName);
    const relUrl = dest.replace(path.join(ROOT, 'public'), '').replace(/\\/g, '/');
    insertImage.run(productId, relUrl, i, i === 0 ? 1 : 0);
    console.log(`  ✓ ${path.basename(dest)}`);
  });

  if (unique.length === 0) {
    console.log(`  ⚠️  No images found`);
  }
}

db.close();
console.log(`\n✅ Seeded ${PRODUCT_MAP.length} products into ${DB_PATH}\n`);
