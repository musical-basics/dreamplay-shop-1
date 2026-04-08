'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/db';

// ── Announcement countdown ──────────────────────────────────────────────────
function useCountdown(hours = 72) {
  const [t, setT] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const key = 'dp_flash_end';
    let end = Number(localStorage.getItem(key) || 0);
    if (!end || end < Date.now()) {
      end = Date.now() + hours * 3600 * 1000;
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
  return `${pad(t.h)}h ${pad(t.m)}m ${pad(t.s)}s`;
}

// ── ProductCard ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const img = product.images.find(i => i.is_primary) ?? product.images[0];
  const imgSrc = img?.url ?? '/placeholder.png';
  return (
    <Link href={`/products/${product.slug}`} className="product-card" aria-label={product.name}>
      <div className="product-card-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className={`product-badge ${product.badge === 'Best Seller' ? 'badge-new' : product.badge === 'Coming Soon' ? 'badge-soon' : 'badge-sale'}`}>
            {product.badge}
          </span>
        )}
        <button
          className="quick-buy-btn"
          onClick={e => { e.preventDefault(); window.open(product.shopify_url || '#', '_blank'); }}
          aria-label={`Quick buy ${product.name}`}
        >
          Buy Now →
        </button>
      </div>
      <div className="product-card-info">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-sub">{product.subcategory}</div>
        <div className="product-price">
          <span className="price-current">${product.price}</span>
        </div>
      </div>
    </Link>
  );
}

// ── Main Homepage ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pianos' | 'merch'>('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const timer = useCountdown(72);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {});
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [products]);

  // Scroll-to-top
  useEffect(() => {
    const btn = document.getElementById('scroll-top-btn');
    const onScroll = () => { if (btn) btn.classList.toggle('visible', window.scrollY > 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const pianos = products.filter(p => p.category === 'pianos');
  const merch = products.filter(p => p.category === 'merch');
  const displayedProducts = activeTab === 'all' ? products : activeTab === 'pianos' ? pianos : merch;

  const mosaicProducts = [
    ...merch.slice(0, 2),
    ...pianos.slice(0, 3),
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="ann-bar">
        <strong>⚡ Flash Sale</strong> — 20% Off Sitewide · Ends in <span className="timer">{timer}</span> · Free US Shipping
      </div>

      {/* Header */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">Dream<span>Play</span></Link>

            <nav className="header-nav">
              <div className="nav-item">
                <Link href="/collections/merch" className="nav-link active">Merch</Link>
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
              <Link href="#flash-sale" className="nav-link sale">⚡ Sale</Link>
              <Link href="/admin" className="nav-link">Manage Images</Link>
            </nav>

            <div className="header-actions">
              <button className="icon-btn" aria-label="Open cart" onClick={() => setCartOpen(true)}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span className="cart-badge">0</span>
              </button>
              <button className="hamburger" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── 5-Panel Mosaic Hero ─────────────────────────────── */}
      <section className="hero-mosaic" aria-label="Featured products">
        {mosaicProducts.slice(0, 5).map((p, i) => {
          const img = p.images.find(pi => pi.is_primary) ?? p.images[0];
          return (
            <Link href={`/products/${p.slug}`} key={p.slug} className={`mosaic-panel${i === 2 ? ' featured' : ''}`} aria-label={p.name}>
              {img && <img src={img.url} alt={p.name} loading={i === 0 ? 'eager' : 'lazy'} />}
              <div className="mosaic-panel-overlay" aria-hidden="true" />
              <div className="mosaic-panel-content">
                <div className="mosaic-panel-label">{p.category === 'merch' ? 'Merch Drop' : 'Keyboard'}</div>
                <div className="mosaic-panel-title">{p.name}</div>
                <div className="mosaic-panel-price">${p.price}</div>
                {i === 2 && <span className="mosaic-panel-cta">Shop Now →</span>}
              </div>
            </Link>
          );
        })}
        {/* Fallback panels if DB empty */}
        {mosaicProducts.length === 0 && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mosaic-panel" style={{ background: `hsl(${20 + i * 15},10%,${8 + i * 2}%)` }}>
            <div className="mosaic-panel-overlay" aria-hidden="true" />
            <div className="mosaic-panel-content">
              <div className="mosaic-panel-label">Run: pnpm seed</div>
              <div className="mosaic-panel-title">Loading…</div>
            </div>
          </div>
        ))}
      </section>

      {/* Feature text block */}
      <div className="feature-text-block reveal">
        <div className="feature-text-left">
          <div className="feature-text-eyebrow">Official Drop</div>
          <div className="feature-text-title">Wear the Music.</div>
          <div className="feature-text-body">DreamPlay merch is built for musicians. Premium heavyweight fleece, embroidered logos, limited runs.</div>
          <Link href="/collections/merch" className="feature-cta">Shop Merch <span>→</span></Link>
        </div>
        <div className="feature-text-right">
          <div className="feature-text-eyebrow">Instruments</div>
          <div className="feature-text-title">Play Anywhere.</div>
          <div className="feature-text-body">The DS 6.0 Pro — 88 weighted keys, studio-grade sound engine, Bluetooth + USB. Pre-orders open now.</div>
          <Link href="/collections/pianos" className="feature-cta">See Keyboards <span>→</span></Link>
        </div>
      </div>

      {/* ── Category Tabs + Product Scroll ──────────────────── */}
      <section className="category-section">
        <div className="container">
          <div className="category-header reveal">
            <h2 className="category-title">The Collection</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div className="category-tabs">
                {(['all', 'merch', 'pianos'] as const).map(tab => (
                  <button key={tab} className={`category-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab === 'all' ? 'All' : tab === 'merch' ? 'Hoodies & Merch' : 'Keyboards'}
                  </button>
                ))}
              </div>
              <Link href={`/collections/${activeTab === 'all' ? 'merch' : activeTab}`} className="view-all-link">
                View all <span>→</span>
              </Link>
            </div>
          </div>
          <div className="products-scroll">
            {displayedProducts.map((p, i) => (
              <div key={p.slug} className={`reveal reveal-d${Math.min(i, 3) as 0 | 1 | 2 | 3}`} style={{ flexShrink: 0 }}>
                <ProductCard product={p} />
              </div>
            ))}
            {displayedProducts.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, padding: '40px 0' }}>
                No products yet. Run <code style={{ color: 'var(--accent)', background: 'rgba(212,168,67,0.1)', padding: '2px 6px', borderRadius: 4 }}>pnpm seed</code> to populate.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Text marquee */}
      <div className="text-marquee" aria-hidden="true">
        <div className="text-marquee-track">
          {[1, 2, 3].map(n => (
            <div className="text-marquee-item" key={n}>
              ICON Hoodie <span className="sep">·</span> Official Hoodie <span className="sep">·</span> DS 6.0 Pro <span className="sep">·</span> DS 5.5 <span className="sep">·</span> DreamPlay Go <span className="sep">·</span> Gold Edition <span className="sep">·</span> Flash Sale
            </div>
          ))}
        </div>
      </div>

      {/* ── Flash Sale ───────────────────────────────────────── */}
      <section className="flash-band" id="flash-sale">
        <div className="container">
          <div className="flash-band-inner">
            <div className="reveal">
              <div className="flash-eyebrow">
                <span className="flash-dot" aria-hidden="true" />
                Limited Time Only
              </div>
              <div className="flash-title">20% Off.<br />Right Now.</div>
              <div className="countdown" aria-label="Countdown" role="timer">
                {[['h', 'Hours'], ['m', 'Mins'], ['s', 'Secs']].map(([k, label]) => {
                  const val = timer.split(' ').find(p => p.endsWith(k))?.replace(k, '') ?? '00';
                  return (
                    <div key={k} className="countdown-unit">
                      <span className="countdown-num">{val}</span>
                      <span className="countdown-label">{label}</span>
                    </div>
                  );
                })}
              </div>
              <Link href="https://dreamplay-pianos.myshopify.com/collections/all" className="btn btn-primary btn-lg" target="_blank" rel="noopener">
                Shop the Sale →
              </Link>
            </div>
            <div className="products-scroll reveal reveal-d2">
              {[...merch, ...pianos].slice(0, 4).map(p => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Dream<span>Play</span></div>
              <div className="footer-tagline">Official merch and instruments for musicians and creators. Limited drops, free US shipping.</div>
              <div className="footer-social">
                {[
                  ['Instagram', 'https://www.instagram.com/dreamplaypianos', 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z'],
                  ['TikTok', 'https://www.tiktok.com/@dreamplaypianos', 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'],
                ].map(([name, href, path]) => (
                  <a key={name} href={href} className="footer-social-btn" aria-label={name} target="_blank" rel="noopener">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div className="footer-col-title">Shop</div>
              <ul className="footer-links">
                <li><Link href="/collections/merch">Merch</Link></li>
                <li><Link href="/collections/pianos">Keyboards</Link></li>
                <li><Link href="#flash-sale">⚡ Flash Sale</Link></li>
                <li><Link href="/admin">Manage Images</Link></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><a href="https://dreamplay-pianos.myshopify.com" target="_blank" rel="noopener">Shopify Store</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Returns</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">About</div>
              <ul className="footer-links">
                <li><a href="#">Brand Story</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Affiliate</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DreamPlay. All rights reserved.</span>
            <div className="footer-bottom-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
            <span>Made with ♪ in LA</span>
          </div>
        </div>
      </footer>

      {/* Cart drawer */}
      <div className={`drawer-overlay${cartOpen ? ' open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Cart (0)</span>
          <button className="drawer-close" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
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
          <button onClick={() => setMobileNavOpen(false)} style={{ alignSelf: 'flex-end', color: 'var(--text-muted)' }} aria-label="Close menu">✕</button>
          <Link href="/" className="logo" style={{ fontSize: 20 }}>Dream<span style={{ color: 'var(--accent)' }}>Play</span></Link>
          <nav className="mobile-nav-links">
            <Link href="/collections/merch" onClick={() => setMobileNavOpen(false)}>👕 Merch</Link>
            <Link href="/collections/pianos" onClick={() => setMobileNavOpen(false)}>🎹 Keyboards</Link>
            <Link href="#flash-sale" onClick={() => setMobileNavOpen(false)}>⚡ Flash Sale</Link>
            <Link href="/admin" onClick={() => setMobileNavOpen(false)}>🖼 Manage Images</Link>
          </nav>
        </div>
      </div>

      {/* Scroll to top */}
      <button id="scroll-top-btn" className="scroll-top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </>
  );
}
