"""sm_rig — dựng NHÂN VẬT NGƯỜI QUE 3D thật trong Blender.

- Bộ xương (Armature) 15 xương thân + 8 xương điều khiển: hips, spine, chest, neck, head,
  upper_arm/forearm/hand .L/.R, thigh/shin/foot .L/.R; IK chân (foot_ik + knee_pole) và IK tay
  (hand_ik + elbow_pole) — có thể chuyển FK bằng ảnh hưởng (influence) của ràng buộc IK.
- Lưới (mesh) bo tròn kiểu "viên nang" bám xương bằng nhóm đỉnh (rigid skinning) → không méo.
- Khuôn mặt tách riêng với Shape Keys: blink, smile, frown, mouth_open, mouth_O, brow_up,
  brow_angry, brow_sad, look_L, look_R → biểu cảm + khẩu hình.
- Viền đen kiểu hoạt hình (inverted hull) để giữ nét "người que" khi lên 3D.
Hướng nhân vật: mặt nhìn về -Y (chuẩn Blender), trục Z hướng lên, đơn vị mét.
"""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix

# tỉ lệ cơ thể (người cao ~1,75 m khi scale = 1)
P = dict(hip_z=0.95, spine=0.27, chest=0.25, neck=0.08, head_r=0.14, shoulder_w=0.17, hip_w=0.095,
         upper_arm=0.30, forearm=0.27, hand=0.07, thigh=0.45, shin=0.44, ankle_z=0.06, foot_len=0.17)


def _mat(name, color, rough=0.55, emit=0.0, metal=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*color, 1)
        b.inputs["Emission Strength"].default_value = emit
    m.diffuse_color = (*color, 1)
    return m


def hex2rgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x ** 2.2 for x in c)  # sRGB → linear


def _outline_mat():
    m = bpy.data.materials.get("SM_Outline")
    if m:
        return m
    m = bpy.data.materials.new("SM_Outline")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.01, 0.01, 0.012, 1)
    nt.links.new(em.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    m.diffuse_color = (0, 0, 0, 1)
    return m


def _capsule(bm, a, b, r, vg_layer, gi, mat_i, segs=12, rings=4):
    """Viên nang từ điểm a tới b, bán kính r; gán nhóm đỉnh gi."""
    a, b = Vector(a), Vector(b)
    ax = b - a
    L = ax.length
    z = ax.normalized() if L > 1e-6 else Vector((0, 0, 1))
    x = z.orthogonal().normalized()
    y = z.cross(x)
    verts = []
    # bán cầu dưới, thân trụ, bán cầu trên
    profile = []
    for i in range(rings, 0, -1):
        t = (i / rings) * (math.pi / 2)
        profile.append((-math.sin(t) * r, math.cos(t) * r))
    profile.append((0, r))
    profile.append((L, r))
    for i in range(1, rings + 1):
        t = (i / rings) * (math.pi / 2)
        profile.append((L + math.sin(t) * r, math.cos(t) * r))
    bottom = bm.verts.new(a - z * r)
    top = bm.verts.new(b + z * r)
    rings_v = []
    for (h, rr) in profile:
        ring = []
        for k in range(segs):
            ang = 2 * math.pi * k / segs
            p = a + z * h + (x * math.cos(ang) + y * math.sin(ang)) * rr
            ring.append(bm.verts.new(p))
        rings_v.append(ring)
    faces = []
    for k in range(segs):
        faces.append(bm.faces.new((bottom, rings_v[0][(k + 1) % segs], rings_v[0][k])))
    for j in range(len(rings_v) - 1):
        for k in range(segs):
            faces.append(bm.faces.new((rings_v[j][k], rings_v[j][(k + 1) % segs], rings_v[j + 1][(k + 1) % segs], rings_v[j + 1][k])))
    for k in range(segs):
        faces.append(bm.faces.new((top, rings_v[-1][k], rings_v[-1][(k + 1) % segs])))
    allv = [bottom, top] + [v for ring in rings_v for v in ring]
    for v in allv:
        v[vg_layer][gi] = 1.0
    for f in faces:
        f.material_index = mat_i
        f.smooth = True
    return allv


def _sphere(bm, c, r, vg_layer, gi, mat_i, scale=(1, 1, 1), segs=20, rings=12):
    res = bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
    vs = res["verts"]
    for v in vs:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2])) + Vector(c)
        v[vg_layer][gi] = 1.0
    for f in {f for v in vs for f in v.link_faces}:
        f.material_index = mat_i
        f.smooth = True
    return vs


def build_character(name, spec=None, location=(0, 0, 0), heading=0.0):
    """Tạo nhân vật. spec: dict màu/phụ kiện, ví dụ
    {"shirt": "#e57373", "limbs": "#222222", "skin": "#fff3e0", "hair": "long", "hair_color": "#3e2723",
     "skirt": true, "glasses": true, "scale": 1.0, "outline": true}
    Trả về đối tượng armature (có custom property 'sm_char')."""
    spec = spec or {}
    S = float(spec.get("scale", 1.0))
    p = {k: v * S for k, v in P.items()}
    coll = bpy.data.collections.new(f"CH_{name}")
    bpy.context.scene.collection.children.link(coll)

    # ---------------- ARMATURE ----------------
    arm_data = bpy.data.armatures.new(f"{name}_rig")
    arm = bpy.data.objects.new(f"{name}", arm_data)
    coll.objects.link(arm)
    arm["sm_char"] = name
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def bone(n, h, t, parent=None, connect=False, deform=True, roll=0.0):
        b = eb.new(n)
        b.head, b.tail = Vector(h), Vector(t)
        b.roll = roll
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
        b.use_deform = deform
        return b

    hz, sw, hw = p["hip_z"], p["shoulder_w"], p["hip_w"]
    chest_top = hz + p["spine"] + p["chest"]
    neck_top = chest_top + p["neck"]
    head_c = neck_top + p["head_r"] * 0.95
    bone("root", (0, 0, 0), (0, 0.25 * S, 0), deform=False)
    bone("hips", (0, 0, hz), (0, 0, hz + 0.1 * S), "root")
    bone("spine", (0, 0, hz + 0.1 * S), (0, 0, hz + p["spine"]), "hips", True)
    bone("chest", (0, 0, hz + p["spine"]), (0, 0, chest_top), "spine", True)
    bone("neck", (0, 0, chest_top), (0, 0, neck_top), "chest", True)
    bone("head", (0, 0, neck_top), (0, 0, neck_top + 2 * p["head_r"]), "neck", True)
    sh_z = chest_top - 0.03 * S
    for side, sx in (("L", 1), ("R", -1)):
        # tay: khuỷu hơi lùi ra sau (+Y) để IK gập đúng chiều
        elbow = (sx * sw, 0.025 * S, sh_z - p["upper_arm"])
        wrist = (sx * sw, 0.0, sh_z - p["upper_arm"] - p["forearm"])
        bone(f"upper_arm.{side}", (sx * sw, 0, sh_z), elbow, "chest")
        bone(f"forearm.{side}", elbow, wrist, f"upper_arm.{side}", True)
        bone(f"hand.{side}", wrist, (wrist[0], 0, wrist[2] - p["hand"]), f"forearm.{side}", True)
        # chân: gối hơi về trước (-Y)
        knee = (sx * hw, -0.03 * S, hz - p["thigh"])
        ankle = (sx * hw, 0, p["ankle_z"])
        bone(f"thigh.{side}", (sx * hw, 0, hz), knee, "hips")
        bone(f"shin.{side}", knee, ankle, f"thigh.{side}", True)
        bone(f"foot.{side}", ankle, (sx * hw, -p["foot_len"], 0.0), f"shin.{side}", True)
        # điều khiển IK (không biến dạng)
        bone(f"foot_ik.{side}", ankle, (sx * hw, -p["foot_len"], p["ankle_z"]), None, deform=False)
        bone(f"knee_pole.{side}", (sx * hw, -0.7 * S, hz - p["thigh"]), (sx * hw, -0.8 * S, hz - p["thigh"]), "root", deform=False)
        bone(f"hand_ik.{side}", wrist, (wrist[0], -0.08 * S, wrist[2]), None, deform=False)
        bone(f"elbow_pole.{side}", (sx * sw * 1.4, 0.6 * S, sh_z - p["upper_arm"]), (sx * sw * 1.4, 0.7 * S, sh_z - p["upper_arm"]), "root", deform=False)
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones
    for side in ("L", "R"):
        c = pb[f"shin.{side}"].constraints.new("IK")
        c.name = "IK"
        c.target, c.subtarget = arm, f"foot_ik.{side}"
        c.pole_target, c.pole_subtarget = arm, f"knee_pole.{side}"
        c.pole_angle = math.radians(-90)
        c.chain_count = 2
        cr = pb[f"foot.{side}"].constraints.new("COPY_ROTATION")
        cr.target, cr.subtarget = arm, f"foot_ik.{side}"
        c = pb[f"forearm.{side}"].constraints.new("IK")
        c.name = "IK"
        c.target, c.subtarget = arm, f"hand_ik.{side}"
        c.pole_target, c.pole_subtarget = arm, f"elbow_pole.{side}"
        c.pole_angle = math.radians(-90)
        c.chain_count = 2
        cr = pb[f"hand.{side}"].constraints.new("COPY_ROTATION")
        cr.name = "HandRot"
        cr.target, cr.subtarget = arm, f"hand_ik.{side}"
        cr.influence = 0.0
    for b in pb:
        b.rotation_mode = "XYZ"
    bpy.ops.object.mode_set(mode="OBJECT")

    # ---------------- THÂN (mesh) ----------------
    col_shirt = hex2rgb(spec.get("shirt", "#42a5f5"))
    col_limb = hex2rgb(spec.get("limbs", "#212121"))
    col_skin = hex2rgb(spec.get("skin", "#fff3e0"))
    col_shoe = hex2rgb(spec.get("shoes", "#3e2723"))
    col_hair = hex2rgb(spec.get("hair_color", "#212121"))
    col_pants = hex2rgb(spec.get("pants", spec.get("limbs", "#212121")))
    mats = [_mat(f"{name}_shirt", col_shirt, 0.6), _mat(f"{name}_limb", col_limb, 0.45), _mat(f"{name}_skin", col_skin, 0.5),
            _mat(f"{name}_shoe", col_shoe, 0.35), _mat(f"{name}_hair", col_hair, 0.6), _mat(f"{name}_pants", col_pants, 0.55)]
    me = bpy.data.meshes.new(f"{name}_body")
    bm = bmesh.new()
    dl = bm.verts.layers.deform.verify()
    groups = ["hips", "spine", "chest", "neck", "head"] + [f"{b}.{s}" for s in ("L", "R") for b in ("upper_arm", "forearm", "hand", "thigh", "shin", "foot")]
    gi = {g: i for i, g in enumerate(groups)}
    lr = 0.032 * S  # bán kính tay chân
    _capsule(bm, (0, 0, hz + 0.02 * S), (0, 0, hz + p["spine"]), 0.085 * S, dl, gi["spine"], 0)
    _capsule(bm, (0, 0, hz + p["spine"]), (0, 0, chest_top - 0.02 * S), 0.095 * S, dl, gi["chest"], 0)
    _capsule(bm, (0, 0, hz - 0.02 * S), (0, 0, hz + 0.06 * S), 0.09 * S, dl, gi["hips"], 5 if not spec.get("skirt") else 0)
    if spec.get("skirt"):
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.2 * S, radius2=0.09 * S, depth=0.32 * S)
        for v in res["verts"]:
            v.co.z += hz - 0.1 * S
            v[dl][gi["hips"]] = 1.0
        for f in {f for v in res["verts"] for f in v.link_faces}:
            f.material_index = 0
            f.smooth = True
    _capsule(bm, (0, 0, chest_top), (0, 0, neck_top), 0.028 * S, dl, gi["neck"], 1)
    for side, sx in (("L", 1), ("R", -1)):
        elbow = (sx * sw, 0.025 * S, sh_z - p["upper_arm"])
        wrist = (sx * sw, 0.0, sh_z - p["upper_arm"] - p["forearm"])
        _capsule(bm, (sx * sw, 0, sh_z), elbow, lr * 1.15, dl, gi[f"upper_arm.{side}"], 0 if spec.get("long_sleeves", True) else 1)
        _capsule(bm, elbow, wrist, lr, dl, gi[f"forearm.{side}"], 1)
        _sphere(bm, (wrist[0], 0, wrist[2] - 0.035 * S), 0.042 * S, dl, gi[f"hand.{side}"], 2, segs=12, rings=8)
        knee = (sx * hw, -0.03 * S, hz - p["thigh"])
        ankle = (sx * hw, 0, p["ankle_z"])
        _capsule(bm, (sx * hw, 0, hz), knee, lr * 1.25, dl, gi[f"thigh.{side}"], 5)
        _capsule(bm, knee, ankle, lr * 1.1, dl, gi[f"shin.{side}"], 5)
        sv = _sphere(bm, (sx * hw, -0.06 * S, 0.035 * S), 0.05 * S, dl, gi[f"foot.{side}"], 3, scale=(0.85, 1.9, 0.7), segs=14, rings=8)
    # đầu
    hc = Vector((0, 0, head_c))
    _sphere(bm, hc, p["head_r"], dl, gi["head"], 2, segs=32, rings=20)
    hair = spec.get("hair", "short")
    if hair != "none":
        res = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=p["head_r"] * 1.06)
        kill = []
        for v in res["verts"]:
            v.co += hc
            v[dl][gi["head"]] = 1.0
        for v in res["verts"]:
            rel = v.co - hc
            # giữ phần đỉnh + sau đầu, bỏ phần mặt
            front = rel.y < -0.02 * S and rel.z < p["head_r"] * 0.45
            low = rel.z < (-p["head_r"] * (0.9 if hair == "long" else 0.15))
            if front or low:
                kill.append(v)
        bmesh.ops.delete(bm, geom=kill, context="VERTS")
        for f in bm.faces:
            if f.material_index == 0 and all(v[dl].get(gi["head"], 0) > 0 for v in f.verts) and f.calc_center_median().z > hc.z - p["head_r"] * 1.0 and (f.calc_center_median() - hc).length > p["head_r"] * 1.03:
                f.material_index = 4
                f.smooth = True
        if hair == "ponytail":
            _capsule(bm, hc + Vector((0, 0.15 * S, 0.02 * S)), hc + Vector((0, 0.24 * S, -0.16 * S)), 0.05 * S, dl, gi["head"], 4)
        if hair == "bun":
            _sphere(bm, hc + Vector((0, 0.08 * S, 0.13 * S)), 0.065 * S, dl, gi["head"], 4)
    bm.to_mesh(me)
    bm.free()
    body = bpy.data.objects.new(f"{name}_body", me)
    coll.objects.link(body)
    for m in mats:
        me.materials.append(m)
    for g in groups:
        body.vertex_groups.new(name=g)
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    body.parent = arm
    if spec.get("outline", True):
        me.materials.append(_outline_mat())
        so = body.modifiers.new("Outline", "SOLIDIFY")
        so.thickness = -0.012 * S
        so.use_flip_normals = True
        so.material_offset = len(me.materials) - 1
        so.use_rim = False

    # ---------------- MẶT (shape keys) ----------------
    face = build_face(name, coll, hc, p["head_r"], S, spec)
    face.parent = arm
    mf = face.modifiers.new("Armature", "ARMATURE")
    mf.object = arm
    face.vertex_groups.new(name="head")
    face.vertex_groups["head"].add(list(range(len(face.data.vertices))), 1.0, "REPLACE")

    if spec.get("glasses"):
        _glasses(name, coll, hc, p["head_r"], S, arm)
    arm.location = location
    arm.rotation_euler = (0, 0, heading)
    arm["sm_scale"] = S
    arm["sm_head_c"] = head_c
    arm.show_in_front = False
    arm.hide_render = True
    return arm


def _on_head(hc, R, x, z, out=0.004):
    y = -math.sqrt(max(R * R - x * x - z * z, 1e-6)) - out
    return Vector((hc.x + x, hc.y + y, hc.z + z))


def build_face(name, coll, hc, R, S, spec):
    """Mắt, lông mày, miệng — một mesh với shape keys."""
    bm = bmesh.new()
    parts = {}

    def blob(key, cx, cz, rx, rz, depth, segs=16, mat=0):
        # đĩa elip dày, áp lên mặt cầu
        c = _on_head(hc, R, cx, cz, 0.0)
        vs_top, vs_bot = [], []
        center_t = bm.verts.new(c + Vector((0, -depth, 0)))
        center_b = bm.verts.new(c + Vector((0, 0.002, 0)))
        for k in range(segs):
            a = 2 * math.pi * k / segs
            px, pz = cx + rx * math.cos(a), cz + rz * math.sin(a)
            q = _on_head(hc, R, px, pz, 0.0)
            vs_top.append(bm.verts.new(q + Vector((0, -depth, 0))))
            vs_bot.append(bm.verts.new(q + Vector((0, 0.002, 0))))
        fs = []
        for k in range(segs):
            fs.append(bm.faces.new((center_t, vs_top[k], vs_top[(k + 1) % segs])))
            fs.append(bm.faces.new((vs_top[k], vs_bot[k], vs_bot[(k + 1) % segs], vs_top[(k + 1) % segs])))
        for f in fs:
            f.material_index = mat
        parts[key] = dict(center=(cx, cz), verts=[center_t, center_b] + vs_top + vs_bot, segs=segs)

    def strip(key, pts, w, mat=0):
        # dải cong (lông mày / môi) theo danh sách (x,z)
        top, bot = [], []
        for (x, z) in pts:
            q = _on_head(hc, R, x, z, 0.006 * S)
            top.append(bm.verts.new(q + Vector((0, 0, w / 2))))
            bot.append(bm.verts.new(q + Vector((0, 0, -w / 2))))
        for i in range(len(pts) - 1):
            f = bm.faces.new((top[i], bot[i], bot[i + 1], top[i + 1]))
            f.material_index = mat
        parts[key] = dict(top=top, bot=bot, base=list(pts))

    ex, ez = 0.048 * S, 0.02 * S
    blob("eyeL", ex, ez, 0.017 * S, 0.024 * S, 0.006 * S)
    blob("eyeR", -ex, ez, 0.017 * S, 0.024 * S, 0.006 * S)
    # tròng trắng nhỏ (ánh mắt) giúp mắt "có hồn"
    blob("glintL", ex + 0.006 * S, ez + 0.009 * S, 0.0045 * S, 0.0045 * S, 0.008 * S, segs=8, mat=2)
    blob("glintR", -ex + 0.006 * S, ez + 0.009 * S, 0.0045 * S, 0.0045 * S, 0.008 * S, segs=8, mat=2)
    N = 9
    browL = [(ex + (i / (N - 1) - 0.5) * 0.05 * S, ez + 0.05 * S) for i in range(N)]
    browR = [(-ex + (i / (N - 1) - 0.5) * 0.05 * S, ez + 0.05 * S) for i in range(N)]
    strip("browL", browL, 0.009 * S)
    strip("browR", browR, 0.009 * S)
    M = 15
    mw = 0.075 * S
    mouth = [((i / (M - 1) - 0.5) * mw, -0.06 * S) for i in range(M)]
    strip("mouth_up", mouth, 0.008 * S, mat=1)
    strip("mouth_lo", mouth, 0.008 * S, mat=1)
    me = bpy.data.meshes.new(f"{name}_face")
    bm.to_mesh(me)
    # chỉ số đỉnh theo thứ tự tạo
    idx = {}
    bm.verts.index_update()
    for k, v in parts.items():
        if "verts" in v:
            idx[k] = [vv.index for vv in v["verts"]]
        else:
            idx[k] = ([vv.index for vv in v["top"]], [vv.index for vv in v["bot"]], v["base"])
    bm.free()
    face = bpy.data.objects.new(f"{name}_face", me)
    coll.objects.link(face)
    me.materials.append(_mat("SM_face_ink", (0.015, 0.015, 0.02), 0.3))
    me.materials.append(_mat("SM_mouth", (0.35, 0.03, 0.05), 0.4))
    me.materials.append(_mat("SM_glint", (1, 1, 1), 0.2, emit=0.5))

    base = [v.co.copy() for v in me.vertices]
    face.shape_key_add(name="Basis")

    def key(name_, fn):
        sk = face.shape_key_add(name=name_, from_mix=False)
        for i, co in enumerate(base):
            sk.data[i].co = co
        fn(sk)
        sk.value = 0.0

    def set_strip(sk, k, f_pts, width=None):
        top, bot, basepts = idx[k]
        for i, (x, z) in enumerate(basepts):
            nx, nz, w = f_pts(i, x, z)
            q = _on_head(hc, R, nx, nz, 0.006 * S)
            sk.data[top[i]].co = q + Vector((0, 0, w / 2))
            sk.data[bot[i]].co = q + Vector((0, 0, -w / 2))

    def scale_blob(sk, k, sx, sz, dx=0.0, dz=0.0):
        cx, cz = None, None
        vs = idx[k]
        c = base[vs[0]]
        for i in vs:
            co = base[i]
            sk.data[i].co = Vector((c.x + (co.x - c.x) * sx + dx, co.y, c.z + (co.z - c.z) * sz + dz))

    # chớp mắt
    key("blink", lambda sk: [scale_blob(sk, k, 1.1, 0.12, 0, -0.008 * S) for k in ("eyeL", "eyeR")] + [scale_blob(sk, k, 0.01, 0.01) for k in ("glintL", "glintR")])
    # nhìn trái/phải (đồng tử dịch)
    key("look_L", lambda sk: [scale_blob(sk, k, 1, 1, 0.012 * S) for k in ("eyeL", "eyeR", "glintL", "glintR")])
    key("look_R", lambda sk: [scale_blob(sk, k, 1, 1, -0.012 * S) for k in ("eyeL", "eyeR", "glintL", "glintR")])
    half = (M - 1) / 2

    def curve(c, open_=0.0, wide=1.0):
        def f_up(i, x, z):
            u = (i - half) / half
            return x * wide, z + c * (u * u) * 0.02 * S + open_ * 0.004 * S * (1 - u * u), 0.008 * S
        def f_lo(i, x, z):
            u = (i - half) / half
            return x * wide, z + c * (u * u) * 0.02 * S - open_ * 0.03 * S * (1 - u * u), 0.008 * S
        return f_up, f_lo
    for nm, c, o, w in (("smile", 1.0, 0.0, 1.05), ("frown", -0.8, 0.0, 0.9), ("mouth_open", 0.0, 1.0, 0.9), ("mouth_O", 0.0, 0.9, 0.45)):
        fu, fl = curve(c, o, w)
        key(nm, lambda sk, fu=fu, fl=fl: (set_strip(sk, "mouth_up", fu), set_strip(sk, "mouth_lo", fl)))

    def brow(dz_in, dz_out, lift):
        def f(i, x, z, side):
            u = i / (M - 1) if False else i / 8
            inner = (1 - u) if side == "L" else u  # phía gần sống mũi
            return x, z + lift * 0.012 * S + (dz_in * inner + dz_out * (1 - inner)) * 0.012 * S, 0.009 * S
        return f
    for nm, a, b, l in (("brow_up", 0.3, 0.3, 1.0), ("brow_angry", -1.2, 0.6, 0.0), ("brow_sad", 1.0, -0.6, 0.2)):
        fb = brow(a, b, l)
        key(nm, lambda sk, fb=fb: (set_strip(sk, "browL", lambda i, x, z: fb(i, x, z, "L")), set_strip(sk, "browR", lambda i, x, z: fb(i, x, z, "R"))))
    return face


def _glasses(name, coll, hc, R, S, arm):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.026 * S, minor_radius=0.004 * S, location=(0, 0, 0))
    g1 = bpy.context.object
    g1.rotation_euler = (math.pi / 2, 0, 0)
    g1.location = _on_head(hc, R, 0.048 * S, 0.02 * S, 0.012 * S)
    bpy.ops.object.duplicate()
    g2 = bpy.context.object
    g2.location = _on_head(hc, R, -0.048 * S, 0.02 * S, 0.012 * S)
    for g in (g1, g2):
        for c in g.users_collection:
            c.objects.unlink(g)
        coll.objects.link(g)
        g.data.materials.append(_mat("SM_face_ink", (0.015, 0.015, 0.02), 0.3))
        g.parent = arm
        g.parent_type = "BONE"
        g.parent_bone = "head"
        # giữ nguyên vị trí thế giới khi gắn vào xương đầu
        bone = arm.data.bones["head"]
        g.matrix_parent_inverse = (arm.matrix_world @ Matrix.Translation(bone.tail_local) @ bone.matrix_local.to_3x3().to_4x4()).inverted() if False else (arm.matrix_world @ bone.matrix_local @ Matrix.Translation((0, bone.length, 0))).inverted()
