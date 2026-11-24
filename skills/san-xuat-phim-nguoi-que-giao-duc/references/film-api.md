# Định dạng kịch bản `window.FILM` (tra cứu đầy đủ)

Mục lục: 1. Khung tổng · 2. Nhân vật · 3. Cảnh · 4. Nhịp (beat) · 5. Tư thế · 6. Nét mặt · 7. Đạo cụ · 8. Phông nền · 9. Chữ & công thức · 10. Âm thanh · 11. Mẹo bố cục

Khung hình cố định **1920×1080**. Mặt đất ở `y = 960`. Toạ độ x của nhân vật là điểm giữa hai chân.

## 1. Khung tổng
```js
window.FILM = {
  title: "Tên phim", subtitle: "Bài … · Toán 7", file: "ten-khong-dau",
  watermark: "Thầy Hà Văn Chung",   // góc phải trên, bỏ đi nếu không cần
  music: true,                      // nhạc nền nhẹ, tự giảm khi có lời
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
| `bubble: false` | không hiện bong bóng, chỉ phụ đề |
| `pose`, `face`, `flip`, `hold` | áp cho người đang nói (`who`) |
| `act: { an: {pose, face, flip, hold, x, exit, enter} }` | điều khiển nhân vật khác trong cùng nhịp |
| `move: { who, to, dur, style }` | đi tới x = `to` (`style`: `walk`, `run`, `jump`; `by` = dịch tương đối; `face: "left"/"right"` khi dừng) — có thể là mảng |
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
| `image` | `src` (URL hoặc data:), `w`, `h` | ảnh ngoài (hạn chế: làm file phụ thuộc mạng) |

## 8. Phông nền (`bg`)
`paper` (giấy trơn), `grid` (giấy ô li), `whiteboard` (bảng trắng: vùng viết x 520–1820, y 90–690), `classroom` (bảng xanh phấn: x 560–1780, y 110–650; chữ phấn trắng), `park`, `street`, `market`, `home`, `space`, `stage`.
Bảng ở bên phải → đặt người giảng ở x ≈ 250–330.

## 9. Chữ & công thức (mini-TeX, vẽ thẳng lên canvas, không cần mạng)
`\frac{a}{b}`, `x^2`, `x^{n+1}`, `a_1`, `\sqrt{x}`, `\hat{A}` (góc có mũ), `\overline{AB}`, `\color{#e53935}{...}`, `\text{...}`, và kí hiệu `\cdot \times \div \pi \le \ge \ne \approx \pm \angle \deg \Rightarrow \to \infty \in \notin \subset \perp \parallel \Delta \sim \ldots`.
Không hỗ trợ: ma trận, hệ phương trình nhiều dòng (viết thành nhiều dòng `write`), `\left( \right)` co giãn. Phép chia trong SGK dùng dấu `:` (`\div` vẽ ra `:`).

## 10. Âm thanh
`pop`, `ding` (chốt kiến thức), `correct`, `wrong`, `tick`, `boing`, `tada`, `bell` (vào tiết), `click`, `step`, `whoosh` (chuyển cảnh), `marker`/`chalk` (tự có khi viết), `applause`.

## 11. Mẹo bố cục
- Hai nhân vật đối thoại: x ≈ 650 và 1270, người bên phải `flip: true`.
- Bong bóng tự né mép; lời > 4 dòng bong bóng sẽ tự ẩn, chỉ còn phụ đề → tách câu.
- Đạo cụ "trên bàn": bàn `table` ở y 960 cao 190 → đặt đồ ở y ≈ 690–740.
- Cỡ chữ bảng 56–76; dòng chốt dùng `box: true` + `sfx: "ding"`.
- Mỗi bảng tối đa ~6 dòng cỡ 64; nhiều hơn thì `clear: "board"`.
