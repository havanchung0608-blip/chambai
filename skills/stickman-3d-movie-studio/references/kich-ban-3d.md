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
