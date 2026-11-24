# Kiểm tra từng cảnh trước khi render chính thức
1. `studio.py make film.json --out OUT --quality draft --frames 1-2` (dựng cảnh, chưa render nhiều).
2. Render một khung giữa mỗi shot (lấy từ `timeline.json` → `shots`):
   `xvfb-run -a blender -b OUT/<file>.blend --python-expr "import bpy;sc=bpy.context.scene;[ (sc.frame_set(f), setattr(sc.render,'filepath',f'OUT/p_{f}.png'), bpy.ops.render.render(write_still=True)) for f in (60,140,250)]"`
3. Nhìn ảnh, sửa: cắt đầu → tăng `dist`/giảm `lens`; người che hình → đổi `az` sang phía tay vẽ; đạo cụ lệch tay → kéo dài `reach`/`hold`; chữ nhỏ → tăng `size`.
4. Ngưỡng tự động (qa_report.md): trượt chân < 30 mm, xuyên sàn < 5 mm, đủ khung, không khung đen, có SRT, có .blend.
