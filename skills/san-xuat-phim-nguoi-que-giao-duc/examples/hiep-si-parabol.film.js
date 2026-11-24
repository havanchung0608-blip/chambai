// Phim thử đa thể loại: cổ tích – phiêu lưu – hoạt hình toán kiểu Manim
// Thể hiện: vai diễn theo trang phục, máy quay nhiều cỡ cảnh/góc máy/bám theo/lia nhanh, phông nền nhiều lớp chiều sâu,
// chuyển cảnh, âm thanh TiengDong.com, đồ thị vẽ dần kiểu Manim.
window.FILM = {
  title: "Hiệp sĩ và bí mật Parabol",
  file: "hiep-si-va-bi-mat-parabol",
  watermark: "Thầy Hà Văn Chung",
  music: "story",
  narrator: { voice: "nu" },
  cast: {
    vua:     { name: "Nhà vua", role: "vua", voice: "nam", rate: 0.95 },
    hiepsi:  { name: "Hiệp sĩ", role: "hiep-si", voice: "nam", pitch: 1.1 },
    phuthuy: { name: "Phù thủy", role: "phu-thuy", voice: "nam", pitch: 0.85, rate: 0.9 }
  },
  scenes: [
    { bg: "castle", trans: "iris", cam: { x: 1250, y: 420, zoom: 1.7 }, beats: [
      { cam: { shot: "wide", dur: 3.4 }, title: { text: "HIỆP SĨ VÀ BÍ MẬT PARABOL", sub: "Phim thử: đa thể loại", dur: 3.4, bgColor: "rgba(255,250,235,.80)" }, sfx: [{ name: "tension", vol: 0.7 }] }
    ]},
    { bg: "castle", trans: "fade",
      cast: { vua: { x: 1380, flip: true, pose: "idle" }, hiepsi: { x: -250, pose: "idle" } },
      beats: [
        { say: "Ngày xửa ngày xưa, ở vương quốc Số Học, có một chàng hiệp sĩ dũng cảm.",
          cam: { follow: "hiepsi", lead: 220, zoom: 1.45, y: 640, dur: 1.2 }, move: { who: "hiepsi", to: 760, dur: 4.2 } },
        { cam: { shot: "two", on: ["hiepsi", "vua"], dur: 0.9 }, act: { hiepsi: { pose: "bow" } }, wait: 1.0 },
        { cam: { shot: "close", on: "vua", dur: 0.5 }, who: "vua", say: "Hiệp sĩ! Phù thủy đã đánh cắp bí mật của đường parabol!", pose: "ask", face: "worried", sfx: [{ name: "surprise", vol: 0.8 }] },
        { cam: { shot: "medium", on: "hiepsi", angle: "low", dur: 0.5 }, who: "hiepsi", say: "Thần sẽ lấy lại nó, thưa bệ hạ!", pose: "pointup", face: "angry" }
      ] },
    { bg: "forest", trans: "fade",
      cast: { hiepsi: { x: -300, pose: "idle", face: "angry" }, phuthuy: { x: 1650, flip: true, pose: "idle", face: "angry" } },
      beats: [
        { cam: { follow: "hiepsi", lead: 260, zoom: 1.5, y: 650, dur: 0.01 }, move: { who: "hiepsi", to: 1050, dur: 2.8, style: "run" }, gap: 0 },
        { cam: { shot: "close", on: "phuthuy", whip: true, dur: 0.35 }, sfx: [{ name: "mystery", vol: 0.8, len: 4 }], wait: 0.6, gap: 0 },
        { cam: { shot: "close", on: "phuthuy", angle: "dutch", dur: 0.5 }, who: "phuthuy", say: "Ha ha! Muốn lấy lại thì hãy giải được câu đố của ta!", pose: "ask" },
        { cam: { shot: "two", on: ["hiepsi", "phuthuy"], angle: "eye", dur: 0.7 }, who: "hiepsi", say: "Ta không sợ! Ra đề đi!", pose: "guard" },
        { act: { phuthuy: { pose: "pointup", snap: 0.15 } }, sfx: [{ name: "magic", at: 0.1 }], fx: { type: "hit", on: "phuthuy", part: "head", dy: -230, dx: 60, at: 0.15, dur: 0.6, color: "#b388ff" }, shake: { at: 0.2, amp: 16, dur: 0.4 }, wait: 1.0 }
      ] },
    { bg: "manimgrid", trans: "flash",
      cast: { phuthuy: { x: 300, pose: "explain", scale: 0.95 } },
      beats: [
        { who: "phuthuy", say: "Đây là đồ thị hàm số y bằng x bình phương.",
          show: [ { id: "ax", type: "axes", x: 1200, y: 560, w: 900, h: 800, xmin: -3, xmax: 3, ymin: -5, ymax: 5, step: 1, stepY: 1, anim: "create", dur: 1.4 },
                  { id: "ct", type: "text", text: "y = x^2", x: 420, y: 190, size: 96, color: "#ffeb3b", anim: "write", dur: 1.2 } ],
          anim: { do: "create", id: "g", at: 1.4, dur: 2, item: { type: "graph", axes: "ax", fn: "x^2", color: "#ffeb3b", width: 9 } } },
        { who: "phuthuy", say: "Điểm thấp nhất của parabol là gốc tọa độ O.",
          anim: [ { do: "grow", id: "d", dur: 0.4, item: { type: "dot", on: "g", u: -2, r: 16, color: "#fc6255" } }, { do: "along", id: "d", graph: "g", from: -2, to: 0, at: 0.4, dur: 2 }, { do: "flash", id: "d", at: 2.4, dur: 0.6 } ] },
        { cam: { x: 1020, y: 520, zoom: 1.15, dur: 0.8 }, who: "phuthuy", say: "Khi a bằng hai, parabol hẹp lại.",
          anim: [ { do: "transform", id: "g", to: { fn: "2*x^2" }, dur: 1.2 }, { do: "transform", id: "ct", to: { text: "y = 2x^2" }, dur: 1.0 } ] },
        { who: "phuthuy", say: "Khi a âm, parabol úp xuống.",
          anim: [ { do: "transform", id: "g", to: { fn: "-x^2", color: "#58c4dd" }, dur: 1.2 }, { do: "transform", id: "ct", to: { text: "y = −x^2", color: "#58c4dd" }, dur: 1.0 }, { do: "circumscribe", id: "ct", at: 1.2, dur: 1.0 } ] },
        { cam: { shot: "wide", dur: 0.8 }, who: "phuthuy", say: "Giỏi lắm! Bí mật trả lại cho các ngươi.", pose: "shrug", face: "happy",
          anim: [ { do: "fadeout", id: "g", at: 1, dur: 0.8 }, { do: "fadeout", id: "ax", at: 1, dur: 0.8 }, { do: "fadeout", id: "ct", at: 1, dur: 0.8, shift: [0, -60] }, { do: "fadeout", id: "d", at: 1, dur: 0.5 } ] }
      ] },
    { bg: "castle", trans: "iris",
      cast: { vua: { x: 1250, flip: true, pose: "idle", face: "happy" }, hiepsi: { x: 760, pose: "idle", face: "happy" } },
      beats: [
        { cam: { shot: "two", on: ["hiepsi", "vua"], letterbox: true, dur: 1 }, who: "vua", say: "Cảm ơn hiệp sĩ! Từ nay cả vương quốc đều hiểu parabol.", pose: "cheer", sfx: [{ name: "victory", at: 0.5, vol: 0.8 }] },
        { who: "hiepsi", say: "Học toán cũng là một cuộc phiêu lưu, thưa bệ hạ!", pose: "bow" },
        { cam: { shot: "wide", letterbox: false, dur: 1.4 }, title: { text: "HẾT", sub: "Âm thanh: TiengDong.com · Nhạc nền: TiengDong.com", dur: 3.2, bgColor: "rgba(20,20,30,.85)", color: "#ffca28" } }
      ] }
  ]
};
