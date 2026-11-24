# Giọng nói tiếng Việt (miễn phí, không giới hạn số video)

| Công cụ | Chất lượng | Chạy | Giọng | Giấy phép |
|---|---|---|---|---|
| **VieNeu-TTS** (mặc định) | tự nhiên, rõ | offline, CPU (~3× thời lượng câu) | 25 giọng: nam/nữ, Bắc/Trung/Nam, phong cách tự nhiên/kể chuyện/tin tức/đọc truyện; nhân bản giọng từ 3–5 s ghi âm | mô hình Apache-2.0; giọng mẫu CC BY-NC 4.0 → dùng giáo dục phi thương mại, ghi nguồn |
| edge-tts (Microsoft) | rất tự nhiên | cần mạng (speech.platform.bing.com) | HoaiMy (nữ), NamMinh (nam) | dịch vụ miễn phí |
| Piper vi_VN | khá, hơi máy | offline | 1 giọng nữ | MIT |
| Giọng thật của thầy | tốt nhất | — | ghi âm từng câu | — |

Chọn giọng theo vai: cô giáo → `Ngọc Huyền`/`Đoan Trang`; thầy → `Thiện Minh` (kể chuyện)/`Minh Đức`; học sinh nữ → `Quỳnh Anh`; học sinh nam → `Hải Đăng`; ông kể chuyện → `Thiền Tâm Đức`; giọng miền Nam → `Thùy Dung`, `Thục Đoan`, `Thái Sơn`, `Đức Trí`; miền Trung → `Ngọc Trân`, `Quang Sơn`. Liệt kê: `python3 scripts/studio.py voices`.
Nhân bản giọng thầy: đặt `"ref_audio": "giong-thay.wav"` (3–5 s, rõ, không nhạc nền) cho nhân vật.
Công thức: viết trong `$...$` — `vi_speech.py` đọc "d = 2R" thành "đê bằng hai e-rờ", "x^2" thành "ích bình phương", "3,14" thành "ba phẩy mười bốn"; phụ đề vẫn hiện kí hiệu.
