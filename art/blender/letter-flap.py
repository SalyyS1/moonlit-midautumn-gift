"""A real envelope flap hinged at its upper edge; no seal-scaling surrogate."""

import math
import bpy


def add_letter_flap(parent, paper, anchor=None):
    mesh = bpy.data.meshes.new("LETTER_Flap_Mesh")
    # Thin triangular prism: front faces the camera along Blender -Y.
    vertices = [(-.76, y, 0) for y in (-.012, .012)]
    vertices += [(.76, y, 0) for y in (-.012, .012)]
    vertices += [(0, y, -.60) for y in (-.012, .012)]
    mesh.from_pydata(vertices, [], [(0, 4, 2), (1, 3, 5), (0, 2, 3, 1), (2, 4, 5, 3), (4, 0, 1, 5)])
    mesh.materials.append(paper)
    flap = bpy.data.objects.new("LETTER_Flap", mesh)
    bpy.context.collection.objects.link(flap)
    flap.location = (0, 99.79, 3.33)
    bpy.context.view_layer.update()
    world = flap.matrix_world.copy()
    flap.parent = anchor or parent
    flap.matrix_world = world
    action = bpy.data.actions.new("LetterOpen")
    flap.animation_data_create()
    flap.animation_data.action = action
    for frame, angle in ((1, 0), (28, -95), (55, -165)):
        flap.rotation_euler.x = math.radians(angle)
        flap.keyframe_insert("rotation_euler", index=0, frame=frame)
    flap.rotation_euler.x = 0
    return flap
