# Stickman 3D Movie Studio

Xưởng phim người que **3D thật** (Blender) chạy hoàn toàn bằng công cụ miễn phí: Blender (dựng hình, rig, render EEVEE), Python (chuyển động thủ tục), VieNeu-TTS (giọng Việt offline), FFmpeg (âm thanh, video, phụ đề), bộ tiếng động TiengDong.com.

## Cài đặt (Ubuntu/Debian — máy chủ, WSL)
```bash
bash install.sh
```
Cài: `blender python3-numpy fonts-liberation xvfb ffmpeg`, môi trường ảo `/opt/vieneu` với `vieneu` (giọng Việt), tải bộ tiếng động TiengDong.

## Cài đặt (Windows/macOS)
1. Cài Blender ≥ 4.0 (blender.org), FFmpeg, Python 3.10+.
2. `pip install vieneu` (Windows: thêm `--extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/` nếu lỗi build).
3. Đặt biến môi trường `STICKMAN_TTS_PY` trỏ tới python có `vieneu`; thêm Blender vào PATH.
4. `python audio/fetch_tiengdong.py` để tải tiếng động/nhạc nền.
Có GPU thì dùng `--quality hd` hoặc `4k` (EEVEE dùng GPU, nhanh hơn nhiều lần).

## Dùng
```bash
python3 scripts/studio.py check
python3 scripts/studio.py voices
python3 scripts/studio.py make examples/duong-tron/film.json --out out/duong-tron --quality cpu
python3 tests/run_tests.py
python3 scripts/catalog.py      # đếm tài nguyên thực có
```
Đầu ra trong `--out`: `*.mp4` (phụ đề in sẵn), `*.srt`, `*.blend` (mở bằng Blender để chỉnh), `production.json`, `timeline.json`, `thumbnail.jpg`, `qa_report.md`, `voice/*.wav`.

## Trạng thái thư viện (đếm thật bằng `catalog.py`, cập nhật dần)
- Chuyển động: 58 động tác thân trên + 6 kiểu dáng đi + 8 chuyển động thủ tục = 72 mẫu (mục tiêu ≥ 100).
- Góc máy: 33 preset (đạt mục tiêu ≥ 30).
- Bối cảnh: lớp học, studio vô cực (mục tiêu 20 — đang phát triển).
- Biểu cảm: 10 shape key; đạo cụ: compa, bảng phấn (nét vẽ dần, chữ); hiệu ứng: bụi nắng, bụi phấn, mưa.
- Chưa có: dữ liệu motion capture (BVH), ngón tay, mô phỏng vải/tóc, nhận dạng nhân vật tự động từ ảnh (hiện chỉ trích bảng màu, Claude xem ảnh để chọn kiểu).
