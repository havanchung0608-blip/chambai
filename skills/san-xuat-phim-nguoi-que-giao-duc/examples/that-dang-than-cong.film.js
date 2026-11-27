// PHIM VÕ THUẬT: "THẤT ĐẲNG THẦN CÔNG" — Toán 8, Chương II. Hằng đẳng thức đáng nhớ và ứng dụng (KNTT, Bài 6, 7, 8)
// Bảy hằng đẳng thức = bảy chiêu thức. Kẻ ác Hắc Ma luyện tà công "Khai Triển Bừa": (A + B)^2 = A^2 + B^2 (sai lầm kinh điển).
// Cốt truyện:
//  1. Đêm trăng (mái nhà): người kể chuyện giới thiệu bí kíp; Hắc Ma lộ diện với tà công, hẹn sáng mai đến cướp bí kíp.
//  2. Võ đường: Bin khoe võ rồi ngã; Hắc Ma phá cửa, "đầu độc" Bin bằng (x + 1)^2 = x^2 + 1; Thầy Chung ra tay hoá giải,
//     Hắc Ma hẹn ba ngày sau quyết chiến trên đỉnh Luỹ Thừa Sơn.
//  3. Ba ngày luyện công: 7 chiêu, mỗi chiêu một màn tiêu đề; công thức tổng quát hiện và được đọc TRƯỚC (giữ ≥ 5 s),
//     rồi hình minh hoạ (mô hình diện tích cho bình phương), rồi đệ tử chặt gạch tính nhẩm / tách gạch phân tích nhân tử.
//  4. Đỉnh Luỹ Thừa Sơn: Hắc Ma tung 7 chưởng, thầy trò đỡ bằng đúng 7 chiêu; Hắc Ma thua, xin học lại.
//  5. Võ đường: bảng tổng kết 7 hằng đẳng thức (giữ lâu), mẹo nhớ, "Lớp Toán Thầy Chung", chuông.
(function () {
  const GOLD = "#ffd54f", RED = "#ff5252", GREEN = "#69f0ae", BLUE = "#64b5f6", WHITE = "#f5f5ec", ORANGE = "#ffb74d";
  const TEACHER = { name: "Thầy Chung", voice: "nam", hair: "short", glasses: true, shirt: "#fafafa", belt: "#212121", fists: true };
  const BIN = { name: "Bin", voice: "tre", hair: "spiky", shirt: "#fafafa", belt: "#ff9800", band: "#e53935", fists: true, scale: 0.82 };
  const NA = { name: "Na", voice: "tre", hair: "ponytail", shirt: "#fafafa", belt: "#1e88e5", band: "#ffd54f", fists: true, scale: 0.78 };
  const MA = { name: "Hắc Ma", voice: "nam", shirt: "#212121", horns: true, cape: "#b71c1c", band: "#000000", belt: "#b71c1c", beard: true, hairColor: "#212121", fists: true, scale: 1.08 };
  const KE = { name: "", voice: "nam", hidden: true };
  const HIDE = { x: -3000, hidden: true };

  // ---------- màn tiêu đề chiêu thức ----------
  const chieu = (k, name, sub) => ({ title: { text: `CHIÊU ${k} · ${name}`, sub, dur: 2.8, bgColor: "rgba(20,10,10,.93)", color: GOLD },
    sfx: [{ name: "boom", vol: 0.8 }, { name: "kungfu", at: 0.2, vol: 0.7 }] });

  // ---------- bảng Manim gắn màn hình (phải) ----------
  const PX = 1300, PY = 455;
  const panel = (title) => ({ id: "pn", type: "panel", screen: true, x: PX, y: PY, w: 1180, h: 830, title, titleColor: GOLD, size: 60, color: "rgba(10,24,18,.97)", anim: "fadein", dur: 0.5, sfx: "shimmer", z: 0 });
  const T = (id, text, y, o) => Object.assign({ id, type: "text", screen: true, text, x: PX, y, size: 88, color: WHITE, align: "center", anim: "write", dur: 0.9, sfx: "marker", z: 2 }, o || {});
  const fade = (ids, at) => ids.map((id) => ({ do: "fadeout", id, dur: 0.4, sfx: false, at: at || 0 }));
  const circ = (id, at) => ({ do: "circumscribe", id, at: at || 0, dur: 1.2 });

  // ---------- gạch để chặt (đặt trên bệ) ----------
  const BRX = 610;
  const brick = (id, label) => [
    { id: id + "_st", type: "box", x: BRX, y: 905, w: 150, h: 110, color: "#8d6e63", label: "", anim: "grow", dur: 0.4, sfx: false, z: 1 },
    { id, type: "box", x: BRX, y: 810, w: 250, h: 84, color: "#ef9a9a", label, size: 60, anim: "grow", dur: 0.5, sfx: "pop", z: 2 }];
  const chop = (who, id, text) => ({ act: { [who]: { pose: "punch", snap: 0.09 } }, anim: [{ do: "move", id, y: 1300, rot: 40, dur: 0.6, at: 0.1, sfx: false }, { do: "fadeout", id, dur: 0.3, at: 0.4, sfx: false }],
    fx: [{ type: "hit", x: BRX, y: 800, text: text || "RẮC!", color: "#ff7043", dur: 0.7, at: 0.08 }, { type: "dust", x: BRX, y: 860, at: 0.12, dur: 0.8 }],
    sfx: [{ name: "swish" }, { name: "kickhit", at: 0.08 }], shake: { at: 0.08, amp: 16, dur: 0.25 }, wait: 0.9, gap: 0 });
  const split = (who, id, l1, l2) => ({ act: { [who]: { pose: "punch", snap: 0.09 } }, hide: id,
    show: [{ id: id + "a", type: "box", x: BRX, y: 810, w: 190, h: 84, color: "#90caf9", label: l1, size: 58, pop: false, sfx: false, z: 2 },
      { id: id + "b", type: "box", x: BRX, y: 810, w: 340, h: 84, color: "#a5d6a7", label: l2, size: 58, pop: false, sfx: false, z: 2 }],
    anim: [{ do: "move", id: id + "a", x: 330, y: 540, rot: -12, dur: 0.5, at: 0.1, sfx: false }, { do: "move", id: id + "b", x: 540, y: 450, rot: 8, dur: 0.5, at: 0.1, sfx: false }],
    fx: [{ type: "hit", x: BRX, y: 800, text: "TÁCH!", color: "#42a5f5", dur: 0.7, at: 0.08 }], sfx: [{ name: "swish" }, { name: "kickhit", at: 0.08 }], shake: { at: 0.08, amp: 14, dur: 0.25 }, wait: 0.9, gap: 0 });

  // ---------- mô hình diện tích (toạ độ màn hình, trong bảng) ----------
  const bx = (id, cx, cy, w, h, color, label, at) => ({ id, type: "box", screen: true, x: cx, y: cy, w, h, color, label: label || "", size: 60, anim: "grow", dur: 0.5, at: at || 0, sfx: "pop", z: 3 });
  const lab = (id, text, x, y, at, color) => ({ id, type: "text", screen: true, text, x, y, size: 64, color: color || ORANGE, align: "center", anim: "write", dur: 0.4, at: at || 0, sfx: false, z: 4 });
  const SQ = { x0: 1110, y0: 300 };   // A = 360, B = 150 (px)

  // ---------- chưởng công thức (cảnh quyết chiến) ----------
  const atk = (id, text) => ({ id, type: "text", text, x: 1330, y: 330, size: 92, color: RED, panel: true, panelBorder: RED, align: "center", anim: "grow", dur: 0.5, sfx: "magic", z: 6 });
  const ctr = (id, text, at) => ({ id, type: "text", text, x: 900, y: 520, size: 84, color: GOLD, panel: true, align: "center", anim: "write", dur: 1.2, at: at || 0, sfx: "marker", z: 7 });
  const MAX = 1480;
  // một hiệp: Hắc Ma ra chưởng → đệ tử đọc chiêu đỡ → chưởng vàng bay trúng Hắc Ma
  const duel = (k, maSay, maSub, atkText, who, heroSay, heroSub, ctrText, hitText) => [
    { who: "ma", say: maSay, sub: maSub, pose: "punch", face: "angry", show: atk("a" + k, atkText), move: { who: "ma", to: MAX, dur: 0.5, style: "walk" },
      fx: [{ type: "aura", on: "ma", part: "chest", color: RED, dur: 1.6 }], sfx: [{ name: "swish2" }, { name: "boom", at: 0.3, vol: 0.5 }] },
    { who, say: heroSay, sub: heroSub, pose: "guard", face: "angry", show: ctr("c" + k, ctrText, 0.4), fx: [{ type: "aura", on: who, part: "chest", color: GOLD, dur: 1.8 }], sfx: [{ name: "magic2", vol: 0.6 }] },
    { act: { [who]: { pose: "punch", snap: 0.09 }, ma: { pose: "hit", delay: 0.42, snap: 0.07, face: "surprised" } },
      anim: [{ do: "move", id: "c" + k, x: MAX - 40, y: 560, scale: 0.35, dur: 0.42, sfx: false }, { do: "fadeout", id: "c" + k, at: 0.45, dur: 0.25, sfx: false }, { do: "move", id: "a" + k, y: -200, rot: -30, at: 0.42, dur: 0.6, sfx: false }],
      move: { who: "ma", to: MAX + 150, dur: 0.45, style: "slide" }, fx: [{ type: "speed", on: who, at: 0.05, dur: 0.4, dir: 1 }, { type: "hit", on: "ma", part: "chest", at: 0.42, text: hitText, color: "#ff7043" }],
      sfx: [{ name: "swish" }, { name: "punch", at: 0.42 }], shake: { at: 0.42, amp: 26, dur: 0.35 }, wait: 1.0, gap: 0 },
    { hide: "a" + k, act: { ma: { pose: "guard", face: "angry" }, [who]: { pose: "guard" } }, wait: 0.2, gap: 0 }
  ];

  window.FILM = {
    title: "Thất Đẳng Thần Công",
    subtitle: "Toán 8 · Bảy hằng đẳng thức đáng nhớ",
    file: "that-dang-than-cong",
    watermark: "Thầy Hà Văn Chung",
    music: "tension",
    subSize: 84,
    bubbles: false,
    cast: { thay: TEACHER, bin: BIN, na: NA, ma: MA, ke: KE },
    scenes: [
      // ================= 1. ĐÊM TRĂNG: truyền thuyết và kẻ ác =================
      { bg: "rooftop", trans: "iris",
        cast: { thay: HIDE, bin: HIDE, na: HIDE, ma: { x: 2200, pose: "idle", face: "angry", flip: true }, ke: HIDE },
        beats: [
          { title: { text: "THẤT ĐẲNG THẦN CÔNG", sub: "Phim võ thuật người que · Toán 8 · Bảy hằng đẳng thức đáng nhớ", dur: 3.6, bgColor: "rgba(20,10,10,.94)", color: GOLD },
            sfx: [{ name: "boom", vol: 0.9 }, { name: "kungfu", at: 0.6, vol: 0.8 }] },
          { who: "ke", say: "Giang hồ Đại Số... lưu truyền một môn võ công tối thượng... Thất Đẳng Thần Công!", sub: "Giang hồ Đại Số… lưu truyền Thất Đẳng Thần Công!",
            cam: { x: 1500, y: 300, zoom: 1.5, dur: 0.1 }, sfx: [{ name: "mystery", vol: 0.7 }] },
          { who: "ke", say: "Ai luyện thành bảy chiêu ấy... thì biểu thức rối rắm đến đâu... cũng hoá gọn trong một nhát!", sub: "Luyện thành 7 chiêu: biểu thức rối đến đâu cũng hoá gọn!",
            cam: { x: 960, y: 540, zoom: 1, dur: 3.0 } },
          { who: "ke", say: "Nhưng đêm nay... có một kẻ cũng thèm muốn bí kíp ấy.", sub: "Nhưng đêm nay… có kẻ thèm muốn bí kíp ấy.",
            move: { who: "ma", to: 1250, dur: 1.4, style: "jump", height: 260 }, sfx: [{ name: "whoosh" }, { name: "land", at: 1.4 }], shake: { at: 1.4, amp: 14, dur: 0.3 } },
          { who: "ma", say: "Ha ha ha! Ta là Hắc Ma! Bảy chiêu à? Ta chỉ cần MỘT chiêu... Khai Triển Bừa!", sub: "Ta là Hắc Ma! Ta chỉ cần MỘT chiêu: Khai Triển Bừa!",
            pose: "victory", face: "angry", cam: { x: 1250, y: 560, zoom: 1.5, dur: 0.6 }, fx: [{ type: "aura", on: "ma", part: "chest", color: RED, dur: 3.0 }], sfx: [{ name: "laugh", vol: 0.8 }, { name: "magic", at: 1.0 }] },
          { who: "ma", say: "A cộng B, tất cả bình phương... bằng A bình phương cộng B bình phương! Nhanh, gọn, đẹp!", sub: "(A + B)² = A² + B²  — nhanh, gọn, đẹp!",
            pose: "punch", cam: { x: 960, y: 540, zoom: 1, dur: 0.5 },
            show: { id: "evil", type: "text", text: "(A + B)^2 = A^2 + B^2", x: 640, y: 330, size: 104, color: RED, panel: true, panelBorder: RED, anim: "grow", dur: 0.6, sfx: "magic", z: 5 } },
          { who: "ke", say: "Sai! Đó chính là sai lầm... nguy hiểm nhất giang hồ. Hắn chém đâu, bài làm sai đó!", sub: "SAI! Sai lầm nguy hiểm nhất giang hồ!",
            show: { id: "evilx", type: "cross", x: 640, y: 320, scale: 2.4, anim: "grow", dur: 0.4, sfx: false, z: 6 }, fx: [{ type: "text", x: 640, y: 560, text: "SAI!", color: RED, dur: 1.6, at: 0.2 }],
            sfx: [{ name: "wrong", at: 0.2 }], shake: { at: 0.2, amp: 10, dur: 0.2 } },
          { who: "ma", say: "Sáng mai... ta sẽ đến Võ đường Thầy Chung... cướp Bí kíp Thất Đẳng! Ha ha ha!", sub: "Sáng mai ta đến Võ đường Thầy Chung cướp bí kíp!",
            pose: "victory", hide: ["evil", "evilx"], sfx: [{ name: "laugh", at: 1.8, vol: 0.8 }] },
          { move: { who: "ma", to: 2300, dur: 1.2, style: "jump", height: 320 }, sfx: [{ name: "whoosh" }, { name: "boom", at: 0.6, vol: 0.6 }], wait: 1.3, gap: 0 }
        ] },

      // ================= 2. VÕ ĐƯỜNG: Hắc Ma phá cửa =================
      { bg: "dojo", trans: "iris",
        cast: { thay: { x: -300, pose: "idle", face: "happy" }, bin: { x: 760, pose: "guard", face: "happy" }, na: { x: 1180, pose: "idle", face: "happy", flip: true }, ma: { x: 2300, pose: "idle", face: "angry", flip: true }, ke: HIDE },
        beats: [
          { who: "ke", say: "Sáng hôm sau... tại Võ đường Thầy Chung.", sub: "Sáng hôm sau… tại Võ đường Thầy Chung.", sfx: [{ name: "bell", vol: 0.5 }] },
          { who: "bin", say: "Hây a! Ta là Bin... đệ nhất cao thủ lớp Tám! Xem cước pháp này!", sub: "Hây a! Ta là Bin, đệ nhất cao thủ lớp 8!", pose: "highkick", face: "angry",
            sfx: [{ name: "swish" }, { name: "swish2", at: 1.2 }] },
          { act: { bin: { pose: "lie", snap: 0.25, face: "surprised" } }, sfx: [{ name: "fall" }, { name: "laugh", at: 0.6, vol: 0.7 }], fx: { type: "dust", on: "bin", part: "legs", dy: 110, dur: 0.8 }, shake: { amp: 8, dur: 0.2 }, wait: 1.2, gap: 0 },
          { who: "na", say: "Đệ nhất... ngã sấp mặt thì có!", sub: "Đệ nhất… ngã sấp mặt thì có!", pose: "facepalm", face: "happyclosed" },
          // Hắc Ma phá cửa
          { act: { bin: { pose: "idle", face: "surprised", snap: 0.3 }, na: { pose: "surprised", face: "surprised" } },
            move: { who: "ma", to: 1480, dur: 1.2, style: "flykick", height: 200 }, fx: [{ type: "dust", x: 1480, y: 950, at: 1.2, dur: 0.9 }],
            sfx: [{ name: "boom", vol: 0.9 }, { name: "whoosh", at: 0.2 }, { name: "land", at: 1.2 }], shake: { at: 1.2, amp: 30, dur: 0.5 }, wait: 1.4, gap: 0 },
          { who: "ma", say: "Võ đường Thầy Chung đây sao? Ta là Hắc Ma! Giao Bí kíp Thất Đẳng ra đây!", sub: "Ta là Hắc Ma! Giao Bí kíp Thất Đẳng ra đây!", pose: "angry", face: "angry",
            act: { na: { flip: false, x: 1000, pose: "guard", face: "angry" } }, fx: [{ type: "aura", on: "ma", part: "chest", color: RED, dur: 2.0 }] },
          { who: "bin", say: "Bước qua xác ta đã!", sub: "Bước qua xác ta đã!", pose: "guard", face: "angry", move: { who: "bin", to: 1250, dur: 0.6, style: "run" } },
          { act: { bin: { pose: "punch", snap: 0.1 }, ma: { pose: "block", snap: 0.08, delay: 0.1 } }, sfx: [{ name: "swish" }, { name: "punch2", at: 0.12, vol: 0.7 }], fx: { type: "hit", on: "ma", part: "chest", dx: -50, at: 0.12, dur: 0.3 }, wait: 0.5, gap: 0 },
          { who: "ma", say: "Hừ! Thử đỡ chiêu này: x cộng một, tất cả bình phương... bằng mấy?", sub: "Đỡ chiêu này: (x + 1)² = ?", pose: "punch", face: "angry",
            show: { id: "q1", type: "text", text: "(x + 1)^2 = ?", x: 1000, y: 430, size: 100, color: RED, panel: true, panelBorder: RED, anim: "grow", dur: 0.5, sfx: "magic", z: 5 } },
          { who: "bin", say: "Dễ ợt! Bằng x bình phương cộng một!", sub: "Dễ ợt! Bằng x² + 1!", pose: "pointup", face: "happy",
            set: { id: "q1", text: "(x + 1)^2 = x^2 + 1" } },
          { who: "ma", say: "Ha ha ha! Trúng độc Khai Triển Bừa rồi!", sub: "Ha ha! Trúng độc Khai Triển Bừa rồi!", pose: "victory",
            anim: { do: "move", id: "q1", x: 1250, y: 620, scale: 0.3, dur: 0.5, at: 0.2, sfx: false }, act: { bin: { pose: "dizzy", face: "sad", delay: 0.7 } },
            fx: [{ type: "hit", on: "bin", part: "head", at: 0.7, text: "ỐI!", color: "#ab47bc" }], sfx: [{ name: "whoosh", at: 0.2 }, { name: "oof", at: 0.7 }, { name: "laugh", at: 1.2, vol: 0.8 }] },
          { hide: "q1", act: { ma: { pose: "punch", snap: 0.1 } }, who: "ma", say: "Giờ thì... cút sang một bên!", sub: "Giờ thì… cút sang một bên!", sfx: [{ name: "swish2" }] },
          // Thầy Chung xuất hiện
          { who: "thay", say: "Dừng tay!", sub: "DỪNG TAY!", pose: "guard", face: "angry", cam: { x: 960, y: 540, zoom: 1, dur: 0.3 },
            move: { who: "thay", to: 1080, dur: 1.2, style: "flykick", height: 230 }, act: { ma: { pose: "hit", delay: 1.0, snap: 0.07, face: "surprised" } },
            fx: [{ type: "speed", on: "thay", at: 0.4, dur: 0.6, dir: 1 }, { type: "hit", on: "ma", part: "chest", at: 1.0, text: "BỐP!" }],
            sfx: [{ name: "whoosh" }, { name: "punch", at: 1.0 }], shake: { at: 1.0, amp: 28, dur: 0.4 } },
          { move: { who: "ma", to: 1650, dur: 0.5, style: "slide" }, act: { ma: { pose: "guard", delay: 0.5 }, bin: { x: 820, pose: "dizzy" } }, wait: 0.7, gap: 0 },
          { who: "thay", say: "Bin! Khai triển đúng phải là: x bình phương, cộng hai x, cộng một!", sub: "(x + 1)² = x² + 2x + 1",
            pose: "punch", face: "angry", show: { id: "q2", type: "text", text: "(x + 1)^2 = x^2 + 2x + 1", x: 900, y: 430, size: 100, color: GOLD, panel: true, anim: "write", dur: 1.4, sfx: "marker", z: 5 },
            anim: { do: "indicate", id: "q2", at: 2.6, dur: 1.0 }, fx: [{ type: "aura", on: "thay", part: "chest", color: GOLD, dur: 3.0 }], sfx: [{ name: "magic2", vol: 0.6 }, { name: "ding", at: 2.6 }] },
          { act: { bin: { pose: "idle", face: "happy", snap: 0.4 } }, who: "bin", say: "Ơ... con tỉnh rồi! Thì ra con quên mất hai x!", sub: "Ơ… con tỉnh rồi! Con quên mất 2x!", pose: "surprised", face: "surprised" },
          { who: "ma", say: "Hừ! Khá lắm, Thầy Chung! Ba ngày nữa... trên đỉnh Luỹ Thừa Sơn... ta sẽ quyết đấu bảy chiêu!", sub: "Ba ngày nữa, đỉnh Luỹ Thừa Sơn: quyết đấu 7 chiêu!", pose: "angry", face: "angry", hide: "q2" },
          { who: "ma", say: "Thua... thì võ đường này đổi tên thành... Võ đường Nhân Bừa! Ha ha ha!", sub: "Thua thì đổi tên thành… Võ đường Nhân Bừa!", pose: "victory",
            sfx: [{ name: "laugh", at: 2.2, vol: 0.8 }] },
          { move: { who: "ma", to: 2300, dur: 1.1, style: "jump", height: 340 }, sfx: [{ name: "whoosh" }], wait: 1.2, gap: 0 },
          { who: "na", say: "Thưa sư phụ... ba ngày có kịp không ạ?", sub: "Thưa sư phụ… ba ngày có kịp không ạ?", pose: "ask", face: "worried", act: { thay: { flip: true } } },
          { who: "thay", say: "Kịp! Ba ngày tới, các con sẽ luyện Thất Đẳng Thần Công: bảy hằng đẳng thức đáng nhớ!", sub: "Ba ngày: luyện 7 hằng đẳng thức đáng nhớ!", pose: "pointup", face: "happy",
            sfx: [{ name: "ding", at: 2.6 }] },
          { who: "bin", say: "Dạ! Sư phụ!", sub: "Dạ! Sư phụ!", pose: "fistbow", face: "happy", act: { na: { pose: "fistbow", face: "happy" } }, sfx: [{ name: "kungfu", vol: 0.6 }] }
        ] },

      // ================= 3. NGÀY THỨ NHẤT: Bài 6 — chiêu 1, 2, 3 =================
      { bg: "dojo", trans: "flash",
        cast: { thay: { x: 150, pose: "idle", face: "happy" }, na: { x: 310, pose: "idle", face: "happy" }, bin: { x: 460, pose: "guard", face: "happy" }, ma: HIDE, ke: HIDE },
        beats: [
          { who: "ke", say: "Ngày thứ nhất. Bài sáu: hiệu hai bình phương, bình phương của một tổng, và bình phương của một hiệu.", sub: "NGÀY 1 · Bài 6: ba chiêu bình phương",
            show: panel("Ngày 1 · Bài 6") },
          // ---- CHIÊU 1: hiệu hai bình phương ----
          chieu(1, "SONG LONG HỢP BÍCH", "Hiệu hai bình phương"),
          { who: "thay", say: "Chiêu một: A bình phương trừ B bình phương... bằng A trừ B, nhân với A cộng B!", sub: "A² − B² = (A − B)(A + B)", pose: "explain",
            set: { id: "pn", title: "Chiêu 1 · Hiệu hai bình phương" }, show: T("f1", "A^2 − B^2 = (A − B)(A + B)", 200, { size: 92, color: GOLD, at: 0.3 }), anim: circ("f1", 3.6), sfx: [{ name: "ding", at: 3.6 }], wait: 5.2 },
          { who: "thay", say: "Nhìn này: hình vuông cạnh A, cắt đi góc vuông cạnh B. Phần còn lại là A bình phương trừ B bình phương.", sub: "Hình vuông A², cắt bỏ góc B²",
            show: [bx("h1", SQ.x0 + 180, SQ.y0 + 105, 360, 210, "#1e88e5", "", 0.2), bx("h2", SQ.x0 + 105, SQ.y0 + 285, 210, 150, "#1e88e5", "", 0.2), bx("h3", SQ.x0 + 285, SQ.y0 + 285, 150, 150, "#43a047", "B^2", 0.2),
              lab("hA", "A", SQ.x0 + 180, SQ.y0 - 18, 0.6), lab("hA2", "A", SQ.x0 - 40, SQ.y0 + 200, 0.6), lab("hB", "B", SQ.x0 + 400, SQ.y0 + 305, 0.6, GREEN)],
            anim: [{ do: "fadeout", id: "h3", at: 3.4, dur: 0.6, sfx: false }], fx: [{ type: "hit", x: SQ.x0 + 285 - 340, y: SQ.y0 + 285, at: 3.4, dur: 0.5, text: "XOẸT!", color: GREEN }], sfx: [{ name: "swish", at: 3.4 }] },
          { who: "thay", say: "Xoay miếng nhỏ, ghép sang phải: được hình chữ nhật dài A cộng B, rộng A trừ B!", sub: "Ghép lại: hình chữ nhật (A + B) × (A − B)",
            anim: [{ do: "move", id: "h2", x: SQ.x0 + 435, y: SQ.y0 + 105, rot: 90, dur: 1.0, at: 0.4, sfx: false }, ...fade(["hA", "hA2", "hB"], 0.2)],
            show: [lab("hAB", "A + B", SQ.x0 + 255, SQ.y0 - 18, 1.6, GOLD), lab("hAm", "A − B", SQ.x0 - 95, SQ.y0 + 125, 1.8, GOLD)], sfx: [{ name: "whoosh", at: 0.4 }, { name: "click", at: 1.4 }] },
          { who: "na", say: "Diện tích không đổi! Nên A bình phương trừ B bình phương, bằng A trừ B nhân A cộng B!", sub: "Diện tích không đổi ⇒ A² − B² = (A − B)(A + B)", pose: "pointup", face: "happy", anim: circ("f1", 0.3), sfx: [{ name: "ding", at: 0.3 }] },
          { who: "thay", say: "Bin! Chặt viên gạch: một trăm linh một nhân chín mươi chín!", sub: "Bin! Tính nhẩm 101 · 99", pose: "point", show: brick("g1", "101 · 99"),
            anim: fade(["h1", "h2", "hAB", "hAm"]) },
          { who: "bin", say: "Một trăm cộng một, nhân một trăm trừ một... bằng mười nghìn trừ một!", sub: "(100 + 1)(100 − 1) = 100² − 1²", pose: "guard", face: "angry",
            show: [T("e1", "101 · 99 = (100 + 1)(100 − 1)", 420, { at: 0.3 }), T("e2", "= 100^2 − 1^2 = 10000 − 1", 560, { at: 2.4 })] },
          chop("bin", "g1"),
          { who: "bin", say: "Chín nghìn chín trăm chín mươi chín! Không cần máy tính!", sub: "= 9999. Không cần máy tính!", pose: "victory", face: "happy",
            show: T("e3", "= 9999", 700, { size: 104, color: GREEN, at: 0.2 }), anim: circ("e3", 1.0), sfx: [{ name: "tada", at: 1.0, vol: 0.6 }] },
          { anim: fade(["e1", "e2", "e3", "g1_st"]), wait: 0.3, gap: 0 },

          // ---- CHIÊU 2: bình phương của một tổng ----
          chieu(2, "TỨ PHƯƠNG TRẬN", "Bình phương của một tổng"),
          { who: "thay", say: "Chiêu hai: A cộng B, tất cả bình phương... bằng A bình phương, cộng hai A B, cộng B bình phương!", sub: "(A + B)² = A² + 2AB + B²", pose: "explain",
            set: { id: "pn", title: "Chiêu 2 · Bình phương của một tổng" }, anim: [...fade(["f1"]), circ("f2", 4.0)],
            show: T("f2", "(A + B)^2 = A^2 + 2AB + B^2", 200, { size: 92, color: GOLD, at: 0.4 }), sfx: [{ name: "ding", at: 4.0 }], wait: 5.4 },
          { who: "thay", say: "Hình vuông cạnh A cộng B, chia thành bốn mảnh: A bình phương, B bình phương... và HAI mảnh A B.", sub: "Bốn mảnh: A², B² và HAI mảnh AB",
            show: [bx("s1", SQ.x0 + 180, SQ.y0 + 180, 360, 360, "#1e88e5", "A^2", 0.2), bx("s2", SQ.x0 + 435, SQ.y0 + 180, 150, 360, "#ffb300", "AB", 1.0), bx("s3", SQ.x0 + 180, SQ.y0 + 435, 360, 150, "#ffb300", "AB", 1.4),
              bx("s4", SQ.x0 + 435, SQ.y0 + 435, 150, 150, "#43a047", "B^2", 1.8), lab("sA", "A", SQ.x0 + 180, SQ.y0 - 18, 0.4), lab("sB", "B", SQ.x0 + 435, SQ.y0 - 18, 0.4, GREEN),
              lab("sA2", "A", SQ.x0 - 40, SQ.y0 + 200, 0.4), lab("sB2", "B", SQ.x0 - 40, SQ.y0 + 457, 0.4, GREEN)] },
          { who: "bin", say: "À! Thì ra Hắc Ma quên mất hai mảnh A B! Thảo nào sai bét!", sub: "Hắc Ma quên mất HAI mảnh AB!", pose: "pointup", face: "surprised",
            anim: [{ do: "indicate", id: "s2", at: 0.4, dur: 1.0 }, { do: "indicate", id: "s3", at: 1.2, dur: 1.0 }], fx: [{ type: "text", x: 1700, y: 560, text: "2AB!", color: ORANGE, dur: 1.8, at: 0.6 }], sfx: [{ name: "ding", at: 0.6 }] },
          { who: "thay", say: "Na! Chặt gạch: hai mươi mốt bình phương!", sub: "Na! Tính nhẩm 21²", pose: "point", show: brick("g2", "21^2"), anim: fade(["s1", "s2", "s3", "s4", "sA", "sB", "sA2", "sB2"]) },
          { who: "na", say: "Hai mươi cộng một, tất cả bình phương: bốn trăm, cộng bốn mươi, cộng một!", sub: "(20 + 1)² = 400 + 40 + 1", pose: "guard", face: "angry",
            act: { na: { x: 470 }, bin: { x: 330 } }, show: [T("e4", "21^2 = (20 + 1)^2", 420, { at: 0.3 }), T("e5", "= 20^2 + 2 · 20 · 1 + 1^2", 560, { at: 2.0 })] },
          chop("na", "g2", "HÂY A!"),
          { who: "na", say: "Bằng bốn trăm bốn mươi mốt!", sub: "= 441", pose: "victory", face: "happy",
            show: T("e6", "= 400 + 40 + 1 = 441", 700, { color: GREEN, at: 0.2 }), anim: circ("e6", 1.0), sfx: [{ name: "tada", at: 1.0, vol: 0.6 }] },
          { anim: fade(["e4", "e5", "e6", "g2_st"]), wait: 0.3, gap: 0 },

          // ---- CHIÊU 3: bình phương của một hiệu ----
          chieu(3, "PHẢN THỦ TỨ PHƯƠNG", "Bình phương của một hiệu"),
          { who: "thay", say: "Chiêu ba: A trừ B, tất cả bình phương... bằng A bình phương, trừ hai A B, cộng B bình phương!", sub: "(A − B)² = A² − 2AB + B²", pose: "explain",
            set: { id: "pn", title: "Chiêu 3 · Bình phương của một hiệu" }, anim: [...fade(["f2"]), circ("f3", 4.0)],
            show: T("f3", "(A − B)^2 = A^2 − 2AB + B^2", 200, { size: 92, color: GOLD, at: 0.4 }), sfx: [{ name: "ding", at: 4.0 }], wait: 5.4 },
          { who: "thay", say: "Khác chiêu hai đúng một chỗ: dấu ở giữa đổi thành trừ. Còn B bình phương... vẫn luôn cộng!", sub: "Chỉ đổi dấu giữa: − 2AB; B² vẫn cộng!", pose: "pointup",
            show: [T("v1", "(A + B)^2 = A^2 \\color{#69f0ae}{+ 2AB} + B^2", 400, { size: 80, at: 0.2 }), T("v2", "(A − B)^2 = A^2 \\color{#ff5252}{− 2AB} + B^2", 520, { size: 80, at: 1.6 })],
            anim: [{ do: "circumscribe", id: "v2", at: 3.2, dur: 1.2 }], sfx: [{ name: "ding", at: 3.2 }] },
          { who: "thay", say: "Bin! Chín mươi chín bình phương!", sub: "Bin! Tính nhẩm 99²", pose: "point", show: brick("g3", "99^2"), anim: fade(["v1", "v2"]), act: { na: { x: 310 }, bin: { x: 460 } } },
          { who: "bin", say: "Một trăm trừ một, bình phương: mười nghìn, trừ hai trăm, cộng một!", sub: "(100 − 1)² = 10000 − 200 + 1", pose: "guard", face: "angry",
            show: [T("e7", "99^2 = (100 − 1)^2", 420, { at: 0.3 }), T("e8", "= 100^2 − 2 · 100 · 1 + 1^2", 560, { at: 2.0 })] },
          chop("bin", "g3"),
          { who: "bin", say: "Chín nghìn tám trăm linh một! Hết đau tay luôn!", sub: "= 9801. Hết đau tay luôn!", pose: "victory", face: "happy",
            show: T("e9", "= 10000 − 200 + 1 = 9801", 700, { color: GREEN, at: 0.2 }), anim: circ("e9", 1.0), sfx: [{ name: "tada", at: 1.0, vol: 0.6 }, { name: "laugh", at: 2.2, vol: 0.4 }] },
          { anim: fade(["e7", "e8", "e9", "g3_st", "f3"]), act: { bin: { pose: "tired", face: "sad" }, na: { pose: "tired" } }, who: "bin", say: "Hết ngày một... con mỏi cả não ạ!", sub: "Hết ngày một… con mỏi cả não ạ!", sfx: [{ name: "laugh", at: 1.4, vol: 0.5 }] }
        ] },

      // ================= 4. NGÀY THỨ HAI: Bài 7 — chiêu 4, 5 =================
      { bg: "dojo", trans: "flash",
        cast: { thay: { x: 150, pose: "idle", face: "happy" }, na: { x: 470, pose: "guard", face: "happy" }, bin: { x: 310, pose: "idle", face: "happy" }, ma: HIDE, ke: HIDE },
        beats: [
          { who: "ke", say: "Ngày thứ hai. Bài bảy: lập phương của một tổng, và lập phương của một hiệu. Chiêu khó hơn... lực mạnh hơn!", sub: "NGÀY 2 · Bài 7: hai chiêu lập phương",
            show: panel("Ngày 2 · Bài 7") },
          chieu(4, "TAM TAM LIÊN HOÀN", "Lập phương của một tổng"),
          { who: "thay", say: "Chiêu bốn: A cộng B, tất cả lập phương... bằng A lập phương, cộng ba A bình phương B, cộng ba A B bình phương, cộng B lập phương!", sub: "(A + B)³ = A³ + 3A²B + 3AB² + B³", pose: "explain",
            set: { id: "pn", title: "Chiêu 4 · Lập phương của một tổng" }, show: [T("f4", "(A + B)^3", 190, { size: 92, color: GOLD, at: 0.3 }), T("f4b", "= A^3 + 3A^2B + 3AB^2 + B^3", 310, { size: 88, color: GOLD, at: 1.4 })],
            anim: [circ("f4b", 5.6)], sfx: [{ name: "ding", at: 5.6 }], wait: 6.8 },
          { who: "thay", say: "Bí quyết: hệ số một, ba, ba, một. Số mũ của A giảm từ ba về không, số mũ của B tăng từ không lên ba.", sub: "Hệ số 1 – 3 – 3 – 1; mũ A giảm 3 → 0, mũ B tăng 0 → 3", pose: "pointup",
            show: [T("k1", "\\color{#ffb74d}{1} · 3 · 3 · \\color{#ffb74d}{1}", 470, { size: 96, color: ORANGE, at: 0.2 }), T("k2", "mũ A: 3 → 2 → 1 → 0", 600, { size: 76, color: BLUE, at: 2.6 }), T("k3", "mũ B: 0 → 1 → 2 → 3", 700, { size: 76, color: GREEN, at: 4.2 })],
            sfx: [{ name: "ding", at: 0.4 }, { name: "pop", at: 2.6 }, { name: "pop", at: 4.2 }] },
          { who: "thay", say: "Na! Mười một lập phương!", sub: "Na! Tính nhẩm 11³", pose: "point", show: brick("g4", "11^3"), anim: fade(["k1", "k2", "k3"]) },
          { who: "na", say: "Mười cộng một, lập phương: một nghìn, cộng ba trăm, cộng ba mươi, cộng một!", sub: "(10 + 1)³ = 1000 + 300 + 30 + 1", pose: "guard", face: "angry",
            show: [T("e10", "11^3 = (10 + 1)^3", 470, { at: 0.3 }), T("e11", "= 10^3 + 3 · 10^2 + 3 · 10 + 1", 600, { size: 80, at: 2.2 })] },
          chop("na", "g4", "HÂY A!"),
          { who: "na", say: "Một nghìn ba trăm ba mươi mốt!", sub: "= 1331", pose: "victory", face: "happy",
            show: T("e12", "= 1000 + 300 + 30 + 1 = 1331", 730, { size: 80, color: GREEN, at: 0.2 }), anim: circ("e12", 1.0), sfx: [{ name: "tada", at: 1.0, vol: 0.6 }] },
          { anim: fade(["e10", "e11", "e12", "g4_st", "f4", "f4b"]), wait: 0.3, gap: 0 },

          chieu(5, "ÂM DƯƠNG XEN KẼ", "Lập phương của một hiệu"),
          { who: "thay", say: "Chiêu năm: A trừ B, tất cả lập phương... bằng A lập phương, trừ ba A bình phương B, cộng ba A B bình phương, trừ B lập phương!", sub: "(A − B)³ = A³ − 3A²B + 3AB² − B³", pose: "explain",
            set: { id: "pn", title: "Chiêu 5 · Lập phương của một hiệu" }, show: [T("f5", "(A − B)^3", 190, { size: 92, color: GOLD, at: 0.3 }), T("f5b", "= A^3 − 3A^2B + 3AB^2 − B^3", 310, { size: 88, color: GOLD, at: 1.4 })],
            anim: [circ("f5b", 5.6)], sfx: [{ name: "ding", at: 5.6 }], wait: 6.8 },
          { who: "thay", say: "Dấu đi xen kẽ: cộng, trừ, cộng, trừ. Như âm dương luân chuyển!", sub: "Dấu xen kẽ:  +  −  +  −", pose: "pointup",
            show: T("k4", "\\color{#69f0ae}{+} A^3 \\color{#ff5252}{−} 3A^2B \\color{#69f0ae}{+} 3AB^2 \\color{#ff5252}{−} B^3", 500, { size: 88, at: 0.2 }), anim: circ("k4", 2.2), sfx: [{ name: "ding", at: 2.2 }] },
          { who: "thay", say: "Bin! Chín lập phương!", sub: "Bin! Tính nhẩm 9³", pose: "point", show: brick("g5", "9^3"), anim: fade(["k4"]), act: { bin: { x: 470 }, na: { x: 310 } } },
          { who: "bin", say: "Mười trừ một, lập phương: một nghìn, trừ ba trăm, cộng ba mươi, trừ một!", sub: "(10 − 1)³ = 1000 − 300 + 30 − 1", pose: "guard", face: "angry",
            show: [T("e13", "9^3 = (10 − 1)^3", 470, { at: 0.3 }), T("e14", "= 10^3 − 3 · 10^2 + 3 · 10 − 1", 600, { size: 80, at: 2.2 })] },
          chop("bin", "g5"),
          { who: "bin", say: "Bảy trăm hai mươi chín! Con lên level rồi sư phụ ơi!", sub: "= 729. Con lên level rồi!", pose: "victory", face: "happy",
            show: T("e15", "= 1000 − 300 + 30 − 1 = 729", 730, { size: 80, color: GREEN, at: 0.2 }), anim: circ("e15", 1.0), sfx: [{ name: "tada", at: 1.0, vol: 0.6 }] },
          { anim: fade(["e13", "e14", "e15", "g5_st", "f5", "f5b"]), wait: 0.3, gap: 0 }
        ] },

      // ================= 5. NGÀY THỨ BA: Bài 8 — chiêu 6, 7 =================
      { bg: "dojo", trans: "flash",
        cast: { thay: { x: 150, pose: "idle", face: "happy" }, na: { x: 310, pose: "idle", face: "happy" }, bin: { x: 460, pose: "guard", face: "happy" }, ma: HIDE, ke: HIDE },
        beats: [
          { who: "ke", say: "Ngày thứ ba. Bài tám: tổng và hiệu hai lập phương. Hai chiêu cuối... chiêu tách gạch!", sub: "NGÀY 3 · Bài 8: tổng và hiệu hai lập phương",
            show: panel("Ngày 3 · Bài 8") },
          chieu(6, "CỘNG NGHỊCH TRỪ", "Tổng hai lập phương"),
          { who: "thay", say: "Chiêu sáu: A lập phương cộng B lập phương... bằng A cộng B, nhân với: A bình phương, trừ A B, cộng B bình phương!", sub: "A³ + B³ = (A + B)(A² − AB + B²)", pose: "explain",
            set: { id: "pn", title: "Chiêu 6 · Tổng hai lập phương" }, show: [T("f6", "A^3 + B^3", 190, { size: 92, color: GOLD, at: 0.3 }), T("f6b", "= (A + B)(A^2 − AB + B^2)", 310, { size: 88, color: GOLD, at: 1.4 })],
            anim: [circ("f6b", 5.2)], sfx: [{ name: "ding", at: 5.2 }], wait: 6.4 },
          { who: "thay", say: "Ngoặc đầu cùng dấu với đề bài. Dấu ở giữa ngoặc sau thì NGƯỢC lại. B bình phương cuối cùng luôn cộng.", sub: "Ngoặc đầu cùng dấu; dấu giữa ngoặc sau NGƯỢC lại", pose: "pointup",
            show: T("k6", "A^3 \\color{#69f0ae}{+} B^3 = (A \\color{#69f0ae}{+} B)(A^2 \\color{#ff5252}{−} AB + B^2)", 500, { size: 80, at: 0.2 }), anim: circ("k6", 3.0), sfx: [{ name: "ding", at: 3.0 }] },
          { who: "thay", say: "Bin! Tách viên gạch: x lập phương cộng tám, thành hai nhân tử!", sub: "Bin! Phân tích x³ + 8 thành nhân tử", pose: "point", show: brick("g6", "x^3 + 8"), anim: fade(["k6"]) },
          { who: "bin", say: "Tám là hai lập phương! Vậy A là x, B là hai.", sub: "8 = 2³  ⇒  A = x, B = 2", pose: "think", face: "thinking",
            show: T("e16", "x^3 + 8 = x^3 + 2^3", 470, { at: 0.3 }) },
          split("bin", "g6", "x + 2", "x^2 − 2x + 4"),
          { who: "bin", say: "Bằng x cộng hai, nhân với x bình phương, trừ hai x, cộng bốn!", sub: "= (x + 2)(x² − 2x + 4)", pose: "victory", face: "happy",
            show: T("e17", "= (x + 2)(x^2 − 2x + 4)", 620, { color: GREEN, at: 0.2 }), anim: circ("e17", 2.4), sfx: [{ name: "tada", at: 2.4, vol: 0.6 }] },
          { anim: fade(["e16", "e17", "g6a", "g6b", "g6_st", "f6", "f6b"]), wait: 0.3, gap: 0 },

          chieu(7, "TRỪ NGHỊCH CỘNG", "Hiệu hai lập phương"),
          { who: "thay", say: "Chiêu bảy: A lập phương trừ B lập phương... bằng A trừ B, nhân với: A bình phương, cộng A B, cộng B bình phương!", sub: "A³ − B³ = (A − B)(A² + AB + B²)", pose: "explain",
            set: { id: "pn", title: "Chiêu 7 · Hiệu hai lập phương" }, show: [T("f7", "A^3 − B^3", 190, { size: 92, color: GOLD, at: 0.3 }), T("f7b", "= (A − B)(A^2 + AB + B^2)", 310, { size: 88, color: GOLD, at: 1.4 })],
            anim: [circ("f7b", 5.2)], sfx: [{ name: "ding", at: 5.2 }], wait: 6.4 },
          { who: "na", say: "Con hiểu rồi! Đề là trừ, nên ngoặc đầu trừ, dấu giữa ngoặc sau đổi thành cộng!", sub: "Đề trừ ⇒ ngoặc đầu trừ, dấu giữa thành CỘNG", pose: "pointup", face: "happy",
            show: T("k7", "A^3 \\color{#ff5252}{−} B^3 = (A \\color{#ff5252}{−} B)(A^2 \\color{#69f0ae}{+} AB + B^2)", 500, { size: 80, at: 0.2 }), anim: circ("k7", 3.0), sfx: [{ name: "ding", at: 3.0 }] },
          { who: "thay", say: "Giỏi! Na, tách: x lập phương trừ hai mươi bảy!", sub: "Na! Phân tích x³ − 27 thành nhân tử", pose: "point", show: brick("g7", "x^3 − 27"), anim: fade(["k7"]), act: { na: { x: 470 }, bin: { x: 310 } } },
          { who: "na", say: "Hai mươi bảy là ba lập phương. A là x, B là ba.", sub: "27 = 3³  ⇒  A = x, B = 3", pose: "think", face: "thinking",
            show: T("e18", "x^3 − 27 = x^3 − 3^3", 470, { at: 0.3 }) },
          split("na", "g7", "x − 3", "x^2 + 3x + 9"),
          { who: "na", say: "Bằng x trừ ba, nhân với x bình phương, cộng ba x, cộng chín!", sub: "= (x − 3)(x² + 3x + 9)", pose: "victory", face: "happy",
            show: T("e19", "= (x − 3)(x^2 + 3x + 9)", 620, { color: GREEN, at: 0.2 }), anim: circ("e19", 2.4), sfx: [{ name: "tada", at: 2.4, vol: 0.6 }] },
          { anim: fade(["e18", "e19", "g7a", "g7b", "g7_st", "f7", "f7b", "pn"]), wait: 0.4, gap: 0 },
          { who: "thay", say: "Bảy chiêu đã thành! Nhớ kĩ: chiêu đúng, dấu đúng, hệ số đúng... thì không kẻ ác nào thắng nổi!", sub: "7 chiêu đã thành! Chiêu đúng – dấu đúng – hệ số đúng!", pose: "pointup", face: "happy",
            cam: { x: 330, y: 640, zoom: 1.6, dur: 1.0 }, fx: [{ type: "aura", on: "thay", part: "chest", color: GOLD, dur: 3.0 }], sfx: [{ name: "magic2", vol: 0.6 }] },
          { who: "bin", say: "Hắc Ma ơi... chuẩn bị tinh thần đi!", sub: "Hắc Ma ơi… chuẩn bị tinh thần đi!", pose: "fistbow", face: "angry", act: { na: { pose: "fistbow", face: "angry" } },
            cam: { x: 960, y: 540, zoom: 1, dur: 0.6 }, sfx: [{ name: "kungfu", vol: 0.6 }] }
        ] },

      // ================= 6. ĐỈNH LUỸ THỪA SƠN: quyết chiến bảy chiêu =================
      { bg: "mountain", trans: "iris",
        cast: { thay: { x: 260, pose: "guard", face: "angry" }, na: { x: 470, pose: "guard", face: "angry" }, bin: { x: 650, pose: "guard", face: "angry" }, ma: { x: 2200, pose: "idle", face: "angry", flip: true }, ke: HIDE },
        beats: [
          { title: { text: "ĐỈNH LUỸ THỪA SƠN", sub: "Trận quyết chiến bảy chiêu", dur: 3.0, bgColor: "rgba(40,10,40,.93)", color: GOLD }, sfx: [{ name: "boom" }, { name: "tension", at: 0.4, vol: 0.8 }] },
          { who: "ke", say: "Hoàng hôn ngày thứ ba... gió núi rít từng cơn.", sub: "Hoàng hôn ngày thứ ba… gió núi rít từng cơn.", cam: { x: 960, y: 420, zoom: 1.25, dur: 0.1 } },
          { who: "ma", say: "Ha ha ha! Thầy trò nhà ngươi đến nộp mạng rồi à?", sub: "Thầy trò nhà ngươi đến nộp mạng rồi à?", pose: "victory", cam: { x: 960, y: 540, zoom: 1, dur: 1.4 },
            move: { who: "ma", to: MAX, dur: 1.4, style: "jump", height: 300 }, sfx: [{ name: "whoosh" }, { name: "land", at: 1.4 }, { name: "laugh", at: 1.6, vol: 0.8 }], shake: { at: 1.4, amp: 18, dur: 0.3 } },
          { who: "thay", say: "Ra chiêu đi, Hắc Ma!", sub: "Ra chiêu đi, Hắc Ma!", pose: "guard", face: "angry", sfx: [{ name: "bell", vol: 0.6 }],
            fx: { type: "text", x: 960, y: 300, text: "QUYẾT CHIẾN!", color: GOLD, dur: 1.4 } },
          // hiệp 1 — chiêu 3
          ...duel(1, "Chưởng thứ nhất: chín mươi tám bình phương!", "Chưởng 1: 98² = ?", "98^2 = ?", "na",
            "Phản Thủ Tứ Phương! Một trăm trừ hai, bình phương: mười nghìn, trừ bốn trăm, cộng bốn... bằng chín nghìn sáu trăm linh bốn!", "(100 − 2)² = 10000 − 400 + 4 = 9604",
            "(100 − 2)^2 = 10000 − 400 + 4 = 9604", "BỐP!"),
          // hiệp 2 — chiêu 1
          ...duel(2, "Chưởng thứ hai: phân tích x bình phương trừ mười sáu!", "Chưởng 2: x² − 16 = ?", "x^2 − 16 = ?", "bin",
            "Song Long Hợp Bích! Mười sáu là bốn bình phương... bằng x trừ bốn, nhân x cộng bốn!", "x² − 4² = (x − 4)(x + 4)",
            "x^2 − 4^2 = (x − 4)(x + 4)", "CHÁT!"),
          // hiệp 3 — chiêu 4 (đỡ tà công)
          { who: "ma", say: "Tuyệt chiêu Khai Triển Bừa: a cộng b, lập phương, bằng a lập phương cộng b lập phương!", sub: "Tà công: (a + b)³ = a³ + b³", pose: "punch", face: "angry", show: atk("a3", "(a + b)^3 = a^3 + b^3"),
            move: { who: "ma", to: MAX, dur: 0.5, style: "walk" }, fx: [{ type: "aura", on: "ma", part: "chest", color: RED, dur: 2.0 }], sfx: [{ name: "swish2" }, { name: "boom", at: 0.3, vol: 0.6 }] },
          { who: "na", say: "Sai! Ngươi thiếu ba a bình phương b, và ba a b bình phương! Tam Tam Liên Hoàn!", sub: "SAI! Thiếu 3a²b + 3ab²", pose: "guard", face: "angry",
            show: ctr("c3", "(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3", 0.6), fx: [{ type: "aura", on: "na", part: "chest", color: GOLD, dur: 1.8 }, { type: "text", x: 1330, y: 230, text: "SAI!", color: RED, dur: 1.4, at: 0.3 }], sfx: [{ name: "wrong", at: 0.3 }] },
          { act: { na: { pose: "highkick", snap: 0.09 }, ma: { pose: "hit", delay: 0.42, snap: 0.07, face: "surprised" } },
            anim: [{ do: "move", id: "c3", x: MAX - 40, y: 560, scale: 0.35, dur: 0.42, sfx: false }, { do: "fadeout", id: "c3", at: 0.45, dur: 0.25, sfx: false }, { do: "move", id: "a3", y: -200, rot: -30, at: 0.42, dur: 0.6, sfx: false }],
            move: { who: "ma", to: MAX + 180, dur: 0.45, style: "slide" }, fx: [{ type: "speed", on: "na", at: 0.05, dur: 0.4, dir: 1 }, { type: "hit", on: "ma", part: "head", at: 0.42, text: "HỰ!" }],
            sfx: [{ name: "swish" }, { name: "kickhit", at: 0.42 }], shake: { at: 0.42, amp: 28, dur: 0.35 }, wait: 1.0, gap: 0 },
          { hide: "a3", act: { ma: { pose: "dizzy", face: "sad" }, na: { pose: "guard" } }, who: "ma", say: "Ối... đầu ta... quay như chong chóng!", sub: "Ối… đầu ta quay như chong chóng!", sfx: [{ name: "laugh", at: 1.2, vol: 0.5 }] },
          // hiệp 4 — chiêu 5
          ...duel(4, "Ta chưa thua! Chưởng thứ tư: x trừ hai, tất cả lập phương!", "Chưởng 4: (x − 2)³ = ?", "(x − 2)^3 = ?", "bin",
            "Âm Dương Xen Kẽ! x lập phương, trừ sáu x bình phương, cộng mười hai x, trừ tám!", "(x − 2)³ = x³ − 6x² + 12x − 8",
            "(x − 2)^3 = x^3 − 6x^2 + 12x − 8", "BỊCH!"),
          // hiệp 5 — chiêu 7
          ...duel(5, "Chưởng thứ năm: phân tích x lập phương trừ tám!", "Chưởng 5: x³ − 8 = ?", "x^3 − 8 = ?", "na",
            "Trừ Nghịch Cộng! Bằng x trừ hai, nhân với x bình phương, cộng hai x, cộng bốn!", "x³ − 2³ = (x − 2)(x² + 2x + 4)",
            "x^3 − 2^3 = (x − 2)(x^2 + 2x + 4)", "CHÁT!"),
          // hiệp 6 — chiêu 6
          ...duel(6, "Chưởng thứ sáu: x lập phương cộng hai mươi bảy!", "Chưởng 6: x³ + 27 = ?", "x^3 + 27 = ?", "bin",
            "Cộng Nghịch Trừ! Bằng x cộng ba, nhân với x bình phương, trừ ba x, cộng chín!", "x³ + 3³ = (x + 3)(x² − 3x + 9)",
            "x^3 + 3^3 = (x + 3)(x^2 − 3x + 9)", "BỐP!"),
          // hiệp 7 — chiêu 2: Thầy Chung tung đòn kết liễu cùng hai đệ tử
          { who: "ma", say: "Chưởng cuối cùng! x cộng năm, tất cả bình phương... chắc chắn bằng x bình phương cộng hai mươi lăm!", sub: "Chưởng cuối: (x + 5)² = x² + 25 !!!", pose: "victory", face: "angry", show: atk("a7", "(x + 5)^2 = x^2 + 25"),
            move: { who: "ma", to: MAX, dur: 0.5, style: "walk" }, fx: [{ type: "aura", on: "ma", part: "chest", color: RED, dur: 3.0 }], sfx: [{ name: "boom", vol: 0.8 }, { name: "magic", at: 0.6 }], shake: { amp: 10, dur: 1.2 } },
          { who: "thay", say: "Lại quên hai A B! Thất Đẳng Hợp Nhất: x bình phương, cộng mười x, cộng hai mươi lăm!", sub: "(x + 5)² = x² + 10x + 25", pose: "guard", face: "angry",
            show: ctr("c7", "(x + 5)^2 = x^2 + 10x + 25", 0.6), act: { bin: { pose: "guard", face: "angry" }, na: { pose: "guard", face: "angry" } },
            fx: [{ type: "aura", on: "thay", part: "chest", color: GOLD, dur: 3.0 }, { type: "aura", on: "bin", part: "chest", color: GOLD, dur: 3.0, at: 0.3 }, { type: "aura", on: "na", part: "chest", color: GOLD, dur: 3.0, at: 0.6 }],
            sfx: [{ name: "magic2", vol: 0.7 }, { name: "kungfu", at: 1.0, vol: 0.6 }] },
          { act: { thay: { pose: "punch", snap: 0.09 }, bin: { pose: "punch", snap: 0.09 }, na: { pose: "punch", snap: 0.09 }, ma: { pose: "hit", delay: 0.45, snap: 0.07, face: "surprised" } },
            anim: [{ do: "move", id: "c7", x: MAX - 40, y: 560, scale: 0.35, dur: 0.45, sfx: false }, { do: "fadeout", id: "c7", at: 0.48, dur: 0.25, sfx: false }, { do: "move", id: "a7", y: -260, rot: -40, at: 0.45, dur: 0.6, sfx: false }],
            move: { who: "ma", to: MAX + 260, dur: 0.6, style: "slide" }, fx: [{ type: "speed", on: "bin", at: 0.05, dur: 0.4, dir: 1 }, { type: "hit", on: "ma", part: "chest", at: 0.45, text: "K.O!", color: GOLD, dur: 1.0 }],
            sfx: [{ name: "swish" }, { name: "punch", at: 0.45 }, { name: "ko", at: 0.6 }], shake: { at: 0.45, amp: 40, dur: 0.6 }, wait: 1.2, gap: 0 },
          { act: { ma: { pose: "lie", snap: 0.3, face: "sad" } }, fx: { type: "dust", on: "ma", part: "legs", dy: 110, dur: 0.9 }, sfx: [{ name: "fall" }, { name: "victory", at: 0.6, vol: 0.8 }], wait: 1.6, gap: 0 },
          { who: "bin", say: "Thắng rồi! Thất Đẳng Thần Công vô địch!", sub: "Thắng rồi! Thất Đẳng Thần Công vô địch!", pose: "victory", face: "happy", act: { na: { pose: "cheer", face: "happy" }, thay: { pose: "idle", face: "happy" } },
            fx: [{ type: "confetti", x: 600, y: 380, at: 0.3, dur: 2.0 }] },
          { act: { ma: { pose: "kneel", snap: 0.5, face: "sad" } }, who: "ma", say: "Hu hu... Thầy Chung ơi... cho ta học lại từ bài sáu được không?", sub: "Hu hu… cho ta học lại từ Bài 6 được không?", sfx: [{ name: "laugh", at: 2.4, vol: 0.6 }] },
          { who: "thay", say: "Được! Võ học không phân biệt thiện ác... chỉ phân biệt khai triển đúng hay sai! Về võ đường thôi!", sub: "Võ học chỉ phân biệt: khai triển ĐÚNG hay SAI!", pose: "give", face: "happy",
            move: { who: "thay", to: 1250, dur: 2.0, style: "walk" } }
        ] },

      // ================= 7. VÕ ĐƯỜNG: tổng kết bảy chiêu =================
      { bg: "manim", trans: "iris",
        cast: { thay: HIDE, bin: HIDE, na: HIDE, ma: HIDE, ke: HIDE },
        beats: [
          { who: "ke", say: "Và đây... là toàn bộ bí kíp Thất Đẳng Thần Công. Bảy hằng đẳng thức đáng nhớ.", sub: "Bí kíp: 7 hằng đẳng thức đáng nhớ",
            show: [{ id: "tt", type: "text", screen: true, text: "BÍ KÍP THẤT ĐẲNG · 7 HẰNG ĐẲNG THỨC ĐÁNG NHỚ", x: 960, y: 105, size: 64, color: GOLD, anim: "write", dur: 1.0, sfx: "shimmer", z: 3 },
              ...[["1", "A^2 − B^2 = (A − B)(A + B)", "#90caf9"], ["2", "(A + B)^2 = A^2 + 2AB + B^2", "#a5d6a7"], ["3", "(A − B)^2 = A^2 − 2AB + B^2", "#a5d6a7"],
                ["4", "(A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3", "#ffcc80"], ["5", "(A − B)^3 = A^3 − 3A^2B + 3AB^2 − B^3", "#ffcc80"],
                ["6", "A^3 + B^3 = (A + B)(A^2 − AB + B^2)", "#ce93d8"], ["7", "A^3 − B^3 = (A − B)(A^2 + AB + B^2)", "#ce93d8"]].map(([k, f, c], i) => (
                { id: "r" + k, type: "text", screen: true, text: `\\color{${GOLD}}{${k}.}  ${f}`, x: 300, y: 205 + i * 100, size: 68, color: c, align: "left", anim: "write", dur: 0.8, at: 0.8 + i * 0.7, sfx: i % 2 ? false : "marker", z: 3 }))],
            sfx: [{ name: "magic", vol: 0.6 }] },
          { who: "ke", say: "Bài sáu: ba chiêu bình phương. Bài bảy: hai chiêu lập phương của tổng và hiệu. Bài tám: tổng và hiệu hai lập phương.", sub: "Bài 6: chiêu 1–3 · Bài 7: 4–5 · Bài 8: 6–7",
            anim: [{ do: "indicate", id: "r1", at: 0.3, dur: 0.8 }, { do: "indicate", id: "r2", at: 0.8, dur: 0.8 }, { do: "indicate", id: "r3", at: 1.3, dur: 0.8 },
              { do: "indicate", id: "r4", at: 3.4, dur: 0.8 }, { do: "indicate", id: "r5", at: 3.9, dur: 0.8 }, { do: "indicate", id: "r6", at: 6.2, dur: 0.8 }, { do: "indicate", id: "r7", at: 6.7, dur: 0.8 }] },
          { who: "ke", say: "Mẹo nhớ: bình phương của tổng hay hiệu... luôn có hai A B. Lập phương... hệ số một, ba, ba, một. Tổng hay hiệu hai lập phương... dấu giữa ngoặc sau thì ngược lại.", sub: "Mẹo: 2AB · hệ số 1–3–3–1 · dấu giữa NGƯỢC",
            anim: [{ do: "circumscribe", id: "r2", at: 1.0, dur: 1.2 }, { do: "circumscribe", id: "r4", at: 4.4, dur: 1.2 }, { do: "circumscribe", id: "r6", at: 8.0, dur: 1.2 }], sfx: [{ name: "ding", at: 1.0 }, { name: "ding", at: 4.4 }, { name: "ding", at: 8.0 }] },
          { who: "ke", say: "Hãy chép bí kíp này vào vở... và luyện mỗi ngày nhé!", sub: "Chép bí kíp vào vở và luyện mỗi ngày!", wait: 4.0 },
          { anim: fade(["tt", "r1", "r2", "r3", "r4", "r5", "r6", "r7"]), wait: 0.5, gap: 0 },
          { title: { text: "Lớp Toán Thầy Chung", sub: "Âm thanh: TiengDong.com · Giọng: VieNeu-TTS", dur: 6.0, bgColor: "rgba(20,10,10,.94)", color: GOLD },
            sfx: [{ name: "bell", vol: 0.9 }, { name: "tada", at: 1.2, vol: 0.6 }] }
        ] }
    ]
  };
})();
