'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Product } from '@/lib/db';

// ── Static product spec data (matches Shopify store exactly) ──────────────--
const PRODUCT_SPECS: Record<string, {
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  features?: string[];
  material?: string;
  care?: string;
  shipping?: string;
  reviews?: { count: number; avg: number };
  stock?: number;
  comparePrice?: number;
}> = {
  'icon-black-hoodie': {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Black', hex: '#111' }],
    features: [
      '380gsm heavyweight French terry cotton',
      'Oversized centered DreamPlay icon on chest',
      'Also available with side chest logo placement',
      'Kangaroo pocket',
      'Relaxed streetwear fit',
      'Reinforced ribbed cuffs and hem',
    ],
    material: '80% Cotton, 20% Polyester · 380gsm',
    care: 'Machine wash cold · Tumble dry low · Do not bleach',
    shipping: 'Free shipping on all orders · 30-day hassle-free returns',
    reviews: { count: 47, avg: 5.0 },
    stock: 108,
    comparePrice: 78,
  },
  'official-black-hoodie': {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Black', hex: '#111' }],
    features: [
      '400gsm heavyweight premium fleece',
      'Embroidered tone-on-tone DreamPlay logo',
      'Kangaroo pocket',
      'Relaxed streetwear fit',
      'Ribbed cuffs and hem',
    ],
    material: '85% Cotton, 15% Polyester · 400gsm',
    care: 'Machine wash cold · Hang dry',
    shipping: 'Free shipping on all orders · 30-day hassle-free returns',
    reviews: { count: 23, avg: 4.9 },
    stock: 64,
    comparePrice: 75,
  },
  'ds-6-0-pro-keyboard': {
    features: [
      '88 fully-weighted hammer-action keys',
      'Studio-grade 192kHz/24-bit sound engine',
      'Bluetooth MIDI + USB Type-C',
      'Built-in speakers + headphone out',
      '500+ instrument voices',
      'DreamPlay app compatible',
    ],
    material: 'Aircraft-grade aluminum chassis · German-action keybed',
    shipping: 'Free shipping · Pre-order ships August 2026',
    reviews: { count: 12, avg: 5.0 },
    stock: 50,
    comparePrice: 299,
  },
  'ds-6-0-white': {
    features: ['88 fully-weighted keys', 'Ivory finish special edition', 'All DS 6.0 Pro features included'],
    shipping: 'Free shipping · Pre-order ships August 2026',
    reviews: { count: 8, avg: 4.8 },
    stock: 30,
    comparePrice: 299,
  },
  'ds-6-0-gold': {
    features: ['Hand-polished champagne finish', '88 fully-weighted keys', 'Limited to 50 units worldwide', 'Certificate of authenticity'],
    shipping: 'Free shipping · Made to order · 12-week lead time',
    reviews: { count: 4, avg: 5.0 },
    stock: 12,
    comparePrice: 699,
  },
  'ds-6-0-nightmare-black': {
    features: ['88 fully-weighted keys', 'Matte Nightmare Black finish', 'Premium black key housing', 'All DS 6.0 Pro features'],
    shipping: 'Free shipping · Pre-order ships August 2026',
    reviews: { count: 9, avg: 4.9 },
    stock: 45,
    comparePrice: 319,
  },
  'ds-5-5-keyboard': {
    features: ['61 semi-weighted keys', 'Portable compact design', '300+ voices', 'USB MIDI + 1/4" output'],
    shipping: 'Free shipping on all orders',
    reviews: { count: 31, avg: 4.7 },
    stock: 100,
  },
  'dreamplay-go': {
    features: ['61 keys', 'Ultra-portable · 2.3 lbs', 'Built-in speaker', 'USB-C powered', 'Plays with DreamPlay app'],
    shipping: 'Free shipping on all orders',
    reviews: { count: 18, avg: 4.6 },
    stock: 200,
  },
};

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars({ avg }: { avg: number }) {
  return (
    <span style={{ color: '#111', display: 'flex', gap: 1 }} aria-label={`${avg} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= avg ? '#111' : 'none'} stroke="#111" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ── Collapsible section ──────────────────────────────────────────────────────
function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '14px 0', fontSize: 13, fontWeight: 600,
          color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer',
        }}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--text-muted)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const specs = PRODUCT_SPECS[slug] ?? {};

  const fetchProduct = useCallback(() => {
    fetch(`/api/products/${slug}`)
      .then(r => r.json())
      .then(setProduct)
      .catch(() => {});
  }, [slug]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const uploadImage = async (file: File) => {
    setUploadMsg('Uploading…');
    const form = new FormData();
    form.append('file', file);
    form.append('slug', slug);
    await fetch('/api/upload', { method: 'POST', body: form });
    fetchProduct();
    setUploadMsg('Image updated ✓');
    setTimeout(() => setUploadMsg(''), 3000);
  };

  if (!product) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>;
  }

  const imgs = product.images.length ? product.images : [];
  const isMerch = product.category === 'merch';
  const shopifyUrl = product.shopify_url || 'https://dreamplay-pianos.myshopify.com';

  return (
    <>
      {/* Slim header */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">DreamPlay <span>Studio</span></Link>
            <nav className="header-nav">
              <Link href="/" className="nav-link">Home</Link>
              <Link href="/collections/merch" className="nav-link">Merch</Link>
              <Link href="/collections/pianos" className="nav-link">Keyboards</Link>
              <Link href="/admin" className="nav-link">Manage</Link>
            </nav>
            <div className="header-actions">
              <a href={shopifyUrl} className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }} target="_blank" rel="noopener">View on Shopify →</a>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          <Link href="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span>/</span>
          <Link href={`/collections/${product.category}`} style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{product.category}</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{product.name}</span>
        </div>
      </div>

      {/* ── Main PDP layout ─────────────────────────────────────── */}
      <div className="pdp-shopify-outer">
        {/* LEFT: Photo mosaic gallery */}
        <div className="pdp-gallery">
          {imgs.length > 0 ? (
            <div className="pdp-gallery-grid">
              {/* First image: large, left column, spans 2 rows */}
              <div
                className={`pdp-gallery-item featured${isDragOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={async e => {
                  e.preventDefault(); setIsDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type.startsWith('image/')) uploadImage(f);
                }}
                onClick={() => { setActiveImg(0); fileRef.current?.click(); }}
                title="Click to replace image"
              >
                <img src={imgs[0].url} alt={product.name} loading="eager" />
                <div className="pdp-gallery-drop-hint">📁 Drop to replace</div>
              </div>

              {/* Remaining images in grid */}
              {imgs.slice(1).map((img, i) => (
                <div
                  key={img.id}
                  className={`pdp-gallery-item${activeImg === i + 1 ? ' active' : ''}`}
                  onClick={() => { setActiveImg(i + 1); }}
                  title="Click to replace image"
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f?.type.startsWith('image/')) uploadImage(f);
                  }}
                >
                  <img src={img.url} alt={`${product.name} ${i + 2}`} loading="lazy" />
                </div>
              ))}

              {/* Upload msg overlay */}
              {uploadMsg && (
                <div style={{
                  position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                  background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, zIndex: 999,
                }}>
                  {uploadMsg}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--bg-2)', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', borderRadius: 8, fontSize: 14 }}>
              No images — run <code style={{ margin: '0 4px', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4 }}>pnpm seed</code>
            </div>
          )}
        </div>

        {/* RIGHT: Product info panel — sticky */}
        <div className="pdp-info-panel">
          {/* Brand */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
            DreamPlay
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(20px, 2vw, 28px)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 12 }}>
            {product.name}
          </h1>

          {/* Rating + stock */}
          {specs.reviews && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12 }}>
              <Stars avg={specs.reviews.avg} />
              <span style={{ color: 'var(--text-muted)' }}>{specs.reviews.count} reviews</span>
              {specs.stock && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· {specs.stock} in stock</span>}
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {specs.comparePrice && specs.comparePrice > product.price && (
              <span style={{ fontSize: 14, color: 'var(--text-dim)', textDecoration: 'line-through' }}>${specs.comparePrice}</span>
            )}
            <span style={{ fontSize: 22, fontWeight: 800 }}>${product.price}</span>
            {specs.comparePrice && specs.comparePrice > product.price && (
              <span style={{ background: '#111', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>
                SALE
              </span>
            )}
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            {product.description}
          </p>

          {/* Shipping note */}
          {specs.shipping && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '10px 0', marginBottom: 20 }}>
              ✓ {specs.shipping}
            </div>
          )}

          {/* Size selector (merch only) */}
          {specs.sizes && specs.sizes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Size</span>
                <button style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Size guide
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {specs.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '9px 16px', fontSize: 13, fontWeight: 500,
                      border: selectedSize === size ? '2px solid #111' : '1px solid var(--border-2)',
                      borderRadius: 6, background: selectedSize === size ? '#111' : 'transparent',
                      color: selectedSize === size ? '#fff' : 'var(--text)',
                      cursor: 'pointer', transition: 'all 0.15s', minWidth: 48,
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color swatches */}
          {specs.colors && (
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, marginRight: 12 }}>Color</span>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                {specs.colors.map(c => (
                  <button
                    key={c.name}
                    title={c.name}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: c.hex, border: '2px solid #111',
                      cursor: 'pointer', outline: '2px solid transparent',
                      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3)',
                    }}
                    aria-label={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Qty</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-2)', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 34, height: 34, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>−</button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 34, height: 34, fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>+</button>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <a
              href={shopifyUrl}
              target="_blank"
              rel="noopener"
              className="btn btn-primary"
              style={{ justifyContent: 'center', padding: '15px', fontSize: 14, borderRadius: 8, ...(isMerch && !selectedSize ? { opacity: 0.6, pointerEvents: 'none' } : {}) }}
              onClick={e => { if (isMerch && !selectedSize) { e.preventDefault(); alert('Please select a size'); } }}
            >
              {isMerch && !selectedSize ? 'Select a size to continue' : `Add to cart — $${product.price * qty}`}
            </a>

            {/* Shop Pay button (matching Shopify's exact styling) */}
            <a
              href={shopifyUrl}
              target="_blank" rel="noopener"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#5a31f4', color: '#fff', padding: '14px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              Buy with
              <svg height="16" viewBox="0 0 49 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Shop Pay">
                <path d="M8.47 5.23c0 1.35-.48 2.4-1.44 3.17C6.08 9.19 4.86 9.6 3.3 9.6H0V.9h3.38c1.52 0 2.72.4 3.61 1.2.89.8 1.48 1.86 1.49 3.13zm-1.82.02c0-.92-.27-1.65-.82-2.19-.55-.54-1.35-.81-2.4-.81H1.72v6h1.6c1.07 0 1.9-.28 2.48-.84.58-.56.85-1.27.85-2.16zm9.67-1.95c.9 0 1.62.27 2.17.82.55.54.82 1.26.82 2.15v.45H14.5c.05.47.23.85.53 1.12.3.27.69.4 1.16.4.35 0 .67-.06.95-.19.28-.13.54-.33.77-.6l1.05.93c-.6.79-1.5 1.18-2.72 1.18-.93 0-1.68-.3-2.27-.88-.58-.59-.87-1.35-.87-2.28s.29-1.68.88-2.27c.59-.6 1.34-.83 2.25-.83zm1.28 2.46c-.06-.42-.21-.76-.47-1-.25-.25-.57-.37-.96-.37-.37 0-.68.12-.92.37-.24.24-.39.58-.45 1h2.8zm9.05-2.36l.87 3.76.99-3.76h1.67l-1.8 5.97h-1.72l-.98-3.8-.99 3.8H23.3L21.5 3.4h1.65l1 3.77.88-3.77h1.59zm9.09 6.1c-.92 0-1.66-.29-2.22-.88-.56-.59-.84-1.35-.84-2.27s.28-1.68.84-2.27c.56-.59 1.3-.88 2.22-.88.94 0 1.68.3 2.24.88.56.59.84 1.35.84 2.27s-.28 1.68-.84 2.27c-.56.59-1.3.88-2.24.88zm0-1.44c.43 0 .77-.15 1.03-.44.26-.3.39-.69.39-1.27s-.13-.97-.39-1.27c-.26-.29-.6-.44-1.03-.44-.43 0-.77.15-1.03.44-.26.29-.39.69-.39 1.27s.13.98.39 1.27c.26.29.6.44 1.03.44zm7.36-4.7c.7 0 1.27.24 1.7.73.43.48.65 1.13.65 1.95v3.27H43.8V5.97c0-.44-.11-.79-.33-1.04-.22-.25-.53-.38-.92-.38-.4 0-.72.14-.96.41-.24.27-.36.63-.36 1.09v3.32h-1.72V3.4h1.72v.78c.22-.28.52-.5.88-.66.36-.16.74-.24 1.14-.26z" fill="white"/>
              </svg>
            </a>
          </div>

          {/* Share/wishlist row */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
              ♡ Save
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
              Share
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}
              onClick={() => fileRef.current?.click()}
            >
              🖼 Swap image
            </button>
          </div>

          {/* Collapsible info sections */}
          {specs.features && specs.features.length > 0 && (
            <Collapsible title="Features">
              <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {specs.features.map(f => <li key={f}>{f}</li>)}
              </ul>
            </Collapsible>
          )}
          {specs.material && (
            <Collapsible title="Material &amp; Care">
              <p>{specs.material}</p>
              {specs.care && <p style={{ marginTop: 8 }}>{specs.care}</p>}
            </Collapsible>
          )}
          <Collapsible title="Shipping &amp; Returns">
            <p>{specs.shipping || 'Free shipping on all orders. 30-day returns.'}</p>
          </Collapsible>
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
