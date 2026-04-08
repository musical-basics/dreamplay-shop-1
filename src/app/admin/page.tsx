'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/db';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlug = useRef<string>('');

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  // ── Drag-to-reorder state ─────────────────────────────────────────────────
  const dragItem = useRef<{ productId: number; fromIdx: number } | null>(null);

  const handleDragStart = (productId: number, fromIdx: number) => {
    dragItem.current = { productId, fromIdx };
  };

  const handleDrop = async (slug: string, productId: number, toIdx: number) => {
    if (!dragItem.current || dragItem.current.productId !== productId) return;
    const { fromIdx } = dragItem.current;
    if (fromIdx === toIdx) return;

    // Reorder locally optimistic
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const imgs = [...p.images];
      const [moved] = imgs.splice(fromIdx, 1);
      imgs.splice(toIdx, 0, moved);
      return { ...p, images: imgs };
    }));

    // Write to backend
    setSaving(slug);
    const product = products.find(p => p.id === productId);
    if (product) {
      const reordered = [...product.images];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      await fetch(`/api/products/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageOrder: reordered.map(i => i.id) }),
      });
    }
    setSaving(null);
    setMsg('✓ Order saved');
    setTimeout(() => setMsg(''), 2000);
    dragItem.current = null;
  };

  // ── Upload new image ──────────────────────────────────────────────────────
  const openUpload = (slug: string) => {
    pendingSlug.current = slug;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingSlug.current) return;
    setSaving(pendingSlug.current);
    const form = new FormData();
    form.append('file', file);
    form.append('slug', pendingSlug.current);
    await fetch('/api/upload', { method: 'POST', body: form });
    const updated = await fetch('/api/products').then(r => r.json());
    setProducts(updated);
    setSaving(null);
    setMsg('✓ Image uploaded');
    setTimeout(() => setMsg(''), 2000);
    e.target.value = '';
  };

  const grouped: Record<string, Product[]> = {};
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">Dream<span>Play</span></Link>
            <nav className="header-nav">
              <Link href="/" className="nav-link">← Back to Store</Link>
              <Link href="/collections/merch" className="nav-link">Merch</Link>
              <Link href="/collections/pianos" className="nav-link">Keyboards</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container admin-wrap">
        <div className="admin-header">
          <h1 className="admin-title">Image Manager</h1>
          <p className="admin-subtitle">
            Drag to reorder images. First image is the product thumbnail.
            Click <strong>+ Add</strong> to upload from your library. All changes save to SQLite instantly.
          </p>
          {msg && <div style={{ marginTop: 12, color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}>{msg}</div>}
        </div>

        {Object.entries(grouped).map(([category, prods]) => (
          <div key={category}>
            <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, textTransform: 'capitalize', marginBottom: 32, letterSpacing: '-0.5px', color: 'var(--text-muted)' }}>{category}</h2>
            {prods.map(p => (
              <div key={p.slug} className="admin-product-section">
                <div className="admin-product-name">
                  {p.name}
                  {saving === p.slug && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>Saving…</span>}
                </div>
                <div className="admin-product-meta">
                  {p.images.length} image{p.images.length !== 1 ? 's' : ''} · ${p.price} · {p.subcategory}
                  <Link href={`/products/${p.slug}`} style={{ color: 'var(--accent)', marginLeft: 16, fontSize: 12 }}>View →</Link>
                </div>
                <div className="admin-images-row">
                  {p.images.map((img, idx) => (
                    <div
                      key={img.id}
                      className="admin-img-card"
                      draggable
                      onDragStart={() => handleDragStart(p.id, idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(p.slug, p.id, idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" loading="lazy" />
                      {idx === 0 && <span className="admin-img-primary-badge">Primary</span>}
                      <div className="admin-img-actions">
                        <button
                          className="admin-img-action-btn"
                          onClick={() => { openUpload(p.slug); }}
                          title="Replace this image"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add button */}
                  <button
                    className="admin-add-btn"
                    onClick={() => openUpload(p.slug)}
                    aria-label={`Add image to ${p.name}`}
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                    Add Image
                  </button>
                </div>
              </div>
            ))}
            <hr className="admin-divider" />
          </div>
        ))}

        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖼</div>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No products in database.</p>
            <p style={{ fontSize: 14 }}>Run <code style={{ color: 'var(--accent)', background: 'rgba(212,168,67,0.1)', padding: '2px 8px', borderRadius: 4 }}>pnpm seed</code> in the terminal to populate products from your local image library.</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}
