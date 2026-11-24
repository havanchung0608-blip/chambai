# Kĩ thuật hoạt hình & điện ảnh đã cài trong mã (và nguồn tham khảo)

## 12 nguyên tắc hoạt hình → chỗ thực hiện trong code
| Nguyên tắc | Thực hiện | Tệp |
|---|---|---|
| Squash & stretch (co – duỗi) | xương hông co khi nhún/tiếp đất, duỗi khi bật lên (giữ thể tích: sx = 1/√sy) | `sm_anim.Actor.jump`, `bake_actor` |
| Anticipation (lấy đà) | nhún trước khi nhảy; hơi nhổm người trước khi cúi với tay | `jump`, `reach(anticip=True)` |
| Staging (dàn cảnh) | preset máy theo bố cục 1/3, đặt máy phía tay vẽ để không che hình | `sm_cine.SHOTS` |
| Straight ahead / pose to pose | chuyển động tính theo từng khung (straight ahead) + cử chỉ từ "tư thế" thư viện (pose to pose) | `solve()`, `gestures.json` |
| Follow through & overlapping | đầu trễ nhịp (lọc thông thấp), vai xoay ngược hông, tay vung trễ chân | `solve()` |
| Slow in / slow out | ease-in-out, vận tốc hình thang khi đi, đường cong máy quay | `trap`, `ease_io` |
| Arcs (quỹ đạo cung) | chân vung theo cung nâng sin, tay vung theo cung quanh vai (IK) | `walk` |
| Secondary action | thở, dồn trọng tâm, chớp mắt ngẫu nhiên, cử chỉ khi nói, gật đầu theo âm lượng | `solve()` |
| Timing | thời lượng bước theo kiểu dáng (walk 0,52 s, run 0,34 s…), lời thoại quyết định độ dài cảnh | `GAITS`, `studio.py` |
| Exaggeration | biên độ cử chỉ (`amp`), biểu cảm shape key 0–1 | `gesture` |
| Solid drawing | nhân vật 3D thật, viền hoạt hình (inverted hull), ánh sáng ba điểm | `sm_rig`, `sm_cine.light_*` |
| Appeal | đầu tròn mắt có điểm sáng, má/miệng cười, màu áo theo vai | `build_face`, `presets.json` |

## Chuyển động
- **IK hai xương** của Blender cho chân/tay + điểm cực (pole) → gối gập trước, khuỷu gập sau. FK: đặt influence của ràng buộc "IK" = 0 rồi key xoay xương.
- **Đặt chân thủ tục (procedural foot planting)**: vị trí đặt chân tính trước theo đường đi; pha chống giữ cố định → không trượt (QA đo độ trượt). Ý tưởng giống các hệ "foot placement" trong game: đặt chân theo sự kiện chạm đất, trộn lớp IK với chuyển động gốc.
- **Trộn động tác (blending)**: mỗi lớp có trọng số vào/ra (smoothstep) cộng dồn lên tư thế gốc.
- **Khẩu hình (lip sync)**: độ mở miệng = âm lượng RMS của giọng thật theo từng khung + biến thể "O".
- **Đạo cụ tương tác**: đạo cụ bám tay bằng ma trận tương đối tại khoảnh khắc nắm; khi đặt lên bảng trộn dần sang vị trí đích; khi vẽ, tay bám tay cầm compa (ngược chiều).
- **Vật lí/hạt**: bụi nắng (Brownian), bụi phấn, mưa (particle) — `sm_env`.
- **Motion capture**: chưa có dữ liệu mocap; kiến trúc cho phép thêm sau (nạp BVH vào xương FK). Ghi rõ là việc cần làm, không phải đã có.

## Máy quay & ánh sáng
EEVEE (Blender 4.0): bóng mềm, che khuất môi trường (AO), phản chiếu màn hình (SSR) cho sàn gỗ, bloom nhẹ, nhoè chuyển động (motion blur), chiều sâu trường ảnh (DOF lấy nét theo chủ thể), màu AgX. Ánh sáng lớp học: nắng xiên qua cửa sổ (key ấm), đèn trần dịu (fill), đèn rọi bảng, đèn viền.

## Hiệu năng (máy không GPU, 4 CPU)
EEVEE chạy qua OpenGL phần mềm (xvfb + Mesa): draft 960×540 ≈ 1–2 s/khung; cpu 1280×720 + motion blur ≈ 3–6 s/khung. Có GPU: dùng `--quality hd` (1080p gốc) hoặc `4k`.

## Nguồn tham khảo
- BlenderMCP (điều khiển Blender từ Claude qua MCP): https://github.com/ahujasid/blender-mcp — skill này chạy Blender trực tiếp bằng dòng lệnh nên không bắt buộc MCP; trên máy thầy có thể cài thêm để xem/chỉnh cảnh tương tác.
- Đặt chân thủ tục & IK: Vulkan tutorial "Procedural Animation & IK / Foot placement" https://docs.vulkan.org/tutorial/latest/Advanced_glTF/Procedural_Animation_IK/04_foot_placement.html ; Meta "Character animation in Dead and Buried" https://developers.meta.com/horizon/blog/developer-perspectives-character-animation-in-dead-and-buried/
- VieNeu-TTS: https://github.com/pnnbao97/VieNeu-TTS (giọng Việt offline, nhân bản giọng 3–5 s).
- TiengDong.com (tiếng động/nhạc miễn phí, đề nghị ghi nguồn): https://tiengdong.com/
