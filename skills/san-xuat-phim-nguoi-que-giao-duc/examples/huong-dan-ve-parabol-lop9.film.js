// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức) — BẢN PHIM HÀNH ĐỘNG
// Nền là BẢNG XANH (phấn màu). Thầy Chung lao vào bảng, nhảy xoay người lên bảng giá trị, đá số vào ô ("BỐP!"),
// điểm bay toạ độ kiểu Manim và nổ tia lửa khi chạm, trượt ván vẽ parabol, vấp ngã K.O. ở góc nhọn,
// leo đồi cắm cờ, nhảy lộn tiếp đất. Mỗi hành động đều có tiếng động.
(function () {
  const mapper = (A) => (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const SC = 0.56, TB_Y = 420;
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
  const hop = (i, spin, dur) => ({ move: { who: "thay", to: col(i), y: TB_Y, dur: dur || 0.6, style: "jump", height: spin ? 210 : 120, spin: spin ? 360 : 0 },
    sfx: [{ name: spin ? "swish" : "swish2", vol: 0.7 }], fx: { type: "dust", x: col(i), y: TB_Y + 6, at: (dur || 0.6) * 0.8, dur: 0.5 }, gap: 0 });
  // đá số xuống ô y: "BỐP!" + rung
  const kick = (tb, n, i, rowY) => ({ act: { thay: { pose: "kick", snap: 0.08 } }, tween: { id: tb, revealY: n, dur: 0.3 },
    sfx: [{ name: "swish2", vol: 0.6 }, { name: "punch", at: 0.12 }], fx: { type: "hit", x: col(i), y: rowY, at: 0.1, dur: 0.5, text: "BỐP!", color: "#ffd54f" },
    shake: { at: 0.12, amp: 12, dur: 0.25 }, wait: 0.6, gap: 0 });
  // biểu diễn điểm kiểu Manim + nổ tia lửa khi chạm
  const plotHit = (ax, M, p, i, color, side, last) => {
    const [px, py] = M(p[0], p[1]);
    return { act: { thay: { pose: "kick", snap: 0.08 } },
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
    cast: { thay: TEACHER },
    scenes: [
      // ================= 1. MỞ ĐẦU: chạy vào lớp, nhảy xoay, lao vào bảng =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -200, pose: "idle", face: "happy" } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung hướng dẫn", dur: 3.0 }, sfx: ["bell", { name: "boom", at: 0.2, vol: 0.7 }] },
          { move: { who: "thay", to: 300, dur: 1.3, style: "run" }, fx: { type: "speed", on: "thay", dir: 1, dur: 1.2 }, sfx: [{ name: "whoosh" }], gap: 0 },
          { move: { who: "thay", by: 0, dur: 1.1, style: "jump", height: 260, spin: 360 }, act: { thay: { face: "happy" } }, sfx: [{ name: "swish" }],
            fx: [{ type: "dust", on: "thay", part: "legs", dy: 120, at: 0.9, dur: 0.6 }, Object.assign(bang("BÙM!", 300, 520), { at: 0.9 })], shake: { at: 0.9, amp: 16, dur: 0.3 }, gap: 0.1 },
          { who: "thay", say: "Chào các em! Hôm nay thầy cùng các em vẽ đồ thị hàm số i dài bằng a ích bình phương!", sub: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)", pose: "wave", face: "happy" },
          { who: "thay", say: "Đồ thị là một parabol đỉnh O, nhận trục O y làm trục đối xứng.", sub: "Parabol đỉnh O, trục đối xứng Oy", pose: "write", hold: "chalk",
            write: [{ text: "y = ax² (a ≠ 0): parabol đỉnh O", size: 68 }, { text: "• Trục đối xứng: Oy", size: 64 }] },
          { who: "thay", say: "a dương: đồ thị nằm trên trục hoành. a âm: nằm dưới trục hoành.", sub: "a > 0: trên trục hoành · a < 0: dưới trục hoành", pose: "write",
            write: [{ text: "• a > 0: trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" }, { text: "• a < 0: dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" }] },
          { who: "thay", say: "Ba bước: lập bảng, biểu diễn điểm, nối đường cong. Nào, vào trong bảng thôi!", sub: "Lập bảng → Biểu diễn điểm → Nối", pose: "pointup", hold: null, emote: { who: "thay", icon: "!" },
            write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] },
          { move: { who: "thay", to: 1150, y: 520, dur: 1.2, style: "jump", height: 320, spin: 360 }, cam: { x: 1150, y: 380, zoom: 1.8, dur: 1.2 }, sfx: [{ name: "swish" }, { name: "magic", at: 0.8, vol: 0.8 }], gap: 0 }
        ] },

      // ================= 2. VÍ DỤ 1: y = 2x² =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC } },
        beats: [
          { title: { text: "VÍ DỤ 1:  y = 2x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: "#fff176" }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb", type: "table", x: 60, y: TB_Y, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: YEL }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: { who: "thay", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, sfx: [{ name: "swish", at: 0.2 }],
            fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }], shake: { at: 1.05, amp: 14, dur: 0.3 }, gap: 0 },
          { who: "thay", say: "Bước một: lập bảng giá trị! Chọn ích bằng âm hai, âm một, không, một, hai.", sub: "Bước 1: Lập bảng giá trị", bubble: false,
            move: { who: "thay", to: col(4), y: TB_Y, dur: 2.2, style: "run" }, tween: { id: "tb", revealX: 5, dur: 2.2 }, cam: { x: 560, y: 440, zoom: 1.35, dur: 0.5 },
            sfx: [{ name: "whoosh", vol: 0.6 }, { name: "pop", at: 0.5 }, { name: "pop", at: 0.95 }, { name: "pop", at: 1.4 }, { name: "pop", at: 1.85 }, { name: "pop", at: 2.2 }] },
          hop(0, true, 1.0),
          { who: "thay", say: "Âm hai: hai nhân bình phương âm hai, bằng tám!", sub: "x = −2: y = 2·(−2)² = 8", bubble: false, pose: "explain",
            show: { id: "calc", type: "text", text: "y = 2·(−2)^2 = 8", x: 560, y: 112, size: 74, color: YEL, anim: "write", dur: 0.8, sfx: "marker" } },
          kick("tb", 1, 0, TB_Y + 168),
          hop(1),
          { who: "thay", say: "Âm một: bằng hai!", sub: "x = −1: y = 2·(−1)² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·(−1)^2 = 2" }, dur: 0.4 } },
          kick("tb", 2, 1, TB_Y + 168),
          hop(2, true, 0.8),
          { who: "thay", say: "Không: bằng không!", sub: "x = 0: y = 2·0² = 0", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·0^2 = 0" }, dur: 0.4 } },
          kick("tb", 3, 2, TB_Y + 168),
          hop(3),
          { who: "thay", say: "Một: bằng hai!", sub: "x = 1: y = 2·1² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·1^2 = 2" }, dur: 0.4 } },
          kick("tb", 4, 3, TB_Y + 168),
          hop(4, true, 0.8),
          { who: "thay", say: "Hai: bằng tám! Xong bảng!", sub: "x = 2: y = 2·2² = 8", bubble: false, pose: "cheer", face: "happy", anim: { do: "transform", id: "calc", to: { text: "y = 2·2^2 = 8" }, dur: 0.4 } },
          kick("tb", 5, 4, TB_Y + 168),
          { who: "thay", say: "Bước hai: biểu diễn điểm! Các điểm, bay lên nào!", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "pointup",
            anim: { do: "fadeout", id: "calc", dur: 0.4 }, show: Object.assign({}, AX1, { anim: "create", dur: 1.0 }),
            cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.5 }] },
          plotHit("ax", M1, P1[4], 4, PINK, "left"),
          hop(3, false, 0.45), plotHit("ax", M1, P1[3], 3, PINK),
          hop(2, false, 0.45), plotHit("ax", M1, P1[2], 2, PINK),
          hop(1, false, 0.45), plotHit("ax", M1, P1[1], 1, PINK),
          hop(0, false, 0.45), plotHit("ax", M1, P1[0], 0, PINK, undefined, true),
          { who: "thay", say: "Các cặp điểm đối xứng nhau qua trục O y!", sub: "Các cặp điểm đối xứng qua Oy", bubble: false, pose: "point", face: "happy",
            anim: [{ do: "flash", id: "p0", dur: 0.6, sfx: "ding" }, { do: "flash", id: "p4", dur: 0.6 }, { do: "flash", id: "p1", at: 0.9, dur: 0.6, sfx: "ding" }, { do: "flash", id: "p3", at: 0.9, dur: 0.6 }] },
          { who: "thay", say: "Bước ba: lên ván trượt!", sub: "Bước 3: Nối bằng đường cong trơn", bubble: false, pose: "cheer",
            move: { who: "thay", to: M1(-2.05, f1(-2.05))[0], y: M1(-2.05, f1(-2.05))[1], dur: 1.2, style: "jump", height: 260, spin: 360 }, act: { thay: { skate: true } },
            cam: { x: 1400, y: 540, zoom: 1.15, dur: 1.0, letterbox: true }, sfx: [{ name: "swish" }, { name: "land", at: 1.1 }] },
          { who: "thay", say: "Wiii! Ván trượt qua đủ năm điểm, vẽ nên đường cong trơn: parabol!", sub: "Qua cả 5 điểm → đường cong trơn: parabol", bubble: false, pose: "skate",
            show: { id: "g1", type: "graph", axes: "ax", fn: "2*x^2", x0: -2.05, x1: 2.05, color: YEL, width: 11, _prog: 0, pop: false, sfx: false },
            ride: { who: "thay", graph: "g1", from: -2.05, to: 2.05, dur: 4.0 },
            fx: [{ type: "speed", on: "thay", dir: 1, at: 1.3, dur: 1.4 }],
            anim: [{ do: "flash", id: "p1", at: 1.45, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p2", at: 2.0, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p3", at: 2.55, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p4", at: 3.9, dur: 0.5, sfx: "ding" }],
            sfx: [{ name: "wow", at: 2.0, vol: 0.7 }] },
          { move: { who: "thay", by: 0, dur: 1.1, style: "jump", height: 230, spin: -360 }, sfx: [{ name: "swish" }, { name: "land", at: 1.0 }], fx: { type: "speed", on: "thay", dir: -1, dur: 0.8 }, gap: 0 },
          { who: "thay", say: "Trượt về đáy máng: O là điểm thấp nhất, vì a bằng hai lớn hơn không!", sub: "a = 2 > 0: O là điểm thấp nhất", bubble: false, pose: "skate", face: "happy",
            ride: { who: "thay", graph: "g1", from: 2.05, to: 0, dur: 2.4, ease: "out", trail: false }, anim: { do: "flash", id: "p2", at: 2.4, dur: 0.8, sfx: "ding" } },
          { move: { who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, act: { thay: { pose: "cheer" } },
            fx: [{ type: "confetti", x: 1450, y: 700, at: 0.6, dur: 1.6 }], sfx: [{ name: "tada", at: 0.6 }, { name: "applause", at: 0.6, vol: 0.6 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 3. LỖI HAY GẶP: vấp ngã K.O. ở góc nhọn =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: M1(-2, 8)[0], y: M1(-2, 8)[1], scale: SC * 0.9, pose: "skate", face: "happy", skate: true } },
        items: [Object.assign({}, AX1)].concat(P1.map((p, i) => ({ id: "q" + i, type: "dot", ax: "ax", at: p, r: 17, color: PINK }))),
        beats: [
          { title: { text: "LỖI HAY GẶP!", dur: 1.8, bgColor: "rgba(60,10,10,.8)", color: "#ff8a80" }, sfx: [{ name: "wrong" }] },
          { who: "thay", say: "Nhiều bạn nối các điểm bằng đoạn thẳng. Thử trượt xem sao!", sub: "Nối bằng đoạn thẳng?", bubble: false,
            show: { id: "bad", type: "poly", points: P1.map((p) => M1(p[0], p[1])), close: false, color: "#ff5252", width: 8, anim: "create", dur: 1.3 } },
          { ride: { who: "thay", path: [M1(-2, 8), M1(-1, 2), M1(0, 0)], dur: 1.4, ease: "in" }, cam: { x: 1450, y: 700, zoom: 1.5, dur: 1.4 }, sfx: [{ name: "whoosh", at: 0.6 }], gap: 0 },
          { act: { thay: { pose: "lie", skate: false, tilt: 0, face: "surprised", snap: 0.12 } }, move: { who: "thay", by: 90, dur: 0.5, style: "slide" },
            fx: [{ type: "hit", on: "thay", part: "chest", text: "OÁI!", dur: 0.8 }, { type: "dust", on: "thay", part: "legs", dy: 100, dur: 0.7 }], shake: { amp: 26, dur: 0.45 },
            sfx: [{ name: "fall" }, { name: "ko", at: 0.2, vol: 0.8 }, { name: "boing", at: 0.4 }], show: { id: "x1", type: "cross", x: 870, y: 300, scale: 1.2, sfx: "wrong" }, wait: 1.2, gap: 0 },
          { who: "thay", say: "Ối! Vấp ngã ở góc nhọn rồi! Parabol không có góc nhọn, nối như vậy là sai.", sub: "Sai! Parabol không có góc nhọn", bubble: false, act: { thay: { pose: "dizzy", face: "sad" } },
            emote: { who: "thay", icon: "?" }, anim: { do: "fadeout", id: "bad", at: 2.6, dur: 0.6 }, cam: { x: 960, y: 540, zoom: 1, dur: 1.0 } },
          { move: { who: "thay", to: M1(-2, 8)[0], y: M1(-2, 8)[1], dur: 1.1, style: "jump", height: 240, spin: 360 }, act: { thay: { pose: "idle", face: "happy", skate: true } }, hide: "x1", sfx: [{ name: "swish" }], gap: 0 },
          { who: "thay", say: "Nối bằng đường cong trơn thì trượt êm ru!", sub: "Đúng: nối bằng đường cong trơn", bubble: false, pose: "skate", face: "happy",
            show: [{ id: "good", type: "graph", axes: "ax", fn: "2*x^2", x0: -2, x1: 2, color: GREEN, width: 11, _prog: 0, pop: false, sfx: false }, { id: "ok", type: "check", x: 870, y: 300, scale: 1.2, sfx: "correct" }],
            ride: { who: "thay", graph: "good", from: -2, to: 2, dur: 3.2 }, sfx: [{ name: "wow", at: 1.6, vol: 0.7 }] }
        ] },

      // ================= 4. VÍ DỤ 2: y = −½x² — ngọn đồi =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC } },
        beats: [
          { title: { text: "VÍ DỤ 2:  y = −½x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: CYAN }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb2", type: "table", x: 60, y: TB_Y, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: CYAN }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: { who: "thay", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, fx: { type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }, shake: { at: 1.05, amp: 14, dur: 0.3 }, sfx: [{ name: "swish", at: 0.2 }], gap: 0 },
          { who: "thay", say: "Mẹo: chọn ích chẵn để i dài là số nguyên!", sub: "Mẹo: chọn x chẵn để y nguyên", bubble: false, emote: { who: "thay", icon: "idea" },
            move: { who: "thay", to: col(4), y: TB_Y, dur: 2.0, style: "run" }, tween: { id: "tb2", revealX: 5, dur: 2.0 }, cam: { x: 560, y: 450, zoom: 1.35, dur: 0.5 },
            sfx: [{ name: "shimmer" }, { name: "pop", at: 0.5 }, { name: "pop", at: 0.9 }, { name: "pop", at: 1.3 }, { name: "pop", at: 1.7 }, { name: "pop", at: 2.0 }] },
          { who: "thay", say: "Thay vào: âm tám, âm hai, không, âm hai, âm tám!", sub: "y = −8; −2; 0; −2; −8", bubble: false,
            move: { who: "thay", to: col(0), y: TB_Y, dur: 2.6, style: "run" }, tween: { id: "tb2", revealY: 5, dur: 2.8 },
            sfx: [{ name: "punch", at: 0.3 }, { name: "punch2", at: 0.9 }, { name: "punch", at: 1.5 }, { name: "punch2", at: 2.1 }, { name: "punch", at: 2.7 }] },
          { show: Object.assign({}, AX2, { anim: "create", dur: 0.9 }), cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.4 }], wait: 0.9, gap: 0 },
          plotHit("ax2", M2, P2[0], 0, CYAN),
          hop(1, false, 0.45), plotHit("ax2", M2, P2[1], 1, CYAN),
          hop(2, false, 0.45), plotHit("ax2", M2, P2[2], 2, CYAN),
          hop(3, false, 0.45), plotHit("ax2", M2, P2[3], 3, CYAN),
          hop(4, false, 0.45), plotHit("ax2", M2, P2[4], 4, CYAN, "left", true),
          { move: { who: "thay", to: M2(-4.05, f2(-4.05))[0], y: M2(-4.05, f2(-4.05))[1], dur: 1.3, style: "jump", height: 260, spin: 360 }, act: { thay: { skate: true } },
            sfx: [{ name: "swish" }, { name: "land", at: 1.2 }], cam: { x: 1420, y: 580, zoom: 1.15, dur: 1.0, letterbox: true }, gap: 0.1 },
          { who: "thay", say: "Parabol giờ là một ngọn đồi. Leo dốc nào!", sub: "a < 0: parabol như ngọn đồi", bubble: false, pose: "skate",
            show: { id: "g2", type: "graph", axes: "ax2", fn: "-0.5*x^2", x0: -4.05, x1: 4.05, color: CYAN, width: 11, _prog: 0, pop: false, sfx: false },
            ride: { who: "thay", graph: "g2", from: -4.05, to: 0, dur: 3.4, ease: "out" }, sfx: [{ name: "tension", vol: 0.55 }] },
          { who: "thay", say: "Lên tới đỉnh O! Vì a âm nên O là điểm cao nhất!", sub: "a = −½ < 0: O là điểm cao nhất", bubble: false, act: { thay: { pose: "victory", hold: "flag", face: "happy" } },
            emote: { who: "thay", icon: "!" }, anim: { do: "flash", id: "r2", at: 0.2, dur: 0.8 }, fx: [{ type: "confetti", x: M2(0, 0)[0], y: M2(0, 0)[1] - 80, at: 0.2, dur: 1.8 }],
            sfx: [{ name: "victory", vol: 0.8 }, { name: "crowd", at: 0.3, vol: 0.5, len: 3 }] },
          { who: "thay", say: "Giờ thì lao xuống dốc. Wiii!", sub: "Nối tiếp bằng đường cong trơn", bubble: false, act: { thay: { pose: "skate", hold: null } },
            ride: { who: "thay", graph: "g2", from: 0, to: 4.05, dur: 2.0, ease: "in" }, fx: { type: "speed", on: "thay", dir: 1, at: 0.8, dur: 1.2 }, sfx: [{ name: "whoosh", at: 1.0 }, { name: "wow", at: 1.4, vol: 0.7 }] },
          { move: { who: "thay", by: 170, y: 960, dur: 1.2, style: "jump", height: 180, spin: 360 }, act: { thay: { skate: false, tilt: 0, pose: "cheer" } },
            fx: [{ type: "dust", x: M2(4.05, -8.2)[0] + 170, y: 960, at: 1.1, dur: 0.6 }], shake: { at: 1.1, amp: 18, dur: 0.3 },
            sfx: [{ name: "swish" }, { name: "land", at: 1.1 }, { name: "tada", at: 1.2 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 5. CÂU HỎI NHANH =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "ask", face: "happy" } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: 1, think: 6 },
            sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "thay", say: "Đáp án B! Vì a bằng âm ba nhỏ hơn không, nên đồ thị nằm phía dưới trục hoành.", sub: "Đáp án B: a = −3 < 0 → dưới trục hoành", pose: "cheer", face: "happy",
            move: { who: "thay", by: 0, dur: 1.0, style: "jump", height: 220, spin: 360 }, fx: [{ type: "confetti", x: 960, y: 420, at: 0.4, dur: 1.8 }], sfx: [{ name: "tada" }, { name: "applause", at: 0.3, vol: 0.6 }] }
        ] },

      // ================= 6. TÓM TẮT =================
      { bg: "classroom",
        cast: { thay: { x: 300, pose: "idle", face: "happy", skate: true } },
        beats: [
          { who: "thay", say: "Tóm lại, vẽ parabol có ba bước.", sub: "Tóm tắt", pose: "pointup", clear: "board",
            write: { text: "Bước 1: Lập bảng giá trị", size: 72 }, move: { who: "thay", to: 700, dur: 2.0, style: "skate", keep: true }, sfx: [{ name: "skate", dur: 2 }] },
          { who: "thay", say: "Lập bảng giá trị, biểu diễn các điểm, rồi nối bằng đường cong trơn.", sub: "Lập bảng – Biểu diễn điểm – Nối cong trơn", pose: "skate",
            write: [{ text: "Bước 2: Biểu diễn các điểm", size: 72 }, { text: "Bước 3: Nối bằng đường cong trơn", size: 72, box: true }],
            move: { who: "thay", to: 1450, dur: 3.5, style: "skate", keep: true }, sfx: [{ name: "skate", dur: 3.5 }] },
          { who: "thay", say: "Về nhà các em vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé. Chào các em!", sub: "Bài tập: vẽ đồ thị y = ½x²", act: { thay: { skate: false, pose: "wave", face: "happy" } },
            move: { who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, fx: [{ type: "confetti", x: 1100, y: 400, at: 0.6, dur: 2.0 }], sfx: [{ name: "swish" }, { name: "tada", at: 0.8 }] },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
