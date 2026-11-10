---
name: game-luyen-tap-on-tap-toan
description: "Tạo game học tập HTML hấp dẫn để học sinh trả lời câu hỏi trong tiết LUYỆN TẬP và ÔN TẬP môn Toán THCS (lớp 6–9, SGK Kết nối tri thức): 3 chế độ Ô số may mắn, Đua về đích, Vượt ải cả lớp; chơi theo đội, điểm theo mức độ Dễ–Vừa–Khó, đồng hồ, gợi ý, giành quyền trả lời, lời giải từng bước, bảng vàng. Dùng khi thầy Chung cần trò chơi trả lời câu hỏi, game củng cố, game luyện tập chung, game ôn tập chương/giữa kì/cuối kì, hoặc gửi đề/bài tập và muốn biến thành game."
---

# Game luyện tập – ôn tập Toán THCS

Mục tiêu: từ một bài/chủ đề (hoặc đề, ảnh bài tập thầy gửi), tạo **một file HTML duy nhất** dùng ngay trên máy chiếu, màn hình tương tác: học sinh chơi theo đội, trả lời câu hỏi, giáo viên điều khiển và chấm nhanh.

Mẫu dựng sẵn, đã kiểm thử: `assets/game-template.html`. **Luôn bắt đầu từ mẫu này**, chỉ thay phần `CONFIG` và `QUESTIONS` ở đầu file (khối "PHẦN THẦY SỬA"). Không viết lại engine trừ khi thầy yêu cầu tính năng mới.

## 1. Thu thập đầu vào (hỏi tối đa 1 lần, thiếu thì tự chọn hợp lí)
- Lớp, bài/chương (tra `kien-thuc-sgk-toan-thcs-kntt` nếu có để đúng tên bài, đúng phạm vi kiến thức).
- Loại tiết: **luyện tập** (bám 1–2 bài) hay **ôn tập** (chương, giữa kì, cuối kì).
- Số câu (mặc định 16), số đội (mặc định 4 tổ), thời lượng hoạt động (mặc định 15–20 phút).
- Nếu thầy gửi ảnh/PDF đề: đọc chính xác đề trước (`doc-de-toan-tu-anh`), giữ nguyên số liệu.
- Thầy không nói rõ thì làm luôn với mặc định, cuối câu trả lời nêu các giả định.

## 2. Thiết kế bộ câu hỏi
Đọc `references/thiet-ke-cau-hoi.md` trước khi soạn. Tóm tắt:
- Tỉ lệ mức độ: luyện tập ≈ 30% Dễ – 45% Vừa – 25% Khó; ôn tập ≈ 30% – 40% – 30%, phủ đủ các bài trong chương.
- Trộn dạng câu: `mcq` (trắc nghiệm 4 phương án), `tf` (Đúng/Sai), `num` (điền đáp số), `open` (trình bày miệng/bảng con). Câu `num` phải có **một đáp số duy nhất** dễ nhập.
- Phương án nhiễu lấy từ **lỗi sai thường gặp** của học sinh (quên hạng tử 2ab, sai dấu, nhầm công thức...), không bịa phương án vô lí.
- Mỗi câu có `solution` 1–3 bước ngắn; câu Vừa/Khó có `hint`.
- Kiến thức đúng phạm vi SGK lớp đó; kí hiệu chuẩn, góc có dấu mũ `\widehat{ABC}`; không dùng dấu ⇔ trong lời giải.
- Câu hình học cần hình: ưu tiên câu không cần hình; nếu cần, nhúng SVG nhỏ vào chuỗi `q` (vẽ chính xác theo `ve-hinh-hoc-chuan`).

## 3. Điền vào mẫu
1. Copy `assets/game-template.html` thành file mới, tên gợi nhớ: `game-<lop>-<chu-de>.html` (không dấu).
2. Sửa `CONFIG`: `title` (ngắn, hấp dẫn, VIẾT HOA, ví dụ "ĐẤU TRƯỜNG PHƯƠNG TRÌNH"), `subtitle` ("Toán 9 – Ôn tập chương II: ..."), `hiddenText` (công thức/thông điệp trọng tâm của bài, mở ra khi hết ô), `defaultTeams`, `stars`/`gifts` (khoảng 1/8 số câu mỗi loại).
3. Thay `QUESTIONS` theo đúng định dạng ghi chú trong file. Viết LaTeX trong `R\`...\`` để chỉ gõ một dấu `\`.
4. Giữ nguyên engine; chỉnh `points`, `time` nếu thầy muốn.

Ba chế độ có sẵn (giáo viên chọn ở màn hình đầu):
| Chế độ | Cách chơi | Hợp với |
|---|---|---|
| 🎁 Ô số may mắn | Các đội lần lượt chọn ô; có ô ⭐ nhân đôi/trừ điểm, 🎁 tặng điểm; sai thì đội khác giành quyền (50% điểm); mở hết ô hiện thông điệp ẩn | Luyện tập, 12–25 câu |
| 🏁 Đua về đích | Đến lượt, đội tự chọn Dễ/Vừa/Khó; điểm đẩy nhân vật về đích (đích tự tính theo số câu, số đội) | Luyện tập phân hóa, rèn chiến thuật |
| ⛰️ Vượt ải cả lớp | Mọi đội cùng làm 1 câu trên bảng con, qua 3 ải Khởi động – Tăng tốc – Về đích; GV tích các đội đúng | Ôn tập chương/kì, lớp đông |

Tính năng chung: đồng hồ vòng tròn có tiếng tích tắc 5 giây cuối, tạm dừng, gợi ý (giảm điểm), hiện đáp án, lời giải từng bước, cộng/trừ điểm tay, âm thanh Web Audio + nút tắt tiếng, pháo giấy, bảng vàng bục 1–2–3, toàn màn hình, phím tắt (Space, 1–4, P, F, M, Esc). Có KaTeX qua CDN, **mất mạng vẫn hiển thị công thức** nhờ bộ hiển thị dự phòng.

## 3b. Mẫu game hành động "Cánh chim qua cổng" (`assets/game-chim-bay-template.html`)
Dùng khi thầy muốn game kiểu game điện tử hiện nay, học sinh **trực tiếp điều khiển nhân vật**: chim bay qua 5 cổng (hoặc nhiều hơn), mỗi cổng 1 câu, 3 cửa A–B–C, bay vào cửa đúng. Màn hình cố định 1920×1080 tự co giãn như trình chiếu PowerPoint; trang câu hỏi, trang kết quả, lời giải đều cỡ chữ 90–130 px.
- Chỉ sửa `GAME`, ngân hàng `BANK` (mặc định 20 câu; đúng 3 phương án, **phương án đầu là đáp án đúng**, máy tự xáo A–B–C; `solution` 1–2 dòng ngắn; `speak` đọc đề tiếng Việt), `PER_ROUND` (số câu mỗi lượt, mặc định 3) và `DOORS` (độ khó cửa theo thứ tự cổng). Mỗi lượt bốc câu chưa chơi, hết ngân hàng mới lặp lại (nhớ qua localStorage). Có slide Luật chơi hiện trước lượt đầu.
- Luật chơi: đâm cột, rơi xuống đất hoặc bay vào cửa sai là **chim rơi** (mất mạng; mặc định 1 mạng, chọn 3/5 ở màn hình đầu). Rơi đất/đâm cột thì bay lại cổng đó; vào cửa sai thì hiện đáp án, lời giải rồi sang cổng sau.
- Độ khó cửa trong `DOORS`: `gap` (rộng 220 – vừa 180 – hẹp 150), `breathe:[max,min]` cửa co giãn, `move` cửa trượt lên xuống. Tăng dần độ khó qua các cổng; **không cho cửa hẹp dưới 140 px** (chim nảy ~82 px mỗi lần vỗ cánh, hitbox cao 48 px).
- Phương án phải ngắn (≤ 14 kí tự) để vừa biển cửa ở cỡ 88 px; lời giải mỗi dòng ≤ 32 kí tự.
- Công thức hiển thị bằng bộ dựng sẵn trong file (không cần mạng): chỉ dùng `^`, `_`, `\cdot`, `\times`, `\le`, `\ge`, `\ne`, `\pm`, ngoặc, chữ, số.
- Kiểm thử: lái chim tự động bằng Playwright, bot chạy trong trang: `if (bird.y > openings(gate.t+0.15)[answer].mid + 38 && bird.vy > 0) flap()`; phải qua đủ các cổng ở tốc độ Nhanh, và thử đủ 3 kiểu thua, chụp trang câu hỏi, màn bay, kết quả, kết thúc; đo phần tử không vượt 0–1080 px.

## 4. Kiểm tra bắt buộc trước khi giao
1. **Toán**: giải lại từng câu; câu có tính toán kiểm bằng Python (`python3 -c ...`). Kiểm `answer` của `mcq` đúng chỉ số (0=A), `tf` đúng true/false, phương án nhiễu không trùng đáp án đúng.
2. **Cú pháp**: mở bằng Playwright (Chromium đã cài sẵn), bắt `pageerror`; chạy hết 3 chế độ: mở ô, trả lời đúng/sai, giành quyền, lời giải, kết thúc ra bảng vàng. Mẫu kịch bản: `references/kiem-thu-playwright.cjs` (chạy `node references/kiem-thu-playwright.cjs <đường-dẫn-file.html>`).
3. **Hiển thị**: chụp màn hình 1600×900 và 390×800, xem câu dài nhất, phương án dài nhất không tràn khung; công thức hiển thị đúng (khi không có mạng, công thức dùng lệnh trong danh sách hỗ trợ ở `references/thiet-ke-cau-hoi.md`).
4. Sửa hết lỗi rồi mới giao.

## 5. Bàn giao
- Giao file HTML (đặt trong thư mục làm việc để thầy mở được), kèm 4–6 dòng: tên bài, số câu theo mức độ, chế độ gợi ý dùng, cách sửa câu hỏi (mở file bằng Notepad, sửa khối "PHẦN THẦY SỬA").
- Đề xuất ngắn 1–2 cải tiến (ví dụ: thêm câu hình có hình vẽ, bản dành cho học sinh yếu).
- Xưng "em", gọi "Thầy Chung", trả lời ngắn gọn.
