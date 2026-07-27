import bpy, math, os, random
from mathutils import Vector

ROOT = '/Users/albievanbiljon/Desktop/sielsoord'
GLB = os.path.join(ROOT, 'images/models/bushveld-env.glb')
BLEND = os.path.join(ROOT, 'tools/bushveld-env.blend')
os.makedirs(os.path.dirname(GLB), exist_ok=True)
os.makedirs(os.path.dirname(BLEND), exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

random.seed(94821)

# ── Materials ──
def mat(name, color, metallic=0.0, roughness=0.85):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return m

GROUND = mat('Bushveld Ground', (0.37, 0.51, 0.28), roughness=0.98)
TRACK = mat('Worn Track', (0.42, 0.36, 0.22), roughness=1.0)
BARK = mat('Mopane Bark', (0.30, 0.22, 0.14), roughness=0.94)
LEAF_DARK = mat('Mopane Leaf Dark', (0.22, 0.38, 0.16), roughness=0.82)
LEAF_MID = mat('Mopane Leaf Mid', (0.32, 0.47, 0.20), roughness=0.84)
LEAF_LIGHT = mat('Mopane Leaf Light', (0.42, 0.52, 0.22), roughness=0.86)
GRASS_MAT = mat('Dry Grass', (0.38, 0.49, 0.18), roughness=0.92)
BUSH_MAT = mat('Scrub Bush', (0.28, 0.41, 0.19), roughness=0.94)
ROCK = mat('Koppie Rock', (0.44, 0.38, 0.30), roughness=0.90)

# ── Ground ──
bpy.ops.mesh.primitive_circle_add(vertices=128, radius=11, fill_type='NGON', location=(0,0,-0.01))
ground = bpy.context.object; ground.name = 'Ground'
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.subdivide(number_cuts=2)
bpy.ops.object.mode_set(mode='OBJECT')
# slight undulations
for v in ground.data.vertices:
    v.co.z += math.sin(v.co.x * 1.2) * math.cos(v.co.y * 0.9) * 0.08
    v.co.z += math.sin(v.co.x * 3.5 + 2.1) * math.cos(v.co.y * 3.2) * 0.04
ground.data.materials.append(GROUND)
for p in ground.data.polygons: p.use_smooth = True

# Tire tracks
for x in (-0.73, 0.73):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, 0.8, 0.006))
    track = bpy.context.object; track.name = f'Track_{x:.0f}'
    track.scale = (0.22, 5.5, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    track.data.materials.append(TRACK)
    for p in track.data.polygons: p.use_smooth = True

# ── Mopane tree builder ──
def mopane_tree(x, y, scale=1.0, tone=0):
    tree_group = []
    trunk_h = 1.8  # base height
    # sculpted trunk with taper: use a curve
    bpy.ops.curve.primitive_bezier_curve_add(location=(x, y, 0))
    trunk = bpy.context.object; trunk.name = f'Mopane_Trunk_{x:.0f}_{y:.0f}'
    trunk.data.dimensions = '3D'
    trunk.data.resolution_u = 8
    trunk.data.bevel_depth = 0.14 * scale
    trunk.data.bevel_resolution = 5
    # shape the trunk
    spline = trunk.data.splines[0]
    spline.bezier_points[0].co = (x, y, 0)
    spline.bezier_points[1].co = (x, y, trunk_h * scale)
    spline.bezier_points[0].radius = 1.0
    spline.bezier_points[1].radius = 0.55
    # add slight bend
    spline.bezier_points[0].handle_right_type = 'AUTO'
    spline.bezier_points[1].handle_left_type = 'AUTO'
    trunk.data.materials.append(BARK)
    tree_group.append(trunk)

    # fork into branches
    leaf_mats = [LEAF_DARK, LEAF_MID, LEAF_LIGHT]
    branch_tips = []
    for bi in range(4):
        az = 0.4 + bi * 1.6 + random.uniform(-0.25, 0.25)
        br_h = trunk_h * scale + 0.5 * scale
        br_r = scale * 1.8
        tip = (x + math.cos(az) * br_r, y + math.sin(az) * br_r, br_h + random.uniform(-0.3, 0.4) * scale)
        branch_tips.append(tip)

        bpy.ops.curve.primitive_bezier_curve_add(location=(x, y, trunk_h * scale * 0.85))
        br = bpy.context.object; br.name = f'Mopane_Branch_{x:.0f}_{y:.0f}_{bi}'
        br.data.dimensions = '3D'
        br.data.resolution_u = 6
        br.data.bevel_depth = 0.06 * scale
        br.data.bevel_resolution = 4
        sp = br.data.splines[0]
        sp.bezier_points[0].co = (x, y, trunk_h * scale * 0.8)
        sp.bezier_points[1].co = tip
        sp.bezier_points[0].radius = 1.0
        sp.bezier_points[1].radius = 0.2
        sp.bezier_points[0].handle_right_type = 'AUTO'
        sp.bezier_points[1].handle_left_type = 'AUTO'
        br.data.materials.append(BARK)
        tree_group.append(br)

    # leaf clusters at branch tips
    for ti, tip in enumerate(branch_tips):
        lm = leaf_mats[(tone + ti) % 3]
        for ci in range(3):
            # paired butterfly leaves
            for side in (-1, 1):
                bpy.ops.mesh.primitive_uv_sphere_add(
                    segments=12, ring_count=8, radius=0.38 * scale,
                    location=(tip[0] + side * 0.22 * scale + (ci-1)*0.28*scale,
                              tip[1] + side * 0.05 * scale,
                              tip[2] + ci * 0.14 * scale))
                leaf = bpy.context.object
                leaf.name = f'Mopane_Leaf_{x:.0f}_{y:.0f}_{ti}_{ci}_{side}'
                leaf.scale = (0.9, 0.22, 0.55)
                bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
                leaf.data.materials.append(lm)
                for p in leaf.data.polygons: p.use_smooth = True
                tree_group.append(leaf)

    return tree_group

# ── grass clump builder ──
def grass_clump(x, y):
    blades = []
    n = random.randint(5, 12)
    for _ in range(n):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x + random.uniform(-0.25, 0.25), y + random.uniform(-0.25, 0.25), 0.02))
        blade = bpy.context.object; blade.name = f'GrassBlade_{x:.0f}_{y:.0f}'
        blade.scale = (0.03, 0.24 + random.uniform(0, 0.18), 1)
        blade.rotation_euler = (random.uniform(-0.15, 0.15), random.uniform(0, 6.28), random.uniform(-0.2, 0.2))
        blade.location.z = 0.12
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        # subdivide once for slight bend
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.subdivide(number_cuts=1)
        bpy.ops.object.mode_set(mode='OBJECT')
        blade.data.materials.append(GRASS_MAT)
        blades.append(blade)
    return blades

# ── bush builder ──
def scrub_bush(x, y, s=1.0):
    parts = []
    for _ in range(random.randint(3, 6)):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.42 * s,
            location=(x + random.uniform(-0.25*s, 0.25*s),
                      y + random.uniform(-0.25*s, 0.25*s),
                      0.25 * s + random.uniform(-0.1*s, 0.15*s)))
        part = bpy.context.object; part.name = f'Bush_{x:.0f}_{y:.0f}'
        part.scale.z = 0.55 + random.uniform(0, 0.3)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        part.data.materials.append(BUSH_MAT)
        for p in part.data.polygons: p.use_smooth = True
        parts.append(part)
    return parts

# ── Scatter everything ──
# 5 mopane trees (positioned behind/around car area, z=0 is centre, car sits ~(0,0))
tree_positions = [(-5.2, 4.3), (4.9, 5.0), (-3.0, 7.2), (2.5, 7.8), (7.1, 7.5)]
for i, (tx, ty) in enumerate(tree_positions):
    mopane_tree(tx, ty, scale=0.9 + random.uniform(-0.15, 0.3), tone=i)

# grass clumps scattered around, avoiding tree trunks and car area
for _ in range(55):
    gx = random.uniform(-9, 9)
    gy = random.uniform(-2, 9)  # mostly behind and to sides of car
    # avoid car footprint (~2m radius at origin)
    if gx**2 + gy**2 < 3.5: continue
    # avoid tree bases
    too_close = False
    for (tx, ty) in tree_positions:
        if (gx-tx)**2 + (gy-ty)**2 < 1.8: too_close = True; break
    if too_close: continue
    grass_clump(gx, gy)

# 15 scrub bushes
for _ in range(15):
    bx = random.uniform(-8, 8)
    by = random.uniform(5, 9)
    scrub_bush(bx, by, s=0.7 + random.uniform(-0.2, 0.5))

# 6 small rocks
for _ in range(6):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.3 + random.uniform(0, 0.4),
        location=(random.uniform(-7, 7), random.uniform(-1, 8), 0.08))
    rock = bpy.context.object; rock.name = 'Rock'
    rock.scale.z = 0.4 + random.uniform(0, 0.3)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    rock.data.materials.append(ROCK)
    for p in rock.data.polygons: p.use_smooth = False

# ── Finalise + export ──
for ob in bpy.context.scene.objects:
    ob.select_set(True)
    if ob.type == 'MESH':
        for p in ob.data.polygons: p.use_smooth = True

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.export_scene.gltf(
    filepath=GLB, export_format='GLB', use_selection=False,
    export_apply=True, export_yup=True, export_materials='EXPORT',
    export_cameras=False, export_lights=False, export_extras=True,
)
print(f'EXPORTED {GLB}')
print(f'OBJECTS {len(bpy.context.scene.objects)}')
