// Đoạn ngắn: Vẽ đồ thị hàm số y = x² theo đúng 3 bước SGK (Toán 9 – Kết nối tri thức):
// lập bảng giá trị → biểu diễn các điểm → nối thành parabol. Chữ lời thoại cỡ lớn cho học sinh.
window.FILM = {
  title: "Vẽ đồ thị hàm số y = x²",
  file: "ve-do-thi-y-bang-x-binh-phuong",
  watermark: "Thầy Hà Văn Chung",
  music: "story",
  cast: { co: { name: "Cô Mai", role: "giao-vien", voice: "nu" } },
  scenes: [
    { bg: "manimgrid", trans: "fade",
      cast: { co: { x: 300, pose: "idle", face: "happy" } },
      beats: [
        { who: "co", say: "Hôm nay cô cùng các em vẽ đồ thị hàm số i dài bằng ích bình phương.", sub: "Vẽ đồ thị hàm số y = x²", bubble: false, pose: "wave" },
        { who: "co", say: "Bước một: lập bảng giá trị.", sub: "Bước 1: Lập bảng giá trị", bubble: false, pose: "explain",
          show: { id: "tb", type: "table", x: 70, y: 70, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = x^2", "4", "1", "0", "1", "4"]], cw0: 250, cw: 135, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: "#ffeb3b" }, anim: "create", dur: 1.0 },
          tween: { id: "tb", revealX: 5, dur: 2.0 } },
        { who: "co", say: "Thay ích lần lượt bằng âm hai, âm một, không, một, hai. Ta được i dài bằng bốn, một, không, một, bốn.", sub: "Thay x vào: y = 4; 1; 0; 1; 4", bubble: false, pose: "explain",
          tween: { id: "tb", revealY: 5, dur: 6.0 } },
        { who: "co", say: "Bước hai: biểu diễn các điểm trên mặt phẳng tọa độ.", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "point", flip: false,
          show: { id: "ax", type: "axes", x: 1390, y: 545, w: 840, h: 700, xmin: -3, xmax: 3, ymin: -0.5, ymax: 4.5, step: 1, stepY: 1, size: 56, xlabel: "x", ylabel: "y", anim: "create", dur: 1.3 } },
        { show: { id: "pA", type: "dot", ax: "ax", at: [-2, 4], r: 17, color: "#fc6255", label: "(−2; 4)", size: 58, anim: "grow", dur: 0.4 }, set: { id: "tb", hiCol: 1 }, wait: 0.9, gap: 0 },
        { show: { id: "pB", type: "dot", ax: "ax", at: [-1, 1], r: 17, color: "#fc6255", label: "(−1; 1)", size: 58, anim: "grow", dur: 0.4 }, set: { id: "tb", hiCol: 2 }, wait: 0.9, gap: 0 },
        { show: { id: "pO", type: "dot", ax: "ax", at: [0, 0], r: 17, color: "#fc6255", label: "O", size: 60, anim: "grow", dur: 0.4 }, set: { id: "tb", hiCol: 3 }, wait: 0.9, gap: 0 },
        { show: { id: "pC", type: "dot", ax: "ax", at: [1, 1], r: 17, color: "#fc6255", label: "(1; 1)", size: 58, anim: "grow", dur: 0.4 }, set: { id: "tb", hiCol: 4 }, wait: 0.9, gap: 0 },
        { show: { id: "pD", type: "dot", ax: "ax", at: [2, 4], r: 17, color: "#fc6255", label: "(2; 4)", size: 58, anim: "grow", dur: 0.4 }, set: { id: "tb", hiCol: 5 }, wait: 1.0 },
        { who: "co", say: "Bước ba: nối các điểm bằng một đường cong trơn.", sub: "Bước 3: Nối các điểm bằng đường cong trơn", bubble: false, pose: "explain",
          set: { id: "tb", hiCol: 0 },
          anim: { do: "create", id: "g", at: 0.6, dur: 2.4, item: { type: "graph", axes: "ax", fn: "x^2", x0: -2.15, x1: 2.15, color: "#ffeb3b", width: 9 } } },
        { who: "co", say: "Ta được một parabol có đỉnh O, nhận trục ô i làm trục đối xứng.", sub: "Parabol đỉnh O, trục đối xứng Oy", bubble: false, pose: "point", face: "happy",
          anim: [ { do: "flash", id: "pO", at: 0.3, dur: 0.8 }, { do: "indicate", id: "g", at: 1.4, dur: 1.2 } ] },
        { title: { text: "Nhớ 3 bước: Lập bảng – Biểu diễn điểm – Nối đường cong", dur: 3.4, bgColor: "rgba(20,20,30,.88)", color: "#ffd54f", sub: "Âm thanh: TiengDong.com · Giọng: VieNeu-TTS" }, sfx: ["ding"] }
      ] }
  ]
};
