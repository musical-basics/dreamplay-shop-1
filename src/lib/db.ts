import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'dreamplay.db');

let _db: InstanceType<typeof DatabaseSync> | null = null;

export function getDb() {
  if (!_db) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error('Database not found. Run: pnpm seed');
    }
    _db = new DatabaseSync(DB_PATH);
  }
  return _db;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  price: number;
  badge: string | null;
  description: string | null;
  shopify_url: string | null;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  sort_order: number;
  is_primary: number;
}

export function getAllProducts(): Product[] {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY category, subcategory, name').all() as Omit<Product, 'images'>[];
  const images = db.prepare('SELECT * FROM product_images ORDER BY sort_order').all() as ProductImage[];
  
  return products.map(p => ({
    ...p,
    images: images.filter(img => img.product_id === p.id),
  }));
}

export function getProductBySlug(slug: string): Product | null {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as Omit<Product, 'images'> | undefined;
  if (!product) return null;
  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(product.id) as ProductImage[];
  return { ...product, images };
}

export function getProductsByCategory(category: string): Product[] {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY subcategory, name').all(category) as Omit<Product, 'images'>[];
  const allImages = db.prepare('SELECT * FROM product_images ORDER BY sort_order').all() as ProductImage[];
  return products.map(p => ({
    ...p,
    images: allImages.filter(img => img.product_id === p.id),
  }));
}

export function updateImageOrder(productId: number, imageIds: number[]) {
  const db = getDb();
  const update = db.prepare('UPDATE product_images SET sort_order = ?, is_primary = ? WHERE id = ? AND product_id = ?');
  for (let i = 0; i < imageIds.length; i++) {
    update.run(i, i === 0 ? 1 : 0, imageIds[i], productId);
  }
}

export function addImageToProduct(productId: number, url: string) {
  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM product_images WHERE product_id = ?').get(productId) as { m: number } | undefined;
  const nextOrder = (maxOrder?.m ?? -1) + 1;
  db.prepare('INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES (?, ?, ?, ?)').run(productId, url, nextOrder, nextOrder === 0 ? 1 : 0);
}
