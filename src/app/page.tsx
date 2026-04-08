'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/db';

// ── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(hours = 72) {
  const [t, setT] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const key = 'dp_flash_end';
    let end = Number(localStorage.getItem(key) || 0);
    if (!end || end < Date.now()) {
      end = Date.now() + hours * 3600000;
      localStorage.setItem(key, String(end));
    }
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setT({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hours]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { str: `${pad(t.h)}h ${pad(t.m)}m ${pad(t.s)}s`, h: pad(t.h), m: pad(t.m), s: pad(t.s) };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { h, m, s } = useCountdown(72);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [products]);

  useEffect(() => {
    const btn = document.getElementById('scroll-top-btn');
    const onScroll = () => { if (btn) btn.classList.toggle('visible', window.scrollY > 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pianos = products.filter(p => p.category === 'pianos');
  const merch = products.filter(p => p.category === 'merch');

  // Hero panels: left = merch, center = featured piano, right = another piano
  const heroPanels = [
    merch[0] ?? null,
    pianos[0] ?? null,
    pianos[1] ?? null,
  ];

  // Category tiles: "All products" first, then sub-categories
  const categoryTiles = [
    { key: 'all', label: 'All products', count: products.length, href: '/collections/merch', product: products[0] ?? null },
    { key: 'hoodies', label: 'Hoodies', count: merch.length, href: '/collections/merch', product: merch[0] ?? null },
    { key: 'ds60', label: 'DS 6.0 Series', count: pianos.filter(p => p.subcategory === 'DS 6.0').length, href: '/collections/pianos', product: pianos.find(p => p.subcategory === 'DS 6.0') ?? null },
    { key: 'ds55', label: 'DS 5.5', count: pianos.filter(p => p.subcategory === 'DS 5.5').length, href: '/collections/pianos', product: pianos.find(p => p.subcategory === 'DS 5.5') ?? null },
    { key: 'go', label: 'DreamPlay Go', count: pianos.filter(p => p.subcategory === 'DreamPlay Go').length, href: '/collections/pianos', product: pianos.find(p => p.subcategory === 'DreamPlay Go') ?? null },
    { key: 'gold', label: 'Gold Edition', count: pianos.filter(p => p.name.toLowerCase().includes('gold')).length, href: '/collections/pianos', product: pianos.find(p => p.name.toLowerCase().includes('gold')) ?? null },
    { key: 'limited', label: 'Limited', count: products.filter(p => p.badge === 'Limited Stock' || p.badge === 'Coming Soon').length, href: '/collections/pianos', product: pianos.find(p => p.badge === 'Coming Soon') ?? null },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="ann-bar">
        ⚡ Flash Drop active — 20% off sitewide · Ends in <span className="timer">{h}h {m}m {s}s</span> ·{' '}
        <a href="https://dreamplay-pianos.myshopify.com/collections/all">Shop now</a>
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
                        <div className="mega-item-info">
                          <div className="mega-item-name">{p.name}</div>
                          <div className="mega-item-price">${p.price}</div>
                        </div>
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
                        <div className="mega-item-info">
                          <div className="mega-item-name">{p.name}</div>
                          <div className="mega-item-price">${p.price}</div>
                        </div>
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

      {/* ── 3-Panel Mosaic Hero ──────────────────────────────── */}
      <section className="hero-banner" aria-label="Featured">
        {/* Left panel */}
        {(() => {
          const p = heroPanels[0];
          const img = p?.images.find(i => i.is_primary) ?? p?.images[0];
          return (
            <Link href={p ? `/products/${p.slug}` : '/collections/merch'} className="hero-panel">
              {img ? (
                <img src={img.url} alt={p?.name ?? ''} loading="eager" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#eee' }} />
              )}
              <div className="hero-panel-overlay" aria-hidden="true" />
              <div className="hero-panel-content">
                <div className="hero-panel-label">New Drop</div>
                <div className="hero-panel-title">{p?.name ?? 'Merch'}</div>
              </div>
            </Link>
          );
        })()}

        {/* Center panel — main feature */}
        {(() => {
          const p = heroPanels[1];
          const img = p?.images.find(i => i.is_primary) ?? p?.images[0];
          return (
            <Link href={p ? `/products/${p.slug}` : '/collections/pianos'} className="hero-panel center">
              {img ? (
                <img src={img.url} alt={p?.name ?? ''} loading="eager" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
              )}
              <div className="hero-panel-overlay" aria-hidden="true" />
              <div className="hero-panel-content">
                <div className="hero-panel-label">DreamPlay Studio</div>
                <div className="hero-panel-title">
                  {p?.name ?? 'Play Everywhere'}
                </div>
                <div className="hero-panel-subtitle">
                  Studio-grade sound, 88 weighted keys, Bluetooth. Pre-order now.
                </div>
                <span className="hero-cta">Explore →</span>
              </div>
              <div className="hero-nav-arrows" aria-hidden="true">
                <span className="hero-arrow">←</span>
                <span className="hero-arrow">→</span>
              </div>
            </Link>
          );
        })()}

        {/* Right panel */}
        {(() => {
          const p = heroPanels[2];
          const img = p?.images.find(i => i.is_primary) ?? p?.images[0];
          return (
            <Link href={p ? `/products/${p.slug}` : '/collections/pianos'} className="hero-panel">
              {img ? (
                <img src={img.url} alt={p?.name ?? ''} loading="eager" />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#e8e8e8' }} />
              )}
              <div className="hero-panel-overlay" aria-hidden="true" />
              <div className="hero-panel-content">
                <div className="hero-panel-label">Limited Edition</div>
                <div className="hero-panel-title">{p?.name ?? 'Collection'}</div>
              </div>
            </Link>
          );
        })()}
      </section>

      {/* ── Brand statement section ──────────────────────────── */}
      <div className="brand-section reveal">
        <div className="brand-left">
          <h2 className="brand-heading">
            We believe in the<br />
            <span className="underline-accent">power of music.</span>
          </h2>
          <Link href="/collections/merch" className="brand-cta-link">See More →</Link>
        </div>
        <div className="brand-right">
          <p className="brand-body">
            DreamPlay is more than a keyboard brand. We represent a growing community of musicians, creators, and dreamers who believe performance and design should coexist. Our instruments and merch are built for people who take their craft seriously — without giving up style, portability, or quality.
            <br /><br />
            We stand at the intersection of premium sound and contemporary aesthetic. From the studio to the street, DreamPlay adapts to your world.
          </p>
          <div className="brand-social">
            <a href="https://www.instagram.com/dreamplaypianos" target="_blank" rel="noopener">Instagram</a>
            <a href="https://www.tiktok.com/@dreamplaypianos" target="_blank" rel="noopener">TikTok</a>
            <a href="https://youtube.com/@dreamplaypianos" target="_blank" rel="noopener">YouTube</a>
          </div>
        </div>
      </div>

      {/* ── Category Tile Row ────────────────────────────────── */}
      {/* Matches screenshot: horizontal scrolling tiles with product image + name + count + arrow */}
      <div className="category-row">
        <div className="category-row-inner">
          {categoryTiles.map((tile, i) => {
            const img = tile.product?.images.find(pi => pi.is_primary) ?? tile.product?.images[0];
            return (
              <Link href={tile.href} key={tile.key} className={`category-tile${i === 0 ? ' all-tile' : ''}`}>
                <div className="category-tile-img">
                  {img ? (
                    <img src={img.url} alt={tile.label} loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 24 }}>
                      {i === 0 ? '🛍' : i <= 2 ? '👕' : '🎹'}
                    </div>
                  )}
                </div>
                <div className="category-tile-name">{tile.label}</div>
                <div className="category-tile-count">{tile.count} product{tile.count !== 1 ? 's' : ''}</div>
                <span className="category-tile-arrow" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Merch products ───────────────────────────────────── */}
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
                      <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || '#', '_blank'); }}>Buy Now →</button>
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

      {/* Text marquee */}
      <div className="text-marquee" aria-hidden="true">
        <div className="text-marquee-track">
          {[0,1,2].map(n => (
            <div className="text-marquee-item" key={n}>
              ICON Hoodie <span className="sep">·</span> Official Hoodie <span className="sep">·</span> DS 6.0 Pro <span className="sep">·</span> DS 5.5 <span className="sep">·</span> DreamPlay Go <span className="sep">·</span> Gold Edition
            </div>
          ))}
        </div>
      </div>

      {/* ── Keyboards ──────────────────────────────────────────── */}
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
                      <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || '#', '_blank'); }}>Pre-order →</button>
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

      {/* ── Flash Sale ────────────────────────────────────────── */}
      <section className="flash-band" id="flash-sale">
        <div className="container">
          <div className="flash-band-inner">
            <div className="reveal">
              <div className="flash-eyebrow"><span className="flash-dot" aria-hidden="true" />Limited Time</div>
              <div className="flash-title">20% Off.<br />Everything.</div>
              <div className="countdown" aria-label="Sale countdown" role="timer">
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
            <div className="products-scroll reveal reveal-d2">
              {[...merch, ...pianos].slice(0, 3).map(p => {
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

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">DreamPlay</div>
              <div className="footer-tagline">Official merch and instruments for musicians and creators. Limited drops, free US shipping.</div>
              <div className="footer-social">
                {[
                  ['IG', 'https://www.instagram.com/dreamplaypianos'],
                  ['TT', 'https://www.tiktok.com/@dreamplaypianos'],
                  ['YT', 'https://youtube.com/@dreamplaypianos'],
                ].map(([label, href]) => (
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
