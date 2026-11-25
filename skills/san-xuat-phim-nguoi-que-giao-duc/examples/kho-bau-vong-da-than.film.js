// PHIM TÌM KHO BÁU: "Kho báu vòng đá thần" — Toán 9, Chương V, Bài 16. Vị trí tương đối của đường thẳng và đường tròn (KNTT)
// Mật thư: kho báu ở nơi con đường chạm vòng đá thần (đường tròn tâm O, R = 5 m) tại ĐÚNG MỘT ĐIỂM.
// Ba con đường a, b, c: dùng thước đo khoảng cách d = OH từ tâm O đến từng đường rồi so sánh với R.
//   a: d = 3 m < R → cắt nhau, 2 điểm chung A, B (hai cái bẫy); tính thêm AB = 2·√(R² − d²) = 8 m.
//   b: d = 7 m > R → không giao nhau (Bin đi hết đường không chạm viên đá nào).
//   c: d = 5 m = R → tiếp xúc tại H: c là tiếp tuyến, H là tiếp điểm → đào được KHO BÁU; mật thư: c ⊥ OH.
(function () {
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true, hat: "pirate" };
  const NA = { name: "Na", role: "hoc-sinh", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.78 };
  const BIN = { name: "Bin", role: "hoc-sinh", voice: "tre", hair: "spiky", skirt: false, shirt: "#ff9800", hat: "cap", hatColor: "#e53935", scale: 0.8 };
  const ST = 0.5, SS = 0.42;                       // tỉ lệ nhân vật trên bản đồ
  const BROWN = "#5d4037", BLUE = "#1565c0", RED = "#d32f2f", GOLD = "#ffd54f", GREEN = "#2e7d32";
  // ---- bản đồ: 1 m = 50 px ----
  const O = [1250, 470], R = 250, U = 50;
  const YA = O[1] + 3 * U, YB = O[1] + 7 * U, YC = O[1] - 5 * U;          // đường a (d = 3), b (d = 7), c (d = 5)
  const AX = O[0] - 4 * U, BX = O[0] + 4 * U;                               // giao điểm A, B của đường a: AH = 4 m
  const HA = [O[0], YA], HB = [O[0], YB], HC = [O[0], YC];
  const road = (id, y, name, at) => [
    { id: id + "_bd", type: "seg", x: 0, y: 0, x1: 690, y1: y, x2: 1880, y2: y, color: "rgba(200,162,107,.85)", width: 34, anim: "create", dur: 0.8, at, sfx: "swish", z: -2 },
    { id, type: "seg", x: 0, y: 0, x1: 690, y1: y, x2: 1880, y2: y, color: BROWN, width: 5, anim: "create", dur: 0.8, at, sfx: false, z: -1 },
    { id: id + "_lb", type: "text", text: name, x: 1850, y: y - 26, size: 66, color: BROWN, at: (at || 0) + 0.6, sfx: "pop" }];
  const stones = Array.from({ length: 16 }, (_, k) => ({ id: "st" + k, type: "dot", x: O[0] + R * Math.cos(k * Math.PI / 8), y: O[1] + R * Math.sin(k * Math.PI / 8), r: 13, color: "#795548", at: 1.4 + k * 0.06, sfx: k % 4 ? false : "pop", z: 1 }));
  const rmark = (id, H, up) => ({ id, type: "poly", points: [[H[0] + 24, H[1]], [H[0] + 24, H[1] + (up ? 24 : -24)], [H[0], H[1] + (up ? 24 : -24)]], close: false, color: BLUE, width: 4, sfx: false });

  // ---- BẢNG MANIM gắn màn hình (bên trái bản đồ) ----
  const PX = 350, PY = 395, LX = 80, LY = [300, 410, 520, 630];
  const panel = (title) => ({ id: "pn", type: "panel", screen: true, x: PX, y: PY, w: 620, h: 560, title, titleColor: GOLD, size: 58, anim: "fadein", dur: 0.5, sfx: "shimmer", z: 0 });
  const line = (k, text, color, at, size, pre) => ({ id: (pre || "l") + k, type: "text", screen: true, text, x: LX, y: LY[k - 1], size: size || 62, align: "left", color: color || "#f5f5ec", anim: "write", dur: 0.7, sfx: "marker", at: at || 0, z: 1 });
  const clearLines = (ids) => (ids || ["l1", "l2", "l3", "l4"]).map((id) => ({ do: "fadeout", id, dur: 0.35, sfx: false }));

  // ---- THƯỚC ĐO khoảng cách d = OH (vạch chia theo mét) ----
  const ang = (A, B) => Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  const measure = (key, H, from, sayDraw, up) => [
    { show: { id: "ru", type: "ruler", w: 400, unit: U, unitText: "m", x: from[0], y: from[1], rot: ang(O, H) - 720, scale: 0.3, pop: false, sfx: false, z: 5 },
      anim: { do: "move", id: "ru", x: O[0], y: O[1], rot: ang(O, H), scale: 1, dur: 0.9, sfx: false }, act: { thay: { pose: "give" } },
      sfx: [{ name: "swish" }, { name: "whoosh", at: 0.15 }, { name: "click", at: 0.9 }, { name: "click", at: 0.97 }], shake: { at: 0.9, amp: 6, dur: 0.15 }, wait: 0.2, gap: 0 },
    Object.assign({ show: [{ id: "pc", type: "pencil", x: O[0], y: O[1], lead: "#3e2723", color: "#ffca28", z: 6, pop: false, sfx: false },
        { id: "d" + key, type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: H[0], y2: H[1], color: BLUE, width: 6, dash: true, anim: "create", dur: 1.2, sfx: "chalk" }],
      anim: { do: "move", id: "pc", x: H[0], y: H[1], dur: 1.2, sfx: false }, act: { thay: { pose: "point" } }, gap: 0 }, sayDraw),
    { anim: [{ do: "move", id: "ru", x: 2500, y: -300, rot: 540, scale: 0.4, dur: 0.7, sfx: false }, { do: "fadeout", id: "pc", dur: 0.3, sfx: false }],
      show: [rmark("m" + key, H, up), { id: "h" + key, type: "dot", x: H[0], y: H[1], r: 11, color: BLUE, label: "H", labelSide: "left", size: 56, sfx: "pop" },
        { id: "t" + key, type: "text", text: `d = ${{ a: 3, b: 7, c: 5 }[key]} m`, x: O[0] + 22, y: (O[1] + H[1]) / 2 + 18, size: 56, align: "left", color: BLUE, anim: "write", dur: 0.5, sfx: false }],
      sfx: [{ name: "whoosh" }], wait: 0.4, gap: 0 },
    { hide: ["pc", "ru"], wait: 0.05, gap: 0 }
  ];
  const unmeasure = (key) => ["d", "m", "h", "t"].map((p) => ({ do: "fadeout", id: p + key, dur: 0.4, sfx: false }));
  const bang = (text, x, y, color, at) => ({ type: "hit", x, y, dur: 0.7, text, color: color || "#ff7043", at: at || 0 });
  const QZ = { q: "(O; 6 cm), khoảng cách từ O đến m bằng 6 cm", options: ["Cắt nhau", "Tiếp xúc", "Không giao nhau", "Không xác định được"] };

  window.FILM = {
    title: "Kho báu vòng đá thần",
    subtitle: "Toán 9 · Bài 16. Vị trí tương đối của đường thẳng và đường tròn",
    file: "kho-bau-vong-da-than",
    watermark: "Thầy Hà Văn Chung",
    music: "intro",
    cast: { thay: TEACHER, na: NA, bin: BIN },
    scenes: [
      // ================= 1. BÃI BIỂN: cập đảo, đọc mật thư =================
      { bg: "beach", trans: "iris",
        cast: { thay: { x: -200, pose: "idle", face: "happy", hold: "map" }, na: { x: -330, pose: "idle", face: "happy" }, bin: { x: -450, pose: "idle", face: "happy" } },
        beats: [
          { title: { text: "KHO BÁU VÒNG ĐÁ THẦN", sub: "Toán 9 · Bài 16. Vị trí tương đối của đường thẳng và đường tròn", dur: 3.4, bgColor: "rgba(62,39,35,.92)", color: GOLD },
            sfx: [{ name: "boom", vol: 0.8 }, { name: "magic", at: 0.4, vol: 0.7 }] },
          { move: [{ who: "thay", to: 820, dur: 1.5, style: "run" }, { who: "na", to: 560, dur: 1.6, style: "run" }, { who: "bin", to: 330, dur: 1.7, style: "run" }],
            fx: [{ type: "speed", on: "thay", dir: 1, dur: 1.3 }, { type: "dust", x: 820, y: 950, at: 1.4, dur: 0.6 }], sfx: [{ name: "whoosh" }], gap: 0 },
          { who: "thay", say: "Ha ha! Đảo kho báu đây rồi các em ơi!", sub: "Ha ha! Đảo kho báu đây rồi!", pose: "victory", face: "happy",
            move: { who: "thay", by: 0, dur: 1.0, style: "jump", height: 200, spin: 360 }, sfx: [{ name: "victory", at: 0.6, vol: 0.6 }] },
          { who: "thay", say: "Mật thư ghi: kho báu nằm ở nơi con đường chạm vòng đá thần tại đúng một điểm!", sub: "Mật thư: đường chạm vòng đá tại ĐÚNG 1 điểm", pose: "hold", face: "happy",
            show: { id: "riddle", type: "text", screen: true, panel: true, text: "Kho báu: nơi con đường chạm vòng đá thần tại ĐÚNG MỘT điểm", x: 960, y: 1000, size: 60, color: GOLD, anim: "write", dur: 1.4, sfx: "magic" },
            cam: { x: 760, y: 640, zoom: 1.25, dur: 0.8 } },
          { who: "bin", say: "Dễ ợt! Con đường nào chạm vòng đá là em đào ngay!", sub: "Dễ ợt! Chạm là đào!", pose: "cheer", face: "happy", hold: "shovel" },
          { who: "na", say: "Khoan đã Bin! Phải chạm tại đúng một điểm cơ mà!", sub: "Khoan! Phải ĐÚNG MỘT điểm cơ mà!", pose: "pointup", face: "thinking" },
          { who: "thay", say: "Na nói đúng! Cả đội leo lên đồi, nhìn từ trên cao xuống nào!", sub: "Leo lên đồi nhìn từ trên cao!", pose: "pointup", hide: "riddle",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.6 } },
          { move: [{ who: "thay", by: 260, y: -400, dur: 1.2, style: "jump", height: 300, spin: 360 }, { who: "na", by: 300, y: -400, dur: 1.3, style: "jump", height: 300, spin: -360 }, { who: "bin", by: 340, y: -400, dur: 1.4, style: "jump", height: 300, spin: 360 }],
            cam: { x: 960, y: 200, zoom: 1.3, dur: 1.2 }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "whoosh", at: 0.8 }], gap: 0 }
        ] },

      // ================= 2. BẢN ĐỒ NHÌN TỪ TRÊN XUỐNG =================
      { bg: "treasuremap", trans: "flash",
        cast: { thay: { x: 760, y: -300, pose: "idle", face: "happy", scale: ST, hold: "map" }, na: { x: 880, y: -300, pose: "idle", face: "happy", scale: SS }, bin: { x: 990, y: -300, pose: "idle", face: "happy", scale: SS, hold: "shovel" } },
        beats: [
          { move: [{ who: "thay", to: 760, y: YB, dur: 1.1, style: "jump", height: 60 }, { who: "na", to: 880, y: YB, dur: 1.2, style: "jump", height: 60 }, { who: "bin", to: 990, y: YB, dur: 1.3, style: "jump", height: 60 }],
            sfx: [{ name: "land", at: 1.0 }, { name: "land", at: 1.15 }], fx: [{ type: "dust", x: 880, y: YB, at: 1.0, dur: 0.6 }], gap: 0 },
          { who: "thay", say: "Nhìn xuống kìa! Vòng đá thần là một đường tròn tâm ô, bán kính e rờ bằng năm mét.", sub: "Vòng đá thần: đường tròn (O; R), R = 5 m", bubble: false, pose: "point",
            show: [{ id: "C", type: "circ", x: O[0], y: O[1], r: R, color: BROWN, width: 7, anim: "create", dur: 1.3, sfx: "shimmer" },
              { id: "O", type: "dot", x: O[0], y: O[1], r: 12, color: "#3e2723", label: "O", labelSide: "left", size: 56, at: 0.6 },
              { id: "rad", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: O[0] + R, y2: O[1], color: RED, width: 5, anim: "create", dur: 0.6, at: 2.6, sfx: "swish2" },
              { id: "radl", type: "text", text: "R = 5 m", x: O[0] + R / 2, y: O[1] - 20, size: 56, color: RED, at: 3.2, sfx: "pop" }, ...stones] },
          { who: "bin", say: "Có ba con đường a, bê, xê. Đào ở đường nào hả thầy?", sub: "Ba con đường a, b, c: đào ở đâu?", bubble: false, pose: "ask",
            show: [...road("ra", YA, "a", 0), ...road("rb", YB, "b", 0.6), ...road("rc", YC, "c", 1.2)] },
          { who: "thay", say: "Bí quyết của thầy: đo khoảng cách đê từ tâm ô đến con đường, rồi so sánh đê với e rờ!", sub: "Bí quyết: đo d = OH rồi so sánh d với R", bubble: false, pose: "pointup",
            emote: { who: "thay", icon: "!" }, show: [panel("BÍ QUYẾT"), line(1, "d = OH", "#f5f5ec", 0.4), line(2, "(OH \\perp đường thẳng)", "#b3e5fc", 1.2, 56), line(3, "So sánh d với R", GOLD, 2.2)] },

          // ---------- ĐƯỜNG a: d < R ----------
          { anim: clearLines(), set: { id: "pn", title: "Đường a (R = 5 m)" }, wait: 0.3, gap: 0 },
          ...measure("a", HA, [760, YB - 110], { who: "thay", say: "Đặt thước vuông góc với đường a: đường a cách tâm ô ba mét.", sub: "Đường a: d = OH = 3 m", bubble: false }),
          { who: "na", say: "Ba nhỏ hơn năm, nên đê nhỏ hơn e rờ!", sub: "3 < 5 nên d < R", bubble: false, pose: "pointup", show: line(1, "d = 3 m < R", "#f5f5ec") },
          { who: "bin", say: "Đường a chạm vòng đá rồi! Em đào đây!", sub: "Đường a chạm vòng đá! Em đào đây!", bubble: false, pose: "cheer",
            move: { who: "bin", to: AX - 40, y: YA, dur: 1.6, style: "run" }, act: { na: { pose: "facepalm" } } },
          { act: { bin: { pose: "dig", flip: false } }, show: { id: "A", type: "dot", x: AX, y: YA, r: 13, color: RED, label: "A", labelSide: "left", size: 56 },
            fx: [{ type: "dust", x: AX, y: YA, dur: 0.5 }, { type: "dust", x: AX, y: YA, at: 0.5, dur: 0.5 }], sfx: [{ name: "punch", vol: 0.5 }, { name: "punch2", at: 0.45, vol: 0.5 }, { name: "punch", at: 0.9, vol: 0.5 }, { name: "tension", at: 0.2, vol: 0.4 }], wait: 1.3, gap: 0 },
          { fx: [bang("BÙM!", AX, YA - 80), { type: "dust", x: AX, y: YA, dur: 0.9 }], shake: { amp: 26, dur: 0.45 }, act: { bin: { face: "surprised" } },
            move: { who: "bin", by: -90, dur: 1.1, style: "jump", height: 320, spin: 720 }, sfx: [{ name: "boom" }, { name: "fall", at: 1.0 }, { name: "boing", at: 1.1 }], gap: 0 },
          { who: "bin", say: "Ối! Bẫy rồi!", sub: "Ối! Bẫy rồi!", bubble: false, pose: "dizzy", face: "sad", emote: { who: "bin", icon: "★" }, sfx: [{ name: "laugh", vol: 0.6 }] },
          { who: "na", say: "Còn một điểm chạm nữa ở bên kia, điểm bê!", sub: "Còn một điểm chạm nữa: điểm B!", bubble: false,
            move: { who: "na", to: BX + 40, y: YA, dur: 2.4, style: "run" }, show: { id: "B", type: "dot", x: BX, y: YA, r: 13, color: RED, label: "B", size: 56, at: 2.2 } },
          { act: { na: { pose: "dig", flip: true } }, show: { id: "ch1", type: "chest", x: BX + 4, y: YA + 2, scale: 0.42, empty: true, anim: "grow", dur: 0.6, at: 0.6, sfx: "pop", z: 2 },
            fx: [{ type: "dust", x: BX, y: YA, dur: 0.6 }], sfx: [{ name: "punch2", vol: 0.5 }, { name: "punch", at: 0.4, vol: 0.5 }], wait: 0.9, gap: 0 },
          { tween: { id: "ch1", open: 1, dur: 0.6 }, show: { id: "q1", type: "question", x: BX + 4, y: YA - 90, scale: 0.6 }, act: { na: { pose: "surprised", face: "surprised" } },
            sfx: [{ name: "click" }, { name: "fail", at: 0.5, vol: 0.9 }], wait: 1.2, gap: 0 },
          { who: "na", say: "Rương rỗng! Cũng là bẫy nốt!", sub: "Rương rỗng! Cũng là bẫy!", bubble: false, pose: "facepalm", face: "worried" },
          { who: "thay", say: "Vì đê nhỏ hơn e rờ, đường a cắt đường tròn tại hai điểm a và bê. Hai điểm chung, nên không phải kho báu!", sub: "d < R: a cắt (O) tại 2 điểm A, B", bubble: false, pose: "explain",
            show: [line(2, "⇒ cắt nhau", GOLD, 0.3), line(3, "(2 điểm chung A, B)", "#b3e5fc", 1.2, 56)],
            anim: [{ do: "flash", id: "A", at: 2.2, dur: 0.6, sfx: "ding" }, { do: "flash", id: "B", at: 2.8, dur: 0.6, sfx: "ding" }, { do: "circumscribe", id: "l2", at: 3.6, dur: 1.0 }] },
          // tính độ dài dây AB (Pythagore trong tam giác OHA vuông tại H)
          { who: "thay", say: "Thử tính dây a bê nhé! Tam giác ô a bê cân tại ô, đường cao ô hát cũng là trung tuyến, nên hát là trung điểm của a bê.", sub: "ΔOAB cân tại O ⇒ H là trung điểm AB", bubble: false, pose: "explain",
            anim: clearLines(), set: { id: "pn", title: "Tính dây AB" },
            show: [{ id: "OA", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: AX, y2: YA, color: GREEN, width: 5, anim: "create", dur: 0.7, at: 1.0 },
              { id: "OB", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: BX, y2: YA, color: GREEN, width: 5, anim: "create", dur: 0.7, at: 1.5 },
              line(1, "AH = \\sqrt{OA^2 - OH^2}", "#f5f5ec", 3.0, 58, "k")] },
          { who: "na", say: "a hát bằng căn của năm bình phương trừ ba bình phương, bằng bốn mét. Vậy a bê bằng tám mét!", sub: "AH = √(5² − 3²) = 4 m ⇒ AB = 8 m", bubble: false, pose: "explain",
            show: [line(2, "= \\sqrt{5^2 - 3^2} = 4 (m)", "#f5f5ec", 0.2, 58, "k"), line(3, "AB = 2·AH = 8 (m)", GOLD, 2.6, 58, "k")], anim: { do: "circumscribe", id: "k3", at: 3.6, dur: 1.0 } },
          { who: "bin", say: "Bẫy cách nhau tận tám mét! Thảo nào em bay xa thế!", sub: "Hai bẫy cách nhau 8 m!", bubble: false, pose: "shrug", face: "happy", act: { na: { pose: "clap", flip: false } },
            anim: [...clearLines(["k1", "k2", "k3"]), { do: "fadeout", id: "OA", dur: 0.4, sfx: false }, { do: "fadeout", id: "OB", dur: 0.4, sfx: false }, { do: "fadeout", id: "ch1", dur: 0.4, sfx: false }, { do: "fadeout", id: "q1", dur: 0.4, sfx: false }], sfx: [{ name: "laugh", at: 1.4, vol: 0.5 }] },

          // ---------- ĐƯỜNG b: d > R ----------
          { set: { id: "pn", title: "Đường b (R = 5 m)" }, anim: unmeasure("a"), move: [{ who: "bin", to: 700, y: YB, dur: 1.2, style: "jump", height: 160 }, { who: "na", to: 820, y: YB, dur: 1.3, style: "jump", height: 160 }], sfx: [{ name: "swish" }], wait: 0.2, gap: 0 },
          ...measure("b", HB, [760, YB - 110], { who: "thay", say: "Đường bê thì cách tâm ô bảy mét.", sub: "Đường b: d = OH = 7 m", bubble: false }),
          { who: "bin", say: "Bảy lớn hơn năm! Để em đi thử hết đường bê!", sub: "7 > 5: em đi thử đường b!", bubble: false, pose: "cheer", show: line(1, "d = 7 m > R", "#f5f5ec") },
          { move: { who: "bin", to: 1820, y: YB, dur: 4.2, style: "walk" }, act: { bin: { face: "thinking" } }, cam: { x: 1250, y: 620, zoom: 1.2, dur: 1.2 },
            emote: { who: "bin", icon: "?" }, sfx: [{ name: "tension", at: 0.5, vol: 0.4 }], gap: 0 },
          { who: "bin", say: "Đi hết đường bê mà chẳng chạm viên đá nào!", sub: "Đi hết đường b, chẳng chạm viên đá nào!", bubble: false, pose: "tired", face: "worried", flip: true, cam: { x: 960, y: 540, zoom: 1, dur: 0.8 } },
          { who: "thay", say: "Đúng! Đê lớn hơn e rờ thì đường thẳng và đường tròn không giao nhau, không có điểm chung nào.", sub: "d > R: b và (O) không giao nhau", bubble: false, pose: "explain",
            show: [line(2, "⇒ không giao nhau", GOLD, 0.3), line(3, "(0 điểm chung)", "#b3e5fc", 1.4, 56)], anim: { do: "circumscribe", id: "l2", at: 2.6, dur: 1.0 } },

          // ---------- ĐƯỜNG c: d = R ----------
          { anim: [...clearLines(), ...unmeasure("b")], set: { id: "pn", title: "Đường c (R = 5 m)" }, move: { who: "bin", to: 940, y: YB, dur: 1.4, style: "jump", height: 220, spin: 360 }, sfx: [{ name: "swish" }], wait: 0.2, gap: 0 },
          ...measure("c", HC, [760, YB - 110], { who: "thay", say: "Còn đường xê, cách tâm ô bao nhiêu nào?", sub: "Đường c: d = OH = ?", bubble: false }, true),
          { who: "na", say: "Đúng năm mét, bằng e rờ ạ!", sub: "d = 5 m = R!", bubble: false, pose: "pointup", face: "happy", show: line(1, "d = 5 m = R", "#f5f5ec"), sfx: [{ name: "wow", vol: 0.6 }] },
          { who: "thay", say: "Đê bằng e rờ: đường xê tiếp xúc với đường tròn tại đúng một điểm hát. Đường xê là tiếp tuyến, điểm hát là tiếp điểm!", sub: "d = R: c tiếp xúc (O) tại H (tiếp điểm)", bubble: false, pose: "explain",
            show: [line(2, "⇒ tiếp xúc", GOLD, 0.3), line(3, "(1 điểm chung H)", "#b3e5fc", 1.4, 54), line(4, "c là tiếp tuyến", "#c5e1a5", 3.6, 56)],
            anim: [{ do: "flash", id: "hc", at: 2.2, dur: 0.7, sfx: "ding" }, { do: "circumscribe", id: "l2", at: 2.6, dur: 1.0 }] },
          { who: "bin", say: "Đúng một điểm! Kho báu ở đây rồi!", sub: "Đúng MỘT điểm! Kho báu ở đây!", bubble: false, pose: "cheer", face: "happy",
            move: [{ who: "thay", to: HC[0] - 60, y: YC, dur: 1.3, style: "jump", height: 260, spin: 360 }, { who: "na", to: HC[0] + 150, y: YC, dur: 1.4, style: "jump", height: 240, spin: -360 }, { who: "bin", to: HC[0] + 230, y: YC, dur: 1.5, style: "jump", height: 280, spin: 360 }],
            act: { thay: { hold: "shovel" } }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.3 }] },
          { act: { thay: { pose: "dig", flip: false }, na: { flip: true, pose: "cheer" }, bin: { flip: true, pose: "cheer" } }, cam: { x: HC[0], y: YC + 40, zoom: 1.6, dur: 0.8 },
            fx: [{ type: "dust", x: HC[0], y: YC, dur: 0.6 }, { type: "dust", x: HC[0], y: YC, at: 0.7, dur: 0.6 }, { type: "dust", x: HC[0], y: YC, at: 1.4, dur: 0.6 }],
            sfx: [{ name: "tension", vol: 0.6 }, { name: "punch", at: 0.2, vol: 0.5 }, { name: "punch2", at: 0.9, vol: 0.5 }, { name: "punch", at: 1.6, vol: 0.5 }], wait: 2.2, gap: 0 },
          { show: { id: "chest", type: "chest", x: HC[0] + 6, y: YC + 4, scale: 0.55, anim: "grow", dur: 0.7, sfx: "magic", z: 2 }, act: { thay: { pose: "surprised", face: "surprised" } },
            fx: [{ type: "hit", x: HC[0], y: YC - 40, dur: 0.6, color: GOLD }], shake: { amp: 12, dur: 0.3 }, sfx: [{ name: "boom", vol: 0.6 }], wait: 0.6, gap: 0 },
          { tween: { id: "chest", open: 1, dur: 0.8 }, act: { thay: { pose: "victory", face: "happy" }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            fx: [{ type: "confetti", x: HC[0], y: YC - 60, at: 0.4, dur: 2.0 }, bang("KHO BÁU!", HC[0], YC - 170, GOLD, 0.5)],
            sfx: [{ name: "click" }, { name: "victory", at: 0.4 }, { name: "crowd", at: 0.5, vol: 0.5, len: 3 }, { name: "tada", at: 0.6 }], wait: 2.0, gap: 0 },
          { who: "thay", say: "Kho báu đây rồi! Ha ha ha!", sub: "Kho báu đây rồi! Ha ha ha!", bubble: false, pose: "dance", face: "happy", act: { na: { pose: "dance" }, bin: { pose: "dance" } }, sfx: [{ name: "applause", vol: 0.5 }] },
          { who: "thay", say: "Trong rương còn mật thư: tiếp tuyến thì vuông góc với bán kính đi qua tiếp điểm. Đường xê vuông góc với ô hát tại hát!", sub: "Tiếp tuyến ⊥ bán kính tại tiếp điểm: c ⊥ OH", bubble: false, pose: "explain",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.8 }, anim: [...clearLines(["l1", "l2", "l3", "l4"]), { do: "flash", id: "mc", at: 3.0, dur: 0.8, sfx: "ding" }, { do: "indicate", id: "dc", at: 3.0, dur: 1.0 }],
            set: { id: "pn", title: "Mật thư" }, show: [line(1, "Tiếp tuyến \\perp bán kính", GOLD, 1.2, 56, "s"), line(2, "tại tiếp điểm:", "#f5f5ec", 1.8, 56, "s"), line(3, "c \\perp OH tại H", "#c5e1a5", 2.6, 62, "s")] },
          { who: "na", say: "Ngược lại, đường thẳng đi qua một điểm của đường tròn và vuông góc với bán kính tại điểm đó thì là tiếp tuyến!", sub: "c ⊥ bán kính OH tại H ∈ (O) ⇒ c là tiếp tuyến", bubble: false, pose: "pointup", face: "happy",
            anim: { do: "circumscribe", id: "s3", at: 1.0, dur: 1.0 } }
        ] },

      // ================= 3. TỔNG KẾT + CÂU HỎI NHANH + KHO BÁU THỨ HAI =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "idle", face: "happy", hat: "pirate" }, na: { x: 1330, pose: "idle", face: "happy", flip: true }, bin: { x: 1560, pose: "idle", face: "happy", flip: true } },
        beats: [
          { who: "thay", say: "Về lớp tổng kết nào! Gọi đê là khoảng cách từ tâm ô đến đường thẳng.", sub: "d: khoảng cách từ O đến đường thẳng", pose: "write", hold: "chalk",
            write: { text: "d: khoảng cách từ O đến đường thẳng a", size: 60 } },
          { who: "na", say: "Đê nhỏ hơn e rờ: cắt nhau, có hai điểm chung.", sub: "d < R: cắt nhau – 2 điểm chung", pose: "pointup", write: { text: "• d < R: cắt nhau (2 điểm chung)", size: 60, color: "#ffd54f" }, sfx: [{ name: "ding", at: 0.8 }] },
          { who: "thay", say: "Đê bằng e rờ: tiếp xúc, có một điểm chung là tiếp điểm.", sub: "d = R: tiếp xúc – 1 điểm chung", pose: "write", write: { text: "• d = R: tiếp xúc (1 điểm chung)", size: 60, color: "#a5d6a7" }, sfx: [{ name: "ding", at: 0.8 }] },
          { who: "bin", say: "Đê lớn hơn e rờ: không giao nhau, không có điểm chung!", sub: "d > R: không giao nhau – 0 điểm chung", pose: "cheer", write: { text: "• d > R: không giao nhau (0 điểm chung)", size: 60, color: "#ff8a80" }, sfx: [{ name: "ding", at: 0.8 }] },
          { who: "thay", say: "Và nhớ: tiếp tuyến vuông góc với bán kính tại tiếp điểm!", sub: "Tiếp tuyến ⊥ bán kính tại tiếp điểm", pose: "write",
            write: { text: "Tiếp tuyến ⊥ bán kính tại tiếp điểm", size: 60, box: true }, sfx: ["ding"] },
          { who: "thay", say: "Câu hỏi nhanh: đường tròn ô, bán kính sáu xăng-ti-mét, khoảng cách từ ô đến đường thẳng em là sáu xăng-ti-mét. Chúng có vị trí thế nào?", sub: "Câu hỏi nhanh", pose: "ask", hold: null,
            act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" } }, quiz: Object.assign({ answer: -1, think: 4 }, QZ), sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "bin", say: "Em chọn A, cắt nhau ạ!", sub: "Em chọn A: cắt nhau!", pose: "pointup", face: "happy", quiz: Object.assign({ answer: -1, think: 0 }, QZ), sfx: [{ name: "wrong", at: 1.0 }] },
          { act: { thay: { pose: "surprised", face: "surprised", snap: 0.08 } }, cam: { x: 300, y: 690, zoom: 2.6, dur: 0.18 }, sfx: [{ name: "surprise", vol: 0.9 }, { name: "fail", at: 0.5, vol: 0.9 }],
            shake: { at: 0.05, amp: 10, dur: 0.25 }, wait: 1.8, gap: 0 },
          { who: "thay", say: "Bin ơi là Bin! Thầy suýt đánh rơi mũ hải tặc!", sub: "Bin ơi là Bin!", pose: "facepalm", face: "worried", cam: { x: 960, y: 540, zoom: 1, dur: 0.5 }, act: { bin: { pose: "shrug", face: "worried" } } },
          { who: "na", say: "Đê bằng e rờ, cùng bằng sáu xăng-ti-mét, nên tiếp xúc. Đáp án bê ạ!", sub: "d = R = 6 cm ⇒ tiếp xúc: B", pose: "pointup", face: "happy",
            act: { bin: { pose: "facepalm", face: "worried" } }, quiz: Object.assign({ answer: 1, think: 0 }, QZ) },
          { who: "thay", say: "Chính xác! Cả đội xứng đáng nhận kho báu thứ hai!", sub: "Chính xác! Kho báu thứ hai!", pose: "clap", face: "happy",
            show: { id: "ch2", type: "chest", x: 880, y: 960, scale: 0.8, anim: "grow", dur: 0.6, sfx: "magic" }, act: { na: { pose: "cheer" }, bin: { pose: "cheer", face: "happy" } } },
          { who: "bin", say: "Để em mở! Chắc là vàng!", sub: "Để em mở! Chắc là vàng!", pose: "cheer", move: { who: "bin", to: 1210, dur: 0.9, style: "run" } },
          { tween: { id: "ch2", open: 1, dur: 0.6 }, act: { bin: { pose: "surprised", face: "surprised" }, na: { pose: "clap", face: "happy" } },
            show: { id: "btvn", type: "sign", text: "Bài tập về nhà", x: 880, y: 700, w: 520, size: 62, anim: "grow", dur: 0.6, sfx: "pop" }, sfx: [{ name: "click" }, { name: "fail", at: 0.6 }, { name: "laugh", at: 1.2, vol: 0.6 }], wait: 1.6, gap: 0 },
          { who: "thay", say: "Ha ha! Kho báu kiến thức đấy Bin! Về nhà làm bài nhé các em!", sub: "Kho báu kiến thức: làm bài tập về nhà nhé!", pose: "dance", face: "happy", act: { bin: { pose: "facepalm" } },
            fx: [{ type: "confetti", x: 1200, y: 420, at: 0.5, dur: 2.0 }], sfx: [{ name: "tada", at: 0.5 }] },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(62,39,35,.92)", color: GOLD }, sfx: ["ding"] }
        ] }
    ]
  };
})();
