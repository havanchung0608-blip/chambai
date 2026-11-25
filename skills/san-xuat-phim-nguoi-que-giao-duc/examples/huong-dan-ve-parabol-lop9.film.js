// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức) — BẢN PHIM HÀNH ĐỘNG
// Nền là BẢNG XANH (phấn màu). Thầy Chung lao vào bảng, nhảy xoay người lên bảng giá trị, đá số vào ô ("BỐP!"),
// điểm bay toạ độ kiểu Manim và nổ tia lửa khi chạm, trượt ván vẽ parabol, vấp ngã K.O. ở góc nhọn,
// leo đồi cắm cờ, nhảy lộn tiếp đất. Mỗi hành động đều có tiếng động.
(function () {
  const mapper = (A) => (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const SC = 0.56, SN = 0.47, TB_Y = 420;
  const NA = { name: "Na", role: "hoc-sinh", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.78 };
  const col = (i) => 60 + 300 + 65 + 130 * i;
  const AX1 = { id: "ax", type: "axes", x: 1450, y: 580, w: 760, h: 600, xmin: -3, xmax: 3, ymin: -0.5, ymax: 8.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y", color: "#f5f5ec" };
  const AX2 = { id: "ax2", type: "axes", x: 1460, y: 600, w: 780, h: 600, xmin: -5, xmax: 5, ymin: -8.5, ymax: 0.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y", color: "#f5f5ec" };
  const M1 = mapper(AX1), M2 = mapper(AX2);
  const P1 = [[-2, 8], [-1, 2], [0, 0], [1, 2], [2, 8]];
  const P2 = [[-4, -8], [-2, -2], [0, 0], [2, -2], [4, -8]];
  const f1 = (x) => 2 * x * x, f2 = (x) => -0.5 * x * x;
  const YEL = "#fff176", PINK = "#ff8a80", CYAN = "#80deea", GREEN = "#b9f6ca";
  const label = (p) => p[0] === 0 && p[1] === 0 ? "O" : `(${String(p[0]).replace("-", "−")}; ${String(p[1]).replace("-", "−")})`;
  // nhảy sang cột i (có thể xoay người), tiếp đất "bịch"
  const hop = (i, spin, dur, who) => ({ move: { who: who || "thay", to: col(i), y: TB_Y, dur: dur || 0.6, style: "jump", height: spin ? 210 : 120, spin: spin ? 360 : 0 },
    sfx: [{ name: spin ? "swish" : "swish2", vol: 0.7 }], fx: { type: "dust", x: col(i), y: TB_Y + 6, at: (dur || 0.6) * 0.8, dur: 0.5 }, gap: 0 });
  // đá số xuống ô y: "BỐP!" + rung
  const kick = (tb, n, i, rowY, who) => ({ act: { [who || "thay"]: { pose: "kick", snap: 0.08 } }, tween: { id: tb, revealY: n, dur: 0.3 },
    sfx: [{ name: "swish2", vol: 0.6 }, { name: "punch", at: 0.12 }], fx: { type: "hit", x: col(i), y: rowY, at: 0.1, dur: 0.5, text: "BỐP!", color: "#ffd54f" },
    shake: { at: 0.12, amp: 12, dur: 0.25 }, wait: 0.6, gap: 0 });
  // biểu diễn điểm kiểu Manim + nổ tia lửa khi chạm
  const plotHit = (ax, M, p, i, color, side, last, who) => {
    const [px, py] = M(p[0], p[1]);
    return { act: { [who || "thay"]: { pose: "kick", snap: 0.08 } },
      plot: { ax, at: p, table: ax === "ax" ? "tb" : "tb2", col: i, id: (ax === "ax" ? "p" : "r") + i, color, label: label(p), labelSide: side, dur: 2.2, tokenColor: YEL },
      fx: [{ type: "hit", x: px, y: py, at: 1.3, dur: 0.55, color }], shake: { at: 1.3, amp: 10, dur: 0.25 },
      sfx: [{ name: "swish2", vol: 0.6 }, { name: "animepunch", at: 1.3, vol: 0.8 }],
      wait: last ? 2.4 : 1.55, gap: 0 };
  };
  const bang = (text, x, y, color) => ({ type: "hit", x, y, dur: 0.7, text, color: color || "#ffd54f" });

  window.FILM = {
    title: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)",
    subtitle: "Toán 9 · Thầy Chung hướng dẫn",
    file: "huong-dan-ve-parabol-lop9",
    watermark: "Thầy Hà Văn Chung",
    music: "intro",
    cast: { thay: TEACHER, na: NA },
    scenes: [
      // ================= 1. MỞ ĐẦU =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -200, pose: "idle", face: "happy" }, na: { x: 2150, pose: "idle", face: "happy", flip: true } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung và bạn Na", dur: 3.0 }, sfx: ["bell", { name: "boom", at: 0.2, vol: 0.7 }] },
          { move: { who: "thay", to: 300, dur: 1.3, style: "run" }, fx: { type: "speed", on: "thay", dir: 1, dur: 1.2 }, sfx: [{ name: "whoosh" }], gap: 0 },
          { move: { who: "thay", by: 0, dur: 1.1, style: "jump", height: 260, spin: 360 }, sfx: [{ name: "swish" }],
            fx: [{ type: "dust", on: "thay", part: "legs", dy: 120, at: 0.9, dur: 0.6 }, Object.assign(bang("BÙM!", 300, 520), { at: 0.9 })], shake: { at: 0.9, amp: 16, dur: 0.3 }, gap: 0.1 },
          { who: "thay", say: "Chào các em! Hôm nay thầy cùng các em vẽ đồ thị hàm số i dài bằng a ích bình phương!", sub: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)", pose: "wave", face: "happy", act: { na: { flip: true } } },
          { move: { who: "na", to: 1350, dur: 1.8, style: "skate" }, sfx: [{ name: "skate", dur: 1.8 }], gap: 0 },
          { who: "na", say: "Thầy ơi! Parabol là gì ạ?", sub: "Thầy ơi! Parabol là gì ạ?", pose: "pointup", face: "happy", emote: { who: "na", icon: "?" } },
          { who: "thay", say: "Câu hỏi hay lắm Na! Đồ thị của hàm số này là một parabol đỉnh O, nhận trục O y làm trục đối xứng.", sub: "Parabol đỉnh O, trục đối xứng Oy", pose: "write", hold: "chalk",
            act: { na: { pose: "idle" } }, write: [{ text: "y = ax² (a ≠ 0): parabol đỉnh O", size: 68 }, { text: "• Trục đối xứng: Oy", size: 64 }] },
          { who: "thay", say: "a dương: đồ thị nằm trên trục hoành. a âm: nằm dưới trục hoành.", sub: "a > 0: trên trục hoành · a < 0: dưới trục hoành", pose: "write",
            write: [{ text: "• a > 0: trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" }, { text: "• a < 0: dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" }] },
          { who: "thay", say: "Ba bước: lập bảng, biểu diễn điểm, nối đường cong. Na, vào trong bảng thôi!", sub: "Lập bảng → Biểu diễn điểm → Nối", pose: "pointup", hold: null, emote: { who: "thay", icon: "!" },
            write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] },
          { who: "na", say: "Xông lên!", sub: "Xông lên!", pose: "cheer", face: "happy" },
          { move: [{ who: "thay", to: 1150, y: 520, dur: 1.2, style: "jump", height: 320, spin: 360 }, { who: "na", to: 1250, y: 520, dur: 1.2, style: "jump", height: 300, spin: -360 }],
            cam: { x: 1200, y: 380, zoom: 1.8, dur: 1.2 }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.15 }, { name: "magic", at: 0.8, vol: 0.8 }], gap: 0 }
        ] },

      // ================= 2. VÍ DỤ 1: y = 2x² — nhảy cóc thay số =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 1:  y = 2x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: "#fff176" }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb", type: "table", x: 60, y: TB_Y, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: YEL }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: [{ who: "thay", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "na", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 }],
            sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }], fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }, { type: "dust", x: 200, y: TB_Y + 6, at: 1.25, dur: 0.6 }], shake: { at: 1.05, amp: 14, dur: 0.3 }, gap: 0 },
          { who: "thay", say: "Bước một: lập bảng giá trị! Chọn ích bằng âm hai, âm một, không, một, hai.", sub: "Bước 1: Lập bảng giá trị", bubble: false,
            tween: { id: "tb", revealX: 5, dur: 2.2 }, cam: { x: 560, y: 440, zoom: 1.35, dur: 0.5 },
            sfx: [{ name: "pop", at: 0.5 }, { name: "pop", at: 0.95 }, { name: "pop", at: 1.4 }, { name: "pop", at: 1.85 }, { name: "pop", at: 2.2 }] },
          { who: "na", say: "Thầy với em thi nhảy cóc nhé!", sub: "Thầy với em thi nhảy cóc nhé!", bubble: false, pose: "cheer" },
          { who: "thay", say: "Âm hai: hai nhân bình phương âm hai, bằng tám!", sub: "x = −2: y = 2·(−2)² = 8", bubble: false, pose: "explain",
            show: { id: "calc", type: "text", text: "y = 2·(−2)^2 = 8", x: 560, y: 112, size: 74, color: YEL, anim: "write", dur: 0.8, sfx: "marker" } },
          kick("tb", 1, 0, TB_Y + 168),
          hop(1, true, 0.9, "na"),
          { who: "na", say: "Đến lượt em! Âm một: bằng hai!", sub: "x = −1: y = 2·(−1)² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·(−1)^2 = 2" }, dur: 0.4 } },
          kick("tb", 2, 1, TB_Y + 168, "na"),
          hop(2, true, 0.9),
          { who: "thay", say: "Không: bằng không!", sub: "x = 0: y = 2·0² = 0", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·0^2 = 0" }, dur: 0.4 } },
          kick("tb", 3, 2, TB_Y + 168),
          hop(3, true, 0.9, "na"),
          { who: "na", say: "Một: bằng hai!", sub: "x = 1: y = 2·1² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·1^2 = 2" }, dur: 0.4 } },
          kick("tb", 4, 3, TB_Y + 168, "na"),
          hop(4, true, 0.9),
          { who: "thay", say: "Hai: bằng tám! Xong bảng!", sub: "x = 2: y = 2·2² = 8", bubble: false, pose: "cheer", face: "happy", anim: { do: "transform", id: "calc", to: { text: "y = 2·2^2 = 8" }, dur: 0.4 } },
          kick("tb", 5, 4, TB_Y + 168),
          { who: "thay", say: "Bước hai: biểu diễn điểm! Các điểm, bay lên nào!", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "pointup",
            anim: { do: "fadeout", id: "calc", dur: 0.4 }, show: Object.assign({}, AX1, { anim: "create", dur: 1.0 }),
            cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.5 }] },
          plotHit("ax", M1, P1[4], 4, PINK, "left"),
          plotHit("ax", M1, P1[3], 3, PINK, undefined, false, "na"),
          hop(2, false, 0.5), plotHit("ax", M1, P1[2], 2, PINK),
          hop(1, false, 0.5, "na"), plotHit("ax", M1, P1[1], 1, PINK, undefined, false, "na"),
          hop(0, false, 0.5), plotHit("ax", M1, P1[0], 0, PINK, undefined, true),
          { who: "na", say: "Ơ, các cặp điểm đối xứng nhau qua trục O y kìa!", sub: "Các cặp điểm đối xứng qua Oy", bubble: false, pose: "point", face: "happy",
            anim: [{ do: "flash", id: "p0", dur: 0.6, sfx: "ding" }, { do: "flash", id: "p4", dur: 0.6 }, { do: "flash", id: "p1", at: 0.9, dur: 0.6, sfx: "ding" }, { do: "flash", id: "p3", at: 0.9, dur: 0.6 }] },
          { who: "thay", say: "Đúng rồi! Bước ba: hai thầy trò lên ván trượt!", sub: "Bước 3: Nối bằng đường cong trơn", bubble: false, pose: "cheer",
            move: [{ who: "thay", to: M1(-2.05, f1(-2.05))[0], y: M1(-2.05, f1(-2.05))[1], dur: 1.2, style: "jump", height: 260, spin: 360 }, { who: "na", to: M1(-2.05, f1(-2.05))[0] - 10, y: M1(-2.05, f1(-2.05))[1], dur: 1.4, style: "jump", height: 300, spin: -360 }],
            act: { thay: { skate: true }, na: { skate: true } }, cam: { x: 1400, y: 540, zoom: 1.15, dur: 1.0, letterbox: true }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.2 }] },
          { who: "na", say: "Wiii! Ván trượt qua đủ năm điểm, vẽ nên đường cong trơn: parabol!", sub: "Qua cả 5 điểm → đường cong trơn: parabol", bubble: false, pose: "skate",
            show: { id: "g1", type: "graph", axes: "ax", fn: "2*x^2", x0: -2.05, x1: 2.05, color: YEL, width: 11, _prog: 0, pop: false, sfx: false },
            ride: [{ who: "thay", graph: "g1", from: -2.05, to: 2.05, dur: 4.0 }, { who: "na", graph: "g1", from: -2.05, to: 1.95, dur: 4.0, delay: 0.55, trail: false }],
            fx: [{ type: "speed", on: "thay", dir: 1, at: 1.3, dur: 1.4 }],
            anim: [{ do: "flash", id: "p1", at: 1.45, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p2", at: 2.0, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p3", at: 2.55, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p4", at: 3.9, dur: 0.5, sfx: "ding" }],
            sfx: [{ name: "wow", at: 2.0, vol: 0.7 }] },
          { move: [{ who: "thay", by: 0, dur: 1.1, style: "jump", height: 230, spin: -360 }, { who: "na", by: 0, dur: 1.1, style: "jump", height: 200, spin: -360 }], sfx: [{ name: "swish" }, { name: "land", at: 1.0 }], gap: 0 },
          { who: "thay", say: "Trượt về đáy máng: O là điểm thấp nhất, vì a bằng hai lớn hơn không!", sub: "a = 2 > 0: O là điểm thấp nhất", bubble: false, pose: "skate", face: "happy",
            ride: [{ who: "thay", graph: "g1", from: 2.05, to: 0.25, dur: 2.4, ease: "out", trail: false }, { who: "na", graph: "g1", from: 1.95, to: -0.25, dur: 2.4, ease: "out", trail: false }],
            anim: { do: "flash", id: "p2", at: 2.4, dur: 0.8, sfx: "ding" } },
          { move: [{ who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 230, spin: -360 }], act: { thay: { pose: "cheer" }, na: { pose: "cheer" } },
            fx: [{ type: "confetti", x: 1450, y: 700, at: 0.6, dur: 1.6 }], sfx: [{ name: "tada", at: 0.6 }, { name: "applause", at: 0.6, vol: 0.6 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 3. LỖI HAY GẶP: Na hấp tấp, vấp ngã =================
      { bg: "chalkgrid", trans: "flash",
        cast: { na: { x: M1(-2, 8)[0], y: M1(-2, 8)[1], scale: SN, pose: "skate", face: "happy", skate: true }, thay: { x: 330, pose: "idle", face: "worried", scale: SC } },
        items: [Object.assign({}, AX1)].concat(P1.map((p, i) => ({ id: "q" + i, type: "dot", ax: "ax", at: p, r: 17, color: PINK }))),
        beats: [
          { title: { text: "LỖI HAY GẶP!", dur: 1.8, bgColor: "rgba(60,10,10,.8)", color: "#ff8a80" }, sfx: [{ name: "wrong" }] },
          { who: "na", say: "Để em! Nối đoạn thẳng cho nhanh!", sub: "Nối bằng đoạn thẳng cho nhanh?", bubble: false, pose: "cheer",
            show: { id: "bad", type: "poly", points: P1.map((p) => M1(p[0], p[1])), close: false, color: "#ff5252", width: 8, anim: "create", dur: 1.3 } },
          { who: "thay", say: "Khoan đã Na!", sub: "Khoan đã Na!", bubble: false, pose: "give", face: "worried" },
          { ride: { who: "na", path: [M1(-2, 8), M1(-1, 2), M1(0, 0)], dur: 1.4, ease: "in" }, cam: { x: 1450, y: 700, zoom: 1.5, dur: 1.4 }, sfx: [{ name: "whoosh", at: 0.6 }], gap: 0 },
          { act: { na: { pose: "lie", skate: false, tilt: 0, face: "surprised", snap: 0.12 } }, move: { who: "na", by: 90, dur: 0.5, style: "slide" },
            fx: [{ type: "hit", on: "na", part: "chest", text: "OÁI!", dur: 0.8 }, { type: "dust", on: "na", part: "legs", dy: 100, dur: 0.7 }], shake: { amp: 26, dur: 0.45 },
            sfx: [{ name: "fall" }, { name: "ko", at: 0.2, vol: 0.8 }, { name: "boing", at: 0.4 }], show: { id: "x1", type: "cross", x: 870, y: 300, scale: 1.2, sfx: "wrong" }, wait: 1.2, gap: 0 },
          { move: { who: "thay", to: M1(0, 0)[0] - 120, y: 960, dur: 1.0, style: "run" }, cam: { x: 1250, y: 720, zoom: 1.3, dur: 1.0 }, gap: 0 },
          { who: "na", say: "Ui da! Em vấp ở góc nhọn rồi!", sub: "Ui da! Vấp ở góc nhọn rồi!", bubble: false, act: { na: { pose: "dizzy", face: "sad" } }, emote: { who: "na", icon: "?" } },
          { who: "thay", say: "Đứng dậy nào! Parabol không có góc nhọn, nên nối bằng đoạn thẳng là sai.", sub: "Sai! Parabol không có góc nhọn", bubble: false, pose: "give", face: "happy",
            act: { na: { pose: "idle", face: "happy", snap: 0.6 } }, anim: { do: "fadeout", id: "bad", at: 2.4, dur: 0.6 }, cam: { x: 960, y: 540, zoom: 1, dur: 1.0 } },
          { move: [{ who: "na", to: M1(-2, 8)[0], y: M1(-2, 8)[1], dur: 1.1, style: "jump", height: 240, spin: 360 }, { who: "thay", to: M1(-2, 8)[0] - 10, y: M1(-2, 8)[1], dur: 1.3, style: "jump", height: 260, spin: -360 }],
            act: { na: { skate: true }, thay: { skate: true, face: "happy" } }, hide: "x1", sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }], gap: 0 },
          { who: "thay", say: "Nối bằng đường cong trơn thì hai thầy trò trượt êm ru!", sub: "Đúng: nối bằng đường cong trơn", bubble: false, pose: "skate", face: "happy",
            show: [{ id: "good", type: "graph", axes: "ax", fn: "2*x^2", x0: -2, x1: 2, color: GREEN, width: 11, _prog: 0, pop: false, sfx: false }, { id: "ok", type: "check", x: 870, y: 300, scale: 1.2, sfx: "correct" }],
            ride: [{ who: "thay", graph: "good", from: -2, to: 2, dur: 3.2 }, { who: "na", graph: "good", from: -2, to: 1.9, dur: 3.2, delay: 0.5, trail: false }], sfx: [{ name: "wow", at: 1.6, vol: 0.7 }] }
        ] },

      // ================= 4. VÍ DỤ 2: y = −½x² — ngọn đồi =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 2:  y = −½x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: CYAN }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb2", type: "table", x: 60, y: TB_Y, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: CYAN }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: [{ who: "thay", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "na", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 }],
            fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }], shake: { at: 1.05, amp: 14, dur: 0.3 }, sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }], gap: 0 },
          { who: "na", say: "Thầy ơi, em biết mẹo! Chọn ích chẵn để i dài là số nguyên!", sub: "Mẹo: chọn x chẵn để y nguyên", bubble: false, pose: "pointup", emote: { who: "na", icon: "idea" },
            tween: { id: "tb2", revealX: 5, dur: 2.4 }, cam: { x: 560, y: 450, zoom: 1.35, dur: 0.5 },
            sfx: [{ name: "shimmer" }, { name: "pop", at: 0.6 }, { name: "pop", at: 1.05 }, { name: "pop", at: 1.5 }, { name: "pop", at: 1.95 }, { name: "pop", at: 2.4 }] },
          { who: "thay", say: "Giỏi lắm! Thay vào: âm tám, âm hai, không, âm hai, âm tám!", sub: "y = −8; −2; 0; −2; −8", bubble: false,
            move: { who: "thay", to: col(4), y: TB_Y, dur: 2.6, style: "run" }, tween: { id: "tb2", revealY: 5, dur: 2.8 },
            sfx: [{ name: "punch", at: 0.3 }, { name: "punch2", at: 0.9 }, { name: "punch", at: 1.5 }, { name: "punch2", at: 2.1 }, { name: "punch", at: 2.7 }] },
          { show: Object.assign({}, AX2, { anim: "create", dur: 0.9 }), move: { who: "na", to: col(3), y: TB_Y, dur: 0.9, style: "jump", height: 200, spin: 360 }, cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.4 }], wait: 0.9, gap: 0 },
          plotHit("ax2", M2, P2[4], 4, CYAN, "left"),
          plotHit("ax2", M2, P2[3], 3, CYAN, undefined, false, "na"),
          hop(2, false, 0.5), plotHit("ax2", M2, P2[2], 2, CYAN),
          hop(1, false, 0.5, "na"), plotHit("ax2", M2, P2[1], 1, CYAN, undefined, false, "na"),
          hop(0, false, 0.5), plotHit("ax2", M2, P2[0], 0, CYAN, undefined, true),
          { move: [{ who: "thay", to: M2(-4.05, f2(-4.05))[0], y: M2(-4.05, f2(-4.05))[1], dur: 1.3, style: "jump", height: 260, spin: 360 }, { who: "na", to: M2(-4.05, f2(-4.05))[0] - 10, y: M2(-4.05, f2(-4.05))[1], dur: 1.5, style: "jump", height: 300, spin: -360 }],
            act: { thay: { skate: true }, na: { skate: true } }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.3 }], cam: { x: 1420, y: 580, zoom: 1.15, dur: 1.0, letterbox: true }, gap: 0.1 },
          { who: "thay", say: "Parabol giờ là một ngọn đồi. Leo dốc nào Na!", sub: "a < 0: parabol như ngọn đồi", bubble: false, pose: "skate",
            show: { id: "g2", type: "graph", axes: "ax2", fn: "-0.5*x^2", x0: -4.05, x1: 4.05, color: CYAN, width: 11, _prog: 0, pop: false, sfx: false },
            ride: [{ who: "thay", graph: "g2", from: -4.05, to: 0.25, dur: 3.4, ease: "out" }, { who: "na", graph: "g2", from: -4.05, to: -0.3, dur: 3.4, delay: 0.5, ease: "out", trail: false }], sfx: [{ name: "tension", vol: 0.55 }] },
          { who: "na", say: "Lên tới đỉnh O rồi! Vì a âm nên O là điểm cao nhất!", sub: "a = −½ < 0: O là điểm cao nhất", bubble: false, act: { thay: { pose: "victory", hold: "flag", face: "happy" }, na: { pose: "cheer", face: "happy" } },
            emote: { who: "na", icon: "!" }, anim: { do: "flash", id: "r2", at: 0.2, dur: 0.8 }, fx: [{ type: "confetti", x: M2(0, 0)[0], y: M2(0, 0)[1] - 80, at: 0.2, dur: 1.8 }],
            sfx: [{ name: "victory", vol: 0.8 }, { name: "crowd", at: 0.3, vol: 0.5, len: 3 }] },
          { who: "thay", say: "Giờ thì lao xuống dốc. Wiii!", sub: "Nối tiếp bằng đường cong trơn", bubble: false, act: { thay: { pose: "skate", hold: null }, na: { pose: "skate" } },
            ride: [{ who: "thay", graph: "g2", from: 0.25, to: 4.05, dur: 2.0, ease: "in" }, { who: "na", graph: "g2", from: -0.3, to: 3.9, dur: 2.0, delay: 0.4, ease: "in", trail: false }],
            fx: { type: "speed", on: "thay", dir: 1, at: 0.8, dur: 1.2 }, sfx: [{ name: "whoosh", at: 1.0 }, { name: "wow", at: 1.4, vol: 0.7 }] },
          { move: [{ who: "thay", by: 170, y: 960, dur: 1.2, style: "jump", height: 180, spin: 360 }, { who: "na", by: 80, y: 960, dur: 1.3, style: "jump", height: 200, spin: -360 }],
            act: { thay: { skate: false, tilt: 0, pose: "cheer" }, na: { skate: false, tilt: 0, pose: "cheer" } },
            shake: { at: 1.1, amp: 18, dur: 0.3 }, sfx: [{ name: "swish" }, { name: "land", at: 1.1 }, { name: "tada", at: 1.2 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 5. CÂU HỎI NHANH =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "ask", face: "happy" }, na: { x: 1500, pose: "think", face: "thinking", flip: true } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh cho Na: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: 1, think: 6 },
            sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "na", say: "Đáp án B ạ! Vì a bằng âm ba nhỏ hơn không, nên đồ thị nằm phía dưới trục hoành.", sub: "Đáp án B: a = −3 < 0 → dưới trục hoành", pose: "pointup", face: "happy" },
          { who: "thay", say: "Chính xác! Giỏi lắm Na!", sub: "Chính xác!", pose: "clap", face: "happy",
            move: { who: "na", by: 0, dur: 1.0, style: "jump", height: 220, spin: 360 }, fx: [{ type: "confetti", x: 960, y: 420, at: 0.4, dur: 1.8 }], sfx: [{ name: "tada" }, { name: "applause", at: 0.3, vol: 0.6 }] }
        ] },

      // ================= 6. TÓM TẮT =================
      { bg: "classroom",
        cast: { thay: { x: 300, pose: "idle", face: "happy", skate: true }, na: { x: 120, pose: "idle", face: "happy", skate: true } },
        beats: [
          { who: "thay", say: "Tóm lại, vẽ parabol có ba bước.", sub: "Tóm tắt", pose: "pointup", clear: "board",
            write: { text: "Bước 1: Lập bảng giá trị", size: 72 }, move: [{ who: "thay", to: 800, dur: 2.0, style: "skate", keep: true }, { who: "na", to: 560, dur: 2.0, style: "skate", keep: true }], sfx: [{ name: "skate", dur: 2 }] },
          { who: "na", say: "Lập bảng giá trị, biểu diễn các điểm, rồi nối bằng đường cong trơn!", sub: "Lập bảng – Biểu diễn điểm – Nối cong trơn", pose: "skate",
            write: [{ text: "Bước 2: Biểu diễn các điểm", size: 72 }, { text: "Bước 3: Nối bằng đường cong trơn", size: 72, box: true }],
            move: [{ who: "thay", to: 1480, dur: 3.5, style: "skate", keep: true }, { who: "na", to: 1250, dur: 3.5, style: "skate", keep: true }], sfx: [{ name: "skate", dur: 3.5 }] },
          { who: "thay", say: "Về nhà các em vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé.", sub: "Bài tập: vẽ đồ thị y = ½x²", act: { thay: { skate: false, pose: "wave", face: "happy" }, na: { skate: false, pose: "wave", flip: false } } },
          { who: "na", say: "Chào các bạn! Hẹn gặp lại!", sub: "Chào các bạn!", pose: "wave",
            move: [{ who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 230, spin: -360 }],
            fx: [{ type: "confetti", x: 1100, y: 400, at: 0.6, dur: 2.0 }], sfx: [{ name: "swish" }, { name: "tada", at: 0.8 }] },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
