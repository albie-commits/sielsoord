#!/usr/bin/env python3
"""Rebuild graphify-out/graph.json + graph.html for the current codebase.

Lightweight static scan: files, JS functions, script/css references,
page links. Reuses the existing graph.html viewer shell (vis-network).
Run:  python3 tools/build_graph.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "graphify-out"
TEMPLATE = OUT / "graph.html"

PALETTE = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
           "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"]

# subsystem -> (community label, source matcher)
SUBSYSTEMS = [
    ("3D Golden-Hour Hero",        lambda p: "hero-scene" in p),
    ("3D Terrain Map",             lambda p: "terrain" in p or "build_terrain" in p),
    ("Interactive Map Page",       lambda p: "kaart" in p or "map.js" in p),
    ("Contact & Form",             lambda p: "kontak" in p or "form.js" in p or "contact-card" in p),
    ("Mountain Detail Pages",      lambda p: p.startswith("berg/")),
    ("Mountain Catalogue",         lambda p: "koppies" in p),
    ("Story Page",                 lambda p: "storie" in p),
    ("Gallery System",             lambda p: "gallery" in p),
    ("i18n & Language",            lambda p: "i18n" in p or "translations" in p),
    ("Home Page",                  lambda p: p == "index.html" or "main.js" in p or "premium" in p or "birds.js" in p),
    ("Design System (CSS)",        lambda p: p.startswith("css/")),
    ("Documentation",              lambda p: p.endswith(".md")),
    ("Farm Data (KML)",            lambda p: p.startswith("data/")),
    ("Terrain Assets",             lambda p: "images/terrain" in p),
    ("Bird Photography",           lambda p: "images/birds" in p or "gallery/birds" in p),
    ("Homestead Photos",           lambda p: "gallery/homestead" in p),
    ("Nature Photography",         lambda p: "gallery/nature" in p or p.startswith("images/sielsrus")),
    ("Brand Assets",               lambda p: "images/icons" in p or "hero-" in p),
    ("Server & Middleware",        lambda p: "server" in p or "middleware" in p),
    ("Build Tools",                lambda p: p.startswith("tools/")),
]

SKIP_DIRS = {".git", ".tile-cache", "graphify-out", "__pycache__", ".claude"}
CODE_EXT = {".html", ".js", ".css", ".py", ".md", ".kml"}


def scan_files():
    files = []
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT).as_posix()
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix.lower() in CODE_EXT or p.suffix.lower() in {".jpg", ".jpeg", ".png", ".svg", ".bin"}:
            files.append(rel)
    return files


def community_of(rel):
    for i, (_, match) in enumerate(SUBSYSTEMS):
        if match(rel):
            return i
    return len(SUBSYSTEMS) - 1  # Build Tools fallback


def nid(rel):
    return re.sub(r"[^a-zA-Z0-9]+", "_", rel).strip("_")


def main():
    files = scan_files()
    nodes, edges, seen_edges = [], [], set()

    def add_edge(frm, to, label, conf="EXTRACTED"):
        key = (frm, to, label)
        if key not in seen_edges:
            seen_edges.add(key)
            edges.append({"from": frm, "to": to, "label": label, "confidence": conf})

    # group images into folder nodes to keep the graph readable
    file_nodes = []
    img_groups = {}
    for rel in files:
        if rel.startswith("images/"):
            folder = str(Path(rel).parent)
            img_groups.setdefault(folder, []).append(rel)
        else:
            file_nodes.append(rel)

    for rel in file_nodes:
        cid = community_of(rel)
        nodes.append({"id": nid(rel), "label": Path(rel).name, "community": cid,
                      "community_name": SUBSYSTEMS[cid][0], "source_file": rel,
                      "file_type": "code" if Path(rel).suffix in {".html", ".js", ".css", ".py"} else "data",
                      "degree": 0})

    for folder, imgs in sorted(img_groups.items()):
        cid = community_of(folder + "/")
        nodes.append({"id": nid(folder), "label": f"{Path(folder).name}/ ({len(imgs)} imgs)",
                      "community": cid, "community_name": SUBSYSTEMS[cid][0],
                      "source_file": folder, "file_type": "assets", "degree": 0,
                      "count": len(imgs)})

    # JS functions + contains edges
    for rel in file_nodes:
        if not rel.endswith(".js"):
            continue
        src = (ROOT / rel).read_text(errors="ignore")
        for m in re.finditer(r"(?:function\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\()", src):
            fname = m.group(1) or m.group(2)
            fid = f"{nid(rel)}_{fname}"
            cid = community_of(rel)
            nodes.append({"id": fid, "label": f"{fname}()", "community": cid,
                          "community_name": SUBSYSTEMS[cid][0], "source_file": rel,
                          "file_type": "function", "degree": 0})
            add_edge(nid(rel), fid, "contains")

    # HTML references (script src, link href) + page links
    for rel in file_nodes:
        if not rel.endswith(".html"):
            continue
        src = (ROOT / rel).read_text(errors="ignore")
        base = Path(rel).parent
        for m in re.finditer(r"(?:src|href)=\"([^\"#?]+?)(?:\?[^\"]*)?\"", src):
            ref = m.group(1)
            if ref.startswith(("http", "data:", "mailto:", "tel:")):
                continue
            target = (base / ref).as_posix() if not ref.startswith("/") else ref.lstrip("/")
            target = str(Path(target).as_posix())
            for cand in file_nodes + list(img_groups):
                if cand == target or cand.rstrip("/") == target.rstrip("/"):
                    add_edge(nid(rel), nid(cand), "references")
                    break

    # degrees
    deg = {}
    for e in edges:
        deg[e["from"]] = deg.get(e["from"], 0) + 1
        deg[e["to"]] = deg.get(e["to"], 0) + 1
    for n in nodes:
        n["degree"] = deg.get(n["id"], 0)

    # community summary
    comms = {}
    for n in nodes:
        c = comms.setdefault(n["community"], {"cid": n["community"], "label": n["community_name"], "count": 0})
        c["count"] += 1
    legend = sorted(comms.values(), key=lambda c: -c["count"])
    for i, c in enumerate(legend):
        c["color"] = PALETTE[i % len(PALETTE)]
    color_of = {c["cid"]: c["color"] for c in legend}

    graph = {"directed": True, "nodes": nodes, "edges": edges, "communities": legend}
    (OUT / "graph.json").write_text(json.dumps(graph, indent=1))

    # rebuild graph.html from the existing viewer shell
    raw_nodes = [{
        "id": n["id"], "label": n["label"],
        "color": {"background": color_of[n["community"]], "border": color_of[n["community"]],
                  "highlight": {"background": "#ffffff", "border": color_of[n["community"]]}},
        "size": 10 + min(n["degree"] * 1.4, 12),
        "font": {"size": 12 if n["degree"] > 1 else 0, "color": "#ffffff"},
        "title": f'{n["label"]}  ·  {n["source_file"]}',
        "community": n["community"], "community_name": n["community_name"],
        "source_file": n["source_file"], "file_type": n["file_type"], "degree": n["degree"],
    } for n in nodes]
    raw_edges = [{
        "from": e["from"], "to": e["to"], "label": e["label"],
        "title": f'{e["label"]} [{e["confidence"]}]',
        "dashes": e["confidence"] != "EXTRACTED",
        "width": 2 if e["confidence"] == "EXTRACTED" else 1,
        "color": {"opacity": 0.7 if e["confidence"] == "EXTRACTED" else 0.35},
        "confidence": e["confidence"],
    } for e in edges]

    tpl = TEMPLATE.read_text()
    head = tpl.split("const RAW_NODES =", 1)[0]
    tail = tpl.split("const LEGEND =", 1)[1].split("\n", 1)[1]
    html = (head
            + "const RAW_NODES = " + json.dumps(raw_nodes) + ";\n"
            + "const RAW_EDGES = " + json.dumps(raw_edges) + ";\n"
            + "const LEGEND = " + json.dumps(legend) + ";\n"
            + tail)
    TEMPLATE.write_text(html)

    print(f"graph rebuilt: {len(nodes)} nodes, {len(edges)} edges, {len(legend)} communities")
    for c in legend[:8]:
        print(f"  {c['label']:32s} {c['count']}")


if __name__ == "__main__":
    main()
