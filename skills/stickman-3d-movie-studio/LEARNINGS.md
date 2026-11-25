# Nhật kí tự nâng cấp (ghi sau mỗi dự án — không xoá mục cũ)

## 2026-11-24 — Phim mẫu "Đường tròn – bán kính, đường kính"
- Lỗi: góc `board_three_quarter` đặt máy nhầm phía (dấu phương vị ngược) → người che đường tròn. Sửa: az = +42 (phía tay vẽ). Bài học: máy luôn đặt phía tay đang thao tác.
- Lỗi: compa "bay" khỏi tay khi nhấc khỏi bảng vì lớp với-tay kết thúc trước khi nhấc. Sửa: giữ tay ở tay cầm thêm 0,5 s sau khi vẽ (`draw_circle`).
- Lỗi: trung cảnh/cận cắt đầu (preset quá sát). Sửa: medium dist 3,0 m, close_up 1,7 m/60 mm.
- Lỗi: bụi nắng quá to khi sát máy. Sửa: hạt 1,6 mm, vùng phát đặt sát cửa sổ.
- Hiệu năng: 9 đèn có bóng → 8 s/khung; giảm còn nắng + đèn bảng có bóng, đèn trần không bóng → 1,1 s/khung (draft).
- Đo trượt chân: 205 mm → 24 mm sau khi đánh dấu đúng pha khép chân không phải pha chống.
- Việc tiếp theo: thêm bối cảnh (sân trường, phòng thí nghiệm, ngoài trời), nạp BVH mocap, ngón tay, ánh sáng nướng (light probe) khi có GPU.

## 2026-11-25 — Bản Thầy Chung (render chính thức)
- Thầy yêu cầu nhân vật giáo viên là **Thầy Chung** (nam, giọng VieNeu "Thiện Minh"); áo trắng lẫn với đầu trắng → dùng áo xanh nhạt #90caf9.
- Phụ đề 3D cỡ 0,058·H còn nhỏ so với yêu cầu "chữ lớn" → tăng 0,075·H (≈ 81 px ở 1080p).
- Máy khởi động lại giữa lúc render: `studio.py` bỏ qua khung đã có → chạy lại lệnh là làm tiếp; xoá khung cuối (có thể ghi dở) trước khi chạy tiếp. Đã so khung nối 246/247: không giật.
- Gọng kính mảnh khó thấy → gọng 0,031/0,0065 m.
- Tốc độ thực tế (4 CPU, không GPU, chất lượng cpu 720p + motion blur + SSR): 5,1 s/khung → phim 30 s mất ~78 phút.
- Còn cần cải thiện: góc `insert_hand` cắt mất đầu khi nhân vật cúi; trượt chân 24 mm (mục tiêu < 10 mm).

## 2026-11-26 — "Phi vụ giải cứu bánh tráng trứng" (5 phút, 3D + Toán 2D)
- Phim dài: truyện 3D render Blender, đoạn giảng Toán (nhìn từ trên xuống, 60 % chữ / 40 % hình) dựng bằng engine 2D kiểu Manim → ghép xen kẽ theo mốc `mark`. Rẻ hơn nhiều so với dựng công thức trong 3D, chữ nét, lớn.
- Lỗi: nhân vật đứng trước máy che mọi góc cận đạo cụ (khung trắng/hồng mờ = máy quay nằm trong người). Sửa: đặt nhân vật lệch sang một bên, máy cận đặt phía đối diện (az 45–60); quét 1 khung giữa MỖI shot trước khi render.
- Lỗi: `close_up` az 0 khi nhân vật quay mặt vào quầy → máy nằm sau quầy. Chỉ dùng cận chính diện sau `turn face camera`.
- Lỗi: kính nắp + AgX làm đồ ăn nhạt màu. Sửa: kính alpha 0,035, view "Standard" + exposure −1.
- Lỗi: object ẩn (hide_viewport) không được đánh giá trong depsgraph → in matrix_world ra 0 khi debug; render vẫn đúng.
- Khoá `offset` dùng cho thời gian song song — tham số đạo cụ phải đặt tên khác (`head_offset`).
- An toàn: không `rm -rf` thư mục khung hình để render lại — tạo thư mục out mới và chép `voice/` sang (cache giọng).
