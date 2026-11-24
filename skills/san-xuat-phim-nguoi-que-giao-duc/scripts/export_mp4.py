#!/usr/bin/env python3
"""Xuất phim người que (file HTML đã build) thành video MP4 có tiếng.

    python3 export_mp4.py <phim.html> <phim.mp4> [--fps 30] [--size 1280x720]
                         [--tts edge|none] [--voice-dir THU_MUC] [--music]

Âm thanh:
  * Giọng đọc: --voice-dir  → dùng file ghi âm thật của thầy/cô, đặt tên theo mã nhịp
                               (s1b1.mp3, s1b2.m4a, ...; in danh sách mã bằng --list).
               --tts edge   → giọng Microsoft HoaiMy/NamMinh (cần: pip install edge-tts và mạng).
               --tts none   → không lời, chỉ phụ đề + hiệu ứng.
    Mặc định: thử edge-tts, không được thì tự chuyển sang none và báo rõ.
  * Hiệu ứng âm thanh (pop, ding, phấn, tích tắc...) được tổng hợp lại bằng numpy, khớp đúng thời điểm.
  * Thời lượng từng câu được đo từ file âm thanh thật → cảnh tự giãn cho khớp lời.
"""
import argparse
import asyncio
import base64
import json
import math
import pathlib
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _browser import launch  # noqa: E402

SR = 44100
VOICES = {"nu": ("vi-VN-HoaiMyNeural", "+0Hz", "+0%"),
          "nam": ("vi-VN-NamMinhNeural", "+0Hz", "+0%"),
          "tre": ("vi-VN-HoaiMyNeural", "+35Hz", "+6%")}


def ffprobe_dur(fp):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(fp)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


def decode(fp):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(fp), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def tts_edge(says, tmp):
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("! Chưa có edge-tts (pip install edge-tts) → xuất không lời.")
        return {}
    import edge_tts

    async def run():
        files = {}
        for s in says:
            v, pitch, rate = VOICES.get(s.get("voice") or "nu", VOICES["nu"])
            fp = tmp / f"{s['id']}.mp3"
            await edge_tts.Communicate(s["text"], v, pitch=pitch, rate=rate).save(str(fp))
            files[s["id"]] = fp
        return files

    try:
        return asyncio.run(run())
    except Exception as e:  # noqa: BLE001
        print("! edge-tts không chạy được (mạng?):", str(e)[:160], "→ xuất không lời.")
        return {}


# ------------------------- tổng hợp hiệu ứng âm thanh -------------------------
def env(n, a=0.005, r=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    if r:
        e *= np.exp(-t / r)
    return e


def tone(f, dur, vol=0.3, f2=None, kind="sine", decay=None):
    n = int(SR * dur)
    t = np.arange(n) / SR
    fr = f if f2 is None else f * (f2 / f) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    w = np.sin(ph) if kind == "sine" else np.sign(np.sin(ph)) * 0.6 if kind == "square" else 2 / np.pi * np.arcsin(np.sin(ph))
    return (w * env(n, 0.008, decay or dur / 4) * vol).astype(np.float32)


def bandnoise(dur, lo, hi, vol, chop=None):
    n = int(SR * dur)
    x = np.random.randn(n)
    X = np.fft.rfft(x)
    fq = np.fft.rfftfreq(n, 1 / SR)
    X[(fq < lo) | (fq > hi)] = 0
    y = np.fft.irfft(X, n)
    y /= (np.abs(y).max() + 1e-9)
    if chop:
        t = np.arange(n) / SR
        g = (np.sin(2 * np.pi * t / chop) > -0.2).astype(float) * (0.5 + 0.5 * np.random.rand(int(dur / chop) + 2).repeat(int(SR * chop) + 1)[:n])
        y *= g
    return (y * vol).astype(np.float32)


def sfx(name, dur=1.0):
    if name == "pop":
        return tone(500, 0.14, 0.35, 1100)
    if name == "ding":
        return tone(1318, 0.9, 0.3, decay=0.3) + np.pad(tone(1976, 0.88, 0.12, decay=0.25), (int(0.02 * SR), 0))[:int(0.9 * SR)]
    if name == "correct":
        a = tone(784, 0.2, 0.3, kind="tri"); b = tone(1046, 0.4, 0.3, kind="tri")
        return np.concatenate([a[:int(0.14 * SR)], b])
    if name == "wrong":
        return np.concatenate([tone(220, 0.24, 0.12, 180, "square"), tone(170, 0.35, 0.12, 140, "square")])
    if name == "tick":
        return tone(1800, 0.05, 0.08, kind="square")
    if name == "boing":
        return tone(180, 0.45, 0.35, 520)
    if name == "tada":
        out = np.zeros(int(SR * 0.95), np.float32)
        for i, f in enumerate([523, 659, 784, 1046]):
            s = tone(f, 0.6, 0.2, kind="tri"); st = int(i * 0.09 * SR); out[st:st + len(s)] += s
        return out
    if name == "bell":
        return tone(880, 1.4, 0.25, decay=0.5) + tone(1760, 1.4, 0.08, decay=0.3)
    if name == "click":
        return tone(2400, 0.03, 0.08, kind="square")
    if name == "step":
        return tone(120, 0.06, 0.2, 70)
    if name == "whoosh":
        n = bandnoise(0.45, 600, 3500, 0.35); return n * np.sin(np.linspace(0, np.pi, len(n)))
    if name in ("marker", "chalk"):
        d = max(0.3, min(3.0, dur or 1))
        return bandnoise(d, 2200 if name == "chalk" else 1800, 4200 if name == "chalk" else 3400, 0.09, chop=0.11)
    if name == "applause":
        return bandnoise(2.2, 1200, 5000, 0.14, chop=0.045)
    return np.zeros(1, np.float32)


def music_bed(total):
    chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]]
    out = np.zeros(int(SR * total) + SR * 3, np.float32)
    k, t = 0, 0.0
    while t < total:
        for i, f in enumerate(chords[k % 4]):
            s = tone(f, 2.4, 0.6, decay=0.9); st = int((t + i * 0.12) * SR); out[st:st + len(s)] += s
        t += 2.4; k += 1
    return out[:int(SR * total)] * 0.05


def mix(total, says, files, sfx_events, music):
    n = int(SR * (total + 0.5))
    voice = np.zeros(n, np.float32)
    fx = np.zeros(n, np.float32)
    for s in says:
        fp = files.get(s["id"])
        if not fp:
            continue
        a = decode(fp); st = int(s["t"] * SR)
        voice[st:st + len(a)] += a[: max(0, n - st)]
    for e in sfx_events:
        a = sfx(e["name"], e.get("dur", 1)); st = int(e["t"] * SR)
        fx[st:st + len(a)] += a[: max(0, n - st)]
    out = voice * 1.0 + fx * 0.8
    if music:
        m = music_bed(total + 0.5)[:n]
        duck = np.convolve((np.abs(voice) > 0.01).astype(np.float32), np.ones(int(SR * 0.3)) / (SR * 0.3), "same")
        out += m * (1 - 0.55 * np.clip(duck * 3, 0, 1))
    peak = np.abs(out).max()
    if peak > 0.98:
        out *= 0.98 / peak
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html"); ap.add_argument("out", nargs="?")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--tts", default="edge", choices=["edge", "none"])
    ap.add_argument("--voice-dir")
    ap.add_argument("--music", action="store_true")
    ap.add_argument("--list", action="store_true", help="in danh sách mã nhịp + lời đọc để ghi âm")
    a = ap.parse_args()
    if not shutil.which("ffmpeg"):
        sys.exit("Cần cài ffmpeg.")
    W, H = map(int, a.size.lower().split("x"))
    html = pathlib.Path(a.html).resolve()
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="stickfilm-"))
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_page()
        pg.goto(html.as_uri())
        pg.wait_for_function("window.__READY__ === true", timeout=15000)
        info = pg.evaluate("() => STICKFILM.info()")
        if a.list:
            for s in info["says"]:
                print(f"{s['id']}\t{s['who']}\t{s['text']}")
            return
        if not a.out:
            sys.exit("Thiếu tên file .mp4 đầu ra")
        files = {}
        if a.voice_dir:
            vd = pathlib.Path(a.voice_dir)
            for s in info["says"]:
                for ext in (".mp3", ".wav", ".m4a", ".ogg", ".webm"):
                    if (vd / (s["id"] + ext)).exists():
                        files[s["id"]] = vd / (s["id"] + ext); break
            miss = [s["id"] for s in info["says"] if s["id"] not in files]
            print(f"Ghi âm: có {len(files)}/{len(info['says'])} câu." + (f" Thiếu: {', '.join(miss[:12])}" if miss else ""))
        elif a.tts == "edge":
            files = tts_edge(info["says"], tmp)
        if files:
            timing = {sid: ffprobe_dur(fp) + 0.12 for sid, fp in files.items()}
            pg.evaluate("(m) => STICKFILM.setTiming(m)", timing)
            info = pg.evaluate("() => STICKFILM.info()")
        total = info["duration"]
        print(f"Thời lượng {total:.1f}s · {len(info['scenes'])} cảnh · lời đọc: {'có' if files else 'không'}")
        audio = mix(total, info["says"], files, info["sfx"], a.music)
        wav = tmp / "audio.f32"
        audio.astype(np.float32).tofile(wav)
        pg.evaluate("""([w,h]) => { window.__c = document.createElement('canvas'); __c.width = 1920; __c.height = 1080;
                       window.__o = document.createElement('canvas'); __o.width = w; __o.height = h; }""", [W, H])
        cmd = ["ffmpeg", "-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(a.fps), "-i", "-",
               "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", str(wav),
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", a.out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        nframes = int(math.ceil(total * a.fps))
        BATCH = 12
        for f0 in range(0, nframes, BATCH):
            ts = [i / a.fps for i in range(f0, min(nframes, f0 + BATCH))]
            datas = pg.evaluate("""(ts) => ts.map(t => { STICKFILM.renderAt(__c.getContext('2d'), t);
                const o = __o.getContext('2d'); o.drawImage(__c, 0, 0, __o.width, __o.height);
                return __o.toDataURL('image/jpeg', 0.9); })""", ts)
            for d in datas:
                ff.stdin.write(base64.b64decode(d.split(",", 1)[1]))
            if (f0 // BATCH) % 25 == 0:
                print(f"  khung {f0}/{nframes}", flush=True)
        ff.stdin.close(); ff.wait()
        b.close()
    shutil.rmtree(tmp, ignore_errors=True)
    if ff.returncode:
        sys.exit("ffmpeg lỗi")
    print("Đã xuất:", a.out)


if __name__ == "__main__":
    main()
