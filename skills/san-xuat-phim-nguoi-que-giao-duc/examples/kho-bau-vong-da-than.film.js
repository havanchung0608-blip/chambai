// PHIM HÀI PHIÊU LƯU: "KHO BÁU VÒNG ĐÁ THẦN" — Toán 9, Chương V, Bài 16. Vị trí tương đối của đường thẳng và đường tròn (KNTT)
// Có NGƯỜI KỂ CHUYỆN (giọng trầm, chậm, nhấn nhá) dẫn dắt; giọng đọc luôn to hơn tiếng động và nhạc.
// Cốt truyện (không vội vào bài):
//  1. Lớp học: Bin ngủ gật, chê "học đường tròn chẳng để làm gì" → Thầy Chung rút tấm bản đồ kho báu của ông cố.
//  2. Ra khơi: Bin say sóng; hải tặc Râu Xồm đu dây cướp bản đồ — nhưng thầy đã chụp ảnh bằng điện thoại! Đọc mật thư.
//  3. Lên đảo: xuyên rừng, quả rơi trúng đầu Bin; lên đồi thấy vòng đá thần… và Râu Xồm đang đào bừa.
//  4. Bản đồ (bài học): Râu Xồm đào 2 điểm của đường a → trúng 2 bẫy; chạy đường b mãi không chạm vòng đá;
//     nhóm thầy dùng THƯỚC đo d = OH, so sánh với R:  d < R cắt nhau · d > R không giao nhau · d = R tiếp xúc (tiếp tuyến)
//     → đào đúng tiếp điểm H được kho báu; mật thư: tiếp tuyến ⊥ bán kính tại tiếp điểm. Mỗi kết luận có THẺ GHI NHỚ chữ cực lớn.
//  5. Lớp học: Râu Xồm xin đi học; tổng kết, câu hỏi nhanh (Râu Xồm sai, Bin trả lời đúng), rương "Bài tập về nhà".
(function () {
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const NA = { name: "Na", role: "hoc-sinh", voice: "tre", hair: "ponytail", skirt: true, shirt: "#f06292", bow: "#ffeb3b", scale: 0.78 };
  const BIN = { name: "Bin", role: "hoc-sinh", voice: "tre", hair: "spiky", skirt: false, shirt: "#ff9800", hat: "cap", hatColor: "#e53935", scale: 0.8 };
  const RAU = { name: "Râu Xồm", role: "hai-tac", voice: "nam", shirt: "#37474f", hold: "sword", scale: 1.05 };
  const KE = { name: "", voice: "nam", hidden: true };                 // người kể chuyện (không hiện hình, phụ đề không ghi tên)
  const HIDE = { x: -3000, hidden: true };
  const BROWN = "#5d4037", BLUE = "#1565c0", RED = "#d32f2f", GOLD = "#ffd54f", GREEN = "#2e7d32";
  const ST = 0.5, SS = 0.42, SR = 0.6;                                 // tỉ lệ nhân vật trên bản đồ
  // ---- bản đồ nhìn từ trên xuống: 1 m = 50 px ----
  const O = [1320, 470], R = 250, U = 50, RX0 = 770;
  const YA = O[1] + 3 * U, YB = O[1] + 7 * U, YC = O[1] - 5 * U;      // đường a (d = 3), b (d = 7), c (d = 5)
  const AX = O[0] - 4 * U, BX = O[0] + 4 * U;                           // giao điểm A, B của a (AH = 4 m)
  const HA = [O[0], YA], HB = [O[0], YB], HC = [O[0], YC];
  const road = (id, y, name, at) => [
    { id: id + "_bd", type: "seg", x: 0, y: 0, x1: RX0, y1: y, x2: 1890, y2: y, color: "rgba(200,162,107,.85)", width: 36, anim: "create", dur: 0.8, at, sfx: "swish", z: -2 },
    { id, type: "seg", x: 0, y: 0, x1: RX0, y1: y, x2: 1890, y2: y, color: BROWN, width: 6, anim: "create", dur: 0.8, at, sfx: false, z: -1 },
    { id: id + "_lb", type: "text", text: name, x: 1862, y: y - 28, size: 80, color: BROWN, at: (at || 0) + 0.6, sfx: "pop" }];
  const stones = Array.from({ length: 16 }, (_, k) => ({ id: "st" + k, type: "dot", x: O[0] + R * Math.cos(k * Math.PI / 8), y: O[1] + R * Math.sin(k * Math.PI / 8), r: 14, color: "#795548", at: 1.4 + k * 0.06, sfx: k % 4 ? false : "pop", z: 1 }));
  const rmark = (id, H, up) => ({ id, type: "poly", points: [[H[0] + 26, H[1]], [H[0] + 26, H[1] + (up ? 26 : -26)], [H[0], H[1] + (up ? 26 : -26)]], close: false, color: BLUE, width: 5, sfx: false });

  // ---- BẢNG MANIM gắn màn hình (trái), chữ lớn ----
  const PX = 385, PY = 400, LX = 70, LY = [300, 425, 550, 665];
  const panel = (title) => ({ id: "pn", type: "panel", screen: true, x: PX, y: PY, w: 700, h: 600, title, titleColor: GOLD, size: 64, anim: "fadein", dur: 0.5, sfx: "shimmer", z: 0 });
  const line = (k, text, color, at, size, pre) => ({ id: (pre || "l") + k, type: "text", screen: true, text, x: LX, y: LY[k - 1], size: size || 72, align: "left", color: color || "#f5f5ec", anim: "write", dur: 0.7, sfx: "marker", at: at || 0, z: 1 });
  const clearLines = (ids) => (ids || ["l1", "l2", "l3", "l4"]).map((id) => ({ do: "fadeout", id, dur: 0.35, sfx: false }));
  // ---- THẺ GHI NHỚ: chữ cực lớn giữa màn hình ----
  const card = (id, big, small, color) => ({
    show: [{ id: id + "p", type: "panel", screen: true, x: 960, y: 470, w: 1700, h: 520, color: "rgba(10,24,18,.95)", border: color, title: "★ GHI NHỚ", titleColor: color, size: 66, anim: "grow", dur: 0.5, sfx: "magic", z: 8 },
      { id: id + "1", type: "text", screen: true, text: big, x: 960, y: 480, size: 120, color, align: "center", anim: "write", dur: 0.9, at: 0.4, sfx: "marker", z: 9 },
      { id: id + "2", type: "text", screen: true, text: small, x: 960, y: 640, size: 88, color: "#f5f5ec", align: "center", anim: "write", dur: 0.8, at: 1.4, sfx: false, z: 9 }],
    anim: { do: "circumscribe", id: id + "1", at: 2.4, dur: 1.2 }, sfx: [{ name: "ding", at: 1.3 }, { name: "tada", at: 2.4, vol: 0.5 }] });
  const uncard = (id) => ({ hide: [id + "p", id + "1", id + "2"], wait: 0.3, gap: 0 });

  // ---- THƯỚC ĐO d = OH (vạch chia theo mét) ----
  const ang = (A, B) => Math.atan2(B[1] - A[1], B[0] - A[0]) * 180 / Math.PI;
  const measure = (key, H, from, sayDraw, up) => [
    { show: { id: "ru", type: "ruler", w: 400, unit: U, unitText: "m", x: from[0], y: from[1], rot: ang(O, H) - 720, scale: 0.3, pop: false, sfx: false, z: 5 },
      anim: { do: "move", id: "ru", x: O[0], y: O[1], rot: ang(O, H), scale: 1, dur: 0.9, sfx: false }, act: { thay: { pose: "give" } },
      sfx: [{ name: "swish" }, { name: "whoosh", at: 0.15 }, { name: "click", at: 0.9 }, { name: "click", at: 0.97 }], shake: { at: 0.9, amp: 6, dur: 0.15 }, wait: 0.2, gap: 0 },
    Object.assign({ show: [{ id: "pc", type: "pencil", x: O[0], y: O[1], lead: "#3e2723", color: "#ffca28", z: 6, pop: false, sfx: false },
        { id: "d" + key, type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: H[0], y2: H[1], color: BLUE, width: 7, dash: true, anim: "create", dur: 1.2, sfx: "chalk" }],
      anim: { do: "move", id: "pc", x: H[0], y: H[1], dur: 1.2, sfx: false }, act: { thay: { pose: "point" } }, gap: 0 }, sayDraw),
    { anim: [{ do: "move", id: "ru", x: 2500, y: -300, rot: 540, scale: 0.4, dur: 0.7, sfx: false }, { do: "fadeout", id: "pc", dur: 0.3, sfx: false }],
      show: [rmark("m" + key, H, up), { id: "h" + key, type: "dot", x: H[0], y: H[1], r: 12, color: BLUE, label: "H", labelSide: "left", size: 72, sfx: "pop" },
        { id: "t" + key, type: "text", text: `d = ${{ a: 3, b: 7, c: 5 }[key]} m`, x: O[0] + 24, y: (O[1] + H[1]) / 2 + 22, size: 66, align: "left", color: BLUE, anim: "write", dur: 0.5, sfx: false }],
      sfx: [{ name: "whoosh" }], wait: 0.4, gap: 0 },
    { hide: ["pc", "ru"], wait: 0.05, gap: 0 }
  ];
  const unmeasure = (key) => ["d", "m", "h", "t"].map((p) => ({ do: "fadeout", id: p + key, dur: 0.4, sfx: false }));
  const bang = (text, x, y, color, at) => ({ type: "hit", x, y, dur: 0.7, text, color: color || "#ff7043", at: at || 0 });
  const QZ = { q: "(O; 6 cm), khoảng cách từ O đến m bằng 6 cm", options: ["Cắt nhau", "Tiếp xúc", "Không giao nhau", "Không xác định được"] };
  const BOAT_X = 820, DECK = 830;

  window.FILM = {
    title: "Kho báu vòng đá thần",
    subtitle: "Toán 9 · Bài 16. Vị trí tương đối của đường thẳng và đường tròn",
    file: "kho-bau-vong-da-than",
    watermark: "Thầy Hà Văn Chung",
    music: "intro",
    subSize: 84,
    cast: { thay: TEACHER, na: NA, bin: BIN, rau: RAU, ke: KE },
    scenes: [
      // ================= 1. LỚP HỌC: Bin ngủ gật, tấm bản đồ bí ẩn =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 330, pose: "explain", face: "happy" }, na: { x: 1330, pose: "sit", face: "happy", flip: true }, bin: { x: 1580, pose: "sit", face: "happyclosed", flip: true }, rau: HIDE, ke: HIDE },
        beats: [
          { title: { text: "KHO BÁU VÒNG ĐÁ THẦN", sub: "Phim hoạt hình người que · Toán 9", dur: 3.2, bgColor: "rgba(62,39,35,.92)", color: GOLD }, sfx: [{ name: "boom", vol: 0.8 }, { name: "mystery", at: 0.4, vol: 0.7 }] },
          { who: "ke", say: "Chiều thứ Sáu... lớp chín A. Nắng vàng, gió mát... và có một bạn học sinh... đang ngủ rất say!", sub: "Chiều thứ Sáu… có bạn đang ngủ rất say!",
            cam: { x: 1500, y: 720, zoom: 1.6, dur: 2.5 }, act: { bin: { pose: "sit", face: "happyclosed" } }, emote: { who: "bin", icon: "Zzz" } },
          { who: "bin", say: "Khò... khò... khò...", sub: "Khò… khò… khò…", pose: "sit", face: "happyclosed", emote: { who: "bin", icon: "Zzz" } },
          { act: { thay: { pose: "hold", hold: "bell" } }, move: { who: "thay", to: 1430, dur: 1.6, style: "walk" }, cam: { x: 960, y: 540, zoom: 1, dur: 0.6 }, sfx: [{ name: "tension", at: 0.2, vol: 0.4 }], gap: 0 },
          { sfx: [{ name: "bell", vol: 1 }, { name: "surprise", at: 0.15 }], act: { bin: { pose: "surprised", face: "surprised", snap: 0.08 }, thay: { pose: "cheer" } },
            move: { who: "bin", by: 0, dur: 0.9, style: "jump", height: 260, spin: 360 }, fx: [bang("RENG!", 1430, 520, GOLD)], shake: { amp: 14, dur: 0.3 }, wait: 0.6, gap: 0 },
          { who: "bin", say: "Em không ngủ! Em đang... suy nghĩ về đường tròn ạ!", sub: "Em không ngủ! Em đang suy nghĩ ạ!", pose: "shrug", face: "worried", act: { na: { pose: "clap", face: "happy" } }, sfx: [{ name: "laugh", at: 2.0, vol: 0.6 }] },
          { who: "thay", say: "Thế à? Thế em nghĩ ra gì rồi?", sub: "Thế em nghĩ ra gì rồi?", pose: "ask", face: "happy", hold: null },
          { who: "bin", say: "Em nghĩ... học đường tròn chẳng để làm gì! Có tìm được kho báu đâu ạ!", sub: "Học đường tròn chẳng để làm gì!", pose: "ask", face: "happy" },
          { act: { thay: { pose: "think", face: "thinking" } }, cam: { x: 330, y: 650, zoom: 2.0, dur: 0.3 }, sfx: [{ name: "mystery", vol: 0.8 }], wait: 1.4, gap: 0 },
          { who: "thay", say: "Ai bảo thế? Đây là bản đồ kho báu của ông cố thầy, thuyền trưởng Chung Râu Bạc!", sub: "Bản đồ kho báu của ông cố!", pose: "hold", face: "happy", hold: "map",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.5 }, fx: [{ type: "hit", on: "thay", part: "hand", dur: 0.6, color: GOLD }], sfx: [{ name: "magic" }] },
          { who: "na", say: "Oaaa! Bản đồ kho báu thật ạ?", sub: "Oaaa! Bản đồ kho báu thật ạ?", pose: "surprised", face: "surprised", act: { bin: { pose: "surprised", face: "surprised" } }, sfx: [{ name: "wow", vol: 0.8 }] },
          { who: "thay", say: "Cuối tuần này cả đội ra đảo! Ai không hiểu đường tròn thì... ở nhà trông lớp!", sub: "Không hiểu bài thì ở nhà trông lớp!", pose: "pointup", face: "happy" },
          { who: "bin", say: "Em hiểu! Em hiểu hết rồi mà thầy!", sub: "Em hiểu! Em hiểu hết rồi!", pose: "cheer", face: "happy",
            move: [{ who: "bin", by: 0, dur: 1.0, style: "jump", height: 260, spin: 360 }, { who: "na", by: 0, dur: 1.0, style: "jump", height: 200, spin: -360 }], sfx: [{ name: "laugh", at: 1.2, vol: 0.5 }] }
        ] },

      // ================= 2. RA KHƠI: say sóng, hải tặc Râu Xồm cướp bản đồ =================
      { bg: "beach", trans: "flash",
        cast: { thay: { x: BOAT_X - 1400, y: DECK, pose: "idle", face: "happy", hold: "map" }, na: { x: BOAT_X - 1560, y: DECK, pose: "idle", face: "happy" }, bin: { x: BOAT_X - 1250, y: DECK, pose: "idle", face: "happy" },
          rau: { x: 2400, y: -300, pose: "idle", face: "angry" }, ke: HIDE },
        items: [{ id: "boat", type: "boat", x: BOAT_X - 1400, y: DECK, logo: "∅", z: -1 }],
        beats: [
          { who: "ke", say: "Sáng thứ Bảy, con thuyền nhỏ rẽ sóng ra khơi. Không ai biết rằng... nguy hiểm đang rình rập!", sub: "Sáng thứ Bảy, con thuyền nhỏ ra khơi…",
            tween: [{ id: "boat", x: BOAT_X, dur: 3.0 }, { id: "thay", x: BOAT_X - 90, dur: 3.0 }, { id: "na", x: BOAT_X - 240, dur: 3.0 }, { id: "bin", x: BOAT_X + 170, dur: 3.0 }], sfx: [{ name: "whoosh", at: 0.5 }] },
          { who: "thay", say: "Gió thuận, biển êm! Thẳng tiến... đảo kho báu!", sub: "Thẳng tiến đảo kho báu!", pose: "pointup", face: "happy" },
          { who: "bin", say: "Thầy ơi... sóng... em say sóng quá...", sub: "Thầy ơi… em say sóng quá…", pose: "dizzy", face: "sad", emote: { who: "bin", icon: "@_@" }, act: { na: { pose: "clap" } }, sfx: [{ name: "boing", at: 0.8 }] },
          { who: "na", say: "Bin ơi, thuyền mới chạy được hai phút thôi mà!", sub: "Thuyền mới chạy được hai phút thôi mà!", pose: "facepalm", face: "happy", sfx: [{ name: "laugh", at: 2.2, vol: 0.6 }] },
          { who: "ke", say: "Bỗng nhiên... một bóng đen lao xuống từ trên trời!", sub: "Bỗng nhiên… một bóng đen lao xuống!", sfx: [{ name: "tension", vol: 0.6 }], cam: { x: BOAT_X + 200, y: 600, zoom: 1.25, dur: 1.2 } },
          { sfx: [{ name: "whoosh", at: 0.6 }], move: { who: "rau", to: BOAT_X + 330, y: DECK, dur: 1.4, style: "jump", height: 160, spin: -360 }, act: { thay: { pose: "surprised", face: "surprised" }, na: { pose: "surprised", face: "surprised" }, bin: { pose: "surprised", face: "surprised" } },
            fx: [{ type: "dust", x: BOAT_X + 330, y: DECK, at: 1.2, dur: 0.6 }], shake: { at: 1.2, amp: 16, dur: 0.3 }, gap: 0 },
          { who: "rau", say: "Ha ha ha! Ta là Râu Xồm... hải tặc đáng sợ nhất vùng biển này!", sub: "Ha ha ha! Ta là Râu Xồm!", pose: "victory", face: "angry", flip: true, sfx: [{ name: "kungfu", vol: 0.6 }] },
          { who: "rau", say: "Bản đồ kho báu... là của ta!", sub: "Bản đồ kho báu là của ta!", pose: "punch", face: "angry",
            act: { thay: { hold: null, pose: "surprised" }, rau: { hold2: "map" } }, fx: [bang("VỤT!", BOAT_X + 100, 600, GOLD)], sfx: [{ name: "swish" }, { name: "slap", at: 0.2 }] },
          { move: { who: "rau", to: 2500, y: -300, dur: 1.4, style: "jump", height: 200, spin: 720 }, sfx: [{ name: "whoosh" }, { name: "laugh", at: 0.3, vol: 0.4 }], cam: { x: 960, y: 540, zoom: 1, dur: 1.0 }, gap: 0 },
          { who: "bin", say: "Hết rồi! Mất bản đồ rồi! Huhuhu!", sub: "Mất bản đồ rồi! Huhuhu!", pose: "sad", face: "sad" },
          { who: "thay", say: "Bình tĩnh! Thầy... đã chụp ảnh bản đồ bằng điện thoại rồi!", sub: "Thầy đã chụp ảnh bản đồ rồi!", pose: "hold", face: "happy", hold: "phone", emote: { who: "thay", icon: "!" }, sfx: [{ name: "ding" }] },
          { who: "na", say: "Thầy đỉnh quá!", sub: "Thầy đỉnh quá!", pose: "cheer", face: "happy", act: { bin: { pose: "cheer", face: "happy" } }, sfx: [{ name: "applause", vol: 0.5 }] },
          { who: "thay", say: "Mật thư ghi: kho báu nằm ở nơi con đường... chạm vòng đá thần... tại đúng MỘT điểm!", sub: "Chạm tại ĐÚNG MỘT điểm!", pose: "hold", face: "thinking", bubble: false,
            show: [{ id: "rd", type: "panel", screen: true, x: 960, y: 300, w: 1700, h: 400, color: "rgba(62,39,35,.94)", border: GOLD, title: "MẬT THƯ", titleColor: GOLD, size: 64, anim: "grow", dur: 0.5, sfx: "magic", z: 5 },
              { id: "rd1", type: "text", screen: true, text: "Kho báu nằm nơi con đường", x: 960, y: 300, size: 92, color: "#fff8e1", align: "center", anim: "write", dur: 0.9, at: 0.4, sfx: false, z: 6 },
              { id: "rd2", type: "text", screen: true, text: "chạm vòng đá tại ĐÚNG MỘT điểm", x: 960, y: 420, size: 92, color: GOLD, align: "center", anim: "write", dur: 0.9, at: 1.4, sfx: false, z: 6 }],
            anim: { do: "circumscribe", id: "rd2", at: 3.0, dur: 1.2 } },
          { who: "bin", say: "Dễ ợt! Con đường nào chạm vòng đá... là em đào!", sub: "Dễ ợt! Chạm là đào!", pose: "cheer", face: "happy", bubble: false },
          { who: "na", say: "Khoan đã Bin! Phải đúng MỘT điểm cơ mà!", sub: "Khoan! Phải ĐÚNG MỘT điểm!", pose: "pointup", face: "thinking", bubble: false, anim: { do: "indicate", id: "rd2", dur: 1.0 } },
          { hide: ["rd", "rd1", "rd2"], tween: [{ id: "boat", x: 2800, dur: 2.0 }, { id: "thay", x: 2710, dur: 2.0 }, { id: "na", x: 2560, dur: 2.0 }, { id: "bin", x: 2970, dur: 2.0 }], sfx: [{ name: "whoosh", at: 0.3 }], gap: 0 }
        ] },

      // ================= 3. LÊN ĐẢO: xuyên rừng =================
      { bg: "forest", trans: "flash",
        cast: { thay: { x: -200, pose: "idle", face: "happy", hold: "phone" }, na: { x: -380, pose: "idle", face: "happy" }, bin: { x: -540, pose: "idle", face: "happy", hold: "shovel" }, rau: HIDE, ke: HIDE },
        beats: [
          { who: "ke", say: "Sau nửa ngày lênh đênh, cả đội đặt chân lên hòn đảo bí ẩn. Rừng rậm âm u... tiếng chim kêu... rờn rợn.", sub: "Cả đội đặt chân lên hòn đảo bí ẩn…",
            move: [{ who: "thay", to: 900, dur: 4.0, style: "walk" }, { who: "na", to: 700, dur: 4.0, style: "walk" }, { who: "bin", to: 520, dur: 4.0, style: "walk" }], sfx: [{ name: "mystery", vol: 0.5 }] },
          { who: "bin", say: "Đói quá... giá mà có quả gì rơi xuống nhỉ...", sub: "Đói quá… giá mà có quả rơi xuống…", pose: "think", face: "happy" },
          { show: { id: "ap", type: "apple", x: 520, y: 120, scale: 0.8 }, anim: { do: "move", id: "ap", y: 640, dur: 0.5, sfx: false }, sfx: [{ name: "whoosh", vol: 0.5 }], gap: 0, wait: 0.1 },
          { fx: [bang("CỐC!", 520, 600, GOLD)], act: { bin: { pose: "dizzy", face: "surprised" } }, anim: { do: "move", id: "ap", x: 700, y: 960, dur: 0.6, sfx: false }, shake: { amp: 10, dur: 0.25 },
            sfx: [{ name: "punch" }, { name: "boing", at: 0.2 }], emote: { who: "bin", icon: "★" }, wait: 0.8, gap: 0 },
          { who: "bin", say: "Ui da! Em nói đùa thôi mà!", sub: "Ui da! Em nói đùa thôi mà!", pose: "dizzy", face: "sad", act: { na: { pose: "clap", face: "happy" }, thay: { pose: "cheer" } }, sfx: [{ name: "laugh", at: 1.0, vol: 0.6 }] },
          { who: "thay", say: "Lên đỉnh đồi kia nhìn xuống toàn cảnh nào!", sub: "Lên đỉnh đồi nhìn xuống nào!", pose: "pointup", hide: "ap" },
          { move: [{ who: "thay", to: 1450, dur: 1.8, style: "run" }, { who: "na", to: 1300, dur: 1.9, style: "run" }, { who: "bin", to: 1150, dur: 2.0, style: "run" }], sfx: [{ name: "whoosh", at: 0.5 }], gap: 0 },
          { who: "na", say: "Nhìn kìa! Vòng đá thần! Và... Râu Xồm đang đào!", sub: "Vòng đá thần! Và… Râu Xồm đang đào!", pose: "point", face: "surprised", act: { bin: { pose: "surprised", face: "surprised" } },
            cam: { x: 1500, y: 600, zoom: 1.3, dur: 0.6 }, sfx: [{ name: "surprise" }] }
        ] },

      // ================= 4. BẢN ĐỒ NHÌN TỪ TRÊN XUỐNG: bài học =================
      { bg: "treasuremap", trans: "flash",
        cast: { thay: { x: 850, y: YB, pose: "idle", face: "happy", scale: ST, hold: "phone" }, na: { x: 960, y: YB, pose: "idle", face: "happy", scale: SS }, bin: { x: 1060, y: YB, pose: "idle", face: "happy", scale: SS, hold: "shovel" },
          rau: { x: AX - 60, y: YA, pose: "idle", face: "angry", scale: SR, hold: "shovel" }, ke: HIDE },
        beats: [
          { who: "ke", say: "Từ trên đỉnh đồi nhìn xuống... cả hòn đảo hiện ra như một tấm bản đồ khổng lồ.", sub: "Hòn đảo hiện ra như tấm bản đồ khổng lồ",
            show: [{ id: "C", type: "circ", x: O[0], y: O[1], r: R, color: BROWN, width: 8, anim: "create", dur: 1.3, sfx: "shimmer" }, ...stones] },
          { who: "thay", say: "Vòng đá thần là một đường tròn tâm ô, bán kính e rờ bằng năm mét.", sub: "Vòng đá: đường tròn (O; 5 m)", bubble: false, pose: "point",
            show: [{ id: "O", type: "dot", x: O[0], y: O[1], r: 13, color: "#3e2723", label: "O", labelSide: "left", size: 76 },
              { id: "rad", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: O[0] + R, y2: O[1], color: RED, width: 6, anim: "create", dur: 0.6, at: 1.4, sfx: "swish2" },
              { id: "radl", type: "text", text: "R = 5 m", x: O[0] + R / 2 + 10, y: O[1] - 22, size: 66, color: RED, at: 2.0, sfx: "pop" }] },
          { who: "bin", say: "Có ba con đường a, bê, xê. Râu Xồm đang đào ở đường a!", sub: "Ba con đường a, b, c!", bubble: false, pose: "point",
            show: [...road("ra", YA, "a", 0), ...road("rb", YB, "b", 0.6), ...road("rc", YC, "c", 1.2)] },
          // Râu Xồm đào bừa: 2 điểm của đường a → 2 bẫy
          { who: "rau", say: "Đường a chạm vòng đá đây rồi! Đào thôi!", sub: "Đường a chạm vòng đá! Đào thôi!", bubble: false, pose: "dig", face: "angry",
            show: { id: "A", type: "dot", x: AX, y: YA, r: 14, color: RED, label: "A", labelSide: "left", size: 72, at: 1.0 },
            fx: [{ type: "dust", x: AX, y: YA, dur: 0.6 }, { type: "dust", x: AX, y: YA, at: 0.7, dur: 0.6 }], sfx: [{ name: "punch", vol: 0.5 }, { name: "punch2", at: 0.6, vol: 0.5 }, { name: "punch", at: 1.2, vol: 0.5 }] },
          { fx: [bang("BÙM!", AX, YA - 90), { type: "dust", x: AX, y: YA, dur: 0.9 }], shake: { amp: 26, dur: 0.45 }, act: { rau: { face: "surprised" } },
            move: { who: "rau", to: BX + 50, dur: 1.4, style: "jump", height: 380, spin: 1080 }, sfx: [{ name: "boom" }, { name: "fall", at: 1.3 }, { name: "boing", at: 1.4 }], gap: 0 },
          { who: "rau", say: "Á à! Bẫy! Không sao... ở đây cũng chạm vòng đá!", sub: "Á à! Bẫy! Đào chỗ này vậy!", bubble: false, pose: "dig", face: "angry", flip: true,
            show: { id: "B", type: "dot", x: BX, y: YA, r: 14, color: RED, label: "B", size: 72, at: 0.6 }, fx: [{ type: "dust", x: BX, y: YA, dur: 0.6 }], sfx: [{ name: "punch2", vol: 0.5 }, { name: "punch", at: 0.6, vol: 0.5 }] },
          { show: { id: "ch1", type: "chest", x: BX + 4, y: YA + 2, scale: 0.5, empty: true, anim: "grow", dur: 0.5, sfx: "pop", z: 2 }, tween: { id: "ch1", open: 1, dur: 0.4 }, wait: 0.4, gap: 0 },
          { fx: [bang("BỐP!", BX + 20, YA - 110, GOLD)], act: { rau: { pose: "lie", face: "worried", snap: 0.08 } }, move: { who: "rau", by: 90, dur: 0.5, style: "slide" }, shake: { amp: 20, dur: 0.35 },
            show: { id: "q1", type: "question", x: BX + 4, y: YA - 90, scale: 0.6 }, emote: { who: "rau", icon: "★" },
            sfx: [{ name: "animepunch" }, { name: "ko", at: 0.2, vol: 0.8 }, { name: "laugh", at: 0.8, vol: 0.7 }], wait: 1.2, gap: 0 },
          { who: "ke", say: "Hai lần đào... hai lần trúng bẫy! Râu Xồm đã sai ở đâu?", sub: "Hai lần đào, hai lần trúng bẫy! Sai ở đâu?", bubble: false },
          { who: "bin", say: "Hắn đào đúng chỗ chạm vòng đá, mà vẫn trúng bẫy! Sao lạ vậy thầy?", sub: "Đào đúng chỗ chạm mà vẫn trúng bẫy?", bubble: false, pose: "ask", face: "happy" },
          { who: "thay", say: "Vì đường a chạm vòng đá tại HAI điểm: a và bê! Muốn biết chắc, ta đo khoảng cách đê từ tâm ô đến con đường... rồi so với e rờ.", sub: "Đo d = OH rồi so sánh với R", bubble: false, pose: "pointup",
            emote: { who: "thay", icon: "!" }, show: [panel("BÍ QUYẾT"), line(1, "d = OH", "#f5f5ec", 1.0), line(2, "(OH \\perp đường)", "#b3e5fc", 1.8, 64), line(3, "So sánh d với R", GOLD, 3.0)],
            anim: [{ do: "flash", id: "A", at: 0.8, dur: 0.6, sfx: "ding" }, { do: "flash", id: "B", at: 1.3, dur: 0.6, sfx: "ding" }] },

          // ---------- ĐƯỜNG a: d < R ----------
          { anim: clearLines(), set: { id: "pn", title: "Đường a" }, wait: 0.3, gap: 0 },
          ...measure("a", HA, [850, YB - 110], { who: "thay", say: "Thầy đặt thước vuông góc với đường a. Đường a cách tâm ô... ba mét.", sub: "Đường a: d = OH = 3 m", bubble: false }),
          { who: "na", say: "Ba nhỏ hơn năm, nên đê nhỏ hơn e rờ!", sub: "3 < 5 nên d < R", bubble: false, pose: "pointup", show: [line(1, "d = 3 m", "#f5f5ec"), line(2, "R = 5 m", "#ef9a9a", 0.5), line(3, "d < R", GOLD, 1.2, 84)] },
          Object.assign(card("ka", "d < R  ⇒  CẮT NHAU", "Có 2 điểm chung (A và B)", "#ff8a80"),
            { who: "thay", say: "Ghi nhớ nhé! Đê nhỏ hơn e rờ... thì đường thẳng và đường tròn CẮT NHAU, có HAI điểm chung!", sub: "d < R ⇒ cắt nhau, 2 điểm chung", bubble: false, pose: "explain" }),
          uncard("ka"),
          // tính dây AB (Pythagore trong tam giác OHA vuông tại H)
          { who: "na", say: "Thầy ơi, hai cái bẫy cách nhau bao xa ạ?", sub: "Hai bẫy cách nhau bao xa ạ?", bubble: false, pose: "ask", anim: clearLines(), set: { id: "pn", title: "Tính AB" } },
          { who: "thay", say: "Tam giác ô a bê cân tại ô, nên đường cao ô hát cũng là trung tuyến. Trong tam giác vuông ô hát a: a hát bằng căn của ô a bình phương, trừ ô hát bình phương.", sub: "AH = √(OA² − OH²)", bubble: false, pose: "explain",
            show: [{ id: "OA", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: AX, y2: YA, color: GREEN, width: 6, anim: "create", dur: 0.7, at: 0.6 },
              { id: "OB", type: "seg", x: 0, y: 0, x1: O[0], y1: O[1], x2: BX, y2: YA, color: GREEN, width: 6, anim: "create", dur: 0.7, at: 1.1 },
              line(1, "AH = \\sqrt{OA^2 - OH^2}", "#f5f5ec", 3.0, 66, "k")] },
          { who: "na", say: "Bằng căn của năm bình phương trừ ba bình phương... bằng bốn mét. Vậy a bê bằng tám mét!", sub: "AH = √(5² − 3²) = 4 m ⇒ AB = 8 m", bubble: false, pose: "explain",
            show: [line(2, "= \\sqrt{5^2 - 3^2} = 4", "#f5f5ec", 0.2, 66, "k"), line(3, "AB = 2·AH = 8 m", GOLD, 2.6, 72, "k")], anim: { do: "circumscribe", id: "k3", at: 3.6, dur: 1.0 } },
          { who: "rau", say: "Tám mét... thảo nào ta bay xa thế...", sub: "Tám mét… thảo nào ta bay xa thế…", bubble: false, pose: "dizzy", face: "sad",
            anim: [...clearLines(["k1", "k2", "k3"]), { do: "fadeout", id: "OA", dur: 0.4, sfx: false }, { do: "fadeout", id: "OB", dur: 0.4, sfx: false }, { do: "fadeout", id: "ch1", dur: 0.4, sfx: false }, { do: "fadeout", id: "q1", dur: 0.4, sfx: false }],
            sfx: [{ name: "laugh", at: 1.6, vol: 0.6 }] },

          // ---------- ĐƯỜNG b: d > R — Râu Xồm chạy mãi ----------
          { who: "rau", say: "Hừ! Ta sẽ chạy theo đường bê... vào vòng đá trước!", sub: "Ta chạy đường b vào trước!", bubble: false, pose: "guard", face: "angry", set: { id: "pn", title: "Đường b" }, anim: unmeasure("a"),
            move: [{ who: "rau", to: 800, y: YB, dur: 1.2, style: "jump", height: 200 }, { who: "thay", to: 900, y: YA, dur: 1.0, style: "jump", height: 160 }, { who: "na", to: 1000, y: YA, dur: 1.0, style: "jump", height: 160 }, { who: "bin", to: 1090, y: YA, dur: 1.0, style: "jump", height: 160 }] },
          { move: { who: "rau", to: 1860, y: YB, dur: 3.2, style: "run" }, act: { rau: { face: "angry" } }, fx: { type: "speed", on: "rau", dir: 1, dur: 3.0 }, sfx: [{ name: "action", vol: 0.5 }], gap: 0 },
          { who: "rau", say: "Ơ? Chạy hết đường rồi... mà chẳng chạm viên đá nào!", sub: "Chẳng chạm viên đá nào!", bubble: false, pose: "tired", face: "worried", flip: true, emote: { who: "rau", icon: "?" }, sfx: [{ name: "fail", at: 1.8, vol: 0.7 }] },
          ...measure("b", HB, [900, YA - 110], { who: "thay", say: "Đo nhé: đường bê cách tâm ô... bảy mét.", sub: "Đường b: d = OH = 7 m", bubble: false }),
          { who: "bin", say: "Bảy lớn hơn năm! Đê lớn hơn e rờ!", sub: "7 > 5 nên d > R", bubble: false, pose: "cheer", show: [line(1, "d = 7 m", "#f5f5ec"), line(2, "R = 5 m", "#ef9a9a", 0.5), line(3, "d > R", GOLD, 1.2, 84)] },
          Object.assign(card("kb", "d > R  ⇒  KHÔNG GIAO NHAU", "Không có điểm chung nào", "#81d4fa"),
            { who: "thay", say: "Ghi nhớ! Đê lớn hơn e rờ... thì đường thẳng và đường tròn KHÔNG GIAO NHAU, không có điểm chung nào!", sub: "d > R ⇒ không giao nhau", bubble: false, pose: "explain" }),
          uncard("kb"),

          // ---------- ĐƯỜNG c: d = R ----------
          { anim: [...clearLines(), ...unmeasure("b")], set: { id: "pn", title: "Đường c" }, wait: 0.3, gap: 0 },
          ...measure("c", HC, [900, YA - 110], { who: "thay", say: "Còn đường xê... cách tâm ô bao nhiêu nào?", sub: "Đường c: d = OH = ?", bubble: false }, true),
          { who: "na", say: "Đúng năm mét... bằng e rờ!", sub: "d = 5 m = R!", bubble: false, pose: "pointup", face: "happy", show: [line(1, "d = 5 m", "#f5f5ec"), line(2, "R = 5 m", "#ef9a9a", 0.5), line(3, "d = R", GOLD, 1.2, 84)], sfx: [{ name: "wow", vol: 0.6 }] },
          Object.assign(card("kc", "d = R  ⇒  TIẾP XÚC", "1 điểm chung H · c là tiếp tuyến", "#a5d6a7"),
            { who: "thay", say: "Ghi nhớ! Đê bằng e rờ... thì đường thẳng TIẾP XÚC với đường tròn, có đúng MỘT điểm chung là hát. Đường xê là tiếp tuyến, hát là tiếp điểm!", sub: "d = R ⇒ tiếp xúc, c là tiếp tuyến", bubble: false, pose: "explain" }),
          uncard("kc"),
          { who: "bin", say: "Đúng MỘT điểm! Kho báu... ở điểm hát!", sub: "Đúng MỘT điểm! Kho báu ở H!", bubble: false, pose: "cheer", face: "happy",
            move: [{ who: "thay", to: HC[0] - 70, y: YC, dur: 1.3, style: "jump", height: 260, spin: 360 }, { who: "na", to: HC[0] + 150, y: YC, dur: 1.4, style: "jump", height: 240, spin: -360 }, { who: "bin", to: HC[0] + 240, y: YC, dur: 1.5, style: "jump", height: 280, spin: 360 }],
            act: { thay: { hold: "shovel" } }, sfx: [{ name: "swish" }, { name: "swish2", at: 0.2 }, { name: "land", at: 1.3 }] },
          { who: "ke", say: "Thời khắc quyết định đã tới... Một nhát xẻng... hai nhát xẻng... ba nhát xẻng!", sub: "Một nhát xẻng… hai nhát… ba nhát…", bubble: false,
            act: { thay: { pose: "dig", flip: false }, na: { flip: true, pose: "cheer" }, bin: { flip: true, pose: "cheer" } }, cam: { x: HC[0], y: YC + 40, zoom: 1.6, dur: 0.8 },
            fx: [{ type: "dust", x: HC[0], y: YC, at: 1.8, dur: 0.6 }, { type: "dust", x: HC[0], y: YC, at: 3.0, dur: 0.6 }, { type: "dust", x: HC[0], y: YC, at: 4.2, dur: 0.6 }],
            sfx: [{ name: "tension", vol: 0.5 }, { name: "punch", at: 1.8, vol: 0.5 }, { name: "punch2", at: 3.0, vol: 0.5 }, { name: "punch", at: 4.2, vol: 0.5 }] },
          { show: { id: "chest", type: "chest", x: HC[0] + 6, y: YC + 4, scale: 0.6, anim: "grow", dur: 0.7, sfx: "magic", z: 2 }, act: { thay: { pose: "surprised", face: "surprised" } },
            fx: [{ type: "hit", x: HC[0], y: YC - 40, dur: 0.6, color: GOLD }], shake: { amp: 12, dur: 0.3 }, sfx: [{ name: "boom", vol: 0.6 }], wait: 0.6, gap: 0 },
          { tween: { id: "chest", open: 1, dur: 0.8 }, act: { thay: { pose: "victory", face: "happy" }, na: { pose: "cheer" }, bin: { pose: "cheer" } },
            fx: [{ type: "confetti", x: HC[0], y: YC - 60, at: 0.4, dur: 2.0 }, bang("KHO BÁU!", HC[0], YC - 170, GOLD, 0.5)],
            sfx: [{ name: "click" }, { name: "victory", at: 0.4 }, { name: "crowd", at: 0.5, vol: 0.5, len: 3 }, { name: "tada", at: 0.6 }], wait: 2.0, gap: 0 },
          { who: "thay", say: "Kho báu đây rồi! Ha ha ha!", sub: "Kho báu đây rồi! Ha ha ha!", bubble: false, pose: "dance", face: "happy", act: { na: { pose: "dance" }, bin: { pose: "dance" } }, sfx: [{ name: "applause", vol: 0.5 }] },
          // Râu Xồm lao tới cướp → Bin ngáng chân
          { who: "rau", say: "Kho báu... là của ta!", sub: "Kho báu là của ta!", bubble: false, cam: { x: 1320, y: 420, zoom: 1.2, dur: 0.5 },
            move: { who: "rau", to: HC[0] + 320, y: YC, dur: 1.2, style: "jump", height: 300, spin: -360 }, sfx: [{ name: "whoosh" }] },
          { act: { bin: { pose: "kick", snap: 0.08 }, rau: { pose: "lie", face: "worried", snap: 0.1 } }, move: { who: "rau", by: 110, dur: 0.5, style: "slide" },
            fx: [bang("OÁI!", HC[0] + 380, YC - 60)], shake: { amp: 18, dur: 0.3 }, sfx: [{ name: "swish2" }, { name: "fall", at: 0.15 }, { name: "laugh", at: 0.6, vol: 0.7 }], wait: 1.0, gap: 0 },
          { who: "bin", say: "Ông Râu Xồm ơi... ông chưa học bài đường tròn à?", sub: "Ông chưa học bài đường tròn à?", bubble: false, pose: "pointup", face: "happy" },
          { who: "rau", say: "Hu hu hu... cho ta đi học toán với!", sub: "Hu hu… cho ta đi học toán với!", bubble: false, pose: "kneel", face: "sad", sfx: [{ name: "laugh", at: 1.2, vol: 0.5 }] },
          // mật thư trong rương: tiếp tuyến ⊥ bán kính
          { who: "thay", say: "Trong rương còn một mật thư: tiếp tuyến thì vuông góc với bán kính đi qua tiếp điểm. Đường xê... vuông góc với ô hát tại hát!", sub: "Tiếp tuyến ⊥ bán kính: c ⊥ OH", bubble: false, pose: "explain",
            cam: { x: 960, y: 540, zoom: 1, dur: 0.8 }, anim: [...clearLines(["l1", "l2", "l3", "l4"]), { do: "flash", id: "mc", at: 3.0, dur: 0.8, sfx: "ding" }, { do: "indicate", id: "dc", at: 3.0, dur: 1.0 }],
            set: { id: "pn", title: "Mật thư" }, show: [line(1, "Tiếp tuyến \\perp", GOLD, 1.2, 72, "s"), line(2, "bán kính tại", "#f5f5ec", 1.8, 72, "s"), line(3, "tiếp điểm", "#f5f5ec", 2.3, 72, "s"), line(4, "c \\perp OH tại H", "#c5e1a5", 3.0, 72, "s")] },
          Object.assign(card("kt", "Tiếp tuyến ⊥ bán kính", "tại tiếp điểm:  c ⊥ OH tại H", GOLD),
            { who: "na", say: "Ngược lại: đường thẳng đi qua một điểm của đường tròn, và vuông góc với bán kính tại điểm đó... thì là tiếp tuyến!", sub: "c ⊥ OH tại H ∈ (O) ⇒ c là tiếp tuyến", bubble: false, pose: "pointup", face: "happy" }),
          uncard("kt")
        ] },

      // ================= 5. LỚP HỌC: tổng kết, câu hỏi nhanh, rương "Bài tập về nhà" =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "idle", face: "happy" }, na: { x: 1240, pose: "idle", face: "happy", flip: true }, bin: { x: 1420, pose: "idle", face: "happy", flip: true }, rau: { x: 1640, pose: "idle", face: "happy", flip: true, hold: "book" }, ke: HIDE },
        beats: [
          { who: "ke", say: "Thứ Hai tuần sau... lớp chín A đón một học sinh mới... rất đặc biệt.", sub: "Thứ Hai, lớp 9A đón học sinh mới…" },
          { who: "rau", say: "Chào thầy! Em là học sinh mới... Râu Xồm ạ!", sub: "Chào thầy! Em là học sinh mới ạ!", pose: "bow", face: "happy", sfx: [{ name: "laugh", at: 1.6, vol: 0.6 }] },
          { who: "thay", say: "Chào em! Cả lớp cùng tổng kết bài học nào!", sub: "Cả lớp cùng tổng kết nào!", pose: "write", hold: "chalk" },
          { who: "na", say: "Đê nhỏ hơn e rờ: cắt nhau, có hai điểm chung.", sub: "d < R: cắt nhau – 2 điểm chung", pose: "pointup", write: { text: "• d < R: cắt nhau (2 điểm)", size: 88, color: "#ff8a80" }, sfx: [{ name: "ding", at: 0.8 }] },
          { who: "bin", say: "Đê bằng e rờ: tiếp xúc, có một điểm chung là tiếp điểm!", sub: "d = R: tiếp xúc – 1 điểm chung", pose: "cheer", write: { text: "• d = R: tiếp xúc (1 điểm)", size: 88, color: "#a5d6a7" }, sfx: [{ name: "ding", at: 0.8 }] },
          { who: "rau", say: "Đê lớn hơn e rờ: không giao nhau... chạy mãi không tới!", sub: "d > R: không giao nhau!", pose: "pointup", write: { text: "• d > R: không giao nhau", size: 88, color: "#81d4fa" }, sfx: [{ name: "ding", at: 0.8 }, { name: "laugh", at: 2.6, vol: 0.4 }] },
          { who: "thay", say: "Và nhớ: tiếp tuyến vuông góc với bán kính tại tiếp điểm!", sub: "Tiếp tuyến ⊥ bán kính!", pose: "write",
            write: { text: "Tiếp tuyến ⊥ bán kính tại tiếp điểm", size: 76, box: true }, sfx: ["ding"] },
          { who: "thay", say: "Câu hỏi nhanh: đường tròn ô bán kính sáu xăng-ti-mét, khoảng cách từ ô đến đường thẳng em bằng sáu xăng-ti-mét. Vị trí của chúng thế nào?", sub: "Câu hỏi nhanh", pose: "ask", hold: null,
            act: { na: { pose: "think", face: "thinking" }, bin: { pose: "think", face: "thinking" }, rau: { pose: "think", face: "thinking" } }, quiz: Object.assign({ answer: -1, think: 4 }, QZ), sfx: [{ name: "tension", at: 1.0, vol: 0.5 }] },
          { who: "rau", say: "Em chọn A, cắt nhau! Cứ chạm là cắt!", sub: "Em chọn A: cắt nhau!", pose: "pointup", face: "happy", quiz: Object.assign({ answer: -1, think: 0 }, QZ), sfx: [{ name: "wrong", at: 1.6 }] },
          { act: { thay: { pose: "surprised", face: "surprised", snap: 0.08 } }, cam: { x: 300, y: 690, zoom: 2.6, dur: 0.18 }, sfx: [{ name: "surprise", vol: 0.9 }, { name: "fail", at: 0.5, vol: 0.9 }],
            shake: { at: 0.05, amp: 10, dur: 0.25 }, wait: 1.8, gap: 0 },
          { who: "thay", say: "Râu Xồm ơi! Em lại muốn trúng bẫy nữa à?", sub: "Râu Xồm! Lại muốn trúng bẫy à?", pose: "facepalm", face: "worried", cam: { x: 960, y: 540, zoom: 1, dur: 0.5 }, act: { rau: { pose: "shrug", face: "worried" } } },
          { who: "bin", say: "Để em! Đê bằng e rờ, cùng bằng sáu xăng-ti-mét, nên tiếp xúc. Đáp án bê ạ!", sub: "d = R = 6 cm ⇒ tiếp xúc: B", pose: "pointup", face: "happy",
            quiz: Object.assign({ answer: 1, think: 0 }, QZ), act: { na: { pose: "clap" } } },
          { who: "thay", say: "Chính xác! Bin hết ngủ gật rồi! Cả lớp xứng đáng nhận... kho báu thứ hai!", sub: "Chính xác! Kho báu thứ hai!", pose: "clap", face: "happy",
            show: { id: "ch2", type: "chest", x: 860, y: 960, scale: 0.8, anim: "grow", dur: 0.6, sfx: "magic" }, act: { na: { pose: "cheer" }, bin: { pose: "cheer", face: "happy" } }, sfx: [{ name: "applause", at: 0.6, vol: 0.5 }] },
          { who: "rau", say: "Để ta mở! Chắc chắn là vàng!", sub: "Để ta mở! Chắc chắn là vàng!", pose: "cheer", face: "happy", move: { who: "rau", to: 1060, dur: 1.0, style: "run" } },
          { tween: { id: "ch2", open: 1, dur: 0.6 }, act: { rau: { pose: "surprised", face: "surprised" }, na: { pose: "clap", face: "happy" } },
            show: { id: "btvn", type: "sign", text: "Bài tập về nhà", x: 860, y: 690, w: 600, size: 72, anim: "grow", dur: 0.6, sfx: "pop" }, sfx: [{ name: "click" }, { name: "fail", at: 0.6 }, { name: "laugh", at: 1.2, vol: 0.7 }], wait: 1.6, gap: 0 },
          { who: "rau", say: "Hu hu! Hải tặc... cũng phải làm bài tập về nhà à?", sub: "Hải tặc cũng phải làm bài tập à?", pose: "facepalm", face: "sad" },
          { who: "thay", say: "Đúng rồi! Kiến thức mới là kho báu thật sự. Chào các em!", sub: "Kiến thức là kho báu thật sự!", pose: "dance", face: "happy", act: { na: { pose: "wave" }, bin: { pose: "dance" } },
            fx: [{ type: "confetti", x: 1200, y: 420, at: 0.5, dur: 2.0 }], sfx: [{ name: "tada", at: 0.5 }, { name: "laugh", at: 1.5, vol: 0.4 }] },
          { who: "ke", say: "Và thế là... kho báu thật sự đã được tìm thấy. Hẹn gặp lại các bạn... trong chuyến phiêu lưu tiếp theo!", sub: "Hẹn gặp lại ở chuyến phiêu lưu sau!",
            title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 6.0, bgColor: "rgba(62,39,35,.92)", color: GOLD }, sfx: ["ding"] }
        ] }
    ]
  };
})();
