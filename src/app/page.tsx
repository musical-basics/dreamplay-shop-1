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
  const merch = products.filter(p => p.category === 'merch');

  // Hero carousel — only keyboards
  const heroSlides = pianos.length ? pianos : products;

  const goSlide = useCallback((n: number) => {
    setSlideIdx(n);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSlideIdx(i => (i + 1) % Math.max(heroSlides.length, 1)), 5000);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!heroSlides.length) return;
    timerRef.current = setTimeout(() => setSlideIdx(i => (i + 1) % heroSlides.length), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [heroSlides.length]);

  useEffect(() => {
    const btn = document.getElementById('scroll-top-btn');
    const onScroll = () => { if (btn) btn.classList.toggle('visible', window.scrollY > 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Current slide product
  const slide = heroSlides[slideIdx] ?? null;
  const slideImg = slide?.images.find(i => i.is_primary) ?? slide?.images[0];

  // Side panels — adjacent slides
  const leftSlide  = heroSlides[(slideIdx - 1 + heroSlides.length) % Math.max(heroSlides.length, 1)] ?? slide;
  const rightSlide = heroSlides[(slideIdx + 1) % Math.max(heroSlides.length, 1)] ?? slide;
  const leftImg    = leftSlide?.images.find(i => i.is_primary) ?? leftSlide?.images[0];
  const rightImg   = rightSlide?.images.find(i => !i.is_primary) ?? rightSlide?.images[1] ?? rightSlide?.images[0];

  // Merch category tiles for Section 2
  const categoryTiles = [
    { key: 'all',     label: 'All products',   count: products.length,       href: '/collections/merch',  product: products[0] },
    { key: 'merch',   label: 'Merch',           count: merch.length,          href: '/collections/merch',  product: merch[0] },
    { key: 'hoodies', label: 'Hoodies',         count: merch.length,          href: '/collections/merch',  product: merch[0] },
    { key: 'ds60',    label: 'DS 6.0 Series',   count: pianos.filter(p => p.subcategory?.includes('6.0')).length, href: '/collections/pianos', product: pianos.find(p => p.subcategory?.includes('6.0')) },
    { key: 'ds55',    label: 'DS 5.5',          count: pianos.filter(p => p.subcategory?.includes('5.5')).length, href: '/collections/pianos', product: pianos.find(p => p.subcategory?.includes('5.5')) },
    { key: 'go',      label: 'DreamPlay Go',    count: pianos.filter(p => p.subcategory?.includes('Go')).length,  href: '/collections/pianos', product: pianos.find(p => p.subcategory?.includes('Go')) },
    { key: 'gold',    label: 'Gold Edition',    count: pianos.filter(p => p.name?.toLowerCase().includes('gold')).length, href: '/collections/pianos', product: pianos.find(p => p.name?.toLowerCase().includes('gold')) },
    { key: 'limited', label: 'Limited Edition', count: products.filter(p => p.badge === 'Limited Stock' || p.badge === 'Coming Soon').length, href: '/collections/pianos', product: pianos.find(p => p.badge === 'Coming Soon') },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="ann-bar">
        ⚡ Flash Drop active — 20% off sitewide · Ends in <span className="timer">{h}h {m}m {s}s</span> ·{' '}
        <a href="https://dreamplay-pianos.myshopify.com/collections/all" target="_blank" rel="noopener">Shop now</a>
      </div>

      {/* ── Header ── */}
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

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: 3-Panel Mosaic Hero — Keyboards
          Layout:  [left side panel] [CENTER — large + text overlay] [right side panel]
          Center auto-advances through keyboard products every 5s
          ══════════════════════════════════════════════════════════════ */}
      <section className="mosaic-hero" aria-label="Featured keyboards">

        {/* LEFT side panel — previous slide */}
        <Link
          href={leftSlide ? `/products/${leftSlide.slug}` : '/collections/pianos'}
          className="mosaic-panel mosaic-side mosaic-left"
          onClick={() => goSlide((slideIdx - 1 + Math.max(heroSlides.length, 1)) % Math.max(heroSlides.length, 1))}
        >
          {leftImg
            ? <img src={leftImg.url} alt={leftSlide?.name ?? ''} loading="eager" />
            : <div className="mosaic-placeholder" />}
          <div className="mosaic-side-overlay" />
          <span className="mosaic-side-arrow" aria-hidden="true">‹</span>
        </Link>

        {/* CENTER — large panel with text overlay + carousel dots */}
        <Link
          href={slide ? `/products/${slide.slug}` : '/collections/pianos'}
          className="mosaic-panel mosaic-center"
        >
          {slideImg
            ? <img key={slideImg.url} src={slideImg.url} alt={slide?.name ?? ''} loading="eager" className="mosaic-center-img" />
            : <div className="mosaic-placeholder" />}

          {/* Dark gradient overlay */}
          <div className="mosaic-overlay" aria-hidden="true" />

          {/* Text block — bottom-left, big bold white */}
          <div className="mosaic-content">
            <div className="mosaic-eyebrow">{slide?.badge ?? 'Pre-Order'} · DreamPlay</div>
            <h1 className="mosaic-headline">
              PLAY WITHOUT<br />LIMITS.
            </h1>
            <span className="mosaic-cta-btn">
              {slide?.category === 'pianos' ? 'Pre-order Now' : 'Shop Now'} →
            </span>
          </div>

          {/* Slide arrows on sides of center panel */}
          <button
            className="mosaic-center-arrow mosaic-center-prev"
            onClick={e => { e.preventDefault(); goSlide((slideIdx - 1 + heroSlides.length) % Math.max(heroSlides.length, 1)); }}
            aria-label="Previous"
          >‹</button>
          <button
            className="mosaic-center-arrow mosaic-center-next"
            onClick={e => { e.preventDefault(); goSlide((slideIdx + 1) % Math.max(heroSlides.length, 1)); }}
            aria-label="Next"
          >›</button>

          {/* Dot indicators */}
          <div className="mosaic-dots" aria-hidden="true">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                className={`mosaic-dot${i === slideIdx ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); goSlide(i); }}
              />
            ))}
          </div>
        </Link>

        {/* RIGHT side panel — next slide */}
        <Link
          href={rightSlide ? `/products/${rightSlide.slug}` : '/collections/pianos'}
          className="mosaic-panel mosaic-side mosaic-right"
          onClick={() => goSlide((slideIdx + 1) % Math.max(heroSlides.length, 1))}
        >
          {rightImg
            ? <img src={rightImg.url} alt={rightSlide?.name ?? ''} loading="eager" />
            : <div className="mosaic-placeholder" />}
          <div className="mosaic-side-overlay" />
          <span className="mosaic-side-arrow" aria-hidden="true">›</span>
        </Link>

        {/* Social sidebar — left edge, matching screenshot */}
        <div className="social-sidebar" aria-label="Social links">
          <a href="https://www.instagram.com/dreamplaypianos" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://www.tiktok.com/@dreamplaypianos" target="_blank" rel="noopener" aria-label="TikTok">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </a>
          <a href="https://youtube.com/@dreamplaypianos" target="_blank" rel="noopener" aria-label="YouTube">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          Brand statement — "We believe in the power of music."
          Matches screenshot layout: big heading left, body text right
          ══════════════════════════════════════════════════════════════ */}
      <div className="brand-section reveal">
        <div className="brand-left">
          <h2 className="brand-heading">
            We believe in the<br />
            <span className="underline-accent">power of music.</span>
          </h2>
          <Link href="/collections/pianos" className="brand-cta-link">Pre-order →</Link>
        </div>
        <div className="brand-right">
          <p className="brand-body">
            DreamPlay Pianos is a piano brand launched with the mission to make premium piano experiences accessible to every musician. We provide aspiring piano players with access to high-quality instruments, learning resources, and a community of like-minded musicians.
            <br /><br />
            Whether you&apos;re practicing, performing, or just repping the brand you love — DreamPlay adapts to your world.
          </p>
          <div className="brand-social">
            <a href="https://www.instagram.com/dreamplaypianos" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.tiktok.com/@dreamplaypianos" target="_blank" rel="noopener">TikTok</a>
            <a href="https://youtube.com/@dreamplaypianos" target="_blank" rel="noopener">YouTube</a>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: Horizontal category / merch tile row
          Matches screenshot: scrollable tiles with product thumbnail +
          category name + count + arrow →
          ══════════════════════════════════════════════════════════════ */}
      <div className="category-row">
        <div className="category-row-inner">
          {categoryTiles.map((tile, i) => {
            const img = tile.product?.images.find(pi => pi.is_primary) ?? tile.product?.images[0];
            return (
              <Link href={tile.href} key={tile.key} className={`category-tile${i === 0 ? ' all-tile' : ''}`}>
                <div className="category-tile-img">
                  {img
                    ? <img src={img.url} alt={tile.label} loading="lazy" />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        {i === 0 ? '🛍' : i <= 2 ? '👕' : '🎹'}
                      </div>}
                </div>
                <div className="category-tile-name">{tile.label}</div>
                <div className="category-tile-count">{tile.count} product{tile.count !== 1 ? 's' : ''}</div>
                <span className="category-tile-arrow" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </div>

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

      {/* ── Merch product cards ── */}
      {merch.length > 0 && (
        <section className="products-section">
          <div className="container">
            <div className="section-header reveal">
              <h2 className="section-title">Merch &amp; Apparel</h2>
              <Link href="/collections/merch" className="view-all-link">View all →</Link>
            </div>
            <div className="products-scroll">
              {merch.map((p, i) => {
                const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
                return (
                  <Link href={`/products/${p.slug}`} key={p.slug} className={`product-card reveal reveal-d${Math.min(i, 3) as 0|1|2|3}`}>
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
        <section className="products-section" id="keyboards">
          <div className="container">
            <div className="section-header reveal">
              <h2 className="section-title">Keyboards</h2>
              <Link href="/collections/pianos" className="view-all-link">View all →</Link>
            </div>
            <div className="products-scroll">
              {pianos.map((p, i) => {
                const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
                return (
                  <Link href={`/products/${p.slug}`} key={p.slug} className={`product-card reveal reveal-d${Math.min(i, 3) as 0|1|2|3}`}>
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
            <div className="reveal">
              <div className="flash-eyebrow"><span className="flash-dot" />Limited Time</div>
              <div className="flash-title">20% Off.<br />Everything.</div>
              <div className="countdown" role="timer" aria-label="Sale countdown">
                {[['Hours', h], ['Mins', m], ['Secs', s]].map(([label, val]) => (
                  <div key={label} className="countdown-unit">
                    <span className="countdown-num">{val}</span>
                    <span className="countdown-label">{label}</span>
                  </div>
                ))}
              </div>
              <Link href="https://dreamplay-pianos.myshopify.com/collections/all" className="btn btn-primary btn-lg" target="_blank" rel="noopener">Shop the Sale →</Link>
            </div>
            <div className="products-scroll reveal reveal-d2">
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
