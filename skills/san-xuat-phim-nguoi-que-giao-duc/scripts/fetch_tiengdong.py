#!/usr/bin/env python3
"""Tải bộ hiệu ứng âm thanh THẬT từ TiengDong.com (miễn phí, trang đề nghị ghi nguồn)
về bộ nhớ đệm ~/.cache/stickfilm/tiengdong/, cắt đúng đoạn cần, chuẩn hoá âm lượng.

    python3 fetch_tiengdong.py            # tải/cập nhật toàn bộ
    python3 fetch_tiengdong.py --list     # xem danh sách tên hiệu ứng

export_mp4.py tự dùng bộ này nếu có (tên trùng với tên sfx trong kịch bản), không có thì
tổng hợp âm thanh thay thế. Phim dùng bộ này phải ghi nguồn: "Âm thanh: TiengDong.com".
Muốn thêm âm thanh: mở trang tiengdong.com, tìm link .mp3 trong trang (thư mục wp-content/uploads),
thêm một dòng vào SOUNDS (tên, file mp3, giây bắt đầu, giây kết thúc, âm lượng).
"""
import pathlib
import subprocess
import sys
import urllib.request

BASE = "https://tiengdong.com/wp-content/uploads/"
CACHE = pathlib.Path.home() / ".cache" / "stickfilm" / "tiengdong"
CREDIT = "Âm thanh: TiengDong.com"

# tên: (file mp3 trên tiengdong.com, bắt đầu, kết thúc (None = hết), âm lượng tương đối, mô tả)
SOUNDS = {
    "punch":    ("Am-thanh-cu-dam-www_tiengdong_com.mp3", 0, None, 1.0, "cú đấm trúng"),
    "punch2":   ("tieng-bop-cu-dam-www_tiengdong_com.mp3", 0.12, 0.44, 1.0, "cú đấm bốp"),
    "punch3":   ("Am-thanh-danh-mot-nam-dam-va-roi-xuong-dat-www_tiengdong_com.mp3", 0.30, 0.95, 1.0, "nắm đấm"),
    "kickhit":  ("tieng-danh-vao-co-the-bich-www_tiengdong_com.mp3", 0.16, 1.0, 1.0, "đá trúng người (bịch)"),
    "boxing":   ("Tieng-cu-dam-vo-quyen-anh-www_tiengdong_com.mp3", 0.35, 1.6, 1.0, "cú đấm quyền anh"),
    "swish":    ("Tieng-vung-dao-quo-gay-vut-www_tiengdong_com.mp3", 0, None, 0.9, "tiếng vụt gió"),
    "swish2":   ("Am-thanh-danh-len-www_tiengdong_com.mp3", 0, None, 0.9, "vụt nhanh"),
    "fall":     ("Tieng-co-the-roi-xuong-sich-www_tiengdong_com.mp3", 0.1, None, 1.0, "ngã xuống đất (sịch)"),
    "bell":     ("tieng-chuong-bat-dau-chien-dau-dam-boc-mo-dau-tro-choi-www_tiengdong_com.mp3", 0.8, None, 0.8, "chuông bắt đầu trận"),
    "crowd":    ("tieng-khan-gia-reo-ho-trong-tran-dau-quyen-anh-www_tiengdong_com.mp3", 0, 14, 0.45, "khán giả reo hò"),
    "ko":       ("am-thanh-ha-guc-k-o-knockout-danh-nhau-www_tiengdong_com.mp3", 0.3, None, 0.9, "hạ gục K.O"),
    "victory":  ("Am-thanh-chien-thang-www_tiengdong_com.mp3", 0, None, 0.7, "chiến thắng"),
    "tension":  ("Am-thanh-mo-dau-cang-thang-www_tiengdong_com.mp3", 0, None, 0.6, "mở đầu căng thẳng"),
    "action":   ("Am-thanh-hanh-dong-cuoi-canh-phim-www_tiengdong_com.mp3", 0, None, 0.7, "nhạc hành động"),
    "kungfu":   ("Am-thanh-luyen-vo-thuat-www_tiengdong_com.mp3", 0, None, 0.7, "luyện võ (nền)"),
    "wrong":    ("Am-thanh-ban-tra-loi-sai-roi-www_tiengdong_com.mp3", 0, None, 0.8, "trả lời sai"),
    # —— phép thuật, hài, bất ngờ, anime ——
    "magic":    ("Tong-hop-am-thanh-tan-cong-ma-thuat-phep-thuat-www_tiengdong_com.mp3", 0.2, 1.7, 0.8, "phép thuật bắn ra"),
    "magic2":   ("Tong-hop-am-thanh-tan-cong-ma-thuat-phep-thuat-www_tiengdong_com.mp3", 5.5, 7.2, 0.8, "phép thuật 2"),
    "surprise": ("am-thanh-ten-ten-ten-bat-ngo-www_tiengdong_com.mp3", 0.6, 4.6, 0.8, "tèn tèn ten bất ngờ"),
    "wow":      ("Anime-wow-sound-effect-www_tiengdong_com.mp3", 0.1, 2.6, 0.8, "wow anime"),
    "boom":     ("Boom-sound-effect-www_tiengdong_com.mp3", 0, None, 0.9, "boom"),
    "fail":     ("Fail-sound-effect-www_tiengdong_com.mp3", 0, None, 0.8, "thất bại (hài)"),
    "oof":      ("Oof-sound-effect-www_tiengdong_com.mp3", 0, None, 0.8, "oof"),
    "laugh":    ("Tieng-cuoi-khan-gia-www_tiengdong_com.mp3", 1.9, None, 0.6, "khán giả cười"),
    "slap":     ("tieng-bet-www_tiengdong_com.mp3", 0, None, 0.9, "tiếng bẹt"),
    "animepunch": ("anime-punch-sound-effect-www_tiengdong_com.mp3", 0, None, 0.9, "đấm kiểu anime"),
    "mystery":  ("nhac-nen-to-mo-bi-an-www_tiengdong_com.mp3", 0, None, 0.6, "tò mò bí ẩn"),
    # —— nhạc nền (dùng film.music = "story" | "intro" | "tension" | "kungfu" | "mystery") ——
    "music_story":   ("Nhac-nen-ke-chuyen-www_tiengdong_com.mp3", 0, 120, 0.5, "nhạc nền kể chuyện"),
    "music_intro":   ("Nhac-intro-hay-nhat-www_tiengdong_com.mp3", 0, 100, 0.5, "nhạc intro sôi động"),
    "music_tension": ("Nhac-nen-hoi-hop-cang-thang-www_tiengdong_com.mp3", 0, 120, 0.5, "nhạc hồi hộp căng thẳng"),
}


def fetch(force=False):
    CACHE.mkdir(parents=True, exist_ok=True)
    raw = CACHE / "_mp3"; raw.mkdir(exist_ok=True)
    ok = 0
    for name, (fn, a, b, vol, _) in SOUNDS.items():
        out = CACHE / f"{name}.wav"
        if out.exists() and not force:
            ok += 1; continue
        src = raw / fn
        try:
            if not src.exists():
                req = urllib.request.Request(BASE + fn, headers={"User-Agent": "Mozilla/5.0"})
                src.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            import numpy as np
            pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-f", "f32le", "-ac", "1", "-ar", "44100", "-"],
                                 capture_output=True, check=True).stdout
            x = np.frombuffer(pcm, np.float32).copy()
            x = x[int(a * 44100): int(b * 44100) if b else None]
            x *= (0.7 / (np.abs(x).max() + 1e-9)) * vol           # chuẩn hoá đỉnh ≈ -3 dB
            n = min(len(x) // 4, 660); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)  # chống "bụp"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", "44100", "-ac", "1", "-i", "-", str(out)],
                           input=x.astype(np.float32).tobytes(), check=True)
            ok += 1
        except Exception as e:  # noqa: BLE001
            print(f"! {name}: {e}")
    print(f"Bộ âm thanh TiengDong: {ok}/{len(SOUNDS)} → {CACHE}")
    return ok


if __name__ == "__main__":
    if "--list" in sys.argv:
        for k, v in SOUNDS.items():
            print(f"{k:10s} {v[4]}")
    else:
        fetch("--force" in sys.argv)
