(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const willOpen = !mobileMenu.classList.contains('is-open');
      mobileMenu.classList.toggle('is-open', willOpen);
      hamburger.classList.toggle('is-open', willOpen);
      hamburger.setAttribute('aria-expanded', String(willOpen));
      hamburger.setAttribute('aria-label', willOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = willOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    link.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    });
  });

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reveal = document.querySelectorAll('.reveal');
  if (reveal.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    reveal.forEach(el => io.observe(el));
  } else {
    reveal.forEach(el => el.classList.add('is-visible'));
  }

  const cfg = window.MARINA_CONFIG || {};
  const waLinks = document.querySelectorAll('[data-whatsapp]');
  if (cfg.WHATSAPP_NUMBER) {
    const msg = encodeURIComponent(cfg.WHATSAPP_PREFILLED || '');
    const href = `https://wa.me/${cfg.WHATSAPP_NUMBER}${msg ? '?text=' + msg : ''}`;
    waLinks.forEach(a => a.setAttribute('href', href));
  }

  document.querySelectorAll('[data-open-chat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.MarinaChat && typeof window.MarinaChat.open === 'function') {
        window.MarinaChat.open();
      }
    });
  });
})();
