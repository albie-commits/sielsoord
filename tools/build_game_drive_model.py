import bpy, math, os
from mathutils import Vector

ROOT = '/Users/albievanbiljon/Desktop/sielsoord'
GLB = os.path.join(ROOT, 'images/models/game-drive-realistic.glb')
BLEND = os.path.join(ROOT, 'tools/game-drive-realistic.blend')
os.makedirs(os.path.dirname(GLB), exist_ok=True)
os.makedirs(os.path.dirname(BLEND), exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# ---------- materials ----------
def mat(name, color, metallic=0.0, roughness=0.5, alpha=1.0, transmission=0.0, clearcoat=0.0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, alpha)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Alpha'].default_value = alpha
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = clearcoat
        bsdf.inputs['Coat Roughness'].default_value = 0.10
    if alpha < 1:
        m.surface_render_method = 'DITHERED'
    return m

PAINT = mat('Safari Sand Metallic', (0.48, 0.39, 0.22), 0.32, 0.27, clearcoat=1.0)
PAINT_DARK = mat('Lower Body Shadow', (0.20, 0.17, 0.11), 0.20, 0.55, clearcoat=0.35)
RUBBER = mat('Tyre Rubber', (0.018, 0.015, 0.012), 0.02, 0.92)
BLACK = mat('Black Trim', (0.025, 0.024, 0.022), 0.12, 0.62)
STEEL = mat('Powder Coated Steel', (0.075, 0.08, 0.082), 0.72, 0.29)
CHROME = mat('Brushed Alloy', (0.46, 0.49, 0.50), 0.90, 0.20)
RIM = mat('Wheel Alloy', (0.30, 0.31, 0.30), 0.82, 0.24)
LEATHER = mat('Saddle Leather', (0.20, 0.095, 0.035), 0.02, 0.72)
CANVAS = mat('Khaki Canvas', (0.18, 0.145, 0.085), 0.0, 0.88)
GLASS = mat('Smoked Glass', (0.20, 0.38, 0.47), 0.05, 0.12, alpha=0.34, transmission=0.25, clearcoat=0.8)
LENS = mat('Headlight Glass', (0.92, 0.86, 0.65), 0.05, 0.14, clearcoat=0.7)
AMBER = mat('Amber Indicator', (0.95, 0.25, 0.025), 0.02, 0.20, clearcoat=0.8)
RED = mat('Tail Light Red', (0.62, 0.015, 0.012), 0.03, 0.20, clearcoat=0.8)
WHITE = mat('Plate', (0.72, 0.70, 0.62), 0.05, 0.55)

# ---------- helpers ----------
def finish(obj, material=None, bevel=0.0, smooth=True):
    if material:
        obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new('Precision edge rolls', 'BEVEL')
        mod.width = bevel
        mod.segments = 4
        mod.limit_method = 'ANGLE'
    if smooth and hasattr(obj.data, 'polygons'):
        for p in obj.data.polygons:
            p.use_smooth = True
        if hasattr(obj.data, 'set_sharp_from_angle'):
            obj.data.set_sharp_from_angle(angle=math.radians(48))
    return obj

def box(name, loc, scale, material, bevel=0.04, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = (scale[0]/2, scale[1]/2, scale[2]/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(o, material, bevel, smooth=True)

def cyl(name, loc, radius, depth, material, rot=(0,0,0), verts=32, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    o=bpy.context.object; o.name=name
    return finish(o, material, bevel, smooth=True)

def torus(name, loc, major, minor, material, rot=(0,0,0), major_seg=40, minor_seg=16):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
        major_segments=major_seg, minor_segments=minor_seg, location=loc, rotation=rot)
    o=bpy.context.object; o.name=name
    return finish(o, material, 0, smooth=True)

def curve_tube(name, points, radius, material, cyclic=False):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.resolution_u=3
    cu.bevel_depth=radius; cu.bevel_resolution=4; cu.resolution_u=8
    sp=cu.splines.new('BEZIER'); sp.bezier_points.add(len(points)-1)
    for bp,co in zip(sp.bezier_points,points):
        bp.co=co; bp.handle_left_type='AUTO'; bp.handle_right_type='AUTO'
    sp.use_cyclic_u=cyclic
    o=bpy.data.objects.new(name,cu); bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    return o

def loft(name, stations, material):
    # stations: (y, width, bottom_z, top_z, shoulder)
    verts=[]
    for y,w,zb,zt,sh in stations:
        contour=[(-w*0.78,zb),(-w,zb+sh),(-w,zt-sh),(-w*0.78,zt),
                 (w*0.78,zt),(w,zt-sh),(w,zb+sh),(w*0.78,zb)]
        verts += [(x,y,z) for x,z in contour]
    faces=[]; n=8
    faces.append(tuple(range(n-1,-1,-1)))
    faces.append(tuple(range((len(stations)-1)*n,len(stations)*n)))
    for s in range(len(stations)-1):
        for i in range(n):
            a=s*n+i; b=s*n+(i+1)%n; c=(s+1)*n+(i+1)%n; d=(s+1)*n+i
            faces.append((a,b,c,d))
    me=bpy.data.meshes.new(name+'Mesh'); me.from_pydata(verts,[],faces); me.update()
    o=bpy.data.objects.new(name,me); bpy.context.collection.objects.link(o)
    return finish(o,material,0.055,True)

# ---------- curved body shell ----------
loft('Sculpted lower body', [
    (-2.48,0.72,0.39,0.82,0.15),(-2.20,0.88,0.34,0.98,0.18),
    (-1.55,0.98,0.32,1.08,0.20),(-0.45,1.00,0.31,1.14,0.19),
    (0.75,0.99,0.31,1.18,0.18),(1.75,0.98,0.33,1.14,0.18),
    (2.34,0.86,0.39,0.98,0.15)], PAINT)

loft('Curved bonnet', [
    (-2.42,0.69,0.89,1.08,0.07),(-2.05,0.82,0.92,1.25,0.10),
    (-1.25,0.84,0.96,1.34,0.11),(-0.68,0.80,1.00,1.37,0.10)], PAINT)
box('Rear load floor',(0,0.92,1.02),(1.78,2.80,0.14),PAINT,0.07)
box('Front grille',(0,-2.48,0.91),(1.42,0.09,0.38),BLACK,0.035)
for x in (-0.52,0,0.52): box('Grille slot',(x,-2.535,0.91),(0.07,0.025,0.30),CHROME,0.012)
box('Front bumper',(0,-2.57,0.53),(1.93,0.22,0.20),STEEL,0.07)
box('Rear bumper',(0,2.42,0.50),(1.72,0.18,0.16),STEEL,0.05)

# Sculpted side character lines and wheel arch piping
for side in (-1,1):
    x=side*0.99
    curve_tube(f'Body shoulder {side}',[(x,-1.25,1.15),(x,-0.3,1.21),(x,1.15,1.22),(x,2.0,1.12)],0.022,PAINT)
    for wy in (-1.55,1.55):
        pts=[]
        for i in range(17):
            a=math.pi*(i/16)
            pts.append((side*1.015, wy-0.52*math.cos(a), 0.46+0.52*math.sin(a)))
        curve_tube(f'Wheel arch {side} {wy}',pts,0.045,PAINT)

# ---------- cabin and safari seating ----------
# Windshield is a slim smooth panel with strong rake
box('Windshield glass',(0,-0.60,1.76),(1.66,0.045,0.82),GLASS,0.025,rot=(math.radians(12),0,0))
for x in (-0.86,0.86):
    box('Windscreen pillar',(x,-0.59,1.77),(0.065,0.09,0.94),BLACK,0.025,rot=(math.radians(12),0,0))
box('Windscreen top',(0,-0.50,2.17),(1.78,0.09,0.075),BLACK,0.025)
box('Dashboard',(0,-0.68,1.33),(1.66,0.52,0.18),BLACK,0.07)

# doors have curved upper rail rather than full block cabin
for side in (-1,1):
    box(f'Front half-door {side}',(side*0.97,-0.08,1.28),(0.08,0.98,0.58),PAINT,0.035)
    box(f'Door handle {side}',(side*1.02,0.12,1.44),(0.035,0.23,0.045),CHROME,0.012)
    box(f'Side step {side}',(side*1.08,-0.15,0.39),(0.22,1.72,0.075),STEEL,0.03)

# realistic bucket seats with rounded cushions/backrests
def seat(name,x,y,z,scale=1):
    box(name+' cushion',(x,y,z),(0.66*scale,0.66*scale,0.17*scale),LEATHER,0.12)
    box(name+' back',(x,y+0.27*scale,z+0.42*scale),(0.66*scale,0.18*scale,0.70*scale),LEATHER,0.12,rot=(math.radians(-7),0,0))
    box(name+' headrest',(x,y+0.33*scale,z+0.82*scale),(0.34*scale,0.16*scale,0.22*scale),LEATHER,0.09)

seat('Driver',0.43,-0.10,1.24,0.92); seat('Passenger',-0.43,-0.10,1.24,0.92)
for row,(y,z) in enumerate(((0.75,1.40),(1.68,1.60))):
    seat(f'Row{row}L',-0.43,y,z,0.92); seat(f'Row{row}R',0.43,y,z,0.92)
    curve_tube(f'Grab rail {row}',[(-0.82,y-0.23,z+0.57),(-0.82,y-0.23,z+0.86),(0.82,y-0.23,z+0.86),(0.82,y-0.23,z+0.57)],0.027,STEEL)

# RHD wheel, centre console, gear lever
torus('Steering wheel',(0.42,-0.55,1.58),0.18,0.026,BLACK,rot=(math.radians(67),0,0),major_seg=36,minor_seg=12)
curve_tube('Steering spoke',[(-0.0,-0.0,0.0),(0.0,0.0,0.18)],0.02,BLACK) # hidden local accent
box('Centre console',(0,-0.03,1.25),(0.25,0.72,0.18),BLACK,0.06)
curve_tube('Gear lever',[(0,-0.20,1.32),(0.04,-0.30,1.53)],0.025,STEEL)
cyl('Gear knob',(0.04,-0.30,1.55),0.055,0.10,BLACK)

# canopy and rounded frame
box('Canvas canopy',(0,0.78,2.64),(2.02,3.42,0.085),CANVAS,0.055)
for side in (-1,1):
    for y in (-0.58,0.78,2.18):
        curve_tube(f'Canopy upright {side} {y}',[(side*0.92,y,1.25),(side*0.94,y,2.62)],0.026,STEEL)
    curve_tube(f'Canopy roof rail {side}',[(side*0.94,-0.62,2.61),(side*0.94,2.25,2.61)],0.026,STEEL)

# ---------- wheels: truly round tyres and alloys ----------
def wheel(name,x,y):
    torus(name+' tyre',(x,y,0.48),0.335,0.145,RUBBER,rot=(0,math.radians(90),0),major_seg=48,minor_seg=18)
    cyl(name+' rim',(x,y,0.48),0.235,0.36,RIM,rot=(0,math.radians(90),0),verts=36,bevel=0.018)
    cyl(name+' hub',(x + (0.19 if x>0 else -0.19),y,0.48),0.075,0.045,CHROME,rot=(0,math.radians(90),0),verts=24,bevel=0.008)
    # sidewall rings and tread blocks
    for side in (-1,1):
        torus(name+f' sidewall {side}',(x+side*0.165,y,0.48),0.335,0.014,RUBBER,rot=(0,math.radians(90),0),major_seg=48,minor_seg=8)
    for i in range(24):
        a=2*math.pi*i/24
        yy=y+0.475*math.cos(a); zz=0.48+0.475*math.sin(a)
        box(name+f' tread {i}',(x,yy,zz),(0.37,0.105,0.15),RUBBER,0.018,rot=(a,0,0))

for x in (-0.98,0.98):
    wheel(f'Front wheel {x}',x,-1.58)
    wheel(f'Rear wheel {x}',x,1.58)
# spare wheel upright on tailgate
torus('Spare tyre',(0,2.48,1.38),0.335,0.145,RUBBER,rot=(math.radians(90),0,0),major_seg=48,minor_seg=18)
cyl('Spare rim',(0,2.49,1.38),0.23,0.32,RIM,rot=(math.radians(90),0,0),verts=36,bevel=0.018)

# lights and bullbar
for x in (-0.58,0.58):
    cyl(f'Headlight bezel {x}',(x,-2.55,1.03),0.145,0.07,CHROME,rot=(math.radians(90),0,0),verts=36,bevel=0.01)
    cyl(f'Headlight lens {x}',(x,-2.60,1.03),0.115,0.025,LENS,rot=(math.radians(90),0,0),verts=36)
    box(f'Indicator {x}',(x*1.37,-2.59,0.91),(0.18,0.045,0.10),AMBER,0.03)
for x in (-0.73,0.73): box(f'Tail light {x}',(x,2.43,0.88),(0.20,0.04,0.30),RED,0.045)

curve_tube('Bullbar lower',[(-0.86,-2.68,0.48),(0.86,-2.68,0.48)],0.055,STEEL)
curve_tube('Bullbar upper',[(-0.66,-2.68,0.64),(-0.66,-2.68,1.28),(0.66,-2.68,1.28),(0.66,-2.68,0.64)],0.052,STEEL)
for x in (-0.30,0.30):
    cyl(f'Spotlight shell {x}',(x,-2.72,1.34),0.12,0.14,BLACK,rot=(math.radians(90),0,0),verts=32)
    cyl(f'Spotlight lens {x}',(x,-2.80,1.34),0.098,0.025,LENS,rot=(math.radians(90),0,0),verts=32)

# snorkel, mirrors, antenna, exhaust, number plates
curve_tube('Snorkel',[(0.96,-1.25,1.02),(1.04,-1.20,1.75),(1.04,-1.15,2.10)],0.055,BLACK)
box('Snorkel head',(1.04,-1.12,2.12),(0.14,0.22,0.12),BLACK,0.045)
for side in (-1,1):
    curve_tube(f'Mirror arm {side}',[(side*0.87,-0.62,1.65),(side*1.10,-0.72,1.72)],0.018,BLACK)
    box(f'Mirror {side}',(side*1.12,-0.73,1.72),(0.08,0.20,0.17),BLACK,0.055)
    box(f'Mirror glass {side}',(side*1.165,-0.73,1.72),(0.012,0.155,0.125),CHROME,0.025)
curve_tube('Antenna',[(-0.79,-1.95,1.16),(-0.83,-1.97,2.10)],0.009,STEEL)
curve_tube('Exhaust',[(0.67,1.45,0.31),(0.70,2.46,0.31)],0.036,STEEL)
box('Front plate',(0,-2.69,0.56),(0.42,0.025,0.13),WHITE,0.018)
box('Rear plate',(0,2.53,0.70),(0.42,0.025,0.13),WHITE,0.018)

# Add subtle panel seam lines with curves
for side in (-1,1):
    curve_tube(f'Door seam {side}',[(side*1.012,-0.56,1.05),(side*1.012,-0.56,1.50)],0.009,BLACK)
    curve_tube(f'Rear seam {side}',[(side*1.005,0.48,1.02),(side*1.005,0.48,1.42)],0.009,BLACK)

# Clean/export setup
for o in bpy.context.scene.objects:
    o.select_set(True)
    if o.type == 'MESH':
        for p in o.data.polygons: p.use_smooth = True

# Set useful custom metadata
bpy.context.scene['asset_name'] = 'Sielsoord Realistic Safari Game Drive Vehicle'
bpy.context.scene['license'] = 'Original asset authored for Sielsoord'
bpy.context.scene['coordinate_system'] = 'Blender Z-up; glTF Y-up'

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
bpy.ops.export_scene.gltf(
    filepath=GLB,
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
    export_extras=True,
)
print(f'EXPORTED {GLB}')
print(f'SOURCE {BLEND}')
print(f'OBJECTS {len(bpy.context.scene.objects)}')
