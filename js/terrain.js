/* ═══════════════════════════════════════════════════════════════
   Sielsoord 3D Terrain — real SRTM elevation + Esri satellite imagery
   Golden-hour lighting, atmospheric fog, damped orbit, day/night sync.
   Requires: three (importmap), js/terrain-data.js (SIELSOORD_TERRAIN)
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const T = window.SIELSOORD_TERRAIN;
const container = document.getElementById('terrain-map') || document.getElementById('terrain-hero');
// Map mode = kaart.html (full interactive 3D map); hero mode = index.html (ambient backdrop)
const MAP_MODE = !!(document.getElementById('terrain-map'));

if (T && container) init().catch(err => {
  console.warn('3D terrain unavailable, keeping fallback:', err);
});

async function init() {
  /* ── Tunables ─────────────────────────────────────────────── */
  const EXAG = 3.5;                    // vertical exaggeration
  const SIZE_X = T.sizeX || 10400;     // scene width  (m)
  const SIZE_Z = T.sizeZ || 10400;     // scene depth  (m)
  const isCoarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
  const SEG = isCoarse ? 256 : 512;    // mesh resolution (512 on desktop = sub-metre detail)
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ELEV_SPAN = T.elevMax - T.elevMin;

  /* ── Height data ──────────────────────────────────────────── */
  const buf = await (await fetch(T.heightmap)).arrayBuffer();
  const hdata = new Uint16Array(buf);
  const G = T.grid;
  const heightAt = (u, v) => {          // u,v in 0..1, v=0 north
    const x = Math.min(G - 1, Math.max(0, Math.round(u * (G - 1))));
    const y = Math.min(G - 1, Math.max(0, Math.round(v * (G - 1))));
    return (hdata[y * G + x] / 65535) * ELEV_SPAN * EXAG;
  };
  const local = (u, v) => new THREE.Vector3(
    (u - 0.5) * SIZE_X, 0, (v - 0.5) * SIZE_Z);

  /* ── Renderer / scene / camera ────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // PBR environment — image-based lighting for realistic sky reflections
  // on the terrain surface and boundary tubes.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const scene = new THREE.Scene();
  scene.environment = envTex;
  const camera = new THREE.PerspectiveCamera(45, 1, 10, 40000);

  // Orbit target: centre of the hills cluster, at ground level
  const hillAvg = T.hills.reduce((s, h) => s + h.elev, 0) / T.hills.length;
  const targetU = T.hills.reduce((s, h) => s + h.u, 0) / T.hills.length;
  const targetV = T.hills.reduce((s, h) => s + h.v, 0) / T.hills.length;
  const target = local(targetU, targetV);
  target.y = (hillAvg - T.elevMin) * EXAG;

  if (MAP_MODE) {
    camera.position.set(target.x + 3400, target.y + 2400, target.z + 5200);
  } else {
    camera.position.set(target.x + 2600, target.y + 1500, target.z + 3900);
  }
  const camStart = camera.position.clone();

  let controls;
  /* Hero mode: no OrbitControls — the landscape leans toward the mouse
     ("lookat" parallax) over a slow auto-drift. Scroll stays free. */
  const parallax = { x: 0, y: 0, sx: 0, sy: 0 };  // raw + smoothed
  let heroAngle = Math.atan2(camStart.x - target.x, camStart.z - target.z);
  const heroRadius = Math.hypot(camStart.x - target.x, camStart.z - target.z);
  const heroPolar = Math.atan2(heroRadius, camStart.y - target.y);

  if (!MAP_MODE && !reducedMotion) {
    renderer.domElement.style.pointerEvents = 'none';
    addEventListener('mousemove', e => {
      parallax.x = (e.clientX / innerWidth) * 2 - 1;   // -1..1
      parallax.y = (e.clientY / innerHeight) * 2 - 1;  // -1..1
    });
  }

  if (MAP_MODE) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.rotateSpeed = 0.45;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.35;       // don't go under the ground
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.35;
    // Dedicated map page: zoom + touch orbit expected; auto-rotate only until touched
    controls.enableZoom = true;
    controls.minDistance = 1200;
    controls.maxDistance = 16000;
    controls.addEventListener('start', () => { controls.autoRotate = false; });
  }

  // Reset-view button (map page)
  const resetBtn = document.getElementById('terrain-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      camera.position.copy(camStart);
      if (controls) controls.target.copy(target);
      if (!reducedMotion && MAP_MODE && controls) controls.autoRotate = true;
    });
  }

  // Fullscreen toggle (map page)
  const fsBtn = document.getElementById('terrain-fullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      const el = container.closest('.map-container') || container;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    });
    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      fsBtn.textContent = isFs ? '⛶' : '⛶';
      fsBtn.classList.toggle('terrain-fullscreen--active', isFs);
      // Re-trigger resize after fullscreen transition
      setTimeout(resize, 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  }

  /* ── Sky dome (gradient shader, day/night lerp) ───────────── */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top:    { value: new THREE.Color(0x7cb2e8) },
      bottom: { value: new THREE.Color(0xf7cf9a) },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = clamp(normalize(vP).y * 1.6 + 0.22, 0.0, 1.0);
      gl_FragColor = vec4(mix(bottom, top, pow(h, 0.8)), 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(24000, 24, 12), skyMat);
  scene.add(sky);

  /* ── Fog + lights ─────────────────────────────────────────── */
  scene.fog = new THREE.Fog(0xf2c79a, 6500, 21000);

  const sun = new THREE.DirectionalLight(0xffdfae, 2.4);
  sun.position.set(target.x - 5200, 2600, target.z + 3200); // low west sun = golden hour
  // Shadow camera covers the hills cluster (the area of interest)
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 500;
  sun.shadow.camera.far = 12000;
  sun.shadow.camera.left = -4500;
  sun.shadow.camera.right = 4500;
  sun.shadow.camera.top = 4500;
  sun.shadow.camera.bottom = -4500;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xbdd7f5, 0x9a7850, 0.55);
  scene.add(hemi);

  /* ── Terrain mesh ─────────────────────────────────────────── */
  const geo = new THREE.PlaneGeometry(SIZE_X, SIZE_Z, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / SIZE_X + 0.5;
    const v = pos.getZ(i) / SIZE_Z + 0.5;
    // bilinear sample
    const fx = u * (G - 1), fy = v * (G - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(G - 1, x0 + 1), y1 = Math.min(G - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const h00 = hdata[y0 * G + x0], h10 = hdata[y0 * G + x1];
    const h01 = hdata[y1 * G + x0], h11 = hdata[y1 * G + x1];
    const h = (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
    pos.setY(i, (h / 65535) * ELEV_SPAN * EXAG);
  }
  geo.computeVertexNormals();

  const tex = await new Promise((res, rej) =>
    new THREE.TextureLoader().load(T.texture, res, undefined, rej));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // PBR detail maps — tiny surface bumps and varying roughness for realism.
  // Loaded in parallel; missing maps degrade gracefully (back-compat with
  // older builds that did not generate them).
  const loader = new THREE.TextureLoader();
  const loadOpt = (url) => url ? new Promise((res, rej) =>
    loader.load(url, res, undefined, rej)) : Promise.resolve(null);
  const [normalTex, roughTex] = await Promise.all([
    loadOpt(T.normalMap),
    loadOpt(T.roughMap),
  ]);
  for (const dt of [normalTex, roughTex]) {
    if (dt) {
      dt.anisotropy = renderer.capabilities.getMaxAnisotropy();
      dt.wrapS = dt.wrapT = THREE.RepeatWrapping;
    }
  }

  const terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex,
    normalMap: normalTex || null,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: roughTex || null,
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.35,
  }));
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);

  /* ── Feature lines (boundary / road / borders) ────────────── */
  function tubeAlong(uvPts, { color, radius = 5, closed = false, lift = 14, emissive = 0.35 }) {
    if (!uvPts || uvPts.length < 2) return;
    const pts = uvPts.map(([u, v]) => {
      const p = local(u, v);
      p.y = heightAt(u, v) + lift;
      return p;
    });
    const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.6);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.max(32, uvPts.length * 24), radius, 8, closed),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: emissive, roughness: 0.4,
        metalness: 0.1, envMapIntensity: 0.6,
      }));
    tube.castShadow = true;
    tube.receiveShadow = true;
    scene.add(tube);
  }

  tubeAlong(T.boundary, { color: 0xc9842a, closed: true });        // farm boundary — gold
  tubeAlong(T.road,     { color: 0xf0e6d2, radius: 6, lift: 10, emissive: 0.15 }); // D2695 — cream
  tubeAlong(T.etosha,   { color: 0x2e7d32, lift: 16 });            // Etosha border — green
  tubeAlong(T.ongava,   { color: 0xa0522d, lift: 16 });            // Ongava border — terracotta

  /* ── Drifting clouds (soft procedural billboards) ─────────── */
  function makeCloudTexture(seed) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14; i++) {
      const x = 40 + rnd() * 176, y = 90 + rnd() * 76, r = 22 + rnd() * 46;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,252,248,0.55)');
      g.addColorStop(1, 'rgba(255,252,248,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const clouds = [];
  if (!reducedMotion) {
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.SpriteMaterial({
        map: makeCloudTexture(1234 + i * 777),
        transparent: true, depthWrite: false, opacity: 0.4, fog: false,
      });
      const spr = new THREE.Sprite(mat);
      const scale = 2600 + i * 900;
      spr.scale.set(scale, scale * 0.38, 1);
      spr.position.set(
        (Math.random() - 0.5) * SIZE_X * 1.6,
        2500 + Math.random() * 1400,
        (Math.random() - 0.5) * SIZE_Z * 1.6);
      spr.userData.speed = 26 + Math.random() * 22;
      scene.add(spr);
      clouds.push(spr);
    }
  }

  /* ── Soaring birds (silhouettes circling a thermal) ───────── */
  function makeBirdTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = 'rgba(25,18,12,0.9)';
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();                 // simple gull "V" silhouette
    ctx.moveTo(6, 40); ctx.quadraticCurveTo(20, 22, 32, 34);
    ctx.quadraticCurveTo(44, 22, 58, 40);
    ctx.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const birds = [];
  if (!reducedMotion) {
    const birdTex = makeBirdTexture();
    const cx = target.x, cz = target.z;      // thermal above the hills
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.SpriteMaterial({
        map: birdTex, transparent: true, depthWrite: false, fog: false,
      });
      const b = new THREE.Sprite(mat);
      const sz = 90 + i * 22;
      b.scale.set(sz, sz * 0.6, 1);
      b.userData = {
        angle: i * 2.1,
        radius: 260 + i * 130,
        height: target.y + 620 + i * 160,
        speed: 0.14 + i * 0.035,
        cx, cz,
      };
      scene.add(b);
      birds.push(b);
    }
  }

  /* ── Hill markers (HTML overlay, clickable) ───────────────── */
  const markers = T.hills.map((h, i) => {
    const p = local(h.u, h.v);
    p.y = heightAt(h.u, h.v) + 90;
    const num = i + 1;
    const el = document.createElement('a');
    el.className = 'terrain-marker terrain-marker-' + h.status;
    el.href = h.link;
    el.innerHTML = `<span class="terrain-marker-dot"></span>
                    <span class="terrain-marker-label">${num}. ${h.name}</span>`;
    container.appendChild(el);
    return { el, p };
  });

  /* ── Borehole markers (blue dots, not clickable) ──────────── */
  for (const [u, v] of (T.boreholes || [])) {
    const p = local(u, v);
    p.y = heightAt(u, v) + 60;
    const el = document.createElement('span');
    el.className = 'terrain-marker terrain-marker-borehole';
    el.title = 'Borehole';
    el.innerHTML = '<span class="terrain-marker-dot"></span>';
    container.appendChild(el);
    markers.push({ el, p });
  }

  /* ── Day / night presets, lerped ──────────────────────────── */
  const DAY = {
    skyTop: new THREE.Color(0x7cb2e8), skyBot: new THREE.Color(0xf7cf9a),
    fog: new THREE.Color(0xf2c79a), fogNear: 6500, fogFar: 21000,
    sunColor: new THREE.Color(0xffdfae), sunInt: 2.4,
    hemiSky: new THREE.Color(0xbdd7f5), hemiGnd: new THREE.Color(0x9a7850), hemiInt: 0.55,
    exposure: 1.12,
  };
  const NIGHT = {
    skyTop: new THREE.Color(0x060a18), skyBot: new THREE.Color(0x2b2016),
    fog: new THREE.Color(0x1a2230), fogNear: 4500, fogFar: 16000,
    sunColor: new THREE.Color(0xa9c3ee), sunInt: 0.95,
    hemiSky: new THREE.Color(0x2c3d63), hemiGnd: new THREE.Color(0x1a140d), hemiInt: 0.45,
    exposure: 1.0,
  };
  let dayMix = document.body.classList.contains('hero-dark') ? 0 : 1; // 1=day
  let dayTarget = dayMix;

  new MutationObserver(() => {
    dayTarget = document.body.classList.contains('hero-dark') ? 0 : 1;
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  function applyDayNight(m) {
    skyMat.uniforms.top.value.lerpColors(NIGHT.skyTop, DAY.skyTop, m);
    skyMat.uniforms.bottom.value.lerpColors(NIGHT.skyBot, DAY.skyBot, m);
    scene.fog.color.lerpColors(NIGHT.fog, DAY.fog, m);
    scene.fog.near = NIGHT.fogNear + (DAY.fogNear - NIGHT.fogNear) * m;
    scene.fog.far = NIGHT.fogFar + (DAY.fogFar - NIGHT.fogFar) * m;
    sun.color.lerpColors(NIGHT.sunColor, DAY.sunColor, m);
    sun.intensity = NIGHT.sunInt + (DAY.sunInt - NIGHT.sunInt) * m;
    hemi.color.lerpColors(NIGHT.hemiSky, DAY.hemiSky, m);
    hemi.groundColor.lerpColors(NIGHT.hemiGnd, DAY.hemiGnd, m);
    hemi.intensity = NIGHT.hemiInt + (DAY.hemiInt - NIGHT.hemiInt) * m;
    renderer.toneMappingExposure = NIGHT.exposure + (DAY.exposure - NIGHT.exposure) * m;
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

  /* ── Pause when hero is off-screen ────────────────────────── */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    .observe(container);

  /* ── Render loop ──────────────────────────────────────────── */
  const proj = new THREE.Vector3();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    dayMix += (dayTarget - dayMix) * 0.045;
    applyDayNight(dayMix);

    if (controls) {
      controls.update();
    } else {
      // Hero: slow drift + landscape leans toward the cursor
      heroAngle += dt * 0.045;
      const k = 1 - Math.pow(0.002, dt);           // frame-rate independent smoothing
      parallax.sx += (parallax.x - parallax.sx) * k;
      parallax.sy += (parallax.y - parallax.sy) * k;
      const az = heroAngle + parallax.sx * 0.10;   // ±5.7° lean
      const pol = THREE.MathUtils.clamp(
        heroPolar + parallax.sy * 0.06, 0.7, 1.3); // ±3.4° tilt
      camera.position.set(
        target.x + heroRadius * Math.sin(pol) * Math.sin(az),
        target.y + heroRadius * Math.cos(pol),
        target.z + heroRadius * Math.sin(pol) * Math.cos(az));
      camera.lookAt(target.x, target.y + parallax.sx * 30, target.z);
    }

    // Clouds drift east, wrap around; fade at night
    for (const c of clouds) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > SIZE_X * 0.9) c.position.x = -SIZE_X * 0.9;
      c.material.opacity = 0.42 * dayMix + 0.08;
    }

    // Birds circle the thermal with a gentle bob
    for (const b of birds) {
      const u = b.userData;
      u.angle += u.speed * dt;
      b.position.set(
        u.cx + Math.cos(u.angle) * u.radius,
        u.height + Math.sin(u.angle * 2.3) * 26,
        u.cz + Math.sin(u.angle) * u.radius);
      b.material.opacity = 0.25 + 0.75 * dayMix;
    }

    const w = container.clientWidth, h = container.clientHeight;
    for (const m of markers) {
      proj.copy(m.p).project(camera);
      const onScreen = proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      m.el.style.display = onScreen ? '' : 'none';
      if (onScreen) {
        m.el.style.transform =
          `translate(${(proj.x * 0.5 + 0.5) * w}px, ${(-proj.y * 0.5 + 0.5) * h}px)`;
      }
    }
    renderer.render(scene, camera);
  });

  // First frame rendered → fade in, drop the photo fallback
  requestAnimationFrame(() =>
    document.querySelector('.hero')?.classList.add('terrain-ready'));

  // Debug handle (used by tooling; harmless in production)
  window.__terrain = { renderer, scene, camera, controls };
}
