#!/usr/bin/env python3
"""Phim DỌC 9:16 "bảng vẽ + laptop gõ lời giải" (Reels/TikTok/Shorts) — 1080×1920, có giọng đọc, tiếng gõ phím, tiếng phấn, nhạc.

    python3 make916.py phim.json OUT.mp4 [--voice-dir DIR] [--preview 3,15,40 --png anh.jpg] [--fps 30]

1. Đọc kịch bản JSON (xem examples/tam-giac-vuong-duong-tron.916.json).
2. Giọng VieNeu (mặc định "Thiện Minh" = Thầy Chung) cho từng câu `say` → đo độ dài → tính mốc thời gian
   (bước tự giãn theo lời đọc, nét vẽ và tốc độ gõ).
3. Vẽ từng khung bằng engine916.js trong Chromium → ffmpeg; trộn giọng + gõ phím + phấn + nhạc (giọng luôn nổi).
"""
import argparse
import base64
import json
import math
import pathlib
import random
import subprocess
import sys
import tempfile

import numpy as np
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import export_mp4 as X  # noqa: E402
from _browser import launch  # noqa: E402

TTS = pathlib.Path.home() / ".claude/skills/stickman-3d-movie-studio/scripts/tts_engine.py"
VPY = "/opt/vieneu/bin/python"
SR = X.SR


def tlen(s):
    n, i = 0, 0
    while i < len(s):
        if s.startswith("\\hat{", i):
            j = s.index("}", i); n += j - i - 5; i = j + 1
        elif s.startswith("\\frac{", i):
            j = s.index("}", i); j2 = s.index("}", j + 2); n += max(j - i - 6, j2 - j - 2); i = j2 + 1
        else:
            n += 1; i += 1
    return n


def says_of(F):
    out = [("intro", F["intro"]["say"])]
    for ci, ch in enumerate(F["chapters"]):
        for si, st in enumerate(ch["steps"]):
            if st.get("say"):
                out.append((f"c{ci}s{si}", st["say"]))
    out.append(("sum", F["summary"]["say"]))
    out.append(("end", F["endSay"]))
    return out


def voices(F, vdir):
    vdir = pathlib.Path(vdir); vdir.mkdir(parents=True, exist_ok=True)
    v = F.get("voice", {})
    jobs = [{"id": k, "text": s, "voice": v.get("name", "Thiện Minh"), "speed": v.get("speed", 1.0), "pitch": v.get("pitch", 0)}
            for k, s in says_of(F) if not (vdir / f"{k}.wav").exists()]
    if jobs:
        jf = vdir / "jobs.json"; jf.write_text(json.dumps(jobs, ensure_ascii=False), encoding="utf-8")
        subprocess.run([VPY, str(TTS), str(jf), str(vdir), "vieneu"], check=True)
    return {k: vdir / f"{k}.wav" for k, _ in says_of(F) if (vdir / f"{k}.wav").exists()}


def timeline(F, dur):
    ev, says = [], []
    def sfx(name, t, **k): ev.append(dict(name=name, t=round(t, 3), **k))
    def say(k, t):
        if k in dur: says.append({"id": k, "t": t})
        return dur.get(k, 2.0)
    TL = {}
    vd = say("intro", 0.6); t1 = max(7.0, 0.6 + vd + 0.8); TL["intro"] = {"t0": 0, "t1": t1}
    sfx("boing", 1.5, vol=0.6)
    for k in range(6): sfx("step", 3.6 + k * 0.3, vol=0.8)
    sfx("land", 6.0, vol=0.6)
    for k in range(int((t1 - 6.3) * 9)): sfx("key", 6.3 + k / 9 + random.random() * 0.04, vol=0.35)
    c, chs = t1, []
    for ci, ch in enumerate(F["chapters"]):
        tc = {"t0": c, "steps": []}; sfx("whoosh", c, vol=0.7); sfx("shimmer", c + 0.3, vol=0.6); c += 1.3
        for si, st in enumerate(ch["steps"]):
            vd = say(f"c{ci}s{si}", c + 0.15) if st.get("say") else 0
            ops = [o for o in st.get("draw", []) if "move" not in o]
            dd = st.get("dd") or min(3.2, max(0.8, 0.55 * len(ops))) if ops else 0.01
            draw0, draw1 = c + 0.25, c + 0.25 + dd
            stmt = bool(st.get("stmt"))
            cps = 22 if stmt else 15
            type0 = c + 0.35
            chars = [tlen(st["stmt"])] if stmt else [tlen(x) for x in st.get("type", [])]
            type1 = type0 + sum(n / cps + 0.15 for n in chars)
            end = max(c + 0.15 + vd + 0.55, draw1 + 0.4, type1 + 0.4, c + st.get("min", 0)) + st.get("hold", 1.4 if stmt else 0.25)
            tc["steps"].append({"t0": c, "t1": end, "draw0": draw0, "draw1": draw1, "type0": type0, "type1": type1, "cps": cps})
            # âm thanh: phấn khi kẻ, "pop" khi chấm điểm, gõ phím theo từng kí tự, "ding" khi chốt định lí
            for j, o in enumerate(ops):
                a = draw0 + dd * j / len(ops); b = draw0 + dd * (j + 1) / len(ops)
                if "seg" in o or "circ" in o: sfx("chalk", a, dur=b - a, vol=0.9)
                elif "pt" in o: sfx("pop", a, vol=0.45)
                elif "right" in o or "hl" in o: sfx("tick", a, vol=0.7)
            tt = type0
            for n in chars:
                for k in range(n):
                    if random.random() < 0.85: sfx("key", tt + k / cps + random.random() * 0.02, vol=0.38)
                tt += n / cps + 0.15
            if stmt: sfx("ding", type0, vol=0.8); sfx("shimmer", type1, vol=0.5)
            c = end
        tc["t1"] = c + 0.3; c = tc["t1"]; chs.append(tc)
    TL["chapters"] = chs
    vd = say("sum", c + 0.6); sfx("tada", c + 0.4, vol=0.6)
    tip = tlen(F["summary"]["tip"])
    for k in range(tip): sfx("key", c + 4.2 + k / 18, vol=0.35)
    s1 = max(c + 16, c + 0.6 + vd + 2.5, c + 4.2 + tip / 18 + 3); TL["summary"] = {"t0": c, "t1": s1}; c = s1
    vd = say("end", c + 0.8); sfx("bell", c + 0.3, vol=0.9)
    TL["end"] = {"t0": c, "t1": c + max(5.0, vd + 2.0)}; TL["total"] = TL["end"]["t1"]
    return TL, says, ev


def key_clicks():
    for i in range(4):
        n = int(SR * 0.035); t = np.arange(n) / SR; r = 0.8 + 0.4 * random.random()
        click = X.bandnoise(0.035, 2500 * r, 7000, 0.5) * np.exp(-t / 0.006)
        thump = X.tone(140 * r, 0.035, 0.25, 70)
        X.BANK[f"key{i}"] = (click + thump).astype(np.float32)
    X.ALIAS["key"] = [f"key{i}" for i in range(4)]


def build_html(F, TL, out):
    eng = (HERE / "engine916.js").read_text(encoding="utf-8")
    html = ("<!doctype html><html><head><meta charset='utf-8'><title>" + F["title"] + "</title>"
            "<style>html,body{margin:0;background:#000}canvas{height:100vh;display:block;margin:auto}</style></head><body>"
            "<canvas id='cv' width='1080' height='1920'></canvas><script>window.FILM916=" + json.dumps(F, ensure_ascii=False)
            + ";window.TL916=" + json.dumps(TL) + ";</script><script>" + eng + "</script><script>"
            "const cv=document.getElementById('cv'),cx=cv.getContext('2d');const t0=performance.now();"
            "(function loop(){const t=((performance.now()-t0)/1000)%STICKFILM.total;STICKFILM.renderAt(cx,t);requestAnimationFrame(loop);})();"
            "</script></body></html>")
    pathlib.Path(out).write_text(html, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("film"); ap.add_argument("out")
    ap.add_argument("--voice-dir"); ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--preview", help="chỉ chụp các thời điểm (giây), ví dụ 3,15,40"); ap.add_argument("--png")
    ap.add_argument("--no-voice", action="store_true")
    a = ap.parse_args()
    random.seed(7); np.random.seed(7)
    F = json.loads(pathlib.Path(a.film).read_text(encoding="utf-8"))
    vdir = pathlib.Path(a.voice_dir or tempfile.mkdtemp(prefix="v916_"))
    files = {} if a.no_voice else voices(F, vdir)
    dur = {k: X.ffprobe_dur(fp) for k, fp in files.items()}
    TL, says, ev = timeline(F, dur)
    html = pathlib.Path(a.out).with_suffix(".html"); build_html(F, TL, html)
    print(f"Thời lượng {TL['total']:.1f} s · {len(F['chapters'])} phần · {len(says)} câu thoại · HTML: {html}")
    with sync_playwright() as p:
        b = launch(p); pg = b.new_page(); pg.goto(html.resolve().as_uri()); pg.wait_for_function("window.__READY__")
        pg.evaluate("() => { window.__c = document.createElement('canvas'); __c.width = 1080; __c.height = 1920; }")
        if a.preview:
            ts = [float(x) for x in a.preview.split(",")]; cols = min(4, len(ts))
            d = pg.evaluate("""([ts, C]) => { const w = 360, h = 640, o = document.createElement('canvas'); o.width = C * w; o.height = Math.ceil(ts.length / C) * h; const x = o.getContext('2d');
                ts.forEach((t, i) => { STICKFILM.renderAt(__c.getContext('2d'), t); x.drawImage(__c, (i % C) * w, Math.floor(i / C) * h, w, h); x.fillStyle = '#ff0'; x.font = 'bold 24px sans-serif'; x.fillText(t.toFixed(1), (i % C) * w + 6, Math.floor(i / C) * h + 26); });
                return o.toDataURL('image/jpeg', 0.88); }""", [ts, cols])
            pathlib.Path(a.png).write_bytes(base64.b64decode(d.split(",", 1)[1])); print("Ảnh xem trước:", a.png); b.close(); return
        X.load_bank(pathlib.Path.home() / ".cache/stickfilm/tiengdong"); key_clicks()
        audio = X.mix(TL["total"], says, files, ev, F.get("music", "story"))
        wav = pathlib.Path(tempfile.mkdtemp()) / "a.f32"; audio.astype(np.float32).tofile(wav)
        cmd = ["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(a.fps), "-i", "-",
               "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", str(wav), "-c:v", "libx264", "-preset", "medium", "-crf", "20",
               "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", a.out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        nf = int(math.ceil(TL["total"] * a.fps))
        for f0 in range(0, nf, 10):
            ts = [i / a.fps for i in range(f0, min(nf, f0 + 10))]
            for d in pg.evaluate("(ts) => ts.map(t => { STICKFILM.renderAt(__c.getContext('2d'), t); return __c.toDataURL('image/jpeg', 0.9); })", ts):
                ff.stdin.write(base64.b64decode(d.split(",", 1)[1]))
            if f0 % 600 == 0: print(f"  khung {f0}/{nf}", flush=True)
        ff.stdin.close(); ff.wait(); b.close()
    print("Đã xuất:", a.out)


if __name__ == "__main__":
    main()
