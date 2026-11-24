"""sm_anim — hệ chuyển động thủ tục cho người que 3D (chạy trong Blender).

Mô hình: mỗi nhân vật có một "Actor" giữ trạng thái theo từng khung hình (frame) được TÍNH bằng thuật toán:
  • Locomotion (đi/chạy/rón rén/lùi/bước ngang/quay tại chỗ): bàn chân ĐẶT CỐ ĐỊNH xuống sàn trong pha
    chống (stance) → không trượt chân; pha vung (swing) theo cung nâng có gót-mũi (heel-toe roll);
    hông nhấp nhô thấp nhất lúc hai chân chạm đất, lắc ngang về chân trụ; vai xoay ngược hông.
  • Lớp động tác thân trên (gesture/action layer) trộn có trọng số (animation blending) với ease-in/out,
    có lấy đà (anticipation) và quá đà (overshoot/follow-through).
  • Lớp nhìn (look-at) xoay cổ/đầu mượt về mục tiêu; lớp khuôn mặt (emotion + blink + lip sync).
  • Chuyển động phụ (secondary): thở, dồn trọng tâm, đầu trễ nhịp, tay đung đưa.
Sau đó "bake" tất cả thành keyframe (fcurve) → file .blend chỉnh sửa được, IK do Blender giải.
"""
import json
import math
import os
import random
from mathutils import Matrix, Quaternion, Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.join(HERE, "..", "..", "animations")


# ----------------------------- tiện ích -----------------------------
def clamp(v, a, b):
    return a if v < a else b if v > b else v


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = clamp(t, 0, 1)
    return t * t * (3 - 2 * t)


def ease_io(t):
    t = clamp(t, 0, 1)
    return 4 * t * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_back(t, s=1.4):
    t = clamp(t, 0, 1) - 1
    return 1 + (s + 1) * t ** 3 + s * t ** 2


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def noise1(x, seed=0):
    i = math.floor(x)
    f = x - i
    u = f * f * (3 - 2 * f)
    def h(n):
        s = math.sin(n * 127.1 + seed * 311.7) * 43758.5453
        return s - math.floor(s)
    return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1


def trap(k, r=0.2):
    """quãng đường chuẩn hoá cho vận tốc hình thang (tăng tốc – đều – giảm tốc)"""
    k = clamp(k, 0, 1)
    v = 1 / (1 - r)
    if k < r:
        return 0.5 * v * k * k / r
    if k > 1 - r:
        q = 1 - k
        return 1 - 0.5 * v * q * q / r
    return 0.5 * v * r + v * (k - r)


def yaw_vec(yaw):
    """hướng mặt: yaw = 0 nhìn -Y"""
    return Vector((math.sin(yaw), -math.cos(yaw), 0))


def angle_to(src, dst):
    d = Vector(dst) - Vector(src)
    return math.atan2(d.x, -d.y)


def ang_lerp(a, b, t):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi
    return a + d * t


GAITS = {
    # bước (m, khi scale 1), thời gian 1 bước (s), độ nâng chân, nhấp nhô hông, gập người, tay vung, hạ hông
    "walk":  dict(step=0.62, t=0.52, lift=0.11, bob=0.035, lean=0.05, swing=0.32, crouch=0.0),
    "slow":  dict(step=0.45, t=0.65, lift=0.08, bob=0.025, lean=0.03, swing=0.22, crouch=0.0),
    "run":   dict(step=1.15, t=0.34, lift=0.26, bob=0.06, lean=0.22, swing=0.55, crouch=0.06),
    "sneak": dict(step=0.40, t=0.70, lift=0.10, bob=0.02, lean=0.18, swing=0.10, crouch=0.14),
    "march": dict(step=0.62, t=0.50, lift=0.22, bob=0.03, lean=0.0, swing=0.55, crouch=0.0),
    "back":  dict(step=0.40, t=0.60, lift=0.08, bob=0.02, lean=-0.05, swing=0.15, crouch=0.0),
}


def load_gestures():
    fp = os.path.join(LIB, "gestures.json")
    with open(fp, encoding="utf-8") as f:
        return json.load(f)


# ----------------------------- Actor -----------------------------
class Actor:
    """Trạng thái một nhân vật theo khung hình. Đơn vị thời gian: frame."""

    def __init__(self, arm, fps, nframes, pos=(0, 0), heading=0.0, seed=1):
        self.arm = arm
        self.fps = fps
        self.n = nframes
        self.S = float(arm.get("sm_scale", 1.0))
        self.seed = seed
        hw = 0.095 * self.S
        # mặc định: đứng yên
        self.root = [Vector((pos[0], pos[1], 0)) for _ in range(nframes)]
        self.yaw = [heading] * nframes
        self.loco = [None] * nframes  # thông tin pha đi để tay vung / hông
        self.feet = {s: [None] * nframes for s in ("L", "R")}
        self.hands = {s: [None] * nframes for s in ("L", "R")}   # (Vector world, weight)
        self.layers = []   # lớp động tác thân trên: (f0, f1, fin, fout, fn)
        self.looks = []    # (f0, f1, target_fn, weight)
        self.face_keys = []  # (f0, f1, {key: val}, fin, fout)
        self.talk = []     # (f0, envelope list)
        self.hips_extra = [Vector() for _ in range(nframes)]
        self.squash = [1.0] * nframes
        self.events = []   # sự kiện âm thanh: (frame, name, extra)
        self.stance_pos = {"L": None, "R": None}
        self.hw = hw
        self._place_stance(0, pos, heading)
        self.planted_flags = {s: [True] * nframes for s in ("L", "R")}
        self._hold_from(0, Vector((pos[0], pos[1], 0)), heading)

    # ---------- tiện ích vị trí ----------
    def _foot_home(self, pos, yaw, side, spread=1.0):
        sx = 1 if side == "L" else -1
        right = Vector((math.cos(yaw), math.sin(yaw), 0))  # trục ngang của người (X local)
        return Vector((pos[0], pos[1], 0)) + right * (sx * self.hw * spread) - yaw_vec(yaw) * 0.01

    def _place_stance(self, f0, pos, yaw):
        for s in ("L", "R"):
            self.stance_pos[s] = (self._foot_home(pos, yaw, s), yaw)

    # ---------- locomotion ----------
    def walk(self, f0, path, gait="walk", end_yaw=None, speed=1.0):
        """Đi theo đường gấp khúc path=[(x,y),...] bắt đầu từ vị trí hiện tại. Trả về frame kết thúc."""
        G = dict(GAITS[gait])
        S = self.S
        step = G["step"] * S * (1.0 if gait != "back" else 1.0)
        start = self.root[f0].copy()
        pts = [Vector((start.x, start.y, 0))] + [Vector((p[0], p[1], 0)) for p in path]
        seglen = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
        total = sum(seglen)
        if total < 0.05:
            return f0
        nsteps = max(2, round(total / step))
        step = total / nsteps
        dur = nsteps * G["t"] / speed
        f1 = min(self.n - 1, f0 + int(round(dur * self.fps)))
        backwards = gait == "back"

        def at_dist(d):
            d = clamp(d, 0, total)
            for i, L in enumerate(seglen):
                if d <= L or i == len(seglen) - 1:
                    k = d / L if L > 0 else 0
                    p = pts[i].lerp(pts[i + 1], k)
                    dirv = (pts[i + 1] - pts[i]).normalized()
                    return p, dirv
                d -= L
            return pts[-1], (pts[-1] - pts[-2]).normalized()

        def yaw_of(dirv):
            y = math.atan2(dirv.x, -dirv.y)
            return y + (math.pi if backwards else 0)

        # vị trí đặt chân: chân bắt đầu = chân phía ngoài theo hướng đi
        y0 = self.yaw[f0]
        lead = "L"
        plants = []  # (dist, side)
        for j in range(1, nsteps + 1):
            plants.append((j * step, "L" if (j % 2 == 1) == (lead == "L") else "R"))
        # vị trí chân trước khi đi
        cur = {s: self.stance_pos[s] for s in ("L", "R")}

        def foot_at(dist, side):
            p, dv = at_dist(dist)
            yw = yaw_of(dv)
            return self._foot_home(p, yw, side, spread=0.95), yw

        frames = f1 - f0
        last_i = 0
        for f in range(f0, f1 + 1):
            k = (f - f0) / max(1, frames)
            dist = trap(k, 0.18 if gait != "run" else 0.12) * total
            p, dv = at_dist(dist)
            yw_target = yaw_of(dv)
            # quay người mượt về hướng đi (ở đầu đoạn đi)
            turn_k = clamp((f - f0) / (0.35 * self.fps), 0, 1)
            self.root[f] = p
            self.yaw[f] = ang_lerp(y0, yw_target, ease_io(turn_k)) if f - f0 < 0.35 * self.fps else yw_target
            u = dist / step  # số bước đã đi (thực)
            i = min(int(math.floor(u)), nsteps - 1)
            fr = clamp(u - i, 0, 1)
            swing_side = plants[i][1]
            stance_side = "R" if swing_side == "L" else "L"
            # vị trí chân trụ = điểm đặt trước đó của nó
            st_dist = plants[i - 1][0] if i >= 1 else 0.0
            if i >= 1:
                st_pos, st_yaw = foot_at(st_dist, stance_side)
            else:
                st_pos, st_yaw = cur[stance_side]
            # chân vung: từ điểm cũ → điểm mới
            if i >= 2:
                a_pos, a_yaw = foot_at(plants[i - 2][0], swing_side)
            else:
                a_pos, a_yaw = cur[swing_side]
            b_pos, b_yaw = foot_at(plants[i][0], swing_side)
            sm = smooth(fr)
            sw = a_pos.lerp(b_pos, sm)
            lift = math.sin(math.pi * fr) * G["lift"] * S
            # gót–mũi: mũi chúc lên khi chuẩn bị đặt gót, gót nhấc khi đạp đi
            pitch_sw = (-0.35 * math.sin(math.pi * clamp((fr - 0.55) / 0.45, 0, 1)) + 0.45 * math.sin(math.pi * clamp(fr / 0.35, 0, 1))) if gait != "sneak" else 0.25 * math.sin(math.pi * fr)
            heel_up = 0.5 * smooth(clamp((fr - 0.6) / 0.4, 0, 1)) if gait != "sneak" else 0.4
            self.feet[swing_side][f] = (Vector((sw.x, sw.y, lift)), ang_lerp(a_yaw, b_yaw, sm), pitch_sw)
            self.feet[stance_side][f] = (Vector((st_pos.x, st_pos.y, 0)), st_yaw, heel_up * 0.6)
            self.planted_flags[swing_side][f] = False
            self.planted_flags[stance_side][f] = True
            self.loco[f] = dict(phase=u, fr=fr, swing=swing_side, gait=gait, G=G, k=k)
            if f > f0 and int(math.floor(u)) > last_i:
                self.events.append((f, "steprun" if gait == "run" else "step", {"who": self.arm.name}))
            last_i = int(math.floor(u))
        # khép chân khi dừng
        fend = f1
        endp = self.root[f1]
        eyaw = self.yaw[f1] if end_yaw is None else end_yaw
        fclose = min(self.n - 1, f1 + int(0.3 * self.fps))
        for s in ("L", "R"):
            last = self.feet[s][f1]
            home = self._foot_home(endp, eyaw, s)
            for f in range(f1 + 1, fclose + 1):
                k = smooth((f - f1) / max(1, fclose - f1))
                pos = last[0].lerp(home, k)
                pos.z = (math.sin(math.pi * k) * 0.05 * S) if (last[0] - home).length > 0.06 * S else 0
                self.feet[s][f] = (pos, ang_lerp(last[1], eyaw, k), 0.0)
                self.planted_flags[s][f] = (last[0] - home).length <= 0.06 * S
                self.root[f] = endp
                self.yaw[f] = ang_lerp(self.yaw[f1], eyaw, ease_io(k))
        self.events.append((fclose, "step", {"who": self.arm.name, "soft": True}))
        self._place_stance(fclose, endp, eyaw)
        self._hold_from(fclose + 1, endp, eyaw)
        return fclose

    def _hold_from(self, f0, pos, yaw):
        for f in range(f0, self.n):
            self.root[f] = Vector((pos.x, pos.y, 0))
            self.yaw[f] = yaw
            for s in ("L", "R"):
                self.feet[s][f] = (self.stance_pos[s][0].copy(), self.stance_pos[s][1], 0.0)
            self.loco[f] = None

    def turn(self, f0, yaw_to, dur=0.6):
        """Quay tại chỗ có bước chân nhỏ (không trượt): mỗi chân nhấc lên đặt lại một lần."""
        f1 = min(self.n - 1, f0 + int(dur * self.fps))
        y0 = self.yaw[f0]
        pos = self.root[f0].copy()
        old = {s: self.stance_pos[s] for s in ("L", "R")}
        new = {s: (self._foot_home(pos, yaw_to, s), yaw_to) for s in ("L", "R")}
        for f in range(f0, f1 + 1):
            k = (f - f0) / max(1, f1 - f0)
            self.yaw[f] = ang_lerp(y0, yaw_to, ease_io(k))
            self.root[f] = pos
            for s, (a, b) in (("L", (0.0, 0.55)), ("R", (0.45, 1.0))):
                kk = clamp((k - a) / (b - a), 0, 1)
                p = old[s][0].lerp(new[s][0], smooth(kk))
                p.z = math.sin(math.pi * kk) * 0.06 * self.S
                self.feet[s][f] = (p, ang_lerp(old[s][1], new[s][1], smooth(kk)), 0.0)
                self.planted_flags[s][f] = kk <= 0 or kk >= 1
            if f in (f0 + int(0.5 * (f1 - f0) * 0.55), f1):
                self.events.append((f, "step", {"who": self.arm.name, "soft": True}))
        self.stance_pos = new
        self._hold_from(f1 + 1, pos, yaw_to)
        return f1

    def jump(self, f0, to=None, height=0.35):
        """Nhảy có lấy đà (nhún), co duỗi (squash & stretch), tiếp đất khuỵu gối."""
        S = self.S
        fa = f0 + int(0.25 * self.fps)
        fl = fa + int(0.45 * self.fps)
        f1 = min(self.n - 1, fl + int(0.3 * self.fps))
        p0 = self.root[f0].copy()
        p1 = Vector((to[0], to[1], 0)) if to else p0.copy()
        yw = self.yaw[f0]
        for f in range(f0, f1 + 1):
            if f <= fa:
                k = (f - f0) / max(1, fa - f0)
                self.hips_extra[f] = Vector((0, 0, -0.14 * S * math.sin(k * math.pi / 2)))
                self.squash[f] = 1 - 0.06 * math.sin(k * math.pi / 2)
                self.root[f] = p0
            elif f <= fl:
                k = (f - fa) / max(1, fl - fa)
                self.root[f] = p0.lerp(p1, smooth(k))
                self.hips_extra[f] = Vector((0, 0, math.sin(math.pi * k) * height * S))
                self.squash[f] = 1 + 0.08 * math.sin(math.pi * min(1, k * 2)) if k < 0.5 else 1.0
                for s in ("L", "R"):
                    home = self._foot_home(self.root[f], yw, s)
                    home.z = self.hips_extra[f].z + 0.06 * S * math.sin(math.pi * k)
                    self.feet[s][f] = (home, yw, 0.3 * math.sin(math.pi * k))
                    self.planted_flags[s][f] = False
            else:
                k = (f - fl) / max(1, f1 - fl)
                self.root[f] = p1
                self.hips_extra[f] = Vector((0, 0, -0.12 * S * math.sin(math.pi * k)))
                self.squash[f] = 1 - 0.07 * math.sin(math.pi * k)
            self.yaw[f] = yw
        self.events.append((fa, "jump", {"who": self.arm.name}))
        self.events.append((fl, "land", {"who": self.arm.name}))
        self._place_stance(f1, p1, yw)
        self._hold_from(f1 + 1, p1, yw)
        return f1

    # ---------- lớp thân trên ----------
    def gesture(self, f0, f1, name, fin=0.3, fout=0.35, amp=1.0, hands=None):
        """Động tác từ thư viện gestures.json (tay theo khung ngực, thân, đầu, mặt)."""
        G = load_gestures()[name]
        self.layers.append(dict(f0=f0, f1=f1, fin=int(fin * self.fps), fout=int(fout * self.fps), g=G, amp=amp, kind="gesture", hands=hands))
        if G.get("face"):
            self.face_keys.append((f0, f1, G["face"], int(0.2 * self.fps), int(0.3 * self.fps)))
        return f1

    def reach(self, f0, f1, side, target_fn, fin=0.45, fout=0.4, crouch=0.0, lean=0.0, anticip=True):
        """Với tay tới mục tiêu (hàm frame → Vector world), có lấy đà và cúi người."""
        self.layers.append(dict(f0=f0, f1=f1, fin=int(fin * self.fps), fout=int(fout * self.fps), kind="reach",
                                side=side, target=target_fn, crouch=crouch, lean=lean, anticip=anticip))
        return f1

    def look(self, f0, f1, target, w=1.0):
        """Nhìn về mục tiêu: Vector world hoặc hàm frame → Vector."""
        self.looks.append((f0, f1, target, w))

    def emote(self, f0, f1, keys, fin=0.25, fout=0.35):
        self.face_keys.append((f0, f1, keys, int(fin * self.fps), int(fout * self.fps)))

    def speak(self, f0, env, gest=True, f1=None):
        """env: danh sách độ mở miệng 0..1 theo từng frame (từ âm lượng giọng thật)."""
        self.talk.append((f0, env, gest))

    # ---------- tổng hợp & bake ----------
    def _chest_frame(self, f):
        """Khung toạ độ ngực (gốc, trục phải, trục trước, trục lên) để đặt tay."""
        yw = self.yaw[f]
        fwd = yaw_vec(yw)
        right = Vector((math.cos(yw), math.sin(yw), 0))
        up = Vector((0, 0, 1))
        base = self.root[f] + Vector((0, 0, 1.47 * self.S)) + self.hips_extra[f]
        return base, right, fwd, up

    def solve(self):
        """Tính toàn bộ giá trị khung hình → dict kênh."""
        S = self.S
        fps = self.fps
        out = []
        blink_t = [random.Random(self.seed + i).uniform(2.2, 5.0) for i in range(200)]
        blink_frames = set()
        t = 0.6
        i = 0
        while t * fps < self.n:
            t += blink_t[i % 200]
            i += 1
            bf = int(t * fps)
            for d in range(0, int(0.16 * fps)):
                blink_frames.add((bf + d, d / max(1, int(0.16 * fps))))
        blink_map = {}
        for (bf, k) in blink_frames:
            blink_map[bf] = max(blink_map.get(bf, 0), math.sin(math.pi * k))
        prev_head = Vector((0, 0, 0))
        for f in range(self.n):
            tt = f / fps
            yw = self.yaw[f]
            loco = self.loco[f]
            hips = Vector((0, 0, 0))   # (lateral, up, forward) theo trục xương hông
            hips_rot = Vector((0, 0, 0))
            spine = Vector((0, 0, 0))
            chest = Vector((0, 0, 0))
            neck = Vector((0, 0, 0))
            head = Vector((0, 0, 0))
            # thở + dồn trọng tâm
            breath = math.sin(tt * 2 * math.pi / 3.6 + self.seed)
            chest.x += 0.015 * breath
            if loco is None:
                sway = noise1(tt * 0.35, self.seed) * 0.018 * S
                hips.x += sway
                hips_rot.z += -sway * 1.5
                head.x += noise1(tt * 0.5, self.seed + 3) * 0.03
                head.z += noise1(tt * 0.4, self.seed + 5) * 0.04
            else:
                G = loco["G"]
                ph = loco["phase"]
                s_ = 1 if loco["swing"] == "L" else -1
                hips.y += -G["bob"] * S * (1 - math.sin(math.pi * loco["fr"])) - G["crouch"] * S
                hips.x += -s_ * 0.025 * S * math.sin(math.pi * loco["fr"])      # lắc về chân trụ
                hips_rot.y += s_ * 0.12 * math.cos(math.pi * loco["fr"])           # hông xoay theo bước
                chest.y += -s_ * 0.16 * math.cos(math.pi * loco["fr"])            # vai xoay ngược
                spine.x += G["lean"]
                head.x += -G["lean"] * 0.6
                hips_rot.z += -s_ * 0.04 * math.sin(math.pi * loco["fr"])
            hips += Vector((0, self.hips_extra[f].z, 0))
            # tay mặc định
            base, right, fwd, up = self._chest_frame(f)
            hand = {}
            for side, sx in (("L", 1), ("R", -1)):
                rest = base + right * (sx * 0.22 * S) - up * (0.55 * S) + fwd * (0.04 * S)
                rest += right * sx * 0.01 * S * math.sin(tt * 1.3 + sx)
                if loco is not None:
                    G = loco["G"]
                    other = "R" if side == "L" else "L"
                    fp = self.feet[other][f][0]
                    rel = (fp - self.root[f]).dot(fwd) / max(0.1, G["step"] * S)
                    sw_amt = G["swing"] * S * clamp(rel, -1.2, 1.2)
                    rest += fwd * sw_amt + up * (abs(sw_amt) * 0.35)
                    if loco["gait"] in ("run",):
                        rest += up * 0.22 * S + fwd * 0.08 * S
                hand[side] = rest
            # lớp động tác
            face_add = {}
            for L in self.layers:
                if f < L["f0"] or f > L["f1"] + L["fout"]:
                    continue
                win = smooth((f - L["f0"]) / max(1, L["fin"]))
                wout = 1 - smooth((f - L["f1"]) / max(1, L["fout"])) if f > L["f1"] else 1.0
                w = win * wout
                lt = (f - L["f0"]) / fps
                if L["kind"] == "gesture":
                    g = L["g"]
                    osc = g.get("osc", 0) * L["amp"]
                    ofr = g.get("osc_hz", 2.0)
                    for side, sx in (("L", 1), ("R", -1)):
                        hv = g.get("hands", {}).get(side)
                        if hv is None or hv == "rest":
                            continue
                        if L.get("hands") and side not in L["hands"]:
                            continue
                        x, y, z = hv
                        o = math.sin(lt * ofr * 2 * math.pi + (0 if side == "L" else g.get("osc_phase", 0))) * osc
                        ax = g.get("osc_axis", "z")
                        tgt = base + right * (sx * x * S if not g.get("absolute_x") else x * S) + fwd * (y * S) + up * (z * S)
                        tgt += {"x": right * sx, "y": fwd, "z": up}[ax] * o * S
                        hand[side] = hand[side].lerp(tgt, w)
                    for key, vec in (("spine", spine), ("chest", chest), ("head", head)):
                        if key in g:
                            a = g[key]
                            wob = math.sin(lt * g.get(key + "_hz", 0) * 2 * math.pi) if g.get(key + "_hz") else 0
                            vec += Vector((a[0], a[1], a[2])) * w + Vector(g.get(key + "_osc", (0, 0, 0))) * wob * w
                    if "hips_dz" in g:
                        hips.y += g["hips_dz"] * S * w
                elif L["kind"] == "reach":
                    side = L["side"]
                    tgt = L["target"](f)
                    k_ant = 0.0
                    if L["anticip"]:
                        k_ant = math.sin(math.pi * clamp((f - L["f0"]) / max(1, L["fin"] * 0.5), 0, 1)) * (1 - win) * 0.5
                    hand[side] = hand[side].lerp(tgt, w)
                    hips.y += -L["crouch"] * S * w + 0.02 * S * k_ant
                    spine.x += L["lean"] * w
                    chest.x += L["lean"] * 0.5 * w
            # nói: cử chỉ + gật đầu theo âm lượng
            talk_open = 0.0
            for (f0, env, gest) in self.talk:
                j = f - f0
                if 0 <= j < len(env):
                    talk_open = max(talk_open, env[j])
                    if gest:
                        wv = clamp(j / (0.4 * fps), 0, 1) * clamp((len(env) - j) / (0.4 * fps), 0, 1)
                        head.x += (env[j] - 0.3) * 0.06 * wv
                        head.z += noise1(tt * 0.9, self.seed + 9) * 0.06 * wv
                        busy = any(L["f0"] <= f <= L["f1"] for L in self.layers)
                        if not busy and loco is None:
                            for side, sx in (("L", 1), ("R", -1)):
                                n1 = noise1(tt * 1.2 + sx * 3, self.seed + 11 + sx)
                                n2 = noise1(tt * 1.7 + sx * 5, self.seed + 21 + sx)
                                g = base + right * (sx * (0.2 + 0.06 * n1) * S) + fwd * (0.22 + 0.06 * n2) * S - up * (0.28 - 0.08 * env[j]) * S
                                amt = wv * (0.85 if side == "R" else 0.55)
                                hand[side] = hand[side].lerp(g, amt)
            # nhìn
            for (f0, f1, target, wl) in self.looks:
                if f0 <= f <= f1 + int(0.4 * fps):
                    w = smooth((f - f0) / (0.35 * fps)) * (1 - smooth((f - f1) / (0.4 * fps)) if f > f1 else 1) * wl
                    tg = target(f) if callable(target) else Vector(target)
                    eye = self.root[f] + Vector((0, 0, 1.72 * S))
                    d = tg - eye
                    want_yaw = math.atan2(d.x, -d.y) - yw
                    want_yaw = (want_yaw + math.pi) % (2 * math.pi) - math.pi
                    want_pitch = math.atan2(d.z, Vector((d.x, d.y, 0)).length)
                    head.y += clamp(want_yaw, -1.1, 1.1) * 0.65 * w * -1
                    neck.y += clamp(want_yaw, -1.1, 1.1) * 0.35 * w * -1
                    head.x += -clamp(want_pitch, -0.6, 0.6) * w
            # đầu trễ nhịp (follow-through) — lọc thông thấp
            prev_head = prev_head.lerp(head, 0.35) if f > 0 else head.copy()
            # khuôn mặt
            face = {"blink": blink_map.get(f, 0.0)}
            for (f0, f1, keys, fin, fout) in self.face_keys:
                if f0 <= f <= f1 + fout:
                    w = smooth((f - f0) / max(1, fin)) * ((1 - smooth((f - f1) / max(1, fout))) if f > f1 else 1)
                    for k, v in keys.items():
                        face[k] = max(face.get(k, 0), v * w)
            if talk_open > 0:
                face["mouth_open"] = max(face.get("mouth_open", 0), clamp(talk_open * 1.1, 0, 1))
                face["mouth_O"] = clamp(noise1(tt * 6, self.seed) * 0.6 * talk_open, 0, 0.6)
            out.append(dict(root=self.root[f], yaw=yw, hips=hips, hips_rot=hips_rot, spine=spine, chest=chest, neck=neck,
                            head=prev_head.copy(), hands=hand, feet={s: self.feet[s][f] for s in ("L", "R")}, face=face,
                            squash=self.squash[f]))
        return out


# ----------------------------- BAKE -----------------------------
class FCBaker:
    """Ghi nhanh keyframe hàng loạt bằng fcurve.keyframe_points.foreach_set."""

    def __init__(self, id_data):
        self.id = id_data
        if not id_data.animation_data:
            id_data.animation_data_create()
        if not id_data.animation_data.action:
            id_data.animation_data.action = __import__("bpy").data.actions.new(f"{id_data.name}_act")
        self.act = id_data.animation_data.action
        self.buf = {}

    def add(self, path, index, frame, value, group=None):
        self.buf.setdefault((path, index, group), []).append((frame, value))

    def write(self):
        for (path, index, group), pts in self.buf.items():
            fc = self.act.fcurves.find(path, index=index)
            if fc is None:
                fc = self.act.fcurves.new(path, index=index, action_group=group or "")
            fc.keyframe_points.add(len(pts))
            flat = []
            for (fr, v) in pts:
                flat += [fr, v]
            fc.keyframe_points.foreach_set("co", flat)
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
            fc.update()


def bake_actor(actor, frames_out):
    """Ghi kết quả solve() vào armature + shape keys."""
    import bpy
    arm = actor.arm
    S = actor.S
    B = FCBaker(arm)
    face_obj = bpy.data.objects.get(f"{arm.name}_face")
    FB = FCBaker(face_obj.data.shape_keys) if face_obj else None
    rest = {b.name: b.matrix_local.copy() for b in arm.data.bones}
    for pbn in ("root", "foot_ik.L", "foot_ik.R", "hand_ik.L", "hand_ik.R"):
        arm.pose.bones[pbn].rotation_mode = "QUATERNION"
    ankle_z = 0.06 * S

    def basis_for(bname, Mdesired):
        return rest[bname].inverted() @ Mdesired

    for f, st in enumerate(frames_out):
        fr = f + 1
        yw = st["yaw"]
        Rz = Matrix.Rotation(yw, 4, "Z")
        # root (không cha): ma trận mong muốn = dịch + xoay quanh Z
        Mroot = Matrix.Translation(st["root"]) @ Rz @ rest["root"].to_3x3().to_4x4()
        bm = basis_for("root", Mroot)
        loc, rot, _ = bm.decompose()
        for i in range(3):
            B.add('pose.bones["root"].location', i, fr, loc[i], "root")
        for i in range(4):
            B.add('pose.bones["root"].rotation_quaternion', i, fr, rot[i], "root")
        # hông / cột sống / đầu: giá trị local
        h = st["hips"]
        for i, v in enumerate((h.x, h.y, h.z)):
            B.add('pose.bones["hips"].location', i, fr, v, "hips")
        for name, vec in (("hips", st["hips_rot"]), ("spine", st["spine"]), ("chest", st["chest"]), ("neck", st["neck"]), ("head", st["head"])):
            for i in range(3):
                B.add(f'pose.bones["{name}"].rotation_euler', i, fr, vec[i], name)
        sq = st["squash"]
        for i, v in enumerate((1 / math.sqrt(sq), sq, 1 / math.sqrt(sq))):
            B.add('pose.bones["hips"].scale', i, fr, v, "hips")
        # bàn chân IK
        for side in ("L", "R"):
            pos, fy, pitch = st["feet"][side]
            P = Vector((pos.x, pos.y, pos.z + ankle_z + abs(math.sin(pitch)) * 0.05 * S))
            M = Matrix.Translation(P) @ Matrix.Rotation(fy, 4, "Z") @ rest[f"foot_ik.{side}"].to_3x3().to_4x4() @ Matrix.Rotation(pitch * 0.6, 4, "X")
            bmx = basis_for(f"foot_ik.{side}", M)
            loc, rot, _ = bmx.decompose()
            for i in range(3):
                B.add(f'pose.bones["foot_ik.{side}"].location', i, fr, loc[i], f"foot_ik.{side}")
            for i in range(4):
                B.add(f'pose.bones["foot_ik.{side}"].rotation_quaternion', i, fr, rot[i], f"foot_ik.{side}")
            hp = st["hands"][side]
            M = Matrix.Translation(hp) @ Matrix.Rotation(yw, 4, "Z") @ rest[f"hand_ik.{side}"].to_3x3().to_4x4()
            bmx = basis_for(f"hand_ik.{side}", M)
            loc, rot, _ = bmx.decompose()
            for i in range(3):
                B.add(f'pose.bones["hand_ik.{side}"].location', i, fr, loc[i], f"hand_ik.{side}")
            for i in range(4):
                B.add(f'pose.bones["hand_ik.{side}"].rotation_quaternion', i, fr, rot[i], f"hand_ik.{side}")
        if FB:
            for k in ("blink", "smile", "frown", "mouth_open", "mouth_O", "brow_up", "brow_angry", "brow_sad", "look_L", "look_R"):
                FB.add(f'key_blocks["{k}"].value', 0, fr, float(st["face"].get(k, 0.0)), "face")
    B.write()
    if FB:
        FB.write()
