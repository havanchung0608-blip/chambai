"""sm_cine — máy quay điện ảnh + ánh sáng + thiết lập render (EEVEE) cho Stickman 3D Studio.

Máy quay: mỗi "shot" = (frame bắt đầu, kết thúc, preset, chủ thể). Preset mô tả cỡ cảnh (khoảng cách,
ống kính), góc (độ cao, phương vị so với hướng nhân vật), chuyển động máy (dolly, truck, crane, orbit,
push-in, pull-out, handheld, whip, rack focus, dolly-zoom...), độ mở ống kính (DOF). Bộ giải tính vị trí,
điểm nhìn, ống kính, góc nghiêng (roll) cho TỪNG khung hình rồi bake keyframe.
"""
import math
import bpy
from mathutils import Vector, Matrix, Quaternion

from sm_anim import FCBaker, smooth, ease_io, lerp, clamp, noise1, yaw_vec

# ---------- 30 preset góc quay ----------
# dist: khoảng cách (m) tới điểm nhìn; h: độ cao máy so với điểm nhìn; az: phương vị (độ) so với hướng mặt
# nhân vật (0 = chính diện, 90 = bên trái nhân vật, 180 = sau lưng); lens: tiêu cự mm; aim: chiều cao điểm nhìn
# trên nhân vật (m, khi scale 1); move: chuyển động máy; roll: nghiêng máy (độ); fstop: độ mở (nhỏ = nhoè hậu cảnh)
SHOTS = {
    "establishing_wide": dict(dist=8.5, h=2.2, az=25, lens=24, aim=1.2, fstop=8.0, desc="toàn cảnh mở đầu, giới thiệu không gian"),
    "wide": dict(dist=6.0, h=1.2, az=15, lens=28, aim=1.1, fstop=5.6, desc="toàn cảnh"),
    "full_body": dict(dist=3.6, h=0.4, az=12, lens=35, aim=1.0, fstop=4.0, desc="toàn thân"),
    "full_three_quarter": dict(dist=3.4, h=0.5, az=40, lens=35, aim=1.0, fstop=4.0, desc="toàn thân góc 3/4"),
    "medium": dict(dist=3.0, h=0.15, az=15, lens=42, aim=1.38, fstop=2.8, desc="trung cảnh (đến hông)"),
    "medium_close": dict(dist=2.3, h=0.08, az=14, lens=50, aim=1.55, fstop=2.2, desc="cận trung (đến ngực)"),
    "close_up": dict(dist=1.7, h=0.04, az=10, lens=60, aim=1.68, fstop=1.8, desc="cận mặt — cảm xúc"),
    "extreme_close": dict(dist=0.9, h=0.0, az=5, lens=85, aim=1.73, fstop=1.6, desc="đặc tả mắt"),
    "profile": dict(dist=2.0, h=0.1, az=90, lens=50, aim=1.4, fstop=2.8, desc="nghiêng (profile)"),
    "back_follow": dict(dist=2.4, h=0.45, az=180, lens=35, aim=1.3, fstop=4.0, desc="sau lưng nhân vật"),
    "over_shoulder": dict(dist=1.4, h=0.25, az=165, lens=40, aim=1.45, fstop=2.8, look_ahead=1.8, desc="qua vai nhìn về phía trước nhân vật"),
    "low_angle_hero": dict(dist=2.2, h=-0.95, az=20, lens=28, aim=1.35, fstop=4.0, desc="góc thấp: oai, mạnh mẽ"),
    "high_angle": dict(dist=2.6, h=2.0, az=15, lens=35, aim=1.2, fstop=4.0, desc="góc cao: nhỏ bé, yếu thế"),
    "birds_eye": dict(dist=0.6, h=5.0, az=0, lens=24, aim=0.8, fstop=8.0, desc="nhìn thẳng từ trên xuống"),
    "worms_eye": dict(dist=1.2, h=-1.25, az=10, lens=20, aim=1.5, fstop=5.6, desc="sát đất nhìn lên"),
    "dutch": dict(dist=2.2, h=0.2, az=25, lens=40, aim=1.35, fstop=2.8, roll=12, desc="nghiêng máy: căng thẳng"),
    "insert_hand": dict(dist=1.8, h=0.5, az=25, lens=40, aim="hand", fstop=3.2, desc="cận bàn tay / đạo cụ"),
    "insert_board": dict(dist=3.0, h=0.0, az=0, lens=40, aim="board", fstop=5.6, absolute=True, desc="cận bảng (chính diện bảng)"),
    "board_three_quarter": dict(dist=3.0, h=0.25, az=42, lens=35, aim="board", fstop=4.0, absolute=True, desc="bảng góc 3/4 có nhân vật"),
    "dolly_in": dict(dist=3.6, h=0.2, az=12, lens=45, aim=1.4, fstop=2.8, move=("dolly", -1.4), desc="tiến máy vào chậm"),
    "dolly_out": dict(dist=1.8, h=0.2, az=12, lens=45, aim=1.4, fstop=2.8, move=("dolly", 1.8), desc="lùi máy ra mở không gian"),
    "push_in_emotion": dict(dist=3.0, h=0.05, az=8, lens=50, aim=1.6, fstop=2.0, move=("dolly", -0.9), desc="đẩy chậm vào mặt khi cảm xúc dâng"),
    "pull_back_reveal": dict(dist=1.2, h=0.2, az=0, lens=35, aim=1.4, fstop=4.0, move=("dolly", 5.0), desc="kéo lùi lộ toàn cảnh"),
    "truck_follow": dict(dist=3.0, h=0.25, az=70, lens=40, aim=1.2, fstop=3.2, follow=True, desc="đi ngang theo nhân vật (tracking)"),
    "lead_front": dict(dist=2.6, h=0.2, az=0, lens=40, aim=1.35, fstop=3.2, follow=True, desc="máy đi lùi trước mặt nhân vật"),
    "orbit": dict(dist=2.6, h=0.4, az=-40, lens=40, aim=1.3, fstop=3.2, move=("orbit", 80), desc="xoay vòng quanh nhân vật"),
    "crane_up": dict(dist=3.2, h=-0.2, az=15, lens=32, aim=1.2, fstop=4.0, move=("crane", 2.4), desc="cẩu máy lên cao"),
    "crane_down": dict(dist=3.2, h=2.6, az=15, lens=32, aim=1.2, fstop=4.0, move=("crane", -2.4), desc="hạ máy xuống"),
    "handheld": dict(dist=2.0, h=0.1, az=20, lens=40, aim=1.4, fstop=2.8, handheld=1.0, desc="máy cầm tay (hồi hộp, phóng sự)"),
    "whip_pan": dict(dist=2.4, h=0.2, az=15, lens=40, aim=1.35, fstop=3.2, whip=True, desc="lia nhanh sang chủ thể (nhoè chuyển động)"),
    "dolly_zoom": dict(dist=2.0, h=0.1, az=5, lens=35, aim=1.6, fstop=2.8, move=("vertigo", 2.0), desc="dolly zoom (Hitchcock): nền giãn ra, mặt giữ nguyên"),
    "rack_focus": dict(dist=1.6, h=0.2, az=150, lens=55, aim=1.5, fstop=1.4, rack=True, desc="chuyển tiêu điểm từ tiền cảnh sang hậu cảnh"),
    "two_shot": dict(dist=3.0, h=0.25, az=0, lens=35, aim=1.3, fstop=4.0, two=True, desc="hai nhân vật cùng khung"),
}


def look_quat(cam_pos, target, roll_deg=0.0):
    d = (target - cam_pos).normalized()
    q = d.to_track_quat("-Z", "Y")
    if roll_deg:
        q = q @ Quaternion((0, 0, 1), math.radians(roll_deg))
    return q


class CameraDirector:
    def __init__(self, cam_obj, fps, nframes, actors, anchors):
        self.cam = cam_obj
        self.fps = fps
        self.n = nframes
        self.actors = actors     # name → (Actor, frames_out list)
        self.anchors = anchors
        self.shots = []

    def shot(self, f0, f1, preset, subject=None, **over):
        p = dict(SHOTS[preset])
        p.update(over)
        self.shots.append(dict(f0=f0, f1=f1, p=p, name=preset, subject=subject))

    def _subject_point(self, subj, f, aim):
        """Điểm nhìn + hướng mặt của chủ thể tại frame f."""
        if isinstance(subj, (list, tuple)) and subj and isinstance(subj[0], str):
            pts = [self._subject_point(s, f, aim)[0] for s in subj]
            c = sum(pts, Vector()) / len(pts)
            return c, 0.0, max((a - b).length for a in pts for b in pts)
        if isinstance(subj, str) and subj in self.actors:
            A, out = self.actors[subj]
            # làm mượt vị trí (máy quay không giật theo từng bước)
            acc, wsum = Vector(), 0
            for d in range(-6, 7):
                ff = clamp(f + d, 0, self.n - 1)
                w = 1 - abs(d) / 7
                acc += A.root[ff] * w
                wsum += w
            root = acc / wsum
            S = A.S
            if aim == "hand":
                h = out[f]["hands"]["R"]
                return Vector(h), A.yaw[f], 0
            z = (aim if isinstance(aim, (int, float)) else 1.3) * S
            return root + Vector((0, 0, z)), A.yaw[f], 0
        if subj == "board" or aim == "board":
            c = self.anchors["board_center"]
            return c.copy(), 0.0, 0
        if isinstance(subj, (list, tuple)):
            return Vector(subj), 0.0, 0
        return Vector((0, 0, 1.2)), 0.0, 0

    def solve(self):
        frames = []
        for f in range(self.n):
            sh = None
            for s in self.shots:
                if s["f0"] <= f <= s["f1"]:
                    sh = s
            if sh is None:
                sh = self.shots[0] if self.shots else None
            p = sh["p"]
            k = (f - sh["f0"]) / max(1, sh["f1"] - sh["f0"])
            aim = p.get("aim", 1.3)
            tgt, face_yaw, span = self._subject_point(sh["subject"] or ("board" if aim == "board" else None), f, aim)
            if p.get("absolute"):
                base_yaw = math.pi  # máy đứng trước bảng nhìn vào bảng (+Y)
                face_yaw = 0.0
            dist, h, az, lens = p["dist"], p["h"], p.get("az", 0), p["lens"]
            if p.get("two"):
                dist = max(dist, span * 1.25 + 1.2)
            mv = p.get("move")
            if mv:
                kind, amt = mv
                e = ease_io(k)
                if kind == "dolly":
                    dist = max(0.3, dist + amt * e)
                elif kind == "orbit":
                    az = az + amt * e
                elif kind == "crane":
                    h = h + amt * e
                elif kind == "vertigo":
                    d2 = dist + amt * e
                    lens = lens * d2 / dist
                    dist = d2
            yaw = face_yaw + math.radians(az)
            dirv = yaw_vec(yaw)  # hướng mặt nhân vật → máy đặt phía trước mặt
            if p.get("absolute"):
                dirv = Vector((math.sin(math.radians(az)), -math.cos(math.radians(az)), 0))
            pos = tgt + dirv * dist + Vector((0, 0, h))
            look = tgt.copy()
            if p.get("look_ahead"):
                look = tgt + yaw_vec(face_yaw) * p["look_ahead"]
            roll = p.get("roll", 0)
            if p.get("handheld"):
                tt = f / self.fps
                pos += Vector((noise1(tt * 0.7, 1), noise1(tt * 0.6, 2), noise1(tt * 0.8, 3))) * 0.03 * p["handheld"]
                roll += noise1(tt * 0.5, 4) * 1.2 * p["handheld"]
            if p.get("whip"):
                # đầu shot: lia từ hướng lệch 70° về chủ thể trong 0.35 s
                kk = clamp((f - sh["f0"]) / (0.35 * self.fps), 0, 1)
                off = (1 - ease_io(kk)) * math.radians(70)
                rel = look - pos
                rel = Matrix.Rotation(off, 3, "Z") @ rel
                look = pos + rel
            fstop = p.get("fstop", 2.8)
            focus = (tgt - pos).length
            if p.get("rack"):
                focus = lerp(0.9, focus, smooth((k - 0.35) / 0.3))
            frames.append(dict(pos=pos, q=look_quat(pos, look, roll), lens=lens, fstop=fstop, focus=focus, shot=sh["name"]))
        # giữ máy trong phòng (không xuyên tường) nếu có giới hạn
        room = self.anchors.get("room")
        if room:
            W0, W1, D0, D1, H = room
            for fr in frames:
                p = fr["pos"]
                p.x = clamp(p.x, W0 + 0.25, W1 - 0.25)
                p.y = clamp(p.y, D0 + 0.25, D1 - 0.3)
                p.z = clamp(p.z, 0.15, H - 0.15)
        return frames

    def bake(self):
        frames = self.solve()
        cam = self.cam
        cam.rotation_mode = "QUATERNION"
        B = FCBaker(cam)
        D = FCBaker(cam.data)
        for f, c in enumerate(frames):
            fr = f + 1
            for i in range(3):
                B.add("location", i, fr, c["pos"][i])
            for i in range(4):
                B.add("rotation_quaternion", i, fr, c["q"][i])
            D.add("lens", 0, fr, c["lens"])
            D.add("dof.focus_distance", 0, fr, c["focus"])
            D.add("dof.aperture_fstop", 0, fr, c["fstop"])
        B.write()
        D.write()
        # cắt cảnh: dùng CONSTANT giữa các shot để không trượt máy giữa hai shot
        cuts = sorted(s["f0"] + 1 for s in self.shots)
        for fc in list(cam.animation_data.action.fcurves) + list(cam.data.animation_data.action.fcurves):
            for kp in fc.keyframe_points:
                if int(kp.co[0]) + 1 in cuts:
                    kp.interpolation = "CONSTANT"
        return frames


# ---------- ánh sáng & render ----------
QUALITY = {
    "draft":   dict(res=(960, 540), samples=4, mb=False, shadow=1024, gtao=True, ssr=False, bloom=True),
    "cpu":     dict(res=(1280, 720), samples=8, mb=True, shadow=1024, gtao=True, ssr=True, bloom=True),
    "hd":      dict(res=(1920, 1080), samples=16, mb=True, shadow=2048, gtao=True, ssr=True, bloom=True),
    "4k":      dict(res=(3840, 2160), samples=32, mb=True, shadow=4096, gtao=True, ssr=True, bloom=True),
}


def setup_render(quality="cpu", fps=30, nframes=900):
    sc = bpy.context.scene
    q = QUALITY[quality]
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = q["res"]
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    sc.frame_start, sc.frame_end = 1, nframes
    e = sc.eevee
    e.taa_render_samples = q["samples"]
    e.use_gtao = q["gtao"]
    e.gtao_distance = 0.6
    e.use_bloom = q["bloom"]
    e.bloom_intensity = 0.03
    e.bloom_threshold = 1.2
    e.use_ssr = q["ssr"]
    e.use_ssr_refraction = False
    e.ssr_quality = 0.5
    e.use_soft_shadows = True
    e.shadow_cube_size = str(q["shadow"])
    e.shadow_cascade_size = str(q["shadow"])
    e.use_motion_blur = q["mb"]
    e.motion_blur_shutter = 0.5
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    return q


def light_classroom(anchors):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("SM_world")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.55, 0.65, 0.8, 1)
    bg.inputs["Strength"].default_value = 0.35
    sc.world = w
    coll = bpy.data.collections.new("LIGHTS")
    sc.collection.children.link(coll)

    def L(name, kind, loc, energy, color=(1, 1, 1), size=1.0, rot=(0, 0, 0), angle=None, shadow_soft=None):
        ld = bpy.data.lights.new(name, kind)
        ld.energy = energy
        ld.color = color
        if kind == "AREA":
            ld.size = size
        if kind == "SUN" and angle is not None:
            ld.angle = math.radians(angle)
        if kind in ("POINT", "SPOT") and shadow_soft:
            ld.shadow_soft_size = shadow_soft
        ld.use_contact_shadow = True
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        ob.rotation_euler = rot
        coll.objects.link(ob)
        return ob
    # nắng xiên qua cửa sổ trái (key light, ấm)
    L("sun_window", "SUN", (-6, 0, 6), 4.2, (1.0, 0.92, 0.8), rot=(math.radians(52), math.radians(-38), math.radians(-20)), angle=1.5)
    # đèn trần dịu (fill)
    for x, y in ((-1.5, -2.5), (2.0, 0.5)):
        o = L(f"ceil_{x}_{y}", "AREA", (x, y, 3.15), 380, (1.0, 0.98, 0.95), size=3.0, rot=(0, 0, 0))
        o.data.use_shadow = False
    # đèn rọi bảng (giúp chữ phấn nổi)
    L("board_wash", "AREA", (-0.3, 1.6, 3.0), 160, (1, 1, 1), size=2.5, rot=(math.radians(-35), 0, 0))
    # ánh sáng viền (rim) từ phía cửa ra vào
    o = L("rim_door", "AREA", (4.6, 1.6, 2.4), 90, (0.85, 0.9, 1.0), size=1.5, rot=(math.radians(70), 0, math.radians(90)))
    o.data.use_shadow = False
    return coll


def make_camera():
    cd = bpy.data.cameras.new("CAM")
    cd.lens = 35
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = 2.8
    cd.sensor_width = 36
    cd.clip_start = 0.05
    cam = bpy.data.objects.new("CAM", cd)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    return cam
