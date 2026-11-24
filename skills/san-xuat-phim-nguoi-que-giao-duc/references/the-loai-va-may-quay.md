# Thể loại phim, vai diễn, ngôn ngữ máy quay và âm thanh

Phim người que không chỉ để giảng bài. Kịch bản quyết định thể loại; mỗi thể loại có cách chọn nhân vật, bối cảnh, góc máy, nhịp dựng và âm thanh riêng. Bảng dưới là "bộ đồ nghề" để em chọn nhanh.

Mục lục: 1. Bảng thể loại · 2. Vai diễn có sẵn · 3. Ngôn ngữ máy quay · 4. Hoạt hình kiểu Manim · 5. Âm thanh theo thể loại · 6. Chuyển cảnh

## 1. Bảng thể loại

| Thể loại | Nhân vật (role) | Phông | Máy quay chủ đạo | Âm thanh | Nhịp |
|---|---|---|---|---|---|
| Giáo dục / giảng bài | `giao-vien`, `hoc-sinh` | `classroom`, `whiteboard`, `manimgrid` | trung cảnh, cận khi chốt | `ding`, `marker`, nhạc `story` nhỏ | vừa, có quiz |
| Cổ tích / truyền thuyết | `vua`, `cong-chua`, `hiep-si`, `phu-thuy`, `nong-dan`, `ong-gia` | `castle`, `forest`, `park`, `night` | toàn cảnh mở đầu (dolly out), máy bám theo hành trình | nhạc `story`, `magic`, `mystery` | chậm – vừa, người dẫn chuyện |
| Hành động / võ thuật | `vo-si`, `ninja`, `samurai`, `sieu-nhan` | `dojo`, `rooftop`, `city`, `forest` | góc thấp, lia nhanh (`whip`), rung khung, cận đòn đánh | `punch`, `kickhit`, `swish`, `fall`, `crowd`, nhạc `tension` | rất nhanh, nhịp `gap: 0` |
| Hài | bất kì | `street`, `home`, `market` | phóng nhanh (crash zoom: `zoom` 2.5, `dur` 0.2), cận mặt phản ứng | `boing`, `fail`, `oof`, `laugh`, `slap`, `surprise` | nhanh, có khoảng lặng trước "miếng hài" |
| Phiêu lưu | `hiep-si`, `hai-tac`, `cao-boi`, `phi-hanh-gia` | `forest`, `beach`, `castle`, `space` | máy bám theo khi chạy, toàn cảnh rộng, tiền cảnh trôi | nhạc `intro`, `wow`, `whoosh` | nhanh dần |
| Khoa học viễn tưởng | `robot`, `nha-khoa-hoc`, `phi-hanh-gia` | `lab`, `space`, `city` (đêm: `rooftop`) | góc nghiêng (dutch) khi nguy hiểm, cận màn hình | `magic2`, `boom`, `mystery` | vừa |
| Hồi hộp / bí ẩn (cho học sinh, không rùng rợn) | bất kì | `night`, `forest` | dutch, cận đặc tả mắt, máy cầm tay (`handheld`) | `mystery`, `tension`, nhạc `tension` | chậm rồi bùng |
| Thể thao | `cau-thu`, `vo-si` | `park`, `stage` | bám theo, quay chậm bằng `dur` dài | `crowd`, `whoosh`, `bell` | nhanh |
| Kĩ năng sống / an toàn | `hoc-sinh`, `canh-sat`, `bac-si`, `linh-cuu-hoa` | `street`, `home`, `city` | trung cảnh, cận cảnh báo | `wrong`, `ding`, `surprise` | vừa, chốt khẩu hiệu |
| Lịch sử / danh nhân | trang phục theo thời kì (`linh`, `vua`, `nong-dan`…) | `castle`, `forest`, `stage` | toàn cảnh trang nghiêm, góc thấp cho nhân vật lớn | nhạc `story`, `bell` | chậm; **chỉ dùng sự kiện đã kiểm chứng** |

Kết hợp thể loại là bình thường (vd. cổ tích + hoạt hình toán Manim như `examples/hiep-si-parabol.film.js`).

## 2. Vai diễn có sẵn (`role`)
Khai báo `role` trong `cast`, mọi thuộc tính khác vẫn ghi đè được (`{ role: "vua", cape: "#1565c0" }`):
`giao-vien`, `hoc-sinh`, `tre-em`, `ong-gia`, `ba-gia`, `nong-dan` (nón lá), `vua` (vương miện, áo choàng), `cong-chua`, `hiep-si` (mũ giáp, kiếm, khiên), `linh` (giáo), `phu-thuy` (mũ nhọn, gậy phép phát sáng), `ninja`, `samurai` (katana), `vo-si`, `sieu-nhan` (áo choàng bay, mặt nạ), `hai-tac` (bịt mắt, kiếm), `cao-boi`, `phi-hanh-gia` (mũ kính), `robot` (đầu vuông, đèn ăng-ten, mắt sáng), `nha-khoa-hoc`, `bac-si`, `canh-sat`, `linh-cuu-hoa`, `dau-bep`, `cau-thu`, `quai-vat` (sừng, da xanh).
Phụ kiện lẻ: `hat` (`crown`, `wizard`, `knight`, `space`, `pirate`, `cowboy`, `chef`, `police`, `fire`, `nonla`, `ninja`, `cap`, `grad`, `hard`), `cape` (màu), `mask: "eye"`, `eyepatch`, `horns`, `robot`, `hold`/`hold2` (`sword`, `katana`, `shield`, `staff`, `wand`, `cane`, `spear`, `pointer`, `book`, `phone`, `flag`…).
Trên phông tối (`night`, `rooftop`, `space`, `manim`, `manimgrid`) nét người que tự đổi sang trắng.

## 3. Ngôn ngữ máy quay (2.5D – cảm giác phim 3D)
Phông nền nhiều lớp (bầu trời xa, đồi/thành phố giữa, mặt đất gần, tiền cảnh sát máy) trôi với tốc độ khác nhau khi máy di chuyển → có chiều sâu. Khi máy phóng to, hậu cảnh tự nhoè (độ sâu trường ảnh). Nhân vật có `z` (0 = gần, 300–700 = xa hơn) sẽ nhỏ lại, đứng cao hơn trên mặt đất và trôi chậm hơn.

`cam` trong một nhịp (đổi mượt trong `dur` giây; `dur: 0` = cắt cảnh):
| Trường | Ý nghĩa |
|---|---|
| `shot` | `wide` (toàn cảnh), `full` (toàn thân), `medium` (trung cảnh), `close` (cận), `extreme` (đặc tả), `two` (hai người), `ots` (qua vai, cần `from`) |
| `on` | nhân vật hoặc mảng nhân vật cần đóng khung; tự đặt theo bố cục 1/3, chừa khoảng trống phía nhân vật nhìn (`center: true` để đặt giữa) |
| `angle` | `low` (góc thấp: nhân vật oai, mạnh), `high` (góc cao: nhỏ bé, yếu thế), `dutch` (nghiêng: căng thẳng, kì quặc; `dutch` = độ), `eye` (về ngang tầm mắt) |
| `follow`, `lead` | máy bám theo nhân vật khi đi/chạy, `lead` = chừa khoảng phía trước; `follow: null` để thôi bám |
| `x`, `y`, `zoom`, `rot` | đặt tay vị trí/độ phóng/xoay |
| `whip: true` | lia máy cực nhanh có nhoè chuyển động + tiếng vụt |
| `handheld: 0–1` | máy cầm tay rung nhẹ (hồi hộp, phóng sự) |
| `letterbox: true/false` | dải đen điện ảnh trên/dưới |
| `dof` | độ nhoè hậu cảnh (px); mặc định tự theo `zoom` |
Cảnh có thể khai báo `cam` khởi đầu (`scenes[i].cam`) và `fg: false` để tắt tiền cảnh.

Ngữ pháp dựng phim nên theo:
- **Mở cảnh bằng toàn cảnh** (establishing), có thể bắt đầu cận rồi lùi ra (`cam` đầu cảnh zoom 1.7 → nhịp đầu `shot: "wide"`, `dur` 3–4).
- **Đối thoại: shot – reverse shot.** Cận người nói A → cận người nói B, giữ đúng phía (quy tắc 180°: A luôn bên trái, B luôn bên phải). Mở/đóng đoạn đối thoại bằng `two`.
- **Cảm xúc mạnh → cận/đặc tả**; **sức mạnh → góc thấp**; **yếu thế → góc cao**; **bất an → dutch/handheld**.
- **Chạy/đuổi → `follow`** + tiền cảnh trôi; chuyển nhanh sang nhân vật khác → `whip`.
- **Hài → crash zoom** (`zoom` 2.5–3, `dur` 0.15–0.25) vào mặt phản ứng + `boing`/`surprise`.
- Không đổi góc máy liên tục vô cớ: mỗi lần đổi phải có lí do (người nói đổi, cảm xúc đổi, hành động mới). Cảnh giảng bài giữ máy ổn định để học sinh đọc chữ.
- Khi máy phóng to, bóng thoại vẫn hiển thị đúng cỡ chữ chuẩn (vẽ theo màn hình), không bị phóng theo.

## 4. Hoạt hình kiểu Manim (toán học động)
Phông `manim` (đen) hoặc `manimgrid` (lưới mặt phẳng toạ độ). Đối tượng: `axes` (`xmin,xmax,ymin,ymax,w,h,step,stepY,grid,xlabel,ylabel`), `graph` (`axes`, `fn` như `"x^2"`, `"2*x^2-3"`, `"sin(x)"`, `x0,x1,color,label`), `dot` (`on` = graph, `u` = hoành độ; hoặc `x,y`), `seg` (`x1,y1,x2,y2`), `poly` (`points`, `fill`, `labels`), `circ` (`r`), `text` (mini-TeX).
Hiện ra có hiệu ứng: `show: { ..., anim: "create" | "write" | "fadein" | "grow", dur }`.
Hoạt hình trên đối tượng đã có: `anim: [{ do, id, at, dur, ... }]`
| `do` | Tác dụng (tương đương Manim) | Âm thanh tự động |
|---|---|---|
| `create` / `uncreate` | vẽ dần / xoá dần nét (Create) | `shimmer` |
| `write` | viết dần chữ/công thức (Write) | `marker` |
| `fadein` / `fadeout` (`shift: [dx,dy]`) | hiện/mờ dần có trượt (FadeIn/FadeOut) | — |
| `grow` | phóng từ tâm (GrowFromCenter) | `pop` |
| `transform` (`to: { text, fn, points, color, x, y, scale }`) | biến hình công thức/đồ thị/đa giác (Transform) | `whoosh` |
| `indicate` | phóng nhẹ + vàng (Indicate) | `ding` |
| `circumscribe` | khung vàng chạy quanh (Circumscribe) | `swish` |
| `flash` | tia sáng toả (Flash) | `pop` |
| `along` (`graph`, `from`, `to`) | điểm chạy trên đồ thị (MoveAlongPath) | — |
| `move` (`x,y,scale,rot`) | di chuyển | — |
Tắt/đổi tiếng: `sfx: false` hoặc `sfx: "magic"` trong từng anim. Đối tượng chưa có có thể tạo ngay trong anim bằng `item: {...}`.
Kiểm tra lại toán: đồ thị, toạ độ, nhãn phải đúng tuyệt đối.

## 5. Âm thanh theo thể loại (bộ TiengDong.com + tổng hợp)
- Nhạc nền: `FILM.music = "story" | "intro" | "tension"` (lặp, tự nhỏ lại khi có lời) hoặc `true` (nhạc tổng hợp nhẹ).
- Hành động: `punch` (tự xoay vòng 4 tiếng), `kickhit`, `animepunch`, `swish`, `swish2`, `fall`, `bell`, `crowd`, `ko`, `boom`.
- Phép thuật/viễn tưởng: `magic`, `magic2`, `shimmer`, `mystery`, `wow`.
- Hài/bất ngờ: `surprise` (tèn tèn ten), `fail`, `oof`, `laugh`, `slap`, `boing`, `wow`.
- Kết thúc: `victory`, `tada`, `applause`.
- Lớp học: `bell`, `ding`, `correct`, `wrong`, `marker`, `chalk`, `tick`.
Nguyên tắc: mỗi hành động trên hình có một tiếng tương ứng đúng khoảnh khắc (dùng `at`); tiếng nền dài (`crowd`, `mystery`) đặt `vol` 0.3–0.6 và `len` để cắt; không chồng quá 2 tiếng mạnh cùng lúc; luôn ghi nguồn "Âm thanh: TiengDong.com".

## 6. Chuyển cảnh
`scenes[i].trans`: `fade` (mờ từ đen), `iris` (vòng tròn mở — hợp cổ tích, hài), `wipe` (quét ngang), `flash` (chớp trắng — phép thuật, hồi tưởng, đổi thế giới); `transDur` giây (mặc định 0,6). Không khai báo = cắt thẳng.
