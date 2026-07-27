# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sielsoord — a static marketing website (pure HTML/CSS/JS, no frameworks, no build step, no package.json) selling 7 private mountaintop parcels on a 2,500-hectare Namibian farm near Etosha. Primary content language is Afrikaans.

## Running

```bash
python3 -m http.server 8765   # from the repo root, then open http://localhost:8765
```

No build, lint, or test tooling exists. Verify changes by loading pages in a browser.

## Architecture

### Pages
Top-level pages: `index.html`, `storie.html`, `koppies.html` (mountain catalogue), `kaart.html` (interactive map), `kontak.html`, `gallery.html`. Individual mountain detail pages live in `berg/` (`sielsrus.html`, `sielskemering.html`, `sielsaandster.html`, etc. — note `berg/` pages reference assets with `../` paths).

There is no templating: the nav header, footer, and language switcher markup are duplicated in every HTML file. A change to shared chrome must be applied to all pages, including all 8 in `berg/`.

### i18n (runtime translation)
The site is trilingual (Afrikaans default, English, German). All translatable text is marked with `data-i18n="key"` attributes; `js/i18n.js` swaps `innerHTML` at load/switch time using the `TRANSLATIONS` dict in `js/translations.js` (single file, all three languages). Language choice persists in localStorage under `sielsoord-lang`. When adding visible text to any page, add keys to all three languages in `translations.js` and use `data-i18n` — don't hardcode strings that should translate.

Script tags use cache-busting query strings (e.g. `translations.js?v=8`, `i18n.js?v=5`, `gallery.js?v=3`). When you edit one of these JS files, bump its `?v=` number in **every** HTML file that includes it.

### Map (`kaart.html` + `js/map.js`)
`map.js` self-loads Leaflet 1.9.4 and its CSS from CDN, then renders Esri satellite tiles (no API key). The farm geodata (boundary, hills, waterpoints, roads) is **embedded in `map.js`** as `SIELSOORD_GEOJSON` — parsed from `data/rustoort-2500.kml`; the files in `data/` are the source of truth but are not fetched at runtime. `HILL_NAMES` maps raw KML feature names to display names/colors/page links. Both KML files (`data/Sielsoord.kml` and `data/rustoort-2500.kml`) are publicly downloadable from the `kaart.html` page with download buttons and Google Earth instructions.

### Gallery (`gallery.html` + `js/gallery.js`)
Gallery content is driven by the `CATEGORIES` array at the top of `gallery.js` — each category has i18n title/desc keys and an explicit list of image paths under `images/gallery/<slug>/`. To add photos, drop files there and append paths to the array.

### Contact form (`kontak.html` + `js/form.js`)
Uses Netlify Forms (`data-netlify="true"` + honeypot); `form.js` only does client-side validation. Works only when deployed to Netlify.

### Device counter (`js/counter.js` + `netlify/functions/counter.js` + `teller.html`)
Invisible unique-device counter. `js/counter.js` (included on all 14 site pages) sets a `localStorage` flag (`sielsoord_v`) so each device counts only once ever, then `POST`s to `/api/counter`. The Netlify Function (`netlify/functions/counter.js`) stores the count in `/tmp/sielsoord-counter.json` (persists across warm Lambda invocations). Admin view at `teller.html` (no robots, no nav — secret URL only you know) fetches `GET /api/counter` and shows the count. Configured via `netlify.toml`. No npm dependencies, no external services.

### CSS
`css/style.css` holds the full design system (Namibian earth palette: gold `#C9842A`, sunset `#E07B39`, espresso `#2C1810`, cream `#FAF3E7`) and all components; `css/responsive.css` holds mobile/tablet breakpoints. Fonts: Cormorant Garamond (headings), Lora (body), Montserrat (labels/buttons) via Google Fonts. Maintain WCAG contrast, ≥44px touch targets, and `prefers-reduced-motion` support.

### 3D Game Drive Viewer (REMOVED)
The Location section's right column (`#gamedrive-3d`, where a stock photo used to be) previously held a Blender-authored Three.js bushveld scene. This has been removed. The Location section now spans full width with text only.

### 3D Terrain Map (`kaart.html` + `js/terrain.js` + `js/terrain-data.js`)
The map page's interactive map is a real-time Three.js (r166, importmap via jsdelivr CDN) scene of the **actual farm**: SRTM elevation mesh textured with Esri World Imagery. It replaced the old Leaflet map (`js/map.js` is kept but no longer loaded). Features rendered: gold farm-boundary tube, cream D2695 road, green Etosha border, terracotta Ongava border, 8 clickable hill markers, 2 borehole dots, clouds/birds, day-night sync with the nav toggle, and a `#terrain-reset` button (i18n key `map.control_reset`). `terrain-data.js` holds `window.SIELSOORD_TERRAIN` (bbox, grid, elevation range, `sizeX/sizeZ` in metres, feature lines as `[u,v]` polylines, hills). Assets in `images/terrain/`; rebuild with:
```bash
env -u VIRTUAL_ENV PYTHONPATH='' uv run --with pillow --with numpy tools/build_terrain.py
```
(Tiles cached in `tools/.tile-cache/`.) Tunables at top of `terrain.js`: `EXAG` (3.5), `SEG` (128 mobile / 256 desktop). Two modes, auto-detected by container id: **map mode** (`#terrain-map`, kaart.html) = OrbitControls, zoom, touch orbit, auto-rotate-until-interaction; **hero mode** (`#terrain-hero`, index.html) = no controls — slow auto-drift plus mouse-parallax "lean toward cursor" (pointer-events none on canvas so scroll passes through), with `hero-bg-fallback` photo fading out via `.hero.terrain-ready`. `window.__terrain` exposes renderer/scene/camera/controls for debugging.

## Caveats

- `README.md` is partially stale: it lists old `berg/` filenames and omits `gallery.html` and the i18n system. Trust the actual files over the README's file-structure section.
- `graphify-out/` is generated knowledge-graph output, not site code.
- The KML spells the farm "Rustoort" (typo, with a T) — match boundary placemarks on "2500 Hectare", not the name.
