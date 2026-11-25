"""audio_mix — trộn lời thoại + tiếng động (đồng bộ theo sự kiện khung hình) + không khí phòng + nhạc nền.

Tiếng động thật lấy từ bộ TiengDong.com (~/.cache/stickfilm/tiengdong, tải bằng fetch_tiengdong.py);
thiếu thì tổng hợp bằng numpy (bước chân, phấn cào bảng, cạch, tiếng phòng...).
"""
import pathlib
import subprocess
import numpy as np

SR = 48000
BANK_DIR = pathlib.Path.home() / ".cache" / "stickfilm" / "tiengdong"


def decode(fp, sr=SR):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(fp), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def env_from_audio(fp, fps):
    """Độ mở miệng theo âm lượng (khớp môi) — trả về list 0..1 cho từng frame."""
    a = np.abs(decode(fp, 16000))
    hop = int(16000 / fps)
    n = max(1, len(a) // hop)
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    ref = np.percentile(rms, 90) + 1e-6
    v = np.clip(rms / ref, 0, 1)
    v[v < 0.12] = 0
    v = np.convolve(v, [0.25, 0.5, 0.25], "same")
    return [round(float(x), 3) for x in v]


def tone(f, dur, vol=0.3, f2=None, decay=None):
    n = int(SR * dur)
    t = np.arange(n) / SR
    fr = f if f2 is None else f * (f2 / f) ** (t / dur)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    e = np.minimum(1, t / 0.004) * np.exp(-t / (decay or dur / 4))
    return (np.sin(ph) * e * vol).astype(np.float32)


def bandnoise(dur, lo, hi, vol):
    n = max(8, int(SR * dur))
    X = np.fft.rfft(np.random.randn(n))
    fq = np.fft.rfftfreq(n, 1 / SR)
    X[(fq < lo) | (fq > hi)] = 0
    y = np.fft.irfft(X, n)
    return (y / (np.abs(y).max() + 1e-9) * vol).astype(np.float32)


def _mx(*arrs):
    n = max(len(a) for a in arrs)
    out = np.zeros(n, np.float32)
    for a in arrs:
        out[:len(a)] += a
    return out


def synth(name, dur=1.0):
    if name in ("step", "steprun", "land"):
        big = {"step": 1.0, "steprun": 1.3, "land": 1.8}[name]
        r = 0.85 + np.random.rand() * 0.3
        th = tone(85 * r, 0.1 * big, 0.28 * big, 45)
        sc = bandnoise(0.07 * big, 700 * r, 3200 * r, 0.12 * big)
        sc *= np.exp(-np.arange(len(sc)) / (SR * 0.018))
        out = np.zeros(max(len(th), len(sc)), np.float32)
        out[:len(th)] += th
        out[:len(sc)] += sc
        return out
    if name == "chalk":
        # phấn cào bảng: nhiễu dải cao, nhịp từng nét
        n = bandnoise(dur, 2500, 7500, 0.16)
        t = np.arange(len(n)) / SR
        am = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.1 * t + 2 * np.sin(2 * np.pi * 0.7 * t)))
        g = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.08)
        return (n * am * g).astype(np.float32)
    if name == "write":
        return synth("chalk", 0.35) * 0.9
    if name in ("grab", "tap", "click"):
        a = tone(1800, 0.03, 0.12) + bandnoise(0.03, 2000, 6000, 0.08)
        return a
    if name == "jump":
        return tone(260, 0.22, 0.15, 520)
    if name == "pop":
        return tone(520, 0.14, 0.3, 1100)
    if name == "ding":
        return tone(1318, 0.9, 0.25, decay=0.3)
    if name == "whoosh":
        n = bandnoise(0.45, 500, 3500, 0.3)
        return n * np.sin(np.linspace(0, np.pi, len(n)))
    if name == "shimmer":
        out = np.zeros(int(SR * 0.8), np.float32)
        for i, f in enumerate([1568, 2093, 2637, 3136]):
            a = tone(f, 0.5, 0.06, decay=0.15)
            out[int(i * 0.06 * SR):int(i * 0.06 * SR) + len(a)] += a
        return out
    if name == "knock":          # đầu gối gõ "cộc": gỗ rỗng
        return _mx(tone(420, 0.09, 0.45, 300, decay=0.025), tone(980, 0.05, 0.18, decay=0.012), bandnoise(0.02, 1500, 4000, 0.08))
    if name == "bike_bell":      # chuông xe đạp "kính coong"
        out = np.zeros(int(SR * 1.6), np.float32)
        for st, f in ((0.0, 2350), (0.22, 1980)):
            a = _mx(tone(f, 1.2, 0.22, decay=0.35), tone(f * 2.76, 0.8, 0.06, decay=0.2))
            out[int(st * SR):int(st * SR) + len(a)] += a
        return out
    if name == "beep":
        return tone(1046, 0.16, 0.2, decay=0.5)
    if name == "beep2":
        return np.concatenate([tone(880, 0.12, 0.2, decay=0.5), np.zeros(int(SR * 0.06), np.float32), tone(1320, 0.18, 0.2, decay=0.5)])
    if name == "sizzle":         # trứng "xèo"
        n = bandnoise(dur, 2500, 9000, 0.22)
        t = np.arange(len(n)) / SR
        crack = (np.random.rand(len(n)) > 0.9985).astype(np.float32) * 0.5
        return ((n * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2) + crack) * np.minimum(1, t / 0.08) * np.clip((dur - t) / 0.3, 0, 1)).astype(np.float32)
    if name == "boing":
        t = np.arange(int(SR * 0.6)) / SR
        f = 180 + 80 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 4)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 0.35).astype(np.float32)
    if name == "latch":          # chốt khoá "cạch"
        return _mx(tone(260, 0.07, 0.4, 120, decay=0.02), tone(2600, 0.04, 0.15, decay=0.01))
    if name == "unlatch":
        return _mx(tone(1500, 0.05, 0.18, decay=0.015), tone(700, 0.12, 0.2, 1400, decay=0.05))
    if name == "metalstep":      # bước chân kim loại tí hon
        return _mx(tone(3200, 0.03, 0.07, decay=0.008), bandnoise(0.02, 4000, 9000, 0.05))
    if name == "slam":
        return _mx(tone(90, 0.35, 0.5, 50, decay=0.12), bandnoise(0.15, 200, 1500, 0.3))
    if name == "spray":
        n = bandnoise(dur, 3000, 10000, 0.18)
        return n * np.minimum(1, np.arange(len(n)) / (SR * 0.05))
    if name == "pluck":          # dây bật "pựt"
        return _mx(tone(700, 0.25, 0.35, 150, decay=0.06), bandnoise(0.03, 2000, 6000, 0.15))
    if name == "splash":
        n = bandnoise(0.7, 300, 5000, 0.3)
        return n * np.exp(-np.arange(len(n)) / (SR * 0.2))
    if name == "plop":
        return tone(300, 0.18, 0.4, 90, decay=0.06)
    if name == "eat":
        return bandnoise(0.12, 1500, 6000, 0.18) * np.exp(-np.arange(int(SR * 0.12)) / (SR * 0.04))
    return np.zeros(10, np.float32)


SYNTH = ("chalk", "write", "step", "steprun", "land", "grab", "tap", "click", "jump", "shimmer", "knock", "bike_bell", "beep", "beep2", "sizzle",
         "latch", "unlatch", "metalstep", "slam", "spray", "pluck", "splash", "plop", "eat")
_bank = {}


def sfx(name, dur=1.0):
    if name in SYNTH:
        return synth(name, dur)
    fp = BANK_DIR / f"{name}.wav"
    if fp.exists():
        if name not in _bank:
            _bank[name] = decode(fp)
        return _bank[name]
    return synth(name, dur)


def room_tone(n):
    """không khí phòng học: ù rất nhẹ + tiếng xa xa"""
    x = np.cumsum(np.random.randn(n)).astype(np.float32)
    x -= np.convolve(x, np.ones(4800) / 4800, "same")
    x /= (np.abs(x).max() + 1e-9)
    return x * 0.012


def mix(total_s, lines, events, fps, music=None, music_vol=0.10):
    n = int(SR * (total_s + 0.5))
    voice = np.zeros(n, np.float32)
    fx = np.zeros(n, np.float32)
    for L in lines:
        a = decode(L["wav"])
        st = int(L["f0"] / fps * SR)
        voice[st:st + len(a)] += a[: max(0, n - st)]
    for e in events:
        a = sfx(e["name"], e.get("dur", 1.0))
        if e.get("len"):
            a = a[: int(SR * e["len"])].copy()
            k = min(len(a) // 4, int(SR * 0.3))
            if k > 0:
                a[-k:] *= np.linspace(1, 0, k)
        vol = float(e.get("vol", 1.0)) * (0.55 if e.get("soft") else 1.0)
        st = int(e["f"] / fps * SR)
        fx[st:st + len(a)] += a[: max(0, n - st)] * vol
    voice = np.tanh(voice * 1.5) / np.tanh(1.5)
    talk = np.clip(np.convolve((np.abs(voice) > 0.02).astype(np.float32), np.ones(int(SR * 0.25)) / (SR * 0.25), "same") * 3, 0, 1)
    out = voice * 1.0 + fx * 0.7 * (1 - 0.5 * talk) + room_tone(n)
    if music:
        fp = BANK_DIR / f"music_{music}.wav"
        if fp.exists():
            m = decode(fp)
            m = np.tile(m, int(np.ceil(n / len(m))) + 1)[:n]
            env = np.convolve((np.abs(voice) > 0.01).astype(np.float32), np.ones(int(SR * 0.4)) / (SR * 0.4), "same")
            fade = min(n, SR * 2)
            m[-fade:] *= np.linspace(1, 0, fade)
            m[:SR] *= np.linspace(0, 1, SR)
            out += m * music_vol * (1 - 0.6 * np.clip(env * 3, 0, 1))
    return (np.tanh(out * 1.05) / np.tanh(1.05) * 0.97).astype(np.float32)


def write_wav(x, fp):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", str(SR), str(fp)],
                   input=x.astype(np.float32).tobytes(), check=True)
