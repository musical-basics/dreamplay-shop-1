'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/db';

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(hours = 72) {
  const [t, setT] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const key = 'dp_flash_end';
    let end = Number(localStorage.getItem(key) || 0);
    if (!end || end < Date.now()) { end = Date.now() + hours * 3600000; localStorage.setItem(key, String(end)); }
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setT({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hours]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { h: pad(t.h), m: pad(t.m), s: pad(t.s) };
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────
function HeroCarousel({ products }: { products: Product[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((n: number) => {
    setIdx(n);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIdx(i => (i + 1) % products.length), 5000);
  }, [products.length]);

  useEffect(() => {
    if (!products.length) return;
    timerRef.current = setTimeout(() => setIdx(i => (i + 1) % products.length), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [products.length]);

  if (!products.length) return (
    <div style={{ height: '70vh', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
      Run <code style={{ margin: '0 6px', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 4 }}>pnpm seed</code> to load products
    </div>
  );

  const p = products[idx];
  const img = p.images.find(i => i.is_primary) ?? p.images[0];

  return (
    <div className="hero-carousel" aria-roledescription="carousel">
      {/* Full-width slide */}
      <div className="hero-carousel-slide">
        {/* Background image — fills left 65% */}
        <div className="hero-carousel-img">
          {img ? (
            <img key={img.url} src={img.url} alt={p.name} loading="eager" />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-2)' }} />
          )}
        </div>

        {/* Right panel — product info */}
        <div className="hero-carousel-info">
          <div className="hero-carousel-eyebrow">
            {p.category === 'merch' ? 'New Drop' : 'Pre-Order'} · {p.subcategory}
          </div>
          <h2 className="hero-carousel-title">{p.name}</h2>
          <div className="hero-carousel-price">${p.price}</div>
          {p.badge && (
            <span style={{ display: 'inline-block', background: p.badge === 'Coming Soon' ? 'var(--bg-3)' : '#111', color: p.badge === 'Coming Soon' ? 'var(--text-muted)' : '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              {p.badge}
            </span>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href={`/products/${p.slug}`} className="btn btn-primary btn-lg">
              {p.category === 'pianos' ? 'Pre-order Now' : 'Shop Now'}
            </Link>
            <Link href={`/collections/${p.category}`} className="btn btn-secondary btn-lg">
              See Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Dot nav + arrows */}
      <div className="hero-carousel-nav">
        <button className="hero-carousel-arrow" onClick={() => go((idx - 1 + products.length) % products.length)} aria-label="Previous">‹</button>
        <div className="hero-carousel-dots">
          {products.map((_, i) => (
            <button
              key={i}
              className={`hero-carousel-dot${i === idx ? ' active' : ''}`}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button className="hero-carousel-arrow" onClick={() => go((idx + 1) % products.length)} aria-label="Next">›</button>
      </div>

      {/* Slide counter */}
      <div className="hero-carousel-counter" aria-live="polite">
        {String(idx + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ p }: { p: Product }) {
  const img = p.images.find(i => i.is_primary) ?? p.images[0];
  const img2 = p.images.find(i => !i.is_primary && i !== img);
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={`/products/${p.slug}`}
      className="product-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="product-card-img">
        {img && <img src={hover && img2 ? img2.url : img.url} alt={p.name} loading="lazy" style={{ transition: 'opacity 0.3s' }} />}
        {p.badge && <span className={`product-badge ${p.badge === 'Coming Soon' ? 'badge-soon' : p.badge === 'Sale' ? 'badge-sale' : 'badge-new'}`}>{p.badge}</span>}
        <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || 'https://dreamplay-pianos.myshopify.com/collections/all', '_blank'); }}>
          {p.category === 'pianos' ? 'Pre-order →' : 'Buy Now →'}
        </button>
      </div>
      <div className="product-card-info">
        <div className="product-card-name">{p.name}</div>
        <div className="product-card-sub">{p.subcategory}</div>
        <div className="product-price"><span className="price-current">${p.price}</span></div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'merch' | 'pianos'>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { h, m, s } = useCountdown(72);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    const btn = document.getElementById('scroll-top-btn');
    const onScroll = () => { if (btn) btn.classList.toggle('visible', window.scrollY > 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pianos = products.filter(p => p.category === 'pianos');
  const merch = products.filter(p => p.category === 'merch');

  // Section 1 carousel: show all products (merch first, then pianos)
  const carouselProducts = [...merch, ...pianos];

  // Section 2 grid: filtered
  const gridProducts = activeFilter === 'all' ? products : products.filter(p => p.category === activeFilter);

  return (
    <>
      {/* Announcement bar */}
      <div className="ann-bar">
        ⚡ Flash Drop active — 20% off sitewide · Ends in <span className="timer">{h}h {m}m {s}s</span> ·{' '}
        <a href="https://dreamplay-pianos.myshopify.com/collections/all" target="_blank" rel="noopener">Shop now</a>
      </div>

      {/* Header */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">DreamPlay <span>Studio</span></Link>
            <nav className="header-nav">
              <Link href="/" className="nav-link active">Home</Link>
              <div className="nav-item">
                <Link href="/collections/merch" className="nav-link">Merch</Link>
                <div className="mega-menu">
                  {merch.slice(0, 3).map(p => {
                    const img = p.images.find(i => i.is_primary) ?? p.images[0];
                    return (
                      <Link href={`/products/${p.slug}`} key={p.slug} className="mega-item">
                        {img && <img src={img.url} alt={p.name} loading="lazy" />}
                        <div className="mega-item-info"><div className="mega-item-name">{p.name}</div><div className="mega-item-price">${p.price}</div></div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="nav-item">
                <Link href="/collections/pianos" className="nav-link">Keyboards</Link>
                <div className="mega-menu">
                  {pianos.slice(0, 3).map(p => {
                    const img = p.images.find(i => i.is_primary) ?? p.images[0];
                    return (
                      <Link href={`/products/${p.slug}`} key={p.slug} className="mega-item">
                        {img && <img src={img.url} alt={p.name} loading="lazy" />}
                        <div className="mega-item-info"><div className="mega-item-name">{p.name}</div><div className="mega-item-price">${p.price}</div></div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <Link href="#flash-sale" className="nav-link">Sale</Link>
              <Link href="/admin" className="nav-link">Manage</Link>
            </nav>
            <div className="header-actions">
              <button className="icon-btn" aria-label="Search">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
              <a href="https://dreamplay-pianos.myshopify.com/account" className="icon-btn" aria-label="Account">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </a>
              <button className="icon-btn" aria-label="Cart" onClick={() => setCartOpen(true)}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span className="cart-badge">0</span>
              </button>
              <button className="hamburger" aria-label="Menu" onClick={() => setMobileNavOpen(true)}>
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          SECTION 1: Hero Product Carousel
          Full-width, auto-advances every 5s, left = large product
          image, right = product name / price / CTAs
          ════════════════════════════════════════════════════════ */}
      <section aria-label="Featured products">
        <HeroCarousel products={carouselProducts} />
      </section>

      {/* Scrolling text marquee */}
      <div className="text-marquee" aria-hidden="true">
        <div className="text-marquee-track">
          {[0, 1, 2].map(n => (
            <div className="text-marquee-item" key={n}>
              ICON Hoodie <span className="sep">·</span> Official Hoodie <span className="sep">·</span> DS 6.0 Pro <span className="sep">·</span> DS 5.5 <span className="sep">·</span> DreamPlay Go <span className="sep">·</span> Gold Edition <span className="sep">·</span> Nightmare Black
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 2: "Browse our latest products" — thumbnail grid
          Filter tabs: All · Merch · Keyboards
          ════════════════════════════════════════════════════════ */}
      <section style={{ padding: '56px 0' }}>
        <div className="container">
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 8 }}>DreamPlay Store</div>
              <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>
                Browse our latest products
              </h2>
            </div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'merch', 'pianos'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    padding: '7px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20,
                    border: activeFilter === f ? 'none' : '1px solid var(--border-2)',
                    background: activeFilter === f ? '#111' : 'transparent',
                    color: activeFilter === f ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                >
                  {f === 'all' ? `All (${products.length})` : f === 'merch' ? `Merch (${merch.length})` : `Keyboards (${pianos.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {gridProducts.map(p => <ProductCard key={p.slug} p={p} />)}
          </div>

          {gridProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🛍</div>
              <p>Run <code style={{ background: 'var(--bg-2)', padding: '2px 8px', borderRadius: 4 }}>pnpm seed</code> to load products</p>
            </div>
          )}

          {gridProducts.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <Link href={activeFilter === 'pianos' ? '/collections/pianos' : '/collections/merch'} className="btn btn-secondary btn-lg">
                Shop all {activeFilter === 'all' ? 'products' : activeFilter} →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Flash Sale band ────────────────────────────────────── */}
      <section className="flash-band" id="flash-sale">
        <div className="container">
          <div className="flash-band-inner">
            <div>
              <div className="flash-eyebrow"><span className="flash-dot" aria-hidden="true" />Limited Time</div>
              <div className="flash-title">20% Off.<br />Everything.</div>
              <div className="countdown" role="timer" aria-label="Sale countdown">
                {[['Hours', h], ['Mins', m], ['Secs', s]].map(([label, val]) => (
                  <div key={label} className="countdown-unit">
                    <span className="countdown-num">{val}</span>
                    <span className="countdown-label">{label}</span>
                  </div>
                ))}
              </div>
              <Link href="https://dreamplay-pianos.myshopify.com/collections/all" className="btn btn-primary btn-lg" target="_blank" rel="noopener">
                Shop the Sale →
              </Link>
            </div>
            <div className="products-scroll">
              {[...merch, ...pianos].slice(0, 4).map(p => {
                const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
                return (
                  <Link href={`/products/${p.slug}`} key={p.slug} className="product-card">
                    <div className="product-card-img">
                      {img && <img src={img.url} alt={p.name} loading="lazy" />}
                      <span className="product-badge badge-sale">–20%</span>
                    </div>
                    <div className="product-card-info">
                      <div className="product-card-name">{p.name}</div>
                      <div className="product-price">
                        <span className="price-current">${Math.round(p.price * 0.8)}</span>
                        <span className="price-original">${p.price}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">DreamPlay</div>
              <div className="footer-tagline">Official merch and instruments for musicians and creators. Limited drops, free US shipping.</div>
              <div className="footer-social">
                {[['IG', 'https://www.instagram.com/dreamplaypianos'], ['TT', 'https://www.tiktok.com/@dreamplaypianos'], ['YT', 'https://youtube.com/@dreamplaypianos']].map(([label, href]) => (
                  <a key={label} href={href} className="footer-social-btn" aria-label={label} target="_blank" rel="noopener">
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Shop</div>
              <ul className="footer-links">
                <li><Link href="/collections/merch">Merch</Link></li>
                <li><Link href="/collections/pianos">Keyboards</Link></li>
                <li><Link href="#flash-sale">Flash Sale</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><a href="#">FAQ</a></li><li><a href="#">Shipping</a></li><li><a href="#">Returns</a></li><li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links">
                <li><a href="#">About</a></li><li><Link href="/admin">Manage Images</Link></li><li><a href="#">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DreamPlay. All rights reserved.</span>
            <div className="footer-bottom-links"><a href="#">Privacy</a><a href="#">Terms</a></div>
            <span>Made with ♪ in LA</span>
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      <div className={`drawer-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Cart (0)</span>
          <button className="drawer-close" onClick={() => setCartOpen(false)} aria-label="Close">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="drawer-body">
          <div className="cart-empty">
            <div className="cart-empty-icon">🛍</div>
            <p>Your cart is empty</p>
            <Link href="/collections/merch" className="btn btn-secondary" onClick={() => setCartOpen(false)}>Continue Shopping</Link>
          </div>
        </div>
        <div className="drawer-footer">
          <div className="cart-subtotal"><span>Subtotal</span><span>$0.00</span></div>
          <a href="https://dreamplay-pianos.myshopify.com/cart" className="btn btn-primary" target="_blank" rel="noopener">Checkout →</a>
        </div>
      </div>

      {/* Mobile nav */}
      <div className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />
        <div className="mobile-nav-drawer">
          <button onClick={() => setMobileNavOpen(false)} style={{ alignSelf: 'flex-end', color: 'var(--text-muted)' }}>✕</button>
          <Link href="/" className="logo" style={{ fontSize: 18 }}>DreamPlay</Link>
          <nav className="mobile-nav-links">
            <Link href="/collections/merch" onClick={() => setMobileNavOpen(false)}>Merch</Link>
            <Link href="/collections/pianos" onClick={() => setMobileNavOpen(false)}>Keyboards</Link>
            <Link href="#flash-sale" onClick={() => setMobileNavOpen(false)}>Flash Sale</Link>
            <Link href="/admin" onClick={() => setMobileNavOpen(false)}>Manage Images</Link>
          </nav>
        </div>
      </div>

      <button id="scroll-top-btn" className="scroll-top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </>
  );
}
