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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { h, m, s } = useCountdown(72);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  const pianos = products.filter(p => p.category === 'pianos');
  const merch  = products.filter(p => p.category === 'merch');

  // Hero — keyboard products only (fall back to all if no pianos)
  const heroSlides = pianos.length ? pianos : products;
  const n = Math.max(heroSlides.length, 1);

  const advance = useCallback(() => {
    setSlideIdx(i => (i + 1) % n);
  }, [n]);

  const goSlide = useCallback((idx: number) => {
    setSlideIdx(idx);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, 5000);
  }, [advance]);

  useEffect(() => {
    timerRef.current = setTimeout(advance, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [advance]);

  useEffect(() => {
    const btn = document.getElementById('scroll-top-btn');
    const onScroll = () => { if (btn) btn.classList.toggle('visible', window.scrollY > 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slide    = heroSlides[slideIdx] ?? null;
  const slideImg = slide?.images.find(i => i.is_primary) ?? slide?.images[0];

  // Category tiles — exactly 4 like Concept theme reference
  const categoryTiles = [
    { key: 'all',   label: 'All products',  sub: 'Check out all our products', count: products.length,  href: '/collections/merch',  product: products[0],                                       isAll: true },
    { key: 'merch', label: 'Merch',         sub: 'Rep the DreamPlay brand',    count: merch.length,     href: '/collections/merch',  product: merch[0],                                          isAll: false },
    { key: 'ds60',  label: 'DS 6.0 Series', sub: 'Our flagship keyboard',      count: pianos.filter(p => p.subcategory?.includes('6.0')).length, href: '/collections/pianos', product: pianos.find(p => p.subcategory?.includes('6.0')), isAll: false },
    { key: 'ds55',  label: 'DS 5.5',        sub: 'Compact powerhouse',         count: pianos.filter(p => p.subcategory?.includes('5.5')).length, href: '/collections/pianos', product: pianos.find(p => p.subcategory?.includes('5.5')), isAll: false },
  ];

  return (
    <>
      {/* ── Announcement bar ── */}
      <div className="ann-bar">
        ⚡ Flash Drop — 20% off sitewide · Ends in <span className="timer">{h}h {m}m {s}s</span> ·{' '}
        <a href="https://dreamplay-pianos.myshopify.com/collections/all" target="_blank" rel="noopener">Shop now</a>
      </div>

      {/* ── Header — matches Concept theme: logo left, nav center, icons right ── */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">DreamPlay <span>Studio</span></Link>
            <nav className="header-nav">
              <Link href="/" className="nav-link active">Shop</Link>
              <div className="nav-item">
                <Link href="/collections/merch" className="nav-link">Collections</Link>
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
                <Link href="/collections/pianos" className="nav-link">Explore</Link>
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
              <Link href="#flash-sale" className="nav-link">Contact</Link>
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

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: Full-width Hero Carousel — Concept theme style
          Single large image, bold UPPERCASE text bottom-left,
          white pill CTA right, dot nav below, social icons left edge
          ══════════════════════════════════════════════════════════════ */}
      <section className="concept-hero" aria-label="Featured keyboards">
        {/* Full bleed image */}
        <div className="concept-hero-img">
          {slideImg
            ? <img key={slideImg.url} src={slideImg.url} alt={slide?.name ?? ''} loading="eager" className="concept-hero-photo" />
            : <div className="concept-hero-placeholder" />}
          {/* Bottom gradient for text legibility */}
          <div className="concept-hero-overlay" aria-hidden="true" />
        </div>

        {/* Social icons — left sidebar, matching Concept theme exactly */}
        <div className="concept-social" aria-label="Social links">
          <a href="https://www.facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://twitter.com/dreamplaypianos" target="_blank" rel="noopener" aria-label="X / Twitter">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://www.instagram.com/dreamplaypianos" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://youtube.com/@dreamplaypianos" target="_blank" rel="noopener" aria-label="YouTube">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>

        {/* Text content — bottom-left, exactly like Concept theme */}
        <div className="concept-hero-content">
          <h1 className="concept-hero-headline">
            PLAY WITHOUT<br />LIMITS.
          </h1>
          {/* White pill CTA — floats right, Concept style */}
          <Link href={slide ? `/products/${slide.slug}` : '/collections/pianos'} className="concept-hero-cta">
            {slide?.category === 'pianos' ? `Pre-order ${slide.name}` : 'Shop Now'} →
          </Link>
        </div>

        {/* Carousel controls — prev / dots / next at bottom */}
        <div className="concept-hero-controls">
          <button
            className="concept-hero-arrow"
            onClick={() => goSlide((slideIdx - 1 + n) % n)}
            aria-label="Previous slide"
          >←</button>
          <div className="concept-hero-dots">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                className={`concept-hero-dot${i === slideIdx ? ' active' : ''}`}
                onClick={() => goSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            className="concept-hero-arrow"
            onClick={() => goSlide((slideIdx + 1) % n)}
            aria-label="Next slide"
          >→</button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: Brand statement — "We believe in the power of music."
          Concept theme: left = big italic serif heading + pill CTA,
          right = 2 paragraphs of brand copy
          ══════════════════════════════════════════════════════════════ */}
      <section className="concept-brand">
        <div className="concept-brand-left">
          <h2 className="concept-brand-heading">
            We believe in the<br />
            <em>power of music.</em>
          </h2>
          <Link href="/collections/pianos" className="concept-brand-btn">
            Our Story →
          </Link>
        </div>
        <div className="concept-brand-right">
          <p>
            <strong>DreamPlay Pianos</strong> is a piano brand launched with the mission to make premium piano experiences accessible to every musician. We represent the craft of music in its finest manifestations — connecting aspiring players with high-quality instruments they can call their own.
          </p>
          <p>
            We offer everything from our flagship 88-key DS 6.0 Pro to the portable DreamPlay Go — ensuring every note sounds impeccable, wherever you play. Rep the brand. Play the instrument.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: Category tiles — 4-col grid, Concept style
          First tile "All products" = dark overlay + white text 
          Others = square image + name + count + → below
          ══════════════════════════════════════════════════════════════ */}
      <section className="concept-tiles">
        <div className="concept-tiles-grid">
          {categoryTiles.map(tile => {
            const img = tile.product?.images.find(pi => pi.is_primary) ?? tile.product?.images[0];
            return (
              <Link href={tile.href} key={tile.key} className={`concept-tile${tile.isAll ? ' concept-tile-all' : ''}`}>
                <div className="concept-tile-img">
                  {img
                    ? <img src={img.url} alt={tile.label} loading="lazy" />
                    : <div className="concept-tile-placeholder">{tile.isAll ? '🛍' : '🎹'}</div>}
                  {/* Overlay for "All products" tile */}
                  {tile.isAll && <div className="concept-tile-all-overlay" />}
                  {tile.isAll && (
                    <div className="concept-tile-all-text">
                      <div className="concept-tile-all-label">{tile.label} <sup>{tile.count}</sup></div>
                      <div className="concept-tile-all-sub">{tile.sub}</div>
                      <span className="concept-tile-all-arrow">→</span>
                    </div>
                  )}
                </div>
                {!tile.isAll && (
                  <div className="concept-tile-info">
                    <div className="concept-tile-name">
                      {tile.label} <sup>{tile.count}</sup>
                      <span className="concept-tile-arrow-inline">→</span>
                    </div>
                    <div className="concept-tile-sub">{tile.sub}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
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

      {/* ── Merch products ── */}
      {merch.length > 0 && (
        <section className="products-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Merch &amp; Apparel</h2>
              <Link href="/collections/merch" className="view-all-link">View all →</Link>
            </div>
            <div className="products-scroll">
              {merch.map(p => {
                const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
                return (
                  <Link href={`/products/${p.slug}`} key={p.slug} className="product-card">
                    <div className="product-card-img">
                      {img && <img src={img.url} alt={p.name} loading="lazy" />}
                      {p.badge && <span className="product-badge badge-new">{p.badge}</span>}
                      <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || 'https://dreamplay-pianos.myshopify.com', '_blank'); }}>Buy Now →</button>
                    </div>
                    <div className="product-card-info">
                      <div className="product-card-name">{p.name}</div>
                      <div className="product-card-sub">{p.subcategory}</div>
                      <div className="product-price"><span className="price-current">${p.price}</span></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Keyboards ── */}
      {pianos.length > 0 && (
        <section className="products-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Keyboards</h2>
              <Link href="/collections/pianos" className="view-all-link">View all →</Link>
            </div>
            <div className="products-scroll">
              {pianos.map(p => {
                const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
                return (
                  <Link href={`/products/${p.slug}`} key={p.slug} className="product-card">
                    <div className="product-card-img">
                      {img && <img src={img.url} alt={p.name} loading="lazy" />}
                      {p.badge && <span className={`product-badge ${p.badge === 'Coming Soon' ? 'badge-soon' : 'badge-new'}`}>{p.badge}</span>}
                      <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || 'https://dreamplay-pianos.myshopify.com', '_blank'); }}>Pre-order →</button>
                    </div>
                    <div className="product-card-info">
                      <div className="product-card-name">{p.name}</div>
                      <div className="product-card-sub">{p.subcategory}</div>
                      <div className="product-price"><span className="price-current">${p.price}</span></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Flash Sale ── */}
      <section className="flash-band" id="flash-sale">
        <div className="container">
          <div className="flash-band-inner">
            <div>
              <div className="flash-eyebrow"><span className="flash-dot" />Limited Time</div>
              <div className="flash-title">20% Off.<br />Everything.</div>
              <div className="countdown" role="timer">
                {[['Hours', h], ['Mins', m], ['Secs', s]].map(([label, val]) => (
                  <div key={label} className="countdown-unit">
                    <span className="countdown-num">{val}</span>
                    <span className="countdown-label">{label}</span>
                  </div>
                ))}
              </div>
              <Link href="https://dreamplay-pianos.myshopify.com/collections/all" className="btn btn-primary btn-lg" target="_blank" rel="noopener">Shop the Sale →</Link>
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
              <div className="footer-tagline">Official merch and instruments for musicians and creators.</div>
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
                <li><a href="#">FAQ</a></li><li><a href="#">Shipping</a></li><li><a href="#">Returns</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <ul className="footer-links">
                <li><a href="#">About</a></li><li><Link href="/admin">Manage</Link></li>
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
            <Link href="/admin" onClick={() => setMobileNavOpen(false)}>Manage</Link>
          </nav>
        </div>
      </div>

      <button id="scroll-top-btn" className="scroll-top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </>
  );
}
