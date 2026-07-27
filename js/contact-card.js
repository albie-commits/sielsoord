/* ═══════════════════════════════════════════════════════════════
   Sielsoord Connecting Card — interactive 3D contact card
   A gold-framed card that tilts toward the cursor, wrapped in a
   "plexus" of connecting golden nodes. Site palette only.
   Requires: three (importmap). Container: #connect-card
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

const container = document.getElementById('connect-card');

if (container) init().catch(err => {
  console.warn('3D connect card unavailable, keeping fallback:', err);
});

async function init() {
  /* ── Tunables ─────────────────────────────────────────────── */
  const CARD_W = 3.2, CARD_H = 2.0, CARD_R = 0.16, CARD_D = 0.07;
  const isCoarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NODE_COUNT = isCoarse ? 28 : 48;
  const LINK_DIST = 1.7;               // node↔node link distance
  const CARD_LINK_DIST = 2.3;          // node↔card link distance
  const MAX_SEGS = 600;

  /* Palette (from css/style.css) */
  const COL = {
    gold:       new THREE.Color(0xC9A227),
    goldLight:  new THREE.Color(0xE5C158),
    sunset:     new THREE.Color(0xD26E2C),
    sunsetLight:new THREE.Color(0xE89952),
    cream:      new THREE.Color(0xF7EFE0),
    espresso:   new THREE.Color(0x2C1810),
  };

  /* ── Renderer / scene / camera ────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  /* ── Lights — golden-hour warmth ──────────────────────────── */
  scene.add(new THREE.HemisphereLight(0xF7EFE0, 0x2C1810, 0.9));
  const key = new THREE.DirectionalLight(0xFFDFAE, 2.2);
  key.position.set(4, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0xE89952, 12, 30);
  rim.position.set(-5, -2, 3);
  scene.add(rim);

  /* ── Rounded-rect helpers ─────────────────────────────────── */
  function roundedRect(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  /* ── Card face texture (canvas, redrawn on language change) ─ */
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 1024; faceCanvas.height = 640;
  const fc = faceCanvas.getContext('2d');

  function drawFace() {
    const W = faceCanvas.width, H = faceCanvas.height;
    const tagline = (typeof TRANSLATIONS !== 'undefined')
      ? (TRANSLATIONS[document.documentElement.lang] || TRANSLATIONS.af)['kontak.card_tagline']
      : 'Waar jou siel tot rus kom';

    // Cream base with soft vignette
    fc.fillStyle = '#F7EFE0';
    fc.fillRect(0, 0, W, H);
    const vg = fc.createRadialGradient(W/2, H/2, H/3, W/2, H/2, W/1.4);
    vg.addColorStop(0, 'rgba(235,223,200,0)');
    vg.addColorStop(1, 'rgba(235,223,200,0.85)');
    fc.fillStyle = vg;
    fc.fillRect(0, 0, W, H);

    // Double gold border
    fc.strokeStyle = '#C9A227'; fc.lineWidth = 5;
    fc.strokeRect(26, 26, W - 52, H - 52);
    fc.lineWidth = 1.5;
    fc.strokeRect(42, 42, W - 84, H - 84);

    fc.textAlign = 'center';

    // Monogram
    fc.beginPath();
    fc.arc(W/2, 158, 58, 0, Math.PI * 2);
    fc.fillStyle = '#D26E2C'; fc.fill();
    fc.lineWidth = 3; fc.strokeStyle = '#C9A227'; fc.stroke();
    fc.fillStyle = '#F7EFE0';
    fc.font = '600 72px "Cormorant Garamond", Georgia, serif';
    fc.fillText('S', W/2, 184);

    // Wordmark
    fc.fillStyle = '#1E100A';
    fc.font = '600 104px "Cormorant Garamond", Georgia, serif';
    fc.fillText('Sielsoord', W/2, 340);

    // Divider with diamond
    fc.strokeStyle = '#C9A227'; fc.lineWidth = 2;
    fc.beginPath(); fc.moveTo(W/2 - 150, 396); fc.lineTo(W/2 - 22, 396); fc.stroke();
    fc.beginPath(); fc.moveTo(W/2 + 22, 396); fc.lineTo(W/2 + 150, 396); fc.stroke();
    fc.save();
    fc.translate(W/2, 396); fc.rotate(Math.PI / 4);
    fc.fillStyle = '#C9A227'; fc.fillRect(-8, -8, 16, 16);
    fc.restore();

    // Tagline (translated)
    fc.fillStyle = '#6E5A48';
    fc.font = '500 33px Montserrat, sans-serif';
    try { fc.letterSpacing = '5px'; } catch (_) {}
    fc.fillText((tagline || '').toUpperCase(), W/2, 462);
    try { fc.letterSpacing = '0px'; } catch (_) {}

    // Footer line
    fc.fillStyle = '#A08418';
    fc.font = '600 27px Montserrat, sans-serif';
    try { fc.letterSpacing = '8px'; } catch (_) {}
    fc.fillText('ETOSHA · NAMIBIË', W/2, 556);
  }

  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // Draw once fonts are ready, and again on every language switch
  drawFace();
  document.fonts.ready.then(() => { drawFace(); faceTex.needsUpdate = true; });
  window.addEventListener('sielsoord:langchange', () => {
    drawFace(); faceTex.needsUpdate = true;
  });

  /* ── Card group: gold frame + espresso body + printed face ── */
  const card = new THREE.Group();

  const frameGeo = new THREE.ExtrudeGeometry(roundedRect(CARD_W + 0.1, CARD_H + 0.1, CARD_R + 0.05),
    { depth: CARD_D - 0.02, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
  frameGeo.translate(0, 0, -(CARD_D - 0.02) / 2 - 0.02);
  card.add(new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({
    color: COL.gold, metalness: 0.85, roughness: 0.28,
  })));

  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(CARD_W, CARD_H, CARD_R),
    { depth: CARD_D, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 16 });
  bodyGeo.translate(0, 0, -CARD_D / 2);
  card.add(new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
    color: COL.espresso, metalness: 0.1, roughness: 0.55,
  })));

  const faceGeo = new THREE.ShapeGeometry(roundedRect(CARD_W - 0.08, CARD_H - 0.08, CARD_R - 0.03), 16);
  { // remap UVs from shape coords to 0..1
    const uv = faceGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i,
        (uv.getX(i) + (CARD_W - 0.08) / 2) / (CARD_W - 0.08),
        (uv.getY(i) + (CARD_H - 0.08) / 2) / (CARD_H - 0.08));
    }
  }
  const face = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({
    map: faceTex, metalness: 0.05, roughness: 0.65,
  }));
  face.position.z = CARD_D / 2 + 0.016;
  card.add(face);

  scene.add(card);

  // Card surface anchors for the connecting lines (corners + centre)
  const anchorsLocal = [
    new THREE.Vector3(-CARD_W/2,  CARD_H/2, 0),
    new THREE.Vector3( CARD_W/2,  CARD_H/2, 0),
    new THREE.Vector3(-CARD_W/2, -CARD_H/2, 0),
    new THREE.Vector3( CARD_W/2, -CARD_H/2, 0),
    new THREE.Vector3(0, 0, 0),
  ];
  const anchorsWorld = anchorsLocal.map(() => new THREE.Vector3());

  /* ── Plexus nodes ─────────────────────────────────────────── */
  const BOX = { x: 10, y: 5.5, z: 4 };
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      p: new THREE.Vector3(
        (Math.random() - 0.5) * BOX.x,
        (Math.random() - 0.5) * BOX.y,
        (Math.random() - 0.5) * BOX.z),
      v: new THREE.Vector3(
        (Math.random() - 0.5) * 0.24,
        (Math.random() - 0.5) * 0.18,
        (Math.random() - 0.5) * 0.14),
    });
  }

  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(NODE_COUNT * 3);
  const nodeCol = new Float32Array(NODE_COUNT * 3);
  const palette = [COL.goldLight, COL.sunsetLight, COL.cream, COL.gold];
  for (let i = 0; i < NODE_COUNT; i++) {
    const c = palette[i % palette.length];
    nodeCol.set([c.r, c.g, c.b], i * 3);
  }
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeCol, 3));
  const points = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    size: 0.075, vertexColors: true, transparent: true, opacity: 0.95,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  }));
  scene.add(points);

  // Line segments (preallocated)
  const lineGeo = new THREE.BufferGeometry();
  const linePos = new Float32Array(MAX_SEGS * 6);
  const lineCol = new Float32Array(MAX_SEGS * 6);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  lines.frustumCulled = false;
  scene.add(lines);

  function pushSegment(segs, a, b, strength, color) {
    if (segs.n >= MAX_SEGS) return;
    const i = segs.n * 6;
    linePos[i]     = a.x; linePos[i + 1] = a.y; linePos[i + 2] = a.z;
    linePos[i + 3] = b.x; linePos[i + 4] = b.y; linePos[i + 5] = b.z;
    const r = color.r * strength, g = color.g * strength, bl = color.b * strength;
    lineCol[i] = r; lineCol[i + 1] = g; lineCol[i + 2] = bl;
    lineCol[i + 3] = r; lineCol[i + 4] = g; lineCol[i + 5] = bl;
    segs.n++;
  }

  /* ── Pointer interaction (tracked on window; canvas never
        captures events, so page scroll is never blocked) ────── */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  if (!isCoarse && !reducedMotion) {
    addEventListener('pointermove', e => {
      const r = container.getBoundingClientRect();
      if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) {
        pointer.tx = 0; pointer.ty = 0; pointer.active = false;
        return;
      }
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
      pointer.active = true;
    }, { passive: true });
  }

  /* ── Day/night sync (same body.hero-dark contract as terrain) */
  let dayMix = document.body.classList.contains('hero-dark') ? 0 : 1;
  let dayTarget = dayMix;
  new MutationObserver(() => {
    dayTarget = document.body.classList.contains('hero-dark') ? 0 : 1;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ── Resize — keep the card fully in frame at any aspect ──── */
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    const halfW = 2.35; // card half-width + margin
    const zForWidth = halfW / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    camera.position.z = Math.max(6.2, zForWidth);
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* ── Pause when off-screen ────────────────────────────────── */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    .observe(container);

  /* ── Render loop ──────────────────────────────────────────── */
  const clock = new THREE.Clock();
  const segs = { n: 0 };
  const tmp = new THREE.Vector3();

  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    dayMix += (dayTarget - dayMix) * 0.05;
    renderer.toneMappingExposure = 0.72 + 0.33 * dayMix;
    rim.intensity = 9 + 6 * dayMix;

    // Pointer easing
    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;

    // Card motion: tilt toward pointer + gentle idle float
    if (reducedMotion) {
      card.rotation.set(0, 0, 0);
      card.position.y = 0;
    } else {
      const idleY = isCoarse || !pointer.active ? Math.sin(t * 0.35) * 0.12 : 0;
      card.rotation.y = pointer.x * 0.5 + idleY;
      card.rotation.x = -pointer.y * 0.32 + Math.sin(t * 0.5) * 0.03;
      card.rotation.z = Math.sin(t * 0.42) * 0.015;
      card.position.y = Math.sin(t * 0.8) * 0.09;
    }
    card.updateMatrixWorld();
    for (let i = 0; i < anchorsLocal.length; i++) {
      anchorsWorld[i].copy(anchorsLocal[i]).applyMatrix4(card.matrixWorld);
    }

    // Drift nodes; gentle pull toward the pointer's z=0 projection
    const px = pointer.x * 4.5, py = pointer.y * 2.4;
    for (const n of nodes) {
      if (!reducedMotion) {
        n.p.addScaledVector(n.v, dt);
        if (pointer.active) {
          tmp.set(px - n.p.x, py - n.p.y, 0);
          const d = tmp.length();
          if (d < 2.5 && d > 0.001) n.p.addScaledVector(tmp.normalize(), dt * 0.35 * (1 - d / 2.5));
        }
      }
      if (n.p.x >  BOX.x / 2) { n.p.x =  BOX.x / 2; n.v.x *= -1; }
      if (n.p.x < -BOX.x / 2) { n.p.x = -BOX.x / 2; n.v.x *= -1; }
      if (n.p.y >  BOX.y / 2) { n.p.y =  BOX.y / 2; n.v.y *= -1; }
      if (n.p.y < -BOX.y / 2) { n.p.y = -BOX.y / 2; n.v.y *= -1; }
      if (n.p.z >  BOX.z / 2) { n.p.z =  BOX.z / 2; n.v.z *= -1; }
      if (n.p.z < -BOX.z / 2) { n.p.z = -BOX.z / 2; n.v.z *= -1; }
    }

    // Write node positions
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePos[i * 3] = nodes[i].p.x;
      nodePos[i * 3 + 1] = nodes[i].p.y;
      nodePos[i * 3 + 2] = nodes[i].p.z;
    }
    nodeGeo.attributes.position.needsUpdate = true;

    // Build segments: node↔node, node↔card anchors
    segs.n = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const d = nodes[i].p.distanceTo(nodes[j].p);
        if (d < LINK_DIST) {
          pushSegment(segs, nodes[i].p, nodes[j].p, (1 - d / LINK_DIST) * 0.55, COL.gold);
        }
      }
      for (const a of anchorsWorld) {
        const d = nodes[i].p.distanceTo(a);
        if (d < CARD_LINK_DIST) {
          pushSegment(segs, nodes[i].p, a, (1 - d / CARD_LINK_DIST) * 0.9, COL.sunsetLight);
        }
      }
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
    lineGeo.setDrawRange(0, segs.n * 2);

    // Subtle camera parallax
    camera.position.x = reducedMotion ? 0 : pointer.x * 0.35;
    camera.position.y = reducedMotion ? 0 : pointer.y * 0.22;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  });

  // First frame → hide the CSS fallback
  requestAnimationFrame(() => container.classList.add('connect-ready'));

  // Debug handle (harmless in production)
  window.__connectCard = { renderer, scene, camera };
}
