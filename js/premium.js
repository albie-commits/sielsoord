/* ═══════════════════════════════════════════════════════════════════
   SIELSOORD — Premium Enhancements JS
   Scroll progress bar, stat counter animation, parallax hero,
   smooth reveals, premium interactions
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Scroll Progress Bar ────────────────────────────────────── */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
  document.body.appendChild(progressBar);

  const progressFill = progressBar.querySelector('.scroll-progress-bar');

  function updateScrollProgress() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    progressFill.style.width = Math.min(scrolled, 100) + '%';
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ── 2. Parallax Hero Background ──────────────────────────────── */
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrolled * 0.4}px) scale(${1 + scrolled * 0.0003})`;
      }
    }, { passive: true });
  }

  /* ── 3. Animated Stat Counters ────────────────────────────────── */
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;
    const statsSection = document.querySelector('.stats');
    if (!statsSection) return;

    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      statsAnimated = true;
      statNumbers.forEach(stat => {
        const text = stat.textContent.trim();
        const hasComma = text.includes(',');
        const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
        
        if (!isNaN(num) && num > 0) {
          const duration = 2000;
          const start = performance.now();
          const startVal = 0;
          
          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startVal + (num - startVal) * eased);
            
            let display = current.toString();
            if (hasComma && current >= 1000) {
              display = current.toLocaleString('en-US');
            }
            stat.textContent = display;
            
            if (progress < 1) {
              requestAnimationFrame(tick);
            } else {
              stat.textContent = text; // Restore original (for ∞ symbol etc)
            }
          }
          requestAnimationFrame(tick);
        }
      });
    }
  }

  window.addEventListener('scroll', animateStats, { passive: true });
  animateStats();

  /* ── 4. Premium Card Hover Glow ───────────────────────────────── */
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      
      card.style.transform = `translateY(-8px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── 5. Stagger Reveal — children fade in one by one ──────────── */
  document.querySelectorAll('[data-stagger]').forEach(container => {
    const children = container.children;
    Array.from(children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.1}s`;
    });
  });

  /* ── 6. Premium Nav — add scrolled class for gold accent ──────── */
  const nav = document.querySelector('.nav');
  function updateNavPremium() {
    if (!nav) return;
    if (window.scrollY > 60) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }
  window.addEventListener('scroll', updateNavPremium, { passive: true });
  updateNavPremium();

  /* ── 7. Section title draw-in animation ───────────────────────── */
  const dividers = document.querySelectorAll('.divider');
  if ('IntersectionObserver' in window) {
    const dividerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('divider-drawn');
          dividerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    dividers.forEach(d => dividerObserver.observe(d));
  }

  /* ── 8. Image lazy fade-in ────────────────────────────────────── */
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.6s ease';
    img.addEventListener('load', () => {
      img.style.opacity = '1';
    });
    if (img.complete) {
      img.style.opacity = '1';
    }
  });

  /* ── 9. Premium button ripple effect ──────────────────────────── */
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ── 10. Floating Share Button ────────────────────────────────── */
  const shareBtn = document.createElement('button');
  shareBtn.className = 'share-fab';
  shareBtn.setAttribute('aria-label', 'Share this page');
  shareBtn.setAttribute('aria-expanded', 'false');
  shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  document.body.appendChild(shareBtn);

  const sharePanel = document.createElement('div');
  sharePanel.className = 'share-panel';
  sharePanel.setAttribute('role', 'dialog');
  sharePanel.setAttribute('aria-label', 'Share options');
  const shareUrl = window.location.href;
  const shareTitle = document.title;
  sharePanel.innerHTML = `
    <button class="share-option" data-action="native">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      <span>Share</span>
    </button>
    <button class="share-option" data-action="whatsapp">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.607zm5.589-7.429c-.075-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
      <span>WhatsApp</span>
    </button>
    <button class="share-option" data-action="facebook">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      <span>Facebook</span>
    </button>
    <button class="share-option" data-action="twitter">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      <span>X (Twitter)</span>
    </button>
    <button class="share-option" data-action="email">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <span>Email</span>
    </button>
    <button class="share-option share-copy" data-action="copy">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      <span>Copy link</span>
    </button>
  `;
  document.body.appendChild(sharePanel);

  function toggleSharePanel() {
    const isOpen = sharePanel.classList.toggle('share-panel-open');
    shareBtn.classList.toggle('share-fab-active', isOpen);
    shareBtn.setAttribute('aria-expanded', isOpen);
  }

  shareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSharePanel();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!sharePanel.contains(e.target) && !shareBtn.contains(e.target)) {
      sharePanel.classList.remove('share-panel-open');
      shareBtn.classList.remove('share-fab-active');
      shareBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sharePanel.classList.remove('share-panel-open');
      shareBtn.classList.remove('share-fab-active');
      shareBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle share actions
  sharePanel.querySelectorAll('.share-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const action = opt.dataset.action;
      const fullUrl = window.location.href;
      const title = document.title;

      switch (action) {
        case 'native':
          if (navigator.share) {
            navigator.share({ title, url: fullUrl }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(fullUrl);
            flashCopyFeedback(opt);
          }
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + fullUrl)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`, '_blank');
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullUrl)}`;
          break;
        case 'copy':
          navigator.clipboard?.writeText(fullUrl).then(() => flashCopyFeedback(opt));
          break;
      }
    });
  });

  function flashCopyFeedback(btn) {
    const label = btn.querySelector('span');
    const original = label.textContent;
    label.textContent = '✓ Copied!';
    btn.classList.add('share-copied');
    setTimeout(() => {
      label.textContent = original;
      btn.classList.remove('share-copied');
    }, 2000);
  }

  // Show share button after scrolling past hero (or immediately on short pages)
  let shareVisible = false;
  function updateShareVisibility() {
    const shouldShow = window.scrollY > 300 || document.body.scrollHeight < window.innerHeight * 1.5;
    if (shouldShow && !shareVisible) {
      shareBtn.classList.add('share-fab-visible');
      shareVisible = true;
    } else if (!shouldShow && shareVisible) {
      shareBtn.classList.remove('share-fab-visible');
      sharePanel.classList.remove('share-panel-open');
      shareBtn.classList.remove('share-fab-active');
      shareVisible = false;
    }
  }
  window.addEventListener('scroll', updateShareVisibility, { passive: true });
  updateShareVisibility();

});
