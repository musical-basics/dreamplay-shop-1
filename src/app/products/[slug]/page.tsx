'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Product } from '@/lib/db';

// ── Real Shopify product copy — scraped word-for-word from dreamplay-pianos.myshopify.com ──
const PRODUCT_SPECS: Record<string, {
  headline?: string;
  description?: string;       // plain-text opening line shown above bullets
  whyYoullLoveIt?: string[];  // "Why You'll Love It" bullets (Official Hoodie)
  details?: string[];         // "Details" bullets
  features?: string[];        // generic bullet list
  material?: string;
  care?: string;
  shipping?: string;
  lifestyle?: string;         // closing paragraph (Official Hoodie)
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  reviews?: { count: number; avg: number };
  stock?: number;
  comparePrice?: number;
}> = {
  /* ── ICON Black Hoodie ─ scraped verbatim ── */
  'icon-black-hoodie': {
    headline: 'The Icon Hoodie — Made for the Stage, the Session, and the Streets.',
    description: 'Centered DreamPlay icon on the chest in oversized print. No explanation needed. If you know, you know. Heavy, structured cotton that layers well over a tee or under a jacket. Built for late-night sessions, cold skatepark mornings, and everything in between.',
    features: [
      '380gsm heavyweight French terry cotton',
      'Oversized centered DreamPlay icon on chest',
      'Also available with side chest logo placement',
      'Kangaroo pocket',
      'Relaxed streetwear fit',
      'Reinforced ribbed cuffs and hem',
    ],
    shipping: 'Free shipping on all orders. 30-day hassle-free returns.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Black', hex: '#111' }],
    material: '80% cotton, 20% polyester · 380gsm French terry',
    care: 'Machine wash cold · Tumble dry low · Do not bleach · Do not iron logo',
    reviews: { count: 47, avg: 5.0 },
    stock: 108,
    comparePrice: 78,
  },

  /* ── Official Black Hoodie ─ scraped verbatim ── */
  'official-black-hoodie': {
    headline: 'The Official DreamPlay Hoodie — Built for Musicians Who Move.',
    description: 'Crafted from premium heavyweight French terry cotton, the DreamPlay Black Hoodie is as comfortable at the keys as it is on the street. Minimalist branding. Maximum comfort. Zero compromise.',
    whyYoullLoveIt: [
      'Designed for players — relaxed fit keeps shoulders free for full range of motion',
      'Stealth DreamPlay branding — screen printed, or embroidered logo, no loud graphics',
      'Heavyweight 380gsm French terry — thick, soft, holds its shape wash after wash',
      'Modern relaxed fit — not too baggy, not too slim',
      'Reinforced ribbed cuffs & hem — built to last through daily wear',
    ],
    details: [
      '100% combed ring-spun cotton',
      'Pre-shrunk for true-to-size fit',
      'Embroidered DreamPlay logo on chest',
      'Kangaroo pocket',
      'Available in sizes S–XL',
    ],
    lifestyle: "Part of the DreamPlay lifestyle. Whether you're practicing, performing, or just repping the brand you love — this hoodie belongs in your rotation.",
    shipping: 'Free shipping on all orders. 30-day hassle-free returns.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [{ name: 'Black', hex: '#111' }],
    material: '100% combed ring-spun cotton · 380gsm · Pre-shrunk',
    care: 'Machine wash cold inside out · Hang dry recommended · Do not bleach',
    reviews: { count: 23, avg: 4.9 },
    stock: 64,
    comparePrice: 75,
  },

  /* ── Keyboards ─ scraped verbatim (short copy on Shopify) ── */
  'ds-6-0-pro-keyboard': {
    headline: 'Ships August 2026. Shipping details finalized before delivery.',
    features: ['88 fully-weighted hammer-action keys', 'Studio-grade 192kHz/24-bit sound engine', 'Bluetooth MIDI + USB Type-C', 'Built-in speakers + headphone out', '500+ instrument voices', 'DreamPlay app compatible'],
    shipping: 'Free shipping. Ships August 2026. Shipping details finalized before delivery.',
    material: 'Aircraft-grade aluminum chassis · German-action keybed',
    reviews: { count: 12, avg: 5.0 },
    stock: 50,
    comparePrice: 299,
  },
  'ds-6-0-white': {
    headline: 'Ships August 2026. Shipping details finalized before delivery.',
    features: ['88 fully-weighted keys', 'Ivory finish — special edition colorway', 'All DreamPlay One Pro features included', 'DreamPlay app compatible'],
    shipping: 'Free shipping. Ships August 2026.',
    reviews: { count: 8, avg: 4.8 },
    stock: 30,
    comparePrice: 299,
  },
  'ds-6-0-gold': {
    headline: 'Limited to 50 units worldwide.',
    features: ['Hand-polished champagne gold finish', '88 fully-weighted hammer-action keys', 'Limited to 50 units worldwide', 'Certificate of authenticity included', 'All DreamPlay One Pro features'],
    shipping: 'Free shipping. Made to order — 12-week lead time. Ships August 2026.',
    reviews: { count: 4, avg: 5.0 },
    stock: 12,
    comparePrice: 699,
  },
  'ds-6-0-nightmare-black': {
    headline: 'Ships August 2026. Shipping details finalized before delivery.',
    features: ['88 fully-weighted keys', 'Matte Nightmare Black finish — premium blacked-out key housing', 'All DreamPlay One Pro features included', 'DreamPlay app compatible'],
    shipping: 'Free shipping. Ships August 2026.',
    reviews: { count: 9, avg: 4.9 },
    stock: 45,
    comparePrice: 319,
  },
  'ds-5-5-keyboard': {
    headline: 'Ships August 2026. Shipping details finalized before delivery.',
    features: ['61 semi-weighted keys', 'Portable compact design', '300+ instrument voices', 'USB MIDI + 1/4" output'],
    shipping: 'Free shipping on all orders.',
    reviews: { count: 31, avg: 4.7 },
    stock: 100,
  },
  'dreamplay-go': {
    headline: 'Ships August 2026. Shipping details finalized before delivery.',
    features: ['61 keys — ultra-portable at 2.3 lbs', 'Built-in speaker', 'USB-C powered — no battery needed', 'DreamPlay app compatible (iOS & Android)'],
    shipping: 'Free shipping on all orders.',
    reviews: { count: 18, avg: 4.6 },
    stock: 200,
  },
};

// ── Stars ────────────────────────────────────────────────────────────────────
function Stars({ avg }: { avg: number }) {
  return (
    <span style={{ color: '#111', display: 'flex', gap: 1 }} aria-label={`${avg} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= avg ? '#111' : 'none'} stroke="#111" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

// ── Collapsible ───────────────────────────────────────────────────────────────
function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 0', fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        {title}
        <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--text-muted)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && <div style={{ paddingBottom: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{children}</div>}
    </div>
  );
}

// ── Description rich render — mirrors Shopify's product description HTML ─────
function ProductDescription({ slug, specs }: { slug: string; specs: (typeof PRODUCT_SPECS)[string] }) {
  const ul = (items: string[]) => (
    <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }}>
      {items.map(f => <li key={f} style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f}</li>)}
    </ul>
  );
  return (
    <div style={{ marginBottom: 20 }}>
      {specs.headline && (
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, lineHeight: 1.5 }}>
          {specs.headline}
        </p>
      )}
      {specs.description && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8 }}>
          {specs.description}
        </p>
      )}
      {specs.whyYoullLoveIt && (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 12, marginBottom: 2 }}>Why You&apos;ll Love It:</p>
          {ul(specs.whyYoullLoveIt)}
        </>
      )}
      {specs.details && (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 12, marginBottom: 2 }}>Details:</p>
          {ul(specs.details)}
        </>
      )}
      {specs.features && !specs.whyYoullLoveIt && ul(specs.features)}
      {specs.lifestyle && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 10 }}>
          {specs.lifestyle}
        </p>
      )}
      {specs.shipping && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          {specs.shipping}
        </p>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
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

  const imgs = product.images;
  const isMerch = product.category === 'merch';
  const shopifyUrl = product.shopify_url || 'https://dreamplay-pianos.myshopify.com/collections/all';
  // Direct Shopify checkout URL for "Add to cart" (redirects to their hosted checkout)
  const shopifyCheckoutUrl = product.shopify_url || shopifyUrl;

  return (
    <>
      {/* Header */}
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

      {/* ── Main two-column layout ───────────────────────────────── */}
      <div className="pdp-shopify-outer">

        {/* LEFT: photo gallery — natural portrait heights, never cropped */}
        <div className="pdp-gallery">
          {imgs.length > 0 ? (
            <div className="pdp-gallery-grid">
              {/* Large portrait — left column */}
              <div
                className={`pdp-gallery-item featured${isDragOver ? ' drag-over' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={async e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadImage(f); }}
                onClick={() => fileRef.current?.click()}
                title="Click to replace image"
              >
                <img src={imgs[0].url} alt={product.name} loading="eager" />
                <div className="pdp-gallery-drop-hint">📁 Drop to replace</div>
              </div>

              {/* Remaining images — 2-column right sub-grid, all height:auto */}
              {imgs.length > 1 && (
                <div className="pdp-gallery-right">
                  {imgs.slice(1).map((img, i) => (
                    <div
                      key={img.id}
                      className="pdp-gallery-item"
                      onDragOver={e => e.preventDefault()}
                      onDrop={async e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) uploadImage(f); }}
                    >
                      <img src={img.url} alt={`${product.name} ${i + 2}`} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}

              {uploadMsg && (
                <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 999 }}>
                  {uploadMsg}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--bg-2)', height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No images — run <code style={{ margin: '0 6px', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: 4 }}>pnpm seed</code>
            </div>
          )}
        </div>

        {/* RIGHT: sticky info panel */}
        <div className="pdp-info-panel">
          {/* Brand label */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 6 }}>DreamPlay</div>

          {/* Title */}
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 10 }}>
            {product.name}
          </h1>

          {/* Rating row */}
          {specs.reviews && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12 }}>
              <Stars avg={specs.reviews.avg} />
              <a href="#reviews" style={{ color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}>{specs.reviews.count} reviews</a>
              {specs.stock && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>· {specs.stock} in stock</span>}
            </div>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>${product.price}</span>
            {specs.comparePrice && specs.comparePrice > product.price && (
              <span style={{ fontSize: 14, color: 'var(--text-dim)', textDecoration: 'line-through' }}>${specs.comparePrice}</span>
            )}
            {specs.comparePrice && specs.comparePrice > product.price && (
              <span style={{ background: '#c0392b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sale</span>
            )}
          </div>

          {/* ── Product description — word-for-word from Shopify ── */}
          <ProductDescription slug={slug} specs={specs} />

          {/* Size selector (merch) */}
          {specs.sizes && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Size{selectedSize ? `: ${selectedSize}` : ''}
                </span>
                <button style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 2, border: 'none', background: 'none', cursor: 'pointer' }}>Size guide</button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {specs.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '8px 14px', fontSize: 13, fontWeight: 500,
                      border: selectedSize === size ? '2px solid #111' : '1px solid var(--border-2)',
                      borderRadius: 6,
                      background: selectedSize === size ? '#111' : 'transparent',
                      color: selectedSize === size ? '#fff' : 'var(--text)',
                      cursor: 'pointer', transition: 'all 0.12s', minWidth: 46,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Color</span>
              {specs.colors.map(c => (
                <button key={c.name} title={c.name} style={{ width: 22, height: 22, borderRadius: '50%', background: c.hex, border: '2px solid #111', cursor: 'pointer', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.3)' }} aria-label={c.name} />
              ))}
            </div>
          )}

          {/* Quantity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Qty</span>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-2)', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 34, height: 34, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 600, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 34, height: 34, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          {/* ── CTAs ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {/* Add to Cart — links to Shopify's own cart/product page */}
            <a
              href={shopifyCheckoutUrl}
              target="_blank" rel="noopener"
              className="btn btn-primary"
              style={{ justifyContent: 'center', padding: '14px', fontSize: 14, borderRadius: 8, ...(isMerch && !selectedSize ? { opacity: 0.55, pointerEvents: 'none' } : {}) }}
            >
              {isMerch && !selectedSize ? 'Select a size' : `Add to cart — $${(product.price * qty).toFixed(2)}`}
            </a>

            {/* ── Real Shopify Buy Button (Shop Pay) ──
                Links directly to Shopify's checkout — the /cart/now endpoint
                pre-fills quantity. When the user is logged in to Shop Pay,
                Shopify's own checkout page shows their saved card (e.g. Visa 0258).
                We cannot embed the interactive SDK button without a Storefront token,
                so we link to Shopify's checkout directly — same visual, same result. */}
            {/* Shop Pay button — exact PNG the user provided, served from public/ */}
            <a
              href="https://dreamplay-pianos.myshopify.com/checkout"
              target="_blank"
              rel="noopener"
              style={{ display: 'block', width: '100%', textDecoration: 'none' }}
              aria-label="Buy with Shop Pay"
            >
              <img
                src="/shop-pay-btn.png"
                alt="Buy with Shop Pay"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
              />
            </a>

            <div style={{ textAlign: 'center', marginTop: -4 }}>
              <a href={shopifyCheckoutUrl} target="_blank" rel="noopener" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', textUnderlineOffset: 2 }}>More payment options</a>
            </div>
          </div>

          {/* Share / swap tools */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 22 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>♡ Save</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>Share</button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }} onClick={() => fileRef.current?.click()}>🖼 Swap image</button>
          </div>

          {/* Collapsible info */}
          {(specs.features || specs.whyYoullLoveIt) && (
            <Collapsible title="Details">
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {(specs.features ?? [...(specs.whyYoullLoveIt ?? []), ...(specs.details ?? [])]).map(f => <li key={f}>{f}</li>)}
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
            <p>{specs.shipping || 'Free shipping on all orders. 30-day hassle-free returns.'}</p>
          </Collapsible>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ''; }} />
    </>
  );
}
