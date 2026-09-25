"""Original seamless lunar albedo/normal maps that survive the glTF export."""

import math
import random
import bpy
from mathutils import Vector, noise


def lunar_material():
    width, height = 512, 256
    rng = random.Random(240924)
    craters = [(rng.random(), rng.uniform(.12, .88), rng.uniform(.012, .065)) for _ in range(36)]
    heights, albedo = [], []
    for y in range(height):
        v = y / height
        latitude = (v - .5) * math.pi
        latitude_scale = math.cos(latitude)
        for x in range(width):
            u = x / width
            longitude = u * math.tau
            direction = Vector((math.cos(longitude) * latitude_scale, math.sin(longitude) * latitude_scale, math.sin(latitude)))
            low = noise.noise_vector(direction * 4.3).x
            fine = noise.noise_vector(direction * 42).y
            value = .48 + low * .18 + fine * .045
            relief = fine * .009
            for cu, cv, radius in craters:
                du = min(abs(u - cu), 1 - abs(u - cu)) * max(.15, latitude_scale) * 2
                distance = math.hypot(du, v - cv) / radius
                if distance < 1.3:
                    bowl = max(0, 1 - distance * distance)
                    rim = math.exp(-((distance - .98) / .12) ** 2)
                    value += rim * .11 - bowl * .13
                    relief += rim * radius * .34 - bowl * radius * .24
            value = max(.18, min(.73, value))
            albedo.extend((value * 1.01, value, value * .97, 1.0))
            heights.append(relief)
    normals = []
    for y in range(height):
        for x in range(width):
            dx = heights[y * width + (x + 1) % width] - heights[y * width + (x - 1) % width]
            dy = heights[min(y + 1, height - 1) * width + x] - heights[max(y - 1, 0) * width + x]
            normal = Vector((-dx * 60, -dy * 30, 1)).normalized()
            normals.extend((normal.x * .5 + .5, normal.y * .5 + .5, normal.z * .5 + .5, 1.0))

    def image(name, pixels, colorspace):
        item = bpy.data.images.new(name, width=width, height=height, alpha=False)
        item.colorspace_settings.name = colorspace
        item.pixels.foreach_set(pixels)
        item.pack()
        return item

    material = bpy.data.materials.new("Moon_Regolith_Embedded")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    shader = nodes.get("Principled BSDF")
    shader.inputs["Roughness"].default_value = .94
    shader.inputs["Specular IOR Level"].default_value = .18
    color = nodes.new("ShaderNodeTexImage")
    color.image = image("Moon_Original_Albedo", albedo, "sRGB")
    links.new(color.outputs["Color"], shader.inputs["Base Color"])
    normal_texture = nodes.new("ShaderNodeTexImage")
    normal_texture.image = image("Moon_Original_Normal", normals, "Non-Color")
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.inputs["Strength"].default_value = .45
    links.new(normal_texture.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])
    return material


def build_moon(parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=8, location=(0, -8, 12))
    obj = bpy.context.object
    obj.name = "luminous textured moon"
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(lunar_material())
    bpy.context.view_layer.update()
    world = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = world
    return obj
