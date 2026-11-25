#!/usr/bin/env python3
"""studio.py — dây chuyền sản xuất phim người que 3D (Blender + VieNeu-TTS + FFmpeg).

    python3 studio.py make film.json --out OUTDIR [--quality draft|cpu|hd|4k] [--fps 30] [--size 1920x1080]
                                     [--tts vieneu|edge|piper] [--frames 1-120] [--no-burn]
    python3 studio.py voices                       # liệt kê 25 giọng VieNeu
    python3 studio.py check                        # kiểm tra công cụ (Blender, ffmpeg, TTS, CPU/RAM/GPU)

Các bước: phân tích kịch bản → giọng nói (mỗi nhân vật một giọng, công thức đọc đúng) → dựng cảnh 3D,
chuyển động, máy quay, ánh sáng (Blender) → render → trộn âm thanh → ghép video + phụ đề →
thumbnail → báo cáo QA. Mọi bước có bộ nhớ đệm: chạy lại chỉ làm phần thay đổi.
"""
import argparse
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import vi_speech  # noqa: E402
import audio_mix  # noqa: E402

TTS_PY = os.environ.get("STICKMAN_TTS_PY") or ("/opt/vieneu/bin/python" if os.path.exists("/opt/vieneu/bin/python") else sys.executable)


def sh(cmd, log=None, **kw):
    t = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if log:
        pathlib.Path(log).write_text((r.stdout or "") + "\n---STDERR---\n" + (r.stderr or ""), encoding="utf-8")
    if r.returncode:
        print((r.stdout or "")[-1500:], (r.stderr or "")[-2500:])
        raise SystemExit(f"Lỗi khi chạy: {' '.join(map(str, cmd[:4]))}")
    return r, time.time() - t


def blender_cmd():
    b = shutil.which("blender") or "/usr/bin/blender"
    xv = shutil.which("xvfb-run")
    return ([xv, "-a"] if xv and not os.environ.get("DISPLAY") else []) + [b, "-b"]


def check():
    import platform
    info = dict(cpu=os.cpu_count(), platform=platform.platform())
    try:
        info["ram_gb"] = round(int(open("/proc/meminfo").read().split()[1]) / 1e6, 1)
    except Exception:
        pass
    info["gpu"] = "nvidia" if shutil.which("nvidia-smi") else "không thấy GPU NVIDIA (render EEVEE bằng OpenGL phần mềm — chậm hơn)"
    info["blender"] = subprocess.run(["blender", "--version"], capture_output=True, text=True).stdout.splitlines()[0] if shutil.which("blender") else "CHƯA CÀI"
    info["ffmpeg"] = "có" if shutil.which("ffmpeg") else "CHƯA CÀI"
    info["tts_python"] = TTS_PY
    info["vieneu"] = subprocess.run([TTS_PY, "-c", "import vieneu;print('ok')"], capture_output=True, text=True).stdout.strip() or "CHƯA CÀI"
    info["sound_bank"] = len(list(audio_mix.BANK_DIR.glob("*.wav"))) if audio_mix.BANK_DIR.exists() else 0
    print(json.dumps(info, ensure_ascii=False, indent=1))
    return info


def srt_time(s):
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(r):02d},{int(round((r - int(r)) * 1000)):03d}"


def ass_time(s):
    h, r = divmod(s, 3600)
    m, r = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{r:05.2f}"


def write_subs(lines, fps, out_srt, out_ass, W, H, names):
    srt, ass = [], []
    fs = int(H * 0.075)  # ≈ 81 px ở 1080p — chữ lớn cho học sinh (thầy Chung yêu cầu)
    ass.append(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Liberation Serif,{fs},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,3,2,0,2,80,80,{int(H*0.045)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
    for i, L in enumerate(lines, 1):
        a, b = L["f0"] / fps, L["f1"] / fps + 0.25
        who = names.get(L["who"], "")
        txt = L["text"]
        srt.append(f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{(who + ': ') if who else ''}{txt}\n")
        ass.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Sub,,0,0,0,,{txt}")
    pathlib.Path(out_srt).write_text("\n".join(srt), encoding="utf-8")
    pathlib.Path(out_ass).write_text("\n".join(ass) + "\n", encoding="utf-8")


def make(a):
    film_fp = pathlib.Path(a.film).resolve()
    film = json.loads(film_fp.read_text(encoding="utf-8"))
    out = pathlib.Path(a.out).resolve()
    (out / "voice").mkdir(parents=True, exist_ok=True)
    fps = a.fps or film.get("fps", 30)
    t_all = time.time()
    report = dict(steps=[])
    # ---------- 1. lời thoại ----------
    names = {k: v.get("name", k) for k, v in film["characters"].items()}
    jobs = []
    for i, act in enumerate(film["actions"]):
        if act["do"] != "say":
            continue
        act.setdefault("id", f"L{i:02d}")
        spoken, shown = vi_speech.to_speech(act["text"])
        act["_spoken"], act["_shown"] = act.get("speak", spoken), shown
        ch = film["characters"][act["who"]]
        key = hashlib.md5(f"{act['_spoken']}|{ch.get('voice')}|{ch.get('ref_audio')}|{ch.get('speed')}|{ch.get('pitch')}".encode()).hexdigest()[:10]
        act["_wav_key"] = key
        if not list((out / "voice").glob(f"{key}.*")):
            jobs.append(dict(id=key, text=act["_spoken"], voice=ch.get("voice", "Ngọc Huyền"), ref_audio=ch.get("ref_audio"), gender=ch.get("gender", "nu"), speed=ch.get("speed"), pitch=ch.get("pitch")))
    if jobs:
        jf = out / "voice" / "jobs.json"
        jf.write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
        _, dt = sh([TTS_PY, str(HERE / "tts_engine.py"), str(jf), str(out / "voice"), a.tts], log=out / "voice" / "tts.log")
        report["steps"].append(("Giọng nói", f"{len(jobs)} câu, {dt:.0f} s, engine {a.tts}"))
    for act in film["actions"]:
        if act["do"] == "say":
            wav = next((out / "voice").glob(f"{act['_wav_key']}.*"))
            act["_wav"] = str(wav)
            act["env"] = audio_mix.env_from_audio(wav, fps)
            act["sub"] = act["_shown"]
    # ---------- 2. dựng cảnh 3D ----------
    prod = dict(film)
    prod["fps"] = fps
    prod["quality"] = a.quality
    pj = out / "production.json"
    pj.write_text(json.dumps(prod, ensure_ascii=False), encoding="utf-8")
    blend = out / f"{film.get('file', 'phim')}.blend"
    tl = out / "timeline.json"
    _, dt = sh(blender_cmd() + ["--python", str(HERE / "blender" / "build_scene.py"), "--", str(pj), str(blend), str(tl)], log=out / "build.log")
    T = json.loads(tl.read_text(encoding="utf-8"))
    NF = T["nframes"]
    report["steps"].append(("Dựng cảnh + chuyển động + máy quay", f"{NF} khung ({NF / fps:.1f} s), {dt:.0f} s"))
    # ---------- 3. render ----------
    fdir = out / "frames"
    fdir.mkdir(exist_ok=True)
    fr0, fr1 = 1, NF
    if a.frames:
        fr0, fr1 = map(int, a.frames.split("-"))
    todo = [f for f in range(fr0, fr1 + 1) if not (fdir / f"f_{f:04d}.png").exists()]
    if todo:
        t0 = time.time()
        _, dt = sh(blender_cmd() + [str(blend), "-o", str(fdir / "f_####"), "-F", "PNG", "-x", "1", "-s", str(todo[0]), "-e", str(fr1), "-a"], log=out / "render.log")
        report["steps"].append(("Render EEVEE", f"{len(todo)} khung, {dt:.0f} s ({dt / max(1, len(todo)):.2f} s/khung), chất lượng {a.quality}"))
    # ---------- 4. âm thanh ----------
    lines = []
    for act in film["actions"]:
        if act["do"] == "say":
            m = next((L for L in T["lines"] if L["id"] == act["id"]), None)
            if m:
                lines.append(dict(f0=m["f0"], f1=m["f1"], wav=act["_wav"], who=act["who"], text=act["sub"]))
    total = NF / fps
    audio = audio_mix.mix(total, lines, T["events"], fps, music=film.get("music"), music_vol=film.get("music_vol", 0.08))
    wav = out / "audio.wav"
    audio_mix.write_wav(audio, wav)
    # ---------- 5. phụ đề + video ----------
    W, H = map(int, (a.size or "1920x1080").split("x"))
    srt, ass = out / f"{film.get('file', 'phim')}.srt", out / "subs.ass"
    write_subs(lines, fps, srt, ass, W, H, names)
    mp4 = out / f"{film.get('file', 'phim')}.mp4"
    vf = f"scale={W}:{H}:flags=lanczos,unsharp=5:5:0.4"
    if not a.no_burn:
        vf += f",subtitles={ass}:fontsdir=/usr/share/fonts/truetype/liberation"
    _, dt = sh(["ffmpeg", "-y", "-v", "error", "-framerate", str(fps), "-start_number", str(fr0), "-i", str(fdir / "f_%04d.png"), "-i", str(wav),
                "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(fps),
                "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(mp4)])
    report["steps"].append(("Ghép video", f"{mp4.name}, {dt:.0f} s"))
    # ---------- 6. thumbnail ----------
    thumb = out / "thumbnail.jpg"
    try:
        make_thumb(T, fdir, thumb, film.get("title", ""), fps, fr0, fr1)
    except Exception as e:  # noqa: BLE001
        print("thumbnail:", e)
    # ---------- 7. QA ----------
    qa(out, mp4, T, lines, fdir, fr0, fr1, report, time.time() - t_all, film, fps)
    print("STUDIO_OK", mp4)


def make_thumb(T, fdir, out, title, fps, fr0, fr1):
    from PIL import Image, ImageDraw, ImageFont
    best = None
    for s in T["shots"]:
        if s["preset"] in ("close_up", "medium_close", "medium", "push_in_emotion") and fr0 <= s["f0"] + 1 <= fr1:
            best = (s["f0"] + s["f1"]) // 2 + 1
            break
    best = best or (fr0 + fr1) // 2
    fp = fdir / f"f_{best:04d}.png"
    im = Image.open(fp).convert("RGB").resize((1280, 720), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf", 84)
    words, lines, cur = title.split(), [], ""
    for w in words:
        if d.textlength(cur + " " + w, font=f) > 1150 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    y = 720 - 40 - len(lines) * 96
    d.rectangle([0, y - 20, 1280, 720], fill=(0, 0, 0))
    for L in lines:
        d.text((640, y), L, font=f, fill=(255, 214, 79), anchor="ma", stroke_width=4, stroke_fill=(0, 0, 0))
        y += 96
    im.save(out, quality=90)


def qa(out, mp4, T, lines, fdir, fr0, fr1, report, elapsed, film, fps):
    import numpy as np
    from PIL import Image
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", str(mp4)], capture_output=True, text=True).stdout
    P = json.loads(probe)
    vdur = float(P["format"]["duration"])
    vs = [s for s in P["streams"] if s["codec_type"] == "video"][0]
    missing = [f for f in range(fr0, fr1 + 1) if not (fdir / f"f_{f:04d}.png").exists()]
    dark = []
    for f in range(fr0, fr1 + 1, max(1, fps)):
        p = fdir / f"f_{f:04d}.png"
        if p.exists():
            m = np.asarray(Image.open(p).convert("L").resize((96, 54))).mean()
            if m < 12:
                dark.append(f)
    q = T.get("qa", {})
    checks = [
        ("Video xuất ra", mp4.exists(), f"{mp4.name}: {vs['width']}×{vs['height']}, {vs['r_frame_rate']} fps, {vdur:.1f} s"),
        ("Đủ khung hình", not missing, f"thiếu {len(missing)} khung" if missing else "đủ"),
        ("Không có khung đen", not dark, f"khung tối: {dark[:10]}" if dark else "ổn"),
        ("Lời thoại khớp thời gian", all(L["f1"] <= fr1 + 5 for L in lines), f"{len(lines)} câu"),
        ("Trượt chân (chân trụ)", q.get("foot_slide_mm", 0) < 30, f"{q.get('foot_slide_mm', 0):.1f} mm (ngưỡng 30 mm)"),
        ("Chân xuyên sàn", q.get("floor_penetration_mm", 0) < 5, f"{q.get('floor_penetration_mm', 0):.1f} mm"),
        ("Phụ đề SRT", (out / f"{film.get('file', 'phim')}.srt").exists(), "có"),
        ("File Blender chỉnh sửa được", any(out.glob("*.blend")), "có"),
    ]
    md = [f"# Báo cáo kiểm tra chất lượng — {film.get('title', '')}", "", f"Tổng thời gian sản xuất: {elapsed / 60:.1f} phút", "",
          "| Kiểm tra | Kết quả | Chi tiết |", "|---|---|---|"]
    for name, ok, det in checks:
        md.append(f"| {name} | {'ĐẠT' if ok else 'CHƯA ĐẠT'} | {det} |")
    md += ["", "## Các bước", ""] + [f"- **{a}**: {b}" for a, b in report["steps"]]
    md += ["", "## Cỡ cảnh đã dùng", ""] + [f"- khung {s['f0']}–{s['f1']}: `{s['preset']}` ({s.get('subject')})" for s in T["shots"]]
    md += ["", "## Ghi nguồn", "", "- Giọng đọc: VieNeu-TTS (pnnbao-ump) — dùng cho giáo dục phi thương mại.",
           "- Nhạc nền / tiếng động: TiengDong.com (nếu dùng bộ âm thanh tải về)."]
    (out / "qa_report.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md))


def voices():
    r = subprocess.run([TTS_PY, "-c", "from vieneu import Vieneu;t=Vieneu();[print(d) for d,n in t.list_preset_voices()]"], capture_output=True, text=True)
    print(r.stdout or r.stderr[-800:])


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    m = sub.add_parser("make")
    m.add_argument("film")
    m.add_argument("--out", required=True)
    m.add_argument("--quality", default="cpu", choices=["draft", "cpu", "cpu_fast", "hd", "4k"])
    m.add_argument("--fps", type=int, default=0)
    m.add_argument("--size", default="1920x1080")
    m.add_argument("--tts", default="vieneu", choices=["vieneu", "edge", "piper"])
    m.add_argument("--frames")
    m.add_argument("--no-burn", action="store_true")
    sub.add_parser("voices")
    sub.add_parser("check")
    a = ap.parse_args()
    if a.cmd == "make":
        make(a)
    elif a.cmd == "voices":
        voices()
    else:
        check()
