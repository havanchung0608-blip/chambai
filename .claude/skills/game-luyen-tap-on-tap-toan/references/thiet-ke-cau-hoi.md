# Thiết kế bộ câu hỏi cho game luyện tập – ôn tập

## 1. Tiết luyện tập và tiết ôn tập khác nhau thế nào

| | Tiết luyện tập | Tiết ôn tập (chương/kì) |
|---|---|---|
| Phạm vi | 1–2 bài vừa học | Cả chương hoặc nhiều chương |
| Mục tiêu game | Khắc sâu công thức, rèn kĩ năng tính, sửa lỗi sai điển hình | Hệ thống hóa, nhận dạng bài, liên kết kiến thức |
| Dạng câu ưu tiên | `mcq` nhận dạng công thức, `num` tính nhanh, `tf` bắt lỗi sai | `mcq` nhận dạng dạng bài, `num` bài tổng hợp, `open` nêu hướng giải |
| Chế độ gợi ý | Ô số may mắn, Đua về đích | Vượt ải cả lớp, Đua về đích |
| Số câu | 12–16 | 16–24 |

## 2. Phân bố mức độ (với 16 câu)
- Luyện tập: 5 Dễ – 7 Vừa – 4 Khó.
- Ôn tập: 5 Dễ – 6 Vừa – 5 Khó; mỗi bài trong chương có ít nhất 1 câu.
- Dễ (Nhận biết): nhận ra công thức, định nghĩa, tính chất; 1 bước.
- Vừa (Thông hiểu): áp dụng trực tiếp 1–2 bước; tính nhanh; điền khuyết.
- Khó (Vận dụng): 2–3 bước, kết hợp kiến thức, tìm x, giá trị lớn nhất/nhỏ nhất, bài thực tế ngắn.
- Câu Khó vẫn phải làm được trong `time` (mặc định 60 giây) trên bảng con.

## 3. Mẹo làm câu hỏi hấp dẫn
- Mở đầu bằng câu ngắn, dễ để cả lớp hào hứng; câu Khó để cuối hoặc ẩn trong ô số.
- Câu Đúng/Sai: lấy đúng **lỗi sai học sinh hay mắc** làm khẳng định Sai, ví dụ $(x-3)^2=x^2-9$.
- Phương án nhiễu `mcq`: mỗi phương án ứng với một lỗi cụ thể (quên hệ số 2, sai dấu, nhầm bình phương với nhân đôi). Độ dài các phương án gần bằng nhau, vị trí đáp án đúng rải đều A–D.
- Câu thực tế ngắn (diện tích mảnh vườn, giá tiền, quãng đường) với số liệu hợp lí, đáp số đẹp.
- Có thể đặt 1–2 câu "bẫy" kiểm tra hiểu bản chất.
- `num`: đáp số nguyên hoặc thập phân ngắn; nếu chấp nhận nhiều cách viết dùng mảng `answer:[0.5]` và học sinh có thể nhập `1/2` (engine tự hiểu phân số a/b, dấu phẩy thập phân). Bài có 2 nghiệm thì hỏi "tổng các nghiệm"/"nghiệm dương" để chỉ còn một đáp số.
- `open`: dùng cho chứng minh ngắn, nêu hướng giải, giải thích; `answer` ghi ý chính để GV đối chiếu.

## 4. Lời giải và gợi ý
- `hint`: chỉ hướng, không lộ đáp số (ví dụ "Viết $101=100+1$").
- `solution`: 1–3 bước, mỗi bước 1 dòng, trình bày như vở học sinh; dùng "suy ra", "vậy", không dùng ⇔.
- Hình học: góc viết `\widehat{ABC}`, tam giác đồng dạng `\backsim` hoặc kí hiệu chuẩn SGK.

## 5. LaTeX được bộ hiển thị dự phòng (khi mất mạng) hỗ trợ
Có KaTeX (có mạng) thì mọi lệnh đều hiển thị. Khi mất mạng, engine tự hiển thị các lệnh sau – nên chỉ dùng các lệnh này:
- Mũ, chỉ số: `x^2`, `x^{10}`, `a_1`, `a_{n}`.
- `\frac{a}{b}`, `\dfrac{a}{b}`, `\sqrt{x}`, `\overline{ab}`, `\widehat{ABC}`, `\hat{A}`, `\text{...}`.
- Kí hiệu: `\cdot \times \div \le \ge \ne \pm \approx \square \Rightarrow \in \notin \subset \cup \cap \varnothing \pi \alpha \beta \gamma \angle \triangle \perp \parallel \circ \infty \backsim \equiv \dots`.
- `\left( \right) \big[ \big]` được bỏ qua kích thước, vẫn hiện ngoặc.
- Dấu nhỏ hơn/lớn hơn trong công thức: viết `\lt`, `\gt` (tránh lỗi HTML).
- Không dùng ma trận, hệ `\begin{cases}`; hệ phương trình viết 2 dòng bằng `<br>`.

## 6. Ví dụ đầy đủ một câu mỗi dạng
```js
{level:1, type:"mcq", q:R`Đa thức $x^2-16$ bằng:`,
 options:[R`$(x-4)^2$`, R`$(x-16)(x+16)$`, R`$(x-4)(x+4)$`, R`$(x-8)(x+8)$`], answer:2,
 solution:[R`$x^2-16=x^2-4^2=(x-4)(x+4)$.`]},
{level:1, type:"tf", q:R`Khẳng định: $(x-3)^2=x^2-9$.`, answer:false,
 solution:[R`$(x-3)^2=x^2-6x+9$. Khẳng định <b>Sai</b>.`]},
{level:2, type:"num", q:R`Tính nhanh: $49\cdot 51$.`, answer:2499, hint:R`$49=50-1$, $51=50+1$.`,
 solution:[R`$49\cdot51=50^2-1=2499$.`]},
{level:3, type:"open", q:R`Chứng minh $(a+b)^2-(a-b)^2=4ab$.`, answer:R`Khai triển vế trái được $4ab$.`,
 solution:[R`Vế trái $=(a^2+2ab+b^2)-(a^2-2ab+b^2)=4ab$.`], time:90}
```
