// PHIM NGANG 16:9 (1920×1080): "CẠNH HUYỀN LÀ ĐƯỜNG KÍNH" — 4 định lí về tam giác vuông và đường tròn (Toán 9, KNTT)
// Mở đầu hài: Bin nhét bánh mì tam giác vuông vào hộp cơm tròn mãi không vừa → Thầy Chung xoay cạnh huyền trùng đường kính → vừa khít.
// Phần chính kiểu Manim: bảng tối phía trên, hình được vẽ bằng THƯỚC + BÚT CHÌ + COMPA; lời giải hiện dần kèm tiếng gõ phím
// (Thầy Chung ngồi gõ laptop phía dưới, Bin – Na đứng xem và phản ứng). Mọi chuyển động đều có tiếng; nhạc nền nhẹ dưới giọng.
//  ĐL1  ΔABC vuông tại A ⇒ A, B, C thuộc đường tròn đường kính BC.
//  ĐL2  A thuộc đường tròn đường kính BC (A ≠ B, C) ⇒ góc BAC = 90°.
//  ĐL3  Hai điểm A, D cùng nhìn BC dưới góc vuông ⇒ A, B, C, D cùng thuộc đường tròn đường kính BC.
//  ĐL4  Hình chữ nhật ABCD ⇒ bốn đỉnh thuộc đường tròn đường kính AC, tâm là giao điểm hai đường chéo.
(function () {
  const GOLD = "#ffd54f", BLUE = "#7cc4ff", RED = "#ff6e6e", GREEN = "#7ee787", WHITE = "#f3f1e8";
  const TEACHER = { name: "Thầy Chung", voice: "nam", hair: "short", glasses: true, shirt: "#1e88e5" };
  const BIN = { name: "Bin", voice: "tre", hair: "spiky", shirt: "#ff9800", hat: "cap", hatColor: "#e53935", scale: 0.86 };
  const NA = { name: "Na", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.8 };
  const HIDE = { x: -3000, hidden: true };
  const rd = (d) => (d * Math.PI) / 180;

  // ---------------- BẢNG MANIM (toạ độ màn hình) ----------------
  const O = [1320, 352], R = 200, on = (deg) => [O[0] + R * Math.cos(rd(deg)), O[1] + R * Math.sin(rd(deg))];
  let IDS = [];
  const reg = (it) => { IDS.push(it.id); return it; };
  const wipe = () => { const h = IDS.slice(); IDS = []; return h; };
  const ang = (A, B) => (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
  const unit = (A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy); return [dx / d, dy / d]; };
  const dot = (id, P, label, left, color, at) => reg({ id, type: "dot", screen: true, x: P[0], y: P[1], r: 11, color: color || WHITE, label, labelSide: left ? "left" : "right", size: 58, at: at || 0, sfx: "pop", z: 6 });
  const seg = (id, A, B, o) => reg(Object.assign({ id, type: "seg", screen: true, x: 0, y: 0, x1: A[0], y1: A[1], x2: B[0], y2: B[1], color: WHITE, width: 6, anim: "create", dur: 0.8, sfx: "pencil", z: 4 }, o || {}));
  const rmark = (id, P, U, V, at) => { const u = unit(P, U), v = unit(P, V), s = 30;
    return reg({ id, type: "poly", screen: true, x: 0, y: 0, points: [[P[0] + u[0] * s, P[1] + u[1] * s], [P[0] + (u[0] + v[0]) * s, P[1] + (u[1] + v[1]) * s], [P[0] + v[0] * s, P[1] + v[1] * s]], close: false, color: GOLD, width: 5, at: at || 0, sfx: "tick", z: 5 }); };
  const tick = (id, P, Q, at, color) => { const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], u = unit(P, Q), n = [-u[1] * 18, u[0] * 18];
    return reg({ id, type: "seg", screen: true, x: 0, y: 0, x1: m[0] - n[0], y1: m[1] - n[1], x2: m[0] + n[0], y2: m[1] + n[1], color: color || RED, width: 6, at: at || 0, sfx: "tick", z: 5 }); };
  // dòng lời giải: hiện dần kèm tiếng gõ phím
  const LY = [628, 712, 796];
  const line = (id, k, text, at, color) => reg({ id, type: "text", screen: true, text, x: 770, y: LY[k], size: 50, color: color || WHITE, align: "left", anim: "write", dur: Math.min(3.2, 0.06 * text.length + 0.5), at: at || 0, sfx: "type", z: 6 });
  // thước + bút chì
  const RW = 560;
  const rulerIn = (A, B, extra) => Object.assign({ show: { id: "ru", type: "ruler", screen: true, w: RW, unit: 46, x: 1950, y: 1100, rot: ang(A, B) - 540, scale: 0.3, pop: false, sfx: false, z: 7 },
    anim: { do: "move", id: "ru", x: A[0], y: A[1], rot: ang(A, B), scale: 1, dur: 0.8, sfx: false }, sfx: [{ name: "whoosh" }, { name: "slide", at: 0.35, dur: 0.4 }, { name: "click", at: 0.8 }], wait: 0.2, gap: 0 }, extra || {});
  const rulerMove = (A, B, extra) => Object.assign({ anim: [{ do: "move", id: "ru", x: A[0], y: A[1], rot: ang(A, B), dur: 0.6, sfx: false }],
    sfx: [{ name: "slide", dur: 0.6 }, { name: "click", at: 0.6 }], wait: 0.1, gap: 0 }, extra || {});
  const rulerDraw = (id, A, B, D, o, extra) => Object.assign({ show: [{ id: "pc", type: "pencil", screen: true, x: A[0], y: A[1], z: 8, pop: false, sfx: false }, seg(id, A, B, Object.assign({ dur: D }, o || {}))],
    anim: { do: "move", id: "pc", x: B[0], y: B[1], dur: D, sfx: false }, gap: 0 }, extra || {});
  const rulerOut = (extra) => Object.assign({ anim: [{ do: "move", id: "ru", x: 2300, y: -300, rot: 300, scale: 0.4, dur: 0.6, sfx: false }, { do: "fadeout", id: "pc", dur: 0.3, sfx: false }],
    sfx: [{ name: "whoosh" }], wait: 0.1, gap: 0 }, extra || {});
  // compa: bay vào, đặt kim tại tâm, quay một vòng (đầu chì chạy đúng nét tròn)
  const compIn = (C, r, a0, extra) => Object.assign({ show: { id: "cp", type: "compass", screen: true, x: 1950, y: -200, r, ang: a0, scale: 0.4, pop: false, sfx: false, z: 8 },
    anim: { do: "move", id: "cp", x: C[0], y: C[1], scale: 1, dur: 0.8, sfx: false }, sfx: [{ name: "whoosh" }, { name: "click", at: 0.8 }, { name: "click", at: 0.9 }], wait: 0.2, gap: 0 }, extra || {});
  const compDraw = (id, C, r, a0, D, color, extra) => Object.assign({ show: reg({ id, type: "circ", screen: true, x: C[0], y: C[1], r, from: a0, color: color || GOLD, width: 6, anim: "create", dur: D, sfx: "compass", z: 3 }),
    tween: { id: "cp", ang: a0 + 360, dur: D }, gap: 0 }, extra || {});
  const compOut = (extra) => Object.assign({ anim: { do: "move", id: "cp", x: 2300, y: -400, scale: 0.4, dur: 0.6, sfx: false }, sfx: [{ name: "whoosh" }], wait: 0.1, gap: 0 }, extra || {});
  // thẻ GHI NHỚ
  const card = (title, lines, extra) => Object.assign({
    show: [{ id: "gp", type: "panel", screen: true, x: 1320, y: 430, w: 1120, h: 150 + lines.length * 92, color: "rgba(10,24,18,.97)", border: GOLD, title: "★ " + title, titleColor: GOLD, size: 56, anim: "grow", dur: 0.5, sfx: "magic", z: 20 },
      ...lines.map((t, i) => ({ id: "g" + i, type: "text", screen: true, text: t, x: 1320, y: 430 - (lines.length * 92) / 2 + 110 + i * 92, size: 54, color: i === lines.length - 1 ? GOLD : WHITE, align: "center", anim: "write", dur: 0.9, at: 0.4 + i * 0.5, sfx: "type", z: 21 }))],
    anim: { do: "circumscribe", id: "g" + (lines.length - 1), at: 0.8 + lines.length * 0.5, dur: 1.2, sfx: "ding" }, act: { bin: { pose: "clap" }, na: { pose: "clap" } } }, extra || {});
  const uncard = (n) => ({ hide: ["gp", ...Array.from({ length: n }, (_, i) => "g" + i)], act: { bin: { pose: "idle" }, na: { pose: "idle" } }, sfx: [{ name: "whoosh", vol: 0.5 }], wait: 0.4, gap: 0 });
  const title = (k, name) => ({ set: { id: "pn", title: `Định lí ${k} · ${name}` }, fx: { type: "text", x: 1035, y: 521, text: `ĐỊNH LÍ ${k}`, color: GOLD, dur: 1.4 }, sfx: [{ name: "boom", vol: 0.5 }, { name: "shimmer", at: 0.3 }], wait: 1.2, gap: 0 });
  const typing = { thay: { pose: "sittype" } };

  // ---------------- CẢNH MỞ ĐẦU: hộp cơm tròn & bánh mì tam giác ----------------
  const HB = [960, 450], HR = 255;                                             // hộp cơm (toạ độ thế giới)
  const TRI = [[-HR, 0], [HR, 0], [HR * Math.cos(rd(-115)), HR * Math.sin(rd(-115))]];
  const vtx = TRI.map((p) => [HB[0] + p[0], HB[1] + p[1]]);

  window.FILM = {
    title: "Cạnh huyền là đường kính",
    subtitle: "4 định lí · Toán 9",
    file: "canh-huyen-la-duong-kinh-169",
    watermark: "Lớp Toán Thầy Chung",
    music: "story",
    subSize: 72,
    bubbles: false,
    cast: { thay: TEACHER, bin: BIN, na: NA },
    scenes: [
      // ===================== 1. GIỜ RA CHƠI: bánh mì không chịu vào hộp =====================
      { bg: "park", trans: "iris",
        cast: { thay: { x: 2150, pose: "idle", face: "happy", flip: true }, bin: { x: -200, pose: "idle", face: "happy" }, na: { x: 1480, pose: "idle", face: "happy", flip: true } },
        beats: [
          { title: { text: "CẠNH HUYỀN LÀ ĐƯỜNG KÍNH", sub: "4 định lí · Toán 9 · Lớp Toán Thầy Chung", dur: 3.2, bgColor: "rgba(16,20,30,.94)", color: GOLD, subColor: "#cfd8dc" }, sfx: [{ name: "boom", vol: 0.7 }, { name: "magic", at: 0.4, vol: 0.6 }] },
          { who: "bin", say: "Giờ ra chơi! Ăn bánh mì thôi!", pose: "cheer", face: "happy", move: { who: "bin", to: 560, dur: 1.6, style: "run" },
            show: [{ id: "box", type: "circ", x: HB[0], y: HB[1], r: HR, color: "#29b6f6", width: 16, fill: true, anim: "grow", dur: 0.5, at: 1.2, sfx: "pop", z: 1 },
              { id: "sw", type: "poly", x: 620, y: 520, rot: -35, points: TRI, color: "#a0522d", width: 8, fill: "#ffe0a3", fillAlpha: 0.95, at: 1.0, sfx: "pop", z: 3 }] },
          { who: "bin", say: "Mẹ làm bánh mì hình tam giác vuông... mà hộp cơm lại hình tròn. Nhét vào nào!", sub: "Bánh tam giác vuông… hộp lại hình tròn. Nhét vào nào!", pose: "hold", face: "happy" },
          // lần 1: góc chọc ra ngoài
          { tween: { id: "sw", x: 1000, y: 430, rot: 28, dur: 0.8 }, act: { bin: { pose: "give" } }, sfx: [{ name: "slide", dur: 0.8 }, { name: "slap", at: 0.8, vol: 0.7 }, { name: "wrong", at: 1.0 }],
            fx: { type: "text", x: 1300, y: 200, text: "CHỌC RA!", color: RED, at: 0.85, dur: 1.0 }, shake: { at: 0.8, amp: 8, dur: 0.2 }, wait: 1.3, gap: 0 },
          { who: "bin", say: "Ơ? Lòi một góc ra ngoài!", pose: "surprised", face: "surprised" },
          // lần 2: xoay kiểu khác — lại lòi góc khác
          { tween: { id: "sw", x: 920, y: 490, rot: 95, dur: 0.7 }, act: { bin: { pose: "give", face: "angry" } }, sfx: [{ name: "slide", dur: 0.7 }, { name: "slap", at: 0.7, vol: 0.7 }, { name: "fail", at: 0.9, vol: 0.8 }],
            fx: { type: "text", x: 960, y: 150, text: "LẠI LÒI!", color: RED, at: 0.75, dur: 1.0 }, wait: 1.2, gap: 0 },
          // lần 3: ấn mạnh → bánh bật ngược trúng mặt Bin
          { who: "bin", say: "Vào đi mà!", pose: "punch", face: "angry", sfx: [{ name: "swish" }] },
          { tween: { id: "sw", x: 600, y: 640, rot: 250, dur: 0.35 }, act: { bin: { pose: "hit", snap: 0.07, face: "surprised", delay: 0.3 } },
            fx: { type: "hit", on: "bin", part: "head", at: 0.3, text: "BỐP!", color: "#ff7043" }, sfx: [{ name: "boing" }, { name: "slap", at: 0.3 }, { name: "laugh", at: 0.8, vol: 0.8 }],
            shake: { at: 0.3, amp: 18, dur: 0.3 }, wait: 1.3, gap: 0 },
          { who: "na", say: "Ha ha ha! Bánh mì đánh lại cậu kìa!", pose: "clap", face: "happyclosed", act: { bin: { pose: "dizzy", face: "sad" } } },
          { who: "bin", say: "Cái hộp này bị lỗi rồi! Em đem trả mẹ!", pose: "angry", face: "angry", tween: { id: "sw", x: 620, y: 520, rot: -35, dur: 0.5 }, sfx: [{ name: "whoosh", vol: 0.5 }] },
          // Thầy Chung bước vào
          { who: "thay", say: "Hộp không lỗi đâu Bin. Em đặt sai cạnh thôi!", pose: "explain", face: "happy", move: [{ who: "thay", to: 1330, dur: 2.4, style: "walk" }, { who: "na", to: 1600, dur: 1.0, style: "walk", face: "left" }] },
          { who: "thay", say: "Xoay cho cạnh dài nhất, cạnh huyền, nằm đúng đường kính của hộp.", sub: "Cạnh huyền nằm đúng đường kính của hộp!", pose: "point", face: "happy",
            tween: { id: "sw", x: HB[0], y: HB[1], rot: 0, dur: 1.4 }, act: { bin: { pose: "surprised", face: "surprised" } },
            show: [{ id: "dm", type: "seg", x: 0, y: 0, x1: HB[0] - HR, y1: HB[1], x2: HB[0] + HR, y2: HB[1], color: "#e53935", width: 7, dash: true, anim: "create", dur: 0.8, at: 1.5, sfx: "pencil", z: 4 }],
            sfx: [{ name: "magic", vol: 0.7 }, { name: "slide", at: 0.2, dur: 1.2 }, { name: "click", at: 1.4 }] },
          { show: vtx.map((p, i) => ({ id: "vx" + i, type: "dot", x: p[0], y: p[1], r: 16, color: GOLD, at: 0.1 + i * 0.4, sfx: "ding", z: 5 })),
            fx: { type: "text", x: 960, y: 140, text: "VỪA KHÍT!", color: GOLD, at: 1.3, dur: 1.6 }, sfx: [{ name: "tada", at: 1.3, vol: 0.7 }], wait: 2.4, gap: 0 },
          { who: "bin", say: "Ủa?! Ba góc chạm đúng vành hộp... vừa khít luôn!", pose: "cheer", face: "happy" },
          { who: "na", say: "Thầy ơi, sao thầy biết hay vậy?", pose: "ask", face: "surprised", flip: true },
          { who: "thay", say: "Không phải phép thuật... mà là toán! Vào lớp, thầy cho xem bốn định lí!", pose: "pointup", face: "happy", sfx: [{ name: "ding", at: 2.4 }] },
          { who: "bin", say: "Dạ! Nhưng... cho em ăn bánh trước được không ạ?", pose: "hold", face: "happyclosed", tween: { id: "sw", scale: 0.7, dur: 0.4 },
            sfx: [{ name: "pop", at: 1.6 }, { name: "pop", at: 1.9 }, { name: "laugh", at: 2.2, vol: 0.7 }] }
        ] },

      // ===================== 2. LỚP HỌC KIỂU MANIM: 4 định lí =====================
      { bg: "manim", trans: "iris", cam: { x: 758, y: 606, zoom: 1.3 },   // phóng to nhân vật ở nửa trái; bảng gắn màn hình không bị ảnh hưởng
        cast: { thay: { x: 300, pose: "sit", face: "happy" }, bin: { x: 70, pose: "idle", face: "happy" }, na: { x: 172, pose: "idle", face: "happy" } },
        items: [{ id: "dk", type: "desk", x: 480, y: 960, w: 260, h: 200 }, { id: "lp", type: "laptop", x: 465, y: 760, w: 180, sh: 150 }],
        beats: [
          { show: { id: "pn", type: "panel", screen: true, x: 1320, y: 430, w: 1160, h: 800, title: "Cạnh huyền là đường kính", titleColor: GOLD, size: 50, anim: "fadein", dur: 0.5, sfx: "shimmer", z: 0 },
            who: "thay", say: "Mở máy, lấy thước, lấy compa... bắt đầu nào!", pose: "sittype", sfx: [{ name: "type", dur: 1.5, at: 0.3 }] },
          // ---------- ĐỊNH LÍ 1 ----------
          title(1, "Tam giác vuông"),
          rulerIn(on(180), on(0), { who: "thay", say: "Cho tam giác A B C vuông tại A. Kẻ cạnh huyền B C trước.", sub: "Cho ΔABC vuông tại A. Kẻ cạnh huyền BC.", pose: "explain" }),
          rulerDraw("d1bc", on(180), on(0), 1.0, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(180)[0], y: on(180)[1], z: 8, pop: false, sfx: false }, seg("d1bc", on(180), on(0), { dur: 1.0 }), dot("d1B", on(180), "B", true, WHITE, 0.1), dot("d1C", on(0), "C", false, WHITE, 1.0)] }),
          rulerMove(on(180), on(-115)),
          rulerDraw("d1ba", on(180), on(-115), 0.7, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(180)[0], y: on(180)[1], z: 8, pop: false, sfx: false }, seg("d1ba", on(180), on(-115), { dur: 0.7 }), dot("d1A", on(-115), "A", true, WHITE, 0.7)] }),
          rulerMove(on(-115), on(0)),
          rulerDraw("d1ac", on(-115), on(0), 0.8),
          rulerOut({ show: rmark("d1r", on(-115), on(180), on(0), 0.3) }),
          { who: "thay", say: "Lấy O là trung điểm của cạnh huyền B C.", sub: "O là trung điểm của cạnh huyền BC.", pose: "point", show: [dot("d1O", O, "O", false, GOLD, 0.3), tick("d1t1", on(180), O, 0.8), tick("d1t2", O, on(0), 1.0)] },
          compIn(O, R, 180, { who: "thay", say: "Lấy compa: kim tại O, mở rộng đến B... quay một vòng!", sub: "Compa: kim tại O, mở đến B, quay một vòng!", pose: "explain" }),
          compDraw("d1c", O, R, 180, 3.0, GOLD, { act: { bin: { pose: "think", face: "thinking" } } }),
          compOut({ anim: [{ do: "move", id: "cp", x: 2300, y: -400, scale: 0.4, dur: 0.6, sfx: false }, { do: "flash", id: "d1A", at: 0.3, dur: 0.6, sfx: "ding" }] }),
          { who: "bin", say: "Ơ kìa! Nét compa đi qua cả điểm A!", pose: "surprised", face: "surprised", fx: { type: "text", x: 927, y: 300, text: "QUA A!", color: GOLD, dur: 1.2 }, sfx: [{ name: "wow", vol: 0.7 }] },
          { who: "thay", say: "Vì A O là trung tuyến ứng với cạnh huyền, nên A O bằng nửa B C.", sub: "AO là trung tuyến ứng với cạnh huyền ⇒ AO = BC : 2", act: typing,
            show: [seg("d1ao", on(-115), O, { color: BLUE, dash: true, dur: 0.6 }), tick("d1t3", on(-115), O, 0.8), line("d1l1", 0, "AO là trung tuyến ứng với cạnh huyền", 0.3)] },
          { who: "thay", say: "Suy ra O A bằng O B bằng O C. Vậy A thuộc đường tròn đường kính B C!", sub: "⇒ OA = OB = OC ⇒ A thuộc đường tròn đường kính BC", act: typing,
            show: [line("d1l2", 1, "⇒ OA = OB = OC = \\frac{BC}{2}", 0.2), line("d1l3", 2, "⇒ A thuộc đường tròn đường kính BC", 2.4, GOLD)] },
          card("ĐỊNH LÍ 1", ["Tam giác vuông thì ba đỉnh", "thuộc đường tròn có", "đường kính là cạnh huyền"],
            { who: "thay", say: "Định lí một: Tam giác vuông thì ba đỉnh thuộc đường tròn có đường kính là cạnh huyền!", sub: "Tam giác vuông ⇒ 3 đỉnh thuộc đường tròn đường kính là cạnh huyền", pose: "pointup" }),
          { ...uncard(3), hide: ["gp", "g0", "g1", "g2", ...wipe()] },

          // ---------- ĐỊNH LÍ 2 ----------
          title(2, "Điều ngược lại"),
          compIn(O, R, -90, { who: "thay", say: "Ngược lại: vẽ đường tròn tâm O...", sub: "Ngược lại: vẽ đường tròn tâm O…", pose: "explain" }),
          compDraw("d2c", O, R, -90, 2.6, WHITE),
          compOut({ show: dot("d2O", O, "O", false, GOLD, 0.2) }),
          rulerIn(on(180), on(0), { who: "thay", say: "...kẻ đường kính B C, rồi lấy điểm A bất kì trên đường tròn.", sub: "…kẻ đường kính BC, lấy A bất kì trên đường tròn.", pose: "explain" }),
          rulerDraw("d2bc", on(180), on(0), 0.9, { color: GOLD }, { show: [{ id: "pc", type: "pencil", screen: true, x: on(180)[0], y: on(180)[1], z: 8, pop: false, sfx: false }, seg("d2bc", on(180), on(0), { dur: 0.9, color: GOLD }), dot("d2B", on(180), "B", true, WHITE, 0.1), dot("d2C", on(0), "C", false, WHITE, 0.9)] }),
          rulerOut({ show: [dot("d2A", on(-60), "A", false, BLUE, 0.3), seg("d2ab", on(180), on(-60), { at: 0.6, dur: 0.6 }), seg("d2ac", on(-60), on(0), { at: 1.2, dur: 0.5 })] }),
          { who: "thay", say: "Ta có O A bằng O B bằng O C, cùng bằng bán kính. Nên trung tuyến A O bằng nửa B C.", sub: "OA = OB = OC ⇒ trung tuyến AO = BC : 2", act: typing,
            show: [seg("d2ao", on(-60), O, { color: BLUE, dash: true, dur: 0.6 }), tick("d2t1", on(180), O, 0.6), tick("d2t2", O, on(0), 0.8), tick("d2t3", on(-60), O, 1.0),
              line("d2l1", 0, "OA = OB = OC = \\frac{BC}{2}", 0.4), line("d2l2", 1, "⇒ trung tuyến AO = \\frac{BC}{2}", 2.4)] },
          { who: "thay", say: "Tam giác có trung tuyến bằng nửa cạnh tương ứng... là tam giác vuông. Góc B A C bằng chín mươi độ!", sub: "⇒ ΔABC vuông tại A: góc BAC = 90°", act: typing,
            show: [line("d2l3", 2, "⇒ ΔABC vuông tại A, \\hat{BAC} = 90°", 0.3, GOLD), rmark("d2r", on(-60), on(180), on(0), 2.4)] },
          { who: "na", say: "Thử đặt A ở chỗ khác xem nào!", pose: "pointup", face: "happy",
            show: [dot("d2A2", on(-140), "A'", true, GREEN, 0.4), seg("d2a2b", on(180), on(-140), { color: GREEN, at: 0.7, dur: 0.4 }), seg("d2a2c", on(-140), on(0), { color: GREEN, at: 1.1, dur: 0.5 }), rmark("d2r2", on(-140), on(180), on(0), 1.7),
              dot("d2A3", on(140), "A''", true, RED, 2.0), seg("d2a3b", on(180), on(140), { color: RED, at: 2.2, dur: 0.4 }), seg("d2a3c", on(140), on(0), { color: RED, at: 2.6, dur: 0.5 }), rmark("d2r3", on(140), on(180), on(0), 3.2)] },
          { who: "bin", say: "Ở đâu cũng vuông! Góc vuông... đi đâu cũng vuông!", pose: "cheer", face: "happy", sfx: [{ name: "laugh", at: 1.8, vol: 0.5 }] },
          card("ĐỊNH LÍ 2", ["A thuộc đường tròn đường kính BC", "(A khác B, C)", "⇒ \\hat{BAC} = 90°"],
            { who: "thay", say: "Định lí hai: Điểm A thuộc đường tròn đường kính B C, khác B và C, thì góc B A C bằng chín mươi độ!", sub: "A thuộc đường tròn đường kính BC ⇒ góc BAC = 90°", pose: "pointup" }),
          { ...uncard(3), hide: ["gp", "g0", "g1", "g2", ...wipe()] },

          // ---------- ĐỊNH LÍ 3 ----------
          title(3, "Bốn điểm cùng thuộc một đường tròn"),
          rulerIn(on(180), on(0), { who: "thay", say: "Cho hai tam giác vuông: A B C vuông tại A, D B C vuông tại D, chung cạnh huyền B C.", sub: "ΔABC vuông tại A, ΔDBC vuông tại D, chung cạnh huyền BC", pose: "explain" }),
          rulerDraw("d3bc", on(180), on(0), 0.9, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(180)[0], y: on(180)[1], z: 8, pop: false, sfx: false }, seg("d3bc", on(180), on(0), { dur: 0.9 }), dot("d3B", on(180), "B", true, WHITE, 0.1), dot("d3C", on(0), "C", false, WHITE, 0.9)] }),
          rulerOut({ show: [dot("d3A", on(-115), "A", true, WHITE, 0.2), seg("d3ab", on(180), on(-115), { at: 0.3, dur: 0.5 }), seg("d3ac", on(-115), on(0), { at: 0.8, dur: 0.6 }), rmark("d3ra", on(-115), on(180), on(0), 1.4),
            dot("d3D", on(65), "D", false, WHITE, 1.6), seg("d3db", on(180), on(65), { at: 1.7, dur: 0.6 }), seg("d3dc", on(65), on(0), { at: 2.3, dur: 0.5 }), rmark("d3rd", on(65), on(180), on(0), 2.8)], wait: 3.0 }),
          { who: "thay", say: "Theo định lí một: A thuộc đường tròn đường kính B C. D cũng thuộc đường tròn đường kính B C.", sub: "A và D cùng nhìn BC dưới góc vuông", act: typing,
            show: [line("d3l1", 0, "ΔABC vuông tại A ⇒ A ∈ (O; \\frac{BC}{2})", 0.3), line("d3l2", 1, "ΔDBC vuông tại D ⇒ D ∈ (O; \\frac{BC}{2})", 3.0)] },
          compIn(O, R, -115, { show: [{ id: "cp", type: "compass", screen: true, x: 1950, y: -200, r: R, ang: -115, scale: 0.4, pop: false, sfx: false, z: 8 }, dot("d3O", O, "O", false, GOLD, 0.6)] }),
          compDraw("d3c", O, R, -115, 2.8, GOLD),
          compOut({ anim: [{ do: "move", id: "cp", x: 2300, y: -400, scale: 0.4, dur: 0.6, sfx: false }, { do: "flash", id: "d3A", at: 0.3, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d3B", at: 0.6, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d3C", at: 0.9, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d3D", at: 1.2, dur: 0.5, sfx: "ding" }], wait: 1.8 }),
          { who: "na", say: "Bốn điểm cùng nằm trên một đường tròn luôn!", pose: "cheer", face: "happy", act: typing, show: line("d3l3", 2, "⇒ A, B, C, D cùng thuộc (O; \\frac{BC}{2})", 0.3, GOLD) },
          card("ĐỊNH LÍ 3", ["A, D cùng nhìn BC dưới góc vuông", "⇒ A, B, C, D cùng thuộc", "đường tròn đường kính BC"],
            { who: "thay", say: "Định lí ba: Hai điểm cùng nhìn đoạn B C dưới góc vuông, thì bốn điểm cùng thuộc đường tròn đường kính B C.", sub: "Cùng nhìn BC dưới góc vuông ⇒ 4 điểm thuộc đường tròn đường kính BC", pose: "pointup" }),
          { ...uncard(3), hide: ["gp", "g0", "g1", "g2", ...wipe()] },

          // ---------- ĐỊNH LÍ 4 ----------
          title(4, "Hình chữ nhật"),
          rulerIn(on(-145), on(-35), { who: "thay", say: "Cuối cùng: vẽ hình chữ nhật A B C D.", sub: "Vẽ hình chữ nhật ABCD.", pose: "explain" }),
          rulerDraw("d4ab", on(-145), on(-35), 0.6, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(-145)[0], y: on(-145)[1], z: 8, pop: false, sfx: false }, seg("d4ab", on(-145), on(-35), { dur: 0.6 }), dot("d4A", on(-145), "A", true, WHITE, 0.05), dot("d4B", on(-35), "B", false, WHITE, 0.6)] }),
          rulerMove(on(-35), on(35)),
          rulerDraw("d4bc", on(-35), on(35), 0.5, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(-35)[0], y: on(-35)[1], z: 8, pop: false, sfx: false }, seg("d4bc", on(-35), on(35), { dur: 0.5 }), dot("d4C", on(35), "C", false, WHITE, 0.5)] }),
          rulerMove(on(35), on(145)),
          rulerDraw("d4cd", on(35), on(145), 0.6, null, { show: [{ id: "pc", type: "pencil", screen: true, x: on(35)[0], y: on(35)[1], z: 8, pop: false, sfx: false }, seg("d4cd", on(35), on(145), { dur: 0.6 }), dot("d4D", on(145), "D", true, WHITE, 0.6)] }),
          rulerMove(on(145), on(-145)),
          rulerDraw("d4da", on(145), on(-145), 0.5),
          rulerMove(on(-145), on(35)),
          rulerDraw("d4ac", on(-145), on(35), 0.8, { color: GOLD }),
          rulerOut({ show: [rmark("d4rb", on(-35), on(-145), on(35), 0.2), rmark("d4rd", on(145), on(-145), on(35), 0.5)] }),
          { who: "thay", say: "Tam giác A B C vuông tại B, tam giác A D C vuông tại D: B và D cùng nhìn A C dưới góc vuông.", sub: "B và D cùng nhìn AC dưới góc vuông", act: typing,
            show: line("d4l1", 0, "ΔABC vuông tại B, ΔADC vuông tại D", 0.3) },
          { who: "thay", say: "Theo định lí ba, bốn đỉnh thuộc đường tròn đường kính A C. Tâm O là giao điểm hai đường chéo.", sub: "⇒ 4 đỉnh thuộc đường tròn đường kính AC, tâm O", act: typing,
            show: [line("d4l2", 1, "⇒ A, B, C, D thuộc đường tròn đường kính AC", 0.3), seg("d4bd", on(-35), on(145), { color: BLUE, at: 1.5, dur: 0.7 }), dot("d4O", O, "O", false, GOLD, 2.2), line("d4l3", 2, "Tâm O là giao điểm của AC và BD", 2.8, GOLD)] },
          compIn(O, R, 35),
          compDraw("d4c", O, R, 35, 2.8, GOLD),
          compOut({ anim: [{ do: "move", id: "cp", x: 2300, y: -400, scale: 0.4, dur: 0.6, sfx: false }, { do: "flash", id: "d4A", at: 0.3, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d4B", at: 0.6, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d4C", at: 0.9, dur: 0.5, sfx: "ding" }, { do: "flash", id: "d4D", at: 1.2, dur: 0.5, sfx: "ding" }], wait: 1.8 }),
          card("ĐỊNH LÍ 4", ["Hình chữ nhật thì bốn đỉnh thuộc", "đường tròn có đường kính là", "đường chéo; tâm là giao hai đường chéo"],
            { who: "thay", say: "Định lí bốn: Hình chữ nhật thì bốn đỉnh thuộc đường tròn có đường kính là đường chéo, tâm là giao điểm hai đường chéo!", sub: "Hình chữ nhật ⇒ 4 đỉnh thuộc đường tròn đường kính là đường chéo", pose: "pointup" }),
          { ...uncard(3), hide: ["gp", "g0", "g1", "g2", ...wipe()] },

          // ---------- TỔNG KẾT ----------
          { set: { id: "pn", title: "4 ĐỊNH LÍ CẦN NHỚ" }, who: "thay", say: "Cả lớp cùng nhớ bốn định lí nhé!", sub: "Cùng nhớ 4 định lí!", pose: "sit", act: { bin: { pose: "idle" }, na: { pose: "idle" } },
            show: [["1", "ΔABC vuông tại A ⇒ A, B, C thuộc", "đường tròn đường kính BC"], ["2", "A thuộc đường tròn đường kính BC", "⇒ \\hat{BAC} = 90° (A khác B, C)"],
              ["3", "\\hat{BAC} = \\hat{BDC} = 90° ⇒ A, B, C, D", "thuộc đường tròn đường kính BC"], ["4", "ABCD là hình chữ nhật ⇒ 4 đỉnh thuộc", "đường tròn đường kính AC, tâm O"]]
              .flatMap(([k, a, b], i) => [
                { id: "s" + i + "a", type: "text", screen: true, text: `\\color{${GOLD}}{${k}.} ` + a, x: 770, y: 162 + i * 168, size: 48, color: WHITE, align: "left", anim: "write", dur: 1.0, at: 0.4 + i * 1.1, sfx: "type", z: 6 },
                { id: "s" + i + "b", type: "text", screen: true, text: b, x: 820, y: 222 + i * 168, size: 48, color: i % 2 ? "#a5d6a7" : "#90caf9", align: "left", anim: "write", dur: 0.9, at: 0.9 + i * 1.1, sfx: false, z: 6 }]) },
          { who: "thay", say: "Bí quyết chỉ một câu: thấy góc vuông... nghĩ ngay đến đường tròn có đường kính là cạnh huyền!", sub: "Thấy góc vuông ⇒ nghĩ ngay đường tròn đường kính là cạnh huyền!", pose: "pointup",
            anim: [{ do: "indicate", id: "s0a", at: 0.5, dur: 0.8 }, { do: "indicate", id: "s1a", at: 1.5, dur: 0.8 }, { do: "indicate", id: "s2a", at: 2.5, dur: 0.8 }, { do: "indicate", id: "s3a", at: 3.5, dur: 0.8 }], wait: 7 },
          { who: "bin", say: "Thầy ơi, vậy bánh chưng hình vuông... cũng vừa hộp tròn ạ?", pose: "ask", face: "thinking" },
          { who: "thay", say: "Vừa! Đường chéo bằng đường kính là vừa khít. Định lí bốn đó!", pose: "explain", face: "happy", act: { bin: { pose: "cheer", face: "happy" } } },
          { who: "na", say: "Đến ăn bánh cũng phải học toán!", pose: "facepalm", face: "happyclosed", sfx: [{ name: "laugh", at: 1.4, vol: 0.7 }] },
          { title: { text: "Lớp Toán Thầy Chung", sub: "Thấy góc vuông · nghĩ ngay đường tròn!", dur: 5.0, bgColor: "rgba(16,20,30,.95)", color: GOLD, subColor: "#cfd8dc" },
            who: "thay", say: "Chúc các em học tốt! Hẹn gặp lại!", sfx: [{ name: "bell", vol: 0.9 }, { name: "tada", at: 1.0, vol: 0.6 }], wait: 5 }
        ] }
    ]
  };
})();
