/* ═══════════════════════════════════════════════════════════════
   Sielsoord Hero — "Golden Hour"
   Stylized 3D bushveld vignette: camelthorn tree on a koppie,
   layered sunset ridges, golden dust, circling birds.
   Day = golden hour · Night = Milky Way (synced to site toggle).
   Fully procedural — no external assets.
   Requires: three (importmap)
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

const container = document.getElementById('hero-3d');
if (container) init().catch(err => {
  console.warn('3D hero unavailable, keeping photo hero:', err);
});

async function init() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ── Palette (Sielsoord brand) ────────────────────────────── */
  const GOLD = 0xC9842A, SUNSET = 0xE07B39, ESPRESSO = 0x2C1810;

  /* ── Renderer / scene / camera ────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.pointerEvents = 'none';   // scroll passes through
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 1200);
  const camBase = new THREE.Vector3(0, 7.5, 58);
  const lookBase = new THREE.Vector3(0, 30, -60);
  camera.position.copy(camBase);

  /* ── Sky dome (sunset gradient → night, lerped) ───────────── */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top:    { value: new THREE.Color(0x8a4a6e) },   // dusk violet
      mid:    { value: new THREE.Color(0xE07B39) },   // sunset orange
      bottom: { value: new THREE.Color(0xf7c873) },   // golden horizon
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      varying vec3 vP;
      void main(){
        float h = clamp(normalize(vP).y, -0.08, 1.0);
        vec3 c = h < 0.22
          ? mix(bottom, mid, smoothstep(-0.05, 0.22, h))
          : mix(mid, top, smoothstep(0.22, 0.85, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), skyMat));

  /* ── Stars (night only — opacity follows day/night) ───────── */
  const starGeo = new THREE.BufferGeometry();
  {
    const N = isCoarse ? 700 : 1600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const az = Math.random() * Math.PI * 2;
      const el = Math.asin(Math.random() * 0.98 + 0.02);
      const r = 640;
      pos[i * 3] = r * Math.cos(el) * Math.sin(az);
      pos[i * 3 + 1] = r * Math.sin(el);
      pos[i * 3 + 2] = r * Math.cos(el) * Math.cos(az);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  }
  const starMat = new THREE.PointsMaterial({
    color: 0xeef2ff, size: 1.35, sizeAttenuation: false,
    transparent: true, opacity: 0, fog: false, depthWrite: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  /* ── Sun / moon glow sprite ───────────────────────────────── */
  function glowTexture(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner); g.addColorStop(0.35, outer); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const sunMat = new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,236,200,1)', 'rgba(232,150,60,0.55)'),
    transparent: true, depthWrite: false, fog: false,
    blending: THREE.AdditiveBlending,
  });
  const sun = new THREE.Sprite(sunMat);
  sun.position.set(-95, 26, -420);
  sun.scale.set(150, 150, 1);
  scene.add(sun);

  /* ── Layered silhouette ridges (depth) ────────────────────── */
  function ridge(z, height, color, seed) {
    const shape = new THREE.Shape();
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    shape.moveTo(-500, -60);
    for (let x = -500; x <= 500; x += 25) {
      shape.lineTo(x, height + Math.sin(x * 0.013 + seed) * height * 0.35 + rnd() * height * 0.22);
    }
    shape.lineTo(500, -60); shape.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, fog: false }));
    m.position.set(0, 0, z);
    return m;
  }
  scene.add(ridge(-330, 34, 0x6b3b28, 7));    // far ridge, hazed
  scene.add(ridge(-230, 26, 0x4a2a1c, 19));   // mid ridge

  /* ── Ground ───────────────────────────────────────────────── */
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(600, 48),
    new THREE.MeshBasicMaterial({ color: 0x241209, fog: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  scene.add(ground);

  /* ── The koppie (rocky hill) ──────────────────────────────── */
  const kopGeo = new THREE.SphereGeometry(26, 24, 16);
  {
    const p = kopGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const n = Math.sin(v.x * 0.35) * Math.cos(v.z * 0.3) * 2.2
              + Math.sin(v.y * 0.6 + v.x * 0.2) * 1.4;
      v.multiplyScalar(1 + n * 0.03);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    kopGeo.computeVertexNormals();
  }
  const koppie = new THREE.Mesh(kopGeo,
    new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 1, flatShading: true }));
  koppie.scale.set(1.7, 0.62, 1.15);
  koppie.position.set(0, 2, -70);
  scene.add(koppie);

  // Grass tufts on the koppie
  const grassMat = new THREE.MeshBasicMaterial({ color: 0x1d0f08 });
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2 + Math.random() * 1.6, 4), grassMat);
    const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 22;
    g.position.set(Math.cos(a) * r * 1.4, 15.2 + Math.random() * 2.2 - r * 0.08, -70 + Math.sin(a) * r * 0.8);
    g.rotation.z = (Math.random() - 0.5) * 0.35;
    scene.add(g);
  }

  /* ── The camelthorn tree (iconic flat-top) ────────────────── */
  const tree = new THREE.Group();
  const barkMat = new THREE.MeshBasicMaterial({ color: 0x160b05 });
  function branch(from, to, r0, r1) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 5), barkMat);
    m.position.copy(from).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    tree.add(m);
    return m;
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const trunkTop = V(0.4, 12.5, 0);
  branch(V(0, 0, 0), trunkTop, 0.85, 0.5);                       // trunk
  const limbs = [
    [trunkTop, V(-4.6, 15.6, 0.6)], [trunkTop, V(4.9, 15.9, -0.5)],
    [trunkTop, V(1.8, 16.4, 1.4)], [trunkTop, V(-2.2, 16.1, -1.6)],
    [V(-4.6, 15.6, 0.6), V(-6.4, 16.7, 1.0)],
    [V(4.9, 15.9, -0.5), V(6.8, 16.9, -0.9)],
  ];
  for (const [a, b] of limbs) branch(a, b, 0.34, 0.12);

  // Flat-top canopy: cluster of flattened blobs
  const canopyMat = new THREE.MeshBasicMaterial({ color: 0x120a04 });
  const canopy = new THREE.Group();
  const blobs = [[0, 17.4, 0, 8.2], [-5.4, 16.9, 0.8, 4.6], [5.6, 17.1, -0.7, 4.8],
                 [-2.6, 17.6, -1.2, 4.2], [2.8, 17.7, 1.1, 4.0]];
  for (const [x, y, z, r] of blobs) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 7), canopyMat);
    b.scale.set(1, 0.34, 1);
    b.position.set(x, y, z);
    canopy.add(b);
  }
  tree.add(canopy);
  tree.position.set(-17, 16.2, -70);
  tree.scale.setScalar(2.1);
  scene.add(tree);

  /* ── Golden dust motes ────────────────────────────────────── */
  const dustGeo = new THREE.BufferGeometry();
  const DUST = isCoarse ? 90 : 200;
  const dPos = new Float32Array(DUST * 3), dVel = [];
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 130;
    dPos[i * 3 + 1] = Math.random() * 40;
    dPos[i * 3 + 2] = 30 - Math.random() * 120;
    dVel.push({ x: (Math.random() - 0.5) * 0.9, y: 0.15 + Math.random() * 0.5 });
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.55, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ── Birds circling (V silhouettes) ───────────────────────── */
  function birdTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(20,10,5,0.95)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 40); ctx.quadraticCurveTo(20, 22, 32, 34);
    ctx.quadraticCurveTo(44, 22, 58, 40);
    ctx.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const birds = [];
  if (!reducedMotion) {
    const bt = birdTexture();
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Sprite(new THREE.SpriteMaterial({
        map: bt, transparent: true, depthWrite: false, fog: false }));
      b.scale.set(3.4 + i * 0.7, 2 + i * 0.4, 1);
      b.userData = { angle: i * 2.2, radius: 16 + i * 7, height: 30 + i * 5, speed: 0.16 + i * 0.04 };
      scene.add(b); birds.push(b);
    }
  }

  /* ── Day / night presets ──────────────────────────────────── */
  const DAY = {
    top: new THREE.Color(0x8a4a6e), mid: new THREE.Color(0xE07B39), bot: new THREE.Color(0xf7c873),
    sunPos: new THREE.Vector3(-95, 26, -420), sunScale: 150, sunOp: 1.0,
    starOp: 0, dustOp: 0.55, exposure: 1.1,
  };
  const NIGHT = {
    top: new THREE.Color(0x04060f), mid: new THREE.Color(0x0d1226), bot: new THREE.Color(0x1a1c30),
    sunPos: new THREE.Vector3(70, 120, -420), sunScale: 55, sunOp: 0.85,
    starOp: 0.95, dustOp: 0.12, exposure: 0.95,
  };
  let dayMix = document.body.classList.contains('hero-dark') ? 0 : 1;
  let dayTarget = dayMix;
  new MutationObserver(() => {
    dayTarget = document.body.classList.contains('hero-dark') ? 0 : 1;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  function applyDayNight(m) {
    skyMat.uniforms.top.value.lerpColors(NIGHT.top, DAY.top, m);
    skyMat.uniforms.mid.value.lerpColors(NIGHT.mid, DAY.mid, m);
    skyMat.uniforms.bottom.value.lerpColors(NIGHT.bot, DAY.bot, m);
    sun.position.lerpVectors(NIGHT.sunPos, DAY.sunPos, m);
    const s = NIGHT.sunScale + (DAY.sunScale - NIGHT.sunScale) * m;
    sun.scale.set(s, s, 1);
    sunMat.opacity = NIGHT.sunOp + (DAY.sunOp - NIGHT.sunOp) * m;
    starMat.opacity = NIGHT.starOp * (1 - m);
    dustMat.opacity = NIGHT.dustOp + (DAY.dustOp - NIGHT.dustOp) * m;
    renderer.toneMappingExposure = NIGHT.exposure + (DAY.exposure - NIGHT.exposure) * m;
  }

  /* ── Mouse parallax (the landscape leans toward the cursor) ─ */
  const par = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!reducedMotion) {
    addEventListener('mousemove', e => {
      par.x = (e.clientX / innerWidth) * 2 - 1;
      par.y = (e.clientY / innerHeight) * 2 - 1;
    });
  }

  /* ── Resize ───────────────────────────────────────────────── */
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(container);

  /* ── Render loop ──────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let t0 = 0;
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    t0 += dt;
    dayMix += (dayTarget - dayMix) * 0.045;
    applyDayNight(dayMix);

    if (!reducedMotion) {
      // Smooth parallax + slow breathing sway
      const k = 1 - Math.pow(0.002, dt);
      par.sx += (par.x - par.sx) * k;
      par.sy += (par.y - par.sy) * k;
      const breathe = Math.sin(t0 * 0.07) * 1.6;
      camera.position.set(
        camBase.x + par.sx * 4.5 + breathe,
        camBase.y - par.sy * 2.2,
        camBase.z);
      camera.lookAt(lookBase.x + par.sx * 7, lookBase.y - par.sy * 3.5, lookBase.z);

      // Tree sways gently in the wind
      tree.rotation.z = Math.sin(t0 * 0.5) * 0.008;
      canopy.rotation.y = Math.sin(t0 * 0.3) * 0.02;

      // Dust drifts upward and wraps
      const p = dustGeo.attributes.position;
      for (let i = 0; i < DUST; i++) {
        let x = p.getX(i) + dVel[i].x * dt * 3;
        let y = p.getY(i) + dVel[i].y * dt * 3;
        if (y > 42) y = 0;
        if (x > 70) x = -70; else if (x < -70) x = 70;
        p.setX(i, x); p.setY(i, y);
      }
      p.needsUpdate = true;

      // Birds ride the thermal
      for (const b of birds) {
        const u = b.userData;
        u.angle += u.speed * dt;
        b.position.set(
          Math.cos(u.angle) * u.radius - 4,
          u.height + Math.sin(u.angle * 2.1) * 2.2,
          -70 + Math.sin(u.angle) * u.radius * 0.5);
      }
    }

    renderer.render(scene, camera);
  });

  requestAnimationFrame(() =>
    document.querySelector('.hero')?.classList.add('terrain-ready'));

  window.__heroScene = { renderer, scene, camera };
}
