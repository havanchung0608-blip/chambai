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
anchors = sm_env.build_classroom() if env_name == "classroom" else sm_env.build_studio()


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
        yaw = 0.0 if fa == "camera" else math.pi if fa == "board" else fa if isinstance(fa, (int, float)) else angle_to(A.root[f0], resolve_point(fa))
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
    elif do == "wait":
        f1 = f0 + sec(a.get("dur", 1.0))
    elif do == "sfx":
        timeline["events"].append(dict(f=f0, name=a["name"], vol=a.get("vol", 1.0), len=a.get("len")))
        f1 = f0
    if a.get("cam"):
        c = a["cam"] if isinstance(a["cam"], dict) else {"preset": a["cam"]}
        shots.append(dict(f0=f0 + sec(c.get("offset", 0)), preset=c["preset"], subject=c.get("subject", who), over={k: v for k, v in c.items() if k not in ("preset", "subject", "offset")}))
    timeline["actions"].append(dict(i=idx, do=do, who=who, f0=f0, f1=f1))
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
sm_cine.light_classroom(anchors) if env_name == "classroom" else None
if prod.get("dust", True) and env_name == "classroom":
    sm_env.dust_motes(Vector((-3.6, -1.2, 1.7)), (1.8, 4.5, 1.6), count=160)
sm_cine.setup_render(QUAL, FPS, NF)
sc.frame_set(1)
timeline["nframes"] = NF
timeline["qa"] = qa
timeline["cam"] = [dict(shot=c["shot"]) for c in cam_frames[::FPS]]
os.makedirs(os.path.dirname(os.path.abspath(OUT_BLEND)), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT_BLEND), compress=True)
json.dump(timeline, open(OUT_TL, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("BUILD_OK frames", NF, "qa", qa)
