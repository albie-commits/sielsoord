/* ═══════════════════════════════════════════════════════════════
   Sielsoord Float Cards — Spline "Connecting Card" feel
   for the contact cards on kontak.html.
   Idle bob → hover lift with cursor tilt + deep golden shadow
   (shadow bloom lives in css/style.css .float-card.is-hovered).
   Disabled on touch devices and for reduced-motion users.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (reduced || coarse) return;

  const cards = Array.from(document.querySelectorAll('.float-card'));
  if (!cards.length) return;

  cards.forEach(el => {
    const s = { x: 0, y: 0, tx: 0, ty: 0, h: 0, hover: false, ready: false };
    el._floatState = s;

    // Don't stomp the .fade-in entry animation — wait until it finished.
    if (!el.classList.contains('fade-in')) {
      s.ready = true;
    } else {
      const onEnd = e => {
        if (e.propertyName === 'transform') {
          s.ready = true;
          el.removeEventListener('transitionend', onEnd);
        }
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(() => { s.ready = true; }, 1800); // fallback
    }

    el.addEventListener('pointerenter', () => {
      s.hover = true;
      el.classList.add('is-hovered');
    });
    el.addEventListener('pointerleave', () => {
      s.hover = false;
      s.tx = 0;
      s.ty = 0;
      el.classList.remove('is-hovered');
    });
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      s.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      s.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    }, { passive: true });
  });

  /* Track which cards are on-screen; skip work when none are */
  const vis = new Map(cards.map(el => [el, true]));
  cards.forEach(el =>
    new IntersectionObserver(([en]) => vis.set(el, en.isIntersecting)).observe(el));

  const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    cards.forEach((el, i) => {
      const s = el._floatState;
      if (!s.ready || !vis.get(el)) return;
      s.x += (s.tx - s.x) * 0.08;
      s.y += (s.ty - s.y) * 0.08;
      s.h += ((s.hover ? -14 : 0) - s.h) * 0.12;
      const idle = s.hover ? 0 : Math.sin(t * 0.9 + i * 1.7) * 5;
      el.style.transform =
        `perspective(1000px) rotateX(${(-s.y * 6).toFixed(2)}deg) ` +
        `rotateY(${(s.x * 8).toFixed(2)}deg) translateY(${(s.h + idle).toFixed(2)}px)`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
