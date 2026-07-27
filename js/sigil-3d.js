/**
 * Sielsoord Sigil 3D — the gold mopane emblem as a small, warm, living object.
 *
 * Renders images/icons/sielsoord-logo.svg (tree fills only) as extruded gold
 * geometry with a coin backplate + rim for larger mounts. Transparent canvas,
 * slow seamless spin, gentle pointer lean (desktop only), pauses off-screen.
 *
 * Mount points: any element with [data-sigil3d="nav"|"footer"].
 * Falls back silently: if WebGL/SVG fails, existing content (nav "S") stays.
 *
 * Requires the three@0.166.1 importmap already used by terrain/hero pages.
 */

import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TUNING = {
  nav:    { coin: false, spin: 0.55, float: 0,     camHalf: 1.04, curveSegments: 6,  lean: 0.30 },
  footer: { coin: true,  spin: 0.40, float: 0.045, camHalf: 1.12, curveSegments: 10, lean: 0.22 },
};

const COLORS = {
  tree:  0xF2CC66,  // bright leaf gold — pops against the coin
  coin:  0xA5661F,  // deep burnished gold backplate
  rim:   0xE8C547,  // light ring gold
  key:   0xFFE0B0,  // warm key light
  fill:  0xE07B39,  // sunset rim light
  sky:   0xFAF3E7,  // cream hemisphere sky
  ground: 0x2C1810, // espresso hemisphere ground
};

const EXTRUDE = { depth: 10, bevelEnabled: true, bevelThickness: 1.4, bevelSize: 1.2, bevelSegments: 2 };

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ── Geometry: parse the sigil SVG once, share across all mounts ────────── */

let geometryPromise = null;

function parseSigilShapes(svgText, curveSegments) {
  // Gradients (url(#…)) aren't resolved by SVGLoader and only spam warnings —
  // we override materials anyway, so flatten them to a plain fill first.
  const flat = svgText.replace(/url\(#[^)]+\)/g, '#D4AF37');
  const data = new SVGLoader().parse(flat);
  const shapes = [];
  for (const path of data.paths) {
    const style = path.userData.style || {};
    if (style.fill === undefined || style.fill === 'none') continue; // strokes: rings, ground, text line
    for (const shape of SVGLoader.createShapes(path)) shapes.push(shape);
  }
  if (!shapes.length) throw new Error('no fill shapes found in sigil svg');
  const geoms = shapes.map((shape) => new THREE.ExtrudeGeometry(shape, { ...EXTRUDE, curveSegments }));
  const merged = mergeGeometries(geoms, false);
  geoms.forEach((g) => g.dispose());
  merged.computeBoundingBox();
  const c = merged.boundingBox.getCenter(new THREE.Vector3());
  merged.translate(-c.x, -c.y, -EXTRUDE.depth / 2);
  merged.computeBoundingSphere();
  return { geometry: merged, radius: merged.boundingSphere.radius };
}

function getSigilGeometry(curveSegments) {
  if (!geometryPromise) {
    const url = new URL('../images/icons/sielsoord-logo.svg', import.meta.url);
    geometryPromise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('sigil svg fetch failed: ' + res.status);
        return res.text();
      })
      .then((svgText) => ({
        nav: parseSigilShapes(svgText, TUNING.nav.curveSegments),
        footer: parseSigilShapes(svgText, TUNING.footer.curveSegments),
      }));
  }
  return geometryPromise;
}

/* ── One live sigil instance per mount point ────────────────────────────── */

const instances = [];

class SigilInstance {
  constructor(mount, kind, tree) {
    const cfg = TUNING[kind] || TUNING.footer;
    this.cfg = cfg;
    this.mount = mount;
    this.visible = true;
    this.spin = Math.random() * Math.PI * 2;
    this.tilt = new THREE.Vector2(0, 0);
    this.tiltTarget = new THREE.Vector2(0, 0);

    const width = mount.clientWidth || 36;
    const height = mount.clientHeight || width;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.className = 'sigil3d-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.scene = new THREE.Scene();

    // Warm studio: cream/espresso hemisphere + golden-hour key + sunset rim
    this.scene.add(new THREE.HemisphereLight(COLORS.sky, COLORS.ground, 0.42));
    const key = new THREE.DirectionalLight(COLORS.key, 3.0);
    key.position.set(2.5, 3.2, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(COLORS.fill, 1.4);
    rim.position.set(-3, -1.2, -2.5);
    this.scene.add(rim);

    // Soft neutral environment so the gold reads as metal, tinted warm by lights
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(this.renderer), 0.04).texture;
    this.scene.environmentIntensity = 0.65;
    pmrem.dispose();

    // Camera: orthographic, object normalised to radius ~1
    const h = cfg.camHalf;
    this.camera = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, 50);
    this.camera.position.set(0, 0, 10);

    // Object stack: tilt (pointer) → spin (Y) → flip (SVG y-down) → meshes
    this.tiltGroup = new THREE.Group();
    this.spinGroup = new THREE.Group();
    const flip = new THREE.Group();
    flip.rotation.x = Math.PI;
    this.tiltGroup.add(this.spinGroup);
    this.spinGroup.add(flip);
    this.scene.add(this.tiltGroup);

    const scale = (cfg.coin ? 1 / (tree.radius * 1.18) : 0.92 / tree.radius);
    flip.scale.setScalar(scale);

    // The gold mopane tree
    const treeMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.tree, metalness: 0.85, roughness: 0.22,
      clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 1.15,
    });
    flip.add(new THREE.Mesh(tree.geometry, treeMat));

    // Medallion: coin backplate + bright rim (footer / larger mounts)
    if (cfg.coin) {
      const coinR = tree.radius * 1.18;
      const coinMat = new THREE.MeshPhysicalMaterial({
        color: COLORS.coin, metalness: 0.8, roughness: 0.52, envMapIntensity: 0.7,
      });
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(coinR, coinR, 7, 72), coinMat);
      coin.rotation.x = Math.PI / 2;
      // NOTE: the parent "flip" group negates Z, so +Z here = behind the tree
      coin.position.z = EXTRUDE.depth / 2 + 3.5 + 2;
      flip.add(coin);

      const rimMat = new THREE.MeshPhysicalMaterial({
        color: COLORS.rim, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.1,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(coinR, 2.6, 12, 96), rimMat);
      ring.position.z = coin.position.z;
      flip.add(ring);
    }

    mount.appendChild(this.renderer.domElement);
    mount.classList.add('sigil-on');

    // Pause rendering when off-screen
    this.io = new IntersectionObserver((entries) => {
      this.visible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    this.io.observe(mount);

    // Re-fit on size changes (responsive nav breakpoints)
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(mount);

    this.render(0);
  }

  resize() {
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    if (reducedMotion) this.render(0);
  }

  setLean(nx, ny) {
    this.tiltTarget.set(ny * this.cfg.lean, nx * this.cfg.lean);
  }

  render(dt) {
    if (dt > 0) {
      this.spin += dt * this.cfg.spin;
      const k = Math.min(1, dt * 4);
      this.tilt.lerp(this.tiltTarget, k);
    }
    this.spinGroup.rotation.y = this.spin;
    this.tiltGroup.rotation.x = this.tilt.x;
    this.tiltGroup.rotation.y = this.tilt.y;
    if (this.cfg.float) {
      this.spinGroup.position.y = Math.sin(this.spin * 1.7) * this.cfg.float;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

/* ── Boot ────────────────────────────────────────────────────────────────── */

function init() {
  const mounts = document.querySelectorAll('[data-sigil3d]');
  if (!mounts.length) return;

  getSigilGeometry().then((sets) => {
    for (const mount of mounts) {
      const kind = mount.getAttribute('data-sigil3d') || 'footer';
      const tree = kind === 'nav' ? sets.nav : sets.footer;
      try {
        instances.push(new SigilInstance(mount, kind, tree));
      } catch (err) {
        console.warn('sigil-3d: WebGL unavailable, keeping 2D fallback', err);
      }
    }
    if (!instances.length) return;

    window.__sigil = { instances };

    // Desktop pointer lean — the whole page is the stage
    if (finePointer && !reducedMotion) {
      window.addEventListener('pointermove', (e) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        for (const inst of instances) inst.setLean(nx, ny);
      }, { passive: true });
    }

    if (reducedMotion) return; // single static frame already rendered

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        for (const inst of instances) {
          if (inst.visible) inst.render(dt);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }).catch((err) => {
    console.warn('sigil-3d: could not build sigil, keeping 2D fallback', err);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
