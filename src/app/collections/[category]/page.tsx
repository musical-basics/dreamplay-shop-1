'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Product } from '@/lib/db';

export default function CollectionPage() {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch(`/api/products?category=${category}`).then(r => r.json()).then(setProducts).catch(() => {});
  }, [category]);

  const subcategories = ['all', ...Array.from(new Set(products.map(p => p.subcategory).filter(Boolean))) as string[]];
  const displayed = filter === 'all' ? products : products.filter(p => p.subcategory === filter);

  const categoryLabel = category === 'pianos' ? 'Keyboards' : category === 'merch' ? 'Merch & Apparel' : category;

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo">Dream<span>Play</span></Link>
            <nav className="header-nav">
              <Link href="/collections/merch" className={`nav-link${category === 'merch' ? ' active' : ''}`}>Merch</Link>
              <Link href="/collections/pianos" className={`nav-link${category === 'pianos' ? ' active' : ''}`}>Keyboards</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="collection-header">
        <div className="container">
          <div className="collection-eyebrow">DreamPlay</div>
          <h1>{categoryLabel}</h1>
          <p style={{ marginTop: 12, fontSize: 16, color: 'var(--text-muted)', maxWidth: 480 }}>
            {category === 'merch'
              ? 'Premium heavyweight hoodies and apparel. Limited drops, embroidered logos, free US shipping.'
              : 'Professional-grade keyboards built for musicians. 88 fully-weighted keys, studio sound engine.'}
          </p>
        </div>
      </div>

      <div className="collection-filters">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
          <div className="filter-pills">
            {subcategories.map(sub => (
              <button key={sub} className={`filter-pill${filter === sub ? ' active' : ''}`} onClick={() => setFilter(sub)}>
                {sub === 'all' ? 'All' : sub}
              </button>
            ))}
          </div>
          <span className="count-label">{displayed.length} product{displayed.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="container section">
        <div className="products-grid">
          {displayed.map(p => {
            const img = p.images.find(i => i.is_primary) ?? p.images[0];
            return (
              <Link href={`/products/${p.slug}`} key={p.slug} className="product-card">
                <div className="product-card-img">
                  {img && <img src={img.url} alt={p.name} loading="lazy" />}
                  {p.badge && (
                    <span className={`product-badge ${p.badge.includes('Soon') ? 'badge-soon' : p.badge === 'Best Seller' ? 'badge-new' : 'badge-sale'}`}>
                      {p.badge}
                    </span>
                  )}
                  <button className="quick-buy-btn" onClick={e => { e.preventDefault(); window.open(p.shopify_url || '#', '_blank'); }}>
                    Buy Now →
                  </button>
                </div>
                <div className="product-card-info">
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-sub">{p.subcategory}</div>
                  <div className="product-price">
                    <span className="price-current">${p.price}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {displayed.length === 0 && (
            <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', padding: '48px 0', fontSize: 15 }}>
              No products found. Run <code style={{ color: 'var(--accent)', background: 'rgba(212,168,67,0.1)', padding: '2px 6px', borderRadius: 4 }}>pnpm seed</code> to populate.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
