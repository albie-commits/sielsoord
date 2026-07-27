# Graph Report - .  (2026-07-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 170 nodes · 107 edges · 89 communities (12 shown, 77 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 1,802 input · 1,092 output

## Community Hubs (Navigation)
- Home Page Logic
- Interactive Map Component
- Gallery Navigation and Lightbox
- Estate Branding and Overview
- Internationalization and Language Switcher
- Property Detail Pages
- Server Management Script
- Solar Security Infrastructure
- Bird Photography Collection
- Little Bee-eater Photos
- Little Bee-eater Profiles
- Plum-colored Starling Photos
- Southern Yellow-billed Hornbill Photos
- Short-toed Rock Thrush Photos
- Exterior Building Views
- Lilac-breasted Roller Perched
- Hornbill Feeding Photos
- Ground-dwelling Bird Photos
- Roller Dead Tree Profiles
- Hornbill Ground Photos
- Bush-dwelling Bird Photos
- Cinnamon-breasted Bunting Photos
- Roller Trunk Perch
- Dusk Landscape Silhouettes
- Stone Cottage Hillside
- Road and Fence Perspectives
- Solar Communication Towers
- Electric Fence Details
- Scrubland Sunset Vistas
- Sielsdageraad Page
- Sielshoogte Page
- Sielshorison Page
- Sielsstilte Page
- Sielswind Page
- Die Plaas Page
- Roller Tree Gallery
- Hornbill Ground Gallery
- Bunting Rock Gallery
- Roller Branch Gallery
- Savanna Landscape View
- Solar Roof Patio
- Sunset Patio View
- Outdoor Seating Area
- Wide Patio Perspective
- Boma and Hot Tub
- Interior Living Space
- Dining Area Guests
- Kitchen and Braai
- Lounge and Trophies
- Dusk Boma View
- Green Bee-eater Photos
- Bushveld Landscape
- Bird Profile Shots
- Sielsrus Patio
- Sielsrus Outdoor Amenities
- Purple and White Bird
- Thorny Branch Perch
- Sideways Bird Profile
- Orange-breasted Bird
- Yellow-billed Hornbill Ground
- Striped-head Rock Bird
- Roller Dead Tree View
- Roller Forward Facing
- Roller Branch Perch
- Green Bee-eater Perch
- Purple Sunset Landscape
- Cloud Sunlight Rays
- Rural Electric Fencing
- Orange Sunset Hillside
- Vibrant Bushveld Sunset
- Valley View Fire Pit
- Sunset Bushveld Road
- Stone Building Field
- Sunset Quad Bike
- Orange Tree Silhouettes
- Blue Sky Bushveld
- Hilly Landscape Sunlight
- Green Landscape Clouds
- Sunset Rainbow View
- Sunset Ridge Clouds
- Distant Fence Road
- Afternoon Fence Line
- Perimeter Fence Sunset
- Sunset Lounge Patio
- Dry Landscape Fence
- Sun Rays Hillside

## God Nodes (most connected - your core abstractions)
1. `Home Page` - 8 edges
2. `init()` - 5 edges
3. `initSielsoordMap()` - 5 edges
4. `renderBubbles()` - 4 edges
5. `openCategory()` - 4 edges
6. `setLang()` - 4 edges
7. `applyTranslations()` - 4 edges
8. `getFeatureStyle()` - 4 edges
9. `getPopupContent()` - 4 edges
10. `validate()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Sunset over Sielsoord (Dark)` --conceptually_related_to--> `Home Page`  [INFERRED]
  images/hero-dark.jpg → index.html
- `Home Page` --references--> `Sunset over Sielsoord (Light)`  [EXTRACTED]
  index.html → images/hero-light.jpg
- `Home Page` --references--> `Koppies Page`  [EXTRACTED]
  index.html → koppies.html
- `Home Page` --references--> `Kaart Page`  [EXTRACTED]
  index.html → kaart.html
- `Home Page` --references--> `Kontak Page`  [EXTRACTED]
  index.html → kontak.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Mountain Detail Pages** — berg_sielsrus_html, berg_sielskemering_html, berg_sielsaandster_html, berg_sielswind_html, berg_sielshoogte_html, berg_sielsstilte_html, berg_sielsdageraad_html, berg_sielshorison_html [EXTRACTED 1.00]
- **Internationalization System** — js_i18n_js, js_translations_js, index_html, die_plaas_html, koppies_html, kaart_html, kontak_html, gallery_html [EXTRACTED 1.00]
- **Bird Photography Collection** — images_birds_64113ef4-a4d5-43ae-a8ce-e3a88b292246sielsoord, images_birds_74366822-33c4-4821-ba41-972769cb48c1sielsoord, images_birds_dsc_0010sielsoord, images_birds_dsc_0158sielsoord, images_birds_dsc_0190sielsoord, images_birds_fa5fb12d-ef2b-426f-9cb6-756d98bd6e70sielsoord [INFERRED 0.90]
- **Sielsoord Visual Identity** — images_icons_sielsoord_logo, images_icons_sielsoord_logo_preview, sielsoord_concept, mopane_tree_concept [EXTRACTED 1.00]
- **Homestead Facilities and Amenities** — images_gallery_homestead_img_0157, images_gallery_homestead_img_0522, images_gallery_homestead_img_0534_2, images_gallery_homestead_img_0532 [INFERRED 0.90]
- **Wildlife Photography at Sielsrus** — images_sielsrus_dsc_0010sielsoord, images_sielsrus_dsc_0020sielsoord, images_sielsrus_dsc_0056sielsoord, images_sielsrus_dsc_0158sielsoord, images_sielsrus_dsc_0190sielsoord, images_sielsrus_dsc_0207sielsoord [EXTRACTED 0.90]
- **Sielsrus Property Landscapes** — images_sielsrus_img_1634sielsoord, images_sielsrus_img_1635sielsoord, images_sielsrus_img_1698sielsoord, images_sielsrus_img_3414sielsoord, images_sielsrus_img_3449sielsoord, images_sielsrus_img_6220sielsoord, images_sielsrus_img_6321sielsoord, images_sielsrus_img_6340sielsoord [INFERRED 0.80]
- **Sielsrus Infrastructure and Facilities** — images_sielsrus_img_1681sielsoord, images_sielsrus_img_2647sielsoord, images_sielsrus_img_4464sielsoord, images_sielsrus_img_8020sielsoord, images_sielsrus_img_8025sielsoord [INFERRED 0.80]
- **Sielsrus Security Infrastructure** — images_sielsrus_img_8027sielsoord, images_sielsrus_img_8028sielsoord, images_sielsrus_img_8029sielsoord, images_sielsrus_img_8030sielsoord, images_sielsrus_img_8031sielsoord, images_sielsrus_img_8032sielsoord, images_sielsrus_gallery_7 [EXTRACTED 0.90]
- **Sielsrus Wildlife and Nature** — images_sielsrus_fa5fb12d_ef2b_426f_9cb6_756d98bd6e70sielsoord, images_sielsrus_gallery_1, images_sielsrus_gallery_2, images_sielsrus_gallery_3, images_sielsrus_gallery_4, images_sielsrus_gallery_5, images_sielsrus_gallery_6, images_sielsrus_gallery_8, images_sielsrus_hero_1, images_sielsrus_sielsrus_1, images_sielsrus_sielsrus_2, images_sielsrus_sielsrus_3 [EXTRACTED 0.90]
- **Sielsrus Wildlife and Landscape Photography** — images_sielsrus_sielsrus_4, images_sielsrus_sielsrus_5, images_sielsrus_sielsrus_6, images_sielsrus_sielsrus_7, images_sielsrus_sielsrus_8, images_sielsrus_sielsrus_9, images_sielsrus_sielsrus_hero [EXTRACTED 1.00]

## Communities (89 total, 77 thin omitted)

### Community 0 - "Home Page Logic"
Cohesion: 0.16
Nodes (9): Sunset over Sielsoord (Dark), Sunset over Sielsoord (Light), Home Page, clearError(), showError(), validate(), TRANSLATIONS, Kaart Page (+1 more)

### Community 1 - "Interactive Map Component"
Cohesion: 0.24
Nodes (10): FEATURE_STYLES, getDisplayName(), getFeatureStyle(), getHillStyle(), getPopupContent(), HILL_NAMES, initSielsoordMap(), injectPopupStyles() (+2 more)

### Community 2 - "Gallery Navigation and Lightbox"
Cohesion: 0.31
Nodes (6): Gallery Page, initGallery(), openCategory(), openLightbox(), renderBubbles(), t()

### Community 3 - "Estate Branding and Overview"
Cohesion: 0.25
Nodes (8): Bird on Mopane Branch, Homestead Overview with Solar Panels, KolKol Wood-Fired Hot Tub with View, Sielsoord Logo, Sielsoord Logo Preview, Sielsrus Homestead Overview, Mopane Tree Symbolism, Sielsoord Estate

### Community 4 - "Internationalization and Language Switcher"
Cohesion: 0.50
Nodes (7): applyTranslations(), createSwitcherHTML(), getLang(), init(), setLang(), translateElement(), updateSwitcherUI()

### Community 5 - "Property Detail Pages"
Cohesion: 0.50
Nodes (4): Sielsaandster Detail Page, Sielskemering Detail Page, Sielsrus Detail Page, Koppies Page

### Community 7 - "Server Management Script"
Cohesion: 0.67
Nodes (3): find_free_port(), main(), Try the preferred port; if taken, walk up to find a free one.

### Community 8 - "Solar Security Infrastructure"
Cohesion: 0.67
Nodes (3): Solar powered security camera tower in arid landscape, Close-up of solar powered security camera tower, Detailed view of security camera and solar panel assembly

### Community 9 - "Bird Photography Collection"
Cohesion: 0.67
Nodes (3): Photo of a small brown bird on a rock, Photo of a Yellow-billed Hornbill in a tree, Photo of a Lilac-breasted Roller perched on a branch

## Knowledge Gaps
- **114 isolated node(s):** `HILL_NAMES`, `FEATURE_STYLES`, `SIELSOORD_GEOJSON`, `SIELSOORD_KML_FEATURES`, `TRANSLATIONS` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Home Page` connect `Home Page Logic` to `Internationalization and Language Switcher`, `Property Detail Pages`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `Kaart Page` connect `Home Page Logic` to `Interactive Map Component`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `HILL_NAMES`, `FEATURE_STYLES`, `SIELSOORD_GEOJSON` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._