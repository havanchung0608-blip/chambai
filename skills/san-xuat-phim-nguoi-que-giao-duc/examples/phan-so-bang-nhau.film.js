// Phim mẫu: "Ai được nhiều bánh hơn?" — Phân số bằng nhau (Toán 6)
// Build:  python3 scripts/build_film.py examples/phan-so-bang-nhau.film.js out/phan-so-bang-nhau.html
window.FILM = {
  title: "Ai được nhiều bánh hơn?",
  subtitle: "Phân số bằng nhau · Toán 6",
  file: "phan-so-bang-nhau",
  watermark: "Thầy Hà Văn Chung",
  music: true,
  narrator: { voice: "nu" },
  cast: {
    co:   { name: "Cô Mai", voice: "nu", hair: "long", shirt: "#e57373", skirt: true, glasses: true },
    an:   { name: "An", voice: "tre", scale: 0.78, hair: "spiky", shirt: "#42a5f5", hat: "cap", hatColor: "#1e88e5" },
    binh: { name: "Bình", voice: "tre", pitch: 1.5, scale: 0.78, hair: "ponytail", shirt: "#ffb74d", bow: "#e91e63" }
  },
  scenes: [
    { // 1. Mở đầu
      bg: "park",
      cast: { an: { x: -160, pose: "idle", face: "happy" }, binh: { x: 2080, pose: "idle", face: "happy", flip: true } },
      beats: [
        { title: { text: "Ai được nhiều bánh hơn?", sub: "Phân số bằng nhau · Toán 6", dur: 3.4 }, sfx: ["bell"] },
        { move: [{ who: "an", to: 520, dur: 3 }, { who: "binh", to: 1400, dur: 2, style: "run" }], gap: 0.2 },
        { who: "an", say: "Mẹ cho hai đứa mình hai cái bánh giống hệt nhau nè!", pose: "cheer", face: "happy",
          show: [{ id: "ban", type: "table", x: 960, y: 960, w: 560, h: 200, z: -1, sfx: false }, { id: "c1", type: "cake", x: 820, y: 690, slices: 2, r: 95 }, { id: "c2", type: "cake", x: 1100, y: 690, slices: 4, r: 95 }] },
        { who: "binh", say: "Bánh của An cắt làm hai phần, bánh của Bình cắt làm bốn phần.", pose: "point", face: "happy" },
        { who: "an", say: "Tớ ăn một phần.", pose: "hold", set: [{ id: "c1", taken: 1 }], sfx: ["pop"] },
        { who: "binh", say: "Còn tớ ăn hai phần. Tớ được nhiều hơn rồi!", pose: "cheer", set: [{ id: "c2", taken: 2 }], sfx: ["pop"] },
        { who: "an", say: "Khoan đã! Hình như hai đứa mình ăn bằng nhau mà?", pose: "think", face: "thinking", emote: { who: "an", icon: "question" } }
      ]
    },
    { // 2. Cô giáo giải thích
      bg: "whiteboard",
      cast: { co: { x: -150, pose: "idle", face: "happy" } },
      beats: [
        { move: { who: "co", to: 330, dur: 2.4 }, gap: 0.1 },
        { who: "co", say: "Các em cùng cô viết lại nhé. An ăn một phần hai cái bánh.", pose: "write", hold: "marker", write: "An: \\frac{1}{2} cái bánh" },
        { who: "co", say: "Bình ăn hai phần tư cái bánh.", pose: "write", write: "Bình: \\frac{2}{4} cái bánh" },
        { who: "co", say: "Nhìn hình, phần tô màu của hai bánh bằng nhau.", pose: "point", hold: "pointer",
          show: [{ id: "b1", type: "bar", x: 1170, y: 500, parts: 2, taken: 1, w: 520, h: 70 }, { id: "b2", type: "bar", x: 1170, y: 600, parts: 4, taken: 2, w: 520, h: 70, highlight: "#81c784" }] },
        { who: "co", say: "Vậy một phần hai bằng hai phần tư. Đây là hai phân số bằng nhau.", pose: "explain", face: "happy",
          write: { text: "\\frac{1}{2} = \\frac{2}{4}", size: 76, box: true, y: 600 }, sfx: ["ding"] }
      ]
    },
    { // 3. Quy tắc
      bg: "whiteboard",
      cast: { co: { x: 300, pose: "idle", face: "happy", hold: "marker" } },
      beats: [
        { who: "co", say: "Chú ý nhé! Hai phân số a phần b và c phần d bằng nhau nếu a nhân d bằng b nhân c.", pose: "pointup", face: "happy", emote: { who: "co", icon: "idea" },
          write: { text: "\\frac{a}{b} = \\frac{c}{d}  nếu  a \\cdot d = b \\cdot c", size: 66, box: true } },
        { who: "co", say: "Kiểm tra: một nhân bốn bằng bốn, hai nhân hai cũng bằng bốn. Đúng rồi!", pose: "write",
          write: "1 \\cdot 4 = 4 ;   2 \\cdot 2 = 4", sfx: ["correct"] }
      ]
    },
    { // 4. Câu hỏi nhanh
      bg: "classroom",
      cast: { co: { x: 300, pose: "ask", face: "happy" }, an: { x: 1130, pose: "sit", face: "thinking", flip: true }, binh: { x: 1340, pose: "sit", face: "happy", flip: true } },
      beats: [
        { who: "co", say: "Câu hỏi nhanh! Phân số nào bằng ba phần năm?", pose: "ask",
          quiz: { q: "Phân số nào bằng \\frac{3}{5} ?", options: ["\\frac{5}{3}", "\\frac{6}{10}", "\\frac{6}{5}", "\\frac{3}{10}"], answer: 1, think: 5 } },
        { who: "an", say: "Sáu phần mười ạ! Vì ba nhân mười bằng năm nhân sáu.", act: { an: { pose: "sithand", face: "happy" } } },
        { who: "co", say: "Chính xác! Cả lớp khen An nào!", pose: "clap", face: "happy", sfx: ["applause"],
          act: { binh: { pose: "sithand", face: "happy" } } }
      ]
    },
    { // 5. Kết
      bg: "park",
      cast: { an: { x: 760, pose: "idle", face: "happy" }, binh: { x: 1160, pose: "idle", face: "happy", flip: true } },
      beats: [
        { who: "binh", say: "Hóa ra mình ăn bằng nhau thật!", pose: "shrug", face: "happy" },
        { who: "an", say: "Lần sau chia bánh, nhớ nhân chéo để kiểm tra nhé!", pose: "wave", face: "happy" },
        { who: "binh", say: "Đi thôi, ra sân đá bóng nào!", pose: "cheer" },
        { move: [{ who: "an", to: 2100, dur: 2.2, style: "run" }, { who: "binh", to: 2150, dur: 2.6, style: "run" }] },
        { title: { text: "Hẹn gặp lại các em!", sub: "Về nhà: tìm 3 phân số bằng \\frac{2}{3}", dur: 3.5 }, sfx: ["tada"] }
      ]
    }
  ]
};
