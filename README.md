# Sielsoord — Waar jou siel tot rus kom

A warm, beautiful marketing website for selling 7 private mountaintop parcels (R3.5M NAD each) on a 2,500-hectare Namibian farm near Etosha National Park.

## Quick Start

```bash
# From the sielsoord directory:
python3 -m http.server 8765
# Open http://localhost:8765 in your browser
```

Or just open `index.html` directly in any browser.

## Pages

| Page | File | Purpose |
|------|------|---------|
| Home | `index.html` | Emotional landing — hero, stats, mountain preview |
| Die Plaas | `die-plaas.html` | Farm story, heritage, gallery, location |
| Koppies | `koppies.html` | All 8 mountains catalogue + comparison table |
| Kaart | `kaart.html` | Interactive satellite map with KML data |
| Kontak | `kontak.html` | Contact form, visit info, FAQ |
| Mountain pages | `berg/*.html` | 7 individual mountain detail pages (×7) |

## The Interactive Map (Kaart page)

The map uses **Leaflet** + **Esri satellite imagery** (free, no API key needed). It displays the real data extracted from the KML file:

- Farm boundary polygon (Rustoort 2,500 Hectare)
- 3 Waterpoints
- D2695 Gravel Highway access road
- Etosha National Game Reserve boundary
- Ongava Reserve border
- Rustoord farm border

**KML source:** `data/rustoort-2500.kml` — the original file from Google Earth.
**GeoJSON:** `data/rustoort-2500.geojson` — parsed version for the map.

The KML data is **embedded** in `js/map.js` as GeoJSON. Buyers can preview everything on the map but cannot download the source KML until they register interest.

## Design System

### Colours (Namibian Earth Palette)
- Primary: `#C9842A` (Namibian gold/ochre)
- Sunset: `#E07B39` (sunset orange — CTAs)
- Deep: `#2C1810` (espresso — text, dark sections)
- Cream: `#FAF3E7` (warm background)
- Accent: `#D4A574` (soft sand)
- Olive: `#6B7F3E` (veld green)

### Typography
- **Headings:** Cormorant Garamond (elegant serif)
- **Body:** Lora (readable serif)
- **Labels/Buttons:** Montserrat (clean sans-serif)

### Accessibility
- WCAG-compliant colour contrast
- All touch targets ≥ 44px
- Skip links, ARIA labels, keyboard navigation
- `prefers-reduced-motion` respected
- Body text ≥ 16px

## File Structure
```
sielsoord/
├── index.html              # Home
├── die-plaas.html          # Farm story
├── koppies.html            # Mountains overview
├── kaart.html              # Interactive map
├── kontak.html             # Contact + FAQ
├── berg/                   # 7 mountain pages
│   ├── skemerberg.html
│   ├── aandster.html
│   ├── windrus.html
│   ├── eikehoogte.html
│   ├── stilhoogte.html
│   ├── dawerand.html
│   └── horison.html
├── css/
│   ├── style.css           # Design system + all components
│   └── responsive.css      # Mobile/tablet breakpoints
├── js/
│   ├── main.js             # Nav, scroll animations, FAQ, lightbox
│   ├── map.js              # Leaflet map + KML GeoJSON data
│   └── form.js             # Contact form validation + submission
├── data/
│   ├── rustoort-2500.kml   # Original KML from Google Earth
│   └── rustoort-2500.geojson  # Parsed GeoJSON
└── images/                 # (placeholder — real photos go here)
```

## What To Do Next

1. **Replace placeholder images** with real photos of Sielsoord
2. **Add contact details** — phone, email, WhatsApp in `kontak.html`
3. **Set up form handling** — use Formspree (free) or Netlify Forms
4. **Register domain** — sielsoord.com or sielsoord.na
5. **Deploy** — drag-and-drop to Netlify (free hosting + SSL)

## Tech
- Pure HTML/CSS/JS — no frameworks, no build step
- Leaflet 1.9.4 for the interactive map (loaded from CDN)
- Google Fonts (Cormorant Garamond, Lora, Montserrat)
- Total size: ~80KB (excl. images) — loads fast anywhere
