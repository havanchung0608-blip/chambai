# Định dạng kịch bản `window.FILM` (tra cứu đầy đủ)

Máy quay, vai diễn, phông nhiều lớp, Manim, chuyển cảnh, nhạc nền: xem `the-loai-va-may-quay.md`.

Mục lục: 1. Khung tổng · 2. Nhân vật · 3. Cảnh · 4. Nhịp (beat) · 5. Tư thế · 6. Nét mặt · 7. Đạo cụ · 8. Phông nền · 9. Chữ & công thức · 10. Âm thanh · 11. Mẹo bố cục

Khung hình cố định **1920×1080**. Mặt đất ở `y = 960`. Toạ độ x của nhân vật là điểm giữa hai chân.

## 1. Khung tổng
```js
window.FILM = {
  title: "Tên phim", subtitle: "Bài … · Toán 7", file: "ten-khong-dau",
  watermark: "Thầy Hà Văn Chung",   // góc phải trên, bỏ đi nếu không cần
  music: "story",                   // nhạc nền: "story" | "intro" | "tension" (TiengDong) hoặc true (tổng hợp); tự nhỏ khi có lời
  letterbox: false, handheld: 0,     // khung điện ảnh / máy cầm tay cho cả phim; vignette: false để tắt viền tối
  narrator: { voice: "nu" },        // người dẫn chuyện (không hiện hình)
  cast: { ... },                    // khai báo nhân vật dùng chung cả phim
  scenes: [ ... ]
};
```

## 2. Nhân vật (`cast`)
```js
co:  { name: "Cô Mai", voice: "nu", hair: "long", shirt: "#e57373", skirt: true, glasses: true },
an:  { name: "An", voice: "tre", scale: 0.78, hair: "spiky", shirt: "#42a5f5", hat: "cap" },
ong: { name: "Ông", voice: "nam", hair: "short", hairColor: "#9e9e9e", beard: true, rate: 0.9 }
```
| Thuộc tính | Giá trị |
|---|---|
| `voice` | `nu`, `nam`, `tre` (trẻ em: giọng cao) |
| `pitch`, `rate` | chỉnh riêng cao độ/tốc độ (≈0.8–1.5) |
| `scale` | 1 = người lớn; 0.75–0.8 = học sinh |
| `hair` | `short`, `long`, `ponytail`, `bun`, `spiky`, `none`; `hairColor` |
| `hat` | `cap`, `grad` (mũ tốt nghiệp), `hard` (mũ bảo hộ); `hatColor` |
| `shirt` (màu áo), `skirt: true`, `glasses: true`, `bow: "#màu"`, `beard: true`, `color` (màu nét), `skin` |
| `hold` | đồ cầm tay mặc định: `pointer`, `marker`, `chalk`, `book`, `phone`, `flag`, hoặc tên một đạo cụ (`apple`, `coin`…) |

## 3. Cảnh (`scenes[i]`)
```js
{ name: "Khởi động", bg: "park",
  cast: { an: { x: 600, pose: "idle", face: "happy", flip: false, hold: null } },  // ai có mặt + vị trí đầu cảnh
  items: [ { id: "ban", type: "table", x: 960, y: 960 } ],                         // đạo cụ có sẵn từ đầu cảnh
  beats: [ ... ] }
```
Mỗi cảnh bắt đầu lại từ đầu (bảng sạch, nhân vật về vị trí khai báo). `flip: true` = quay mặt sang trái.

## 4. Nhịp (`beats[j]`) — mọi trường trong một nhịp chạy ĐỒNG THỜI
Độ dài nhịp = hành động dài nhất (lời đọc, viết, đi…) + `gap` (mặc định 0,35 s).

| Trường | Ý nghĩa |
|---|---|
| `who`, `say` | ai nói + lời đọc (viết thành chữ, không kí hiệu). `who` bỏ trống = người dẫn chuyện |
| `sub` | phụ đề/bong bóng hiển thị (được dùng kí hiệu); mặc định = `say` |
| `bubble: false` / `true` | ép tắt / ép hiện bóng thoại (mặc định: có bảng → phụ đề; không bảng → bóng thoại) |
| `pose`, `face`, `flip`, `hold` | áp cho người đang nói (`who`) |
| `act: { an: {pose, face, flip, hold, x, exit, enter} }` | điều khiển nhân vật khác trong cùng nhịp |
| `move: { who, to, dur, style }` | đi tới x = `to` (`style`: `walk`, `run`, `jump`; `by` = dịch tương đối; `face: "left"/"right"` khi dừng; `height` cho jump) — mảng để nhiều người cùng đi. Tốc độ tự nhiên: đi bộ ≈ 230–300 px/giây (`dur` = quãng đường/260), chạy ≈ 450–600 px/giây, nhảy 1,2–1,6 s. Đi vào/ra khung: x = −160 hoặc 2080 |
| `write` | viết lên bảng: chuỗi, đối tượng `{text, size, color, x, y, align, box, dur}` hoặc mảng; tự xuống dòng theo bảng |
| `clear: "board"` / `"all"` | xoá chữ trên bảng / xoá cả đạo cụ |
| `show` | hiện đạo cụ (có `id` để điều khiển sau), nảy ra kèm tiếng pop (`sfx:false` để tắt) |
| `hide: "id"` | ẩn đạo cụ (mờ dần) |
| `set: {id, ...}` | đổi thuộc tính tức thì (vd. `taken: 2` tô màu phần bánh) |
| `tween: {id, x, y, scale, rot, alpha, tilt, grow, dur}` | đổi mượt thuộc tính số của đạo cụ hoặc nhân vật |
| `highlight: "id"` | vòng đỏ nhấp nháy quanh đạo cụ (dùng `hlR` trên đạo cụ để chỉnh bán kính) |
| `emote: { who, icon }` | biểu tượng trên đầu: `idea`, `question`, `heart`, `star`, `!`, `?`, `…` |
| `cam: { zoom, x, y, dur }` | máy quay phóng to/di chuyển tới tâm (x, y); `zoom: 1, x: 960, y: 540` để về như cũ |
| `title: { text, sub, dur, color }` | màn hình tiêu đề toàn khung |
| `quiz: { q, options:[…], answer, think }` | câu hỏi trắc nghiệm, đếm ngược `think` giây, rồi tô xanh đáp án (`answer` đếm từ 0) |
| `sfx: "ding"` hoặc mảng; `sfxAt` (giây) | hiệu ứng âm thanh |
| `wait` | giữ nhịp tối thiểu bao nhiêu giây (dùng cho chờ học sinh suy nghĩ) |
| `gap` | khoảng nghỉ sau nhịp (mặc định 0,35) |

## 5. Tư thế (`pose`)
`idle`, `wave` (vẫy chào), `point` (chỉ ngang về phía trước), `pointup` (giơ ngón tay "chú ý"), `explain` (tay đưa nhịp khi giảng), `think` (tay chống cằm), `ask` (dang tay hỏi), `cheer` (giơ hai tay mừng, nhún), `yes` (giơ nắm tay "yeah"), `write` (viết bảng), `sad`, `surprised`, `shrug` (nhún vai), `clap` (vỗ tay), `hold` (hai tay cầm đồ trước ngực), `give` (đưa đồ), `facepalm`, `angry`, `nod` (gật đầu), `sit`, `sitthink`, `sithand` (ngồi giơ tay phát biểu), `lie` (nằm), `jump`.
Khi nhân vật đang nói mà tư thế là `idle`, engine tự cho tay đưa nhịp nhẹ. Tư thế đổi được nội suy mượt 0,38 s. Ngồi (`sit…`) tự có ghế đẩu.

Chuyển động tự động (không cần khai báo): bàn chân bám đất khi đi/chạy, hông nhấp nhô, tay vung ngược chân, tăng – giảm tốc, bước khép chân khi dừng, quay người khi đổi hướng (`flip` hoặc `move` ngược chiều), nhún lấy đà và tiếp đất khi nhảy, đứng yên thì thở và dồn trọng tâm, đang nói thì tay đưa nhịp + gật đầu nhẹ, người nghe đưa mắt về phía người nói. Tiếng bước chân (`step`, `steprun`), `jump`, `land` tự sinh đúng thời điểm chân chạm đất.

### Cảnh hành động / võ thuật
Tư thế: `guard` (thủ thế, nhún), `punch` (đấm thẳng), `punch2` (đấm tay sau), `uppercut`, `kick` (đá ngang), `highkick`, `block` (đỡ), `hit` (trúng đòn bật ra sau), `hitlow` (trúng bụng gập người), `dizzy`, `bow`, `fistbow` (ôm quyền chào), `victory`, `kneel`. Nhân vật: `band` (màu băng đô), `belt` (đai), `fists: true` (vẽ nắm tay), `gloves`.
- `snap: 0.08–0.15` (trong `act` hoặc nhịp) = đổi tư thế cực nhanh cho đòn đánh; `delay` trong `act` = bắt đầu sau x giây trong nhịp (để phản ứng đúng lúc chạm).
- `move` thêm `style: "slide"` (bị đẩy lùi, không quay người, không bước) và `"flykick"` (tung cước bay).
- `fx: { type, on, part, dx, dy, at, dur, text, color }`: `type` = `hit` (chớp sáng va chạm), `dust` (bụi), `speed` (vệt tốc độ, `dir`), `text` (chỉ chữ); `on` = nhân vật, `part` = `head|chest|belly|legs`; `text` chữ kiểu truyện tranh "BỐP!".
- `shake: { amp, dur, at }` rung khung hình khi trúng đòn.
- `fx` `type: "aura"` (vận công: vòng khí lan + tia bốc lên, `color`) — dùng khi nhân vật tung chiêu/ra chưởng.
- "Chưởng công thức": `text` có `panel: true` hiện cạnh nhân vật rồi `anim` `move` bay tới đối thủ (thu nhỏ `scale`), cùng nhịp `hit` + `shake` (xem `examples/that-dang-than-cong.film.js`, hàm `duel`).
- `bubbles: false` (khung FILM): tắt bóng thoại cả phim, mọi lời nói xuống phụ đề lớn — hợp phim chiếu lớp có bảng công thức gắn màn hình.
- `sfx` dạng đối tượng `{ name, at, vol, len }` để canh tiếng đúng khoảnh khắc chạm (`len` cắt ngắn tiếng dài như `crowd`).
- Nhịp chuẩn một đòn: nhịp ra đòn (`snap` 0,1 + `swish`, `wait` 0,13–0,15, `gap: 0`) → nhịp trúng (`hit` + `fx` + `shake` + `punch`/`kickhit` + `slide`, `wait` 0,5–0,7). Xem `examples/vo-thuat-thu.film.js`.

## 6. Nét mặt (`face`)
`happy` (mặc định, má hồng), `neutral`, `sad`, `surprised`, `worried`, `angry`, `thinking`, `happyclosed` (cười híp mắt). Mắt tự chớp; miệng mấp máy khi nói.

## 7. Đạo cụ (`type`) — đều có `x, y, scale, rot, alpha, z`
| type | thuộc tính riêng | dùng cho |
|---|---|---|
| `text` | `text` (mini-TeX), `size`, `color`, `align` | chữ/công thức tự do |
| `card` | `text`, `w`, `h`, `size`, `color`, `border` | thẻ kiến thức có khung |
| `sign` | `text`, `w`, `h` | biển báo cắm cọc |
| `cake` (bánh tròn) | `slices`, `taken`, `r`, `color`, `highlight` | phân số, tỉ lệ |
| `bar` (thanh chia phần) | `parts`, `taken`, `w`, `h`, `highlight` | phân số, phần trăm |
| `numberline` | `from`, `to`, `step`, `w`, `points:[{v,label,color}]`, `jumps:[{from,to,label}]` | số nguyên, cộng trừ trên trục |
| `balance` (cân đĩa) | `left`, `right` (nhãn), `tilt` (độ, tween được) | phương trình, so sánh |
| `chart` (biểu đồ cột) | `values`, `labels`, `w`, `h`, `grow` (0→1 tween để cột mọc lên) | thống kê |
| `triangle` | `points`, `labels` | hình học minh hoạ đơn giản |
| `clock` | `h`, `m` | thời gian, góc kim |
| `box`, `circle` | `label`, `w`/`h`/`r`, `color` | sơ đồ, tập hợp |
| `arrow` | `dx`, `dy`, `label`, `color` | chỉ hướng, mũi tên suy luận |
| `apple`, `coin`, `money` (`label`), `book`, `star`, `bulb`, `heart`, `check`, `cross`, `question` | | minh hoạ |
| `table`, `tree`, `house`, `car` (`spin`) | | bối cảnh |
| `skateboard` | `color`; tween `x` để ván tự lăn (bánh xe quay theo x) | gag ván trượt bỏ chạy |
| `ruler` (thước kẻ trong suốt có vạch mm/cm) | `w` (dài), `unit` (px/cm), `rot`; gốc (0,0) = vạch 0 trên mép kẻ | kẻ trục, đoạn thẳng: `move` thước tới A với `rot` = góc AB, rồi `seg` `create` + `pencil` `move` cùng thời lượng |
| `pruler` (thước parabol / thước cong) | `axes`, `fn`, `x0`, `x1`, `thick`, `color`, `text`; gốc (0,0) = ĐỈNH → đặt x, y = điểm O trên màn hình; a < 0 tự lật ngược | vẽ đồ thị y = ax²: thước bay vào (`move` x, y, rot, scale), rồi `graph` `create` + `pencil` có `follow: "<id đồ thị>"` (phấn bám đúng đầu nét đang vẽ) |
| `chest` (rương kho báu) | `open` (0→1, dùng `tween`), `empty` (rương rỗng), `w`, `h`, `color` | phim tìm kho báu: hào quang vàng, đồng xu khi mở |
| `pencil` (phấn/bút chì) | `color`, `lead`; đầu nhọn tại (0,0) | đi dọc mép thước khi kẻ |
| `panel` | `w`, `h`, `title`, `titleColor`, `size`, `border` | khung công thức kiểu Manim (nền tối bo góc) |
| `image` | `src` (URL hoặc data:), `w`, `h` | ảnh ngoài (hạn chế: làm file phụ thuộc mạng) |

## 8. Phông nền (`bg`)
`treasuremap`: bản đồ kho báu giấy da nhìn từ trên xuống (lưới mờ, la bàn, sóng biển, viền) — hợp bài hình học dạng "đi tìm". Vật cầm tay mới: `hold: "shovel"` (xẻng), `hold: "map"` (bản đồ); tư thế `dig` (đào đất).
`mountain`: đỉnh núi hoàng hôn (mặt trời đỏ, núi tím nhiều lớp, lá bay, thông) — cảnh quyết chiến võ thuật.
Phông nhiều lớp có chiều sâu: `park`, `street`, `city`, `rooftop` (đêm), `forest`, `castle`, `night`, `lab`, `beach`, `manim`, `manimgrid`. Phông một lớp: `dojo` (võ đường), `paper` (giấy trơn), `grid` (giấy ô li), `whiteboard` (bảng trắng: vùng viết x 520–1820, y 90–690), `classroom` (bảng xanh phấn: x 560–1780, y 110–650; chữ phấn trắng), `park`, `street`, `market`, `home`, `space`, `stage`.
Bảng ở bên phải → đặt người giảng ở x ≈ 250–330.

## 9. Chữ & công thức (mini-TeX, vẽ thẳng lên canvas, không cần mạng)
`\frac{a}{b}`, `x^2`, `x^{n+1}`, `a_1`, `\sqrt{x}`, `\hat{A}` (góc có mũ), `\overline{AB}`, `\color{#e53935}{...}`, `\text{...}`, và kí hiệu `\cdot \times \div \pi \le \ge \ne \approx \pm \angle \deg \Rightarrow \to \infty \in \notin \subset \perp \parallel \Delta \sim \ldots`.
Không hỗ trợ: ma trận, hệ phương trình nhiều dòng (viết thành nhiều dòng `write`), `\left( \right)` co giãn. Phép chia trong SGK dùng dấu `:` (`\div` vẽ ra `:`).

## 10. Âm thanh
Tiếng thật TiengDong.com (sau khi chạy `fetch_tiengdong.py`): `punch` (tự xoay vòng punch/punch2/punch3/boxing), `kickhit`, `swish`, `swish2`, `fall`, `bell`, `crowd`, `ko`, `victory`, `tension`, `action`, `kungfu`, `wrong`. Tổng hợp: `step`, `steprun`, `jump`, `land` (tự có khi di chuyển), `pop`, `ding` (chốt kiến thức), `correct`, `wrong`, `tick`, `boing`, `tada`, `bell` (vào tiết), `click`, `step`, `whoosh` (chuyển cảnh), `marker`/`chalk` (tự có khi viết), `applause`.

## 10b. Bảng công thức Manim gắn màn hình (không bao giờ bị máy quay cắt)
- Mọi đạo cụ có `screen: true` được vẽ theo toạ độ MÀN HÌNH 1920×1080, sau lớp thế giới: máy quay zoom/lia không làm lệch, không cắt chữ.
- Mẫu: `show: [{ id: "pn", type: "panel", screen: true, x: 1460, y: 420, w: 820, h: 600, title: "Thay x = −2:" }, { id: "l1", type: "text", screen: true, text: "y = 2·(−2)^2", x: 1110, y: 300, align: "left", size: 86, anim: "write" }]`.
- Các dòng biến đổi: `anim: { do: "transform", id: "l2", to: { text: "= 2·4" }, at: 0.6 }` rồi `{ do: "circumscribe", id: "l3" }`; đổi tiêu đề khung bằng `set: { id: "pn", title: "Thay x = −1:" }`.
- `text` có `panel: true` → tự vẽ nền tối bo góc vừa khít công thức. `graph` có `glow: 22` (phát sáng); `dot` tự phát sáng trên nền tối.
- `show` nhận `at` (giây) để hiện trễ trong cùng nhịp — dùng để viết lần lượt từng dòng.
- Tư thế hài: `dance` (nhảy múa), `tired` (thở dốc, cúi người), kèm `dizzy`, `facepalm`, `lie` (ngất).

## 10c. Giọng đọc nổi bật, người kể chuyện
- Bộ trộn âm (`export_mp4.py`) chuẩn hoá độ lớn từng câu thoại + nén mềm; khi có lời, tiếng động tự lùi ~45 %, nhạc nền lùi ~80 % → giọng luôn to và rõ hơn âm thanh.
- Người kể chuyện: thêm vai ẩn `ke: { name: "", voice: "nam", hidden: true }` (có trong `cast` của mọi cảnh) → phụ đề không ghi tên; giọng gợi ý `Thiền Tâm Đức`, tốc độ 0.93.
- Mỗi vai có thể có `speed` (giữ cao độ) và `pitch` (bán cung) trong jobs TTS: hải tặc `Quang Sơn` pitch −2.5 (trầm khàn), học sinh speed 1.03–1.05.
- Nhấn nhá: viết lời bằng dấu câu — "…" để ngừng gây hồi hộp, "!" để nhấn, chữ IN HOA ở phụ đề cho từ khoá.
- `subSize` (khung FILM) đặt cỡ phụ đề (mặc định 78; 84 cho phim chiếu lớp); tên người nói được tính khi ngắt dòng.
- THẺ GHI NHỚ: panel `screen: true` giữa màn hình, chữ 110–120 + dòng phụ 88, `circumscribe` + tiếng "ding/tada" — dùng mỗi khi chốt kiến thức.

## 11. Mẹo bố cục
- Phụ đề chiếm từ y ≈ 925 (1 dòng) / 823 (2 dòng) trở xuống: nhân vật ở cảnh nền bảng nên đứng trên bục (`box` tại y 940, nhân vật y 880) và giữ phụ đề 1 dòng.
- Hai nhân vật đối thoại: x ≈ 650 và 1270, người bên phải `flip: true`.
- Bong bóng tự né mép; lời > 4 dòng bong bóng sẽ tự ẩn, chỉ còn phụ đề → tách câu.
- Đạo cụ "trên bàn": bàn `table` ở y 960 cao 190 → đặt đồ ở y ≈ 690–740.
- Cỡ chữ: mặc định bảng 84, tối thiểu 60 (chuẩn slide trình chiếu); dòng chốt dùng `box: true` + `sfx: "ding"`.
- Mỗi bảng tối đa ~5 dòng cỡ 84 (phân số chiếm nhiều chỗ hơn); khoảng dòng tự tính theo chiều cao công thức; nhiều hơn thì `clear: "board"`.

## 12. Phim dọc 9:16 (Reels/TikTok/Shorts) và dụng cụ vẽ
- Khung FILM: `size: [1080, 1920]`, `ground: 1700` (mặt đất). Engine, check_film, export_mp4 tự theo khổ dọc. Bảng Manim gắn màn hình ở nửa trên (`panel` `screen: true` y 20–1030), nhân vật ở nửa dưới; dùng `cam` đầu cảnh (vd. `{ x: 650, y: 1121, zoom: 1.26 }`) để phóng to nhân vật.
- `compass` (compa): kim tại (x, y) = tâm, `r` khẩu độ, `ang` góc đầu chì. Vẽ đường tròn: `circ` `from: ang`, `anim: "create"`, `sfx: "compass"` + `tween: { id: compa, ang: ang + 360, dur }` cùng thời lượng → đầu chì chạy đúng nét.
- `laptop` (nhìn ngang, màn hình quay về bên trái), `desk` (bàn làm việc; mặt bàn cao `h`). Tư thế `sittype` (ngồi gõ phím, tự có ghế).
- Tiếng mới: `type` (gõ phím suốt `dur`; dùng cho `text` `anim: "write"` → chữ hiện dần kèm tiếng gõ), `slide` (thước trượt), `pencil` (bút chì kẻ), `compass` (compa quay).
- Mẫu đầy đủ: `examples/canh-huyen-duong-kinh-doc.film.js` (mở đầu hài + 4 định lí, thước – bút chì – compa, lời giải gõ dần).
