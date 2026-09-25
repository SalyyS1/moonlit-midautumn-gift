"""Headless Blender build for the hand-authored Moonlit Mid-Autumn world.

Usage:
  blender -b --python art/blender/build-environment.py

The script intentionally exports one GLB with named chapter pods.  The web
runtime can therefore load the same asset in one request while camera travel
remains continuous through +Y (Blender) / -Z (Three.js).
"""

from __future__ import annotations

import math
import os
import runpy
import sys
import subprocess

import bpy
from mathutils import Vector


HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
PUBLIC_MODELS = os.path.join(REPO, "public", "assets", "models")
WORK = os.path.join(REPO, "work")
os.makedirs(PUBLIC_MODELS, exist_ok=True)
os.makedirs(WORK, exist_ok=True)


def look_at(camera, target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.collections,):
        for c in list(collection):
            if c.users == 0:
                bpy.data.collections.remove(c)


def setup_world():
    world = bpy.data.worlds.get("Moonlit night") or bpy.data.worlds.new("Moonlit night")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.008, 0.018, 0.055, 1)
    bg.inputs["Strength"].default_value = 0.42

    scene = bpy.context.scene
    scene.render.fps = 30
    scene.frame_start = 1
    scene.frame_end = 108
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.filepath = os.path.join(WORK, "moonlit-hero.png")

    # Large, soft moon key plus a cool fill create real depth on the stone and silk.
    bpy.ops.object.light_add(type="AREA", location=(-8, -15, 18))
    key = bpy.context.object; key.name = "Moon key"; key.data.energy = 4600; key.data.shape = "DISK"; key.data.size = 8.0
    key.data.color = (0.53, 0.66, 1.0); look_at(key, (0, 18, 3))
    bpy.ops.object.light_add(type="AREA", location=(0, -24, 14))
    moon_fill = bpy.context.object; moon_fill.name = "Moon face fill"; moon_fill.data.energy = 3600; moon_fill.data.shape = "DISK"; moon_fill.data.size = 10
    moon_fill.data.color = (0.48, 0.56, 1.0); look_at(moon_fill, (0, -8, 12))
    bpy.ops.object.light_add(type="AREA", location=(8, 45, 10))
    fill = bpy.context.object; fill.name = "Lantern fill"; fill.data.energy = 1800; fill.data.size = 12.0
    fill.data.color = (1.0, 0.19, 0.07); look_at(fill, (0, 54, 2))
    bpy.ops.object.light_add(type="POINT", location=(0, 100, 6))
    rim = bpy.context.object; rim.name = "Letter terrace rim"; rim.data.energy = 1500; rim.data.color = (1.0, 0.22, 0.08)
    bpy.ops.object.light_add(type="AREA", location=(0, 65, 10))
    memory_fill = bpy.context.object; memory_fill.name = "Memory pavilion fill"; memory_fill.data.energy = 2600; memory_fill.data.shape = "DISK"; memory_fill.data.size = 7
    memory_fill.data.color = (0.32, 0.48, 1.0); look_at(memory_fill, (0, 77, 3))
    bpy.ops.object.light_add(type="AREA", location=(0, 89, 8))
    terrace_fill = bpy.context.object; terrace_fill.name = "Letter terrace fill"; terrace_fill.data.energy = 2300; terrace_fill.data.shape = "DISK"; terrace_fill.data.size = 8
    terrace_fill.data.color = (1.0, 0.30, 0.12); look_at(terrace_fill, (0, 100, 2))

    bpy.ops.object.light_add(type="AREA", location=(-2, 27, 6))
    garden_fill = bpy.context.object; garden_fill.name = "Garden face fill"
    garden_fill.data.energy = 900; garden_fill.data.size = 6
    garden_fill.data.color = (0.72, 0.80, 1.0); look_at(garden_fill, (0, 34, 1.4))

    # A camera preview through the gate is useful as a deterministic art check.
    bpy.ops.object.camera_add(location=(0, -27, 6.2))
    cam = bpy.context.object; cam.name = "Preview Camera"; cam.data.lens = 46; cam.data.sensor_width = 36
    look_at(cam, (0, -7, 10.2)); scene.camera = cam


def load_optional_characters():
    """Run a local character builder when present; it owns only hero objects."""
    path = os.path.join(HERE, "characters.py")
    if not os.path.isfile(path):
        return None
    try:
        ns = runpy.run_path(path, run_name="moonlit_character_source")
        fn = ns.get("build_characters")
        if not callable(fn):
            raise RuntimeError("characters.py does not expose build_characters")
        collection = bpy.data.collections.new("hero_characters")
        bpy.context.scene.collection.children.link(collection)
        # Build in garden-local coordinates; the pod supplies the +Y chapter
        # offset.  This prevents the character rig from being translated twice.
        result = fn(collection, origin=(0.0, 0.0, 0.0))
        # Keep the hero in the garden pod so SceneRegistry sees it as part of
        # the same chapter while the rigs remain independently animatable.
        garden = bpy.data.objects.get("pod_cuoi_hang")
        if garden:
            for name in result.get("roots", []):
                obj = bpy.data.objects.get(name)
                if obj:
                    obj.parent = garden
                    obj.matrix_parent_inverse.identity()
        print(f"[build] characters={result}")
        return path
    except Exception as exc:
        print(f"[build] character source failed ({path}): {exc}")
        raise


def export_world():
    out = os.path.join(PUBLIC_MODELS, "moonlit-world.glb")
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "moonlit-world.blend"))
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        export_apply=False,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_skins=True,
        export_anim_single_armature=False,
        export_frame_range=True,
        export_force_sampling=True,
    )
    subprocess.run(["node", os.path.join(REPO, "scripts", "write-world-manifest.mjs")], cwd=REPO, check=True)
    print(f"[build] exported {out} ({os.path.getsize(out)} bytes)")
    return out


def main():
    reset_scene()
    setup_world()
    # Import this module from the same directory without requiring PYTHONPATH.
    sys.path.insert(0, HERE)
    import environment
    pods = environment.build_environment()
    character_source = load_optional_characters()
    out = export_world()
    # Save a preview after the GLB export so its framing is captured in CI logs.
    if "--skip-renders" not in sys.argv:
        runpy.run_path(os.path.join(HERE, "render-vertical-slice.py"), run_name="moonlit_review_render")
    print(f"[build] pods={','.join(sorted(pods))} characters={character_source or 'none'}")
    print(f"[build] preview={bpy.context.scene.render.filepath}")


if __name__ == "__main__":
    main()
