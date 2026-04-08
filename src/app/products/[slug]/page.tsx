'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Product, ProductImage } from '@/lib/db';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProduct = useCallback(() => {
    fetch(`/api/products/${slug}`).then(r => r.json()).then(setProduct).catch(() => {});
  }, [slug]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    await uploadImage(file);
  }, [slug]);

  const uploadImage = async (file: File) => {
    setSaving(true);
    const form = new FormData();
    form.append('file', file);
    form.append('slug', slug);
    await fetch('/api/upload', { method: 'POST', body: form });
    fetchProduct();
    setSaving(false);
  };

  if (!product) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        {product === null ? 'Loading…' : 'Product not found. Run pnpm seed first.'}
      </div>
    );
  }

  const imgs = product.images.length ? product.images : [{ id: 0, product_id: 0, url: '/placeholder.png', sort_order: 0, is_primary: 1 }];
  const currentImg = imgs[activeImg] ?? imgs[0];

  return (
    <>
      {/* Mini header */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">Dream<span>Play</span></Link>
            <nav className="header-nav">
              <Link href="/collections/merch" className="nav-link">Merch</Link>
              <Link href="/collections/pianos" className="nav-link">Keyboards</Link>
              <Link href="/admin" className="nav-link">Manage Images</Link>
            </nav>
            <div className="header-actions">
              <Link href="/admin" className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px' }}>🖼 Edit Images</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '48px 40px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span>/</span>
          <Link href={`/collections/${product.category}`} style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{product.name}</span>
        </nav>

        {/* PDP layout */}
        <div className="pdp-layout">
          {/* Thumbnail strip */}
          <div className="pdp-thumbs">
            {imgs.map((img, i) => (
              <button
                key={img.id}
                className={`pdp-thumb${i === activeImg ? ' active' : ''}`}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>

          {/* Main image + drag drop */}
          <div
            className={`pdp-main-img${isDragOver ? ' drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ cursor: 'pointer' }}
            title="Click or drag an image to replace"
          >
            <img src={currentImg.url} alt={product.name} />
            <div className="drop-zone-hint" aria-hidden="true">
              {saving ? '⏳ Uploading…' : '📁 Drop image here or click to replace'}
            </div>
          </div>

          {/* Info panel */}
          <div className="pdp-info">
            {product.badge && (
              <span className={`product-badge pdp-badge ${product.badge.includes('Soon') ? 'badge-soon' : 'badge-new'}`} style={{ position: 'static', display: 'inline-flex', marginBottom: 16 }}>
                {product.badge}
              </span>
            )}
            <h1 className="pdp-name">{product.name}</h1>
            <div className="pdp-price">
              ${product.price}
              {product.category === 'merch' && <span className="pdp-original" style={{ fontSize: 18 }}>${Math.round(product.price / 0.8)}</span>}
            </div>
            <p className="pdp-desc">{product.description}</p>

            <div className="pdp-highlights">
              {[
                ['✓', 'Free US Shipping'],
                ['✓', '30-Day Returns'],
                ['✓', product.category === 'merch' ? '400gsm Fleece' : 'Studio Sound'],
                ['✓', 'Secure Checkout'],
              ].map(([icon, text]) => (
                <div key={text} className="pdp-highlight-item">
                  <span style={{ color: 'var(--accent)' }}>{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <div className="pdp-cta-group">
              <a href={product.shopify_url || 'https://dreamplay-pianos.myshopify.com'} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
                Buy on Shopify →
              </a>
              <button className="btn btn-secondary btn-lg" onClick={() => fileRef.current?.click()}>
                🖼 Swap Image
              </button>
            </div>
            <p className="pdp-shopify-note">Click image or use &ldquo;Swap Image&rdquo; to update from your library. Changes persist in SQLite.</p>
          </div>
        </div>

        {/* Related products */}
        <div style={{ marginTop: 80, borderTop: '1px solid var(--border)', paddingTop: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>You May Also Like</h2>
          <div className="products-scroll">
            {/* shown via client fetch in a real app */}
            <Link href={`/collections/${product.category}`} className="product-card" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px dashed var(--border-2)', borderRadius: 'var(--radius)', width: 220, height: 220, color: 'var(--text-muted)', fontSize: 14 }}>
              View all {product.category} →
            </Link>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }}
      />
    </>
  );
}
