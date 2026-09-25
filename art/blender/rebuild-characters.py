"""Regenerate only the hero collection in a saved world, then export normally.

Run: blender -b art/blender/moonlit-world.blend --python art/blender/rebuild-characters.py
The full-world builder invokes these same source modules for a clean rebuild.
"""

import os
import runpy
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
collection = bpy.data.collections.get("hero_characters")
if collection:
    for obj in list(collection.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.collections.remove(collection)
for action in list(bpy.data.actions):
    if action.name.startswith(("CUOI_", "HANG_")):
        bpy.data.actions.remove(action)
for blocks in (bpy.data.meshes, bpy.data.armatures, bpy.data.curves):
    for item in list(blocks):
        if item.users == 0 and item.name.startswith(("CUOI_", "HANG_")):
            blocks.remove(item)
builder = runpy.run_path(os.path.join(HERE, "build-environment.py"))
builder["load_optional_characters"]()
builder["export_world"]()
