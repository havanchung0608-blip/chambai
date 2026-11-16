---
name: "mo-phong-phan-tich-di-len"
description: "Tạo file HTML mô phỏng bài hình THCS của thầy Chung: nhân vật người que mang khuôn mặt thầy cầm thước, ê ke, compa dựng hình theo từng dòng đề (dụng cụ bay vào kiểu phim hành động, âm thanh sống động), sơ đồ phân tích đi lên, lời giải từng bước, đọc tới đâu chỉ tay và nhấn mạnh kiểu Manim tới đó, giọng nữ. Dùng khi thầy gửi đề hình và muốn mô phỏng kèm phân tích, đáp án."
---

# MÔ PHỎNG BÀI HÌNH + PHÂN TÍCH ĐI LÊN + LỜI GIẢI (mẫu Thầy Hà Văn Chung)

Sản phẩm: MỘT file HTML tự chứa, chạy offline, dựng từ file mẫu `assets/MAU_nguoi_que_phan_tich_di_len.html` trong skill này (mẫu Bài 1 Toán 8: ADME hình chữ nhật, AMCK hình thoi, phân giác – đã có đủ người que, hiệu ứng, âm thanh). Gọi người dùng là "Thầy Chung", xưng "em".

## 0. Năm yêu cầu BẮT BUỘC của thầy
1. **Lời giải chiếu từng ý**: mỗi ý/mỗi bước lập luận là MỘT beat riêng (một `line`), hiện lần lượt; không dồn nhiều ý vào một dòng dài. Một dòng chỉ nên chứa một kết luận kèm lí do của nó (tối đa khoảng 2 dòng hiển thị). Các dòng đã chiếu giữ nguyên, dòng đang chiếu có khung vàng nổi bật.
2. **Chiếu đến đâu nhấn mạnh đến đó**: MỌI beat có `line` (đề, lời giải, phân tích giả thiết) và mọi beat có `node` (sơ đồ) PHẢI có `hl` tô sáng đúng đối tượng đang nói tới trên hình (tam giác/tứ giác → `hlPoly`, đoạn thẳng → `hlSeg`, góc → `hlAng`/`rightMark`, điểm → `hlPt`), và `mk` cho kí hiệu đoạn/góc bằng nhau vừa được chứng minh. Không nhấn mạnh đối tượng chưa được nhắc đến. Nếu một dòng nói về hai đối tượng thì tô cả hai bằng hai màu khác nhau.
3. **Luôn có giọng đọc máy – GIỌNG NỮ MẶC ĐỊNH** (thầy yêu cầu mọi mô phỏng đều dùng giọng nữ): mọi beat đều có `say`; giọng bật sẵn (`VOICE.on=true`), tự chuyển bước khi đọc xong; dùng khối giọng đọc ở mục 4A (đã gắn sẵn trong file mẫu). Khi bàn giao, nhắc thầy mở bằng Edge (giọng nữ HoaiMy tự nhiên) hoặc Chrome (giọng nữ Google), máy cần có mạng.
4. **Sơ đồ phân tích đi lên chi tiết từng phần, KHÔNG gộp ý, và thấy TRỌN sơ đồ trên một màn hình**: theo đúng mục 3A bên dưới (đặc biệt quy tắc 2b và 7).
5. **Hình vẽ đúng tư thế quen thuộc của SGK**: tam giác vuông vẽ đứng thẳng – đỉnh góc vuông ở dưới bên trái, một cạnh góc vuông thẳng đứng, cạnh góc vuông kia nằm ngang (ví dụ △ABC vuông tại A: A(0,0), B(0,6), C(8,0)); hình bình hành/hình chữ nhật có cạnh đáy nằm ngang; tam giác cân có đáy nằm ngang, đỉnh ở trên. Chỉ vẽ khác khi đề/hình của thầy vẽ khác.

## 0B. Nhân vật người que & hiệu ứng – BẮT BUỘC (thầy duyệt 11/2026, đã có sẵn trong file mẫu)
Mọi phần dưới đây là engine, KHÔNG viết lại; chỉ cần giữ nguyên khi thay khối bài. Khi thầy góp ý chỉnh nhân vật/hiệu ứng thì sửa trong engine và cập nhật file mẫu.

**Hình dáng nhân vật (giống ảnh thầy gửi)**
- Đầu là ẢNH CHÂN DUNG thầy Chung (nền trong suốt, nhúng base64 trong `HEAD.img`), kiểu chibi đầu to (`.22·u`). Mắt CHỚP như thật (`EYES` = toạ độ khe mắt trong ảnh, `blinkAmount`: 2,5–5,5 s/lần, đôi khi chớp đôi). Miệng NÓI THEO GIỌNG: tách hàm dưới tại `HEAD.split`, mỗi sự kiện `onboundary` (mỗi tiếng) mở rồi khép, ngắt ở dấu câu (`mouthTarget`).
- Thân: cơ bắp vừa phải, chân ngắn, tay ngắn kiểu chibi; áo phông trắng NAM (vai vuông, thân suông), quần short nam xanh navy dài tới gối (cạp, dây rút, túi), tất trắng, giày trắng sọc xanh. KHÔNG eo thắt, KHÔNG đường cong ngực (trông giống nữ). KHÔNG đồ màu tối (che hình).
- **Ngực áo LUÔN in tên: "Thầy Chung" (đỏ đậm `#c62828`) và dòng dưới "SĐT 0988938901" (xanh navy)**, đặt lệch nhẹ về phía tay sau để tay trước không che; chữ luôn đọc xuôi kể cả khi xoay người (lật ngược lại khi `turn < 0`).
- Bàn tay như thật (`drawHand`: lòng bàn tay, 4 ngón 2 đốt, ngón cái, móng) theo tư thế: `grip` cầm dụng cụ, `point` chỉ ngón trỏ, `open` xoè, `fist` chống cằm, `thumb` giơ ngón cái, `relax`.
- Nếu thầy gửi ảnh mới: tách đầu (nền trong suốt), đo lại `HEAD.split` (khe giữa hai hàm răng), `HEAD.chin`, `EYES`, nén webp rồi thay base64.

**Không che hình khi vẽ (yêu cầu số 1 của thầy)**
- Thứ tự vẽ: nền → thân người → nét hình (có viền sáng) → nhấn mạnh → dụng cụ → tay cầm → bút. Mọi nét, nhãn, dụng cụ luôn NẰM TRÊN người.
- Người đi vào vùng hình thì tự mờ (`MAN.fade` ≈ .42). Tay CAO SU tự dài ra để vẽ/chỉ chỗ xa (`drawArm`: đoạn tay kéo dài theo khoảng cách, thon lại).
- Trạng thái di chuyển đổi theo từng beat, lâu lâu mới đổi (`MAN.moveMode`): ~55% đứng yên vươn tay dài, ~30% đi bộ tới cạnh chỗ vẽ (chỗ cao thì bay lên co chân, có vệt gió), ~15% về mép trái vươn tay từ xa.

**Dựng hình như phim hành động**
- ĐỌC XONG MỚI VẼ: op của một beat chỉ bắt đầu khi `say` đã đọc xong; lúc đọc nhân vật đi sẵn tới chỗ sắp vẽ.
- Dụng cụ xuất hiện: thước RƠI TỪ TRÊN TRỜI xuống đập "rầm" (bụi, rung màn hình); ê ke XOAY TÍT bay vào đáp "keng" (tia sáng); compa bị KÉO VÈO TỪ NGOÀI VÀO (vệt mờ), các cung sau compa lướt sang; tẩy lao vào chà ra vụn; chấm điểm có tia lửa nhỏ.
- Thước đo góc TO (bán kính mặc định 2,6 đơn vị), vạch 1°/5°/10° rõ nét, SỐ MỐC 0–30–60–90–120–150–180 in to đậm (không ghi số mỗi 10° vì bị chen chúc); khi đánh dấu có vạch đỏ đúng số đo và SỐ ĐO TO trong ô đỏ (ví dụ 50°). Compa chân to, tên "THẦY CHUNG" chữ VÀNG ĐẬM VIỀN ĐEN cho nổi rõ.
- Tên thầy IN ĐẬM DỌC THÂN dụng cụ: "THẦY HÀ VĂN CHUNG" (thước, cạnh huyền ê ke), "THẦY CHUNG" (chân compa, tẩy), "2B · THẦY CHUNG" (bút); chữ luôn đọc xuôi (`toolText`).
- Màu hình nổi bật, nét dày 4·f, phát sáng nhẹ: cạnh chính `#0b2e83`; đường vuông góc `#d81b60`; phân giác/đường đặc biệt `#ff6f00`; đường chéo/nối thêm `#1e88e5` nét đứt; cạnh hình mới `#ef6c00` nét đứt; đoạn đối xứng `#8e24aa`. Điểm: vòng trắng tâm đỏ. Truyền `{col, w, dash}` vào `R`/`EKE`.

**Đạo diễn động tác (đổi liên tục như phim, `startAct`)**: gọi thước = chỉ tay lên trời; đón ê ke = ngả người thủ thế; kéo compa = ngả người kéo; dụng cụ đáp thì nhún (`MAN.sq`); giữa các bước ngẫu nhiên không lặp: gật đầu, giơ ngón cái, vẫy tay, bật nhảy, gồng tay, xoay người; nhấn mạnh thì lao người tới; sang cảnh mới xoay người; dòng "Vậy…" LỘN NHÀO + mưa giấy + kèn. Di chuyển nhanh/nhảy có bóng mờ (afterimage).

**Nhấn mạnh kiểu Manim – đọc tới đâu nhấn tới đó, mạnh nhưng TUỲ CHỖ, KHÔNG nháy liên tục**
- Đồng bộ lời đọc: `mentionPos` tìm vị trí tên đối tượng (đọc theo bảng mục 4) trong `say`; tiến độ đọc lấy từ `onboundary` (dự phòng: ước lượng theo tốc độ). Đối tượng chỉ bùng lên đúng lúc được đọc tới; người chỉ ngón tay vào đúng đối tượng đó (rê dọc đoạn, khoanh hình, vẽ cung trong góc, gõ điểm). Đối tượng đã nói trước mờ đi; nền hình mờ nhẹ.
- **Nhấn mạnh bằng CẢ HAI TAY và CHÂN, không chỉ một tay** (`gestureLimbs`, đổi cách theo `seed`): đoạn thẳng = hai tay đặt hai đầu cùng trượt vào giữa rồi ra ("kẹp" đoạn); hai đoạn bằng nhau/song song = mỗi tay rê một đoạn cùng lúc; tam giác/tứ giác = hai tay chạy vòng quanh từ hai phía đối nhau; góc = một tay giữ đỉnh, tay kia vẽ cung trong góc; điểm = hai ngón trỏ cùng gõ vào. Đối tượng nằm thấp (dưới khoảng 55% chiều cao khung) thì luân phiên dùng CHÂN vươn dài (như tay cao su) gõ/rê thay một tay, hoặc hai tay kèm chân. Ống quần giữ độ dài thật khi chân duỗi.
- Mức độ: dòng có "⇒", dòng "Vậy…", ô gốc sơ đồ → MẠNH (2 vòng xung kích, 30 tia lửa, giật phóng nhẹ, trống trầm + hợp âm); ý phụ → vừa (1 vòng nhỏ, ít tia lửa).
- Kiểu đổi luân phiên theo dòng/đối tượng (`seed`): đoạn = vệt sáng chạy / sóng chạy dọc / viền viên thuốc bao quanh / phình dày; hình = phóng to + viền chạy quanh / tô màu quét ngang / các cạnh sáng lần lượt (tia lửa từ các đỉnh); điểm = vòng thu vào / 3 vòng sóng / khung ngắm khoá mục tiêu; góc = quạt nở / quét cung có mũi tên / hai cung đồng tâm (KÍ HIỆU GÓC LUÔN NẰM TRONG GÓC, không xoay ra ngoài hai cạnh). Khoá `e:AM~DE` (hai đoạn bằng nhau: bản sao bay chồng lên, 2 lần rồi dừng), `l:MD~AC` (song song: trượt sang, 2 lần rồi dừng).
- Sau khi bùng lên thì sáng ỔN ĐỊNH, không nhấp nháy. Rung màn hình chỉ dùng khi dụng cụ đáp xuống.

**Âm thanh (Web Audio tự tổng hợp, chạy offline, nút 🎵 bật/tắt, có bộ nén chống vỡ tiếng)**: rơi rít gió, đập "rầm", vù vù xoay, "keng", "vút", kim loại "xoẹt", bút chì sột soạt, compa, tẩy chà, "tích" chấm điểm, "pốp" khi chữ/ô sơ đồ hiện. Nhấn mạnh (TO, `V = 2.6`): đoạn "vút"+nốt, điểm chuông "ting", hình hợp âm lấp lánh, góc "dzít"+nốt, bằng nhau hai nốt "khớp", song song còi trượt; các lần trong một dòng đi lên theo thang ngũ cung; kết luận thêm trống + hợp âm; "Vậy" có kèn.

**Nhịp trình chiếu**: VẼ CHẬM để học sinh quan sát thao tác – `DRAW_SPEED` mặc định 0,7× (thanh "Tốc độ vẽ" 0,4–1,2×, khoá localStorage `tc_draw`), áp cho mọi thao tác dụng cụ, nét bút, chấm điểm, tẩy; tốc độ đọc mặc định 0,85× (khoá localStorage `tc_rate_v2`); dòng có nhấn mạnh dừng thêm 1,6 s, sang cảnh 1,8 s để người kịp chỉ và hiệu ứng chạy xong.

## 1. Lấy khung chương trình (engine) – KHÔNG viết lại từ đầu
Thứ tự tìm file mẫu:
1. **`assets/MAU_nguoi_que_phan_tich_di_len.html` trong thư mục skill này** (ưu tiên – bản mới nhất có người que, hiệu ứng, âm thanh theo mục 0B). Chép file này rồi chỉ thay khối bài.
2. Project doc `mau/MAU_mo_phong_phan_tich_di_len.html` hoặc máy thầy `D:\soạn cho giáo viên thi\toán 7 mô phỏng\Lớp 8\MAU_mo_phong_phan_tich_di_len.html` – bản CŨ (chưa có người que): nếu buộc phải dùng thì phải bổ sung đủ mục 0B.
3. Nếu không có cả hai: dựng lại engine đúng các mục dưới đây và mục 0B.

**Nhiều bài trong một file**: mỗi bài là một khối `PROBLEMS.push((function () { let FIG, SCENES; ... return {name: 'Bài 2', FIG, SCENES}; })());` đặt trước `boot();` – engine tự hiện nút chọn "Bài 1 | Bài 2 | …" ở thanh trên (mỗi bài đủ tab Đề bài, Phân tích GT, Câu a, b, c). Khi thầy bảo "làm thêm bài vào file đó" thì thêm một khối mới, không tạo file khác. Tên các điểm (A, B, …) là biến cục bộ trong từng khối nên các bài không đụng nhau.

Trong file mẫu người que, khối bài cụ thể bắt đầu từ dòng `/* ===== TOÁN 8 – BÀI 1 ...` (toạ độ điểm, điểm phụ dựng hình, `FIG` gồm `title`, `badge`, `box`, `cen`, `P`, `MK`; `SCENES`; khối kiểm tra) tới trước `boot();`. `FIG.P` phải chứa MỌI điểm có tên (dùng cho nhấn mạnh, tính mép trái hình để nhân vật đứng ngoài). `FIG.box` chừa mép trái khoảng 4 đơn vị cho nhân vật đứng. Engine nằm phía trên – không sửa khi chỉ đổi bài. Với file mẫu này: mỗi kết luận viết NGUYÊN cây trong `tree` của một cảnh (mỗi nút có `say`, `hl`), engine tự sinh beat theo thứ tự đi sâu, tự xếp các ô lá cùng cấp thành một cột có viền vàng và tự co chữ cho thấy trọn cây – KHÔNG cần khối gộp sơ đồ ở 3A.9.

Giữ NGUYÊN toàn bộ phần engine (từ `<style>` tới hết hàm `boot()`, kể cả khối "GIỌNG ĐỌC TIẾNG VIỆT – GIỌNG NỮ MẶC ĐỊNH" nằm ngay trước khối bài), chỉ thay khối "BÀI CỤ THỂ" ở cuối (từ dòng `/* ===== TOÁN ...` tới trước `boot();`): toạ độ điểm, `FIG`, `SCENES`, khối kiểm tra, khối gộp sơ đồ (3A.9). Đổi `<title>`, `FIG.title`, `FIG.badge` ("Toán 7/8/9"). Nếu dùng file mẫu cũ chưa có khối giọng nữ thì chép khối từ Project doc `mau/khoi_giong_doc.js` vào ngay trước `boot();`.

## 2. Giao diện (đã có trong engine)
- Lưới 46% hình (canvas, trái) – 54% chữ (phải), nền xanh đậm `#0f2233`, font Times New Roman, chữ lời giải tự co giãn 28–60px để không tràn (`fitAll`); chữ sơ đồ tự co 14–52px (3A.7).
- Thanh nút: tab phần (Đề bài / Phân tích GT / Câu a / Câu b …), ▶ Tự động | ✋ Ấn nút, ▶ Bắt đầu/⏭ Tiếp, ⏸ Tạm dừng, ↺ Làm lại, ⏩ Nhanh, 🔊, 🔁 Đọc lại, ô chọn giọng, thanh tốc độ đọc. Phím Space/→ = tiếp, R = đọc lại.
- Huy hiệu lớp góc trái, chữ ký "Thầy Hà Văn Chung – SĐT 0988938901" góc phải dưới, watermark chéo mờ.
- Dụng cụ giống thật vẽ bằng canvas, có tên thầy: thước kẻ (vạch cm/mm), bút chì 2B, ê ke, compa, thước đo góc, cục tẩy.

## 3. Cấu trúc dữ liệu bài toán
Toạ độ đơn vị cm, trục y hướng lên. Chọn toạ độ đẹp (số nguyên/thập phân gọn, ưu tiên bộ 3-4-5) thoả đúng giả thiết và đúng tư thế hình ở yêu cầu 0.5; điểm phụ (chân đường cao, hình chiếu, giao điểm) tính bằng hàm (`projL`, `G.inter`, `G.lerp`), không gõ tay. `FIG.box=[xmin,xmax,ymin,ymax]` bao trọn hình + cung compa + nhãn và để hình đủ lớn (hình chiếm phần lớn khung trái). Tránh toạ độ làm hai điểm khác nhau gần trùng – thử đổi tỉ lệ cạnh. Hướng dụng cụ (ê ke, đường trung trực dựng bằng compa) tính theo góc của cạnh (`G.ang(B,C)+90`…), không gõ cứng 0°/90°.

Các thao tác (op) trong `ops` của một nhịp (beat):
- `R(P,Q,{col,dash,aux,side,w,away})` – thước (rơi từ trên trời) + bút kẻ đoạn P→Q.
- `EKE(V,alongDeg,drawDeg,0,{to:Q,back:Q2})` – ê ke đỉnh vuông V nằm trên đường hướng alongDeg, kẻ tới Q (và `back` kẻ tiếp phía bên kia tới Q2).
- `CMP(C,r,a0,a1,{dur})` – compa tâm C bán kính r vẽ cung từ a0° tới a1° (đường phụ, sẽ bị tẩy).
- `PRO(V, baseDeg, deg, ccw, {r})` – (file mẫu người que) thước đo góc xoay bay vào, tâm tại V, vạch 0 trùng tia gốc hướng `baseDeg` (ví dụ `G.ang(A,B)`), đánh dấu điểm phụ ứng với `deg` độ theo chiều `ccw` (true = ngược chiều kim đồng hồ); sau đó dùng `R` kẻ tia qua điểm đánh dấu. Dùng khi đề cho số đo góc (vẽ góc 50°, 70°, tia phân giác 35°…).
- `PRO(V,baseDeg,deg,ccw)` – thước đo góc.
- `PT('A',A,dx,dy)` – điểm + nhãn (dx,dy pixel, dy dương là xuống dưới; đặt nhãn vào vùng trống phía ngoài hình, không đè đường kẻ – với giao điểm đặt trong góc trống giữa hai đường). `LB`, `ANG`, `RA(V,d1,d2)` (kí hiệu góc vuông), `WAIT(s)`.
- `ERASE_ALL({dur})` – tẩy mọi đường dựng phụ của cảnh (luôn đặt cuối cảnh Đề bài).
- Dựng đúng như học sinh làm: trung điểm bằng compa (2 cặp cung từ 2 đầu mút + đường nối giao điểm nét đứt aux), vuông góc bằng ê ke, tam giác cân bằng hai cung compa cùng bán kính từ hai đầu đáy, đỉnh thứ tư hình bình hành bằng hai cung compa (cạnh đối bằng nhau), điểm đối xứng bằng compa, lấy đoạn bằng nhau bằng compa.

`FIG.MK` – kí hiệu bổ sung xuất hiện vĩnh viễn từ nhịp có `mk:[...]` (gạch đoạn bằng nhau dùng hàm `tick`).
Trong file mẫu người que, `hl` dùng KHOÁ CHUỖI (engine tự vẽ hiệu ứng Manim, không cần khai báo `FIG.HL`): `'p:ADME|y'` đa giác, `'s:AB|c'` đoạn, `'t:M|p'` điểm, `'r:DAE|p'` góc vuông tại chữ giữa, `'a:ABF|o'` góc thường, `'e:AM~DE|c'` hai đoạn bằng nhau, `'l:MD~AC|c'` hai đoạn song song; màu y/c/p/g/o. Thứ tự hiện do VỊ TRÍ đọc tên đối tượng trong `say` quyết định. (Mẫu cũ:) `FIG.HL` – hiệu ứng nhấp nháy nhấn mạnh theo nhịp `hl:[...]`: `hlPoly(pts,a,'y'|'c'|'p'|'g'|'o')`, `hlSeg`, `hlAng`, `hlPt`, `rightMark`. Hàm tiện ích góc vuông tại V giữa VP, VQ:
`function rq(V,P,Q,al,k){let a=G.ang(V,P),b=G.ang(V,Q);if(((b-a+360)%360)>180){const t=a;a=b;b=t;}if(b<a)b+=360;hlAng(V,a,b,.42,al,k||'p');rightMark(V,a,b,al,COL.glow);}`
(tương tự hàm `ag(V,P,Q,al,k,r)` tô góc nhọn bất kì không có dấu vuông). Khai báo đủ mục HL cho mọi đa giác, đoạn, góc, điểm xuất hiện trong sơ đồ, phân tích giả thiết và lời giải.

`SCENES` – mảng cảnh, mỗi cảnh `{title, tab, q, tree?, beats:[...]}`:
1. **Cảnh ĐỀ BÀI VÀ VẼ HÌNH** (tab 'Đề bài'): mỗi dòng đề là 1 beat có `line` (HTML) + `say`; ngay sau là các beat chỉ có `say` + `ops` thuyết minh thao tác dụng cụ. Thứ tự dựng đúng thứ tự đề. Cuối: beat tẩy đường phụ.
2. **Cảnh PHÂN TÍCH GIẢ THIẾT** (tab 'Phân tích GT') – làm khi thầy yêu cầu "phân tích giả thiết" (nên làm mặc định cho bài nhiều câu): mỗi giả thiết là MỘT beat `line` dạng "Giả thiết ⇒ hệ quả có ngay" (ví dụ "<i>AH</i> là đường cao ⇒ <i>AH</i> ⊥ <i>BC</i>, ^{<i>AHB</i>} = 90°"), `hl` đúng đối tượng; sau đó 1–2 beat "Nhận xét" gợi hướng (ví dụ "tứ giác <i>AMHN</i> đã có ba góc vuông"), cuối cùng beat "Cần chứng minh" liệt kê kết luận từng câu. Không chứng minh ở cảnh này.
3. Với MỖI câu a, b, c…: các cảnh cùng `tab`:
   - **SƠ ĐỒ PHÂN TÍCH ĐI LÊN** (mỗi kết luận MỘT sơ đồ đầy đủ, xem 3A.7; câu có hai kết luận như "OA = OM và góc AMN = góc ACB" thì hai cảnh sơ đồ cùng tab): `tree` gốc = kết luận (đỏ), con = điều cần có (xanh dương), lá = giả thiết (`k:'gt'`, xanh lá) hoặc điều đã biết/đã chứng minh câu trước (`k:'biet'`, cam); ô dẫn sang sơ đồ nhánh `k:'can'`. Mỗi nút `{id,t,n,ch,k}`; mũi tên ⇑ tự sinh.
   - **LỜI GIẢI**: chiếu từng ý (mục 0), lập luận ⇒, lí do trong ngoặc, dòng cuối "Vậy …". Thứ tự các dòng lời giải đi NGƯỢC sơ đồ: từ các ô lá lên dần tới gốc, mỗi ô trung gian của sơ đồ tương ứng ít nhất một dòng lời giải.
   - Câu nào thầy dặn không cần sơ đồ (ví dụ câu tính toán) thì chỉ có cảnh LỜI GIẢI.

Kí hiệu trong chuỗi `line`/`t`: `<i>ABC</i>` tên hình (in nghiêng), `^{<i>DHE</i>}` góc có mũ, `[[a||b]]` phân số, `_{1}` chỉ số dưới, `<sup>2</sup>` số mũ, `△`, `⊥`, `//`, `∈`, `⇒`, `∽`. KHÔNG dùng ⇔.

## 3A. Quy tắc sơ đồ phân tích đi lên – chi tiết từng phần, không gộp ý
Mục đích: học sinh nhìn mỗi ô là hiểu ngay "cần gì, vì sao", tự đi được từ kết luận xuống giả thiết mà không bị nhảy cóc, và thấy được toàn bộ sơ đồ khi thầy trình chiếu.

1. **Mỗi ô chỉ MỘT mệnh đề**: một đẳng thức, một quan hệ (//, ⊥, thuộc…) hoặc một kết luận về hình. CẤM ghép hai ý bằng "và", dấu phẩy, hoặc chuỗi bằng nhau nhiều vế:
   - Sai: ô "<i>AE</i> // <i>CF</i> và <i>AE</i> = <i>CF</i>" → Đúng: hai ô riêng "<i>AE</i> // <i>CF</i>" và "<i>AE</i> = <i>CF</i>".
   - Sai: ô "<i>AE</i> = <i>DF</i> = [[AB||2]]" → Đúng: ô "<i>AE</i> = <i>DF</i>" với các ô con "<i>AE</i> = [[AB||2]]", "<i>DF</i> = [[CD||2]]", "<i>AB</i> = <i>CD</i>".
   - Sai: ô "<i>EB</i> = <i>BC</i> = <i>AD</i>" → tách thành các ô riêng, mỗi ô một đẳng thức có lí do riêng.
2. **Mỗi mũi tên là MỘT bước suy luận** dùng MỘT dấu hiệu/định lí/tính chất/định nghĩa. Ghi TÊN dấu hiệu đó ở `n` của ô CHA, ví dụ `n:'hình bình hành có hai cạnh kề bằng nhau'`, `n:'định nghĩa trung điểm'`, `n:'tam giác cân: đường cao là trung tuyến'`. Không ghi hai định lí vào một ô.
2b. **`n` KHÔNG được chứa dữ kiện** (thầy nhắc nhiều lần): mọi dữ kiện dùng trong một bước phải là MỘT Ô RIÊNG, kể cả những điều "hiển nhiên":
   - Sai: ô "<i>AD</i> // <i>BH</i>" với `n:'B, H, C thẳng hàng'` → Đúng: ô con riêng "<i>B</i>, <i>H</i>, <i>C</i> thẳng hàng" [gt].
   - Sai: ô "<i>BH</i> = <i>HC</i>" với `n:'đường cao tam giác cân là trung tuyến'` rồi nhảy thẳng tới giả thiết → Đúng: chuỗi ô "<i>BH</i> = <i>HC</i>" ⇑ "<i>H</i> là trung điểm <i>BC</i>" ⇑ "<i>AH</i> là đường trung tuyến" ⇑ hai ô "△<i>ABC</i> cân tại <i>A</i>", "<i>AH</i> là đường cao".
   - Sai: ô "<i>MP</i> = <i>MC</i>" `n:'trung tuyến ứng với cạnh huyền'` → Đúng: "<i>MP</i> = <i>MC</i>" (n: cùng bằng [[AC||2]]) ⇑ "<i>MP</i> = [[AC||2]]" (n: trung tuyến ứng với cạnh huyền) ⇑ hai ô "△<i>PAC</i> vuông tại <i>P</i>", "<i>PM</i> là trung tuyến"; và "<i>MC</i> = [[AC||2]]" (n: định nghĩa trung điểm) ⇑ "<i>M</i> là trung điểm <i>AC</i>".
   - Các khái niệm trung gian (… là trung điểm, … là trung tuyến/trung trực/tia phân giác, △… cân/vuông, điểm thuộc trung trực, góc = 90°…) luôn là ô riêng, không được gói vào `n`.
   - Ô lá: `t` là chính dữ kiện ("<i>M</i> là trung điểm <i>AC</i>", "<i>AH</i> là đường cao"), `n` chỉ ghi NGUỒN ("giả thiết", "câu a", "đã chứng minh ở trên").
3. **Không nhảy cóc**: mỗi ô trung gian phải được phân tích tiếp cho tới khi mọi nhánh kết thúc ở ô lá là giả thiết (`k:'gt'`) hoặc kết quả đã chứng minh (`k:'biet'`). Không viết "chứng minh tương tự" để bỏ bớt nhánh trong sơ đồ; nếu nhánh lặp lại y hệt câu trước thì vẫn vẽ đủ các ô, chỉ được rút ngắn `say`.
4. **Ô lá ghi rõ nguồn** ở `n`: "giả thiết", "câu a", "đã chứng minh ở trên"…; nếu cần giải thích vì sao dữ kiện có từ giả thiết thì tạo thêm một tầng ô (ví dụ "<i>M</i> là trung điểm <i>HD</i>" ⇑ "<i>D</i> đối xứng <i>H</i> qua <i>M</i>" [giả thiết]).
5. **Chữ ngắn**: `t` khoảng ≤ 25 kí tự hiển thị, `n` ≤ 35 kí tự. Nếu dài hơn nghĩa là đang gộp ý → tách ô.
6. **Mỗi ô một beat**: mỗi nút có đúng một beat `node:'id'`, hiện theo thứ tự đi sâu từng nhánh (gốc → nhánh 1 đến lá → nhánh 2 …). `say` của ô cha dùng mẫu "Muốn … ta cần … (theo dấu hiệu …)"; `say` của ô lá nói "… theo giả thiết" / "… đã chứng minh ở câu …". `hl` tô đúng đối tượng của ô đó.
7. **Mỗi kết luận MỘT sơ đồ đầy đủ trên một màn hình, chữ tự thu nhỏ dần** (thầy yêu cầu để học sinh thấy toàn bộ sơ đồ khi trình chiếu): KHÔNG để sơ đồ bị chia thành nhiều màn hình, KHÔNG cuộn. Ô nào chưa chiếu thì ẩn hẳn (không giữ chỗ); mỗi lần hiện thêm ô, chữ cả cây tự co lại cho vừa khung (từ khoảng 52px, xuống được tới 14px; độ rộng ô tự chọn trong 9/12/15/19em sao cho chữ lớn nhất). Một kết quả dùng chung cho nhiều nhánh thì phân tích đầy đủ ở lần xuất hiện đầu, các lần sau là ô `k:'biet'` với `n:'đã chứng minh ở trên'`. Được viết cây theo từng phần cho dễ soạn (cảnh tổng quát + ô nhánh `k:'can'`, `n:'xem sơ đồ (k)'`, cảnh "SƠ ĐỒ (k): …" cùng tab) – khối mã ở quy tắc 9 tự gộp lại thành một cây; một tab được có nhiều sơ đồ chính.
8. **Kiểm tra trước khi bàn giao** (script): không ô nào chứa " và " nối hai mệnh đề, không ô nào có từ hai dấu "=" trở lên (trừ công thức tính toán thật sự là một ý), mọi ô không có `k:'gt'`/`k:'biet'`/`k:'can'` đều có `ch`; sau khi gộp, số beat `node` bằng số ô và không `say` nào còn nhắc "sơ đồ một/hai…". Rà bằng mắt từng `n`: nếu `n` là một mệnh đề (có tên điểm, //, ⊥, =, "thẳng hàng", "là trung điểm"…) thay vì tên định lí/nguồn thì tách thành ô con.
9. **Hiển thị cây** (thêm vào khối bài, KHÔNG sửa engine):
   - Trước SCENES: `(function(){const st=document.createElement('style');st.textContent='.bx{white-space:normal;max-width:9em;padding-left:.3em!important;padding-right:.3em!important}.bx .nt{max-width:9.5em;margin:0 auto}.kids{gap:.3em!important;justify-content:safe center!important}#tree{align-items:safe center!important}';document.head.appendChild(st);})();` và trong `t` dùng ` ` quanh `=`, `+`, `∈`, `⊥`, `//` để công thức không bị ngắt dòng.
   - Ngay trước `boot();`: chép nguyên khối "GỘP SƠ ĐỒ NHÁNH + TỰ THU NHỎ" từ Project doc `mau/khoi_gop_so_do_tu_thu_nho.js` (dự phòng: từ file `Lớp 8\10_Bai3_AMHN_hcn_AI_vuong_goc_MN\Toan8_Bai3_AMHN_hcn_AI_vuong_goc_MN_phan_tich_loi_giai.html` – đoạn bắt đầu `/* ===== GỘP SƠ ĐỒ NHÁNH`). Khối này: (a) CSS `.nd:has(> .bx:not(.show)){display:none}`, `.bx .nt{font-size:.74em!important}`, độ rộng ô theo biến `--bxw`; (b) gộp các cảnh "SƠ ĐỒ (k)" cùng tab vào cảnh sơ đồ chính đã nhắc tới nó (đổi id có tiền tố, thay ô `xem sơ đồ (k)` bằng cây con, lần nhắc sau thành ô `k:'biet'`, nối beat, xoá câu "Phân tích ở sơ đồ …" trong `say`); (c) ghi đè `fitAll`: với sơ đồ thử độ rộng ô 9/12/15/19em và tìm cỡ chữ `--tf` trong [14, 52] cho vừa cả chiều cao và chiều rộng, `--fs` giữ 40px, không bật cuộn; với lời giải giữ tối thiểu 28px.
   - Kiểm thử: nhảy tới ô đầu, giữa, cuối của mỗi sơ đồ, đo `#tree` không vượt `#wrap` (không "TRÀN"), chụp ảnh ô cuối xem thấy trọn cây.

Ví dụ đúng – câu b bài tam giác cân (△<i>ABC</i> cân tại <i>A</i>, đường cao <i>AH</i>, <i>AHCD</i> là hình chữ nhật ở câu a), chứng minh "<i>ADHB</i> là hình bình hành", viết theo 2 phần (khối mã ở 3A.9 tự gộp thành MỘT cây trên một màn hình):
```
SƠ ĐỒ TỔNG QUÁT
<i>ADHB</i> là hình bình hành          n: hai cạnh đối song song và bằng nhau
├─ <i>AD</i> // <i>BH</i>
│   ├─ <i>AD</i> // <i>HC</i>                 n: cạnh đối của hình chữ nhật
│   │   └─ <i>AHCD</i> là hình chữ nhật   [biết] n: câu a
│   └─ <i>B</i>, <i>H</i>, <i>C</i> thẳng hàng       [gt]   n: <i>H</i> ∈ <i>BC</i>
└─ <i>AD</i> = <i>BH</i>                     [can]  n: xem sơ đồ (1)

SƠ ĐỒ (1): <i>AD</i> = <i>BH</i>               n: cùng bằng <i>HC</i>
├─ <i>AD</i> = <i>HC</i>                     n: cạnh đối của hình chữ nhật
│   └─ <i>AHCD</i> là hình chữ nhật       [biết] n: câu a
└─ <i>BH</i> = <i>HC</i>                     n: định nghĩa trung điểm
    └─ <i>H</i> là trung điểm <i>BC</i>         n: định nghĩa đường trung tuyến
        └─ <i>AH</i> là đường trung tuyến   n: tam giác cân: đường cao là trung tuyến
            ├─ △<i>ABC</i> cân tại <i>A</i>      [gt]   n: giả thiết
            └─ <i>AH</i> là đường cao        [gt]   n: giả thiết
```

## 4. Quy tắc viết `say` – đọc toán bằng tiếng Việt
`say` là câu tiếng Việt hoàn chỉnh để máy đọc; TUYỆT ĐỐI không để kí hiệu toán, chữ in hoa dính liền hay HTML trong `say` (máy sẽ đọc sai kiểu tiếng Anh).

Tên điểm – tách từng chữ, đọc theo bảng:
A = a, B = bê, C = xê, D = đê, E = e, F = ép, G = gờ, H = hát, I = i, K = ca, L = e-lờ, M = em, N = en, O = ô, P = pê, Q = quy, R = e-rờ, S = ét, T = tê, U = u, V = vê, X = ích, Y = i dài.
Ví dụ: tam giác ABC → "tam giác a bê xê"; tứ giác AEFD → "tứ giác a e ép đê"; đoạn MN → "em en".

Kí hiệu → lời đọc:
- △ABC → "tam giác a bê xê"; ^{ABC} → "góc a bê xê"; 90° → "90 độ".
- = → "bằng"; ≠ → "khác"; < → "nhỏ hơn"; > → "lớn hơn"; ≤ → "nhỏ hơn hoặc bằng"; + → "cộng"; − → "trừ".
- ⊥ → "vuông góc với"; // → "song song với"; ∈ → "thuộc"; ∉ → "không thuộc"; = giữa hai tam giác → "bằng"; ∽ → "đồng dạng với".
- ⇒ → "suy ra" / "nên" / "do đó"; (lí do) → "vì …" / "theo …".
- 2AD → "hai lần a đê"; AB/2 → "một nửa a bê" (hoặc "a bê chia hai"); a/b số → "a phần b"; AB² → "a bê bình phương"; √AB → "căn bậc hai của a bê"; x₁ → "ích một"; sin²B → "sin bình phương góc bê".
- cm → "xăng-ti-mét"; cm² → "xăng-ti-mét vuông"; số thập phân 2,5 → "hai phẩy năm"; ≈ → "xấp xỉ".
`say` phải nói ĐỦ nội dung dòng chiếu/ô sơ đồ tương ứng (có thể thêm từ nối cho tự nhiên), mỗi `say` là duy nhất (dùng làm khoá giọng nhúng). Trước khi bàn giao, quét bằng script: mọi `say` không chứa kí tự `<>^[]△⊥⇒∈°/` và không chứa cụm 2+ chữ in hoa liền nhau.

**Để chỉ tay/nhấn mạnh khớp lời đọc**: trong `say` phải ĐỌC TÊN từng đối tượng có trong `hl` đúng theo bảng đọc (ví dụ `'p:ADME'` → "tứ giác a đê em e", `'r:ADM'` → "góc a đê em", `'s:MD'` → "em đê", `'t:E'` → "e"), theo đúng thứ tự muốn nhấn mạnh. Đối tượng không được đọc tên sẽ hiện ngay sau đối tượng trước đó. Kiểm tra bằng `hlPositions(beat)` (giá trị tăng dần, không toàn bộ bằng 0 khi dòng có nhiều đối tượng).

## 4A. Khối giọng đọc – GIỌNG NỮ, khớp từng ô (Project doc `mau/khoi_giong_doc.js`, đã gắn trong file mẫu)
- **Xếp hạng giọng, nữ trước**: HoaiMy tự nhiên (Edge) > Google Tiếng Việt (Chrome) > Linh (Mac/iPad) > giọng nữ khác; giọng nam (NamMinh, An) xếp cuối. Lưu lựa chọn của thầy bằng localStorage khoá `tc_voice_nu`, tốc độ `tc_rate` (bọc try/catch).
- **Máy chỉ có giọng nam** (thường là Microsoft An trên Chrome không mạng): tự nâng `pitch` 1,35 cho giọng nhẹ hơn; khi bàn giao nói rõ đây không phải giọng nữ thật, cần mở Edge/Chrome có mạng.
- **Khớp từng ô**: mỗi `say` chia thành đoạn ≤ 150 kí tự theo dấu câu, đọc nối tiếp; chỉ chuyển bước khi đoạn cuối đọc xong (có mã `ST.token` chống đọc chồng), hẹn giờ dự phòng `(8 + số kí tự × 0,17 / tốc độ)` giây.
- **Nút trên thanh**: 🔁 Đọc lại (phím R), ô chọn giọng ghi "– nữ"/"– nam", thanh tốc độ 0,6–1,4× (mặc định 0,85×, khoá `tc_rate_v2`), 🎵 Âm thanh hiệu ứng.
- **Miệng nhân vật**: `onboundary` ghi `VOICE.lastB`, `VOICE.char` để miệng mở theo từng tiếng và để đồng bộ nhấn mạnh. Gọi `pickVoice` lúc 0, 600, 2000 ms và trong `onvoiceschanged`.
- Có `AUDIO_CLIPS` (giọng Gemini nhúng) thì phát clip, `playbackRate` theo tốc độ.
- Kiểm thử bằng Playwright với danh sách giọng giả (Edge: An, NamMinh, HoaiMy → chọn HoaiMy; Chrome: An, Google → chọn Google; chỉ An → pitch 1,35).

Cuối script: khối IIFE kiểm tra số (góc vuông = 90°, đoạn bằng nhau, trung điểm, thẳng hàng…) `console.warn('KIỂM TRA HÌNH SAI')` nếu sai, rồi khối gộp sơ đồ (3A.9), rồi `boot();`.

## 5. Quy trình làm
1. Đọc chính xác đề (ảnh/PDF). Nếu thầy gửi kèm hướng dẫn/sơ đồ mẫu thì bám theo hướng giải đó nhưng vẫn tách ô chi tiết hơn theo 3A. Giải toán, chọn lời giải THCS chặt chẽ, chỉ dùng kiến thức SGK mới (KNTT) đúng lớp; tôn trọng yêu cầu loại trừ của thầy (ví dụ KHÔNG dùng đường trung bình, phải dùng tam giác đồng dạng); có nhiều câu thì tận dụng kết quả câu trước.
2. Chọn toạ độ (đúng tư thế yêu cầu 0.5), kiểm tra mọi quan hệ.
3. Phác cây phân tích đi lên dạng văn bản (như ví dụ mục 3A) cho từng câu, rà lại các quy tắc 3A (đặc biệt 2b), rồi mới viết `tree`.
4. Viết SCENES: đề + dựng hình → phân tích giả thiết → (sơ đồ chi tiết + lời giải chiếu từng ý) cho từng câu; đủ `hl` và `say` cho mọi beat.
5. Kiểm thử bằng Playwright (Chromium có sẵn): tắt tiếng, chế độ Ấn nút, nhảy tới beat cuối từng cảnh (`__go(i)`); chụp khung dựng hình giữa chừng bằng `showBeat(i,true); PLAY.spoke=true;` rồi chờ (thước đang rơi, ê ke xoay, compa trượt, đang kẻ) để xác nhận NHÂN VẬT KHÔNG CHE HÌNH (nét nằm trên người, người mờ khi trong vùng hình), dụng cụ có tên thầy, bàn tay đúng tư thế; chụp cận mắt (chớp) và miệng; chụp các kiểu nhấn mạnh (ép `seed`) xem kí hiệu góc nằm trong góc; bắt lỗi console; chụp ảnh từng sơ đồ khi đã hiện đủ ô để xem thấy TRỌN cây trong khung, không ô nào gộp ý, không bị cắt mép; chụp cảnh lời giải xem chữ không tràn, nhãn không đè hình, nhấn mạnh đúng đối tượng; chụp vài khung dựng hình xem dụng cụ không bị cắt ngoài khung, hình đứng đúng tư thế. Chạy script kiểm tra `say` (mục 4), kiểm tra cây (3A.8), kiểm tra giọng nữ (4A).
6. Lưu vào máy thầy: mỗi bài một thư mục riêng đánh số tiếp theo trong thư mục lớp – LUÔN `device_list_dir` thư mục lớp ngay trước khi lưu để lấy số lớn nhất hiện có (các phiên khác có thể đã dùng số đó), ví dụ `Lớp 8\11_<noi_dung>\Toan8_<noi_dung>_phan_tich_loi_giai.html`; giọng Gemini trong `giong_doc\`; stage `MUC_LUC_LOP_<n>.txt`, thêm mục mới (bổ sung mục còn thiếu cho các thư mục đã có), commit lại. Thư mục lớp chưa được cấp quyền thì xin quyền (device_request_folder_access).
   - **Lưu chắc chắn**: chép file vào `/mnt/user-data/outputs/` xong mới commit (không chạy song song). Khi ghi ĐÈ một file đã gửi trước đó, commit theo `stagedPath` có thể ghi bản cũ → hãy `SendUserFile` bản mới rồi commit bằng `fileUuid` vừa nhận. Sau commit, `device_list_dir` so dung lượng với file trong máy làm việc; lệch thì commit lại.
   - Nếu máy thầy mất kết nối thì gửi file và lưu lại ngay khi kết nối trở lại, báo rõ đường dẫn.

## 6. Giọng Gemini (tuỳ chọn, khi thầy cần giọng hay hơn giọng máy)
- Tạo thư mục `giong_doc\giong_gemini_<bai>` gồm `kich_ban.txt` (mỗi cảnh `## Cảnh k: tên`, mỗi dòng đúng 1 câu `say`), sao chép `tao_giong_gemini.ps1` + `BAM_DUP_TAO_GIONG.bat` từ `Lớp 8\04_Bai4_ADME_hcn_AMCF_hinh_thoi\giong_doc\giong_gemini_bai4_hcn_hthoi`. Chọn giọng NỮ của Gemini (ví dụ Kore hoặc Aoede) cho đồng bộ với giọng máy; khoá API trong `D:\soạn cho giáo viên thi\key`. Thầy bấm đúp .bat → `wav/canh_XX.wav`.
- Sau đó cắt từng wav theo khoảng lặng thành từng câu, nén mp3, nhúng vào `AUDIO_CLIPS={"câu say":["data:audio/mpeg;base64,…",giây]}`; câu nào thiếu clip thì engine tự dùng giọng máy (giọng nữ). Không bao giờ in khoá API ra hội thoại.
- Có thể ghép video thuyết minh MP4 nếu thầy yêu cầu.

## 7. Bàn giao
Nhắc thầy: âm thanh hiệu ứng chỉ phát sau lần bấm đầu tiên trên trang (trình duyệt bắt buộc); file có nhúng ảnh khuôn mặt thầy. Trả lời ngắn: đường dẫn file trên máy thầy, các tab có trong file, tóm tắt đáp án từng câu, cách dùng (Tự động / Ấn nút, Space để sang bước, R đọc lại, mở bằng Edge để có giọng nữ HoaiMy tự nhiên, hoặc Chrome để có giọng nữ Google). Đề xuất 1 cải tiến thiết thực nếu có.