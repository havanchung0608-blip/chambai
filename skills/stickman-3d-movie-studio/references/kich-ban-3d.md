# Viết kịch bản `film.json` cho Stickman 3D Studio

Mục lục: 1. Khung chung · 2. Nhân vật · 3. Hành động · 4. Bảng phấn · 5. Máy quay · 6. Âm thanh · 7. Toạ độ lớp học

## 1. Khung chung
`title`, `file` (không dấu), `fps` (30/60), `environment` (`classroom` | `studio`), `music` (`story` | `intro` | `tension` — bộ TiengDong), `music_vol` (0.05–0.1), `characters`, `props`, `actions`.
Hành động chạy **tuần tự**. Song song: `"with": true` (+ `"offset"` giây so với hành động liền trước); `"extend": false` = không đẩy mạch chính lùi lại (dùng cho lời thoại/nét vẽ chạy kèm). `"delay"` = chờ thêm trước hành động; `"gap"` = nghỉ sau (mặc định 0,15 s); `"time"` = giây tuyệt đối.

## 2. Nhân vật
`{"name", "voice" (tên giọng VieNeu), "ref_audio" (file 3–5 s để nhân bản giọng), "start" ([x,y] hoặc anchor), "heading" (rad, 0 = nhìn về phía máy/−Y), "spec"}`
`spec`: `shirt`, `pants`, `limbs`, `skin`, `shoes`, `hair` (`short|long|ponytail|bun|none`), `hair_color`, `skirt`, `glasses`, `scale` (học sinh 0,8), `outline` (viền hoạt hình), `long_sleeves`.
Mẫu sẵn: `characters/presets.json`. Từ ảnh: `characters/from_image.py`.

## 3. Hành động (`do`)
| do | Tham số | Ghi chú |
|---|---|---|
| `walk` | `to` (danh sách điểm), `gait` (`walk|slow|run|sneak|march|back`), `face` (`camera|board|[x,y]|rad`), `speed` | đặt chân bám sàn, tự quay người theo hướng đi, khép chân khi dừng |
| `turn` | `face`, `dur` | quay tại chỗ có bước chân |
| `jump` | `to`, `height` | lấy đà, bay, tiếp đất khuỵu gối, tiếng nhảy/tiếp đất |
| `gesture` | `name` (xem `animations/gestures.json`), `dur`, `hands` (`["L"]`/`["R"]` giới hạn tay) | trộn mượt với động tác khác |
| `say` | `text` (công thức trong `$..$`), `speak` (ghi đè lời đọc), `emotion` ({shape key: giá trị}), `gesture`, `hands`, `gesture_auto` | thời lượng = độ dài giọng thật; khẩu hình theo âm lượng |
| `look` | `at` (`camera|board|[x,y,z]`), `dur` | xoay cổ + đầu |
| `emote` | `keys` ({`smile`, `frown`, `brow_up`, `brow_angry`, `brow_sad`, `mouth_O`, `look_L`…}), `dur` | |
| `pick` | `prop`, `hand`, `hold_for` (giây giữ tư thế cầm), `crouch`, `lean` | với tay có lấy đà, đồ vật bám tay từ khoảnh khắc nắm |
| `place_on_board` | `prop` (compa), `center` [u,v], `theta0`, `dur` | đưa compa tới bảng, mũi kim đặt đúng tâm |
| `draw_circle` | `prop`, `dur` | compa quay quanh tâm, nét phấn chạy đúng đầu phấn, tay bám tay cầm |
| `lift_from_board` | `prop` | compa trở lại bám tay |
| `put_down` | `prop`, `at` [x,y,z], `yaw` | đặt đồ xuống |
| `board_line` | `from`, `to` [u,v], `dur`, `color`, `width` | nét phấn chạy dần (kiểu Manim) |
| `board_circle` | `center`, `r`, `dur` | vẽ tròn không cần compa |
| `board_label` | `text`, `at`, `size` (m, ≥ 0,12), `bold`, `color`, `sfx` | chữ nảy ra + tiếng phấn |
| `sfx` | `name`, `vol`, `len` | tiếng động rời |
| `wait` | `dur` | |

## 4. Bảng phấn
Toạ độ `[u, v]` (mét) tính từ tâm bảng: u sang phải (−2,1…2,1), v lên trên (−0,67…0,67). Chữ ≥ 0,12 m; công thức chính 0,18–0,24 m.

## 5. Máy quay (`cam`)
`"cam": "medium"` hoặc `{"preset": ..., "subject": "co" | "board" | ["a","b"], "offset": giây, ...ghi đè dist/h/az/lens/fstop}`. 33 preset trong `scripts/blender/sm_cine.py` (`SHOTS`) — xem `cameras/shots.md`. Shot kéo dài tới shot kế tiếp (cắt cảnh).

## 6. Âm thanh
Tự sinh: bước chân, nhảy/tiếp đất, cầm đồ, chạm bảng, phấn cào (khi vẽ), viết chữ, không khí phòng, nhạc nền giảm khi có lời. Thêm: hành động `sfx` hoặc `"sfx"` trong `board_label` (`ding`, `pop`, `shimmer`, `whoosh`, các tên trong bộ TiengDong: `surprise`, `wow`, `laugh`, `magic`…).

## 7. Toạ độ lớp học (`classroom`)
Sàn z = 0; bảng trên tường sau y ≈ 3,12, tâm bảng x = −0,3, z = 1,65; cửa ra vào phải (anchor `door_out` (6.4, 1.5), `door_in`); bàn GV tâm (2.75, 1.35), mặt bàn z = 0,785; vùng đứng trước bảng y ≈ 2,0–2,4; dãy bàn HS y = −0,9 / −2,6 / −4,3 (x = −2,6 / −0,3 / 2,0) — đi giữa các dãy ở x ≈ −1,45 hoặc 0,85. Máy quay tự giới hạn trong phòng.
Đứng vẽ compa: đứng cách tâm hình ~0,25 m về phía TAY KHÔNG vẽ, y ≈ 2,35, quay mặt vào bảng; máy đặt phía tay vẽ (`board_three_quarter`) để người không che hình.


## 8. Bối cảnh CĂN TIN (`"environment": "canteen"`) và đạo cụ diễn hoạt
Toạ độ: sàn z = 0; quầy x −2,2…2,2, y 1,0…1,7, mặt quầy z = 0,95; tâm bánh trên vỉ máy (−0,40; 1,33; 1,145), R = 10 cm.
Đạo cụ dựng sẵn (`sm_canteen.py`): máy nướng (`lid` bản lề nắp kính, `pin55…pin59` + `_g` bản xanh, `btn_crisp`, `btn_lid`, `msg_*` màn hình, `m_drop_mesh`, `m_drop2`),
bánh (`banh` gốc; lớp `banh_base`, `egg_ring`, `egg_full`, `sauce_q` hình quạt 90°, `radius_wire`, `short_wire`, `weld_arc` cung AB, `foot_i_s` dấu chân, `slice`/`rest_root` khi cắt miếng),
Gián Điện (`gian`, chân `gian_leg{i}{±1}`, `bell`, `gian_beam`), `wire_reel`, `ria`, `basin`, `sauce_puddle`, `cheese_ring`, `co_box`.
Vai chỉ có giọng (máy, bản đồ…): `"spec": {"hidden": true}`, đặt `start` xa (0, 40). Nhân vật thêm `scarf` (khăn quàng), `apron` (tạp dề); `speed`, `pitch` (bán cung) cho giọng.

| do | Tham số | Ghi chú |
|---|---|---|
| `anim` | `target` (tên hoặc danh sách), `keys` [{`t`, `loc`, `rot` (độ), `scale`, `show`, `reveal` (0–1, nét curve)}], `ease`, `sfx_at` [[tên, giây]] | keyframe đạo cụ; trạng thái trước lần đổi đầu tiên được giữ nguyên |
| `screen` | `msg` (`idle`, `forever`, `p55`…`p59`, `count3`…) | đổi chữ màn hình máy + tiếng bíp |
| `pin` | `n` (55–59), `state` (`lock`/`open`) | chốt đỏ sập "cạch" / bật xanh + bíp |
| `reach` | `who`, `at` [x,y,z], `dur`, `hand`, `tap` | với tay bấm nút, lau bánh, nhấc bánh |
| `knock` | `who`, `count`, `period` | đầu gối gõ "cộc cộc" (nhún + tiếng gỗ) |
| `gian_walk` | `path` [[x,y,z]…], `dur`, `ease`, `face_end` | robot gián 6 chân bò theo đường gấp khúc, chân đánh nhịp, tiếng bước kim loại |
| `gian_point` | `up`, `aim` | sáu chân cùng giơ lên chỉ |
| `bell` | | chuông xe đạp "kính coong" trên lưng gián |
| `attach` | `who`, `target`, `head_offset` [ngang, trước, lên] (đơn vị bán kính đầu) | gắn đồ lên đầu (bộ ria bằng dây) |
| (mọi action) | `mark` | mốc cắt đoạn khi ghép xen với phần Toán 2D |

Tiếng động tổng hợp mới: `knock`, `bike_bell`, `beep`, `beep2`, `sizzle`, `latch`, `unlatch`, `metalstep`, `slam`, `spray`, `pluck`, `splash`, `plop`, `eat`, `boing`.
Chất lượng `cpu_fast`: 1280×720, không motion blur/SSR (~2,4 s/khung trên 4 CPU) — dùng cho phim dài.
Ví dụ đầy đủ: `examples/banh-trang-trung/` (make_film3d.py → film3d.json; toan2d.film.js cho phần Toán; assemble.py ghép).
