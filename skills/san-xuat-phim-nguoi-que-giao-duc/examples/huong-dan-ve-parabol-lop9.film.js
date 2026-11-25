// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức) — PHIM HÀNH ĐỘNG, 3 NHÂN VẬT ĐỐI THOẠI
// Thầy Chung dẫn dắt bằng câu hỏi; Na (giỏi, nhanh nhảu) và Bin (hấp tấp, hay nhầm) trả lời, tranh luận, sửa sai cho nhau.
// Nền là BẢNG XANH (phấn màu). Thầy Chung lao vào bảng, nhảy xoay người lên bảng giá trị, đá số vào ô ("BỐP!"),
// điểm bay toạ độ kiểu Manim và nổ tia lửa khi chạm, trượt ván vẽ parabol, vấp ngã K.O. ở góc nhọn,
// leo đồi cắm cờ, nhảy lộn tiếp đất. Mỗi hành động đều có tiếng động.
(function () {
  const mapper = (A) => (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const SC = 0.56, SN = 0.47, TB_Y = 420;
  const NA = { name: "Na", role: "hoc-sinh", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.78 };
  const BIN = { name: "Bin", role: "hoc-sinh", voice: "tre", hair: "spiky", skirt: false, shirt: "#ff9800", hat: "cap", hatColor: "#e53935", scale: 0.8 };
  const GROUND_T = 230;   // vị trí thầy đứng dưới bảng giá trị (dẫn dắt, đặt câu hỏi)
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
    cast: { thay: TEACHER, na: NA, bin: BIN },
    scenes: [
      // ================= 1. MỞ ĐẦU: thầy hỏi – trò đáp =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -200, pose: "idle", face: "happy" }, na: { x: 2150, pose: "idle", face: "happy", flip: true }, bin: { x: 2320, pose: "idle", face: "happy", flip: true } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung cùng Na và Bin", dur: 3.0 }, sfx: ["bell", { name: "boom", at: 0.2, vol: 0.7 }] },
          { move: { who: "thay", to: 300, dur: 1.3, style: "run" }, fx: { type: "speed", on: "thay", dir: 1, dur: 1.2 }, sfx: [{ name: "whoosh" }], gap: 0 },
          { move: { who: "thay", by: 0, dur: 1.1, style: "jump", height: 260, spin: 360 }, sfx: [{ name: "swish" }],
            fx: [{ type: "dust", on: "thay", part: "legs", dy: 120, at: 0.9, dur: 0.6 }, Object.assign(bang("BÙM!", 300, 520), { at: 0.9 })], shake: { at: 0.9, amp: 16, dur: 0.3 }, gap: 0.1 },
          { who: "thay", say: "Chào các em! Hôm nay chúng ta vẽ đồ thị hàm số i dài bằng a ích bình phương!", sub: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)", pose: "wave", face: "happy" },
          { move: [{ who: "na", to: 1250, dur: 1.6, style: "skate" }, { who: "bin", to: 1520, dur: 1.6, style: "run" }], sfx: [{ name: "skate", dur: 1.6 }, { name: "whoosh", at: 0.3 }], gap: 0 },
          { who: "na", say: "Chào thầy ạ!", sub: "Chào thầy ạ!", pose: "wave", act: { bin: { pose: "wave" } } },
          { who: "thay", say: "Các em đoán xem, đồ thị hàm số này có hình gì?", sub: "Đồ thị có hình gì?", pose: "ask", act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" } } },
          { who: "bin", say: "Là đường thẳng ạ?", sub: "Là đường thẳng ạ?", pose: "pointup", face: "happy", emote: { who: "bin", icon: "?" } },
          { who: "thay", say: "Chưa đúng rồi Bin! Đó là một đường cong gọi là parabol, có đỉnh O và nhận trục O y làm trục đối xứng.", sub: "Parabol: đỉnh O, trục đối xứng Oy", pose: "write", hold: "chalk",
            act: { bin: { pose: "shrug", face: "worried" }, na: { pose: "idle", face: "happy" } }, write: [{ text: "y = ax² (a ≠ 0): parabol đỉnh O", size: 68 }, { text: "• Trục đối xứng: Oy", size: 64 }], sfx: [{ name: "wrong", vol: 0.5 }] },
          { who: "thay", say: "Na, nếu a dương thì đồ thị nằm ở đâu?", sub: "a > 0 thì đồ thị nằm ở đâu?", pose: "ask", hold: null },
          { who: "na", say: "Dạ, nằm phía trên trục hoành ạ!", sub: "Nằm phía trên trục hoành!", pose: "pointup", face: "happy",
            write: { text: "• a > 0: trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" }, sfx: [{ name: "correct", at: 0.4 }] },
          { who: "thay", say: "Đúng! Còn a âm thì sao, Bin?", sub: "Còn a < 0 thì sao?", pose: "ask", act: { na: { pose: "idle" } } },
          { who: "bin", say: "Nằm phía dưới trục hoành ạ!", sub: "Nằm phía dưới trục hoành!", pose: "cheer", face: "happy",
            write: { text: "• a < 0: dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" }, sfx: [{ name: "correct", at: 0.4 }] },
          { who: "thay", say: "Giỏi lắm! Nhớ ba bước: lập bảng, biểu diễn điểm, nối đường cong. Cả lớp, vào trong bảng thôi!", sub: "Lập bảng → Biểu diễn điểm → Nối", pose: "pointup", emote: { who: "thay", icon: "!" },
            act: { bin: { pose: "idle" } }, write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] },
          { who: "bin", say: "Xông lên!", sub: "Xông lên!", pose: "cheer", act: { na: { pose: "cheer" } } },
          { move: [{ who: "thay", to: 1100, y: 520, dur: 1.2, style: "jump", height: 320, spin: 360 }, { who: "na", to: 1200, y: 520, dur: 1.2, style: "jump", height: 300, spin: -360 }, { who: "bin", to: 1300, y: 520, dur: 1.2, style: "jump", height: 340, spin: 360 }],
            cam: { x: 1200, y: 380, zoom: 1.8, dur: 1.2 }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.15 }, { name: "magic", at: 0.8, vol: 0.8 }], gap: 0 }
        ] },

      // ================= 2. VÍ DỤ 1: y = 2x² =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN }, bin: { x: -360, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 1:  y = 2x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: "#fff176" }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb", type: "table", x: 60, y: TB_Y, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: YEL }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: [{ who: "bin", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "na", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 }, { who: "thay", to: GROUND_T, dur: 1.4, style: "run" }],
            sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }], fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }, { type: "dust", x: 200, y: TB_Y + 6, at: 1.25, dur: 0.6 }], shake: { at: 1.05, amp: 14, dur: 0.3 }, gap: 0 },
          { who: "thay", say: "Bước một: lập bảng giá trị. Ta chọn ích bằng âm hai, âm một, không, một, hai.", sub: "Bước 1: Lập bảng giá trị", bubble: false, pose: "explain",
            tween: { id: "tb", revealX: 5, dur: 2.2 }, cam: { x: 560, y: 520, zoom: 1.2, dur: 0.5 },
            sfx: [{ name: "pop", at: 0.5 }, { name: "pop", at: 0.95 }, { name: "pop", at: 1.4 }, { name: "pop", at: 1.85 }, { name: "pop", at: 2.2 }] },
          { who: "thay", say: "Bin, ích bằng âm hai thì i dài bằng bao nhiêu?", sub: "Bin: x = −2 thì y = ?", bubble: false, pose: "ask" },
          { who: "bin", say: "Hai nhân bình phương âm hai... bằng âm tám ạ!", sub: "y = 2·(−2)² = −8 ?", bubble: false, pose: "explain",
            show: { id: "calc", type: "text", text: "y = 2·(−2)^2 = −8", x: 560, y: 112, size: 74, color: "#ff5252", anim: "write", dur: 0.8, sfx: "marker" } },
          { show: { id: "xx", type: "cross", x: 975, y: 92, scale: 0.8, sfx: "wrong" }, act: { bin: { pose: "surprised", face: "surprised" } }, shake: { amp: 8, dur: 0.25 }, wait: 0.9, gap: 0 },
          { who: "na", say: "Sai rồi Bin! Bình phương của một số âm là số dương mà!", sub: "Sai rồi! Bình phương số âm là số dương", bubble: false, pose: "pointup", face: "happy" },
          { who: "thay", say: "Na nói đúng. Âm hai bình phương bằng bốn, nên i dài bằng hai nhân bốn, bằng tám.", sub: "(−2)² = 4 → y = 2·4 = 8", bubble: false, pose: "explain",
            hide: "xx", anim: { do: "transform", id: "calc", to: { text: "y = 2·(−2)^2 = 2·4 = 8", color: YEL }, dur: 0.6 }, sfx: [{ name: "correct", at: 0.6 }], act: { bin: { pose: "idle", face: "worried" } } },
          { who: "bin", say: "À, em hiểu rồi ạ!", sub: "À, em hiểu rồi!", bubble: false, pose: "cheer", face: "happy" },
          kick("tb", 1, 0, TB_Y + 168, "bin"),
          hop(1, true, 0.9, "na"),
          { who: "na", say: "Âm một: hai nhân một bằng hai!", sub: "x = −1: y = 2·(−1)² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·(−1)^2 = 2" }, dur: 0.4 } },
          kick("tb", 2, 1, TB_Y + 168, "na"),
          hop(2, true, 0.9, "bin"),
          { who: "bin", say: "Không: bằng không ạ!", sub: "x = 0: y = 2·0² = 0", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·0^2 = 0" }, dur: 0.4 } },
          kick("tb", 3, 2, TB_Y + 168, "bin"),
          hop(3, true, 0.9, "na"),
          { who: "na", say: "Một: bằng hai!", sub: "x = 1: y = 2·1² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·1^2 = 2" }, dur: 0.4 } },
          kick("tb", 4, 3, TB_Y + 168, "na"),
          hop(4, true, 0.9, "bin"),
          { who: "bin", say: "Hai: bằng tám! Lần này em làm đúng rồi!", sub: "x = 2: y = 2·2² = 8", bubble: false, pose: "cheer", face: "happy", anim: { do: "transform", id: "calc", to: { text: "y = 2·2^2 = 8" }, dur: 0.4 } },
          kick("tb", 5, 4, TB_Y + 168, "bin"),
          { who: "thay", say: "Tuyệt vời! Bước hai: biểu diễn các điểm. Các em đá từng cột cho điểm bay lên nào!", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "pointup",
            anim: { do: "fadeout", id: "calc", dur: 0.4 }, show: Object.assign({}, AX1, { anim: "create", dur: 1.0 }), cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.5 }] },
          plotHit("ax", M1, P1[4], 4, PINK, "left", false, "bin"),
          plotHit("ax", M1, P1[3], 3, PINK, undefined, false, "na"),
          hop(2, false, 0.5, "bin"), plotHit("ax", M1, P1[2], 2, PINK, undefined, false, "bin"),
          hop(1, false, 0.5, "na"), plotHit("ax", M1, P1[1], 1, PINK, undefined, false, "na"),
          hop(0, false, 0.5, "bin"), plotHit("ax", M1, P1[0], 0, PINK, undefined, true, "bin"),
          { who: "thay", say: "Các em thấy năm điểm này có gì đặc biệt?", sub: "Các điểm có gì đặc biệt?", bubble: false, pose: "ask", act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" } } },
          { who: "na", say: "Các cặp điểm đối xứng nhau qua trục O y ạ!", sub: "Các cặp điểm đối xứng qua Oy!", bubble: false, pose: "point", face: "happy", act: { bin: { pose: "idle", face: "happy" } },
            anim: [{ do: "flash", id: "p0", dur: 0.6, sfx: "ding" }, { do: "flash", id: "p4", dur: 0.6 }, { do: "flash", id: "p1", at: 0.9, dur: 0.6, sfx: "ding" }, { do: "flash", id: "p3", at: 0.9, dur: 0.6 }] },
          { who: "thay", say: "Giỏi lắm! Bước ba: nối các điểm. Nối thế nào đây các em?", sub: "Bước 3: Nối các điểm thế nào?", bubble: false, pose: "ask" },
          { who: "bin", say: "Dễ ạ! Em nối bằng đoạn thẳng cho nhanh!", sub: "Nối bằng đoạn thẳng cho nhanh?", bubble: false, pose: "cheer",
            show: { id: "bad", type: "poly", points: P1.map((p) => M1(p[0], p[1])), close: false, color: "#ff5252", width: 8, anim: "create", dur: 1.3 } },
          { move: { who: "bin", to: M1(-2, 8)[0], y: M1(-2, 8)[1], dur: 1.0, style: "jump", height: 220, spin: 360 }, act: { bin: { skate: true, pose: "skate" } }, sfx: [{ name: "swish" }], gap: 0 },
          { ride: { who: "bin", path: [M1(-2, 8), M1(-1, 2), M1(0, 0)], dur: 1.4, ease: "in" }, cam: { x: 1450, y: 700, zoom: 1.5, dur: 1.4 }, sfx: [{ name: "whoosh", at: 0.6 }], gap: 0 },
          { act: { bin: { pose: "lie", skate: false, tilt: 0, face: "surprised", snap: 0.12 } }, move: { who: "bin", by: 90, dur: 0.5, style: "slide" },
            fx: [{ type: "hit", on: "bin", part: "chest", text: "OÁI!", dur: 0.8 }, { type: "dust", on: "bin", part: "legs", dy: 100, dur: 0.7 }], shake: { amp: 26, dur: 0.45 },
            sfx: [{ name: "fall" }, { name: "ko", at: 0.2, vol: 0.8 }, { name: "boing", at: 0.4 }], show: { id: "x1", type: "cross", x: 870, y: 300, scale: 1.2, sfx: "wrong" }, wait: 1.2, gap: 0 },
          { who: "bin", say: "Ui da! Vấp ở góc nhọn rồi!", sub: "Ui da! Vấp ở góc nhọn rồi!", bubble: false, act: { bin: { pose: "dizzy", face: "sad" } }, emote: { who: "bin", icon: "?" } },
          { who: "na", say: "Không được đâu Bin! Parabol là đường cong trơn, không có góc nhọn!", sub: "Parabol là đường cong trơn, không có góc nhọn!", bubble: false, pose: "pointup", cam: { x: 960, y: 540, zoom: 1, dur: 1.0 } },
          { who: "thay", say: "Na nói đúng. Phải nối bằng một đường cong trơn. Cả lớp, lên ván nào!", sub: "Phải nối bằng đường cong trơn!", bubble: false, pose: "cheer",
            act: { bin: { pose: "idle", face: "happy", snap: 0.5 } }, hide: "x1", anim: { do: "fadeout", id: "bad", dur: 0.6 } },
          { move: [{ who: "thay", to: M1(-2.05, f1(-2.05))[0], y: M1(-2.05, f1(-2.05))[1], dur: 1.3, style: "jump", height: 300, spin: 360 },
                   { who: "na", to: M1(-2.05, f1(-2.05))[0] - 8, y: M1(-2.05, f1(-2.05))[1], dur: 1.4, style: "jump", height: 280, spin: -360 },
                   { who: "bin", to: M1(-2.05, f1(-2.05))[0] - 16, y: M1(-2.05, f1(-2.05))[1], dur: 1.5, style: "jump", height: 300, spin: 360 }],
            act: { thay: { skate: true }, na: { skate: true }, bin: { skate: true } }, cam: { x: 1400, y: 540, zoom: 1.15, dur: 1.0, letterbox: true }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.4 }] },
          { who: "na", say: "Wiii! Ván trượt qua đủ năm điểm, thành một đường cong trơn: parabol!", sub: "Qua cả 5 điểm → đường cong trơn: parabol", bubble: false, pose: "skate",
            show: { id: "g1", type: "graph", axes: "ax", fn: "2*x^2", x0: -2.05, x1: 2.05, color: YEL, width: 11, _prog: 0, pop: false, sfx: false },
            ride: [{ who: "thay", graph: "g1", from: -2.05, to: 2.05, dur: 4.0 }, { who: "na", graph: "g1", from: -2.05, to: 1.95, dur: 4.0, delay: 0.5, trail: false }, { who: "bin", graph: "g1", from: -2.05, to: 1.85, dur: 4.0, delay: 1.0, trail: false }],
            fx: [{ type: "speed", on: "thay", dir: 1, at: 1.3, dur: 1.4 }],
            anim: [{ do: "flash", id: "p1", at: 1.45, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p2", at: 2.0, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p3", at: 2.55, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p4", at: 3.9, dur: 0.5, sfx: "ding" }],
            sfx: [{ name: "wow", at: 2.0, vol: 0.7 }] },
          { move: [{ who: "thay", by: 0, dur: 1.1, style: "jump", height: 230, spin: -360 }, { who: "na", by: 0, dur: 1.1, style: "jump", height: 200, spin: -360 }, { who: "bin", by: 0, dur: 1.1, style: "jump", height: 250, spin: 360 }], sfx: [{ name: "swish" }, { name: "land", at: 1.0 }], gap: 0 },
          { who: "thay", say: "Điểm nào thấp nhất? Vì sao?", sub: "Điểm nào thấp nhất? Vì sao?", bubble: false, pose: "skate",
            ride: [{ who: "thay", graph: "g1", from: 2.05, to: 0.35, dur: 2.2, ease: "out", trail: false }, { who: "na", graph: "g1", from: 1.95, to: 0, dur: 2.2, ease: "out", trail: false }, { who: "bin", graph: "g1", from: 1.85, to: -0.35, dur: 2.2, ease: "out", trail: false }] },
          { who: "bin", say: "Điểm O thấp nhất ạ! Vì a bằng hai lớn hơn không!", sub: "O thấp nhất, vì a = 2 > 0", bubble: false, pose: "cheer", face: "happy", anim: { do: "flash", id: "p2", dur: 0.8, sfx: "ding" } },
          { who: "thay", say: "Chính xác! Cả lớp giỏi lắm!", sub: "Chính xác!", bubble: false,
            move: [{ who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 230, spin: -360 }, { who: "bin", by: 0, dur: 1.0, style: "jump", height: 250, spin: 360 }],
            act: { thay: { pose: "cheer" }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            fx: [{ type: "confetti", x: 1450, y: 700, at: 0.6, dur: 1.6 }], sfx: [{ name: "tada", at: 0.6 }, { name: "applause", at: 0.6, vol: 0.6 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false } }
        ] },

      // ================= 3. VÍ DỤ 2: y = −½x² — ngọn đồi =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN }, bin: { x: -360, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 2:  y = −½x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: CYAN }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: { id: "tb2", type: "table", x: 60, y: TB_Y, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: CYAN }, color: "#f5f5ec", anim: "create", dur: 0.7, sfx: "swish" },
            move: [{ who: "na", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "bin", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 }, { who: "thay", to: GROUND_T, dur: 1.4, style: "run" }],
            fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }], shake: { at: 1.05, amp: 14, dur: 0.3 }, sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }], gap: 0 },
          { who: "thay", say: "Ví dụ hai: i dài bằng âm một phần hai ích bình phương. Nên chọn ích thế nào cho dễ tính?", sub: "Nên chọn x thế nào cho dễ tính?", bubble: false, pose: "ask", cam: { x: 560, y: 520, zoom: 1.2, dur: 0.6 } },
          { who: "na", say: "Chọn ích là số chẵn ạ!", sub: "Chọn x là số chẵn!", bubble: false, pose: "pointup", emote: { who: "na", icon: "idea" },
            tween: { id: "tb2", revealX: 5, dur: 2.0 }, sfx: [{ name: "shimmer" }, { name: "pop", at: 0.5 }, { name: "pop", at: 0.9 }, { name: "pop", at: 1.3 }, { name: "pop", at: 1.7 }, { name: "pop", at: 2.0 }] },
          { who: "thay", say: "Vì sao vậy Bin?", sub: "Vì sao?", bubble: false, pose: "ask" },
          { who: "bin", say: "Vì ích chẵn thì ích bình phương chia hết cho hai, nên i dài là số nguyên ạ!", sub: "x chẵn → x² chia hết cho 2 → y nguyên", bubble: false, pose: "explain" },
          { who: "thay", say: "Giỏi! Na tính cột đầu tiên nào.", sub: "Na tính cột đầu tiên", bubble: false, pose: "point" },
          { who: "na", say: "Âm bốn: âm một phần hai nhân mười sáu, bằng âm tám!", sub: "x = −4: y = −½·16 = −8", bubble: false, pose: "explain",
            show: { id: "calc2", type: "text", text: "y = -\\frac{1}{2}·(−4)^2 = −8", x: 560, y: 120, size: 70, color: CYAN, anim: "write", dur: 0.8, sfx: "marker" } },
          kick("tb2", 1, 0, TB_Y + 195, "na"),
          { who: "bin", say: "Em tính nốt! Âm hai, không, âm hai, âm tám!", sub: "y = −2; 0; −2; −8", bubble: false,
            move: { who: "bin", to: col(4), y: TB_Y, dur: 2.6, style: "run" }, tween: { id: "tb2", revealY: 5, dur: 2.8 }, anim: { do: "fadeout", id: "calc2", dur: 0.5 },
            sfx: [{ name: "punch2", at: 0.9 }, { name: "punch", at: 1.5 }, { name: "punch2", at: 2.1 }, { name: "punch", at: 2.7 }] },
          { show: Object.assign({}, AX2, { anim: "create", dur: 0.9 }), cam: { x: 960, y: 540, zoom: 1, dur: 0.45, whip: true }, sfx: [{ name: "swish", at: 0.4 }], wait: 0.9, gap: 0 },
          plotHit("ax2", M2, P2[4], 4, CYAN, "left", false, "bin"),
          plotHit("ax2", M2, P2[0], 0, CYAN, undefined, false, "na"),
          hop(3, false, 0.5, "bin"), plotHit("ax2", M2, P2[3], 3, CYAN, undefined, false, "bin"),
          hop(1, false, 0.5, "na"), plotHit("ax2", M2, P2[1], 1, CYAN, undefined, false, "na"),
          hop(2, false, 0.5, "bin"), plotHit("ax2", M2, P2[2], 2, CYAN, undefined, true, "bin"),
          { who: "thay", say: "Lần này đỉnh O là điểm cao nhất hay thấp nhất?", sub: "O cao nhất hay thấp nhất?", bubble: false, pose: "ask" },
          { who: "bin", say: "Cao nhất ạ! Vì a âm!", sub: "Cao nhất! Vì a < 0", bubble: false, pose: "cheer", face: "happy" },
          { who: "thay", say: "Đúng! Cả lớp leo đồi kiểm tra nào!", sub: "Leo đồi kiểm tra nào!", bubble: false, pose: "cheer",
            move: [{ who: "thay", to: M2(-4.05, f2(-4.05))[0], y: M2(-4.05, f2(-4.05))[1], dur: 1.3, style: "jump", height: 260, spin: 360 },
                   { who: "na", to: M2(-4.05, f2(-4.05))[0] - 8, y: M2(-4.05, f2(-4.05))[1], dur: 1.4, style: "jump", height: 300, spin: -360 },
                   { who: "bin", to: M2(-4.05, f2(-4.05))[0] - 16, y: M2(-4.05, f2(-4.05))[1], dur: 1.5, style: "jump", height: 300, spin: 360 }],
            act: { thay: { skate: true }, na: { skate: true }, bin: { skate: true } }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.4 }], cam: { x: 1420, y: 580, zoom: 1.15, dur: 1.0, letterbox: true } },
          { who: "na", say: "Leo dốc nào!", sub: "Leo dốc nào!", bubble: false, pose: "skate",
            show: { id: "g2", type: "graph", axes: "ax2", fn: "-0.5*x^2", x0: -4.05, x1: 4.05, color: CYAN, width: 11, _prog: 0, pop: false, sfx: false },
            ride: [{ who: "thay", graph: "g2", from: -4.05, to: 0.3, dur: 3.4, ease: "out" }, { who: "na", graph: "g2", from: -4.05, to: -0.2, dur: 3.4, delay: 0.45, ease: "out", trail: false }, { who: "bin", graph: "g2", from: -4.05, to: -0.7, dur: 3.4, delay: 0.9, ease: "out", trail: false }],
            sfx: [{ name: "tension", vol: 0.55 }] },
          { who: "bin", say: "Đỉnh O cao nhất thật!", sub: "Đỉnh O là điểm cao nhất!", bubble: false, act: { thay: { pose: "victory", hold: "flag", face: "happy" }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            emote: { who: "bin", icon: "!" }, anim: { do: "flash", id: "r2", at: 0.2, dur: 0.8 }, fx: [{ type: "confetti", x: M2(0, 0)[0], y: M2(0, 0)[1] - 80, at: 0.2, dur: 1.8 }],
            sfx: [{ name: "victory", vol: 0.8 }, { name: "crowd", at: 0.3, vol: 0.5, len: 3 }] },
          { who: "thay", say: "Giờ thì lao xuống dốc nào!", sub: "Lao xuống dốc!", bubble: false, act: { thay: { pose: "skate", hold: null }, na: { pose: "skate" }, bin: { pose: "skate" } },
            ride: [{ who: "thay", graph: "g2", from: 0.3, to: 4.05, dur: 2.0, ease: "in" }, { who: "na", graph: "g2", from: -0.2, to: 3.9, dur: 2.0, delay: 0.35, ease: "in", trail: false }, { who: "bin", graph: "g2", from: -0.7, to: 3.75, dur: 2.0, delay: 0.7, ease: "in", trail: false }],
            fx: { type: "speed", on: "thay", dir: 1, at: 0.8, dur: 1.2 }, sfx: [{ name: "whoosh", at: 1.0 }, { name: "wow", at: 1.4, vol: 0.7 }] },
          { move: [{ who: "thay", by: 170, y: 960, dur: 1.2, style: "jump", height: 180, spin: 360 }, { who: "na", by: 60, y: 960, dur: 1.3, style: "jump", height: 200, spin: -360 }, { who: "bin", by: -60, y: 960, dur: 1.4, style: "jump", height: 220, spin: 360 }],
            act: { thay: { skate: false, tilt: 0, pose: "cheer" }, na: { skate: false, tilt: 0, pose: "cheer" }, bin: { skate: false, tilt: 0, pose: "cheer" } },
            shake: { at: 1.1, amp: 18, dur: 0.3 }, sfx: [{ name: "swish" }, { name: "land", at: 1.1 }, { name: "tada", at: 1.2 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 4. CÂU HỎI NHANH: Bin sai, Na sửa =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "ask", face: "happy" }, na: { x: 1330, pose: "think", face: "thinking", flip: true }, bin: { x: 1560, pose: "think", face: "thinking", flip: true } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: -1, think: 5 }, sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "bin", say: "Em chọn A ạ!", sub: "Em chọn A!", pose: "pointup", face: "happy",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: -1, think: 0 }, sfx: [{ name: "wrong", at: 1.0 }] },
          { who: "na", say: "Không phải đâu Bin! a bằng âm ba nhỏ hơn không, nên đồ thị nằm dưới trục hoành. Đáp án B ạ!", sub: "a = −3 < 0 → dưới trục hoành: Đáp án B", pose: "pointup", face: "happy",
            act: { bin: { pose: "facepalm", face: "worried" } },
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: 1, think: 0 } },
          { who: "thay", say: "Chính xác! Bin nhớ nhé: a âm thì parabol nằm dưới trục hoành.", sub: "a < 0 → parabol nằm dưới trục hoành", pose: "clap", face: "happy" },
          { who: "bin", say: "Dạ, em nhớ rồi ạ!", sub: "Em nhớ rồi ạ!", pose: "cheer", face: "happy",
            move: [{ who: "bin", by: 0, dur: 1.0, style: "jump", height: 230, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 200, spin: -360 }],
            fx: [{ type: "confetti", x: 1450, y: 420, at: 0.4, dur: 1.8 }], sfx: [{ name: "tada" }, { name: "applause", at: 0.3, vol: 0.6 }] }
        ] },

      // ================= 5. TÓM TẮT: mỗi người một bước =================
      { bg: "classroom",
        cast: { thay: { x: 330, pose: "idle", face: "happy", skate: true }, na: { x: 180, pose: "idle", face: "happy", skate: true }, bin: { x: 40, pose: "idle", face: "happy", skate: true } },
        beats: [
          { who: "thay", say: "Ai nhắc lại ba bước vẽ parabol nào?", sub: "Nhắc lại ba bước?", pose: "ask", clear: "board" },
          { who: "bin", say: "Bước một: lập bảng giá trị!", sub: "Bước 1: Lập bảng giá trị", pose: "skate",
            write: { text: "Bước 1: Lập bảng giá trị", size: 72 }, move: [{ who: "thay", to: 700, dur: 1.8, style: "skate", keep: true }, { who: "na", to: 520, dur: 1.8, style: "skate", keep: true }, { who: "bin", to: 360, dur: 1.8, style: "skate", keep: true }], sfx: [{ name: "skate", dur: 1.8 }] },
          { who: "na", say: "Bước hai: biểu diễn các điểm!", sub: "Bước 2: Biểu diễn các điểm", pose: "skate",
            write: { text: "Bước 2: Biểu diễn các điểm", size: 72 }, move: [{ who: "thay", to: 1100, dur: 1.8, style: "skate", keep: true }, { who: "na", to: 920, dur: 1.8, style: "skate", keep: true }, { who: "bin", to: 760, dur: 1.8, style: "skate", keep: true }], sfx: [{ name: "skate", dur: 1.8 }] },
          { who: "thay", say: "Bước ba: nối các điểm bằng một đường cong trơn!", sub: "Bước 3: Nối bằng đường cong trơn", pose: "skate",
            write: { text: "Bước 3: Nối bằng đường cong trơn", size: 72, box: true }, move: [{ who: "thay", to: 1500, dur: 2.2, style: "skate", keep: true }, { who: "na", to: 1320, dur: 2.2, style: "skate", keep: true }, { who: "bin", to: 1160, dur: 2.2, style: "skate", keep: true }], sfx: [{ name: "skate", dur: 2.2 }, { name: "ding", at: 2.0 }] },
          { who: "thay", say: "Về nhà các em vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé!", sub: "Bài tập: vẽ đồ thị y = ½x²", act: { thay: { skate: false, pose: "wave" }, na: { skate: false, pose: "idle", flip: false }, bin: { skate: false, pose: "idle", flip: false } } },
          { who: "na", say: "Chào các bạn! Hẹn gặp lại!", sub: "Chào các bạn! Hẹn gặp lại!", pose: "wave", act: { bin: { pose: "wave" } },
            move: [{ who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 230, spin: -360 }, { who: "bin", by: 0, dur: 1.0, style: "jump", height: 250, spin: 360 }],
            fx: [{ type: "confetti", x: 1300, y: 400, at: 0.6, dur: 2.0 }], sfx: [{ name: "swish" }, { name: "tada", at: 0.8 }] },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
