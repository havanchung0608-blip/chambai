"""sm_env — bối cảnh 3D, đạo cụ, bảng phấn (vẽ dần kiểu Manim) cho Stickman 3D Studio."""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler

FONT_SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
FONT_SERIF_B = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"


def lin(h):
    h = h.lstrip("#")
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))


def mat(name, color, rough=0.5, metal=0.0, emit=0.0, alpha=1.0, transmission=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    c = lin(color) if isinstance(color, str) else color
    b.inputs["Base Color"].default_value = (*c, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*c, 1)
        b.inputs["Emission Strength"].default_value = emit
    if alpha < 1 or transmission:
        b.inputs["Alpha"].default_value = alpha
        b.inputs["Transmission Weight"].default_value = transmission
        m.blend_method = "BLEND"
        m.shadow_method = "NONE" if alpha < 0.3 else "HASHED"
    m.diffuse_color = (*c, 1)
    return m


def wood_mat(name="SM_wood_floor", c1="#a0703f", c2="#7a5230", scale=6.0, rough=0.32):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale * 0.15, 1)
    wv = nt.nodes.new("ShaderNodeTexWave")
    wv.inputs["Scale"].default_value = 2.0
    wv.inputs["Distortion"].default_value = 6.0
    wv.inputs["Detail"].default_value = 3.0
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 40
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*lin(c1), 1)
    mix.inputs[7].default_value = (*lin(c2), 1)
    # vân sàn ghép ván: dùng Brick để tạo các tấm
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 1.2
    br.inputs["Mortar Size"].default_value = 0.006
    br.inputs["Color1"].default_value = (1, 1, 1, 1)
    br.inputs["Color2"].default_value = (0.82, 0.82, 0.82, 1)
    br.inputs["Mortar"].default_value = (0.25, 0.25, 0.25, 1)
    br.offset = 0.5
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"
    mul.blend_type = "MULTIPLY"
    mul.inputs[0].default_value = 1.0
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], wv.inputs["Vector"])
    nt.links.new(wv.outputs["Fac"], mix.inputs[0])
    nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
    nt.links.new(mix.outputs[2], mul.inputs[6])
    nt.links.new(br.outputs["Color"], mul.inputs[7])
    nt.links.new(mul.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*lin(c1), 1)
    return m


def box(name, size, loc, material, coll, rot=(0, 0, 0), bevel=0.0):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    me.materials.append(material)
    coll.objects.link(ob)
    if bevel:
        md = ob.modifiers.new("Bevel", "BEVEL")
        md.width = bevel
        md.segments = 2
    return ob


def cyl(name, r, h, loc, material, coll, rot=(0, 0, 0), verts=24):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=h)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.rotation_euler = rot
    me.materials.append(material)
    coll.objects.link(ob)
    return ob


def text_obj(name, body, loc, size, material, coll, rot=(math.pi / 2, 0, 0), align="CENTER", bold=False, extrude=0.002):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    try:
        cu.font = bpy.data.fonts.load(FONT_SERIF_B if bold else FONT_SERIF, check_existing=True)
    except Exception:
        pass
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.extrude = extrude
    ob = bpy.data.objects.new(name, cu)
    ob.location = loc
    ob.rotation_euler = rot
    cu.materials.append(material)
    coll.objects.link(ob)
    return ob


def new_coll(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


# =============================== LỚP HỌC ===============================
def build_classroom():
    """Lớp học: sàn gỗ phản chiếu, cửa sổ trái có nắng chiếu xiên, bảng phấn xanh, bàn GV, bàn HS.
    Trả về dict 'anchors' (toạ độ quan trọng cho kịch bản / máy quay)."""
    C = new_coll("ENV_classroom")
    W0, W1, D0, D1, H = -5.0, 5.0, -6.5, 3.2, 3.3
    wall = mat("SM_wall", "#efe3cf", 0.85)
    wall2 = mat("SM_wall_low", "#b9d3c9", 0.8)
    ceil = mat("SM_ceiling", "#f7f5f0", 0.9)
    frame = mat("SM_frame_wood", "#7b4a26", 0.5)
    board_m = mat("SM_chalkboard", "#1f3d30", 0.75)
    glass = mat("SM_glass", "#cfe8ff", 0.05, alpha=0.12)
    sky = mat("SM_sky_out", "#bfe3ff", 1.0, emit=2.2)
    desk_m = mat("SM_desk", "#c89b6d", 0.45)
    metal = mat("SM_metal", "#9aa3ad", 0.3, metal=1.0)
    floor = box("floor", (W1 - W0, D1 - D0, 0.1), ((W0 + W1) / 2, (D0 + D1) / 2, -0.05), wood_mat(), C)
    box("ceiling", (W1 - W0, D1 - D0, 0.1), ((W0 + W1) / 2, (D0 + D1) / 2, H + 0.05), ceil, C)
    # tường sau (bảng) + chân tường
    box("wall_back", (W1 - W0, 0.2, H), ((W0 + W1) / 2, D1 + 0.1, H / 2), wall, C)
    box("wall_back_low", (W1 - W0, 0.05, 1.0), ((W0 + W1) / 2, D1 - 0.025, 0.5), wall2, C)
    box("wall_front", (W1 - W0, 0.2, H), ((W0 + W1) / 2, D0 - 0.1, H / 2), wall, C)
    # tường phải + cửa ra vào (ô trống ở y 1.0..2.2)
    door_y0, door_y1 = 0.9, 2.1
    box("wall_right_a", (0.2, door_y0 - D0, H), (W1 + 0.1, (D0 + door_y0) / 2, H / 2), wall, C)
    box("wall_right_b", (0.2, D1 - door_y1, H), (W1 + 0.1, (door_y1 + D1) / 2, H / 2), wall, C)
    box("wall_right_top", (0.2, door_y1 - door_y0, H - 2.3), (W1 + 0.1, (door_y0 + door_y1) / 2, 2.3 + (H - 2.3) / 2), wall, C)
    box("door_frame_a", (0.24, 0.08, 2.3), (W1 + 0.1, door_y0, 1.15), frame, C)
    box("door_frame_b", (0.24, 0.08, 2.3), (W1 + 0.1, door_y1, 1.15), frame, C)
    box("door_leaf", (1.15, 0.05, 2.25), (W1 + 0.6, door_y1 - 0.05, 1.125), mat("SM_door", "#8d5a34", 0.5), C, rot=(0, 0, math.radians(70)))
    box("hall", (0.1, 4, H), (W1 + 2.2, 1.5, H / 2), mat("SM_hall", "#e8dcc4", 0.9), C)
    # tường trái có 3 cửa sổ
    win_y = [(-4.6, -3.0), (-2.0, -0.4), (0.6, 2.2)]
    z0, z1 = 0.95, 2.45
    ys = [D0] + [v for w in win_y for v in w] + [D1]
    for i in range(0, len(ys), 2):
        a, b = ys[i], ys[i + 1]
        if b - a > 0.01:
            box(f"wall_left_p{i}", (0.2, b - a, H), (W0 - 0.1, (a + b) / 2, H / 2), wall, C)
    for i, (a, b) in enumerate(win_y):
        box(f"wall_left_lo{i}", (0.2, b - a, z0), (W0 - 0.1, (a + b) / 2, z0 / 2), wall, C)
        box(f"wall_left_hi{i}", (0.2, b - a, H - z1), (W0 - 0.1, (a + b) / 2, z1 + (H - z1) / 2), wall, C)
        box(f"win_glass{i}", (0.02, b - a, z1 - z0), (W0 - 0.1, (a + b) / 2, (z0 + z1) / 2), glass, C)
        box(f"win_bar{i}", (0.06, 0.05, z1 - z0), (W0 - 0.08, (a + b) / 2, (z0 + z1) / 2), frame, C)
        box(f"win_sill{i}", (0.3, b - a + 0.1, 0.05), (W0 + 0.02, (a + b) / 2, z0), frame, C)
    sky_pl = box("sky_outside", (0.05, 30, 12), (W0 - 6, -1.5, 3), sky, C)
    sky_pl.visible_shadow = False
    # cây ngoài cửa sổ (mảng xanh)
    for i, (y, z, r) in enumerate([(-3.5, 2.2, 1.6), (0.5, 2.6, 1.9), (2.8, 1.9, 1.3)]):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=(W0 - 3.5, y, z))
        t = bpy.context.object
        for cc in t.users_collection:
            cc.objects.unlink(t)
        C.objects.link(t)
        t.data.materials.append(mat("SM_tree_out", "#5fa35a", 0.9))
    # bảng phấn
    bw, bh, bz = 4.2, 1.35, 1.65
    by = D1 - 0.06
    box("board", (bw, 0.04, bh), (-0.3, by, bz), board_m, C)
    for nm, s, l in (("board_fr_t", (bw + 0.12, 0.08, 0.06), (-0.3, by - 0.01, bz + bh / 2 + 0.03)),
                     ("board_fr_b", (bw + 0.12, 0.08, 0.06), (-0.3, by - 0.01, bz - bh / 2 - 0.03)),
                     ("board_fr_l", (0.06, 0.08, bh + 0.12), (-0.3 - bw / 2 - 0.03, by - 0.01, bz)),
                     ("board_fr_r", (0.06, 0.08, bh + 0.12), (-0.3 + bw / 2 + 0.03, by - 0.01, bz))):
        box(nm, s, l, frame, C)
    box("chalk_tray", (bw, 0.12, 0.03), (-0.3, by - 0.08, bz - bh / 2 - 0.07), frame, C)
    for i in range(3):
        cyl(f"chalk{i}", 0.008, 0.08, (-1.6 + i * 0.12, by - 0.09, bz - bh / 2 - 0.045), mat("SM_chalk_stick", "#f5f5ef", 0.9), C, rot=(0, math.pi / 2, 0.3 * i))
    # đồng hồ treo tường
    cyl("clock", 0.22, 0.04, (2.9, D1 - 0.03, 2.7), mat("SM_clock", "#ffffff", 0.4), C, rot=(math.pi / 2, 0, 0))
    cyl("clock_rim", 0.235, 0.03, (2.9, D1 - 0.01, 2.7), mat("SM_dark", "#263238", 0.4), C, rot=(math.pi / 2, 0, 0))
    box("clock_h", (0.02, 0.01, 0.11), (2.9, D1 - 0.06, 2.75), mat("SM_dark", "#263238", 0.4), C, rot=(0, math.radians(-30), 0))
    box("clock_m", (0.015, 0.01, 0.17), (2.95, D1 - 0.06, 2.72), mat("SM_dark", "#263238", 0.4), C, rot=(0, math.radians(60), 0))
    # tranh trên tường phải
    box("poster", (0.02, 0.9, 0.65), (W1 - 0.02, -2.0, 1.8), mat("SM_poster", "#ffcc80", 0.7), C)
    # bàn giáo viên
    dx, dy = 2.75, 1.35
    box("tdesk_top", (1.3, 0.65, 0.05), (dx, dy, 0.76), desk_m, C, bevel=0.01)
    box("tdesk_front", (1.3, 0.03, 0.6), (dx, dy - 0.31, 0.43), desk_m, C)
    for sx in (-1, 1):
        box(f"tdesk_side{sx}", (0.04, 0.6, 0.72), (dx + sx * 0.62, dy, 0.37), desk_m, C)
    # bàn ghế học sinh (3 cột × 3 hàng)
    sd = mat("SM_sdesk", "#d9b48a", 0.45)
    chair = mat("SM_chair", "#5c6bc0", 0.5)
    for ix, x in enumerate((-2.6, -0.3, 2.0)):
        for iy, y in enumerate((-0.9, -2.6, -4.3)):
            box(f"sdesk_{ix}{iy}", (1.2, 0.5, 0.04), (x, y, 0.72), sd, C, bevel=0.008)
            for lx in (-0.55, 0.55):
                for ly in (-0.2, 0.2):
                    cyl(f"sdesk_leg{ix}{iy}{lx}{ly}", 0.018, 0.7, (x + lx, y + ly, 0.35), metal, C, verts=8)
            box(f"chair_{ix}{iy}", (0.42, 0.4, 0.04), (x, y - 0.55, 0.45), chair, C, bevel=0.008)
            box(f"chairb_{ix}{iy}", (0.42, 0.04, 0.4), (x, y - 0.76, 0.68), chair, C, bevel=0.008)
    # đèn trần
    lamp = mat("SM_lamp", "#ffffff", 0.3, emit=4.0)
    for x in (-2.5, 0.5, 3.0):
        for y in (-3.5, 0.0):
            box(f"lamp_{x}_{y}", (1.2, 0.3, 0.04), (x, y, H - 0.03), lamp, C)
    anchors = dict(
        board_center=Vector((-0.3, by - 0.021, bz)), board_normal=Vector((0, -1, 0)), board_size=(bw, bh),
        board_y=by - 0.021, door_out=Vector((W1 + 1.4, 1.5, 0)), door_in=Vector((W1 - 0.6, 1.5, 0)),
        desk_top=Vector((dx, dy, 0.785)), desk_behind=Vector((dx, dy + 0.62, 0)), room=(W0, W1, D0, D1, H),
        window_x=W0, floor_z=0.0)
    return anchors


def build_studio(color="#dfe6ee"):
    """Phông studio vô cực (cyclorama) — dùng cho phim nhân vật, trình diễn động tác."""
    C = new_coll("ENV_studio")
    me = bpy.data.meshes.new("cyclo")
    bm = bmesh.new()
    R, Wd = 3.0, 30.0
    prof = [(-12, 0)] + [(R * math.sin(a), R - R * math.cos(a)) for a in [i * math.pi / 2 / 12 for i in range(13)]] + [(R, 12)]
    rows = []
    for x in (-Wd / 2, Wd / 2):
        rows.append([bm.verts.new((x, 8 + p[0], p[1])) for p in prof])
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("cyclo", me)
    me.materials.append(mat("SM_cyclo", color, 0.6))
    C.objects.link(ob)
    return dict(floor_z=0.0, board_center=None)


# =============================== ĐẠO CỤ ===============================
def build_compass(name, radius, coll=None):
    """Compa 3D mở sẵn theo bán kính 'radius'. Gốc đối tượng = đầu kim; trục Z cục bộ = pháp tuyến
    mặt vẽ (hướng ra ngoài); đầu phấn nằm tại (radius, 0, 0). Trả về (root_empty, handle_local)."""
    coll = coll or new_coll(f"PROP_{name}")
    L = max(0.32, radius * 0.78)
    h = math.sqrt(max(L * L - (radius / 2) ** 2, 0.01))
    hinge = Vector((radius / 2, 0, h))
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = "ARROWS"
    root.empty_display_size = 0.05
    coll.objects.link(root)
    metal = mat("SM_compass_metal", "#cfd8dc", 0.2, metal=1.0)
    red = mat("SM_compass_red", "#e53935", 0.35)
    chalk = mat("SM_chalk_line", "#f8f8f2", 0.8, emit=0.15)

    def rod(nm, a, b, r, m):
        a, b = Vector(a), Vector(b)
        d = b - a
        ob = cyl(nm, r, d.length, (a + b) / 2, m, coll, verts=12)
        ob.rotation_mode = "QUATERNION"
        ob.rotation_quaternion = d.to_track_quat("Z", "Y")
        ob.parent = root
        return ob
    rod(f"{name}_legA", hinge, (0, 0, 0.012), 0.013, metal)
    rod(f"{name}_needle", (0, 0, 0.014), (0, 0, 0.0), 0.002, metal)
    rod(f"{name}_legB", hinge, (radius, 0, 0.05), 0.013, metal)
    rod(f"{name}_holder", (radius, 0, 0.075), (radius, 0, 0.035), 0.02, red)
    rod(f"{name}_chalk", (radius, 0, 0.04), (radius, 0, 0.0), 0.009, chalk)
    rod(f"{name}_handle", hinge, hinge + Vector((0, 0, 0.09)), 0.016, red)
    hub = cyl(f"{name}_hub", 0.03, 0.04, hinge, red, coll, rot=(math.pi / 2, 0, 0))
    hub.parent = root
    root["handle_local"] = list(hinge + Vector((0, 0, 0.07)))
    return root


def build_board_drawing(anchors, coll=None):
    """Tạo các nét phấn: đường tròn, bán kính, đường kính, nhãn. Trả về dict đối tượng."""
    coll = coll or new_coll("BOARD_draw")
    return coll


def chalk_curve(name, pts, coll, closed=False, width=0.009, color="#f8f8f2"):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = width
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (p[0], p[1], p[2], 1)
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu)
    cu.materials.append(mat("SM_chalk_line" if color == "#f8f8f2" else f"SM_chalk_{color}", color, 0.85, emit=0.25))
    coll.objects.link(ob)
    cu.bevel_factor_mapping_end = "SPLINE"
    return ob


def board_point(anchors, u, v, lift=0.004):
    """(u,v) trên mặt bảng (mét, gốc = tâm bảng, u sang phải, v lên trên) → toạ độ thế giới."""
    c = anchors["board_center"]
    return Vector((c.x + u, c.y - lift, c.z + v))


def animate_reveal(ob, f0, f1, ease=True):
    cu = ob.data
    cu.bevel_factor_end = 0.0
    cu.keyframe_insert("bevel_factor_end", frame=f0)
    cu.bevel_factor_end = 1.0
    cu.keyframe_insert("bevel_factor_end", frame=f1)
    if cu.animation_data and cu.animation_data.action:
        for fc in cu.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER" if ease else "LINEAR"
    ob.hide_render = False
    ob.hide_viewport = False


def pop_in(ob, f0, dur=8, s=1.0):
    ob.scale = (0.001, 0.001, 0.001)
    ob.keyframe_insert("scale", frame=f0)
    ob.scale = (s * 1.18,) * 3
    ob.keyframe_insert("scale", frame=f0 + int(dur * 0.65))
    ob.scale = (s,) * 3
    ob.keyframe_insert("scale", frame=f0 + dur)


# =============================== HIỆU ỨNG MÔI TRƯỜNG ===============================
def dust_motes(center, size, count=400, coll=None):
    """Bụi lơ lửng trong vệt nắng (particle + chuyển động Brown)."""
    coll = coll or new_coll("FX_dust")
    em = box("dust_emitter", size, center, mat("SM_invis", "#000000", 1, alpha=0.0), coll)
    em.hide_render = False
    em.display_type = "WIRE"
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.0016, location=(0, 0, -20))
    mote = bpy.context.object
    for c in mote.users_collection:
        c.objects.unlink(mote)
    coll.objects.link(mote)
    mote.data.materials.append(mat("SM_mote", "#fff4d6", 0.5, emit=1.5))
    ps = em.modifiers.new("dust", "PARTICLE_SYSTEM").particle_system
    st = ps.settings
    st.count = count
    st.frame_start = -200
    st.frame_end = -199
    st.lifetime = 5000
    st.emit_from = "VOLUME"
    st.physics_type = "NEWTON"
    st.effector_weights.gravity = 0.0
    st.brownian_factor = 0.02
    st.normal_factor = 0.0
    st.render_type = "OBJECT"
    st.instance_object = mote
    st.particle_size = 1.0
    st.size_random = 0.6
    em.show_instancer_for_render = False
    return em


def chalk_puff(pos, f0, coll=None, n=40):
    """Bụi phấn bung ra khi phấn chạm bảng."""
    coll = coll or new_coll("FX_chalk")
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.01, location=pos)
    em = bpy.context.object
    for c in em.users_collection:
        c.objects.unlink(em)
    coll.objects.link(em)
    em.hide_render = False
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.003, location=(0, 0, -20))
    grain = bpy.context.object
    for c in grain.users_collection:
        c.objects.unlink(grain)
    coll.objects.link(grain)
    grain.data.materials.append(mat("SM_chalk_dust", "#ffffff", 0.9, emit=0.5))
    ps = em.modifiers.new("puff", "PARTICLE_SYSTEM").particle_system
    st = ps.settings
    st.count = n
    st.frame_start = f0
    st.frame_end = f0 + 3
    st.lifetime = 30
    st.normal_factor = 0.15
    st.factor_random = 0.25
    st.effector_weights.gravity = 0.15
    st.render_type = "OBJECT"
    st.instance_object = grain
    em.show_instancer_for_render = False
    return em


def rain(area=(20, 20), height=8, count=3000, coll=None):
    """Mưa (thời tiết) — hạt kéo dài theo vận tốc."""
    coll = coll or new_coll("FX_rain")
    em = box("rain_emitter", (area[0], area[1], 0.01), (0, 0, height), mat("SM_invis", "#000000", 1, alpha=0.0), coll)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.25, location=(0, 0, -30))
    drop = bpy.context.object
    for c in drop.users_collection:
        c.objects.unlink(drop)
    coll.objects.link(drop)
    drop.data.materials.append(mat("SM_rain", "#cfe3ff", 0.1, alpha=0.5))
    ps = em.modifiers.new("rain", "PARTICLE_SYSTEM").particle_system
    st = ps.settings
    st.count = count
    st.frame_start = -60
    st.frame_end = 2000
    st.lifetime = 60
    st.normal_factor = -6.0
    st.render_type = "OBJECT"
    st.instance_object = drop
    st.use_rotations = True
    st.rotation_mode = "VEL"
    em.show_instancer_for_render = False
    return em
