"""Sinh film3d.json — phần TRUYỆN 3D của phim "Phi vụ giải cứu bánh tráng trứng" (căn tin cô Bảy).

Các đoạn giảng Toán (nhìn từ trên xuống, kiểu Manim) dựng riêng bằng engine 2D rồi ghép xen kẽ;
mỗi đoạn 3D bắt đầu bằng một mốc "mark" (S1…S8) để cắt đúng chỗ khi ghép.
"""
import json
import math
import pathlib

TOP = 0.95
C = (-0.40, 1.33, 1.145)                      # tâm mặt bánh
R = 0.10
A = (C[0] + R * math.cos(math.radians(-135)), C[1] + R * math.sin(math.radians(-135)), 1.147)
B = (C[0] + R * math.cos(math.radians(-45)), C[1] + R * math.sin(math.radians(-45)), 1.147)
ARC = [(C[0] + R * 0.97 * math.cos(math.radians(t)), C[1] + R * 0.97 * math.sin(math.radians(t)), 1.147) for t in range(-135, -44, 9)]
PINS = {n: (-0.60 + 0.075 * i, 1.075, 1.15) for i, n in enumerate((55, 56, 57, 58, 59))}
BTN_CRISP, BTN_LID = (-0.08, 1.15, 1.17), (0.01, 1.15, 1.17)
TI0 = (-0.62, 0.80)
TI_PRESS = (-0.28, 0.80)
TI_HEAD = math.atan2(C[0] - TI0[0], -(C[1] - TI0[1]))
RING_AT = (-1.35, -0.25, 0.97)

CAM = {
    "wide": {"preset": "establishing_wide", "subject": ["ti", "co"], "dist": 6.5, "h": 1.6},
    "two": {"preset": "wide", "subject": ["ti", "co"], "dist": 4.2, "h": 0.9},
    "machine": {"preset": "insert_hand", "subject": [-0.30, 1.15, 1.22], "dist": 0.8, "h": 0.15, "az": 55, "lens": 42, "fstop": 6.0},
    "pins": {"preset": "insert_hand", "subject": [-0.45, 1.08, 1.16], "dist": 0.55, "h": 0.06, "az": 45, "lens": 45, "fstop": 7.0},
    "screen": {"preset": "insert_hand", "subject": [-0.04, 1.16, 1.27], "dist": 0.45, "h": 0.03, "az": 25, "lens": 50, "fstop": 6.0},
    "drop": {"preset": "insert_hand", "subject": [-0.03, 1.22, 1.3], "dist": 0.5, "h": 0.1, "az": 60, "lens": 50, "fstop": 5.0},
    "top": {"preset": "insert_hand", "subject": list(C), "dist": 0.3, "h": 0.42, "az": 50, "lens": 42, "fstop": 11.0},
    "banh": {"preset": "insert_hand", "subject": [C[0], C[1] - 0.02, C[2]], "dist": 0.45, "h": 0.25, "az": 45, "lens": 48, "fstop": 9.0},
    "ti": {"preset": "medium_close", "subject": "ti", "az": 25},
    "ti_face": {"preset": "close_up", "subject": "ti", "az": 0},
    "knees": {"preset": "insert_hand", "subject": [TI0[0], TI0[1], 0.42], "dist": 1.1, "h": 0.05, "az": 20, "lens": 40, "fstop": 4.0},
    "co": {"preset": "medium_close", "subject": "co", "az": -35},
    "co_wide": {"preset": "medium", "subject": "co", "az": -30},
    "gian": {"preset": "insert_hand", "subject": [C[0], C[1] - 0.03, C[2] + 0.01], "dist": 0.32, "h": 0.14, "az": 45, "lens": 50, "fstop": 9.0},
    "flight": {"preset": "wide", "subject": [-0.9, 0.4, 1.95], "dist": 1.9, "h": -0.2, "az": 30, "lens": 35, "fstop": 8.0},
    "ring": {"preset": "insert_hand", "subject": list(RING_AT), "dist": 1.3, "h": 0.4, "az": -45, "lens": 40, "fstop": 6.0},
}


def cam(name, **over):
    c = dict(CAM[name])
    c.update(over)
    return c


def say(who, text, sub=None, **kw):
    d = {"do": "say", "who": who, "text": text}
    if sub:
        d["sub"] = sub
    d.update(kw)
    return d


def anim(target, keys, **kw):
    d = {"do": "anim", "target": target, "keys": keys}
    d.update(kw)
    return d


def show(target, t=0.0, on=True, **kw):
    return anim(target, [{"t": t, "show": on}], **kw)


def mark(name, **kw):
    d = {"do": "wait", "dur": 0.0, "mark": name}
    d.update(kw)
    return d


acts = []
add = acts.extend

# ======================= S1 · MỞ MÀN: ĐỘ GIÒN VĨNH VIỄN =======================
add([
    mark("S1", cam=cam("wide")),
    {"do": "sfx", "name": "crowd", "vol": 0.35, "len": 6.0},
    {"do": "sfx", "name": "sizzle", "vol": 0.5, "dur": 3.0},
    {"do": "wait", "dur": 2.2},
    # giọt tương lăn trên vỏ máy
    {"do": "wait", "dur": 0.0, "cam": cam("drop")},
    show("m_drop_mesh", 0.0, True),
    anim("m_drop_mesh", [{"t": 0, "loc": [0.01, 1.33, 1.38]}, {"t": 1.2, "loc": [-0.03, 1.185, 1.378], "ease": "LINEAR"}], with_=None),
    {"do": "reach", "who": "ti", "at": [-0.16, 1.18, 1.36], "dur": 1.6, "fin": 0.5, "with": True, "offset": 0.4, "extend": False},
    anim("m_drop_mesh", [{"t": 0, "loc": [-0.03, 1.185, 1.378]}, {"t": 0.22, "loc": [-0.05, 1.16, 1.3]}, {"t": 0.45, "loc": [-0.08, 1.158, 1.19], "ease": "LINEAR"}]),
    # TÁCH! nút giòn tan, nắp sập, 5 chốt khoá liên tiếp
    anim("btn_crisp", [{"t": 0, "loc": [-0.08, 1.16, 1.17]}, {"t": 0.06, "loc": [-0.08, 1.168, 1.17]}, {"t": 0.25, "loc": [-0.08, 1.16, 1.17]}], sfx_at=[["click", 0.0], ["beep2", 0.05]]),
    show("m_drop_mesh", 0.1, False, with_=None),
    anim("lid", [{"t": 0, "rot": [-70, 0, 0]}, {"t": 0.16, "rot": [0, 0, 0], "ease": "LINEAR"}], sfx_at=[["slam", 0.16]], cam=cam("machine")),
    {"do": "pin", "n": 55, "state": "lock", "cam": cam("pins")},
    {"do": "pin", "n": 56, "state": "lock"}, {"do": "pin", "n": 57, "state": "lock"}, {"do": "pin", "n": 58, "state": "lock"}, {"do": "pin", "n": 59, "state": "lock"},
    {"do": "wait", "dur": 0.4},
    {"do": "screen", "msg": "forever", "cam": cam("screen")},
    say("may", "Quý khách vừa chọn độ giòn... vĩnh viễn.", "Quý khách vừa chọn độ giòn… vĩnh viễn."),
    {"do": "turn", "who": "ti", "face": "camera", "dur": 0.4, "cam": cam("ti_face")},
    say("ti", "Cô Bảy, con thề con chưa đụng cái nút!", gesture="shrug", emotion={"brow_up": 0.8, "mouth_O": 0.3}),
    {"do": "knock", "who": "ti", "count": 3, "period": 0.32, "cam": cam("knees", subject=[TI0[0], TI0[1], 0.42])},
    {"do": "wait", "dur": 0.3},
    {"do": "turn", "who": "co", "face": [TI0[0], TI0[1]], "dur": 0.5, "cam": cam("co")},
    say("co", "Miệng con nói xong rồi. Hai cái đầu gối... còn muốn khai thêm kìa.", emotion={"smile": 0.5}),
    {"do": "turn", "who": "ti", "face": [0.3, 2.0], "dur": 0.4, "cam": cam("two")},
    anim("wire_reel", [{"t": 0, "loc": [0.55, 1.45, 0.98], "rot": [90, 0, 0]}, {"t": 0.4, "loc": [0.15, 1.1, 1.55], "rot": [90, 0, 360]},
                       {"t": 0.85, "loc": [TI0[0] + 0.05, TI0[1] + 0.18, 1.0], "rot": [90, 0, 720]}], sfx_at=[["swish", 0.0], ["grab", 0.85]], cam=cam("two")),
    {"do": "gesture", "who": "ti", "name": "cheer", "dur": 1.2, "with": True, "offset": 0.7},
    {"do": "wait", "dur": 0.6},
])

# ======================= S2 · THẺ 55: QUẤN DÂY =======================
add([
    mark("S2", cam=cam("screen")),
    {"do": "screen", "msg": "p55"},
    say("may", "Chốt năm mươi lăm. Vui lòng quấn dây cách nhiệt đúng một vòng mép bánh.", "Chốt 55: quấn dây đúng một vòng mép bánh."),
    {"do": "reach", "who": "ti", "at": [C[0] + 0.05, C[1] - 0.12, C[2] + 0.08], "dur": 2.4, "cam": cam("banh")},
    anim("radius_wire", [{"t": 0, "reveal": 0.0}, {"t": 1.0, "reveal": 1.0}], with_=True),
    say("ti", "Từ tâm ra mép mười xen-ti-mét. Vậy cắt mười xen-ti-mét dây là đủ!", "Từ tâm ra mép 10 cm. Cắt 10 cm dây là đủ!", cam=cam("ti")),
    {"do": "reach", "who": "ti", "at": [C[0] - 0.05, C[1] - 0.12, C[2] + 0.08], "dur": 1.8, "cam": cam("top")},
    anim("short_wire", [{"t": 0, "reveal": 0.0}, {"t": 1.2, "reveal": 1.0}], sfx_at=[["chalk", 0.0]]),
    say("ti", "Ủa... sao hụt xa vậy?", "Ủa… sao hụt xa vậy?", cam=cam("top")),
    {"do": "reach", "who": "ti", "at": [C[0] - 0.2, C[1] - 0.45, C[2] + 0.1], "dur": 0.6, "fin": 0.15, "cam": cam("ti")},
    # PỰT! dây bật lên dính ngang môi thành bộ ria
    anim("short_wire", [{"t": 0.0, "show": False}], sfx_at=[["pluck", 0.0], ["boing", 0.08]]),
    {"do": "attach", "who": "ti", "target": "ria", "head_offset": [0, 0.98, -0.42], "with": True},
    {"do": "turn", "who": "ti", "face": "camera", "dur": 0.35, "cam": cam("ti_face")},
    {"do": "emote", "who": "ti", "keys": {"brow_up": 1.0, "mouth_O": 0.7}, "dur": 1.2},
    {"do": "turn", "who": "co", "face": [TI0[0], TI0[1]], "dur": 0.3, "cam": cam("co")},
    say("co", "Mười phân là từ tâm ra mép. Con tính lấy đoạn từ nhà ra đầu hẻm... mà quấn nguyên cái xóm hả?", "Mười phân là từ tâm ra mép. Con tính quấn nguyên cái xóm hả?", emotion={"brow_up": 0.4, "smile": 0.3}),
    {"do": "wait", "dur": 0.5, "cam": cam("ti_face")},
])

# ======================= S3 · THẺ 56: GIÁN ĐIỆN ĐI SAI ĐƯỜNG =======================
FEET = [f"foot_{i}_{s}" for i in range(12) for s in (-1, 1)]
add([
    mark("S3", cam=cam("pins")),
    anim("ria", [{"t": 0, "show": False}]),
    {"do": "turn", "who": "ti", "face": [C[0], C[1]], "dur": 0.01},
    {"do": "pin", "n": 55, "state": "open"},
    {"do": "screen", "msg": "p56", "cam": cam("screen")},
    say("may", "Chốt năm mươi sáu. Hàn kín phần mép cong giữa hai điểm A và B.", "Chốt 56: hàn mép cong giữa hai điểm A và B."),
    {"do": "gian_walk", "path": [[0.25, 1.12, TOP], [-0.18, 1.04, TOP], [-0.18, 1.04, 1.13], [-0.3, 1.18, 1.135], list(A)], "dur": 3.0,
     "cam": {"preset": "insert_hand", "subject": [-0.1, 1.1, 1.03], "dist": 0.7, "h": 0.15, "az": 30, "lens": 45, "fstop": 6.0}},
    {"do": "sfx", "name": "beep2", "vol": 0.8},
    {"do": "gian_walk", "path": [list(A), list(B)], "dur": 1.6, "ease": False, "cam": cam("gian")},
] + [show(f, 0.12 * (i // 2) + 0.05, True, with_=True) for i, f in enumerate(FEET)] + [
    say("gps", "Bạn đã đến nơi.", cam=cam("top")),
    {"do": "turn", "who": "ti", "face": "camera", "dur": 0.3, "cam": cam("ti_face")},
    say("ti", "Đúng địa chỉ. Sai nguyên con đường!", gesture="facepalm"),
    {"do": "walk", "who": "co", "to": [[-0.05, 1.95]], "face": [C[0], C[1]], "cam": cam("co_wide")},
    {"do": "reach", "who": "co", "at": [C[0], C[1] - 0.02, C[2] + 0.03], "dur": 1.6, "hand": "R", "cam": cam("banh")},
    anim(FEET, [{"t": 0.4, "show": False}], sfx_at=[["spray", 0.2]], with_=True),
    {"do": "wait", "dur": 0.4},
])

# ======================= S4 · THẺ 57: PHỦ TRỨNG VÒNG VÒNG =======================
add([
    mark("S4", cam=cam("pins")),
    anim("weld_arc", [{"t": 0, "reveal": 1.0}]),
    {"do": "pin", "n": 56, "state": "open"},
    {"do": "screen", "msg": "p57", "cam": cam("screen")},
    say("may", "Chốt năm mươi bảy. Vui lòng khai báo phần mặt bánh cần phủ trứng.", "Chốt 57: khai báo phần mặt bánh cần phủ trứng."),
    say("ti", "Dễ! Con bấm lại chế độ vừa dùng!", "Dễ! Bấm lại chế độ vừa dùng!", cam=cam("ti")),
    {"do": "walk", "who": "ti", "to": [list(TI_PRESS)], "face": [C[0], C[1]], "cam": cam("machine")},
    {"do": "reach", "who": "ti", "at": list(BTN_CRISP), "dur": 1.0, "tap": True},
    {"do": "sfx", "name": "beep"},
    show("egg_ring", 0.3, True, sfx_at=[["spray", 0.0], ["sizzle", 0.2]], dur=1.6, cam=cam("top")),
    {"do": "walk", "who": "ti", "to": [list(TI0)], "face": [C[0], C[1]], "gait": "back", "with": True, "extend": False},
    {"do": "wait", "dur": 0.8},
    {"do": "reach", "who": "co", "at": [C[0], C[1] - 0.06, 1.42], "dur": 4.6, "hand": "R", "cam": cam("co_wide")},
    anim("banh", [{"t": 0, "loc": list(C), "rot": [0, 0, 0]}, {"t": 0.6, "loc": [C[0], C[1] - 0.06, 1.42], "rot": [-62, 0, 0]},
                  {"t": 4.0, "loc": [C[0], C[1] - 0.06, 1.42], "rot": [-62, 0, 0]}, {"t": 4.6, "loc": list(C), "rot": [0, 0, 0]}], with_=True),
    say("co", "Bánh này mà bán, chắc cô phải dặn khách cắn vòng vòng. Cắn vô giữa... là lộ.", "Bánh này mà bán, cô phải dặn khách cắn vòng vòng!", with_=True, offset=0.6,
        cam={"preset": "insert_hand", "subject": [C[0], C[1] - 0.06, 1.42], "dist": 0.9, "h": 0.05, "az": 10, "lens": 40, "fstop": 5.0}),
    {"do": "wait", "dur": 0.4, "cam": cam("ti")},
])

# ======================= S5 · THẺ 58: RƯỚI TƯƠNG HÌNH QUẠT =======================
add([
    mark("S5", cam=cam("pins")),
    anim("egg_ring", [{"t": 0, "show": False}]),
    anim(["egg_full"] + [f"banh_dot{i}" for i in range(18)], [{"t": 0, "show": True}]),
    {"do": "pin", "n": 57, "state": "open"},
    {"do": "screen", "msg": "p58", "cam": cam("screen")},
    say("co", "Giờ rưới tương kín một miếng hình quạt, góc ở tâm chín mươi độ.", "Rưới tương kín miếng hình quạt 90°.", cam=cam("co")),
    say("ti", "Dạ! Con chọn lại năm pi xen-ti-mét nha cô!", "Con chọn lại 5π cm nha cô!", cam=cam("ti")),
    {"do": "reach", "who": "ti", "at": list(BTN_CRISP), "dur": 2.6, "fin": 0.5, "with": True, "extend": False},
    {"do": "gian_walk", "path": [list(B), list(A)], "dur": 0.8, "cam": cam("gian")},
    {"do": "gian_walk", "path": ARC + [list(B)], "dur": 1.8},
    {"do": "gian_walk", "path": [list(B), [C[0] + 0.035, C[1] - 0.085, 1.147]], "dur": 0.5, "face_end": 135},
    {"do": "gian_point", "up": True, "aim": 0, "cam": cam("top")},
    {"do": "wait", "dur": 0.9},
    say("ti", "À! Năm pi là đường em vừa bò. Giờ cô muốn ăn tương... nguyên miếng!", "À! 5π là đường em vừa bò. Cô muốn tương nguyên miếng!", cam=cam("ti")),
    {"do": "gian_point", "up": False},
])

# ======================= S6 · HAI GIỌT TƯƠNG — BÁNH BAY =======================
add([
    mark("S6", cam=cam("pins")),
    anim("sauce_q", [{"t": 0, "show": True}]),
    {"do": "pin", "n": 58, "state": "open"},
    {"do": "screen", "msg": "idle", "beep": False, "cam": cam("screen")},
    say("may", "Quý khách dùng mấy giọt tương?"),
    say("ti", "Hai giọt. Nghe kỹ chữ giọt nha!", "Hai giọt. Nghe kỹ chữ GIỌT nha!", cam=cam("ti")),
    show("m_drop_mesh", 0.0, True, cam=cam("drop")),
    anim("m_drop_mesh", [{"t": 0, "loc": [0.01, 1.33, 1.38]}, {"t": 0.6, "loc": [-0.2, 1.3, 1.36]}, {"t": 1.0, "loc": [C[0] + 0.02, C[1] - 0.02, 1.15], "ease": "LINEAR"}],
         sfx_at=[["plop", 1.0]], cam=cam("banh")),
    show("m_drop_mesh", 0.05, False),
    {"do": "gesture", "who": "ti", "name": "relief" if False else "shrug", "dur": 1.0, "cam": cam("ti")},
    show("m_drop2", 0.0, True, cam=cam("drop")),
    anim("m_drop2", [{"t": 0, "loc": [0.01, 1.33, 1.38]}, {"t": 0.7, "loc": [0.02, 1.18, 1.37]}, {"t": 1.15, "loc": [0.01, 1.162, 1.19], "ease": "LINEAR"}], sfx_at=[["click", 1.15]]),
    # PHỰT! nắp bật, bánh bay xoáy
    anim("lid", [{"t": 0, "rot": [0, 0, 0]}, {"t": 0.12, "rot": [-115, 0, 0], "ease": "LINEAR"}], sfx_at=[["boing", 0.0], ["whoosh", 0.1]], cam=cam("flight")),
    show("m_drop2", 0.0, False, with_=True),
    anim("banh", [{"t": 0, "loc": list(C), "rot": [0, 0, 0]}, {"t": 0.9, "loc": [-0.8, 0.6, 2.25], "rot": [180, 40, 540]},
                  {"t": 2.6, "loc": [-1.15, 0.0, 2.05], "rot": [250, 60, 720], "ease": "LINEAR"}], with_=True, extend=False),
    show("sauce_puddle", 0.0, True, with_=True),
    {"do": "walk", "who": "ti", "to": [[-0.75, 0.45], [-0.85, 0.05]], "gait": "run", "speed": 1.4, "with": True, "offset": 0.2},
    {"do": "jump", "who": "ti", "to": [-0.95, -0.45], "height": 0.15},
    {"do": "walk", "who": "co", "to": [[0.2, 1.95]], "face": [-1.35, -0.25], "with": True, "offset": -1.5},
    anim("cheese_ring", [{"t": 0, "loc": [0.6, 1.35, TOP + 0.05], "scale": 0.01}, {"t": 0.4, "loc": [0.3, 1.2, 1.4], "scale": 1.0},
                         {"t": 1.3, "loc": list(RING_AT), "scale": 1.0}], sfx_at=[["magic", 0.0], ["whoosh", 0.4]], with_=True, offset=0.4, cam=cam("ring")),
    {"do": "screen", "msg": "p59"},
    say("may", "Cảnh báo! Chốt năm mươi chín: tính diện tích vòng đỡ!", "Chốt 59: tính diện tích vòng đỡ!", cam=cam("flight", subject=[-1.1, 0.0, 1.6])),
])

# ======================= S7 · BỘP! =======================
add([
    mark("S7", cam=cam("ring")),
    {"do": "pin", "n": 59, "state": "open", "cam": cam("pins")},
    anim("banh", [{"t": 0, "loc": [-1.15, 0.0, 2.05], "rot": [250, 60, 720]}, {"t": 0.7, "loc": [RING_AT[0], RING_AT[1], RING_AT[2] + 0.01], "rot": [360, 0, 720], "ease": "LINEAR"}],
         sfx_at=[["whoosh", 0.0], ["plop", 0.7], ["land", 0.7]], cam=cam("ring")),
    {"do": "wait", "dur": 1.3},
    {"do": "gian_walk", "path": [[-0.24, 1.11, 1.12], [-0.2, 1.11, 1.12]], "dur": 0.3,
     "cam": {"preset": "insert_hand", "subject": [-0.2, 1.11, 1.14], "dist": 0.3, "h": 0.05, "az": 40, "lens": 50, "fstop": 8.0}},
    {"do": "bell"},
    {"do": "wait", "dur": 1.0},
])

# ======================= S8 · KẾT: GIÁN ĐIỆN ĐÒI TĂNG CA =======================
SL = [C[0] + 0.0, C[1] - 0.05, C[2]]
add([
    mark("S8", cam=cam("banh")),
    anim("banh", [{"t": 0, "show": False}]) if False else anim(["banh_base", "egg_full", "sauce_q"] + [f"banh_dot{i}" for i in range(18)], [{"t": 0, "show": False}]),
    anim(["banh_rest", "banh_rest_crust", "slice_inner"] + [f"crust_{i}" for i in range(8)], [{"t": 0, "show": True}]),
    anim("gian", [{"t": 0, "loc": [C[0] + 0.0, C[1] - 0.2, 1.12], "rot": [0, 0, 90]}]),
    anim("lid", [{"t": 0, "rot": [-110, 0, 0]}]),
    {"do": "walk", "who": "ti", "to": [list(TI0)], "face": [C[0], C[1]], "speed": 2.0},
    say("ti", "Thưởng em nguyên miếng chín mươi độ nè, Gián!", "Thưởng em miếng 90° nè, Gián!", cam=cam("ti")),
    anim("slice", [{"t": 0, "loc": list(C)}, {"t": 0.6, "loc": [C[0], C[1] - 0.045, C[2]]}], sfx_at=[["swish", 0.0]], cam=cam("gian")),
] + [show(f"crust_{i}", 0.35 * i + 0.3, False, sfx_at=[["eat", 0.35 * i + 0.3]], with_=(i > 0)) for i in range(8)] + [
    {"do": "wait", "dur": 0.4},
    anim("slice", [{"t": 0, "loc": [C[0], C[1] - 0.045, C[2]]}, {"t": 0.6, "loc": list(C)}], sfx_at=[["swish", 0.1]]),
    say("ti", "Anh cho em nguyên miếng hai mươi lăm pi xen-ti-mét vuông. Sao em ăn có mỗi cái mép?", "Anh cho em nguyên 25π cm². Sao em ăn có mỗi cái mép?", cam=cam("ti")),
    anim("gian", [{"t": 0, "rot": [0, 0, 90]}, {"t": 0.4, "rot": [0, -28, 90]}], cam=cam("gian", subject=[C[0], C[1] - 0.2, 1.14], dist=0.28, h=0.05, az=75)),
    {"do": "wait", "dur": 0.4},
    say("gian_v", "Dạ... hợp đồng ghi: bò sát mép năm pi xen-ti-mét. Ăn vô trong là phát sinh công việc. Anh có duyệt tăng ca không?",
        "Dạ, hợp đồng ghi bò sát mép 5π cm. Ăn vô trong là phát sinh. Duyệt tăng ca không?"),
    {"do": "turn", "who": "ti", "face": "camera", "dur": 0.3},
    {"do": "knock", "who": "ti", "count": 3, "period": 0.32, "cam": cam("knees")},
    {"do": "wait", "dur": 0.2},
    {"do": "reach", "who": "co", "at": [C[0], C[1], C[2] + 0.05], "dur": 1.6, "cam": cam("co_wide")},
    anim(["rest_root", "slice"], [{"t": 0.6, "loc": list(C)}, {"t": 1.5, "loc": [1.25, 1.3, TOP + 0.09]}], with_=True),
    anim(["banh_rest", "banh_rest_crust", "slice_inner"], [{"t": 1.6, "show": False}], with_=True),
    anim("gian", [{"t": 0, "rot": [0, 0, 90]}, {"t": 0.3, "rot": [0, 0, -90]}], cam=cam("gian", subject=[C[0], C[1] - 0.12, 1.24], dist=0.75, h=0.1, az=60)),
    show("gian_beam", 0.3, True, sfx_at=[["shimmer", 0.3]]),
    {"do": "wait", "dur": 1.2},
])

# with_ → with (tránh trùng từ khoá Python khi viết)
for a in acts:
    if "with_" in a:
        v = a.pop("with_")
        if v:
            a["with"] = True

film = {
    "title": "Phi vụ giải cứu bánh tráng trứng", "file": "banh-trang-trung-3d", "fps": 24, "environment": "canteen",
    "music": None, "max_seconds": 400, "tail": 0.5, "gian_start": [0.25, 1.12, TOP],
    "characters": {
        "ti": {"name": "Tí Que", "voice": "Đức Trí", "speed": 1.12, "start": list(TI0), "heading": TI_HEAD,
               "spec": {"shirt": "#e3f2fd", "pants": "#1565c0", "scarf": "#e53935", "hair": "short", "hair_color": "#212121", "scale": 0.85}},
        "co": {"name": "Cô Bảy", "voice": "Thục Đoan", "speed": 0.92, "start": [0.75, 2.15], "heading": 0.0,
               "spec": {"shirt": "#f48fb1", "apron": "#ffffff", "hair": "bun", "hair_color": "#4e342e", "scale": 1.0}},
        "may": {"name": "Máy Nướng 3.14", "voice": "Mai Anh", "speed": 0.97, "start": [0, 40], "spec": {"hidden": True}},
        "gps": {"name": "Giọng bản đồ", "voice": "Ngọc Huyền", "start": [3, 40], "spec": {"hidden": True}},
        "gian_v": {"name": "Gián Điện", "voice": "Thiền Tâm Đức", "speed": 0.9, "pitch": -3.0, "start": [6, 40], "spec": {"hidden": True}},
    },
    "actions": acts,
}
out = pathlib.Path(__file__).with_name("film3d.json")
out.write_text(json.dumps(film, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(acts), "hành động →", out)
