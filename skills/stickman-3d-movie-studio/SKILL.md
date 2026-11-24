---
name: stickman-3d-movie-studio
description: Xưởng phim người que 3D THẬT bằng Blender cho thầy Chung — nhân vật 3D có xương, IK/FK, biểu cảm khuôn mặt và khẩu hình; chuyển động thủ tục đặt chân không trượt, lấy đà, quá đà, chuyển động phụ; bối cảnh 3D (lớp học…), đạo cụ tương tác (compa vẽ đường tròn lên bảng), 33 mẫu góc máy điện ảnh, ánh sáng – bóng đổ – phản chiếu – chiều sâu trường ảnh – nhoè chuyển động, bụi/mưa; giọng Việt tự nhiên VieNeu-TTS (25 giọng, mỗi nhân vật một giọng, đọc đúng công thức toán), tiếng động, nhạc nền, phụ đề SRT, thumbnail, file .blend, báo cáo QA; xuất MP4 Full HD/4K 30–60 fps. Dùng khi thầy muốn làm phim người que 3D, phim hoạt hình 3D, phim minh hoạ bài giảng/định lí/STEM/lịch sử/địa lí bằng nhân vật 3D, hoặc gọi /stickman-3d-movie-studio — kể cả khi chỉ nói "làm phim 3D cảnh cô giáo vẽ đường tròn".
---

# Stickman 3D Movie Studio

Đội sản xuất ảo: đạo diễn (chia cảnh, chọn góc máy) – biên kịch (lời thoại, nhịp) – kĩ sư Blender (nhân vật, rig, cảnh) – hoạt hoạ (chuyển động) – âm thanh (giọng, tiếng động, nhạc). Mọi thứ là **mã thật đã kiểm thử**, em chỉ cần viết kịch bản `film.json` rồi chạy `studio.py`.

Phim 2D người que (HTML/canvas) dùng skill `san-xuat-phim-nguoi-que-giao-duc`; skill này dành cho **phim 3D thật** (render Blender). Dựng hình học chính xác dạng mô phỏng tương tác → `mo-phong-hinh-ve`.

## Cấu trúc
| Thư mục | Nội dung |
|---|---|
| `scripts/studio.py` | Dây chuyền: giọng → dựng 3D → render → âm thanh → video + phụ đề → thumbnail → QA |
| `scripts/blender/sm_rig.py` | Nhân vật 3D: 15 xương thân + 8 xương điều khiển, IK chân/tay (FK qua influence), mesh bo tròn, viền hoạt hình, mặt 10 shape key |
| `scripts/blender/sm_anim.py` | Chuyển động: đi/chạy/rón rén/diễu hành/lùi (đặt chân cố định, gót–mũi), quay tại chỗ, nhảy (lấy đà, co duỗi), với tay/cầm đồ, nhìn, cử chỉ khi nói, chớp mắt, khẩu hình, thở, dồn trọng tâm; bake keyframe |
| `scripts/blender/sm_env.py` | Bối cảnh (lớp học, studio vô cực), đạo cụ (compa…), nét phấn vẽ dần, chữ trên bảng, bụi nắng, bụi phấn, mưa |
| `scripts/blender/sm_cine.py` | 33 preset góc máy + bộ giải máy quay theo từng khung, ánh sáng lớp học, thiết lập render EEVEE theo chất lượng |
| `scripts/blender/build_scene.py` | Đọc kịch bản → dựng cảnh, chạy hành động tuần tự/song song, đạo cụ bám tay, QA trượt chân |
| `scripts/tts_engine.py`, `vi_speech.py` | Giọng VieNeu/edge/Piper; đọc công thức `$...$` đúng tiếng Việt |
| `scripts/audio_mix.py` | Trộn lời + tiếng động đúng khung hình + không khí phòng + nhạc nền (ducking) |
| `animations/gestures.json` | Thư viện động tác thân trên (đếm bằng `python3 scripts/catalog.py`) |
| `cameras/`, `environments/`, `characters/`, `audio/` | Danh mục preset, nhân vật mẫu, hướng dẫn âm thanh |
| `templates/film_template.json` | Mẫu kịch bản trống có chú thích |
| `examples/duong-tron/film.json` | Phim mẫu 30 s: thầy giáo vào lớp, cầm compa, vẽ đường tròn, giải thích bán kính – đường kính |
| `references/` | Kĩ thuật (12 nguyên tắc hoạt hình áp vào code), ngữ pháp máy quay, giọng nói, nguồn tham khảo |
| `tests/` | Kiểm thử tự động (`python3 tests/run_tests.py`) |
| `LEARNINGS.md` | Nhật kí tự nâng cấp sau mỗi dự án |

## Quy trình sản xuất (làm tuần tự, không bắt thầy thao tác tay)
1. **Kiểm tra máy**: `python3 scripts/studio.py check` (CPU/RAM/GPU, Blender, ffmpeg, VieNeu, bộ âm thanh). Thiếu gì thì cài (xem README) khi được phép.
2. **Phân tích yêu cầu**: thể loại, bài học, thông điệp, thời lượng (mặc định 30–60 s), nhân vật.
3. **Kịch bản + storyboard**: viết bảng ngắn Cảnh | Hành động | Lời thoại | Góc máy | Âm thanh. Kiến thức đúng SGK Kết nối tri thức, phép tính tự kiểm. Công thức trong lời thoại đặt trong `$...$`.
4. **Thiết kế nhân vật**: `characters/presets.json` (giáo viên, học sinh…) hoặc từ ảnh: `python3 characters/from_image.py anh.jpg` → bảng màu áo/tóc/da gợi ý; em xem ảnh để chọn kiểu tóc, kính, váy. Mỗi nhân vật một giọng VieNeu (`python3 scripts/studio.py voices`).
5. **Viết `film.json`** theo `templates/film_template.json` (đọc `references/kich-ban-3d.md` để biết từng hành động). Giữ nguyên `spec` nhân vật suốt phim để nhất quán hình dạng – màu sắc.
6. **Render thử**: `python3 scripts/studio.py make film.json --out OUT --quality draft --frames 1-60`, rồi render 1 khung giữa mỗi shot (xem `references/qa.md`) và **nhìn ảnh**: khung hình cắt đầu? nhân vật che vật quan trọng? đạo cụ lệch tay? chữ đọc được? Sửa `film.json`/preset rồi làm lại.
7. **Render chính thức**: `--quality cpu` (720p + nâng 1080p, máy không GPU) | `hd` (1080p gốc, cần GPU) | `4k`; `--fps 30` hoặc `60`. Máy không GPU ~2–4 s/khung (720p).
8. **Kiểm tra cuối**: đọc `qa_report.md` (trượt chân < 30 mm, không xuyên sàn, đủ khung, không khung đen, phụ đề, file .blend); trích 4–6 khung từ MP4 để xem.
9. **Bàn giao**: MP4, `.blend`, `film.json` (kịch bản), storyboard, `.srt`, `thumbnail.jpg`, `qa_report.md`. Nói rõ chất lượng thực tế (độ phân giải render gốc, giọng dùng, tốc độ).
10. **Tự nâng cấp**: ghi vào `LEARNINGS.md` lỗi gặp + cách sửa + kĩ thuật hay; thêm động tác/góc máy/bối cảnh mới vào thư viện; chạy `tests/run_tests.py` để chắc không hỏng chức năng cũ.

## Nguyên tắc chất lượng
- Nhân vật **đi vào khung hình**, đi tới đồ vật trước khi dùng, nhìn vào thứ đang nói; tay cầm đồ thì đồ phải bám tay (hệ đạo cụ tự lo).
- Mỗi shot đổi góc có lí do; mở bằng toàn cảnh, đối thoại dùng trung cảnh/cận, chốt bằng cận cảm xúc; không để nhân vật che hình vẽ quan trọng (đặt máy phía đối diện tay vẽ).
- Chữ trên bảng ≥ 0,12 m (đọc được ở 1080p), phụ đề ≈ 6 % chiều cao khung (cỡ chữ trình chiếu).
- Ghi nguồn: VieNeu-TTS (giọng mẫu CC BY-NC — dùng giáo dục phi thương mại), TiengDong.com (nhạc/tiếng động).
- Báo cáo trung thực: chỉ nói "xong" khi đã có MP4 và QA đạt; nêu rõ phần còn giới hạn.
