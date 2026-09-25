"""Cinematic Mid-Autumn environment for the Moonlit gift world.

The scene is authored in Blender's Z-up coordinates.  The story axis is +Y;
the web exporter maps this to Three.js' -Z travel axis.  Geometry is deliberately
layered (bevelled stone, curved tiled roofs, silk lanterns and organic trees)
instead of a stack of primitives so the camera can fly continuously through it.
"""

from __future__ import annotations

import math
import random
import os
import runpy
from mathutils import Vector

import bpy


SEED = 240924
random.seed(SEED)


def mat(name, colour, roughness=0.55, metallic=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*colour, 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.32
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    return m




M = {
    "night": mat("Night_Stone", (0.045, 0.065, 0.10), 0.78),
    "stone": mat("Moon_Stone", (0.24, 0.27, 0.31), 0.78),
    "stone_light": mat("Moon_Stone_Edge", (0.40, 0.42, 0.43), 0.69),
    "ink": mat("Ink_Wood", (0.055, 0.09, 0.105), 0.72),
    "wood": mat("Warm_Wood", (0.22, 0.105, 0.045), 0.68),
    "wood_light": mat("Wood_Highlight", (0.48, 0.235, 0.09), 0.58),
    "tile": mat("Jade_Tile", (0.045, 0.17, 0.17), 0.52),
    "tile_edge": mat("Tile_Edge", (0.13, 0.34, 0.29), 0.42),
    "leaf": mat("Banyan_Leaf", (0.075, 0.20, 0.13), 0.72),
    "leaf_light": mat("Leaf_Highlight", (0.22, 0.42, 0.22), 0.66),
    "bark": mat("Banyan_Bark", (0.12, 0.065, 0.034), 0.96),
    "water": mat("Still_Water", (0.015, 0.075, 0.095), 0.16, 0.34),
    "silk_red": mat("Silk_Cinnabar", (0.46, 0.035, 0.045), 0.42),
    "silk_gold": mat("Silk_Gold", (0.72, 0.32, 0.055), 0.38, 0.12),
    "paper": mat("Warm_Paper", (0.76, 0.59, 0.35), 0.66),
    "glass": mat("Memory_Glass", (0.06, 0.25, 0.27), 0.21, 0.08),
    "lotus": mat("Lotus_Petal", (0.54, 0.18, 0.24), 0.5),
    "cream": mat("Lantern_Paper", (0.86, 0.45, 0.17), 0.62, emission=(1.0, 0.18, 0.015), strength=0.35),
    "gold": mat("Antique_Gold", (0.62, 0.31, 0.075), 0.3, 0.55),
    "fire": mat("Festival_Fire", (0.95, 0.17, 0.025), 0.38, emission=(1.0, 0.08, 0.005), strength=2.1),
    "fire_yellow": mat("Festival_Fire_Core", (1.0, 0.48, 0.04), 0.32, emission=(1.0, 0.20, 0.01), strength=2.5),
    "lion_red": mat("Lion_Dance_Red", (0.68, 0.035, 0.035), 0.42),
    "lion_gold": mat("Lion_Dance_Gold", (0.96, 0.42, 0.05), 0.34, 0.28),
    "lion_cream": mat("Lion_Dance_Cream", (0.92, 0.72, 0.38), 0.60),
    "lion_ink": mat("Lion_Dance_Ink", (0.012, 0.008, 0.012), 0.35),
}


def pod(name, y):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.empty_display_type = "PLAIN_AXES"
    o.empty_display_size = 0.4
    o.location.y = y
    o["worldPod"] = True
    return o


def attach(obj, parent):
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
    return obj


def apply_mat(obj, material):
    if material and obj.data and hasattr(obj.data, "materials"):
        obj.data.materials.append(material)
    return obj


def bevel(obj, amount=0.08, segments=3):
    if not obj or not obj.data or obj.type != "MESH":
        return obj
    mod = obj.modifiers.new("soft crafted edges", "BEVEL")
    mod.width = amount
    mod.segments = segments
    mod.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    try:
        bpy.ops.object.modifier_apply(modifier=mod.name)
    except RuntimeError:
        pass
    obj.select_set(False)
    return obj


def box(name, location, dimensions, material, parent, radius=0.08, rotation=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    o = bpy.context.object
    o.name = name
    o.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if rotation:
        o.rotation_euler = rotation
    apply_mat(o, material)
    bevel(o, min(radius, min(dimensions) * 0.35), 3)
    return attach(o, parent)


def cylinder(name, location, radius, depth, material, parent, vertices=16, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    o = bpy.context.object
    o.name = name
    if rotation:
        o.rotation_euler = rotation
    apply_mat(o, material)
    bevel(o, min(radius * 0.20, 0.13), 2)
    for p in o.data.polygons:
        p.use_smooth = True
    return attach(o, parent)


def sphere(name, location, scale, material, parent, segments=16, rings=8):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_mat(o, material)
    for p in o.data.polygons:
        p.use_smooth = True
    return attach(o, parent)


def curve(name, points, radius, material, parent, resolution=2):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.resolution_u = resolution
    cu.bevel_depth = radius
    cu.bevel_resolution = 3
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(points) - 1)
    for bp, point in zip(sp.bezier_points, points):
        bp.co = point
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    apply_mat(o, material)
    return attach(o, parent)


def roof_mesh(name, x, y, z, width, depth, rise, material, parent):
    """A thick, subtly warped tiled roof sheet with upturned Vietnamese eaves."""
    nx, ny = 12, 5
    verts = []
    for bottom in (False, True):
        for iy in range(ny + 1):
            py = y - depth * 0.5 + depth * iy / ny
            for ix in range(nx + 1):
                px = x - width * 0.5 + width * ix / nx
                edge = abs((px - x) / (width * 0.5))
                pz = z + rise * (1.0 - edge * edge) - abs(py - y) * 0.075 + (0.12 if edge > 0.86 else 0.0)
                verts.append((px, py, pz - (0.09 if bottom else 0.0)))
    faces = []
    row = (nx + 1) * (ny + 1)
    for layer in (0, 1):
        off = layer * row
        for iy in range(ny):
            for ix in range(nx):
                a = off + iy * (nx + 1) + ix
                b, c, d = a + 1, a + nx + 2, a + nx + 1
                faces.append((a, b, c, d) if layer == 0 else (d, c, b, a))
    for iy in range(ny):
        a = iy * (nx + 1); b = a + nx + 1
        c = row + b; d = row + a
        faces += [(a, d, c, b)]
    for ix in range(nx):
        a = ix; b = a + 1; c = row + b; d = row + a
        faces += [(a, b, c, d)]
        a = ny * (nx + 1) + ix; b = a + 1; c = row + b; d = row + a
        faces += [(a, d, c, b)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    apply_mat(o, material); bevel(o, 0.035, 2)
    return attach(o, parent)


def pagoda_roof(cx, cy, cz, width, parent, tiers=2):
    for i in range(tiers):
        w = width * (1.0 - i * 0.16)
        d = width * 0.62 * (1.0 - i * 0.16)
        z = cz + i * 0.95
        roof_mesh(f"roof tier {i}", cx, cy, z, w, d, 0.42, M["tile"], parent)
        # Handlaid cap ridges and small bronze upturned finials.
        cylinder(f"roof ridge {i}", (cx, cy, z + 0.34), 0.08, d * 0.66, M["tile_edge"], parent, 12, (math.pi / 2, 0, 0))
        for side in (-1, 1):
            curve(f"eave curl {i} {side}", [(cx + side * w * 0.49, cy - d * 0.47, z + 0.1), (cx + side * w * 0.56, cy - d * 0.39, z + 0.38), (cx + side * w * 0.46, cy - d * 0.25, z + 0.5)], 0.055, M["gold"], parent)


def stairs(cx, cy, z, width, count, parent, material=None):
    material = material or M["stone_light"]
    for i in range(count):
        box(f"stone stair {i}", (cx, cy + i * 0.34, z + i * 0.13), (width - i * 0.05, 0.52, 0.24), material, parent, 0.05)


def stone_path(parent, start=-30, end=112):
    # Slightly irregular moonstone slabs form a single readable camera corridor.
    for i, yy in enumerate(range(start, end + 1, 4)):
        x = math.sin(i * 1.7) * 0.28
        box(f"path slab {i}", (x, yy, 0.13), (4.2 + 0.3 * math.sin(i), 3.3, 0.22), M["stone_light"], parent, 0.13, (0, 0, math.sin(i * 1.2) * 0.035))


def moon_world(parent):
    source = runpy.run_path(os.path.join(os.path.dirname(__file__), "moon-surface.py"))
    source["build_moon"](parent)
    # Sparse floating rock fragments near the approach add depth without blocking it.
    for i in range(13):
        ang = i * 2.399
        rad = 10.0 + (i % 3) * 1.3
        sphere(f"moon dust {i}", (math.cos(ang) * rad * 0.75, -5.0 + math.sin(ang) * 4.0, 8.5 + math.sin(ang * 1.3) * 3.0), (0.18 + i % 3 * 0.08, 0.12, 0.18), M["stone"], parent, 8, 4)


def stone_gate(parent):
    y = 18.0
    for x in (-3.25, 3.25):
        cylinder(f"gate carved pillar {x}", (x, y, 2.4), 0.72, 4.8, M["stone"], parent, 16)
        for z in (1.2, 2.8, 4.0):
            cylinder(f"pillar collar {x} {z}", (x, y, z), 0.86, 0.16, M["stone_light"], parent, 16)
        # shallow carved vertical grooves
        for a in range(4):
            ang = a * math.pi / 2
            box(f"pillar relief {x} {a}", (x + math.cos(ang) * 0.69, y - 0.01 + math.sin(ang) * 0.69, 2.4), (0.07, 0.34, 2.7), M["stone_light"], parent, 0.025, (0, 0, ang))
    box("gate lintel", (0, y, 4.65), (8.2, 1.35, 0.72), M["stone"], parent, 0.14)
    box("gate lintel inset", (0, y - 0.71, 4.66), (5.1, 0.08, 0.38), M["gold"], parent, 0.035)
    pagoda_roof(0, y, 5.28, 8.7, parent, 1)
    stairs(0, y - 2.2, 0.2, 7.8, 5, parent)
    # A suspended moon coin in the gate gives the camera a clear visual target.
    cylinder("gate moon seal", (0, y - 0.82, 4.65), 0.86, 0.11, M["gold"], parent, 32, (math.pi / 2, 0, 0))
    cylinder("gate seal inset", (0, y - 0.9, 4.65), 0.64, 0.07, M["tile"], parent, 32, (math.pi / 2, 0, 0))


def pond_and_banyan(parent):
    # Garden pond on the left leaves the center path clear for Cuội and Hằng.
    box("garden pond", (-5.1, 34.0, 0.18), (5.0, 9.0, 0.18), M["water"], parent, 0.45)
    for i in range(7):
        a = i * 0.9
        sphere(f"pond lotus {i}", (-5.2 + math.cos(a) * 1.4, 31.0 + math.sin(a) * 2.1, 0.42), (0.38, 0.21, 0.08), M["lotus"], parent, 10, 5)
    # Broad-rooted banyan with hanging aerial roots and clustered foliage.
    trunk_x, trunk_y = 5.0, 35.5
    curve("banyan old trunk", [(trunk_x, trunk_y - 2, 0.2), (4.3, trunk_y - 0.5, 2.7), (5.2, trunk_y, 5.7), (4.5, trunk_y + 0.4, 8.0)], 0.88, M["bark"], parent)
    for i in range(8):
        a = -1.3 + i * 0.34
        rootx = trunk_x + math.cos(a) * 2.8
        rooty = trunk_y + math.sin(a) * 2.4
        curve(f"banyan root {i}", [(trunk_x, trunk_y, 0.42), (rootx * 0.86, rooty * 0.88, 0.24), (rootx, rooty, 0.12)], 0.25 + (i % 2) * 0.08, M["bark"], parent)
    branches = [((4.5, 35.7, 6.3), (1.1, 31.7, 9.0)), ((4.8, 36.0, 6.4), (7.0, 32.3, 9.7)), ((4.8, 36.1, 6.6), (8.3, 38.5, 9.0)), ((4.9, 35.9, 6.8), (3.2, 40.5, 9.4))]
    for i, (a, b) in enumerate(branches):
        curve(f"banyan branch {i}", [a, ((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, a[2] + 1.2), b], 0.28, M["bark"], parent)
        for j in range(7):
            t = j / 6
            p = Vector(a).lerp(Vector(b), t)
            sphere(f"banyan crown {i} {j}", (p.x, p.y, p.z + 0.55 * math.sin(j)), (1.15, 0.8, 0.72), M["leaf" if j % 2 else "leaf_light"], parent, 10, 5)


def lantern(parent, x, y, z, scale=1.0, colour=None):
    colour = colour or M["silk_red"]
    rig = bpy.data.objects.new(f"LANTERN_RIG_{x:.2f}_{y:.2f}", None)
    bpy.context.collection.objects.link(rig)
    rig.location = (x, y, z)
    # A silk rib lantern: tapered body, eight structural ribs, top/bottom collars and tassel.
    parts = []
    parts.append(cylinder(f"silk lantern body {x} {y}", (x, y, z), 0.48 * scale, 1.35 * scale, colour, parent, 20))
    for i in range(8):
        a = i * math.pi / 4
        parts.append(box(f"lantern rib {x} {y} {i}", (x + math.cos(a) * 0.44 * scale, y + math.sin(a) * 0.44 * scale, z), (0.045 * scale, 0.07 * scale, 1.15 * scale), M["silk_gold"], parent, 0.02, (0, math.sin(a) * 0.12, a)))
    for zz in (z - 0.72 * scale, z + 0.72 * scale):
        parts.append(cylinder(f"lantern collar {x} {y} {zz}", (x, y, zz), 0.57 * scale, 0.13 * scale, M["silk_gold"], parent, 16))
    parts.append(cylinder(f"lantern cap {x} {y}", (x, y, z + 0.92 * scale), 0.11 * scale, 0.45 * scale, M["gold"], parent, 12))
    parts.append(curve(f"lantern tassel {x} {y}", [(x, y, z - 0.78 * scale), (x, y, z - 1.3 * scale), (x + 0.04 * scale, y, z - 1.65 * scale)], 0.045 * scale, M["silk_gold"], parent))
    glow = sphere(f"lantern glow {x} {y}", (x, y, z), (0.23 * scale, 0.23 * scale, 0.36 * scale), M["cream"], parent, 12, 6)
    parts.append(glow)
    for part in parts:
        world = part.matrix_world.copy()
        part.parent = rig
        part.matrix_world = world
    world = rig.matrix_world.copy()
    rig.parent = parent
    rig.matrix_world = world
    action = bpy.data.actions.new(f"LANTERN_{x:.2f}_{y:.2f}_Sway")
    rig.animation_data_create(); rig.animation_data.action = action
    for frame, angle in ((1, -0.035), (36, 0.045), (72, -0.02), (108, -0.035)):
        rig.rotation_euler[1] = angle
        rig.keyframe_insert("rotation_euler", index=1, frame=frame)
    for curve_data in action.fcurves:
        curve_data.modifiers.new("CYCLES")
    # A separate authored glow action gives each lantern a small offset pulse;
    # MotionMixer may add a bounded runtime flicker without replacing it.
    flicker = bpy.data.actions.new(f"LANTERN_{x:.2f}_{y:.2f}_Flicker")
    glow.animation_data_create(); glow.animation_data.action = flicker
    for frame, factor in ((1, 0.94), (18, 1.08), (36, 0.98), (54, 1.12), (72, 0.94)):
        glow.scale = (factor, factor, factor)
        glow.keyframe_insert("scale", frame=frame)
    for curve_data in flicker.fcurves:
        curve_data.modifiers.new("CYCLES")


def festival_fire(parent, x=-5.0, y=57.0, z=0.6):
    """Low-poly brazier with authored flame and ember pulse actions."""
    rig = bpy.data.objects.new("FIRE_Festival_Rig", None)
    bpy.context.collection.objects.link(rig); rig.location = (x, y, z)
    for i in range(9):
        angle = i * math.tau / 9
        stone = sphere(f"fire hearth stone {i}", (x + math.cos(angle) * .72, y + math.sin(angle) * .72, z - .35), (.24, .20, .18), M["stone_light"], parent, 10, 5)
        bpy.context.view_layer.update()
        world = stone.matrix_world.copy(); stone.parent = rig; stone.matrix_world = world
    flames = []
    for i, (sx, sy, sz, material) in enumerate(((.0, 0, 1.0, "fire_yellow"), (-.22, .02, .76, "fire"), (.25, -.01, .68, "fire"))):
        flame = sphere(f"FIRE_Flame_{i}", (x + sx, y + sy, z + sz), (.23, .23, .58 if i == 0 else .42), M[material], parent, 12, 6)
        bpy.context.view_layer.update()
        world = flame.matrix_world.copy(); flame.parent = rig; flame.matrix_world = world; flames.append(flame)
        action = bpy.data.actions.new(f"FIRE_Flame_{i}_Flicker")
        flame.animation_data_create(); flame.animation_data.action = action
        for frame, factor in ((1, .88), (10, 1.14), (20, .95), (30, 1.18), (40, .88)):
            flame.scale = (factor, factor * (1.08 if i else 1), factor)
            flame.rotation_euler[1] = math.radians(7 if frame % 20 else -8)
            flame.keyframe_insert("scale", frame=frame); flame.keyframe_insert("rotation_euler", index=1, frame=frame)
        for curve_data in action.fcurves: curve_data.modifiers.new("CYCLES")
    for i in range(6):
        ember = sphere(f"FIRE_Ember_{i}", (x + (i - 2.5) * .12, y, z + 1.32 + i * .18), (.025, .025, .025), M["fire_yellow"], parent, 6, 3)
        bpy.context.view_layer.update()
        world = ember.matrix_world.copy(); ember.parent = rig; ember.matrix_world = world
    bpy.context.view_layer.update()
    world = rig.matrix_world.copy(); rig.parent = parent; rig.matrix_world = world
    return rig


def lion_dance(parent, x=3.5, y=61.5, z=1.0):
    """Compact original lân/sư silhouette with a readable bob-and-turn loop."""
    rig = bpy.data.objects.new("LAN_Dance_Rig", None)
    bpy.context.collection.objects.link(rig); rig.location = (x, y, z)
    body = sphere("LAN_Dance_Body", (x, y + .12, z + .25), (1.0, .66, .58), M["lion_red"], parent, 16, 8)
    head = sphere("LAN_Dance_Head", (x, y - .42, z + .55), (1.08, .58, .72), M["lion_red"], parent, 16, 8)
    muzzle = sphere("LAN_Dance_Muzzle", (x, y - .92, z + .38), (.58, .20, .34), M["lion_cream"], parent, 14, 7)
    for side in (-1, 1):
        ear = sphere(f"LAN_Dance_Ear_{side}", (x + side * .72, y - .4, z + .98), (.25, .18, .27), M["lion_gold"], parent, 12, 6)
        eye = sphere(f"LAN_Dance_Eye_{side}", (x + side * .38, y - .94, z + .71), (.11, .055, .11), M["lion_ink"], parent, 12, 6)
        brow = sphere(f"LAN_Dance_Brow_{side}", (x + side * .38, y - .90, z + .88), (.20, .08, .06), M["lion_gold"], parent, 10, 5)
        for obj in (ear, eye, brow):
            bpy.context.view_layer.update()
            world = obj.matrix_world.copy(); obj.parent = head; obj.matrix_world = world
    for obj in (body, muzzle):
        bpy.context.view_layer.update()
        world = obj.matrix_world.copy(); obj.parent = rig; obj.matrix_world = world
    bpy.context.view_layer.update()
    world = head.matrix_world.copy(); head.parent = rig; head.matrix_world = world
    action = bpy.data.actions.new("LAN_Dance")
    rig.animation_data_create(); rig.animation_data.action = action
    for frame, angle, lift in ((1, -.10, 0), (10, .12, .10), (20, -.12, 0), (30, .10, .10), (40, -.10, 0)):
        rig.rotation_euler.z = angle; rig.location.z = z + lift
        rig.keyframe_insert("rotation_euler", index=2, frame=frame); rig.keyframe_insert("location", index=2, frame=frame)
    for curve_data in action.fcurves: curve_data.modifiers.new("CYCLES")
    # A tiny drum gives the lân beat a distinct Vietnamese festival cue.
    drum = cylinder("LAN_Dance_Drum", (x - 1.05, y + .08, z + .42), .32, .22, M["lion_gold"], parent, 16, (math.pi / 2, 0, 0))
    bpy.context.view_layer.update()
    world = drum.matrix_world.copy(); drum.parent = rig; drum.matrix_world = world
    bpy.context.view_layer.update()
    world = rig.matrix_world.copy(); rig.parent = parent; rig.matrix_world = world
    return rig


def lantern_bridge(parent):
    y0 = 54.0
    # Long arched stone bridge with side rails; the central road remains unobstructed.
    for i in range(11):
        yy = 45.0 + i * 2.2
        zz = 0.45 + 0.75 * math.sin((i / 10) * math.pi)
        box(f"bridge deck {i}", (0, yy, zz), (4.6, 2.2, 0.35), M["stone_light"], parent, 0.1)
        for side in (-1, 1):
            box(f"bridge parapet {i} {side}", (side * 2.22, yy, zz + 0.72), (0.28, 2.0, 0.75), M["stone"], parent, 0.07)
    for side in (-1, 1):
        curve(f"bridge handrail {side}", [(side * 2.22, 45, 1.45), (side * 2.22, 54, 2.1), (side * 2.22, 67, 1.45)], 0.13, M["wood_light"], parent)
    for i in range(8):
        yy = 45.0 + i * 3.3
        lantern(parent, -3.4, yy, 4.35 + 0.25 * math.sin(i), 0.72, M["silk_red"] if i % 2 else M["silk_gold"])
        lantern(parent, 3.4, yy + 1.2, 4.1 + 0.2 * math.sin(i), 0.68, M["silk_gold"] if i % 2 else M["silk_red"])
    # The fire and lân stop lives on the bridge's final bend, before the
    # memory pavilion. Both are authored objects, not HTML overlays.
    festival_fire(parent, -1.8, 57.5, 1.08)
    lion_dance(parent, 1.65, 59.0, 1.78)


def pavilion(parent):
    y = 77.0
    # Four carved columns, an open centre and a wide, layered roof.
    for x in (-4.0, 4.0):
        for yy in (y - 3.0, y + 3.0):
            cylinder(f"pavilion column {x} {yy}", (x, yy, 3.4), 0.38, 6.8, M["wood"], parent, 16)
            cylinder(f"column base {x} {yy}", (x, yy, 0.25), 0.58, 0.3, M["gold"], parent, 16)
            cylinder(f"column capital {x} {yy}", (x, yy, 6.75), 0.6, 0.28, M["gold"], parent, 16)
    box("pavilion rear beam", (0, y + 3.0, 6.5), (8.2, 0.32, 0.42), M["wood_light"], parent, 0.07)
    pagoda_roof(0, y, 7.0, 11.0, parent, 2)
    # Three memory frames with inset glass and a warm placeholder mat.
    for i, x in enumerate((-2.65, 0, 2.65)):
        box(f"memory frame top {i}", (x, y + 2.65, 3.9), (2.15, 0.18, 0.18), M["gold"], parent, 0.035)
        box(f"memory frame bottom {i}", (x, y + 2.65, 1.45), (2.15, 0.18, 0.18), M["gold"], parent, 0.035)
        box(f"memory frame left {i}", (x - 1.03, y + 2.65, 2.68), (0.18, 0.18, 2.55), M["gold"], parent, 0.035)
        box(f"memory frame right {i}", (x + 1.03, y + 2.65, 2.68), (0.18, 0.18, 2.55), M["gold"], parent, 0.035)
        box(f"memory image placeholder {i}", (x, y + 2.53, 2.68), (1.82, 0.07, 2.22), M["glass"], parent, 0.03)
        curve(f"frame glint {i}", [(x - 0.67, y + 2.47, 3.38), (x - 0.15, y + 2.47, 3.6)], 0.035, M["paper"], parent)
    box("pavilion memory table", (0, y - 0.5, 1.05), (4.7, 2.2, 0.22), M["wood_light"], parent, 0.08)
    for x in (-1.9, 1.9):
        cylinder(f"table leg {x}", (x, y - 0.5, 0.5), 0.12, 1.0, M["wood"], parent, 10)


def lotus_stage(parent):
    y = 100.0
    # Broad circular terrace with petal-like sculpted fins around a letter pedestal.
    cylinder("letter terrace", (0, y, 0.35), 7.2, 0.7, M["stone"], parent, 48)
    cylinder("terrace inlay", (0, y, 0.73), 5.9, 0.06, M["gold"], parent, 48)
    for i in range(12):
        a = i * math.pi / 6
        x, yy = math.cos(a) * 5.4, y + math.sin(a) * 5.4
        sphere(f"lotus terrace petal {i}", (x, yy, 1.1), (1.85, 0.72, 0.28), M["lotus" if i % 2 else "silk_red"], parent, 16, 8).rotation_euler[2] = a
    cylinder("letter pedestal", (0, y, 1.25), 2.2, 1.15, M["wood_light"], parent, 32)
    cylinder("letter pedestal inlay", (0, y, 1.84), 1.65, 0.08, M["gold"], parent, 32)
    # Open lotus petals cradle the letter envelope and leave a clean focal point.
    for i in range(8):
        a = i * math.pi / 4
        petal = sphere(f"open lotus petal {i}", (math.cos(a) * 1.1, y + math.sin(a) * 1.1, 2.45), (0.9, 0.46, 0.12), M["lotus"], parent, 16, 8)
        petal.rotation_euler[2] = a
    envelope = box("letter envelope", (0, y - 0.05, 2.78), (1.65, 0.18, 1.15), M["paper"], parent, 0.07, (math.radians(-7), 0, 0))
    # The physical envelope rises from the lotus pedestal before the flap
    # opens. This is a real object action exported as LetterRise; the runtime
    # can blend it alongside LetterOpen for the automatic cinematic reveal.
    rise = bpy.data.actions.new("LetterRise")
    envelope.animation_data_create(); envelope.animation_data.action = rise
    base_z = envelope.location.z
    for frame, z in ((1, base_z - 0.82), (24, base_z), (108, base_z)):
        envelope.location.z = z
        envelope.keyframe_insert("location", index=2, frame=frame)
    for curve_data in rise.fcurves:
        for point in curve_data.keyframe_points: point.interpolation = "BEZIER"
    flap_source = runpy.run_path(os.path.join(os.path.dirname(__file__), "letter-flap.py"))
    flap_source["add_letter_flap"](parent, M["paper"], envelope)
    curve("letter seal", [(0, y - 0.18, 2.74), (0.0, y - 0.21, 2.9)], 0.12, M["silk_red"], parent)
    for i in range(8):
        a = i * math.pi / 4
        lantern(parent, math.cos(a) * 5.5, y + math.sin(a) * 5.5, 5.1 + (i % 2) * 0.5, 0.64, M["silk_red"] if i % 2 else M["silk_gold"])


def ground_and_stars(parent):
    # Low undulating terrain keeps every area connected and gives the camera a horizon.
    for i, yy in enumerate(range(-30, 116, 8)):
        x = math.sin(i * 0.71) * 0.35
        box(f"moonland ground {i}", (x, yy, -0.42), (17.0, 8.5, 0.65), M["night"], parent, 0.22)
    stone_path(parent)
    # Stars are small non-emissive metallic specks, not a giant plastic backdrop.
    for i in range(65):
        a = i * 2.399
        yy = -24 + (i * 19) % 135
        x = -15 + (i * 7.3) % 30
        z = 9 + (i * 5.1) % 16
        sphere(f"star {i}", (x, yy, z), (0.035 + (i % 3) * 0.02,) * 3, M["cream"], parent, 6, 3)


def build_environment():
    """Build and return the six pod empties.  Existing world objects are untouched."""
    pods = {
        "moon": pod("pod_moon_approach", -8.0),
        "gate": pod("pod_lunar_gate", 18.0),
        "garden": pod("pod_cuoi_hang", 34.0),
        "lantern": pod("pod_lantern_street", 54.0),
        "memories": pod("pod_memories", 77.0),
        "letter": pod("pod_letter_stage", 100.0),
    }
    root = bpy.data.objects.new("moonlit_environment_static", None)
    bpy.context.collection.objects.link(root)
    moon_world(pods["moon"])
    ground_and_stars(root)
    stone_gate(pods["gate"])
    pond_and_banyan(pods["garden"])
    lantern_bridge(pods["lantern"])
    pavilion(pods["memories"])
    lotus_stage(pods["letter"])
    # Parents sit beneath one static root for clean exporter hierarchy.
    for p in pods.values():
        p.parent = root
    return pods


if __name__ == "__main__":
    build_environment()

