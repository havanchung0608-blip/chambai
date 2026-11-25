"""build_scene — chạy trong Blender: đọc production.json → dựng bối cảnh, nhân vật, đạo cụ, chuyển động,
máy quay, ánh sáng → lưu .blend + timeline.json (mốc thời gian lời thoại, sự kiện âm thanh, QA).

    blender -b --python build_scene.py -- production.json out.blend timeline.json

Kịch bản là danh sách "actions" chạy TUẦN TỰ (action sau bắt đầu khi action trước xong) trừ khi
có "with": true (chạy song song với action liền trước) hoặc "time" (giây tuyệt đối).
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy  # noqa: E402
from mathutils import Matrix, Vector, Quaternion  # noqa: E402
import sm_rig  # noqa: E402
import sm_anim  # noqa: E402
import sm_env  # noqa: E402
import sm_cine  # noqa: E402
import sm_canteen  # noqa: E402
from sm_anim import Actor, bake_actor, smooth, ease_io, clamp, lerp, angle_to, yaw_vec  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:]
PROD, OUT_BLEND, OUT_TL = argv[0], argv[1], argv[2]
prod = json.load(open(PROD, encoding="utf-8"))
FPS = prod.get("fps", 30)
QUAL = prod.get("quality", "cpu")
MAXF = int(prod.get("max_seconds", 120) * FPS)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
cam_frames = None

# ---------------- bối cảnh ----------------
env_name = prod.get("environment", "classroom")
OBJ = {}          # tên → object Blender (đạo cụ điều khiển bằng hành động "anim")
if env_name == "canteen":
    anchors = sm_canteen.build_canteen()
    MACH = sm_canteen.build_machine()
    BANH = sm_canteen.build_banh()
    GIAN = sm_canteen.build_gian(prod.get("gian_start", (0.3, 1.25, sm_canteen.TOP)))
    MISC = sm_canteen.build_misc()
    for dct in (MACH, BANH, MISC):
        for k, v in dct.items():
            if hasattr(v, "name"):
                OBJ[k] = v
    OBJ["gian"] = GIAN["gian"]
    OBJ["bell"] = GIAN["bell"]
    OBJ["beam"] = GIAN["beam"]
    for (pv, i, sd) in GIAN["legs"]:
        OBJ[pv.name] = pv
    for i, f in enumerate(BANH["feet"]):
        OBJ[f"feet{i}"] = f
    for i, c in enumerate(BANH["crust"]):
        OBJ[f"crust{i}"] = c
    anchors["A_pt"], anchors["B_pt"] = BANH["A"], BANH["B"]
elif env_name == "classroom":
    anchors = sm_env.build_classroom()
else:
    anchors = sm_env.build_studio()


def P3(p):
    """Điểm 3D: [x,y,z] | tên anchor | 'banh+[dx,dy,dz]'."""
    if isinstance(p, str):
        return anchors[p].copy()
    return Vector(p)


_KF_INIT = set()


def kf(ob, path, frame, value, interp="BEZIER"):
    """Keyframe có khoá trạng thái ban đầu ở frame 1 (để giá trị trước lần đổi đầu tiên không bị 'kéo' theo)."""
    tgt = ob.data if path == "bevel_factor_end" else ob
    key = (tgt.name, path)
    if key not in _KF_INIT:
        _KF_INIT.add(key)
        if frame > 1:
            tgt.keyframe_insert(path, frame=1)
    if path == "hide_render":
        tgt.hide_render = bool(value)
        tgt.hide_viewport = bool(value)
    elif path == "bevel_factor_end":
        tgt.bevel_factor_end = value
    else:
        setattr(tgt, path, value)
    tgt.keyframe_insert(path, frame=frame)
    ad = tgt.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            if fc.data_path == path:
                for kp in fc.keyframe_points:
                    if abs(kp.co[0] - frame) < 0.5:
                        kp.interpolation = "CONSTANT" if path == "hide_render" else interp


ATTACH = []


def resolve_point(p):
    """Điểm 2D: [x,y] hoặc tên anchor."""
    if isinstance(p, str):
        v = anchors[p]
        return (v.x, v.y)
    return (p[0], p[1])


# ---------------- nhân vật ----------------
actors = {}
arms = {}
for i, (cid, c) in enumerate(prod["characters"].items()):
    start = resolve_point(c.get("start", [0, 0]))
    heading = c.get("heading", 0.0)
    arm = sm_rig.build_character(cid, c.get("spec", {}), location=(0, 0, 0), heading=0)
    arm.location = (0, 0, 0)
    arm.rotation_euler = (0, 0, 0)
    arms[cid] = arm
    actors[cid] = Actor(arm, FPS, MAXF, pos=start, heading=heading, seed=7 + i * 13)

# ---------------- đạo cụ ----------------
props = {}
for pid, p in prod.get("props", {}).items():
    if p["type"] == "compass":
        root = sm_env.build_compass(pid, p.get("radius", 0.4))
        at = Vector(p.get("at", (2.6, 1.6, 0.785)))
        yaw = p.get("yaw", 0.0)
        # đặt đứng trên mặt bàn: Z cục bộ = lên trên
        M = Matrix.Translation(at) @ Matrix.Rotation(yaw, 4, "Z")
        root.matrix_world = M
        props[pid] = dict(obj=root, radius=p.get("radius", 0.4), segs=[("static", 0, M.copy())], handle=Vector(root["handle_local"]))

board_coll = sm_env.new_coll("BOARD_draw")


def board_M(center_uv, theta, lift=0.004):
    """Ma trận compa trên bảng: gốc tại tâm, Z = pháp tuyến bảng (-Y), X hướng tới đầu phấn (góc theta)."""
    c = sm_env.board_point(anchors, center_uv[0], center_uv[1], lift)
    X = Vector((math.cos(theta), 0, math.sin(theta)))
    Z = Vector((0, -1, 0))
    Y = Z.cross(X)
    R = Matrix((X, Y, Z)).transposed()
    return Matrix.Translation(c) @ R.to_4x4()


# ---------------- chạy kịch bản ----------------
cursor = 0              # frame hiện tại của mạch chính
prev_start = 0
timeline = dict(fps=FPS, lines=[], events=[], board=[], shots=[], actions=[])
camdir = None
cam = sm_cine.make_camera()
shots = []
board_items = []
hold_state = {}   # prop -> (who, side)


def sec(x):
    return int(round(x * FPS))


for idx, a in enumerate(prod["actions"]):
    do = a["do"]
    if "time" in a:
        f0 = sec(a["time"])
    elif a.get("with"):
        f0 = prev_start + sec(a.get("offset", 0))
    else:
        f0 = cursor + sec(a.get("delay", 0))
    who = a.get("who")
    A = actors.get(who) if who else None
    f1 = f0
    if do == "walk":
        path = [resolve_point(p) for p in a["to"]]
        end_yaw = None
        if "face" in a:
            fa = a["face"]
            if isinstance(fa, (int, float)):
                end_yaw = fa
            elif fa == "camera":
                end_yaw = 0.0
            elif fa == "board":
                end_yaw = math.pi
            else:
                end_yaw = angle_to(path[-1], resolve_point(fa))
        f1 = A.walk(f0, path, a.get("gait", "walk"), end_yaw=end_yaw, speed=a.get("speed", 1.0))
    elif do == "turn":
        fa = a["face"]
        yaw = 0.0 if fa == "camera" else math.pi if fa == "board" else fa if isinstance(fa, (int, float)) else angle_to(tuple(A.root[f0])[:2], resolve_point(fa))
        f1 = A.turn(f0, yaw, a.get("dur", 0.6))
    elif do == "jump":
        f1 = A.jump(f0, a.get("to"), a.get("height", 0.35))
    elif do == "gesture":
        f1 = f0 + sec(a.get("dur", 1.5))
        A.gesture(f0, f1, a["name"], hands=a.get("hands"))
    elif do == "emote":
        f1 = f0 + sec(a.get("dur", 1.5))
        A.emote(f0, f1, a["keys"])
    elif do == "look":
        f1 = f0 + sec(a.get("dur", 1.5))
        tgt = a["at"]
        if tgt == "camera":
            A.look(f0, f1, lambda f: Vector(cam_frames[f]["pos"]) if cam_frames else Vector((0, -5, 1.6)))
        elif tgt == "board":
            A.look(f0, f1, anchors["board_center"])
        else:
            A.look(f0, f1, Vector(tgt))
    elif do == "say":
        n = len(a["env"])
        f1 = f0 + n
        A.speak(f0, a["env"], gest=a.get("gesture_auto", True))
        if a.get("emotion"):
            A.emote(f0, f1, a["emotion"])
        if a.get("gesture"):
            A.gesture(f0, f1, a["gesture"], hands=a.get("hands"))
        timeline["lines"].append(dict(id=a["id"], who=who, f0=f0, f1=f1, text=a.get("sub") or a["text"]))
    elif do == "pick":
        P = props[a["prop"]]
        side = a.get("hand", "R")
        M = P["segs"][-1][2]
        handle_w = M @ P["handle"]
        fg = f0 + sec(0.75)          # khoảnh khắc nắm được
        f1 = fg + sec(0.45)
        A.reach(f0, fg + sec(0.05), side, lambda f, hw=handle_w: hw + Vector((0, 0, 0.02)), fin=0.6, fout=0.45, crouch=a.get("crouch", 0.12), lean=a.get("lean", 0.25))
        if a.get("hold_for", 0) > 0:
            A.gesture(fg, fg + sec(a["hold_for"]), "hold_prop" if side == "R" else "hold_prop_L", hands=[side])
        P["segs"].append(("hand", fg, who, side))
        A.events.append((fg, "grab", {"who": who}))
        hold_state[a["prop"]] = (who, side, fg)
    elif do == "place_on_board":
        P = props[a["prop"]]
        side = a.get("hand", "R")
        cuv = a["center"]
        th0 = a.get("theta0", 0.0)
        Mb = board_M(cuv, th0)
        handle_w = Mb @ P["handle"]
        fp = f0 + sec(a.get("dur", 0.9))
        A.reach(f0, fp + sec(a.get("hold", 0.0)), side, lambda f, hw=handle_w: hw, fin=a.get("dur", 0.9) * 0.9, fout=0.3, lean=0.08)
        P["segs"].append(("to_board", f0, fp, who, side, Mb))
        P["board"] = dict(center=cuv, theta0=th0, f_place=fp)
        f1 = fp
        A.events.append((fp, "tap", {"who": who}))
    elif do == "draw_circle":
        P = props[a["prop"]]
        side = a.get("hand", "R")
        B = P["board"]
        dur = a.get("dur", 2.6)
        fd1 = f0 + sec(dur)
        th0 = B["theta0"]
        R = P["radius"]
        cuv = B["center"]

        def theta_at(f, f0=f0, fd1=fd1, th0=th0):
            return th0 + 2 * math.pi * ease_io((f - f0) / max(1, fd1 - f0))

        P["segs"].append(("board_rot", f0, fd1, theta_at, cuv))
        # giữ tay ở tay cầm thêm 0,5 s sau khi vẽ để nhấc compa đúng chỗ (không "rời tay" sớm)
        A.reach(f0 - 1, fd1 + sec(0.5), side, lambda f, cuv=cuv, P=P: board_M(cuv, theta_at(clamp(f, f0, fd1))) @ P["handle"], fin=0.05, fout=0.35)
        pts = [sm_env.board_point(anchors, cuv[0] + R * math.cos(th0 + 2 * math.pi * i / 96), cuv[1] + R * math.sin(th0 + 2 * math.pi * i / 96)) for i in range(97)]
        ob = sm_env.chalk_curve("circle", pts, board_coll)
        # đồng bộ nét phấn với đầu phấn: khoá giá trị theo từng frame
        cu = ob.data
        for f in range(f0, fd1 + 1):
            cu.bevel_factor_end = ease_io((f - f0) / max(1, fd1 - f0))
            cu.keyframe_insert("bevel_factor_end", frame=f + 1)
        timeline["events"].append(dict(f=f0, name="chalk", dur=(fd1 - f0) / FPS))
        f1 = fd1
    elif do == "lift_from_board":
        P = props[a["prop"]]
        side = a.get("hand", "R")
        P["segs"].append(("hand", f0, who, side))
        f1 = f0 + sec(0.3)
    elif do == "put_down":
        P = props[a["prop"]]
        tgt = Matrix.Translation(Vector(a["at"])) @ Matrix.Rotation(a.get("yaw", 0), 4, "Z")
        fp = f0 + sec(0.8)
        side = a.get("hand", "R")
        A.reach(f0, fp, side, lambda f, M=tgt, P=P: M @ P["handle"], fin=0.7, fout=0.4, crouch=0.1, lean=0.2)
        P["segs"].append(("to_static", f0, fp, who, side, tgt))
        f1 = fp
    elif do in ("board_line", "board_circle"):
        dur = a.get("dur", 1.0)
        f1 = f0 + sec(dur)
        if do == "board_line":
            p0, p1 = a["from"], a["to"]
            n = 24
            pts = [sm_env.board_point(anchors, lerp(p0[0], p1[0], i / n), lerp(p0[1], p1[1], i / n)) for i in range(n + 1)]
        else:
            c, R = a["center"], a["r"]
            pts = [sm_env.board_point(anchors, c[0] + R * math.cos(2 * math.pi * i / 96), c[1] + R * math.sin(2 * math.pi * i / 96)) for i in range(97)]
        ob = sm_env.chalk_curve(a.get("id", f"line{idx}"), pts, board_coll, color=a.get("color", "#f8f8f2"), width=a.get("width", 0.008))
        sm_env.animate_reveal(ob, f0 + 1, f1 + 1)
        timeline["events"].append(dict(f=f0, name="chalk", dur=dur))
    elif do == "board_label":
        u, v = a["at"]
        loc = sm_env.board_point(anchors, u, v, 0.006)
        col = a.get("color", "#f8f8f2")
        ob = sm_env.text_obj(a.get("id", f"lbl{idx}"), a["text"], loc, a.get("size", 0.14),
                             sm_env.mat("SM_chalk_line" if col == "#f8f8f2" else f"SM_chalk_{col}", col, 0.85, emit=0.25), board_coll, bold=a.get("bold", False))
        sm_env.pop_in(ob, f0 + 1, dur=int(0.3 * FPS))
        timeline["events"].append(dict(f=f0, name=a.get("sfx", "write"), dur=0.4))
        f1 = f0 + sec(a.get("dur", 0.4))
    elif do == "anim":
        # {"target": tên, "keys": [{"t": giây, "loc": [..], "rot": [độ..], "scale": s|[..], "show": bool, "reveal": 0..1}], "ease": "BEZIER|LINEAR|CONSTANT"}
        names = a["target"] if isinstance(a["target"], list) else [a["target"]]
        tmax = 0
        for nm in names:
            ob = OBJ.get(nm) or bpy.data.objects.get(nm)
            if ob is None:
                print("WARN anim: không có", nm)
                continue
            for k in a["keys"]:
                fk = f0 + sec(k.get("t", 0))
                tmax = max(tmax, k.get("t", 0))
                ez = k.get("ease", a.get("ease", "BEZIER"))
                if "loc" in k:
                    L = P3(k["loc"]) if not k.get("rel") else ob.location + Vector(k["loc"])
                    kf(ob, "location", fk, L, ez)
                if "rot" in k:
                    kf(ob, "rotation_euler", fk, tuple(math.radians(r) for r in k["rot"]), ez)
                if "scale" in k:
                    sc_ = k["scale"]
                    kf(ob, "scale", fk, (sc_, sc_, sc_) if isinstance(sc_, (int, float)) else tuple(sc_), ez)
                if "show" in k:
                    kf(ob, "hide_render", fk, not k["show"])
                if "reveal" in k:
                    kf(ob, "bevel_factor_end", fk, k["reveal"], ez)
        for nm_, t_ in a.get("sfx_at", []):
            timeline["events"].append(dict(f=f0 + sec(t_), name=nm_, vol=a.get("sfx_vol", 1.0)))
        f1 = f0 + sec(a.get("dur", tmax))
    elif do == "screen":
        for k in [k for k in OBJ if k.startswith("msg_")]:
            kf(OBJ[k], "hide_render", f0, k != "msg_" + a["msg"])
        if a.get("beep", True):
            timeline["events"].append(dict(f=f0, name="beep", vol=0.7))
        f1 = f0
    elif do == "pin":
        n = a["n"]
        red, grn = OBJ[f"pin{n}"], OBJ[f"pin{n}_g"]
        z0 = red.location.z
        if a["state"] == "lock":
            kf(red, "hide_render", f0, False)
            kf(red, "location", f0, red.location + Vector((0, 0, 0.04)))
            kf(red, "location", f0 + sec(0.12), Vector((red.location.x, red.location.y, z0 - 0.04)), "LINEAR")
            kf(grn, "hide_render", f0, True)
            timeline["events"].append(dict(f=f0 + sec(0.12), name="latch", vol=1.0))
            f1 = f0 + sec(a.get("dur", 0.25))
        else:
            kf(red, "hide_render", f0, True)
            kf(grn, "location", f0, Vector((grn.location.x, grn.location.y, z0)))
            kf(grn, "hide_render", f0, False)
            kf(grn, "location", f0 + sec(0.25), Vector((grn.location.x, grn.location.y, z0 + 0.025)))
            timeline["events"].append(dict(f=f0, name="unlatch", vol=1.0))
            timeline["events"].append(dict(f=f0 + sec(0.25), name="beep2", vol=0.6))
            f1 = f0 + sec(a.get("dur", 0.6))
    elif do == "knock":
        # hai đầu gối gõ "cộc cộc": nhún nhanh theo nhịp, tiếng gỗ
        cnt, per = a.get("count", 3), a.get("period", 0.3)
        f1 = f0 + sec(cnt * per)
        for f in range(f0, min(f1, MAXF - 1)):
            ph = ((f - f0) / FPS) / per
            A.hips_extra[f] = A.hips_extra[f] + Vector((0, 0, -0.055 * A.S * abs(math.sin(math.pi * ph))))
        for i in range(cnt):
            timeline["events"].append(dict(f=f0 + sec(i * per + per * 0.5), name="knock", vol=1.0))
    elif do == "gian_walk":
        pts = [P3(p) for p in a["path"]]
        dur = a.get("dur", 1.5)
        f1 = f0 + sec(dur)
        segl = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
        tot = sum(segl) or 1e-6
        G = OBJ["gian"]
        prev_yaw = None
        for f in range(f0, f1 + 1):
            k = (f - f0) / max(1, f1 - f0)
            k = ease_io(k) if a.get("ease", True) else k
            d = k * tot
            i = 0
            while i < len(segl) - 1 and d > segl[i]:
                d -= segl[i]
                i += 1
            u = d / max(1e-6, segl[i])
            p = pts[i].lerp(pts[i + 1], min(1, u))
            dv = pts[i + 1] - pts[i]
            yaw = math.atan2(dv.y, dv.x) if dv.length > 1e-6 else (prev_yaw or 0)
            prev_yaw = yaw
            p = p + Vector((0, 0, 0.0012 * abs(math.sin(f * 1.7))))
            kf(G, "location", f, p, "LINEAR")
            kf(G, "rotation_euler", f, (0, 0, yaw), "LINEAR")
            for (pv, li, sd) in GIAN["legs"]:
                ph = f * 1.9 + (0 if (li + (sd > 0)) % 2 else math.pi)
                kf(pv, "rotation_euler", f, (0, 0, math.radians(28) * math.sin(ph)), "LINEAR")
        for (pv, li, sd) in GIAN["legs"]:
            kf(pv, "rotation_euler", f1 + 1, (0, 0, 0))
        step = max(2, sec(0.09))
        for f in range(f0, f1, step):
            timeline["events"].append(dict(f=f, name="metalstep", vol=0.55))
        if a.get("face_end") is not None:
            kf(G, "rotation_euler", f1 + sec(0.3), (0, 0, math.radians(a["face_end"])))
    elif do == "gian_point":
        # sáu chân cùng giơ lên chỉ (hoặc hạ xuống khi up = false)
        up = a.get("up", True)
        for (pv, li, sd) in GIAN["legs"]:
            kf(pv, "rotation_euler", f0, tuple(pv.rotation_euler))
            kf(pv, "rotation_euler", f0 + sec(0.3), (math.radians(-sd * 70) if up else 0, 0, math.radians(a.get("aim", 0)) if up else 0))
        timeline["events"].append(dict(f=f0, name="boing" if up else "click", vol=0.6))
        f1 = f0 + sec(a.get("dur", 0.4))
    elif do == "bell":
        B = OBJ["bell"]
        for i in range(6):
            kf(B, "rotation_euler", f0 + i * 2, (0, 0, math.radians(25 if i % 2 else -25)), "LINEAR")
        kf(B, "rotation_euler", f0 + 12, (0, 0, 0))
        timeline["events"].append(dict(f=f0, name="bike_bell", vol=a.get("vol", 1.0)))
        f1 = f0 + sec(a.get("dur", 1.2))
    elif do == "attach":
        ATTACH.append(dict(obj=OBJ.get(a["target"]) or bpy.data.objects.get(a["target"]), who=who, f=f0, off=a.get("head_offset", [0, 0.97, -0.38]), detach=a.get("detach")))
        f1 = f0
    elif do == "reach":
        # với tay tới điểm [x,y,z] (bấm nút, lau bánh, chụp đồ…)
        side = a.get("hand", "R")
        tgt = P3(a["at"])
        f1 = f0 + sec(a.get("dur", 1.0))
        A.reach(f0, f1, side, lambda f, t=tgt: t, fin=a.get("fin", 0.35), fout=a.get("fout", 0.35), crouch=a.get("crouch", 0.05), lean=a.get("lean", 0.15))
        if a.get("tap"):
            A.events.append((f0 + sec(a.get("fin", 0.35)), "tap", {"who": who}))
    elif do == "wait":
        f1 = f0 + sec(a.get("dur", 1.0))
    elif do == "sfx":
        timeline["events"].append(dict(f=f0, name=a["name"], vol=a.get("vol", 1.0), len=a.get("len")))
        f1 = f0
    if a.get("cam"):
        c = a["cam"] if isinstance(a["cam"], dict) else {"preset": a["cam"]}
        shots.append(dict(f0=f0 + sec(c.get("offset", 0)), preset=c["preset"], subject=c.get("subject", who), over={k: v for k, v in c.items() if k not in ("preset", "subject", "offset")}))
    timeline["actions"].append(dict(i=idx, do=do, who=who, f0=f0, f1=f1, mark=a.get("mark")))
    prev_start = f0
    if not a.get("with"):
        cursor = max(cursor, f1 + sec(a.get("gap", 0.15)))
    else:
        cursor = max(cursor, f1 + sec(a.get("gap", 0.15))) if a.get("extend", True) else cursor

END = min(MAXF - 1, cursor + sec(prod.get("tail", 1.0)))
NF = END + 1
for A in actors.values():
    A.n = NF
    for attr in ("root", "yaw", "loco", "hips_extra", "squash"):
        setattr(A, attr, getattr(A, attr)[:NF])
    for s in ("L", "R"):
        A.feet[s] = A.feet[s][:NF]
        A.planted_flags[s] = A.planted_flags[s][:NF]

# ---------------- giải chuyển động + bake ----------------
solved = {}
for cid, A in actors.items():
    out = A.solve()
    solved[cid] = out
    bake_actor(A, out)
    for (f, name, extra) in A.events:
        if f < NF:
            timeline["events"].append(dict(f=f, name=name, **{k: v for k, v in extra.items() if k != "who"}, who=extra.get("who")))

# ---------------- máy quay ----------------
shots.sort(key=lambda s: s["f0"])
camdir = sm_cine.CameraDirector(cam, FPS, NF, {k: (actors[k], solved[k]) for k in actors}, anchors)
for i, s in enumerate(shots):
    f1 = (shots[i + 1]["f0"] - 1) if i + 1 < len(shots) else NF - 1
    camdir.shot(s["f0"], f1, s["preset"], s["subject"], **s["over"])
    timeline["shots"].append(dict(f0=s["f0"], f1=f1, preset=s["preset"], subject=s["subject"]))
cam_frames = camdir.bake()

# ---------------- đạo cụ bám tay / bảng (pass 2: cần tư thế đã giải IK) ----------------
dg = bpy.context.evaluated_depsgraph_get()


def hand_world(cid, side, f):
    sc.frame_set(f + 1)
    arm = arms[cid]
    pb = arm.pose.bones[f"hand.{side}"]
    return arm.matrix_world @ pb.matrix


qa = dict(hand_prop_gap_mm=0.0, foot_slide_mm=0.0, floor_penetration_mm=0.0)
for pid, P in props.items():
    ob = P["obj"]
    ob.rotation_mode = "QUATERNION"
    Bk = sm_anim.FCBaker(ob)
    mats = [None] * NF
    segs = P["segs"]
    # sắp các đoạn theo thời gian bắt đầu
    def seg_start(s):
        return s[1]
    segs_sorted = sorted(segs, key=seg_start)
    for f in range(NF):
        cur = None
        for s in segs_sorted:
            if s[1] <= f:
                cur = s
        kind = cur[0]
        if kind == "static":
            mats[f] = cur[2]
        elif kind == "hand":
            _, fg, cid, side = cur
            Hg = hand_world(cid, side, fg)
            if "offset_" + str(fg) not in P:
                prevM = mats[fg - 1] if fg >= 1 and mats[fg - 1] is not None else segs_sorted[0][2]
                P["offset_" + str(fg)] = Hg.inverted() @ prevM
            mats[f] = hand_world(cid, side, f) @ P["offset_" + str(fg)]
        elif kind in ("to_board", "to_static"):
            _, fa, fp, cid, side, Mt = cur
            # trước khi đặt: theo tay, 0,25 s cuối trộn dần sang vị trí đích
            key = "offset_tb_" + str(fa)
            if key not in P:
                Hg = hand_world(cid, side, fa)
                P[key] = Hg.inverted() @ mats[fa - 1]
            Mh = hand_world(cid, side, f) @ P[key]
            w = smooth((f - (fp - 0.3 * FPS)) / (0.3 * FPS))
            if f >= fp:
                mats[f] = Mt
            else:
                l1, r1, _ = Mh.decompose()
                l2, r2, _ = Mt.decompose()
                mats[f] = Matrix.Translation(l1.lerp(l2, w)) @ r1.slerp(r2, w).to_matrix().to_4x4()
        elif kind == "board_rot":
            _, fa, fb, th_fn, cuv = cur
            mats[f] = board_M(cuv, th_fn(clamp(f, fa, fb)))
    for f in range(NF):
        l, r, _ = mats[f].decompose()
        for i in range(3):
            Bk.add("location", i, f + 1, l[i])
        for i in range(4):
            Bk.add("rotation_quaternion", i, f + 1, r[i])
    Bk.write()

# ---------------- gắn đồ lên đầu nhân vật (ria dây…) ----------------
for at in ATTACH:
    ob, cid, f = at["obj"], at["who"], at["f"]
    arm = arms[cid]
    sc.frame_set(f + 1)
    pb = arm.pose.bones["head"]
    Hm = arm.matrix_world @ pb.matrix
    Rh = sm_rig.P["head_r"] * float(arm.get("sm_scale", 1.0))
    up = Hm.col[1].xyz.normalized()
    ctr = Hm.translation + up * (0.95 * Rh)
    yaw = actors[cid].yaw[f]
    fwd = -yaw_vec(yaw) if False else yaw_vec(yaw)
    o = at["off"]
    pos = ctr + fwd * (o[1] * Rh) + up * (o[2] * Rh) + Vector((math.cos(yaw), math.sin(yaw), 0)) * (o[0] * Rh)
    ob.matrix_world = Matrix.Translation(pos) @ Matrix.Rotation(yaw, 4, "Z")
    c = ob.constraints.new("CHILD_OF")
    c.target, c.subtarget = arm, "head"
    c.inverse_matrix = Hm.inverted()
    kf(ob, "hide_render", f + 1, False)
    if at.get("detach") is not None:
        kf(ob, "hide_render", at["detach"] + 1, True)

# ---------------- QA: trượt chân, xuyên sàn ----------------
for cid, A in actors.items():
    arm = arms[cid]
    prev = {"L": None, "R": None}
    slide = 0.0
    pen = 0.0
    for f in range(0, NF, 2):
        sc.frame_set(f + 1)
        for s in ("L", "R"):
            p = arm.matrix_world @ arm.pose.bones[f"foot.{s}"].head
            pen = max(pen, max(0.0, -(p.z - 0.0)))
            if A.planted_flags[s][f] and prev[s] is not None and A.planted_flags[s][max(0, f - 2)]:
                slide = max(slide, (Vector((p.x, p.y)) - Vector((prev[s].x, prev[s].y))).length)
            prev[s] = p
    qa["foot_slide_mm"] = max(qa["foot_slide_mm"], slide * 1000)
    qa["floor_penetration_mm"] = max(qa["floor_penetration_mm"], pen * 1000)

# ---------------- ánh sáng, hiệu ứng, render ----------------
sm_cine.light_classroom(anchors) if env_name == "classroom" else (sm_canteen.light_canteen() if env_name == "canteen" else None)
if prod.get("dust", True) and env_name == "classroom":
    sm_env.dust_motes(Vector((-3.6, -1.2, 1.7)), (1.8, 4.5, 1.6), count=160)
sm_cine.setup_render(QUAL, FPS, NF)
if env_name == "canteen":
    # hoạt hình: màu tươi, tương phản vừa (AgX làm nhạt màu đồ ăn)
    sc.view_settings.view_transform = "Standard"
    try:
        sc.view_settings.look = "Medium Contrast"
    except Exception:
        pass
    sc.view_settings.exposure = -1.0
sc.frame_set(1)
timeline["nframes"] = NF
timeline["qa"] = qa
timeline["cam"] = [dict(shot=c["shot"]) for c in cam_frames[::FPS]]
os.makedirs(os.path.dirname(os.path.abspath(OUT_BLEND)), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT_BLEND), compress=True)
json.dump(timeline, open(OUT_TL, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("BUILD_OK frames", NF, "qa", qa)
