/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — Gallery: Floating Bubbles + Lightbox
   Premium interactive gallery experience
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Gallery Data ────────────────────────────────────────────── */
  // Categories with their images. Add new categories here.
  // Photos go in: images/gallery/<slug>/
  const CATEGORIES = [
    {
      slug: 'homestead',
      // i18n keys: gallery.cat.homestead.title / .desc
      titleKey: 'gallery.cat.homestead.title',
      descKey: 'gallery.cat.homestead.desc',
      icon: '🏠',
      accent: '#B8772A',
      images: [
        'images/gallery/homestead/123sielsoord.jpg',
        'images/gallery/homestead/img_0534_2.jpg',
        'images/gallery/homestead/img_0162.jpg',
        'images/gallery/homestead/img_0552.jpg',
        'images/gallery/homestead/img_0533.jpg',
        'images/gallery/homestead/img_0538.jpg',
        'images/gallery/homestead/img_0532.jpg',
        'images/gallery/homestead/bd790f07-8a57-42ed-9d6e-eaa4056e223esielsoord.jpg',
        'images/gallery/homestead/img_0157.jpg',
        'images/gallery/homestead/img_0518.jpg',
        'images/gallery/homestead/img_0522.jpg',
        'images/gallery/homestead/76503e53-f9ee-45a4-8f6b-acef3f8d2ae9sielsoord.jpg'
      ]
    },
    {
      slug: 'nature',
      titleKey: 'gallery.cat.nature.title',
      descKey: 'gallery.cat.nature.desc',
      icon: '🌿',
      accent: '#5A6B36',
      images: [
        'images/gallery/nature/20250323_071650sielsoord.jpg',
        'images/gallery/nature/img_0128.jpg',
        'images/gallery/nature/img_0183.jpg',
        'images/gallery/nature/img_0209.jpg',
        'images/gallery/nature/img_0219.jpg',
        'images/gallery/nature/img_0548.jpg',
        'images/gallery/nature/img_0561.jpg',
        'images/gallery/nature/img_0564.jpg',
        'images/gallery/nature/img_0568.jpg',
        'images/gallery/nature/img_0578.jpg',
        'images/gallery/nature/img_0595.jpg',
        'images/gallery/nature/img_1633sielsoord.jpg',
        'images/gallery/nature/img_1681sielsoord.jpg',
        'images/gallery/nature/img_1698sielsoord.jpg',
        'images/gallery/nature/img_2647sielsoord.jpg',
        'images/gallery/nature/img_3414sielsoord.jpg',
        'images/gallery/nature/img_3449sielsoord.jpg',
        'images/gallery/nature/img_4464sielsoord.jpg',
        'images/gallery/nature/img_6220sielsoord.jpg',
        'images/gallery/nature/img_6321sielsoord.jpg',
        'images/gallery/nature/img_6340sielsoord.jpg'
      ]
    },
    {
      slug: 'ongava',
      titleKey: 'gallery.cat.ongava.title',
      descKey: 'gallery.cat.ongava.desc',
      icon: '🦏',
      accent: '#C05A2E',
      images: [
        'images/gallery/ongava/img_8020sielsoord.jpg',
        'images/gallery/ongava/img_8021sielsoord.jpg',
        'images/gallery/ongava/img_8027sielsoord.jpg',
        'images/gallery/ongava/img_8028sielsoord.jpg',
        'images/gallery/ongava/img_8031sielsoord.jpg',
        'images/gallery/ongava/img_8032sielsoord.jpg'
      ]
    },
    {
      slug: 'birdlife',
      titleKey: 'gallery.cat.birdlife.title',
      descKey: 'gallery.cat.birdlife.desc',
      icon: '🦅',
      accent: '#2E7D8C',
      images: [
        'images/gallery/birds/dsc_0352sielsoord.jpg',
        'images/gallery/birds/dsc_0020sielsoord.jpg',
        'images/gallery/birds/64113ef4-a4d5-43ae-a8ce-e3a88b292246sielsoord.jpg',
        'images/gallery/birds/dsc_0010sielsoord.jpg',
        'images/gallery/birds/dsc_0158sielsoord.jpg',
        'images/gallery/birds/dsc_0200sielsoord.jpg',
        'images/gallery/birds/dsc_0190sielsoord.jpg',
        'images/gallery/birds/dsc_0209sielsoord.jpg',
        'images/gallery/birds/74366822-33c4-4821-ba41-972769cb48c1sielsoord.jpg',
        'images/gallery/birds/fa5fb12d-ef2b-426f-9cb6-756d98bd6e70sielsoord.jpg'
      ]
    }
  ];

  /* ── DOM Ready ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const bubbleContainer = document.getElementById('bubble-container');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryHeader = document.getElementById('gallery-category-header');
    const backButton = document.getElementById('gallery-back');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');
    const lightboxCounter = document.getElementById('lightbox-counter');

    if (!bubbleContainer) return;

    let currentCategory = null;
    let currentImageIndex = 0;

    /* ── Helper: Get translation safely ────────────────────────── */
    function t(key, vars) {
      // Try to get language from the i18n module
      var lang = 'af';
      if (typeof window.SielsoordI18n !== 'undefined' && typeof window.SielsoordI18n.getLang === 'function') {
        lang = window.SielsoordI18n.getLang();
      }
      if (typeof TRANSLATIONS !== 'undefined') {
        if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
          return format(TRANSLATIONS[lang][key], vars);
        }
        // Fallback to Afrikaans
        if (TRANSLATIONS.af && TRANSLATIONS.af[key]) {
          return format(TRANSLATIONS.af[key], vars);
        }
      }
      // Hardcoded fallbacks
      var fallbacks = {
        'gallery.cat.homestead.title': 'Homestead',
        'gallery.cat.homestead.desc': 'Die plaashuis — ons tuis in die bos',
        'gallery.cat.nature.title': 'Nature',
        'gallery.cat.nature.desc': 'Die ongeskonde wildernis van Sielsoord',
        'gallery.cat.ongava.title': 'Ongava Border',
        'gallery.cat.ongava.desc': 'Die grens met Ongava Wildreservaat',
        'gallery.cat.birdlife.title': 'Voëllewe',
        'gallery.cat.birdlife.desc': 'Namibi\u00eb se veelkleurige vo\u00ebls — \'n vo\u00eblkyker se paradys',
        'gallery.photos': 'foto\'s',
        'gallery.coming_soon': 'Binnekort',
        'gallery.view': 'Sien foto\'s',
        'gallery.soon': 'Binnekort'
      };
      return format(fallbacks[key] || key, vars);
    }

    function format(value, vars) {
      return Object.keys(vars || {}).reduce(function (text, name) {
        return text.split('{' + name + '}').join(vars[name]);
      }, value);
    }

    /* ── Render Floating Bubbles ───────────────────────────────── */
    function renderBubbles() {
      bubbleContainer.innerHTML = '';
      const totalCats = CATEGORIES.length;

      CATEGORIES.forEach(function (cat, index) {
        const count = cat.images.length;
        var bubble = document.createElement('button');
        bubble.className = 'gallery-bubble';
        bubble.setAttribute('data-slug', cat.slug);
        bubble.setAttribute('data-index', index);
        bubble.setAttribute('aria-label', t(cat.titleKey));

        // Stagger animation delay for a cascade entrance
        bubble.style.animationDelay = (index * 0.15) + 's';

        // Vary bubble sizes for visual rhythm
        var sizes = ['large', 'medium', 'small', 'medium', 'large'];
        if (index < sizes.length) {
          bubble.classList.add('bubble-' + sizes[index]);
        } else {
          bubble.classList.add('bubble-medium');
        }

        var imgHtml = '';
        if (count > 0) {
          // Use first image as bubble background
          imgHtml = '<div class="bubble-img" style="background-image: url(\'' + cat.images[0] + '\');"></div>';
        } else {
          imgHtml = '<div class="bubble-img bubble-img-placeholder" style="background: linear-gradient(135deg, ' + cat.accent + ', ' + cat.accent + 'cc);"><span class="bubble-icon">' + cat.icon + '</span></div>';
        }

        bubble.innerHTML =
          imgHtml +
          '<div class="bubble-overlay"></div>' +
          '<div class="bubble-content">' +
            '<span class="bubble-eyebrow">' + (count > 0 ? count + ' ' + t('gallery.photos') : t('gallery.coming_soon')) + '</span>' +
            '<h3 class="bubble-title">' + t(cat.titleKey) + '</h3>' +
            '<p class="bubble-desc">' + t(cat.descKey) + '</p>' +
            (count > 0 ? '<span class="bubble-enter">' + t('gallery.view') + ' →</span>' : '<span class="bubble-enter bubble-enter-soon">' + t('gallery.soon') + '</span>') +
          '</div>';

        if (count > 0) {
          bubble.addEventListener('click', function () {
            openCategory(cat.slug);
          });
        }

        bubbleContainer.appendChild(bubble);
      });
    }

    /* ── Open a Category (show grid) ───────────────────────────── */
    function openCategory(slug) {
      var cat = CATEGORIES.find(function (c) { return c.slug === slug; });
      if (!cat || cat.images.length === 0) return;

      currentCategory = cat;

      // Update header
      galleryHeader.querySelector('.gallery-cat-title').textContent = t(cat.titleKey);
      galleryHeader.querySelector('.gallery-cat-desc').textContent = t(cat.descKey);
      galleryHeader.querySelector('.gallery-cat-count').textContent = cat.images.length + ' ' + t('gallery.photos');

      // Render grid
      galleryGrid.innerHTML = '';
      cat.images.forEach(function (src, i) {
        var item = document.createElement('div');
        item.className = 'gallery-item fade-in';
        item.style.animationDelay = (i * 0.05) + 's';
        item.innerHTML =
          '<div class="gallery-item-inner">' +
            '<img src="' + src + '" alt="' + t('gallery.image_alt', { category: t(cat.titleKey), number: i + 1 }) + '" loading="lazy">' +
            '<div class="gallery-item-overlay">' +
              '<span class="gallery-zoom">⤢</span>' +
            '</div>' +
          '</div>';
        item.addEventListener('click', function () {
          openLightbox(cat.images, i);
        });
        galleryGrid.appendChild(item);
      });

      // Transition: hide bubbles, show grid
      bubbleContainer.classList.add('gallery-hidden');
      document.getElementById('gallery-category-view').classList.add('gallery-active');

      // Smooth scroll to top of grid
      window.scrollTo({ top: galleryHeader.offsetTop - 100, behavior: 'smooth' });
    }

    /* ── Back to Bubbles ───────────────────────────────────────── */
    function backToBubbles() {
      currentCategory = null;
      bubbleContainer.classList.remove('gallery-hidden');
      document.getElementById('gallery-category-view').classList.remove('gallery-active');
      galleryGrid.innerHTML = '';
      // Smooth scroll to bubbles
      window.scrollTo({ top: bubbleContainer.offsetTop - 100, behavior: 'smooth' });
    }

    /* ── Lightbox ──────────────────────────────────────────────── */
    function openLightbox(images, index) {
      currentImageIndex = index;
      lightboxImg.src = images[index];
      lightboxImg.alt = t('gallery.image_alt', { category: t(currentCategory.titleKey), number: index + 1 });
      lightboxCounter.textContent = (index + 1) + ' / ' + images.length;
      lightbox.classList.add('lightbox-active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('lightbox-active');
      document.body.style.overflow = '';
      setTimeout(function () {
        lightboxImg.src = '';
      }, 300);
    }

    function navLightbox(direction) {
      if (!currentCategory) return;
      var images = currentCategory.images;
      currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
      lightboxImg.src = images[currentImageIndex];
      lightboxImg.alt = t('gallery.image_alt', { category: t(currentCategory.titleKey), number: currentImageIndex + 1 });
      lightboxCounter.textContent = (currentImageIndex + 1) + ' / ' + images.length;
    }

    /* ── Event Listeners ───────────────────────────────────────── */
    if (backButton) {
      backButton.addEventListener('click', backToBubbles);
    }

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', function () { navLightbox(-1); });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', function () { navLightbox(1); });
    }

    // Click lightbox backdrop to close
    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (!lightbox || !lightbox.classList.contains('lightbox-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight') navLightbox(1);
    });

    // Touch swipe for lightbox on mobile
    var touchStartX = 0;
    if (lightbox) {
      lightbox.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });
      lightbox.addEventListener('touchend', function (e) {
        var touchEndX = e.changedTouches[0].clientX;
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          navLightbox(diff > 0 ? 1 : -1);
        }
      }, { passive: true });
    }

    /* ── Re-render on language change ──────────────────────────── */
    // Listen for language change events from i18n.js
    window.addEventListener('sielsoord:langchange', function () {
      if (currentCategory) {
        // Re-render the open category
        openCategory(currentCategory.slug);
      } else {
        renderBubbles();
      }
    });

    /* ── Initial Render ────────────────────────────────────────── */
    function initGallery() {
      renderBubbles();
    }

    // Render after a small delay to ensure translations are loaded
    setTimeout(initGallery, 50);
    // Also re-render on window load
    window.addEventListener('load', function () {
      setTimeout(initGallery, 100);
    });
  });

})();
