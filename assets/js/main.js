/* ============================================================
   DREAMPLAY PIANOS — MAIN INTERACTIVE JAVASCRIPT
   ============================================================ */

(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────
     UTILS
  ──────────────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ────────────────────────────────────────────────────────
     HEADER: Transparent → Solid on scroll
  ──────────────────────────────────────────────────────── */
  function initHeader() {
    const header = $('.site-header');
    if (!header) return;

    const announcementH = $('.announcement-bar')?.offsetHeight || 0;
    header.style.top = announcementH + 'px';

    function updateHeader() {
      const scrolled = window.scrollY > 60;
      header.classList.toggle('is-solid', scrolled);
      header.classList.toggle('is-transparent', !scrolled);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ────────────────────────────────────────────────────────
     MOBILE NAV
  ──────────────────────────────────────────────────────── */
  function initMobileNav() {
    const hamburger = $('.hamburger');
    const mobileNav = $('.mobile-nav');
    const overlay = $('.mobile-nav-overlay');
    const closeBtn = $('.mobile-nav-close');

    function open() {
      hamburger?.classList.add('active');
      mobileNav?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      hamburger?.classList.remove('active');
      mobileNav?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    on(hamburger, 'click', open);
    on(closeBtn, 'click', close);
    on(overlay, 'click', close);

    // Close on nav link click
    $$('.mobile-nav-links a').forEach(a => on(a, 'click', close));
  }

  /* ────────────────────────────────────────────────────────
     HERO SLIDESHOW
  ──────────────────────────────────────────────────────── */
  function initHero() {
    const slides = $$('.hero-slide');
    const dots = $$('.hero-dot');
    if (!slides.length) return;

    let current = 0;
    let timer = null;
    const INTERVAL = 5500;

    function goTo(idx) {
      slides[current].classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      dots[current]?.classList.add('is-active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, INTERVAL);
    }

    // Dot clicks
    dots.forEach((dot, i) => on(dot, 'click', () => { goTo(i); startTimer(); }));

    // Arrow buttons
    on($('.hero-prev'), 'click', () => { prev(); startTimer(); });
    on($('.hero-next'), 'click', () => { next(); startTimer(); });

    // Touch swipe support
    let touchStart = 0;
    const heroEl = $('.hero');
    on(heroEl, 'touchstart', e => { touchStart = e.changedTouches[0].clientX; }, { passive: true });
    on(heroEl, 'touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); startTimer(); }
    });

    // Init
    goTo(0);
    startTimer();
  }

  /* ────────────────────────────────────────────────────────
     COUNTDOWN TIMERS (announcemement + flash sale)
  ──────────────────────────────────────────────────────── */
  function initCountdown(endTime, elements) {
    // elements: { days, hours, mins, secs }
    function tick() {
      const diff = endTime - Date.now();
      if (diff <= 0) { Object.values(elements).forEach(el => { if (el) el.textContent = '00'; }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = n => String(n).padStart(2, '0');
      if (elements.days) elements.days.textContent = pad(d);
      if (elements.hours) elements.hours.textContent = pad(h);
      if (elements.mins) elements.mins.textContent = pad(m);
      if (elements.secs) elements.secs.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  }

  function initAllTimers() {
    // Announcement bar — 72h flash sale
    const announcementEnd = Date.now() + 72 * 3600 * 1000;

    const announcementTimer = {
      hours: $('#ann-hours'),
      mins: $('#ann-mins'),
      secs: $('#ann-secs'),
    };
    if (announcementTimer.hours) initCountdown(announcementEnd, announcementTimer);

    // Flash sale section — same end time
    const flashTimer = {
      days: $('#flash-days'),
      hours: $('#flash-hours'),
      mins: $('#flash-mins'),
      secs: $('#flash-secs'),
    };
    if (flashTimer.hours) initCountdown(announcementEnd, flashTimer);
  }

  /* ────────────────────────────────────────────────────────
     CART DRAWER
  ──────────────────────────────────────────────────────── */
  function initCartDrawer() {
    const drawer = $('.cart-drawer');
    const overlay = $('.cart-drawer-overlay');
    const openBtns = $$('[data-cart-open]');
    const closeBtns = $$('[data-cart-close]');

    function openCart() {
      drawer?.classList.add('is-open');
      overlay?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeCart() {
      drawer?.classList.remove('is-open');
      overlay?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openBtns.forEach(btn => on(btn, 'click', openCart));
    closeBtns.forEach(btn => on(btn, 'click', closeCart));
    on(overlay, 'click', closeCart);

    // Quick-buy buttons simulate add to cart
    $$('.quick-buy').forEach(btn => {
      on(btn, 'click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.product-card');
        const name = card?.querySelector('.product-card-name')?.textContent || 'Item';
        const price = card?.querySelector('.price-current')?.textContent || '';
        simulateAddToCart(name, price);
        openCart();
      });
    });
  }

  function simulateAddToCart(name, price) {
    const badge = $('.cart-badge');
    const current = parseInt(badge?.textContent || '0');
    if (badge) badge.textContent = current + 1;

    const body = $('.cart-drawer-body');
    const empty = body?.querySelector('.cart-empty');
    if (empty) empty.style.display = 'none';

    const item = document.createElement('div');
    item.style.cssText = `
      display: flex; align-items: center; gap: 12px;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: 12px; padding: 12px;
    `;
    item.innerHTML = `
      <div style="width:64px;height:64px;background:var(--color-surface-3);border-radius:8px;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;">${name}</div>
        <div style="font-size:12px;color:var(--color-accent);margin-top:4px;">${price}</div>
      </div>
      <button style="color:var(--color-text-muted);font-size:16px;padding:4px 8px;" onclick="this.parentElement.remove()">×</button>
    `;
    body?.appendChild(item);
  }

  /* ────────────────────────────────────────────────────────
     SEARCH DRAWER
  ──────────────────────────────────────────────────────── */
  function initSearch() {
    const drawer = $('.search-drawer');
    const openBtns = $$('[data-search-open]');
    const closeBtns = $$('[data-search-close]');
    const input = $('.search-input');

    function openSearch() {
      drawer?.classList.add('is-open');
      setTimeout(() => input?.focus(), 200);
    }
    function closeSearch() {
      drawer?.classList.remove('is-open');
    }

    openBtns.forEach(btn => on(btn, 'click', openSearch));
    closeBtns.forEach(btn => on(btn, 'click', closeSearch));
    on(document, 'keydown', e => { if (e.key === 'Escape') closeSearch(); });
  }

  /* ────────────────────────────────────────────────────────
     NEWSLETTER POPUP
  ──────────────────────────────────────────────────────── */
  function initNewsletterPopup() {
    const popup = $('.newsletter-popup');
    if (!popup || sessionStorage.getItem('dp-newsletter-seen')) return;

    const closeBtn = popup.querySelector('.newsletter-popup-close');
    const overlay = popup.querySelector('.newsletter-popup-overlay');
    const form = popup.querySelector('.newsletter-form');

    function show() { popup.classList.add('is-visible'); }
    function hide() {
      popup.classList.remove('is-visible');
      sessionStorage.setItem('dp-newsletter-seen', '1');
    }

    setTimeout(show, 8000);
    on(closeBtn, 'click', hide);
    on(overlay, 'click', hide);
    on(form, 'submit', e => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (input?.value) {
        form.innerHTML = '<p style="color:var(--color-accent);font-weight:600;font-size:14px;">🎹 10% off code sent! Check your email.</p>';
        setTimeout(hide, 2500);
      }
    });
  }

  /* ────────────────────────────────────────────────────────
     TESTIMONIALS CAROUSEL
  ──────────────────────────────────────────────────────── */
  function initTestimonials() {
    const track = $('.testimonials-track');
    const dots = $$('.t-nav-dot');
    if (!track || !dots.length) return;

    let current = 0;
    let timer;
    const isMobile = () => window.innerWidth <= 768;

    function goTo(idx) {
      const count = dots.length;
      current = (idx + count) % count;
      const cardW = track.querySelector('.testimonial-card')?.offsetWidth || 0;
      const gap = 20;
      const slidesPerView = isMobile() ? 1 : 3;
      const maxSlide = count - slidesPerView;
      const targetIdx = Math.min(current, maxSlide);
      track.style.transform = `translateX(-${targetIdx * (cardW + gap)}px)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    }

    dots.forEach((d, i) => on(d, 'click', () => { goTo(i); clearInterval(timer); timer = setInterval(() => goTo(current + 1), 4500); }));
    timer = setInterval(() => goTo(current + 1), 4500);

    // Touch swipe
    let tx = 0;
    on(track, 'touchstart', e => { tx = e.changedTouches[0].clientX; }, { passive: true });
    on(track, 'touchend', e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) { dx < 0 ? goTo(current + 1) : goTo(current - 1); }
    });

    goTo(0);
  }

  /* ────────────────────────────────────────────────────────
     SCROLL REVEAL
  ──────────────────────────────────────────────────────── */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-revealed'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));
  }

  /* ────────────────────────────────────────────────────────
     SCROLL TO TOP
  ──────────────────────────────────────────────────────── */
  function initScrollTop() {
    const btn = $('.scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    on(btn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ────────────────────────────────────────────────────────
     LAZY IMAGES (IntersectionObserver)
  ──────────────────────────────────────────────────────── */
  function initLazyImages() {
    const imgs = $$('img[data-src]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    imgs.forEach(img => observer.observe(img));
  }

  /* ────────────────────────────────────────────────────────
     INIT ALL
  ──────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileNav();
    initHero();
    initAllTimers();
    initCartDrawer();
    initSearch();
    initNewsletterPopup();
    initTestimonials();
    initReveal();
    initScrollTop();
    initLazyImages();
  });

})();
