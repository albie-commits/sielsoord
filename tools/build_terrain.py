#!/usr/bin/env python3
"""Build 3D terrain assets for the Sielsoord hero scene.

Fetches terrarium elevation tiles (SRTM) + Esri World Imagery tiles
covering the farm, and emits:
  images/terrain/terrain-height.png   16-bit grayscale heightmap (512x512)
  images/terrain/terrain-color.jpg    satellite texture (stitched, cropped)
  js/terrain-data.js                  SIELSOORD_TERRAIN meta + hill coords

Run:  uv run --with pillow --with numpy tools/build_terrain.py
"""
import io, json, math, time, urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_IMG = ROOT / "images" / "terrain"
OUT_IMG.mkdir(parents=True, exist_ok=True)

# Scene bbox (lon/lat) — farm + margin, from KML coordinates.
# North edge extends to -19.22 so the Etosha border line crosses the scene.
LON_MIN, LON_MAX = 15.545, 15.655
LAT_MIN, LAT_MAX = -19.435, -19.22

ZOOM = 14
GRID = 512          # heightmap resolution
TEX_MAX = 1600      # cap texture size

HILLS = [
    # (name, display, lon, lat, status, link)
    ("hill1", "Sielsrus",      15.59891354358137, -19.38367278952353, "private",  "berg/sielsrus.html"),
    ("hill2", "Sielskemering", 15.60744202194663, -19.3895983025817,  "forsale",  "berg/sielskemering.html"),
    ("hill3", "Sielsaandster", 15.6018628032906,  -19.38167124077474, "forsale",  "berg/sielsaandster.html"),
    ("hill4", "Sielswind",     15.60579519552022, -19.3796656225586,  "forsale",  "berg/sielswind.html"),
    ("hill5", "Sielshoogte",   15.60029687019487, -19.37599967681069, "forsale",  "berg/sielshoogte.html"),
    ("hill6", "Sielsstilte",   15.60932491450354, -19.37842675181275, "forsale",  "berg/sielsstilte.html"),
    ("hill7", "Sielsdageraad", 15.61164587545357, -19.36699948886113, "forsale",  "berg/sielsdageraad.html"),
    ("hill8", "Sielshorison",  15.5942654574986,  -19.36347378470299, "reserved", "berg/sielshorison.html"),
]

BOUNDARY_KML = ROOT / "data" / "rustoort-2500.kml"
BOUNDARY_NAME = "2500 Hectare"   # KML has the typo "Rustoort" — match on the numbers instead

CACHE = ROOT / "tools" / ".tile-cache"
CACHE.mkdir(exist_ok=True)


def read_features():
    """Map features from both KMLs: boreholes (points), road/etosha/ongava (lines).
    Returns lon/lat lists; caller converts to u/v and clips."""
    import xml.etree.ElementTree as ET
    ns = "{http://www.opengis.net/kml/2.2}"

    def placemarks(path):
        out = []
        for pm in ET.parse(path).iter(ns + "Placemark"):
            name_el = pm.find(ns + "name")
            coords_el = pm.find(".//" + ns + "coordinates")
            if coords_el is None or not coords_el.text:
                continue
            pts = [[float(t.split(",")[0]), float(t.split(",")[1])]
                   for t in coords_el.text.strip().split()]
            out.append(((name_el.text or "").strip() if name_el is not None else "", pts))
        return out

    feats = {"boreholes": [], "road": [], "etosha": [], "ongava": []}

    for name, pts in placemarks(ROOT / "data" / "Sielsoord.kml"):
        if name == "Borehole":
            lon = sum(p[0] for p in pts) / len(pts)
            lat = sum(p[1] for p in pts) / len(pts)
            feats["boreholes"].append([round(lon, 7), round(lat, 7)])
        elif "Etosha" in name:
            feats["etosha"] = pts
        elif "Ongava" in name:
            feats["ongava"] = pts

    for name, pts in placemarks(BOUNDARY_KML):
        if "D2695" in name and len(pts) > len(feats["road"]):
            feats["road"] = pts
        elif BOUNDARY_NAME in name:
            feats["boundary"] = pts

    return feats


def lonlat_to_uv(pts, bbox_only=False):
    """lon/lat -> [u,v] in scene space; optionally keep only in-bbox points."""
    out = []
    for lon, lat in pts:
        u = (lon - LON_MIN) / (LON_MAX - LON_MIN)
        v = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN)
        if bbox_only and not (0 <= u <= 1 and 0 <= v <= 1):
            continue
        out.append([round(u, 6), round(v, 6)])
    return out


def clip_polyline_to_bbox(pts):
    """lon/lat polyline -> list of [u,v] segments clipped to the unit box
    (Liang-Barsky per segment)."""
    uv = []
    for lon, lat in pts:
        u = (lon - LON_MIN) / (LON_MAX - LON_MIN)
        v = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN)
        uv.append((u, v))
    segs = []
    for (x0, y0), (x1, y1) in zip(uv, uv[1:]):
        dx, dy = x1 - x0, y1 - y0
        t0, t1, ok = 0.0, 1.0, True
        for p, q in ((-dx, x0), (dx, 1 - x0), (-dy, y0), (dy, 1 - y0)):
            if p == 0:
                if q < 0:
                    ok = False
                    break
            else:
                t = q / p
                if p < 0:
                    t0 = max(t0, t)
                else:
                    t1 = min(t1, t)
                if t0 > t1:
                    ok = False
                    break
        if ok:
            segs.append([[round(x0 + dx * t0, 6), round(y0 + dy * t0, 6)],
                         [round(x0 + dx * t1, 6), round(y0 + dy * t1, 6)]])
    return segs


def merge_segments(segs, eps=1e-4):
    """Join clipped segments that share endpoints back into polylines."""
    lines = []
    for seg in segs:
        if lines and (abs(lines[-1][-1][0] - seg[0][0]) < eps and
                      abs(lines[-1][-1][1] - seg[0][1]) < eps):
            lines[-1].append(seg[1])
        else:
            lines.append([seg[0], seg[1]])
    # single merged line if everything is contiguous (common case)
    return lines[0] if len(lines) == 1 else [p for line in lines for p in line]


def lonlat_to_tile(lon, lat, z):
    n = 2 ** z
    x = (lon + 180.0) / 360.0 * n
    lat_r = math.radians(lat)
    y = (1.0 - math.log(math.tan(lat_r) + 1.0 / math.cos(lat_r)) / math.pi) / 2.0 * n
    return x, y


def fetch(url, tries=3):
    key = url.split("/")[-3] + "-" + url.split("/")[-2] + "-" + url.split("/")[-1]
    cached = CACHE / key.replace("?", "_")
    if cached.exists():
        return cached.read_bytes()
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "sielsoord-terrain-build/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            cached.write_bytes(data)
            return data
        except Exception as e:
            print(f"  retry {i+1} {url}: {e}")
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"failed: {url}")


def tile_range():
    x0f, y0f = lonlat_to_tile(LON_MIN, LAT_MAX, ZOOM)  # NW
    x1f, y1f = lonlat_to_tile(LON_MAX, LAT_MIN, ZOOM)  # SE
    x0, y0 = math.floor(x0f), math.floor(y0f)
    x1, y1 = math.floor(x1f), math.floor(y1f)
    return (x0, y0, x1, y1), (x0f, y0f, x1f, y1f)


def build_elevation(x0, y0, x1, y1):
    W = (x1 - x0 + 1) * 256
    H = (y1 - y0 + 1) * 256
    elev = np.zeros((H, W), dtype=np.float32)
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{ZOOM}/{tx}/{ty}.png"
            data = fetch(url)
            img = np.array(Image.open(io.BytesIO(data)).convert("RGB"), dtype=np.float32)
            e = img[:, :, 0] * 256.0 + img[:, :, 1] + img[:, :, 2] / 256.0 - 32768.0
            elev[(ty - y0) * 256:(ty - y0 + 1) * 256, (tx - x0) * 256:(tx - x0 + 1) * 256] = e
            print(f"  elev tile {tx},{ty}  min={e.min():.0f} max={e.max():.0f}")
    return elev


def build_texture(x0, y0, x1, y1):
    W = (x1 - x0 + 1) * 256
    H = (y1 - y0 + 1) * 256
    tex = Image.new("RGB", (W, H))
    for ty in range(y0, y1 + 1):
        for tx in range(x0, x1 + 1):
            url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{ZOOM}/{ty}/{tx}"
            data = fetch(url)
            img = Image.open(io.BytesIO(data)).convert("RGB")
            tex.paste(img, ((tx - x0) * 256, (ty - y0) * 256))
            print(f"  tex tile {tx},{ty}")
    return tex


def crop_box(x0f, y0f, x1f, y1f, x0, y0):
    """pixel crop box within stitched tile image for exact bbox"""
    px0 = int(round((x0f - x0) * 256))
    py0 = int(round((y0f - y0) * 256))
    px1 = int(round((x1f - x0) * 256))
    py1 = int(round((y1f - y0) * 256))
    return px0, py0, px1, py1


def main():
    (x0, y0, x1, y1), (x0f, y0f, x1f, y1f) = tile_range()
    print(f"tiles: x {x0}..{x1}  y {y0}..{y1}  ({x1-x0+1}x{y1-y0+1})")

    print("== elevation ==")
    elev = build_elevation(x0, y0, x1, y1)
    print("== texture ==")
    tex = build_texture(x0, y0, x1, y1)

    px0, py0, px1, py1 = crop_box(x0f, y0f, x1f, y1f, x0, y0)
    elev_c = elev[py0:py1, px0:px1]
    tex_c = tex.crop((px0, py0, px1, py1))
    print(f"cropped: elev {elev_c.shape}, tex {tex_c.size}")

    # --- heightmap: resample to GRID x GRID, save 16-bit PNG + raw bin ---
    hmin, hmax = float(elev_c.min()), float(elev_c.max())
    norm = (elev_c - hmin) / (hmax - hmin)
    hm_arr = (norm * 65535.0).astype("<u2")          # little-endian uint16
    hm_img = Image.fromarray(hm_arr, mode="I;16")
    hm_img = hm_img.resize((GRID, GRID), Image.BICUBIC)
    hm_img.save(OUT_IMG / "terrain-height.png")
    np.array(hm_img, dtype="<u2").tofile(OUT_IMG / "terrain-height.bin")

    # --- texture: cap size, save jpg ---
    if max(tex_c.size) > TEX_MAX:
        s = TEX_MAX / max(tex_c.size)
        tex_c = tex_c.resize((int(tex_c.size[0] * s), int(tex_c.size[1] * s)), Image.LANCZOS)
    tex_c.save(OUT_IMG / "terrain-color.jpg", quality=87)

    # --- hills with sampled elevation ---
    hills_out = []
    for hid, disp, lon, lat, status, link in HILLS:
        u = (lon - LON_MIN) / (LON_MAX - LON_MIN)
        v = (LAT_MAX - lat) / (LAT_MAX - LAT_MIN)   # v=0 at north
        row = min(max(int(v * elev_c.shape[0]), 0), elev_c.shape[0] - 1)
        col = min(max(int(u * elev_c.shape[1]), 0), elev_c.shape[1] - 1)
        hills_out.append({
            "id": hid, "name": disp, "lon": lon, "lat": lat,
            "u": round(u, 6), "v": round(v, 6),
            "elev": round(float(elev_c[row, col]), 1),
            "status": status, "link": link,
        })

    feats = read_features()
    # World size in metres (approx, for camera/fog scaling in the viewer)
    lat_c = math.radians((LAT_MIN + LAT_MAX) / 2)
    size_x = (LON_MAX - LON_MIN) * 111320 * math.cos(lat_c)
    size_z = (LAT_MAX - LAT_MIN) * 110940
    meta = {
        "bbox": {"lonMin": LON_MIN, "lonMax": LON_MAX, "latMin": LAT_MIN, "latMax": LAT_MAX},
        "grid": GRID,
        "elevMin": round(hmin, 1),
        "elevMax": round(hmax, 1),
        "sizeX": round(size_x),
        "sizeZ": round(size_z),
        "heightmap": "images/terrain/terrain-height.bin",
        "texture": "images/terrain/terrain-color.jpg",
        "texSize": list(tex_c.size),
        "boundary": lonlat_to_uv(feats.get("boundary", [])),
        "road": merge_segments(clip_polyline_to_bbox(feats["road"])),
        "etosha": merge_segments(clip_polyline_to_bbox(feats["etosha"])),
        "ongava": merge_segments(clip_polyline_to_bbox(feats["ongava"])),
        "boreholes": lonlat_to_uv(feats["boreholes"], bbox_only=True),
        "hills": hills_out,
    }
    js = "window.SIELSOORD_TERRAIN = " + json.dumps(meta, indent=2) + ";\n"
    (ROOT / "js" / "terrain-data.js").write_text(js)

    print(f"\nDONE  elev {hmin:.0f}..{hmax:.0f} m")
    print(f"  boundary={len(meta['boundary'])} road={len(meta['road'])} "
          f"etosha={len(meta['etosha'])} ongava={len(meta['ongava'])} "
          f"boreholes={len(meta['boreholes'])}  (points per line)")
    for h in hills_out:
        print(f"  {h['name']:14s} {h['elev']:7.1f} m  ({h['status']})")


if __name__ == "__main__":
    main()
