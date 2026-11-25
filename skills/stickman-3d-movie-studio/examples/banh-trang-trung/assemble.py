"""Ghép phim "Phi vụ giải cứu bánh tráng trứng": xen 8 đoạn truyện 3D (Blender) với 6 đoạn Toán 2D (Manim-style).

    python3 assemble.py 3D.mp4 timeline3d.json toan2d.mp4 toan2d_scenes.json OUT.mp4

- Cắt đúng mốc S1…S8 (timeline 3D) và M55…M59, SUM (cảnh 2D), đổi về 1920×1080, 30 fps.
- Cân bằng độ lớn giữa các đoạn (giọng 3D và 2D đều nhau).
- Nhạc nền chung: vào khi cuộn dây lăn (cuối S1), nền nhẹ dưới thoại, căng ở S6, TẮT HẲN ở M59 (câu hỏi quyết định
  của cô Bảy) và S7 (tiếng "Bộp" + chuông trong căn tin im phăng phắc), nhạc kết nhẹ ở bảng tổng kết.
"""
import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np

SR = 48000
BANK = pathlib.Path.home() / ".cache" / "stickfilm" / "tiengdong"
ORDER = ["S1", "S2", "M55", "S3", "M56", "S4", "M57", "S5", "M58", "S6", "M59", "S7", "S8", "SUM"]
# (tên nhạc, âm lượng, bắt đầu sau bao giây trong đoạn)
MUSIC = {"S1": ("story", 0.11, -2.5), "S2": ("story", 0.09, 0), "M55": ("story", 0.07, 0), "S3": ("story", 0.09, 0), "M56": ("story", 0.07, 0),
         "S4": ("story", 0.09, 0), "M57": ("story", 0.07, 0), "S5": ("story", 0.09, 0), "M58": ("story", 0.07, 0), "S6": ("tension", 0.13, 0),
         "M59": None, "S7": None, "S8": ("story", 0.08, 1.5), "SUM": ("intro", 0.08, 0)}


def run(cmd):
    subprocess.run(cmd, check=True)


def decode(fp):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(fp), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def main(mp4_3d, tl3d, mp4_2d, sc2d, out):
    T = json.loads(pathlib.Path(tl3d).read_text(encoding="utf-8"))
    fps3 = T["fps"]
    marks = [(a["mark"], a["f0"] / fps3) for a in T["actions"] if a.get("mark")]
    end3 = T["nframes"] / fps3
    segs = {}
    for i, (m, t0) in enumerate(marks):
        segs[m] = ("3d", t0, marks[i + 1][1] if i + 1 < len(marks) else end3)
    for s in json.loads(pathlib.Path(sc2d).read_text(encoding="utf-8")):
        segs[s["name"]] = ("2d", s["start"], s["end"])
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="banh_"))
    parts, audio, music_plan, cursor = [], [], [], 0.0
    for name in ORDER:
        kind, t0, t1 = segs[name]
        src = mp4_3d if kind == "3d" else mp4_2d
        fp = tmp / f"{name}.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", str(src),
             "-vf", "scale=1920:1080:flags=lanczos,fps=30", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", str(fp)])
        parts.append(fp)
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(fp)], capture_output=True, text=True).stdout.strip())
        t1 = t0 + d                       # khớp tiếng với số khung thực tế (không trôi khi nối)
        a = decode_seg(src, t0, t1)
        # cân bằng: đưa phần có tiếng về cùng mức RMS
        loud = np.abs(a) > 0.02
        rms = float(np.sqrt(np.mean(a[loud] ** 2))) if loud.any() else 0
        if rms > 1e-4:
            a = a * min(3.0, 0.16 / rms)
        audio.append(a)
        music_plan.append((name, cursor, cursor + (t1 - t0)))
        cursor += t1 - t0
        print(f"{name:4s} {kind} {t0:7.2f}→{t1:7.2f}  ({t1 - t0:5.1f} s)")
    # video nối
    lst = tmp / "list.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    vid = tmp / "video.mp4"
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(vid)])
    # âm thanh + nhạc nền
    voice = np.concatenate(audio)
    n = len(voice)
    mus = np.zeros(n, np.float32)
    cache = {}
    for name, a0, a1 in music_plan:
        spec = MUSIC.get(name)
        if not spec:
            continue
        key, vol, off = spec
        if key not in cache:
            fpm = BANK / f"music_{key}.wav"
            cache[key] = decode(fpm) if fpm.exists() else np.zeros(SR, np.float32)
        src = cache[key]
        s0 = int(max(0, a0 + off if off >= 0 else a1 + off) * SR)
        s1 = int(a1 * SR)
        if s1 <= s0:
            continue
        seg = np.tile(src, int(np.ceil((s1 - s0) / len(src))) + 1)[: s1 - s0] * vol
        f = min(len(seg) // 3, int(SR * 0.6))
        if f > 0:
            seg[:f] *= np.linspace(0, 1, f)
            seg[-f:] *= np.linspace(1, 0, f)
        mus[s0:s1] += seg
    talk = np.clip(np.convolve((np.abs(voice) > 0.03).astype(np.float32), np.ones(int(SR * 0.3)) / (SR * 0.3), "same") * 3, 0, 1)
    mix = voice + mus * (1 - 0.6 * talk)
    mix = np.tanh(mix * 1.05) / np.tanh(1.05) * 0.97
    wav = tmp / "mix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ac", "2", str(wav)], input=mix.astype(np.float32).tobytes(), check=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(wav), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)])
    print("ASSEMBLE_OK", out, f"{cursor:.1f} s")


def decode_seg(src, t0, t1):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", str(src), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
    a = np.frombuffer(r.stdout, np.float32).copy()
    want = int(round((t1 - t0) * SR))
    if len(a) < want:
        a = np.concatenate([a, np.zeros(want - len(a), np.float32)])
    return a[:want]


if __name__ == "__main__":
    main(*sys.argv[1:6])
