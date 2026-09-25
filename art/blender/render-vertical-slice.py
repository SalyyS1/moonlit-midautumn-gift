"""Render review views and seven no-text posters from the saved Blender world.

Run: blender -b art/blender/moonlit-world.blend --python art/blender/render-vertical-slice.py
"""

import os
import subprocess
import sys
import bpy
from mathutils import Vector

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
WORK = os.path.join(REPO, "work", "vertical-slice")
POSTERS = os.path.join(REPO, "public", "assets", "posters")
os.makedirs(WORK, exist_ok=True)
os.makedirs(POSTERS, exist_ok=True)
scene = bpy.context.scene
scene.render.resolution_x = 960
scene.render.resolution_y = 600
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
camera = scene.camera


def render(name, position, target, lens=40, frame=1):
    camera.location = position
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = lens
    scene.frame_set(frame)
    scene.render.filepath = os.path.join(WORK, name + ".png")
    bpy.ops.render.render(write_still=True)


shots = [
    ("scene-00", (0, -35, 11), (0, -8, 12), 32),
    ("scene-01", (0, 10, 3.2), (0, 18, 3), 35),
    ("scene-02", (-2.3, 29, 2.2), (-2.3, 34, 1.4), 40),
    ("scene-03", (2.3, 29, 2.2), (2.3, 34, 1.4), 40),
    ("scene-04", (0, 45, 3.5), (0, 59, 3.0), 36),
    ("scene-05", (0, 66, 4.0), (0, 78, 3.5), 40),
    ("scene-06", (0, 90, 4.0), (0, 100, 2.0), 40),
    ("garden-wide", (0, 26, 3), (0, 34, 1.5), 38),
    ("hang-idle-close", (2.3, 29, 2.1), (2.3, 34, 1.65), 42),
    ("cuoi-idle-close", (-2.3, 29, 2.1), (-2.3, 34, 1.65), 42),
    ("rabbit-pound-close", (-1.0, 31.0, 1.45), (-1.0, 36.0, 0.75), 50, 8),
    ("cuoi-seated-close", (4.1, 31.2, 1.7), (4.1, 35.7, 1.15), 48),
    ("lion-fire-close", (0.4, 51.5, 2.0), (0.0, 58.2, 1.0), 42, 10),
]
if "--characters-only" in sys.argv:
    shots = [shot for shot in shots if shot[0] in {"scene-02", "scene-03", "garden-wide", "hang-idle-close", "cuoi-idle-close", "rabbit-pound-close", "cuoi-seated-close", "lion-fire-close"}]
for shot in shots:
    render(*shot)
bpy.data.objects["HANG_Rig"].animation_data.action = bpy.data.actions["HANG_Wave"]
render("hang-wave-close", (2.3, 29, 2.1), (2.3, 34, 1.65), 42, 46)
bpy.data.objects["CUOI_Rig"].animation_data.action = bpy.data.actions["CUOI_Look"]
render("cuoi-look-close", (-2.3, 29, 2.1), (-2.3, 34, 1.65), 42, 46)
# Blender supplies the rendered pixels; Pillow only performs the file conversion.
subprocess.run(["python", "-c", "from pathlib import Path; from PIL import Image; "
                f"source=Path({WORK!r}); target=Path({POSTERS!r}); "
                "[Image.open(p).save(target/(p.stem+'.webp'), 'WEBP', quality=88) "
                "for p in source.glob('scene-*.png')]"], check=True)
print("[review] rendered original Blender source to", WORK)
