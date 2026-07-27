/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — Main JavaScript
   Navigation, smooth scroll, scroll animations
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Hero Theme Toggle (day/night hero switch) ────────────────── */
  const heroToggle = document.getElementById('hero-theme-toggle');
  const heroBg = document.querySelector('.hero-bg');

  if (heroToggle && heroBg) {
    // Load saved preference
    const savedHero = localStorage.getItem('sielsoord-hero-theme');
    if (savedHero === 'dark') {
      document.body.classList.add('hero-dark');
    }

    heroToggle.addEventListener('click', () => {
      document.body.classList.toggle('hero-dark');
      const isDark = document.body.classList.contains('hero-dark');
      localStorage.setItem('sielsoord-hero-theme', isDark ? 'dark' : 'light');
    });
  }

  /* ── Navigation: transparent → solid on scroll ───────────────── */
  const nav = document.querySelector('.nav');
  const heroHeight = window.innerHeight;

  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.classList.remove('nav-transparent');
      nav.classList.add('nav-solid');
    } else {
      nav.classList.add('nav-transparent');
      nav.classList.remove('nav-solid');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile hamburger menu ────────────────────────────────────── */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
      const expanded = toggle.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded);
      document.body.style.overflow = expanded ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Theme toggle: toggle dark/light WITHOUT closing the mobile menu
    const themeToggle = links.querySelector('#hero-theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  /* ── Smooth scroll for anchor links ───────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = nav ? nav.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Intersection Observer: fade-in on scroll ─────────────────── */
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));
  } else {
    // Fallback: just show everything
    fadeElements.forEach(el => el.classList.add('visible'));
  }

  /* ── FAQ Accordion ────────────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => i.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  /* ── Lightbox ─────────────────────────────────────────────────── */
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox img');
  const lightboxClose = document.querySelector('.lightbox-close');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.gallery-item img, [data-lightbox]').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  /* ── Set active nav link ──────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── KML data display: populate features list ─────────────────── */
  const kmlFeaturesContainer = document.querySelector('[data-kml-features]');
  if (kmlFeaturesContainer && window.SIELSOORD_KML_FEATURES) {
    const renderKmlFeatures = () => {
      const lang = localStorage.getItem('sielsoord-lang') || 'af';
      const dictionary = window.TRANSLATIONS?.[lang] || window.TRANSLATIONS?.af || {};
      kmlFeaturesContainer.innerHTML = '';

      window.SIELSOORD_KML_FEATURES.forEach(feature => {
        const tag = document.createElement('div');
        tag.className = 'kml-feature-tag';
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = feature.color || 'var(--color-primary)';
        tag.appendChild(dot);
        tag.appendChild(document.createTextNode(dictionary[feature.key] || feature.key));
        kmlFeaturesContainer.appendChild(tag);
      });
    };

    renderKmlFeatures();
    window.addEventListener('sielsoord:langchange', renderKmlFeatures);
  }
});
