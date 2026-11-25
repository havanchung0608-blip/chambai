"""sm_canteen — bối cảnh CĂN TIN TRƯỜNG HỌC + đạo cụ cho phim "Phi vụ giải cứu bánh tráng trứng".

Toạ độ (mét): sàn z = 0; tường sau y = 4,2; quầy căn tin x −2,2…2,2, y 1,0…1,7, mặt quầy z = 0,95.
Máy Nướng 3.14 đặt trên quầy, tâm bánh BANH_C. Tí đứng trước quầy (y ≈ 0,55, quay mặt +Y);
cô Bảy đứng sau quầy (y ≈ 2,2, quay mặt −Y). 1 cm ngoài đời = 1 cm trong cảnh (bánh R = 10 cm).

Mọi đạo cụ được đặt tên rõ để kịch bản điều khiển bằng hành động "anim" (keyframe vị trí, xoay, tỉ lệ,
ẩn/hiện, hệ số lộ nét) — xem build_scene.py.
"""
import math
import bpy
import bmesh
from mathutils import Vector

import sm_env
from sm_env import mat, box, cyl, text_obj, new_coll

TOP = 0.95                                  # mặt quầy
BANH_C = Vector((-0.40, 1.33, TOP + 0.195))  # tâm mặt bánh (trên vỉ nướng)
BANH_R = 0.10


def _disc(name, r0, r1, a0, a1, z, material, coll, segs=96, thick=0.0):
    """Hình vành khuyên / hình quạt phẳng (r0 = 0 → hình quạt/hình tròn), toạ độ cục bộ quanh (0,0)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    n = max(3, int(segs * abs(a1 - a0) / (2 * math.pi)))
    full = abs(a1 - a0) >= 2 * math.pi - 1e-6
    outer, inner = [], []
    for i in range(n + (0 if full else 1)):
        t = a0 + (a1 - a0) * i / n
        outer.append(bm.verts.new((r1 * math.cos(t), r1 * math.sin(t), z)))
        if r0 > 0:
            inner.append(bm.verts.new((r0 * math.cos(t), r0 * math.sin(t), z)))
    if r0 > 0:
        m = len(outer)
        for i in range(m if full else m - 1):
            j = (i + 1) % m
            bm.faces.new((inner[i], outer[i], outer[j], inner[j]))
    else:
        c = bm.verts.new((0, 0, z))
        m = len(outer)
        for i in range(m if full else m - 1):
            j = (i + 1) % m
            bm.faces.new((c, outer[i], outer[j]))
    if thick:
        geo = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        for v in [e for e in geo["geom"] if isinstance(e, bmesh.types.BMVert)]:
            v.co.z -= thick
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    me.materials.append(material)
    coll.objects.link(ob)
    return ob


def _curve(name, pts, coll, width, color, emit=0.0):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = width
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    ob = bpy.data.objects.new(name, cu)
    cu.materials.append(mat(f"CT_curve_{color}_{emit}", color, 0.4, emit=emit))
    cu.bevel_factor_mapping_end = "SPLINE"
    coll.objects.link(ob)
    return ob


def _empty(name, loc, coll):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    e.empty_display_size = 0.05
    coll.objects.link(e)
    return e


def _parent(child, parent):
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    child.matrix_world = mw


def _hide(ob, hidden=True):
    ob.hide_render = hidden
    ob.hide_viewport = hidden


def _tile_mat():
    m = bpy.data.materials.get("CT_tiles")
    if m:
        return m
    m = bpy.data.materials.new("CT_tiles")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    ck = nt.nodes.new("ShaderNodeTexChecker")
    ck.inputs["Scale"].default_value = 1.0
    ck.inputs["Color1"].default_value = (*sm_env.lin("#f3e5c8"), 1)
    ck.inputs["Color2"].default_value = (*sm_env.lin("#c9744a"), 1)
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (2.0, 2.0, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], ck.inputs["Vector"])
    nt.links.new(ck.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.25
    m.diffuse_color = (*sm_env.lin("#e0b48a"), 1)
    return m


# =============================== BỐI CẢNH ===============================
def build_canteen():
    co = new_coll("CANTEEN")
    A = {}
    # sàn gạch, tường
    me = bpy.data.meshes.new("floor")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=12)
    bm.to_mesh(me)
    bm.free()
    fl = bpy.data.objects.new("floor", me)
    me.materials.append(_tile_mat())
    co.objects.link(fl)
    wall = mat("CT_wall", "#fff1c4", 0.8)
    box("wall_back", (16, 0.2, 4.0), (0, 4.3, 2.0), wall, co)
    box("wall_L", (0.2, 14, 4.0), (-6.2, 0, 2.0), mat("CT_wall2", "#ffe6a6", 0.8), co)
    box("wall_R", (0.2, 14, 4.0), (6.2, 0, 2.0), mat("CT_wall2", "#ffe6a6", 0.8), co)
    box("skirting", (16, 0.22, 0.9), (0, 4.28, 0.45), mat("CT_skirt", "#8bc34a", 0.6), co)
    # cửa sổ tường trái (nắng)
    for y in (-1.5, 1.5):
        box(f"win_{y}", (0.05, 1.6, 1.4), (-6.08, y, 2.0), mat("CT_sky", "#bfe9ff", 0.2, emit=1.2), co)
        box(f"winf_{y}", (0.08, 1.7, 0.08), (-6.04, y, 2.0), mat("CT_frame", "#6d4c41", 0.5), co)
    # bảng thực đơn
    box("menu", (2.6, 0.06, 1.0), (0, 4.17, 2.45), mat("CT_menu", "#1b5e20", 0.7), co, bevel=0.02)
    box("menu_frame", (2.72, 0.04, 1.12), (0, 4.2, 2.45), mat("CT_frame", "#6d4c41", 0.5), co)
    chalk = mat("CT_chalk", "#fffde7", 0.9, emit=0.3)
    text_obj("menu_t", "CĂN TIN CÔ BẢY", (0, 4.12, 2.78), 0.2, mat("CT_gold", "#ffd54f", 0.5, emit=0.3), co, bold=True)
    text_obj("menu_1", "Bánh tráng trứng ........ 15k", (0, 4.12, 2.48), 0.11, chalk, co)
    text_obj("menu_2", "Trà đá .................... 3k", (0, 4.12, 2.3), 0.11, chalk, co)
    text_obj("menu_3", "Xôi gà ................... 12k", (0, 4.12, 2.12), 0.11, chalk, co)
    # bàn ghế phía trước (hậu cảnh khi quay ngược)
    tab = mat("CT_table", "#90caf9", 0.4)
    leg = mat("CT_leg", "#455a64", 0.4, metal=0.6)
    for (x, y) in ((-3.6, -1.2), (3.4, -1.4), (-3.4, -3.6), (3.2, -3.8)):
        box(f"table_{x}", (1.2, 0.7, 0.04), (x, y, 0.74), tab, co, bevel=0.01)
        for dx in (-0.52, 0.52):
            for dy in (-0.28, 0.28):
                cyl(f"tleg_{x}_{dx}_{dy}", 0.02, 0.72, (x + dx, y + dy, 0.36), leg, co)
        for dy in (-0.55, 0.55):
            cyl(f"stool_{x}_{dy}", 0.16, 0.04, (x, y + dy, 0.45), mat("CT_stool", "#ef5350", 0.5), co)
            cyl(f"stoolleg_{x}_{dy}", 0.025, 0.43, (x, y + dy, 0.22), leg, co)
    # QUẦY
    box("counter", (4.4, 0.7, TOP - 0.03), (0, 1.35, (TOP - 0.03) / 2), mat("CT_counter", "#ff8a65", 0.55), co, bevel=0.02)
    box("counter_top", (4.5, 0.76, 0.04), (0, 1.35, TOP - 0.02), mat("CT_marble", "#fafafa", 0.15), co, bevel=0.01)
    text_obj("counter_sign", "BÁNH TRÁNG TRỨNG", (1.05, 0.985, 0.6), 0.13, mat("CT_white", "#ffffff", 0.4), co, bold=True)
    # kệ phía sau cô Bảy
    box("shelf", (3.0, 0.4, 0.05), (0.8, 3.9, 1.5), mat("CT_frame", "#6d4c41", 0.5), co)
    for i, c in enumerate(("#ef5350", "#ffca28", "#66bb6a", "#42a5f5", "#ab47bc", "#ff7043")):
        cyl(f"jar_{i}", 0.08, 0.24, (-0.4 + i * 0.45, 3.9, 1.645), mat(f"CT_jar{i}", c, 0.25, alpha=0.85), co)
    A["tí"] = Vector((-0.45, 0.52, 0))
    A["co_bay"] = Vector((0.75, 2.15, 0))
    A["banh"] = BANH_C.copy()
    return A


def light_canteen():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("CT_world")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.75, 0.8, 0.9, 1)
    bg.inputs["Strength"].default_value = 0.45
    sc.world = w
    coll = new_coll("LIGHTS")

    def L(name, kind, loc, energy, color=(1, 1, 1), size=1.0, rot=(0, 0, 0), shadow=True, angle=None):
        ld = bpy.data.lights.new(name, kind)
        ld.energy = energy
        ld.color = color
        if kind == "AREA":
            ld.size = size
        if kind == "SUN" and angle is not None:
            ld.angle = math.radians(angle)
        ld.use_shadow = shadow
        ld.use_contact_shadow = shadow
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        ob.rotation_euler = rot
        coll.objects.link(ob)
        return ob
    L("sun", "SUN", (-5, -2, 6), 3.6, (1.0, 0.93, 0.82), rot=(math.radians(48), math.radians(-35), math.radians(-25)), angle=2.0)
    L("key_counter", "AREA", (0.2, -1.2, 3.0), 520, (1.0, 0.97, 0.92), size=2.6, rot=(math.radians(38), 0, 0))
    L("fill_back", "AREA", (0.5, 3.0, 3.1), 260, (1.0, 0.95, 0.85), size=3.0, rot=(math.radians(-25), 0, 0), shadow=False)
    L("machine_spot", "AREA", (-0.4, 0.9, 1.9), 40, (1.0, 0.95, 0.85), size=0.5, rot=(math.radians(35), 0, 0), shadow=False)
    return coll


# =============================== MÁY NƯỚNG 3.14 ===============================
def build_machine(coll=None):
    """Trả về dict tên → object. Gốc toạ độ thế giới (đặt sẵn trên quầy)."""
    co = coll or new_coll("MACHINE")
    O = {}
    steel = mat("CT_steel", "#cfd8dc", 0.28, metal=0.85)
    dark = mat("CT_dark", "#37474f", 0.4, metal=0.4)
    cx, cy = BANH_C.x, BANH_C.y
    base_h = 0.17
    O["base"] = box("m_base", (0.62, 0.5, base_h), (cx + 0.05, cy, TOP + base_h / 2), steel, co, bevel=0.015)
    O["plate"] = cyl("m_plate", 0.16, 0.012, (cx, cy, TOP + base_h + 0.006), dark, co, verts=48)
    # tháp điều khiển
    tx = cx + 0.30
    O["tower"] = box("m_tower", (0.2, 0.32, 0.42), (tx + 0.06, cy, TOP + 0.21), steel, co, bevel=0.015)
    O["brand"] = text_obj("m_brand", "MÁY NƯỚNG 3.14", (tx + 0.06, cy - 0.165, TOP + 0.395), 0.026, mat("CT_red", "#d32f2f", 0.4), co, bold=True)
    O["screen"] = box("m_screen", (0.17, 0.006, 0.085), (tx + 0.06, cy - 0.162, TOP + 0.33), mat("CT_lcd", "#0b1f14", 0.3, emit=0.4), co)
    O["btn_crisp"] = cyl("m_btn_crisp", 0.026, 0.02, (tx + 0.02, cy - 0.17, TOP + 0.22), mat("CT_btnred", "#e53935", 0.3, emit=0.4), co, rot=(math.pi / 2, 0, 0))
    O["btn_lid"] = cyl("m_btn_lid", 0.02, 0.02, (tx + 0.11, cy - 0.17, TOP + 0.22), mat("CT_btnblue", "#1e88e5", 0.3, emit=0.4), co, rot=(math.pi / 2, 0, 0))
    lab = mat("CT_lab", "#212121", 0.5)
    O["lab_crisp"] = text_obj("m_lab_crisp", "GIÒN TAN\nTHÀNH BỤI", (tx + 0.02, cy - 0.165, TOP + 0.165), 0.0125, lab, co, bold=True)
    O["lab_lid"] = text_obj("m_lab_lid", "BẬT NẮP", (tx + 0.11, cy - 0.165, TOP + 0.175), 0.0125, lab, co, bold=True)
    # chai tương ớt trên nóc tháp + máng nghiêng (giọt tương lăn)
    O["bottle"] = cyl("m_bottle", 0.03, 0.13, (tx + 0.11, cy + 0.06, TOP + 0.485), mat("CT_sauce", "#c62828", 0.25), co)
    cyl("m_cap", 0.012, 0.035, (tx + 0.11, cy + 0.06, TOP + 0.565), mat("CT_cap", "#ffffff", 0.3), co)
    O["drop"] = bpy.data.objects.new("m_drop", None)
    d = cyl("m_drop_mesh", 0.009, 0.014, (0, 0, 0), mat("CT_saucedrop", "#d50000", 0.15, emit=0.2), co, verts=16)
    d.scale = (1, 1, 1.25)
    O["drop"] = d
    d.location = (tx + 0.11, cy - 0.04, TOP + 0.43)
    d2 = cyl("m_drop2", 0.009, 0.014, (tx + 0.11, cy - 0.04, TOP + 0.43), mat("CT_saucedrop", "#d50000", 0.15, emit=0.2), co, verts=16)
    O["drop2"] = d2
    _hide(d2)
    # màn hình: các dòng chữ bật/tắt theo kịch bản
    lcd = mat("CT_lcdtxt", "#69f0ae", 0.4, emit=2.0)
    msgs = {"idle": "XIN CHÀO!", "forever": "ĐỘ GIÒN:\nVĨNH VIỄN", "p55": "CHỐT 55:\nQUẤN 1 VÒNG", "p56": "CHỐT 56:\nHÀN CUNG AB",
            "p57": "CHỐT 57:\nPHỦ KÍN MẶT", "p58": "CHỐT 58:\nRƯỚI HÌNH QUẠT", "p59": "CHỐT 59:\nVÒNG ĐỠ", "count3": "3", "count2": "2", "count1": "1", "ok": "MỞ KHOÁ!"}
    for k, t in msgs.items():
        ob = text_obj(f"m_msg_{k}", t, (tx + 0.06, cy - 0.167, TOP + 0.33), 0.022 if len(t) > 3 else 0.06, lcd, co, bold=True)
        O["msg_" + k] = ob
        _hide(ob, k != "idle")
    # NẮP KÍNH (bản lề ở mép sau) — gốc tại bản lề
    hinge = _empty("m_lid_hinge", (cx, cy + 0.19, TOP + base_h + 0.012), co)
    O["lid"] = hinge
    glass = mat("CT_glass", "#e1f5fe", 0.0, alpha=0.035)
    glass.node_tree.nodes["Principled BSDF"].inputs["Specular IOR Level"].default_value = 0.05
    lid = box("m_lid", (0.38, 0.38, 0.1), (cx, cy, TOP + base_h + 0.062), glass, co)
    frame_m = mat("CT_lidframe", "#90a4ae", 0.3, metal=0.7)
    for (sx, sy, lx, ly) in ((0.385, 0.008, 0, -0.19), (0.385, 0.008, 0, 0.19), (0.008, 0.385, -0.19, 0), (0.008, 0.385, 0.19, 0)):
        fr = box(f"m_lidf_{lx}_{ly}", (sx, sy, 0.008), (cx + lx, cy + ly, TOP + base_h + 0.11), frame_m, co)
        _parent(fr, hinge)
    rim = box("m_lid_rim", (0.39, 0.01, 0.01), (cx, cy - 0.19, TOP + base_h + 0.012), frame_m, co)
    _parent(lid, hinge)
    _parent(rim, hinge)
    hinge.rotation_euler = (math.radians(-70), 0, 0)    # mở sẵn lúc đầu
    # 5 CHỐT 55–59 ở mặt trước đế (đỏ = khoá, xanh = mở)
    red = mat("CT_pinred", "#ff1744", 0.3, emit=1.2)
    green = mat("CT_pingreen", "#00e676", 0.3, emit=1.4)
    tagm = mat("CT_tag", "#fffde7", 0.5)
    for i, n in enumerate((55, 56, 57, 58, 59)):
        x = cx - 0.2 + i * 0.075
        y = cy - 0.255
        bolt = cyl(f"m_pin{n}", 0.011, 0.05, (x, y, TOP + base_h + 0.03), red, co, verts=16)
        bolt_g = cyl(f"m_pin{n}_g", 0.011, 0.05, (x, y, TOP + base_h + 0.03), green, co, verts=16)
        _hide(bolt)            # lúc đầu chưa khoá
        _hide(bolt_g)
        tag = text_obj(f"m_tag{n}", str(n), (x, y - 0.002, TOP + 0.065), 0.026, tagm, co, bold=True)
        O[f"pin{n}"] = bolt
        O[f"pin{n}_g"] = bolt_g
        O[f"tag{n}"] = tag
    return O


# =============================== BÁNH TRÁNG TRỨNG ===============================
def build_banh(coll=None):
    """Bánh: nhóm có gốc tại tâm mặt bánh (empty 'banh'), các lớp phủ bật/tắt theo kịch bản."""
    co = coll or new_coll("BANH")
    O = {}
    root = _empty("banh", BANH_C, co)
    O["banh"] = root
    R = BANH_R
    layers = [
        ("banh_base", 0, R, 0, 2 * math.pi, 0.0, mat("CT_ricepaper", "#e0ad62", 0.6), 0.004),
        ("egg_ring", 0.06, R, 0, 2 * math.pi, 0.0015, mat("CT_egg", "#ff9800", 0.4), 0),
        ("egg_full", 0, R, 0, 2 * math.pi, 0.0016, mat("CT_egg", "#ff9800", 0.4), 0),
        # hình quạt 90° từ A (góc −135°) tới B (góc −45°), phía trước (máy quay ở −Y)
        ("sauce_q", 0, R * 0.98, math.radians(-135), math.radians(-45), 0.0025, mat("CT_saucefill", "#e53935", 0.35), 0),
    ]
    for nm, r0, r1, a0, a1, z, m, th in layers:
        ob = _disc(nm, r0, r1, a0, a1, z, m, co, thick=th)
        ob.location = BANH_C
        _parent(ob, root)
        O[nm] = ob
        if nm != "banh_base":
            _hide(ob)
    # hành phi, ruốc (lốm đốm) — xuất hiện cùng lớp trứng phủ kín
    sp = mat("CT_scallion", "#43a047", 0.5)
    for i in range(18):
        a, r = i * 2.4, 0.02 + (i * 0.37 % 1) * 0.07
        dot = cyl(f"banh_dot{i}", 0.0045, 0.003, BANH_C + Vector((r * math.cos(a), r * math.sin(a), 0.003)), sp, co, verts=8)
        _parent(dot, root)
        _hide(dot)
        O[f"dot{i}"] = dot
    # điểm A, B và cung AB (vệt hàn vàng)
    A_ = BANH_C + Vector((R * math.cos(math.radians(-135)), R * math.sin(math.radians(-135)), 0.004))
    B_ = BANH_C + Vector((R * math.cos(math.radians(-45)), R * math.sin(math.radians(-45)), 0.004))
    O["A"], O["B"] = A_, B_
    arc = [BANH_C + Vector((R * math.cos(t), R * math.sin(t), 0.005)) for t in [math.radians(-135 + 90 * i / 40) for i in range(41)]]
    weld = _curve("weld_arc", arc, co, 0.0022, "#ffd600", emit=3.0)
    weld.data.bevel_factor_end = 0.0
    _parent(weld, root)
    O["weld"] = weld
    # dấu chân gián: 6 hàng chấm theo dây AB
    fp = mat("CT_foot", "#4e342e", 0.6)
    feet = []
    for i in range(12):
        k = (i + 0.5) / 12
        p = A_.lerp(B_, k)
        for s in (-1, 1):
            dot = cyl(f"foot_{i}_{s}", 0.0028, 0.0015, p + Vector((0, s * 0.006, 0.0025)), fp, co, verts=8)
            _parent(dot, root)
            _hide(dot)
            feet.append(dot)
    O["feet"] = feet
    # đường dây đo bán kính (10 cm) + đoạn dây quấn hụt
    O["radius_wire"] = _curve("radius_wire", [BANH_C + Vector((0, 0, 0.007)), BANH_C + Vector((R, 0, 0.007))], co, 0.0032, "#ff3d00", emit=0.6)
    O["radius_wire"].data.bevel_factor_end = 0.0
    _parent(O["radius_wire"], root)
    short = [BANH_C + Vector((R * 1.04 * math.cos(t), R * 1.04 * math.sin(t), 0.008)) for t in [math.radians(-100 + 57.3 * i / 20) for i in range(21)]]
    O["short_wire"] = _curve("short_wire", short, co, 0.0032, "#ff3d00", emit=0.6)
    O["short_wire"].data.bevel_factor_end = 0.0
    _parent(O["short_wire"], root)
    # miếng 90° (cảnh cuối): ruột + vành mép (mép chia 8 khúc để "ăn dần")
    O["slice"] = _empty("slice", BANH_C, co)
    rest = _disc("banh_rest", 0, R, math.radians(-45), math.radians(225), 0.0025, mat("CT_egg", "#ff9800", 0.4), co, thick=0.006)
    rest.location = BANH_C
    restc = _disc("banh_rest_crust", R * 0.9, R, math.radians(-45), math.radians(225), 0.003, mat("CT_crust", "#bf7a2c", 0.5), co)
    restc.location = BANH_C
    O["rest_root"] = _empty("rest_root", BANH_C, co)
    _parent(rest, O["rest_root"])
    _parent(restc, O["rest_root"])
    _hide(rest)
    _hide(restc)
    O["rest"], O["rest_c"] = rest, restc
    inner = _disc("slice_inner", 0, R * 0.86, math.radians(-135), math.radians(-45), 0.0, mat("CT_egg", "#ff9800", 0.4), co, thick=0.004)
    inner.location = BANH_C
    _parent(inner, O["slice"])
    _hide(inner)
    O["slice_inner"] = inner
    crust = []
    for i in range(8):
        a0 = math.radians(-135 + 90 * i / 8)
        a1 = math.radians(-135 + 90 * (i + 1) / 8)
        c = _disc(f"crust_{i}", R * 0.86, R, a0, a1, 0.0, mat("CT_crust", "#bf7a2c", 0.5), co, thick=0.005)
        c.location = BANH_C
        _parent(c, O["slice"])
        _hide(c)
        crust.append(c)
    O["crust"] = crust
    return O


# =============================== GIÁN ĐIỆN ===============================
def build_gian(loc, coll=None):
    """Robot gián sáu chân (thân ~4 cm), chuông xe đạp trên lưng, máy chiếu sau lưng. Gốc = điểm chạm đất giữa bụng, mặt nhìn +X."""
    co = coll or new_coll("GIAN")
    loc = Vector(loc)
    root = _empty("gian", loc, co)
    shell = mat("CT_gshell", "#8d3f12", 0.25, metal=0.55)
    darkm = mat("CT_gdark", "#2b1d16", 0.4, metal=0.4)
    stripe = mat("CT_gstripe", "#ffb74d", 0.3, metal=0.7)

    def ell(name, c, r, m):
        ob = bpy.data.objects.new(name, bpy.data.meshes.new(name))
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=1.0)
        for v in bm.verts:
            v.co = Vector((v.co.x * r[0], v.co.y * r[1], v.co.z * r[2])) + Vector(c)
        bm.to_mesh(ob.data)
        bm.free()
        ob.data.materials.append(m)
        for p in ob.data.polygons:
            p.use_smooth = True
        co.objects.link(ob)
        ob.location = loc
        _parent(ob, root)
        return ob
    ell("gian_body", (-0.004, 0, 0.011), (0.02, 0.012, 0.007), shell)
    ell("gian_stripe", (-0.004, 0, 0.0125), (0.0185, 0.0035, 0.0062), stripe)
    ell("gian_head", (0.019, 0, 0.01), (0.0065, 0.0075, 0.0058), darkm)
    eye = mat("CT_geye", "#40c4ff", 0.2, emit=5.0)
    for sd in (-1, 1):
        ell(f"gian_eye{sd}", (0.0245, sd * 0.0038, 0.0122), (0.0021, 0.0021, 0.0021), eye)
        ant = _curve(f"gian_ant{sd}", [loc + Vector((0.023, sd * 0.003, 0.015)), loc + Vector((0.032, sd * 0.009, 0.027)), loc + Vector((0.04, sd * 0.016, 0.031))], co, 0.0007, "#2b1d16")
        _parent(ant, root)
    bell = cyl("gian_bell", 0.0058, 0.0035, loc + Vector((-0.006, 0, 0.0195)), mat("CT_bell", "#ffd54f", 0.15, metal=1.0), co, verts=18)
    _parent(bell, root)
    knob = cyl("gian_bellknob", 0.0016, 0.003, loc + Vector((-0.006, 0, 0.0225)), darkm, co, verts=8)
    _parent(knob, root)
    proj = cyl("gian_proj", 0.0028, 0.004, loc + Vector((-0.02, 0, 0.016)), mat("CT_proj", "#b3e5fc", 0.2, emit=3.0), co, verts=10)
    _parent(proj, root)
    legs = []
    for i, dx in enumerate((0.009, -0.002, -0.013)):
        for sd in (-1, 1):
            hip = loc + Vector((dx, sd * 0.009, 0.008))
            pivot = _empty(f"gian_leg{i}{sd}", hip, co)
            _parent(pivot, root)
            fw = (0.006, 0.0, -0.006)[i]
            seg = _curve(f"gian_legc{i}{sd}", [hip, hip + Vector((fw * 0.6, sd * 0.009, 0.006)), hip + Vector((fw, sd * 0.017, -0.008))], co, 0.0011, "#2b1d16")
            _parent(seg, pivot)
            legs.append((pivot, i, sd))
    beam = bpy.data.objects.new("gian_beam", bpy.data.meshes.new("gian_beam"))
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=False, segments=24, radius1=0.003, radius2=0.16, depth=0.4)
    for v in bm.verts:
        v.co.z += 0.2
    bm.to_mesh(beam.data)
    bm.free()
    beam.data.materials.append(mat("CT_beam", "#b3e5fc", 0.2, emit=2.5, alpha=0.22))
    co.objects.link(beam)
    beam.location = loc + Vector((-0.02, 0, 0.018))
    beam.rotation_euler = (0, math.radians(-40), 0)
    _parent(beam, root)
    _hide(beam)
    root.scale = (1.15, 1.15, 1.15)
    return dict(gian=root, legs=legs, bell=bell, proj=proj, beam=beam)


# =============================== ĐẠO CỤ KHÁC ===============================
def build_misc(coll=None):
    co = coll or new_coll("MISC")
    O = {}
    # cuộn dây cách nhiệt (cô Bảy quăng cho Tí)
    reel = cyl("wire_reel", 0.05, 0.035, (0.55, 1.45, TOP + 0.02), mat("CT_reel", "#ff6d00", 0.4), co, rot=(math.pi / 2, 0, 0), verts=24)
    O["reel"] = reel
    # bộ ria bằng dây (gắn lên mặt Tí bằng hành động 'attach')
    ria = sm_env.chalk_curve("ria", [(-0.05, 0, 0.0), (-0.025, 0, 0.012), (0, 0, 0.004), (0.025, 0, 0.012), (0.05, 0, 0.0)], co, width=0.0055, color="#ff6d00")
    _hide(ria)
    O["ria"] = ria
    # thau nước rửa chén + vệt tương trên sàn
    O["basin"] = cyl("basin", 0.32, 0.16, (-1.35, -0.25, 0.08), mat("CT_basin", "#1e88e5", 0.3), co, verts=40)
    w = cyl("basin_water", 0.3, 0.01, (-1.35, -0.25, 0.15), mat("CT_water", "#b3e5fc", 0.05, alpha=0.7), co, verts=40)
    O["water"] = w
    pud = cyl("sauce_puddle", 0.22, 0.004, (-0.75, 0.05, 0.003), mat("CT_saucefill", "#e53935", 0.35), co, verts=32)
    pud.scale = (1.8, 0.6, 1)
    _hide(pud)
    O["puddle"] = pud
    # vòng đỡ phô mai (máy đẩy ra đúng điểm rơi)
    tor = bpy.data.objects.new("cheese_ring", bpy.data.meshes.new("cheese_ring"))
    bm = bmesh.new()
    segs, rsegs, R1, r1 = 40, 12, 0.12, 0.022
    rings = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        ring = []
        for j in range(rsegs):
            b = 2 * math.pi * j / rsegs
            ring.append(bm.verts.new(((R1 + r1 * math.cos(b)) * math.cos(a), (R1 + r1 * math.cos(b)) * math.sin(a), r1 * math.sin(b))))
        rings.append(ring)
    for i in range(segs):
        for j in range(rsegs):
            bm.faces.new((rings[i][j], rings[(i + 1) % segs][j], rings[(i + 1) % segs][(j + 1) % rsegs], rings[i][(j + 1) % rsegs]))
    bm.to_mesh(tor.data)
    bm.free()
    tor.data.materials.append(mat("CT_cheese", "#ffd54f", 0.35))
    for p in tor.data.polygons:
        p.use_smooth = True
    co.objects.link(tor)
    tor.location = (0.6, 1.35, TOP + 0.05)
    tor.scale = (0.01, 0.01, 0.01)
    O["ring"] = tor
    # hộp của cô Bảy
    O["box"] = box("co_box", (0.22, 0.16, 0.08), (1.25, 1.3, TOP + 0.04), mat("CT_boxm", "#a1887f", 0.6), co, bevel=0.006)
    # dao nhựa
    O["knife"] = box("knife", (0.012, 0.16, 0.004), (0.2, 1.1, TOP + 0.004), mat("CT_knife", "#eceff1", 0.3, metal=0.5), co)
    return O
