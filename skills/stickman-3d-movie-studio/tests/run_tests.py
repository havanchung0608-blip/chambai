#!/usr/bin/env python3
"""Bộ kiểm thử Stickman 3D Studio — chạy sau mỗi lần nâng cấp để không làm hỏng chức năng cũ."""
import json, math, pathlib, re, shutil, subprocess, sys, tempfile
R = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(R / "scripts"))
ok = True
def check(name, cond, info=""):
    global ok
    print(("ĐẠT  " if cond else "LỖI  ") + name + (f" — {info}" if info else ""))
    ok &= bool(cond)
import vi_speech
check("Đọc công thức d = 2R", vi_speech.to_speech("$d = 2R$")[0] == "đê bằng hai e-rờ", vi_speech.to_speech("$d = 2R$")[0])
check("Đọc số thập phân", "ba phẩy mười bốn" in vi_speech.to_speech("$3,14$")[0])
check("Đọc x^2", "ích bình phương" in vi_speech.to_speech("$x^2$")[0])
G = json.loads((R / "animations" / "gestures.json").read_text(encoding="utf-8"))
check("Thư viện động tác hợp lệ", all("desc" in g for g in G.values()), f"{len(G)} động tác")
src = (R / "scripts" / "blender" / "sm_cine.py").read_text(encoding="utf-8")
n_shots = len(re.findall(r'^\s+"([a-z_]+)": dict\(dist=', src, re.M))
check("≥ 30 preset góc máy", n_shots >= 30, str(n_shots))
bl = shutil.which("blender")
if not bl:
    check("Có Blender", False, "chưa cài")
else:
    xv = [shutil.which("xvfb-run"), "-a"] if shutil.which("xvfb-run") else []
    r = subprocess.run(xv + [bl, "-b", "--python", str(R / "tests" / "blender_rig_test.py")], capture_output=True, text=True)
    m = re.search(r"RIGTEST (\{.*\})", r.stdout)
    res = json.loads(m.group(1)) if m else {}
    check("Rig đủ xương", res.get("bones_ok"), f"{res.get('n_bones')} xương")
    check("IK chân + tay", res.get("ik_ok"))
    check("IK gập gối về phía trước", res.get("knee_forward"))
    check("Đủ 10 biểu cảm", len(res.get("shape_keys", [])) == 10, ",".join(res.get("shape_keys", [])))
    # dựng thử cảnh nhỏ (không TTS)
    d = pathlib.Path(tempfile.mkdtemp())
    env = [round(abs(math.sin(i * 0.7)) * 0.8, 3) for i in range(45)]
    prod = {"fps": 30, "quality": "draft", "environment": "classroom",
            "characters": {"a": {"start": [2.0, 0.5], "heading": 0, "spec": {}}},
            "props": {"c": {"type": "compass", "radius": 0.4, "at": [2.3, 1.55, 0.785]}},
            "actions": [{"do": "walk", "who": "a", "to": [[0.5, 0.6], [0.2, 1.6]], "face": "camera", "cam": "truck_follow"},
                        {"do": "say", "who": "a", "id": "x", "text": "thử", "env": env, "cam": "medium"},
                        {"do": "jump", "who": "a"}, {"do": "gesture", "who": "a", "name": "wave", "dur": 1.0}]}
    (d / "p.json").write_text(json.dumps(prod), encoding="utf-8")
    r = subprocess.run(xv + [bl, "-b", "--python", str(R / "scripts" / "blender" / "build_scene.py"), "--", str(d / "p.json"), str(d / "o.blend"), str(d / "t.json")], capture_output=True, text=True)
    good = "BUILD_OK" in r.stdout
    check("Dựng cảnh + bake chuyển động", good, (r.stderr or "")[-300:] if not good else "")
    if good:
        T = json.loads((d / "t.json").read_text(encoding="utf-8"))
        check("Trượt chân < 30 mm", T["qa"]["foot_slide_mm"] < 30, f"{T['qa']['foot_slide_mm']:.1f} mm")
        check("Không xuyên sàn", T["qa"]["floor_penetration_mm"] < 5, f"{T['qa']['floor_penetration_mm']:.1f} mm")
        check("Có sự kiện bước chân", sum(e["name"] == "step" for e in T["events"]) >= 3)
print("\nKẾT QUẢ:", "TẤT CẢ ĐẠT" if ok else "CÓ LỖI")
sys.exit(0 if ok else 1)
