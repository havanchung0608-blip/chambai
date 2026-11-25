// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức) — PHIM HÀNH ĐỘNG HÀI, 3 NHÂN VẬT
// Thầy Chung (vui tính, hay "gặp nạn") dẫn dắt; Na (giỏi, nhanh nhảu) và Bin (hấp tấp, hay nhầm) đối đáp.
// Phép tính hiện trên BẢNG CÔNG THỨC kiểu Manim gắn cố định trên màn hình (không bao giờ bị máy quay cắt),
// các dòng biến đổi bằng Transform, khoanh Circumscribe; đồ thị và điểm phát sáng; nhãn y = 2x² viết dọc đường cong.
// Gag: thầy trượt ván đâm sầm vào tường; ngất khi Bin ra −8; tung cước "chém" dấu trừ; leo dốc hết hơi được trò đẩy;
// "tèn tèn ten" khi Bin chọn sai; cuối phim ván trượt bỏ chạy, thầy đuổi theo.
(function () {
  const mapper = (A) => (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const NA = { name: "Na", role: "hoc-sinh", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.78 };
  const BIN = { name: "Bin", role: "hoc-sinh", voice: "tre", hair: "spiky", skirt: false, shirt: "#ff9800", hat: "cap", hatColor: "#e53935", scale: 0.8 };
  const SC = 0.56, SN = 0.47, TB_Y = 420;
  const POD_X = 230, POD_Y = 880;          // bục giảng: thầy đứng cao hơn phụ đề, không bị che
  const PODIUM = { id: "pod", type: "box", x: POD_X, y: POD_Y + 60, w: 250, h: 120, color: "#8d6e63", z: -1 };
  const col = (i) => 60 + 300 + 65 + 130 * i;
  const AX1 = { id: "ax", type: "axes", x: 1450, y: 580, w: 760, h: 600, xmin: -3, xmax: 3, ymin: -0.5, ymax: 8.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y", color: "#f5f5ec" };
  const AX2 = { id: "ax2", type: "axes", x: 1460, y: 600, w: 780, h: 600, xmin: -5, xmax: 5, ymin: -8.5, ymax: 0.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y", color: "#f5f5ec" };
  const M1 = mapper(AX1), M2 = mapper(AX2);
  const Q1 = [[-2, 8], [-1, 2], [0, 0], [1, 2], [2, 8]].map((p) => M1(p[0], p[1]));
  const P1 = [[-2, 8], [-1, 2], [0, 0], [1, 2], [2, 8]];
  const P2 = [[-4, -8], [-2, -2], [0, 0], [2, -2], [4, -8]];
  const f1 = (x) => 2 * x * x, f2 = (x) => -0.5 * x * x;
  const YEL = "#fff176", PINK = "#ff8a80", CYAN = "#80deea", CHALK = "#f5f5ec", RED = "#ff5252";
  const label = (p) => p[0] === 0 && p[1] === 0 ? "O" : `(${String(p[0]).replace("-", "−")}; ${String(p[1]).replace("-", "−")})`;

  // ---------- BẢNG CÔNG THỨC MANIM (toạ độ màn hình) ----------
  const PX = 1460, PY = 420, LX = 1110, LY = [300, 430, 560], NY = 665;
  const panel = (title, color) => ({ id: "pn", type: "panel", screen: true, x: PX, y: PY, w: 820, h: 600, title, titleColor: color || CYAN, size: 58, anim: "fadein", dur: 0.5, sfx: "shimmer", z: 0 });
  const line = (k, text, color, size) => ({ id: "l" + k, type: "text", screen: true, text, x: LX, y: LY[k - 1], size: size || 86, align: "left", color: color || CHALK, anim: "write", dur: 0.7, sfx: "marker", z: 1 });
  const fadeCalc = (ids, at) => ids.map((id) => ({ do: "fadeout", id, at: at || 0, dur: 0.45 }));
  // một cột của bảng giá trị: ba dòng Transform nối tiếp + khoanh kết quả
  const calcCol = (who, say, sub, t1, t2, t3, xv) => ({ who, say, sub, bubble: false, pose: "explain", set: { id: "pn", title: `Thay x = ${xv}:` },
    anim: [{ do: "transform", id: "l1", to: { text: t1 }, dur: 0.45 }, { do: "transform", id: "l2", to: { text: t2 }, at: 0.55, dur: 0.45 },
      { do: "transform", id: "l3", to: { text: t3 }, at: 1.1, dur: 0.45 }, { do: "circumscribe", id: "l3", at: 1.65, dur: 0.9 }],
    sfx: [{ name: "swish2", vol: 0.5 }, { name: "swish2", at: 0.55, vol: 0.5 }, { name: "swish2", at: 1.1, vol: 0.5 }, { name: "ding", at: 1.7 }] });

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
      wait: last ? 2.2 : 1.5, gap: 0 };
  };
  const bang = (text, x, y, color, at) => ({ type: "hit", x, y, dur: 0.7, text, color: color || "#ffd54f", at: at || 0 });

  // ---------- THƯỚC KẺ + PHẤN: thước bay vào, mép thước trùng đoạn AB, đầu phấn chạy dọc mép kẻ ----------
  const RW = 860, ang = (A, B) => Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  const rulerIn = (A, B, from, extra) => Object.assign({
    show: { id: "ru", type: "ruler", w: RW, x: from[0], y: from[1], rot: ang(A, B) - 720, scale: 0.25, pop: false, sfx: false, z: 5 },
    anim: { do: "move", id: "ru", x: A[0], y: A[1], rot: ang(A, B), scale: 1, dur: 0.9, sfx: false },
    fx: { type: "speed", x: A[0], y: A[1], dir: 1, dur: 0.6 },
    sfx: [{ name: "swish" }, { name: "whoosh", at: 0.15 }, { name: "click", at: 0.9 }, { name: "click", at: 0.97 }], shake: { at: 0.9, amp: 6, dur: 0.15 }, wait: 0.25, gap: 0 }, extra || {});
  const rulerMove = (A, B, extra) => Object.assign({
    anim: [{ do: "move", id: "ru", x: A[0], y: A[1], rot: ang(A, B), dur: 0.55, sfx: false }, { do: "move", id: "pc", x: A[0], y: A[1], dur: 0.55, sfx: false }],
    sfx: [{ name: "swish2", vol: 0.6 }, { name: "click", at: 0.55 }], wait: 0.15, gap: 0 }, extra || {});
  const rulerDraw = (id, A, B, D, color, width, extra) => Object.assign({
    show: [{ id: "pc", type: "pencil", x: A[0], y: A[1], z: 6, pop: false, sfx: false },
      { id, type: "seg", x: 0, y: 0, x1: A[0], y1: A[1], x2: B[0], y2: B[1], color: color || CHALK, width: width || 5, anim: "create", dur: D, sfx: "chalk" }],
    anim: { do: "move", id: "pc", x: B[0], y: B[1], dur: D, sfx: false }, gap: 0 }, extra || {});
  const rulerOut = (extra) => Object.assign({
    anim: [{ do: "move", id: "ru", x: 2500, y: -200, rot: 540, scale: 0.4, dur: 0.7, sfx: false }, { do: "fadeout", id: "pc", dur: 0.3, sfx: false }],
    sfx: [{ name: "whoosh" }], wait: 0.1, gap: 0 }, extra || {});
  // ---------- THƯỚC PARABOL: thước cong bay vào, đỉnh thước trùng O, phấn chạy dọc mép cong vẽ đồ thị ----------
  const prTrace = (gid, ax, M, fn, x0, x1, color, D, flashes, from, say) => [
    { show: { id: "pr", type: "pruler", axes: ax, fn, x0, x1, x: from[0], y: from[1], rot: -540, scale: 0.3, pop: false, sfx: false, z: 4 },
      anim: { do: "move", id: "pr", x: M(0, 0)[0], y: M(0, 0)[1], rot: 0, scale: 1, dur: 1.0, sfx: false },
      act: { thay: { pose: "give" } }, sfx: [{ name: "swish" }, { name: "magic", at: 0.1, vol: 0.7 }, { name: "click", at: 1.0 }, { name: "click", at: 1.07 }],
      fx: { type: "hit", x: M(0, 0)[0], y: M(0, 0)[1] + 40, at: 1.0, dur: 0.5, color }, shake: { at: 1.0, amp: 8, dur: 0.2 }, wait: 0.3, gap: 0 },
    Object.assign({ show: [{ id: gid, type: "graph", axes: ax, fn, x0, x1, color, width: 11, glow: 22, z: 5, anim: "create", dur: D, sfx: "chalk" },
        { id: "pc", type: "pencil", follow: gid, x: M(x0, 0)[0], y: M(x0, 0)[1], z: 6, pop: false, sfx: false }],
      anim: flashes.map(([id, at]) => ({ do: "flash", id, at, dur: 0.5, sfx: "ding" })), act: { thay: { pose: "point" } }, gap: 0 }, say),
    { anim: [{ do: "move", id: "pr", x: 2500, y: -300, rot: 360, scale: 0.4, dur: 0.8, sfx: false }, { do: "fadeout", id: "pc", dur: 0.3, sfx: false }],
      sfx: [{ name: "whoosh" }, { name: "shimmer", at: 0.3 }], wait: 0.2, gap: 0 },
    { hide: ["pc", "pr"], wait: 0.1, gap: 0 }
  ];

  // kẻ hai trục bằng thước rồi hiện vạch chia, nhãn (Manim fade-in)
  const axesByRuler = (AX, from, sayX, sayY) => {
    const M = mapper(AX), y0 = M(0, 0)[1], x0 = M(0, 0)[0];
    const XA = [AX.x - AX.w / 2 - 20, y0], XB = [AX.x + AX.w / 2 + 44, y0], YA = [x0, AX.y + AX.h / 2 + 20], YB = [x0, AX.y - AX.h / 2 - 44];
    return [
      rulerIn(XA, XB, from),
      rulerDraw("axx", XA, XB, 1.6, CHALK, 5, sayX),
      rulerMove(YA, YB),
      rulerDraw("axy", YA, YB, 1.4, CHALK, 5, sayY),
      rulerOut({ show: Object.assign({}, AX, { anim: "fadein", dur: 0.8, sfx: "shimmer" }) }),
      { hide: ["axx", "axy", "pc"], wait: 0.4, gap: 0 }
    ];
  };
  const Q3 = { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"] };

  window.FILM = {
    title: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)",
    subtitle: "Toán 9 · Thầy Chung hướng dẫn",
    file: "huong-dan-ve-parabol-lop9",
    watermark: "Thầy Hà Văn Chung",
    music: "intro",
    cast: { thay: TEACHER, na: NA, bin: BIN },
    scenes: [
      // ================= 1. MỞ ĐẦU: thầy trượt ván đâm sầm vào tường =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -250, pose: "skate", face: "happy", skate: true }, na: { x: 520, pose: "idle", face: "happy" }, bin: { x: 330, pose: "idle", face: "happy" } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung cùng Na và Bin", dur: 3.0 }, sfx: ["bell", { name: "boom", at: 0.2, vol: 0.7 }] },
          { move: { who: "thay", to: 1420, dur: 1.4, style: "skate", keep: true }, act: { na: { pose: "surprised", face: "surprised" }, bin: { pose: "surprised", face: "surprised" } },
            fx: { type: "speed", on: "thay", dir: 1, dur: 1.4 }, sfx: [{ name: "skate", dur: 1.5 }, { name: "whoosh", at: 0.4 }], cam: { x: 1100, y: 560, zoom: 1.12, dur: 1.4 }, gap: 0 },
          { act: { thay: { pose: "lie", skate: false, face: "surprised", snap: 0.1 } }, move: { who: "thay", by: -150, dur: 0.5, style: "slide" },
            fx: [bang("RẦM!", 1530, 700, "#ff7043"), { type: "dust", x: 1450, y: 950, dur: 0.8 }], shake: { amp: 30, dur: 0.5 },
            show: { id: "sk0", type: "skateboard", x: 1420, y: 960, color: "#ff7043" }, sfx: [{ name: "boom", vol: 0.9 }, { name: "fall", at: 0.15 }, { name: "boing", at: 0.45 }], wait: 0.9, gap: 0 },
          { tween: { id: "sk0", x: -300, dur: 1.2 }, act: { na: { pose: "clap", face: "happy" }, bin: { pose: "cheer", face: "happy" } }, sfx: [{ name: "laugh", vol: 0.8 }, { name: "skate", dur: 1.0, vol: 0.5 }], wait: 1.3, gap: 0 },
          { who: "thay", say: "Không sao... thầy vẫn khoẻ! Chào các em!", sub: "Không sao... thầy vẫn khoẻ!", pose: "dizzy", face: "happy", flip: true, emote: { who: "thay", icon: "★" },
            hide: "sk0", cam: { x: 960, y: 540, zoom: 1, dur: 0.8 } },
          { who: "na", say: "Chào thầy ạ! Thầy có sao không ạ?", sub: "Chào thầy! Thầy có sao không ạ?", pose: "wave", act: { bin: { pose: "wave" }, thay: { pose: "idle" } } },
          { who: "thay", say: "Thầy ổn! Hôm nay ta vẽ đồ thị hàm số i dài bằng a ích bình phương. Đố các em, nó có hình gì?", sub: "Đồ thị y = ax² có hình gì?", pose: "ask",
            act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" } } },
          { who: "bin", say: "Là đường thẳng ạ!", sub: "Là đường thẳng ạ!", pose: "pointup", face: "happy", emote: { who: "bin", icon: "?" } },
          { act: { thay: { pose: "facepalm", face: "worried", snap: 0.12 } }, sfx: [{ name: "fail", vol: 0.8 }], cam: { x: 1500, y: 700, zoom: 1.9, dur: 0.22 }, wait: 1.3, gap: 0 },
          { who: "thay", say: "Không phải đâu Bin! Nó cong như nụ cười của thầy đây này. Đó là đường parabol!", sub: "Nó cong như nụ cười → parabol", pose: "write", face: "happy", hold: "chalk",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.5 }, act: { bin: { pose: "shrug", face: "worried" }, na: { pose: "idle", face: "happy" } },
            write: [{ text: "y = ax² (a ≠ 0): parabol đỉnh O", size: 68 }, { text: "• Trục đối xứng: Oy", size: 64 }] },
          { who: "thay", say: "Na, nếu a dương thì đồ thị nằm ở đâu?", sub: "a > 0 thì đồ thị nằm ở đâu?", pose: "ask", hold: null },
          { who: "na", say: "Dạ, nằm phía trên trục hoành ạ!", sub: "Nằm phía trên trục hoành!", pose: "pointup", face: "happy",
            write: { text: "• a > 0: trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" }, sfx: [{ name: "correct", at: 0.4 }] },
          { who: "thay", say: "Đúng! Còn a âm thì sao, Bin?", sub: "Còn a < 0 thì sao?", pose: "ask", act: { na: { pose: "idle" } } },
          { who: "bin", say: "Nằm phía dưới trục hoành ạ!", sub: "Nằm phía dưới trục hoành!", pose: "cheer", face: "happy",
            write: { text: "• a < 0: dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" }, sfx: [{ name: "correct", at: 0.4 }] },
          { who: "thay", say: "Giỏi lắm! Ba bước: lập bảng, biểu diễn điểm, nối đường cong. Vào bảng thôi!", sub: "Lập bảng → Biểu diễn điểm → Nối", pose: "dance", emote: { who: "thay", icon: "!" },
            act: { bin: { pose: "idle" } }, write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] },
          { who: "bin", say: "Xông lên!", sub: "Xông lên!", pose: "cheer", act: { na: { pose: "cheer" } } },
          { move: [{ who: "thay", to: 1150, y: 520, dur: 1.2, style: "jump", height: 320, spin: 360 }, { who: "na", to: 1050, y: 520, dur: 1.2, style: "jump", height: 300, spin: -360 }, { who: "bin", to: 950, y: 520, dur: 1.2, style: "jump", height: 340, spin: 360 }],
            cam: { x: 1050, y: 380, zoom: 1.8, dur: 1.2 }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.15 }, { name: "magic", at: 0.8, vol: 0.8 }], gap: 0 }
        ] },

      // ================= 2. VÍ DỤ 1: y = 2x² =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN }, bin: { x: -360, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 1:  y = 2x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: YEL }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: [{ id: "tb", type: "table", x: 60, y: TB_Y, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: YEL }, color: CHALK, anim: "create", dur: 0.7, sfx: "swish" }, PODIUM],
            move: [{ who: "bin", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "na", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 },
              { who: "thay", to: POD_X, y: POD_Y, dur: 1.6, style: "jump", height: 380, spin: 720 }],
            sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }, { name: "land", at: 1.4 }],
            fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }, { type: "dust", x: POD_X, y: POD_Y + 4, at: 1.35, dur: 0.6 }], shake: { at: 1.35, amp: 14, dur: 0.3 }, gap: 0 },
          { who: "thay", say: "Bước một: lập bảng giá trị. Ta chọn ích bằng âm hai, âm một, không, một, hai.", sub: "Bước 1: Lập bảng giá trị", bubble: false, pose: "explain",
            tween: { id: "tb", revealX: 5, dur: 2.2 }, sfx: [{ name: "pop", at: 0.5 }, { name: "pop", at: 0.95 }, { name: "pop", at: 1.4 }, { name: "pop", at: 1.85 }, { name: "pop", at: 2.2 }] },
          { who: "thay", say: "Bin, ích bằng âm hai thì i dài bằng bao nhiêu?", sub: "Bin: x = −2 thì y = ?", bubble: false, pose: "ask",
            show: [panel("Thay x = −2:"), Object.assign(line(1, "y = 2·(−2)^2"), { at: 0.5 })] },
          { who: "bin", say: "Hai nhân bình phương âm hai... bằng âm tám ạ!", sub: "y = 2·(−2)² = −8 ?", bubble: false, pose: "explain", show: line(2, "= −8", RED) },
          // GAG: thầy ngất xỉu, máy quay giật sát mặt
          { show: { id: "xx", type: "cross", screen: true, x: 1420, y: LY[1] - 28, scale: 0.9, sfx: "wrong" }, act: { thay: { pose: "lie", face: "surprised", snap: 0.1 }, bin: { pose: "surprised", face: "surprised" } },
            fx: [bang("XỈU!", POD_X + 60, POD_Y - 140, "#ff7043", 0.25)], cam: { x: POD_X + 120, y: POD_Y - 140, zoom: 2.1, dur: 0.22 },
            sfx: [{ name: "fail", vol: 0.9 }, { name: "fall", at: 0.25 }], shake: { at: 0.25, amp: 16, dur: 0.3 }, wait: 1.5, gap: 0 },
          { who: "na", say: "Thầy ơi! Bin ơi, bình phương của số âm là số dương mà!", sub: "Bình phương của số âm là số dương!", bubble: false, pose: "pointup", face: "happy",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.6 }, act: { thay: { pose: "dizzy", face: "worried" } }, sfx: [{ name: "boing", at: 0.3, vol: 0.6 }] },
          { who: "thay", say: "Thầy tỉnh rồi! Để thầy tung cước chém bay dấu trừ này!", sub: "Để thầy chém bay dấu trừ!", bubble: false, pose: "guard", face: "happy",
            show: Object.assign({}, { id: "l4", type: "text", screen: true, text: "(−2)^2 = (−2)·(−2)", x: LX, y: NY, size: 62, align: "left", color: CYAN, anim: "write", dur: 0.7, sfx: "marker", z: 1 }, { at: 0.8 }),
            emote: { who: "thay", icon: "!" }, sfx: [{ name: "kungfu", vol: 0.8 }] },
          // tung cước bay vào bảng công thức
          { move: { who: "thay", to: 1030, y: 820, dur: 1.0, style: "flykick", height: 260 },
            fx: [bang("HÂY YA!", 1180, NY - 10, "#ffd54f", 0.78), { type: "speed", on: "thay", dir: 1, dur: 0.8 }], shake: { at: 0.8, amp: 22, dur: 0.35 },
            anim: [{ do: "flash", id: "l4", at: 0.8, dur: 0.6 }, { do: "transform", id: "l4", to: { text: "(−2)^2 = (−2)·(−2) = 4", color: YEL }, at: 0.95, dur: 0.5 }],
            sfx: [{ name: "whoosh" }, { name: "animepunch", at: 0.78 }, { name: "magic", at: 0.95, vol: 0.7 }], gap: 0 },
          { who: "thay", say: "Âm nhân âm ra dương! Âm hai bình phương bằng bốn. Vậy i dài bằng hai nhân bốn, bằng tám!", sub: "(−)·(−) = (+) → y = 2·4 = 8", bubble: false, pose: "pointup", face: "happy",
            hide: "xx",
            anim: [{ do: "transform", id: "l2", to: { text: "= 2·4", color: CHALK }, at: 1.4, dur: 0.5 }, { do: "circumscribe", id: "l4", at: 0.2, dur: 1.0 }],
            show: Object.assign(line(3, "= 8", YEL), { at: 3.2 }), sfx: [{ name: "correct", at: 3.4 }] },
          { who: "bin", say: "À! Âm nhân âm ra dương! Em đá số tám vào bảng đây!", sub: "À! Âm nhân âm ra dương!", bubble: false, pose: "cheer", face: "happy",
            move: { who: "thay", to: POD_X, y: POD_Y, dur: 1.0, style: "jump", height: 260, spin: -360 }, anim: { do: "circumscribe", id: "l3", at: 0.3, dur: 1.0 } },
          kick("tb", 1, 0, TB_Y + 168, "bin"),
          Object.assign(hop(1, true, 0.9, "na"), { anim: fadeCalc(["l4"]) }),
          Object.assign(calcCol("na", "Âm một: hai nhân một bằng hai!", "x = −1: y = 2·(−1)² = 2", "y = 2·(−1)^2", "= 2·1", "= 2", "−1"), { act: { thay: { pose: "dance" } } }),
          kick("tb", 2, 1, TB_Y + 168, "na"),
          hop(2, true, 0.9, "bin"),
          calcCol("bin", "Không: hai nhân không bằng không!", "x = 0: y = 2·0² = 0", "y = 2·0^2", "= 2·0", "= 0", "0"),
          kick("tb", 3, 2, TB_Y + 168, "bin"),
          hop(3, true, 0.9, "na"),
          calcCol("na", "Một: hai nhân một bằng hai!", "x = 1: y = 2·1² = 2", "y = 2·1^2", "= 2·1", "= 2", "1"),
          kick("tb", 4, 3, TB_Y + 168, "na"),
          hop(4, true, 0.9, "bin"),
          calcCol("bin", "Hai: hai nhân bốn bằng tám! Lần này em đúng rồi!", "x = 2: y = 2·2² = 8", "y = 2·2^2", "= 2·4", "= 8", "2"),
          kick("tb", 5, 4, TB_Y + 168, "bin"),
          { who: "thay", say: "Tuyệt vời! Bước hai: biểu diễn các điểm. Trước hết, thầy dùng thước kẻ hệ trục toạ độ!", sub: "Bước 2: Kẻ hệ trục bằng thước", bubble: false, pose: "pointup",
            anim: fadeCalc(["l1", "l2", "l3", "pn"]) },
          ...axesByRuler(AX1, [POD_X + 40, POD_Y - 150],
            { who: "thay", say: "Đặt mép thước thẳng, kẻ trục hoành O ích.", sub: "Kẻ trục hoành Ox", bubble: false, pose: "point" },
            { who: "thay", say: "Xoay thước, kẻ trục tung O i dài.", sub: "Kẻ trục tung Oy", bubble: false, pose: "point" }),
          { who: "thay", say: "Giờ đá từng cột cho điểm bay lên nào!", sub: "Biểu diễn các điểm", bubble: false, pose: "cheer" },
          plotHit("ax", M1, P1[4], 4, PINK, "left", false, "bin"),
          plotHit("ax", M1, P1[3], 3, PINK, undefined, false, "na"),
          hop(2, false, 0.5, "bin"), plotHit("ax", M1, P1[2], 2, PINK, undefined, false, "bin"),
          hop(1, false, 0.5, "na"), plotHit("ax", M1, P1[1], 1, PINK, undefined, false, "na"),
          hop(0, false, 0.5, "bin"), plotHit("ax", M1, P1[0], 0, PINK, undefined, true, "bin"),
          { who: "thay", say: "Các em thấy năm điểm này có gì đặc biệt?", sub: "Các điểm có gì đặc biệt?", bubble: false, pose: "ask", act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" } } },
          { who: "na", say: "Các cặp điểm đối xứng nhau qua trục O y ạ!", sub: "Các cặp điểm đối xứng qua Oy!", bubble: false, pose: "point", face: "happy", act: { bin: { pose: "idle", face: "happy" } },
            show: { id: "oy", type: "seg", x: 0, y: 0, x1: M1(0, -0.4)[0], y1: M1(0, -0.4)[1], x2: M1(0, 8.4)[0], y2: M1(0, 8.4)[1], color: CYAN, width: 6, dash: true, anim: "create", dur: 0.6 },
            anim: [{ do: "flash", id: "p0", at: 0.6, dur: 0.6, sfx: "ding" }, { do: "flash", id: "p4", at: 0.6, dur: 0.6 }, { do: "flash", id: "p1", at: 1.4, dur: 0.6, sfx: "ding" }, { do: "flash", id: "p3", at: 1.4, dur: 0.6 }] },
          { who: "thay", say: "Giỏi lắm! Bước ba: nối các điểm. Nối thế nào đây các em?", sub: "Bước 3: Nối các điểm thế nào?", bubble: false, pose: "ask", hide: "oy" },
          { who: "bin", say: "Dễ ạ! Em lấy thước nối bằng đoạn thẳng cho nhanh!", sub: "Lấy thước nối đoạn thẳng cho nhanh?", bubble: false, pose: "cheer" },
          rulerIn(Q1[0], Q1[1], [col(0), TB_Y - 120], { act: { bin: { pose: "give" } } }),
          rulerDraw("b1", Q1[0], Q1[1], 0.55, RED, 8), rulerMove(Q1[1], Q1[2]), rulerDraw("b2", Q1[1], Q1[2], 0.45, RED, 8),
          rulerMove(Q1[2], Q1[3]), rulerDraw("b3", Q1[2], Q1[3], 0.45, RED, 8), rulerMove(Q1[3], Q1[4]), rulerDraw("b4", Q1[3], Q1[4], 0.55, RED, 8),
          rulerOut({ hide: "pc", act: { bin: { pose: "cheer" } } }),
          { move: { who: "bin", to: M1(-2, 8)[0], y: M1(-2, 8)[1], dur: 1.0, style: "jump", height: 220, spin: 360 }, act: { bin: { skate: true, pose: "skate" } }, sfx: [{ name: "swish" }], gap: 0 },
          { ride: { who: "bin", path: [M1(-2, 8), M1(-1, 2), M1(0, 0)], dur: 1.4, ease: "in" }, cam: { x: 1450, y: 700, zoom: 1.5, dur: 1.4 }, sfx: [{ name: "whoosh", at: 0.6 }], gap: 0 },
          { act: { bin: { pose: "lie", skate: false, tilt: 0, face: "surprised", snap: 0.12 } }, move: { who: "bin", by: 90, dur: 0.5, style: "slide" },
            fx: [{ type: "hit", on: "bin", part: "chest", text: "OÁI!", dur: 0.8 }, { type: "dust", on: "bin", part: "legs", dy: 100, dur: 0.7 }], shake: { amp: 26, dur: 0.45 },
            sfx: [{ name: "fall" }, { name: "ko", at: 0.2, vol: 0.8 }, { name: "boing", at: 0.4 }], show: { id: "x1", type: "cross", x: 1280, y: 760, scale: 1.2, sfx: "wrong" }, wait: 1.2, gap: 0 },
          { who: "bin", say: "Ui da! Vấp ở góc nhọn rồi!", sub: "Ui da! Vấp ở góc nhọn rồi!", bubble: false, act: { bin: { pose: "dizzy", face: "sad" } }, emote: { who: "bin", icon: "?" } },
          { who: "na", say: "Thước thẳng chỉ để kẻ trục thôi Bin! Parabol là đường cong trơn, không có góc nhọn!", sub: "Thước thẳng chỉ kẻ trục! Parabol cong trơn", bubble: false, pose: "pointup", cam: { x: 960, y: 540, zoom: 1, dur: 1.0 } },
          { who: "thay", say: "Đúng! Phải nối bằng một đường cong trơn. Thầy có bảo bối đây: thước parabol!", sub: "Nối bằng đường cong trơn: thước parabol!", bubble: false, pose: "pointup",
            emote: { who: "thay", icon: "!" }, act: { bin: { pose: "idle", face: "happy", snap: 0.5 } }, move: { who: "bin", to: col(4), y: TB_Y, dur: 1.2, style: "jump", height: 260, spin: 360 }, hide: "x1", anim: ["b1", "b2", "b3", "b4"].map((id) => ({ do: "fadeout", id, dur: 0.6 })) },
          ...prTrace("g1", "ax", M1, "2*x^2", -2.05, 2.05, YEL, 3.6, [["p0", 0.1], ["p1", 1.45], ["p2", 1.8], ["p3", 2.15], ["p4", 3.5]], [POD_X + 40, POD_Y - 150],
            { who: "thay", say: "Đặt đỉnh thước trùng gốc O, phấn chạy dọc mép cong, đi qua đủ năm điểm.", sub: "Đỉnh thước trùng O, phấn qua đủ 5 điểm", bubble: false }),
          { who: "bin", say: "Oa! Cong đẹp quá! Cả lớp lên ván kiểm tra nào!", sub: "Oa! Lên ván kiểm tra nào!", bubble: false, pose: "cheer", face: "happy", sfx: [{ name: "wow", vol: 0.6 }] },
          { move: [{ who: "thay", to: M1(-2.05, f1(-2.05))[0], y: M1(-2.05, f1(-2.05))[1], dur: 1.3, style: "jump", height: 300, spin: 360 },
                   { who: "na", to: M1(-2.05, f1(-2.05))[0] - 8, y: M1(-2.05, f1(-2.05))[1], dur: 1.4, style: "jump", height: 280, spin: -360 },
                   { who: "bin", to: M1(-2.05, f1(-2.05))[0] - 16, y: M1(-2.05, f1(-2.05))[1], dur: 1.5, style: "jump", height: 300, spin: 360 }],
            act: { thay: { skate: true }, na: { skate: true }, bin: { skate: true } }, cam: { x: 1400, y: 540, zoom: 1.15, dur: 1.0, letterbox: true }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.4 }] },
          { who: "na", say: "Wiii! Ván trượt qua đủ năm điểm, thành đường cong trơn: parabol!", sub: "Qua cả 5 điểm → parabol", bubble: false, pose: "skate",
            ride: [{ who: "thay", graph: "g1", from: -2.05, to: 2.05, dur: 4.0, trail: false }, { who: "na", graph: "g1", from: -2.05, to: 1.95, dur: 4.0, delay: 0.5, trail: false }, { who: "bin", graph: "g1", from: -2.05, to: 1.85, dur: 4.0, delay: 1.0, trail: false }],
            fx: [{ type: "speed", on: "thay", dir: 1, at: 1.3, dur: 1.4 }],
            anim: [{ do: "flash", id: "p1", at: 1.45, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p2", at: 2.0, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p3", at: 2.55, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p4", at: 3.9, dur: 0.5, sfx: "ding" }],
            sfx: [{ name: "wow", at: 2.0, vol: 0.7 }] },
          { move: [{ who: "thay", by: 0, dur: 1.1, style: "jump", height: 230, spin: -360 }, { who: "na", by: 0, dur: 1.1, style: "jump", height: 200, spin: -360 }, { who: "bin", by: 0, dur: 1.1, style: "jump", height: 250, spin: 360 }],
            show: { id: "lb1", type: "text", text: "y = 2x^2", x: M1(2.5, 4.6)[0], y: M1(2.5, 4.6)[1], size: 66, color: YEL, anim: "write", dur: 0.9, at: 0.4 },
            sfx: [{ name: "swish" }, { name: "land", at: 1.0 }, { name: "shimmer", at: 0.5 }], gap: 0 },
          { who: "thay", say: "Điểm nào thấp nhất? Vì sao?", sub: "Điểm nào thấp nhất? Vì sao?", bubble: false, pose: "skate", anim: { do: "circumscribe", id: "lb1", dur: 1.0 },
            ride: [{ who: "thay", graph: "g1", from: 2.05, to: 0.35, dur: 2.2, ease: "out", trail: false }, { who: "na", graph: "g1", from: 1.95, to: 0, dur: 2.2, ease: "out", trail: false }, { who: "bin", graph: "g1", from: 1.85, to: -0.35, dur: 2.2, ease: "out", trail: false }] },
          { who: "bin", say: "Điểm O thấp nhất ạ! Vì a bằng hai lớn hơn không!", sub: "O thấp nhất, vì a = 2 > 0", bubble: false, pose: "cheer", face: "happy", anim: { do: "flash", id: "p2", dur: 0.8, sfx: "ding" } },
          { who: "thay", say: "Chính xác! Thầy thưởng một điệu nhảy!", sub: "Chính xác! Thưởng một điệu nhảy!", bubble: false,
            act: { thay: { pose: "dance", skate: false, tilt: 0 }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            fx: [{ type: "confetti", x: 1450, y: 700, at: 0.6, dur: 1.6 }], sfx: [{ name: "tada", at: 0.6 }, { name: "applause", at: 0.6, vol: 0.6 }, { name: "laugh", at: 1.6, vol: 0.5 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false } }
        ] },

      // ================= 3. VÍ DỤ 2: y = −½x² — ngọn đồi =================
      { bg: "chalkgrid", trans: "flash",
        cast: { thay: { x: -160, pose: "idle", face: "happy", scale: SC }, na: { x: -260, pose: "idle", face: "happy", scale: SN }, bin: { x: -360, pose: "idle", face: "happy", scale: SN } },
        beats: [
          { title: { text: "VÍ DỤ 2:  y = −½x²", dur: 2.0, bgColor: "rgba(15,35,25,.85)", color: CYAN }, sfx: [{ name: "boom", vol: 0.8 }] },
          { show: [{ id: "tb2", type: "table", x: 60, y: TB_Y, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: CYAN }, color: CHALK, anim: "create", dur: 0.7, sfx: "swish" }, PODIUM],
            move: [{ who: "na", to: col(0), y: TB_Y, dur: 1.3, style: "jump", height: 340, spin: 360 }, { who: "bin", to: 200, y: TB_Y, dur: 1.5, style: "jump", height: 300, spin: -360 },
              { who: "thay", to: POD_X, y: POD_Y, dur: 1.6, style: "jump", height: 380, spin: -720 }],
            fx: [{ type: "dust", x: col(0), y: TB_Y + 6, at: 1.05, dur: 0.6 }, { type: "dust", x: POD_X, y: POD_Y + 4, at: 1.35, dur: 0.6 }], shake: { at: 1.35, amp: 14, dur: 0.3 },
            sfx: [{ name: "swish", at: 0.2 }, { name: "swish2", at: 0.4 }, { name: "land", at: 1.4 }], gap: 0 },
          { who: "thay", say: "Ví dụ hai: i dài bằng âm một phần hai ích bình phương. Nên chọn ích thế nào cho dễ tính?", sub: "Nên chọn x thế nào cho dễ tính?", bubble: false, pose: "ask" },
          { who: "na", say: "Chọn ích là số chẵn ạ!", sub: "Chọn x là số chẵn!", bubble: false, pose: "pointup", emote: { who: "na", icon: "idea" },
            tween: { id: "tb2", revealX: 5, dur: 2.0 }, sfx: [{ name: "shimmer" }, { name: "pop", at: 0.5 }, { name: "pop", at: 0.9 }, { name: "pop", at: 1.3 }, { name: "pop", at: 1.7 }, { name: "pop", at: 2.0 }] },
          { who: "thay", say: "Vì sao vậy Bin?", sub: "Vì sao?", bubble: false, pose: "ask" },
          { who: "bin", say: "Vì ích chẵn thì ích bình phương chia hết cho hai, nên i dài là số nguyên ạ!", sub: "x chẵn → x² chia hết cho 2 → y nguyên", bubble: false, pose: "explain",
            act: { thay: { pose: "clap", face: "happy" } } },
          { who: "na", say: "Âm bốn: bình phương bằng mười sáu, nhân âm một phần hai, bằng âm tám!", sub: "x = −4: y = −½·16 = −8", bubble: false, pose: "explain",
            show: [panel("Thay x = −4:", CYAN), line(1, "y = −\\frac{1}{2}·(−4)^2", CHALK, 80), Object.assign(line(2, "= −\\frac{1}{2}·16", CHALK, 80), { at: 1.6 }), Object.assign(line(3, "= −8", CYAN, 80), { at: 3.2 })],
            anim: { do: "circumscribe", id: "l3", at: 4.0, dur: 1.0 } },
          kick("tb2", 1, 0, TB_Y + 195, "na"),
          { who: "bin", say: "Em tính nốt! Âm hai, không, âm hai, âm tám!", sub: "y = −2; 0; −2; −8", bubble: false,
            move: { who: "bin", to: col(4), y: TB_Y, dur: 2.6, style: "run" }, tween: { id: "tb2", revealY: 5, dur: 2.8 }, anim: fadeCalc(["l1", "l2", "l3", "pn"]),
            act: { thay: { pose: "dance" } }, sfx: [{ name: "punch2", at: 0.9 }, { name: "punch", at: 1.5 }, { name: "punch2", at: 2.1 }, { name: "punch", at: 2.7 }] },
          ...axesByRuler(AX2, [POD_X + 40, POD_Y - 150],
            { who: "thay", say: "Thầy kẻ trục hoành bằng thước.", sub: "Kẻ trục hoành Ox bằng thước", bubble: false, pose: "point" },
            { who: "thay", say: "Rồi trục tung.", sub: "Kẻ trục tung Oy", bubble: false, pose: "point" }),
          plotHit("ax2", M2, P2[4], 4, CYAN, "left", false, "bin"),
          plotHit("ax2", M2, P2[0], 0, CYAN, undefined, false, "na"),
          hop(3, false, 0.5, "bin"), plotHit("ax2", M2, P2[3], 3, CYAN, undefined, false, "bin"),
          hop(1, false, 0.5, "na"), plotHit("ax2", M2, P2[1], 1, CYAN, undefined, false, "na"),
          hop(2, false, 0.5, "bin"), plotHit("ax2", M2, P2[2], 2, CYAN, undefined, true, "bin"),
          { who: "thay", say: "Lần này đỉnh O là điểm cao nhất hay thấp nhất?", sub: "O cao nhất hay thấp nhất?", bubble: false, pose: "ask" },
          { who: "bin", say: "Cao nhất ạ! Vì a âm!", sub: "Cao nhất! Vì a < 0", bubble: false, pose: "cheer", face: "happy" },
          ...prTrace("g2", "ax2", M2, "-0.5*x^2", -4.05, 4.05, CYAN, 3.0, [["r0", 0.1], ["r1", 1.2], ["r2", 1.5], ["r3", 1.8], ["r4", 2.9]], [POD_X + 40, POD_Y - 150],
            { who: "thay", say: "Lật ngược thước parabol, đỉnh trùng O, vẽ một đường cong trơn qua năm điểm!", sub: "Lật ngược thước parabol, vẽ qua 5 điểm", bubble: false }),
          { who: "thay", say: "Cả lớp leo đồi kiểm tra nào!", sub: "Leo đồi kiểm tra nào!", bubble: false, pose: "cheer",
            move: [{ who: "thay", to: M2(-4.05, f2(-4.05))[0], y: M2(-4.05, f2(-4.05))[1], dur: 1.3, style: "jump", height: 260, spin: 360 },
                   { who: "na", to: M2(-4.05, f2(-4.05))[0] - 8, y: M2(-4.05, f2(-4.05))[1], dur: 1.4, style: "jump", height: 300, spin: -360 },
                   { who: "bin", to: M2(-4.05, f2(-4.05))[0] - 16, y: M2(-4.05, f2(-4.05))[1], dur: 1.5, style: "jump", height: 300, spin: 360 }],
            act: { thay: { skate: true }, na: { skate: true }, bin: { skate: true } }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.4 }], cam: { x: 1380, y: 500, zoom: 1.0, dur: 1.0, letterbox: true } },
          { who: "na", say: "Leo dốc nào!", sub: "Leo dốc nào!", bubble: false, pose: "skate",
            ride: [{ who: "thay", graph: "g2", from: -4.05, to: -1.7, dur: 2.6, ease: "out", trail: false }, { who: "na", graph: "g2", from: -4.05, to: -2.2, dur: 2.6, delay: 0.4, ease: "out", trail: false }, { who: "bin", graph: "g2", from: -4.05, to: -2.6, dur: 2.6, delay: 0.8, ease: "out", trail: false }],
            sfx: [{ name: "tension", vol: 0.5 }] },
          // GAG: thầy hết hơi giữa dốc, hai trò đẩy lên
          { who: "thay", say: "Hộc hộc... dốc quá! Thầy hết hơi rồi!", sub: "Hộc hộc... dốc quá! Hết hơi rồi!", bubble: false, act: { thay: { pose: "tired", face: "worried" } },
            emote: { who: "thay", icon: "💦" }, sfx: [{ name: "oof", vol: 0.8 }], cam: { x: M2(-1.7, f2(-1.7))[0], y: M2(-1.7, f2(-1.7))[1] - 60, zoom: 1.7, dur: 0.5 } },
          { who: "na", say: "Na và Bin đẩy thầy lên nào! Một, hai, ba... đẩy!", sub: "Một, hai, ba... đẩy!", bubble: false, act: { na: { pose: "give" }, bin: { pose: "give" } },
            cam: { x: 1380, y: 500, zoom: 1.0, dur: 0.8 },
            ride: [{ who: "thay", graph: "g2", from: -1.7, to: 0.3, dur: 2.4, delay: 1.4, ease: "out" }, { who: "na", graph: "g2", from: -2.2, to: -0.2, dur: 2.4, delay: 1.4, ease: "out", trail: false }, { who: "bin", graph: "g2", from: -2.6, to: -0.65, dur: 2.4, delay: 1.4, ease: "out", trail: false }],
            sfx: [{ name: "swish2", at: 1.4 }, { name: "whoosh", at: 1.5 }] },
          { who: "thay", say: "Lên tới đỉnh rồi! Đỉnh O là điểm cao nhất!", sub: "Đỉnh O là điểm cao nhất!", bubble: false, act: { thay: { pose: "dance", face: "happy" }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            anim: { do: "flash", id: "r2", at: 0.2, dur: 0.8 }, fx: [{ type: "confetti", x: M2(0, 0)[0], y: M2(0, 0)[1] - 80, at: 0.2, dur: 1.8 }],
            sfx: [{ name: "victory", vol: 0.8 }, { name: "crowd", at: 0.3, vol: 0.5, len: 3 }] },
          { who: "thay", say: "Giờ thì lao xuống dốc nào!", sub: "Lao xuống dốc!", bubble: false, act: { thay: { pose: "skate" }, na: { pose: "skate" }, bin: { pose: "skate" } },
            ride: [{ who: "thay", graph: "g2", from: 0.3, to: 4.05, dur: 2.0, ease: "in" }, { who: "na", graph: "g2", from: -0.2, to: 3.9, dur: 2.0, delay: 0.35, ease: "in", trail: false }, { who: "bin", graph: "g2", from: -0.65, to: 3.75, dur: 2.0, delay: 0.7, ease: "in", trail: false }],
            fx: { type: "speed", on: "thay", dir: 1, at: 0.8, dur: 1.2 }, sfx: [{ name: "whoosh", at: 1.0 }, { name: "wow", at: 1.4, vol: 0.7 }] },
          { move: [{ who: "thay", by: 170, y: POD_Y, dur: 1.2, style: "jump", height: 180, spin: 360 }, { who: "na", by: 60, y: POD_Y, dur: 1.3, style: "jump", height: 200, spin: -360 }, { who: "bin", by: -60, y: POD_Y, dur: 1.4, style: "jump", height: 220, spin: 360 }],
            act: { thay: { skate: false, tilt: 0, pose: "cheer" }, na: { skate: false, tilt: 0, pose: "cheer" }, bin: { skate: false, tilt: 0, pose: "cheer" } },
            show: { id: "lb2", type: "text", text: "y = −\\frac{1}{2}x^2", x: M2(3.9, -4.3)[0], y: M2(3.9, -4.3)[1], size: 62, color: CYAN, anim: "write", dur: 0.9, at: 0.3 },
            shake: { at: 1.1, amp: 18, dur: 0.3 }, sfx: [{ name: "swish" }, { name: "land", at: 1.1 }, { name: "tada", at: 1.2 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0, letterbox: false }, gap: 0.3 }
        ] },

      // ================= 4. CÂU HỎI NHANH: Bin sai, thầy "tèn tèn ten", Na sửa =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "ask", face: "happy" }, na: { x: 1330, pose: "think", face: "thinking", flip: true }, bin: { x: 1560, pose: "think", face: "thinking", flip: true } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: Object.assign({ answer: -1, think: 5 }, Q3), sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "bin", say: "Em chọn A ạ!", sub: "Em chọn A!", pose: "pointup", face: "happy", quiz: Object.assign({ answer: -1, think: 0 }, Q3), sfx: [{ name: "wrong", at: 1.0 }] },
          // GAG: máy quay giật sát mặt thầy — "tèn tèn ten"
          { act: { thay: { pose: "surprised", face: "surprised", snap: 0.08 } }, cam: { x: 300, y: 690, zoom: 2.6, dur: 0.18 }, sfx: [{ name: "surprise", vol: 0.9 }, { name: "fail", at: 0.5, vol: 0.9 }],
            shake: { at: 0.05, amp: 10, dur: 0.25 }, wait: 1.8, gap: 0 },
          { who: "thay", say: "Bin ơi là Bin! Thầy muốn xỉu lần nữa quá!", sub: "Bin ơi là Bin!", pose: "facepalm", face: "worried", cam: { x: 960, y: 540, zoom: 1, dur: 0.5 }, act: { bin: { pose: "shrug", face: "worried" } } },
          { who: "na", say: "a bằng âm ba nhỏ hơn không, nên đồ thị nằm dưới trục hoành. Đáp án B ạ!", sub: "a = −3 < 0 → dưới trục hoành: B", pose: "pointup", face: "happy",
            act: { bin: { pose: "facepalm", face: "worried" } }, quiz: Object.assign({ answer: 1, think: 0 }, Q3) },
          { who: "thay", say: "Chính xác! Bin nhớ nhé: a âm thì parabol nằm dưới trục hoành.", sub: "a < 0 → parabol nằm dưới trục hoành", pose: "clap", face: "happy" },
          { who: "bin", say: "Dạ, em nhớ rồi ạ!", sub: "Em nhớ rồi ạ!", pose: "cheer", face: "happy",
            move: [{ who: "bin", by: 0, dur: 1.0, style: "jump", height: 230, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 200, spin: -360 }],
            act: { thay: { pose: "dance" } }, fx: [{ type: "confetti", x: 1450, y: 420, at: 0.4, dur: 1.8 }], sfx: [{ name: "tada" }, { name: "applause", at: 0.3, vol: 0.6 }] }
        ] },

      // ================= 5. TÓM TẮT + gag ván trượt bỏ chạy =================
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
          { who: "thay", say: "Về nhà các em vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé!", sub: "Bài tập: vẽ đồ thị y = ½x²",
            act: { thay: { skate: false, pose: "wave" }, na: { skate: false, pose: "idle", flip: false }, bin: { skate: false, pose: "idle", flip: false } },
            show: { id: "sk", type: "skateboard", x: 1500, y: 960, color: "#ff7043", pop: false } },
          { tween: { id: "sk", x: 2350, dur: 1.6 }, act: { na: { pose: "surprised", face: "surprised", flip: false }, bin: { pose: "pointup", face: "surprised" } }, sfx: [{ name: "skate", dur: 1.6, vol: 0.6 }], gap: 0 },
          { who: "na", say: "Thầy ơi, ván của thầy chạy mất rồi!", sub: "Thầy ơi, ván của thầy chạy mất rồi!", pose: "pointup", act: { thay: { pose: "surprised", face: "surprised" } } },
          { who: "thay", say: "Ơ! Ván ơi, đợi thầy với!", sub: "Ơ! Ván ơi, đợi thầy với!", move: { who: "thay", to: 2400, dur: 1.4, style: "run" },
            fx: { type: "speed", on: "thay", dir: 1, at: 0.3, dur: 1.0 }, sfx: [{ name: "whoosh", at: 0.3 }, { name: "laugh", at: 1.0, vol: 0.7 }] },
          { who: "na", say: "Chào các bạn! Hẹn gặp lại!", sub: "Chào các bạn! Hẹn gặp lại!", pose: "wave", act: { bin: { pose: "wave" } },
            move: [{ who: "na", by: 0, dur: 1.0, style: "jump", height: 230, spin: -360 }, { who: "bin", by: 0, dur: 1.0, style: "jump", height: 250, spin: 360 }],
            fx: [{ type: "confetti", x: 1300, y: 400, at: 0.6, dur: 2.0 }], sfx: [{ name: "swish" }, { name: "tada", at: 0.8 }] },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
