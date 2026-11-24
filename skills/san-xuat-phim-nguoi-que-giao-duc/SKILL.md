---
name: san-xuat-phim-nguoi-que-giao-duc
description: Sản xuất phim hoạt hình người que MỌI THỂ LOẠI ra file MP4 cho thầy Chung — giáo dục, cổ tích, hành động/võ thuật, hài, phiêu lưu, viễn tưởng, hồi hộp, thể thao, kĩ năng sống, lịch sử — theo kịch bản. Nhân vật mặc trang phục đúng vai (vua, hiệp sĩ, phù thủy, ninja, robot, phi hành gia, nông dân nón lá…), chuyển động như người thật, máy quay 2.5D như phim 3D (cỡ cảnh, góc thấp/cao/nghiêng, bám theo, lia nhanh, chiều sâu nhiều lớp, letterbox), hoạt hình toán kiểu Manim (vẽ dần trục, đồ thị, biến hình công thức), tiếng động thật TiengDong.com, giọng đọc tiếng Việt khớp môi, chữ cỡ slide trình chiếu. Dùng mỗi khi thầy muốn làm phim, clip, video, phim ngắn, hoạt hình người que hay hoạt hình toán kiểu Manim — kể cả khi chỉ nói "làm cái phim hoạt hình cho bài này" hoặc "làm phim võ thuật/cổ tích người que".
---

# Sản xuất phim người que (mọi thể loại)

Thầy Chung: phim người que không chỉ để giảng bài — **kịch bản quyết định thể loại**, nhân vật phải mặc đúng vai, âm thanh hiệu ứng kết hợp hoạt hình kiểu Manim, góc máy thay đổi như phim 3D. Đọc `references/the-loai-va-may-quay.md` trước khi viết kịch bản để chọn vai, phông, góc máy, âm thanh hợp thể loại.

Sản phẩm bàn giao: **file MP4 1920×1080** (thầy yêu cầu phim MP4, không phải HTML). File HTML chỉ là bản dựng trung gian để kiểm tra/xuất — không gửi làm sản phẩm chính, trừ khi thầy hỏi.

**Chuẩn chữ (thầy yêu cầu "cỡ chữ như slide PPT, lớn nhất có thể, học sinh quan sát được"):** khung 1920 px ≈ slide 13,33 in nên 30 pt ≈ 60 px. Engine mặc định: chữ viết bảng 84 px, bóng thoại và phụ đề 64 px, câu hỏi quiz 66 px / đáp án 64 px, tiêu đề 124 px. Không đặt `size` nhỏ hơn 60 cho chữ học sinh cần đọc (bộ kiểm tra cảnh báo). Câu thoại ngắn để bóng thoại ≤ 3 dòng. Cảnh có bảng: lời nói tự xuống thanh phụ đề dưới đáy để không che bảng; cảnh không có bảng dùng bóng thoại (khi đã có bóng thoại thì không lặp phụ đề).

**Âm thanh thật từ TiengDong.com** (miễn phí, trang đề nghị ghi nguồn): chạy `python3 <skill>/scripts/fetch_tiengdong.py` một lần để tải bộ tiếng động (đấm, đá, vụt gió, ngã, chuông, khán giả, K.O, chiến thắng, căng thẳng, trả lời sai…; `--list` xem tên). `export_mp4.py` tự dùng khi tên sfx trùng; thiếu thì dùng âm tổng hợp. Phim có dùng bộ này phải ghi "Âm thanh: TiengDong.com" ở màn kết. Cần tiếng mới: tìm trên tiengdong.com, thêm dòng vào bảng `SOUNDS` trong script.

**Chuẩn chuyển động và âm thanh (thầy yêu cầu "di chuyển như người thật, âm thanh chuẩn"):** engine đã lo phần cơ học — bàn chân bám đất khi đi (không trượt), hông nhấp nhô, tay vung ngược chân và trễ nhịp, tăng tốc – giảm tốc, bước khép chân khi dừng, quay người, nhún lấy đà khi nhảy, đứng yên vẫn thở và dồn trọng tâm, tay đưa nhịp khi nói, người nghe đưa mắt về người nói; tiếng bước chân/tiếp đất tự sinh đúng lúc chân chạm đất; khi xuất MP4 miệng mở theo âm lượng thật của giọng. Việc của em khi viết kịch bản là **cho nhân vật di chuyển có mục đích**: đi vào khung hình thay vì xuất hiện sẵn, đi tới chỗ đạo cụ/bảng trước khi nói về nó, chạy khi vui/vội, quay sang người đối diện khi đối thoại, rời khung hình ở cảnh kết.

Không viết hoạt hình từ đầu mỗi lần: skill có sẵn engine đã kiểm thử. Việc của em là **viết kịch bản thật hay dưới dạng dữ liệu `window.FILM`**, rồi build – kiểm tra – xuất. Nhờ vậy thời gian dồn vào nội dung sư phạm, còn hình ảnh luôn đồng bộ và không lỗi.

Phân biệt với skill khác:
- `phim-nguoi-que-giang-bai`: một giáo viên đứng giảng ở bảng, file viết tay riêng. Skill này rộng hơn: nhiều nhân vật, nhiều bối cảnh, kể chuyện, xuất MP4. Nếu thầy chỉ cần "cô giáo giảng bảng" thì skill này vẫn làm được (dùng `bg: "classroom"`/`"whiteboard"`).
- Dựng hình học bằng thước, compa, ê ke → `mo-phong-hinh-ve` / `mo-phong-phan-tich-di-len`.
- Video AI quay thật (Veo/Flow) → `lam-video-veo3-flow`.

## Tài nguyên trong skill
| Đường dẫn | Dùng khi |
|---|---|
| `references/the-loai-va-may-quay.md` | Luôn đọc: bảng thể loại → vai/phông/máy quay/âm thanh; vai diễn có sẵn; ngữ pháp máy quay; hoạt hình Manim; chuyển cảnh |
| `references/kich-ban.md` | Phim có mục tiêu dạy học: nguyên tắc kể chuyện sư phạm, khung bài, cách viết lời đọc, nhịp độ |
| `references/film-api.md` | Tra cứu đầy đủ định dạng `window.FILM`: nhân vật, tư thế, nét mặt, đạo cụ, phông nền, mini-TeX, âm thanh |
| `examples/hiep-si-parabol.film.js` | Mẫu đa thể loại: cổ tích + phiêu lưu + Manim, đủ kiểu máy quay, vai diễn, chuyển cảnh, nhạc nền |
| `examples/vo-thuat-thu.film.js` | Mẫu hành động: nhịp đòn đánh, hiệu ứng va chạm, rung khung, tiếng thật |
| `examples/phan-so-bang-nhau.film.js` | Mẫu giáo dục: tình huống → bảng → quiz |
| `scripts/fetch_tiengdong.py` | Tải bộ tiếng động + nhạc nền TiengDong.com (chạy một lần) |
| `scripts/build_film.py` | Ghép kịch bản + engine → 1 file HTML |
| `scripts/check_film.py` | Bắt lỗi kịch bản, chữ tràn bảng, lời đọc còn kí hiệu; chụp ảnh từng cảnh + ảnh tổng |
| `scripts/export_mp4.py` | Xuất MP4 (giọng edge-tts hoặc file ghi âm của thầy, hiệu ứng, nhạc) |
| `scripts/engine.js`, `scripts/template.html` | Engine + giao diện; chỉ sửa khi cần thêm tư thế/đạo cụ/phông mới |

Gọi các script bằng đường dẫn tuyệt đối tới thư mục skill (ví dụ `python3 <skill>/scripts/build_film.py ...`).

## Quy trình

### 1. Nắm yêu cầu (ngắn gọn)
Xác định: thể loại (theo kịch bản thầy đưa hoặc mục đích), khán giả, thông điệp, thời lượng (mặc định 1–3 phút). Phim dạy học thì thêm lớp, bài, mục tiêu. Nếu thầy gửi ảnh đề, đọc chính xác trước. Yêu cầu đã rõ thì làm luôn, không hỏi lại.

### 2. Kịch bản phân cảnh (duyệt trước khi dựng nếu phim > 3 phút hoặc ý còn mơ hồ)
Trình bày bảng ngắn: Cảnh | Bối cảnh | Diễn biến & lời thoại | Cỡ cảnh/góc máy | Âm thanh. Mỗi cảnh mở bằng toàn cảnh, đối thoại dựng shot – reverse shot, góc máy đổi có lí do (xem ngữ pháp máy quay). Phim dạy học bám thêm `kich-ban.md` (một ý chính, tình huống, hiểu lầm để sửa, quiz, câu chốt); kiến thức đúng SGK Kết nối tri thức, mọi phép tính và đồ thị tự kiểm lại. Phim lịch sử/danh nhân chỉ dùng sự kiện đã kiểm chứng.

### 3. Viết `ten-phim.film.js`
- Khai báo `cast` bằng `role` đúng thể loại (rồi chỉnh màu/phụ kiện), mỗi nhân vật một giọng → `scenes` (`bg`, `trans`, `cam` đầu cảnh) → `beats`.
- Máy quay: dùng `cam` với `shot`/`on`/`angle`/`follow`/`whip`/`letterbox` để có nhịp điện ảnh; cảnh giảng bài giữ máy ổn định.
- Toán học động: phông `manim`/`manimgrid`, đối tượng `axes`/`graph`/`dot`/`poly` + `anim` (create, write, transform, indicate, circumscribe, along…) — tiếng hiệu ứng tự gắn.
- Âm thanh: mỗi hành động một tiếng đúng khoảnh khắc (`sfx` với `at`); `FILM.music` chọn nhạc nền theo thể loại.
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

### 5. Xuất MP4 (luôn làm — đây là sản phẩm)
```bash
python3 <skill>/scripts/export_mp4.py ten-phim.html ten-phim.mp4 --music            # tự chọn: Microsoft HoaiMy/NamMinh (edge-tts) → Piper offline → không lời
python3 <skill>/scripts/export_mp4.py ten-phim.html ten-phim.mp4 --tts piper --music # giọng Việt OFFLINE (pip install piper-tts; lần đầu tự tải mô hình 63 MB từ Hugging Face)
python3 <skill>/scripts/export_mp4.py ten-phim.html --list                           # in mã từng câu để thầy tự ghi âm
python3 <skill>/scripts/export_mp4.py ten-phim.html ten-phim.mp4 --voice-dir ghi-am/ # dùng giọng thật của thầy (s1b1.mp3…)
```
Thời lượng cảnh tự giãn theo độ dài file âm thanh thật; miệng nhân vật khớp âm lượng từng câu. Thứ tự chất lượng giọng: ghi âm thật của thầy (`--voice-dir`) > Microsoft HoaiMy/NamMinh (edge-tts, cần mạng tới speech.platform.bing.com) > Piper offline (một giọng nữ; giọng nam/trẻ em được hạ/nâng cao độ nên kém tự nhiên hơn). Script báo rõ đã dùng giọng nào — nói thật với thầy. Nếu không có giọng nào, phim xuất không lời; gợi ý bấm ⏺ Quay trong file HTML (ghi được giọng đọc của Edge). `--size 1280x720` xuất nhanh hơn. Xem lại vài khung hình của MP4 trước khi giao.

### 6. Bàn giao
Gửi file MP4 (tên không dấu); kèm file `.film.js` để sửa lời về sau. Trước khi gửi, trích vài khung hình từ chính file MP4 (ffmpeg) để soát lần cuối. Trả lời ngắn: số cảnh, thời lượng, các điểm sư phạm chính, cách sửa lời (mở file `.film.js`, sửa `say`, chạy lại build), cách quay/xuất video. Đề xuất 1–2 cải tiến thiết thực (phim tiếp theo trong chuỗi, phiếu học tập đi kèm…).

## Mở rộng engine
Cần tư thế/đạo cụ/vai/phông nền mới: thêm vào `POSES`, `PROPS`, `ROLES` (+ `drawHeadwearFront`), `BGL` (phông nhiều lớp `far/mid/main/fg`) trong `scripts/engine.js` (theo mẫu có sẵn, vẽ bằng `hline`/`hcircle`/`hrect` để giữ nét vẽ tay), chạy `node --check`, build lại phim mẫu và `check_film.py` để chắc không hỏng gì, rồi cập nhật bảng trong `references/film-api.md`.
