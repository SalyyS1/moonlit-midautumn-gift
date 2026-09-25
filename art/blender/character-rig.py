"""Source-authored skeletal binding and actions for the two garden heroes."""

import math
import bpy
from mathutils import Vector


def body_height(z):
    """Adult storybook rest proportions; used by both vertices and joints."""
    return z * 1.6 if z <= .43 else .688 + (z - .43) * 1.12


def make_armature(collection, prefix):
    data = bpy.data.armatures.new(prefix + "_Armature")
    arm = bpy.data.objects.new(prefix + "_Rig", data)
    collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None):
        item = data.edit_bones.new(prefix + "_" + name)
        item.head = (head[0], head[1], body_height(head[2]))
        item.tail = (tail[0], tail[1], body_height(tail[2]))
        if name in ("head", "neck"):
            item.head.z -= .10
            item.tail.z -= .10
        if parent:
            item.parent = data.edit_bones[prefix + "_" + parent]

    bone("root", (0, 0, 0), (0, 0, .35))
    bone("pelvis", (0, 0, .34), (0, 0, .62), "root")
    bone("spine", (0, 0, .56), (0, 0, 1.06), "pelvis")
    bone("chest", (0, 0, .98), (0, 0, 1.32), "spine")
    bone("neck", (0, 0, 1.28), (0, 0, 1.48), "chest")
    bone("head", (0, 0, 1.42), (0, 0, 1.82), "neck")
    for side, sign in (("L", -1), ("R", 1)):
        bone("upper_arm." + side, (sign * .24, 0, 1.16), (sign * .55, 0, .92), "chest")
        bone("forearm." + side, (sign * .55, 0, .92), (sign * .71, 0, .66), "upper_arm." + side)
        bone("hand." + side, (sign * .71, 0, .66), (sign * .75, 0, .55), "forearm." + side)
    bpy.ops.object.mode_set(mode="OBJECT")
    arm.select_set(False)
    return arm


def bind_part(obj, arm, bone_name):
    """Bake a part's rest transform, then bind vertices to real deform bones.

    Face details share head weights and fingers share hand weights, so authored
    gestures move the entire visible anatomy. Meshes stay in armature space;
    only the character root receives world placement after binding.
    """
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    if obj.type == "CURVE" or obj.modifiers:
        bpy.ops.object.convert(target="MESH")
        obj = bpy.context.object
    obj.data.transform(obj.matrix_basis)
    obj.matrix_basis.identity()
    head_part = any(token in obj.name for token in ("Face", "Eye", "Hair", "Brow", "Mouth", "Nose", "Ear", "Headband"))
    tailored = any(token in obj.name for token in ("Tunic", "Vest", "AoDai", "Fold", "Pleat"))
    for vertex in obj.data.vertices:
        co = vertex.co
        if head_part:
            co.x *= .64
            co.y *= .60
            co.z = 1.85 + (co.z - 1.58) * .58
        else:
            source_z = co.z
            co.z = body_height(co.z)
            if "Neck" in obj.name:
                co.z -= .1 * min(1, max(0, (source_z - 1.16) / .26))
            if tailored:
                co.y *= .70
    obj.parent = arm
    obj.matrix_parent_inverse.identity()
    prefix = arm.name.removesuffix("_Rig")
    group = obj.vertex_groups.new(name=prefix + "_" + bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new("Authored skeletal deformation", "ARMATURE")
    modifier.object = arm
    # Export actual UVs, including face/hair details created from curves.
    if not obj.data.uv_layers:
        uv = obj.data.uv_layers.new(name="UVMap")
        for face in obj.data.polygons:
            for loop in face.loop_indices:
                co = obj.data.vertices[obj.data.loops[loop].vertex_index].co
                uv.data[loop].uv = (0.5 + math.atan2(co.y, co.x) / math.tau, co.z / 2.3)
    obj.select_set(False)


def animate(arm, prefix):
    """Author loopable idle and expressive gesture actions without root motion."""
    poses = arm.pose.bones
    arm.animation_data_create()
    # Keep the original clips stable while adding explicit cultural beat
    # actions.  The web timeline can blend these by absolute progress.
    names = ["Idle", "Look", "SeatIdle"] if prefix == "CUOI" else ["Idle", "Wave", "Dance"]
    actions = []
    for kind in names:
        action = bpy.data.actions.new(prefix + "_" + kind)
        arm.animation_data.action = action
        action.use_fake_user = True
        for frame in (1, 16, 31, 46, 61, 76, 91):
            t = (frame - 1) / 90
            envelope = math.sin(math.pi * t) ** 2
            for pose in poses:
                pose.rotation_mode = "XYZ"
                pose.rotation_euler = (0, 0, 0)
            chest = poses[prefix + "_chest"]
            head = poses[prefix + "_head"]
            if kind == "Idle":
                poses[prefix + "_spine"].rotation_euler.x = math.radians(.6) * math.sin(t * math.tau)
                chest.rotation_euler.x = math.radians(2.0) * math.sin(t * math.tau)
                head.rotation_euler.y = math.radians(3.0) * math.sin(t * math.tau)
                for side, sign in (("L", -1), ("R", 1)):
                    poses[prefix + "_upper_arm." + side].rotation_euler.z = math.radians(sign * 2) * envelope
            elif kind == "Look":
                # Local Y follows the vertical head bone, hence a head turn.
                head.rotation_euler.y = math.radians(27) * envelope
                head.rotation_euler.x = math.radians(-9) * envelope
                chest.rotation_euler.y = math.radians(7) * envelope
            elif kind == "Dance":
                # Hằng's silk sleeves trace a small figure-eight while her
                # shoulders and head follow the loop; there is no root motion.
                upper_l = poses[prefix + "_upper_arm.L"]
                upper_r = poses[prefix + "_upper_arm.R"]
                upper_l.rotation_euler.z = math.radians(-18) * envelope
                upper_r.rotation_euler.z = math.radians(18) * envelope
                upper_l.rotation_euler.x = math.radians(12) * math.sin(t * math.tau) * envelope
                upper_r.rotation_euler.x = math.radians(-12) * math.sin(t * math.tau) * envelope
                poses[prefix + "_hand.L"].rotation_euler.z = math.radians(-32) * math.sin(t * math.tau * 2) * envelope
                poses[prefix + "_hand.R"].rotation_euler.z = math.radians(32) * math.sin(t * math.tau * 2) * envelope
                chest.rotation_euler.y = math.radians(8) * math.sin(t * math.tau) * envelope
                head.rotation_euler.z = math.radians(-7) * math.sin(t * math.tau) * envelope
            elif kind == "SeatIdle":
                chest.rotation_euler.x = math.radians(2.0) * math.sin(t * math.tau) * envelope
                head.rotation_euler.y = math.radians(4.0) * math.sin(t * math.tau) * envelope
                poses[prefix + "_upper_arm.L"].rotation_euler.z = math.radians(-3) * envelope
                poses[prefix + "_upper_arm.R"].rotation_euler.z = math.radians(3) * envelope
            else:
                # Turn the arm about its local X/Z axes to raise the hand above
                # shoulder height, then wave at the wrist while sleeves follow.
                upper = poses[prefix + "_upper_arm.R"]
                rest = arm.data.bones[upper.name].matrix_local.to_quaternion()
                lift = Vector((.31, 0, -.24 * 1.12)).rotation_difference(Vector((.22, -.10, .33)))
                local_lift = (rest.inverted() @ lift @ rest).to_euler("XYZ")
                upper.rotation_euler = tuple(angle * envelope for angle in local_lift)
                poses[prefix + "_hand.R"].rotation_euler.z = math.radians(24) * math.sin(t * math.tau * 3) * envelope
                head.rotation_euler.z = math.radians(-5) * envelope
            for pose in poses:
                if not pose.name.endswith("_root"):
                    pose.keyframe_insert("rotation_euler", frame=frame, group=pose.name)
        for curve in action.fcurves:
            for point in curve.keyframe_points:
                point.interpolation = "BEZIER"
        # Stashed NLA strips associate each action with its actual armature.
        track = arm.animation_data.nla_tracks.new()
        track.name = action.name
        track.strips.new(action.name, 1, action)
        track.mute = True
        actions.append(action)
    arm.animation_data.action = actions[0]
    return actions
