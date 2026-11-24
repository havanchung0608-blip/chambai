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
    return np.zeros(10, np.float32)


_bank = {}


def sfx(name, dur=1.0):
    if name in ("chalk", "write", "step", "steprun", "land", "grab", "tap", "click", "jump", "shimmer"):
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
    out = voice * 1.0 + fx * 0.85 + room_tone(n)
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
    peak = np.abs(out).max()
    if peak > 0.97:
        out *= 0.97 / peak
    return out


def write_wav(x, fp):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", str(SR), str(fp)],
                   input=x.astype(np.float32).tobytes(), check=True)
