---
name: san-xuat-phim-nguoi-que-giao-duc
description: Sản xuất trọn gói phim hoạt hình người que giáo dục (kiểu MinutePhysics / stickman explainer) cho thầy Chung — ý tưởng, kịch bản nhiều nhân vật, dựng phim HTML5 bằng engine có sẵn (đi, chạy, nói, viết bảng, đạo cụ trực quan, quiz, máy quay), kiểm tra tự động, xuất MP4 có giọng đọc và nhạc. Dùng skill này mỗi khi thầy muốn làm phim, clip, video hoạt hình người que, phim kể chuyện dẫn nhập bài học, phim tình huống Toán thực tế, phim sai lầm thường gặp, phim cho kênh YouTube giáo dục, hoặc cần xuất phim người que ra MP4 — kể cả khi thầy chỉ nói "làm cái phim hoạt hình cho bài này".
---

# Sản xuất phim người que giáo dục

Sản phẩm chính: **một file HTML duy nhất** (mở bằng Chrome/Edge là chiếu, có giọng đọc tiếng Việt, phụ đề, nút quay) và khi thầy cần thì thêm **file MP4** để đăng YouTube/Zalo/chiếu không cần mạng.

Không viết hoạt hình từ đầu mỗi lần: skill có sẵn engine đã kiểm thử. Việc của em là **viết kịch bản thật hay dưới dạng dữ liệu `window.FILM`**, rồi build – kiểm tra – xuất. Nhờ vậy thời gian dồn vào nội dung sư phạm, còn hình ảnh luôn đồng bộ và không lỗi.

Phân biệt với skill khác:
- `phim-nguoi-que-giang-bai`: một giáo viên đứng giảng ở bảng, file viết tay riêng. Skill này rộng hơn: nhiều nhân vật, nhiều bối cảnh, kể chuyện, xuất MP4. Nếu thầy chỉ cần "cô giáo giảng bảng" thì skill này vẫn làm được (dùng `bg: "classroom"`/`"whiteboard"`).
- Dựng hình học bằng thước, compa, ê ke → `mo-phong-hinh-ve` / `mo-phong-phan-tich-di-len`.
- Video AI quay thật (Veo/Flow) → `lam-video-veo3-flow`.

## Tài nguyên trong skill
| Đường dẫn | Dùng khi |
|---|---|
| `references/kich-ban.md` | Luôn đọc trước khi viết kịch bản: bài học từ các kênh người que, 6 khung thể loại, cách viết lời đọc, nhịp độ |
| `references/film-api.md` | Tra cứu đầy đủ định dạng `window.FILM`: nhân vật, tư thế, nét mặt, đạo cụ, phông nền, mini-TeX, âm thanh |
| `examples/phan-so-bang-nhau.film.js` | Phim mẫu hoàn chỉnh 5 cảnh (≈85 s) — chép cấu trúc từ đây |
| `scripts/build_film.py` | Ghép kịch bản + engine → 1 file HTML |
| `scripts/check_film.py` | Bắt lỗi kịch bản, chữ tràn bảng, lời đọc còn kí hiệu; chụp ảnh từng cảnh + ảnh tổng |
| `scripts/export_mp4.py` | Xuất MP4 (giọng edge-tts hoặc file ghi âm của thầy, hiệu ứng, nhạc) |
| `scripts/engine.js`, `scripts/template.html` | Engine + giao diện; chỉ sửa khi cần thêm tư thế/đạo cụ/phông mới |

Gọi các script bằng đường dẫn tuyệt đối tới thư mục skill (ví dụ `python3 <skill>/scripts/build_film.py ...`).

## Quy trình

### 1. Nắm yêu cầu (ngắn gọn)
Xác định: lớp, bài/khái niệm, mục đích (khởi động tiết, hình thành kiến thức, củng cố, kênh YouTube), thời lượng (mặc định 2–3 phút), thể loại (A–F trong `kich-ban.md`), có cần MP4 không. Nếu thầy gửi ảnh đề, đọc chính xác trước. Yêu cầu đã rõ thì làm luôn, không hỏi lại.

### 2. Kịch bản phân cảnh (duyệt trước khi dựng nếu phim > 3 phút hoặc ý còn mơ hồ)
Trình bày bảng ngắn: Cảnh | Bối cảnh | Diễn biến & lời thoại chính | Hình ảnh trực quan | Âm thanh. Bám các nguyên tắc trong `kich-ban.md`: một ý chính, mở bằng tình huống, có hiểu lầm để sửa, có quiz, chốt 1 câu dễ nhớ. Kiến thức đúng SGK Kết nối tri thức; mọi phép tính tự tính lại.

### 3. Viết `ten-phim.film.js`
- Khai báo `cast` (mỗi nhân vật một dáng riêng: tóc, áo, mũ, giọng) → `scenes` → `beats`.
- Mọi trường trong một nhịp chạy cùng lúc: nhân vật vừa nói, vừa viết bảng, vừa hiện đạo cụ.
- `say` = lời đọc viết thành chữ (máy đọc kí hiệu sai); `sub`/`write`/`quiz` = hiển thị kí hiệu chuẩn mini-TeX (`\frac{1}{2}`, `x^2`, `\hat{A}`…).
- Dùng đạo cụ trực quan thay cho chữ khi được: `bar`/`cake` (phân số), `numberline` (số nguyên), `balance` (phương trình), `chart` (thống kê), `clock`, `money`…
- Cho nhân vật "sống": đổi `pose`/`face`/`emote` theo cảm xúc, `move` đi lại, `cam` phóng to chỗ quan trọng.
- Lưu file kịch bản cạnh file HTML để thầy sửa lời sau này.

### 4. Build và kiểm tra (bắt buộc, sửa đến khi ĐẠT)
```bash
python3 <skill>/scripts/build_film.py ten-phim.film.js ten-phim.html
python3 <skill>/scripts/check_film.py ten-phim.html ten-phim-preview/
```
`check_film.py` cần Python Playwright (`pip install playwright`; script tự dùng Chromium/Chrome/Edge có sẵn nếu Playwright chưa tải trình duyệt). Sửa mọi `ERROR`; xem xét `WARN`. Sau đó **mở `tong-quan.jpg` ra xem bằng mắt**: nhân vật có che chữ/đạo cụ không, bong bóng có đè nhau không, đạo cụ có lơ lửng vô lí không, bố cục có cân không. Chỉnh toạ độ rồi build lại.

### 5. Xuất MP4 (khi thầy cần video)
```bash
python3 <skill>/scripts/export_mp4.py ten-phim.html ten-phim.mp4 --music            # giọng HoaiMy/NamMinh (edge-tts, cần mạng)
python3 <skill>/scripts/export_mp4.py ten-phim.html --list                           # in mã từng câu để thầy tự ghi âm
python3 <skill>/scripts/export_mp4.py ten-phim.html ten-phim.mp4 --voice-dir ghi-am/ # dùng giọng thật của thầy (s1b1.mp3…)
```
Thời lượng cảnh tự giãn theo độ dài file âm thanh thật. Nếu edge-tts không chạy được (thiếu gói/mạng chặn), script tự xuất bản không lời và báo rõ — khi đó nói thật với thầy và gợi ý: chạy lại trên máy có mạng, dùng `--voice-dir`, hoặc bấm ⏺ Quay trong file HTML (ghi được cả giọng đọc của trình duyệt). `--size 1280x720` xuất nhanh hơn. Xem lại vài khung hình của MP4 trước khi giao.

### 6. Bàn giao
Gửi file HTML (và MP4 nếu có), tên không dấu. Trả lời ngắn: số cảnh, thời lượng, các điểm sư phạm chính, cách sửa lời (mở file `.film.js`, sửa `say`, chạy lại build), cách quay/xuất video. Đề xuất 1–2 cải tiến thiết thực (phim tiếp theo trong chuỗi, phiếu học tập đi kèm…).

## Mở rộng engine
Cần tư thế/đạo cụ/phông nền mới: thêm vào `POSES`, `PROPS`, `BG` trong `scripts/engine.js` (theo mẫu có sẵn, vẽ bằng `hline`/`hcircle`/`hrect` để giữ nét vẽ tay), chạy `node --check`, build lại phim mẫu và `check_film.py` để chắc không hỏng gì, rồi cập nhật bảng trong `references/film-api.md`.
