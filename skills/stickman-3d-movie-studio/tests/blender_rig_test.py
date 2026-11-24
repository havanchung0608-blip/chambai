"""Chạy trong Blender: kiểm tra rig, IK, shape keys."""
import sys, os, math, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts", "blender"))
import bpy
from mathutils import Vector
import sm_rig
bpy.ops.wm.read_factory_settings(use_empty=True)
arm = sm_rig.build_character("t", {"glasses": True, "hair": "long"})
res = {}
need = ["root", "hips", "spine", "chest", "neck", "head"] + [f"{b}.{s}" for s in "LR" for b in ("upper_arm", "forearm", "hand", "thigh", "shin", "foot", "foot_ik", "knee_pole", "hand_ik", "elbow_pole")]
res["bones_ok"] = all(n in arm.data.bones for n in need)
res["n_bones"] = len(arm.data.bones)
res["ik_ok"] = all(any(c.type == "IK" for c in arm.pose.bones[f"{b}.{s}"].constraints) for s in "LR" for b in ("shin", "forearm"))
arm.pose.bones["foot_ik.L"].location = Vector((0, 0, 0.25))
bpy.context.view_layer.update()
knee = arm.matrix_world @ arm.pose.bones["shin.L"].head
res["knee_forward"] = knee.y < -0.05
face = bpy.data.objects["t_face"]
res["shape_keys"] = [k.name for k in face.data.shape_keys.key_blocks][1:]
print("RIGTEST", json.dumps(res))
