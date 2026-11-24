# Nhật kí tự nâng cấp (ghi sau mỗi dự án — không xoá mục cũ)

## 2026-11-24 — Phim mẫu "Đường tròn – bán kính, đường kính"
- Lỗi: góc `board_three_quarter` đặt máy nhầm phía (dấu phương vị ngược) → người che đường tròn. Sửa: az = +42 (phía tay vẽ). Bài học: máy luôn đặt phía tay đang thao tác.
- Lỗi: compa "bay" khỏi tay khi nhấc khỏi bảng vì lớp với-tay kết thúc trước khi nhấc. Sửa: giữ tay ở tay cầm thêm 0,5 s sau khi vẽ (`draw_circle`).
- Lỗi: trung cảnh/cận cắt đầu (preset quá sát). Sửa: medium dist 3,0 m, close_up 1,7 m/60 mm.
- Lỗi: bụi nắng quá to khi sát máy. Sửa: hạt 1,6 mm, vùng phát đặt sát cửa sổ.
- Hiệu năng: 9 đèn có bóng → 8 s/khung; giảm còn nắng + đèn bảng có bóng, đèn trần không bóng → 1,1 s/khung (draft).
- Đo trượt chân: 205 mm → 24 mm sau khi đánh dấu đúng pha khép chân không phải pha chống.
- Việc tiếp theo: thêm bối cảnh (sân trường, phòng thí nghiệm, ngoài trời), nạp BVH mocap, ngón tay, ánh sáng nướng (light probe) khi có GPU.
