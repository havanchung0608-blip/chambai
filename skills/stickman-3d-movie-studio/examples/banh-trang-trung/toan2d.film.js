// "Phi vụ giải cứu bánh tráng trứng" — các đoạn GIẢNG TOÁN nhìn từ trên xuống (kiểu Manim), ghép xen giữa các đoạn truyện 3D.
// Bố cục: hình 40 % bên trái, chữ 60 % bên phải; phụ đề ở dải dưới cùng, không đè vùng công thức.
// Mỗi cảnh: nhân vật NÓI công thức tổng quát đúng lúc khung công thức hiện ra, giữ ≥ 5 s, rồi mới thay số ở dòng dưới.
// Toán 9 – Chương V – Bài 15. Độ dài của cung tròn. Diện tích hình quạt tròn và hình vành khuyên (KNTT).
(function () {
  const HID = { x: -3000, hidden: true };
  const CAST = { ti: HID, co: HID, may: HID };
  const O = [420, 470], RP = 260;                      // tâm và bán kính hình (px)
  const GOLD = "#ffd54f", CYAN = "#80deea", WHITE = "#f5f5f5", RED = "#ef5350", ORANGE = "#ffb300", GREEN = "#a5d6a7";
  const TX = 1350;                                       // giữa vùng chữ
  const title = (n, t) => ({ id: "tt", type: "text", text: `Thẻ ${n} · ${t}`, x: TX, y: 120, size: 64, color: CYAN, anim: "write", dur: 0.8, sfx: "marker" });
  const box = (txt, at, size, id) => ({ id: id || "fx", type: "text", text: txt, x: TX, y: 390, size: size || 110, color: GOLD, panel: true, panelBorder: "rgba(255,213,79,.95)", anim: "write", dur: 1.2, at: at || 0, sfx: "marker" });
  const line = (id, txt, y, color, at, size) => ({ id, type: "text", text: txt, x: TX, y, size: size || 80, color: color || WHITE, anim: "write", dur: 1.0, at: at || 0, sfx: "marker" });
  const disc = (extra) => Object.assign({ id: "disc", type: "sector", x: O[0], y: O[1], r: RP, a0: 0, a1: 360, color: "#e0ad62", opacity: 0.28, grow: 1 }, extra || {});
  const outline = { id: "ring0", type: "circ", x: O[0], y: O[1], r: RP, color: WHITE, width: 6, anim: "create", dur: 1.0, sfx: "shimmer" };
  const center = { id: "O", type: "dot", x: O[0], y: O[1], r: 11, color: WHITE, label: "O", labelSide: "left", size: 60 };
  const P = (deg, r) => [O[0] + (r || RP) * Math.cos(deg * Math.PI / 180), O[1] + (r || RP) * Math.sin(deg * Math.PI / 180)];
  const seg = (id, a, b, color, extra) => Object.assign({ id, type: "seg", x: 0, y: 0, x1: a[0], y1: a[1], x2: b[0], y2: b[1], color: color || WHITE, width: 6, anim: "create", dur: 0.6, sfx: "swish2" }, extra || {});
  const unlocked = (n) => ({ show: { id: "ok" + n, type: "text", text: `Chốt ${n} — MỞ!`, x: 1640, y: 1000, size: 56, color: "#69f0ae", panel: true, panelBorder: "#69f0ae", anim: "grow", dur: 0.5, sfx: "tada" }, wait: 1.4, gap: 0 });
  const radiusR = [seg("rad", O, P(0), RED), { id: "radl", type: "text", text: "R", x: O[0] + RP / 2, y: O[1] - 22, size: 66, color: RED, at: 0.5 }];

  window.FILM = {
    title: "Phi vụ giải cứu bánh tráng trứng — phần Toán",
    file: "banh-trang-trung-toan2d",
    watermark: "Thầy Hà Văn Chung",
    subSize: 80,
    music: null,
    cast: { ti: { name: "Tí Que", voice: "nam" }, co: { name: "Cô Bảy", voice: "nu" }, may: { name: "Máy Nướng 3.14", voice: "nu" } },
    scenes: [
      // ===================== THẺ 55 · ĐỘ DÀI ĐƯỜNG TRÒN =====================
      { bg: "manimgrid", name: "M55", cast: CAST,
        beats: [
          { show: [title(55, "Độ dài đường tròn"), { id: "un", type: "unroll", x: 250, y: 330, r: 110, run: 0, unroll: 0, color: GOLD, width: 9 },
            { id: "O", type: "dot", x: 250, y: 330, r: 10, color: WHITE, label: "O", labelSide: "left", size: 58, at: 0.4 },
            { id: "rad", type: "seg", x: 0, y: 0, x1: 250, y1: 330, x2: 360, y2: 330, color: RED, width: 6, anim: "create", dur: 0.5, at: 0.6, sfx: "swish2" },
            { id: "radl", type: "text", text: "R", x: 305, y: 312, size: 62, color: RED, at: 1.0 }], wait: 1.4, gap: 0 },
          { who: "co", say: "Với đường tròn bán kính R, độ dài đường tròn bằng hai pi nhân bán kính.", sub: "Độ dài đường tròn bán kính R: C = 2πR",
            tween: [{ id: "un", run: 1, dur: 2.2 }], show: box("C = 2πR", 2.0), sfx: [{ name: "whoosh", at: 0.1 }] },
          { tween: { id: "un", unroll: 1, dur: 2.4 }, show: [{ id: "unl", type: "text", text: "2πR", x: 250 + 345, y: 520, size: 70, color: GOLD, at: 2.2, sfx: "ding" }],
            anim: { do: "circumscribe", id: "fx", at: 0.6, dur: 1.6 }, sfx: [{ name: "whoosh" }], wait: 2.9, gap: 0 },
          { who: "ti", say: "Bán kính mười xen-ti-mét, vậy một vòng dài hai mươi pi xen-ti-mét. Cô giữ đầu dây giùm con. Nó mới đánh con một cái.",
            sub: "R = 10 cm ⇒ C = 2π·10 = 20π cm", show: [line("s1", "R = 10 cm", 640, WHITE, 0.2), line("s2", "C = 2π·10 = 20π (cm)", 770, GREEN, 1.8)], anim: { do: "circumscribe", id: "s2", at: 3.6, dur: 1.2 } },
          unlocked(55)
        ] },

      // ===================== THẺ 56 · ĐỘ DÀI CUNG TRÒN =====================
      { bg: "manimgrid", name: "M56", cast: CAST,
        beats: [
          { show: [title(56, "Độ dài cung tròn"), disc(), outline, center, seg("OA", O, P(135)), seg("OB", O, P(45)),
            { id: "A", type: "dot", x: P(135)[0], y: P(135)[1], r: 12, color: WHITE, label: "A", labelSide: "left", size: 62, at: 0.8 },
            { id: "B", type: "dot", x: P(45)[0], y: P(45)[1], r: 12, color: WHITE, label: "B", size: 62, at: 0.9 },
            { id: "ang", type: "arc", x: O[0], y: O[1], r: 56, a0: 45, a1: 135, color: CYAN, width: 5, prog: 0, glow: false, label: "n°", labelOff: 36, size: 60 },
            { id: "arcAB", type: "arc", x: O[0], y: O[1], r: RP, a0: 45, a1: 135, color: GOLD, width: 14, prog: 0, bug: false }],
            tween: [{ id: "ang", prog: 1, dur: 0.8 }], wait: 1.8, gap: 0 },
          { who: "co", say: "Cả vòng là ba trăm sáu mươi độ. Cung có số đo n độ, chiếm n phần ba trăm sáu mươi của cả vòng. Muốn tính độ dài cung, ta lấy phần đó nhân với chu vi.",
            sub: "Cung n°: ℓ = n/360 · 2πR",
            tween: { id: "arcAB", prog: 1, dur: 1.2 }, show: box("ℓ = \\frac{n}{360}·2πR = \\frac{πRn}{180}", 4.5, 92), anim: { do: "flash", id: "arcAB", at: 1.3, dur: 0.8 }, sfx: [{ name: "shimmer", at: 1.2 }] },
          { anim: { do: "circumscribe", id: "fx", dur: 1.6 }, wait: 4.2, gap: 0 },
          { who: "ti", say: "Góc chín mươi độ chiếm một phần tư vòng. Chu vi hai mươi pi, thì cung này dài năm pi xen-ti-mét. Gián, bám mép giùm anh!",
            sub: "n = 90° ⇒ ℓ = 90/360 · 20π = 5π cm",
            set: [{ id: "ang", label: "90°" }], show: [line("s1", "n = 90°, C = 20π cm", 640, WHITE, 0.2), line("s2", "ℓ = \\frac{90}{360}·20π = 5π (cm)", 785, GREEN, 2.4)],
            anim: { do: "circumscribe", id: "s2", at: 4.4, dur: 1.2 } },
          { set: [{ id: "arcAB", prog: 0, bug: true, color: "#ffab00" }], tween: { id: "arcAB", prog: 1, dur: 2.6 },
            sfx: [{ name: "tick", at: 0.1 }, { name: "tick", at: 0.4 }, { name: "tick", at: 0.7 }, { name: "tick", at: 1.0 }, { name: "tick", at: 1.3 }, { name: "tick", at: 1.6 }, { name: "tick", at: 1.9 }, { name: "tick", at: 2.2 }, { name: "shimmer", at: 2.6 }], wait: 3.0, gap: 0 },
          unlocked(56)
        ] },

      // ===================== THẺ 57 · DIỆN TÍCH HÌNH TRÒN =====================
      { bg: "manimgrid", name: "M57", cast: CAST,
        beats: [
          { show: [title(57, "Diện tích hình tròn"), disc(), outline, center, ...radiusR,
            { id: "fill", type: "sector", x: O[0], y: O[1], r: RP, a0: 0, a1: 360, color: ORANGE, opacity: 0.9, grow: 0 }], wait: 1.6, gap: 0 },
          { who: "ti", say: "Con hiểu rồi! Phủ kín mặt bánh thì phải tính diện tích. Diện tích hình tròn bán kính R, bằng pi nhân bình phương bán kính.",
            sub: "Diện tích hình tròn bán kính R: S = πR²", tween: { id: "fill", grow: 1, dur: 2.6 }, show: box("S = πR^2", 3.8),
            sfx: [{ name: "sizzle", vol: 0.7 }] },
          { anim: [{ do: "circumscribe", id: "fx", dur: 1.6 }, { do: "flash", id: "fill", at: 0.3, dur: 0.8 }], wait: 4.2, gap: 0 },
          { who: "ti", say: "Bán kính mười xen-ti-mét. Mười bình phương bằng một trăm. Diện tích là một trăm pi xen-ti-mét vuông!",
            sub: "S = π·10² = 100π cm²", show: [line("s1", "R = 10 cm", 640, WHITE, 0.2), line("s2", "S = π·10^2 = 100π (cm^2)", 775, GREEN, 2.0)],
            anim: { do: "circumscribe", id: "s2", at: 4.0, dur: 1.2 } },
          { show: { id: "bread", type: "text", text: "🥖", x: O[0] + RP + 30, y: O[1] + 40, size: 70, anim: "grow", dur: 0.4, sfx: "pop" }, wait: 1.6, gap: 0 },
          unlocked(57)
        ] },

      // ===================== THẺ 58 · DIỆN TÍCH HÌNH QUẠT =====================
      { bg: "manimgrid", name: "M58", cast: CAST,
        beats: [
          { show: [title(58, "Diện tích hình quạt tròn"), disc(), outline, center, seg("OA", O, P(135)), seg("OB", O, P(45)),
            { id: "A", type: "dot", x: P(135)[0], y: P(135)[1], r: 12, color: WHITE, label: "A", labelSide: "left", size: 62 },
            { id: "B", type: "dot", x: P(45)[0], y: P(45)[1], r: 12, color: WHITE, label: "B", size: 62 },
            { id: "arcAB", type: "arc", x: O[0], y: O[1], r: RP, a0: 45, a1: 135, color: GOLD, width: 12, prog: 1, label: "ℓ = 5π", labelOff: 56, size: 60 },
            { id: "sec", type: "sector", x: O[0], y: O[1], r: RP, a0: 45, a1: 135, color: RED, opacity: 0.85, grow: 0 },
            { id: "ang", type: "arc", x: O[0], y: O[1], r: 56, a0: 45, a1: 135, color: CYAN, width: 5, glow: false, label: "n°", labelOff: 36, size: 60 }],
            sfx: [{ name: "shimmer", at: 0.5 }], wait: 2.4, gap: 0 },
          { who: "co", say: "Góc ở tâm chiếm bao nhiêu phần của ba trăm sáu mươi độ, thì hình quạt chiếm bấy nhiêu phần diện tích hình tròn. Với góc n độ, lấy n phần ba trăm sáu mươi nhân với pi nhân bình phương bán kính.",
            sub: "Hình quạt n°: Sq = n/360 · πR²", tween: { id: "sec", grow: 1, dur: 2.2 }, show: box("S_q = \\frac{n}{360}·πR^2", 5.0, 100), sfx: [{ name: "whoosh" }] },
          { anim: [{ do: "circumscribe", id: "fx", dur: 1.6 }, { do: "indicate", id: "sec", at: 0.2, dur: 1.0 }], show: { id: "cmp", type: "text", text: "cung: độ dài · quạt: diện tích", x: O[0], y: 870, size: 56, color: CYAN, at: 0.3 }, wait: 4.2, gap: 0 },
          { who: "ti", say: "Một phần tư của một trăm pi. Miếng này có diện tích hai mươi lăm pi xen-ti-mét vuông!",
            sub: "Sq = 90/360 · 100π = 25π cm²", set: [{ id: "ang", label: "90°" }],
            show: [line("s1", "n = 90°, S = 100π cm^2", 640, WHITE, 0.2), line("s2", "S_q = \\frac{90}{360}·100π = 25π (cm^2)", 790, GREEN, 1.8, 74)], anim: { do: "circumscribe", id: "s2", at: 3.6, dur: 1.2 } },
          unlocked(58)
        ] },

      // ===================== THẺ 59 · DIỆN TÍCH HÌNH VÀNH KHUYÊN =====================
      { bg: "manimgrid", name: "M59", cast: CAST,
        beats: [
          { show: [title(59, "Diện tích hình vành khuyên"),
            { id: "big", type: "sector", x: O[0], y: O[1], r: RP, a0: 0, a1: 360, color: ORANGE, opacity: 0.9, grow: 1, anim: "fadein", dur: 0.6 },
            { id: "c1", type: "circ", x: O[0], y: O[1], r: RP, color: WHITE, width: 6, anim: "create", dur: 0.8 },
            { id: "c2", type: "circ", x: O[0], y: O[1], r: 156, color: WHITE, width: 6, anim: "create", dur: 0.8, at: 0.4, sfx: "shimmer" }, center,
            seg("R1", O, P(0), RED, { at: 1.0 }), { id: "R1l", type: "text", text: "R", x: O[0] + 200, y: O[1] - 20, size: 62, color: RED, at: 1.3 },
            seg("r1", O, P(-90, 156), CYAN, { at: 1.4 }), { id: "r1l", type: "text", text: "r", x: O[0] - 28, y: O[1] - 70, size: 62, color: CYAN, at: 1.7 },
            line("d1", "R = 10 cm, r = 6 cm", 260, WHITE, 1.8, 74)], wait: 3.0, gap: 0 },
          { who: "ti", say: "Mười trừ sáu còn bốn. Giờ con bình phương số bốn...", sub: "10 − 6 = 4… rồi bình phương số 4…",
            show: line("bad", "(10 − 6)^2 = 16 ?", 520, RED, 1.2, 80) },
          { who: "co", say: "Nhìn tay cô nè. Cái đĩa vừa che mất phần nào?", sub: "Cái đĩa vừa che mất phần nào?",
            show: [{ id: "plate", type: "dot", x: O[0], y: -200, r: 156, color: "#90a4ae", glow: false }, { id: "cross", type: "cross", x: TX + 330, y: 500, scale: 0.8, at: 0.2, sfx: "wrong" }],
            anim: [{ do: "move", id: "plate", y: O[1], dur: 1.0, sfx: false }, { do: "flash", id: "big", at: 1.4, dur: 0.8 }], sfx: [{ name: "pop", at: 1.0 }] },
          { wait: 2.2, gap: 0 },
          { who: "ti", say: "Nguyên một hình tròn nhỏ! Con phải trừ hai diện tích!", sub: "Một hình tròn nhỏ! Phải trừ hai diện tích!", hide: ["bad", "cross"] },
          { who: "co", say: "Đúng. Với hai đường tròn đồng tâm, bán kính ngoài R lớn hơn bán kính trong r, diện tích vành khuyên bằng diện tích hình tròn lớn trừ diện tích hình tròn nhỏ. Bình phương từng bán kính, rồi mới trừ.",
            sub: "Svk = πR² − πr² = π(R² − r²)",
            show: [box("S_{vk} = πR^2 − πr^2", 4.0, 92), { id: "fx2", type: "text", text: "= π(R^2 − r^2)", x: TX + 120, y: 560, size: 92, color: GOLD, anim: "write", dur: 1.0, at: 6.5, sfx: "marker" }],
            set: [{ id: "big", r0: 156 }], anim: [{ do: "fadeout", id: "plate", at: 0.5, dur: 0.6 }, { do: "flash", id: "big", at: 1.2, dur: 0.8 }] },
          { anim: [{ do: "circumscribe", id: "fx", dur: 1.4 }, { do: "circumscribe", id: "fx2", at: 1.3, dur: 1.4 }], wait: 4.0, gap: 0 },
          { who: "may", say: "Ba... hai...", sub: "Ba… hai…", show: [{ id: "n3", type: "text", text: "3", x: 1760, y: 210, size: 150, color: RED, anim: "grow", dur: 0.3, sfx: "tick" }],
            anim: { do: "transform", id: "n3", to: { text: "2" }, at: 0.9, dur: 0.2, sfx: "tick" } },
          { who: "ti", say: "Một trăm trừ ba mươi sáu còn sáu mươi tư. Sáu mươi tư pi xen-ti-mét vuông!", sub: "π(10² − 6²) = 64π cm²", hide: "n3",
            show: [line("s2", "S_{vk} = π(10^2 − 6^2) = 64π (cm^2)", 800, GREEN, 0.4, 72)], anim: { do: "circumscribe", id: "s2", at: 2.6, dur: 1.2 } },
          unlocked(59)
        ] },

      // ===================== BẢNG TỔNG KẾT (Gián Điện chiếu) =====================
      { bg: "manim", name: "SUM", cast: CAST,
        beats: [
          { show: [{ id: "T", type: "text", text: "5 CÔNG THỨC ĐƯỜNG TRÒN CẦN NHỚ", x: 960, y: 105, size: 70, color: GOLD, anim: "write", dur: 1.0, sfx: "magic" },
            ...[[55, "Độ dài đường tròn", "C = 2πR"], [56, "Độ dài cung n°", "ℓ = \\frac{n}{360}·2πR = \\frac{πRn}{180}"], [57, "Diện tích hình tròn", "S = πR^2"],
              [58, "Diện tích hình quạt n°", "S_q = \\frac{n}{360}·πR^2"], [59, "Diện tích vành khuyên (R > r)", "S_{vk} = π(R^2 − r^2)"]].flatMap(([n, name, f], i) => {
              const y = 235 + i * 140, at = 0.6 + i * 0.7, ix = 120;
              const icon = [
                { id: "ic" + n, type: "circ", x: ix, y: y - 18, r: 52, color: GOLD, width: 6 },
                { id: "ic" + n, type: "arc", x: ix, y: y - 18, r: 52, a0: 45, a1: 135, color: GOLD, width: 8, prog: 1 },
                { id: "ic" + n, type: "sector", x: ix, y: y - 18, r: 52, a0: 0, a1: 360, color: ORANGE, opacity: 0.9 },
                { id: "ic" + n, type: "sector", x: ix, y: y - 18, r: 52, a0: 45, a1: 135, color: RED, opacity: 0.9 },
                { id: "ic" + n, type: "sector", x: ix, y: y - 18, r: 52, r0: 30, a0: 0, a1: 360, color: ORANGE, opacity: 0.9 }][i];
              return [Object.assign(icon, { at, anim: "grow", dur: 0.4, sfx: "pop" }),
                { id: "n" + n, type: "text", text: String(n), x: 240, y, size: 60, color: CYAN, at: at + 0.1 },
                { id: "m" + n, type: "text", text: name, x: 300, y, size: 58, color: WHITE, align: "left", at: at + 0.15 },
                { id: "f" + n, type: "text", text: f, x: 1180, y, size: 64, color: GOLD, align: "left", at: at + 0.25, sfx: "marker" }];
            })], wait: 4.8, gap: 0 },
          { who: "co", say: "Hai con nhớ mẹo này nha. Cùng một góc ở tâm: muốn biết con Gián bò bao xa, thì lấy phần tương ứng của chu vi. Muốn biết nó được ăn bao nhiêu bánh, thì lấy phần tương ứng của diện tích.",
            sub: "Bò bao xa: chu vi · Ăn bao nhiêu: diện tích",
            anim: [{ do: "indicate", id: "f56", at: 3.5, dur: 1.4 }, { do: "indicate", id: "f58", at: 8.0, dur: 1.4 }] },
          { show: { id: "lop", type: "text", text: "Lớp Toán Thầy Chung", x: 1640, y: 1035, size: 44, color: "#b0bec5", anim: "fadein", dur: 0.6 }, wait: 9.0, sfx: [{ name: "bell", at: 7.2 }], gap: 0 }
        ] }
    ]
  };
})();
