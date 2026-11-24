#!/usr/bin/env python3
"""In danh mục tài nguyên THỰC CÓ trong skill (đếm từ mã, không ước lượng)."""
import ast, json, pathlib, re
R = pathlib.Path(__file__).resolve().parent.parent
G = json.loads((R / "animations" / "gestures.json").read_text(encoding="utf-8"))
src = (R / "scripts" / "blender" / "sm_cine.py").read_text(encoding="utf-8")
shots = re.findall(r'^\s+"([a-z_]+)": dict\(dist=', src, re.M)
anim = (R / "scripts" / "blender" / "sm_anim.py").read_text(encoding="utf-8")
gaits = re.findall(r'^\s+"([a-z]+)":\s+dict\(step=', anim, re.M)
procs = ["walk", "turn", "jump", "reach", "look", "speak (lip sync + cử chỉ)", "emote", "idle (thở, dồn trọng tâm, chớp mắt)"]
env = (R / "scripts" / "blender" / "sm_env.py").read_text(encoding="utf-8")
envs = re.findall(r"^def build_([a-z_]+)\(", env, re.M)
faces = ["blink", "smile", "frown", "mouth_open", "mouth_O", "brow_up", "brow_angry", "brow_sad", "look_L", "look_R"]
pres = json.loads((R / "characters" / "presets.json").read_text(encoding="utf-8"))
out = {
  "động tác thân trên (gestures.json)": len(G), "kiểu dáng đi (gait)": gaits, "chuyển động thủ tục": procs,
  "tổng mẫu chuyển động": len(G) + len(gaits) + len(procs),
  "góc máy (sm_cine.SHOTS)": len(shots), "bối cảnh / đạo cụ dựng được": envs, "biểu cảm (shape keys)": faces,
  "nhân vật mẫu": list(pres)}
print(json.dumps(out, ensure_ascii=False, indent=1))
