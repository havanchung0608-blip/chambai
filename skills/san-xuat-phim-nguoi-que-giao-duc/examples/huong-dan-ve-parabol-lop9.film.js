// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức)
// Thầy Chung giảng; chữ lớn cho học sinh; mỗi ví dụ đủ 3 bước: lập bảng giá trị → biểu diễn điểm → nối đường cong trơn.
(function () {
  // quy đổi toạ độ trục → toạ độ màn hình (để vẽ đường gấp khúc minh hoạ lỗi sai)
  function mapper(A) {
    return (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  }
  const AX1 = { id: "ax", type: "axes", x: 1400, y: 520, w: 820, h: 720, xmin: -3, xmax: 3, ymin: -0.5, ymax: 8.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y" };
  const AX2 = { id: "ax2", type: "axes", x: 1480, y: 520, w: 760, h: 720, xmin: -5, xmax: 5, ymin: -8.5, ymax: 0.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y" };
  const M1 = mapper(AX1);
  const P1 = [[-2, 8], [-1, 2], [0, 0], [1, 2], [2, 8]];
  const dot = (id, ax, at, label, extra) => Object.assign({ id, type: "dot", ax, at, r: 17, color: "#fc6255", label, size: 58, anim: "grow", dur: 0.4 }, extra || {});
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };

  window.FILM = {
    title: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)",
    subtitle: "Toán 9 · Hướng dẫn từng bước",
    file: "huong-dan-ve-parabol-lop9",
    watermark: "Thầy Hà Văn Chung",
    music: "story",
    cast: { thay: TEACHER },
    scenes: [
      // ---------------- 1. Mở đầu + tính chất ----------------
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -150, pose: "idle", face: "happy" } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung hướng dẫn", dur: 3.4 }, sfx: ["bell"] },
          { move: { who: "thay", to: 300, dur: 2.2 }, gap: 0.1 },
          { who: "thay", say: "Chào các em! Hôm nay thầy hướng dẫn các em vẽ đồ thị hàm số i dài bằng a ích bình phương, với a khác không.", sub: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)", pose: "wave", face: "happy" },
          { who: "thay", say: "Đồ thị của hàm số này là một đường cong gọi là parabol, có đỉnh là gốc tọa độ O.", sub: "Đồ thị là parabol, đỉnh O", pose: "write", hold: "chalk",
            write: { text: "Đồ thị y = ax² (a ≠ 0) là parabol đỉnh O", size: 66 } },
          { who: "thay", say: "Parabol nhận trục O y làm trục đối xứng.", sub: "Trục đối xứng: Oy", pose: "write",
            write: { text: "• Trục đối xứng: Oy", size: 66 } },
          { who: "thay", say: "Nếu a dương, đồ thị nằm phía trên trục hoành, O là điểm thấp nhất.", sub: "a > 0: phía trên trục hoành, O thấp nhất", pose: "write",
            write: { text: "• a > 0: phía trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" } },
          { who: "thay", say: "Nếu a âm, đồ thị nằm phía dưới trục hoành, O là điểm cao nhất.", sub: "a < 0: phía dưới trục hoành, O cao nhất", pose: "write",
            write: { text: "• a < 0: phía dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" } },
          { who: "thay", say: "Để vẽ đồ thị, ta làm ba bước: lập bảng giá trị, biểu diễn các điểm, rồi nối thành đường cong trơn.", sub: "3 bước: Lập bảng – Biểu diễn điểm – Nối", pose: "pointup", face: "happy", emote: { who: "thay", icon: "idea" },
            write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] }
        ] },
      // ---------------- 2. Ví dụ 1: y = 2x² ----------------
      { bg: "manimgrid", trans: "fade",
        cast: { thay: { x: 300, pose: "idle", face: "happy" } },
        beats: [
          { who: "thay", say: "Ví dụ một: vẽ đồ thị hàm số i dài bằng hai ích bình phương.", sub: "Ví dụ 1: Vẽ đồ thị y = 2x²", bubble: false, pose: "wave" },
          { who: "thay", say: "Bước một: lập bảng giá trị. Ta chọn ích bằng âm hai, âm một, không, một, hai.", sub: "Bước 1: Lập bảng giá trị", bubble: false, pose: "explain",
            show: { id: "tb", type: "table", x: 60, y: 60, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: "#ffeb3b" }, anim: "create", dur: 1.0 },
            tween: { id: "tb", revealX: 5, dur: 3.5 } },
        { who: "thay", say: "Thay vào công thức, ta được i dài bằng tám, hai, không, hai, tám.", sub: "Tính được: y = 8; 2; 0; 2; 8", bubble: false, pose: "explain",
            tween: { id: "tb", revealY: 5, dur: 4.5 } },
          { who: "thay", say: "Bước hai: biểu diễn các điểm tương ứng trên mặt phẳng tọa độ.", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "point",
            show: Object.assign({}, AX1, { anim: "create", dur: 1.3 }) },
          { show: dot("p1", "ax", [-2, 8], "(−2; 8)"), set: { id: "tb", hiCol: 1 }, wait: 0.9, gap: 0 },
          { show: dot("p2", "ax", [-1, 2], "(−1; 2)"), set: { id: "tb", hiCol: 2 }, wait: 0.9, gap: 0 },
          { show: dot("p3", "ax", [0, 0], "O", { size: 60 }), set: { id: "tb", hiCol: 3 }, wait: 0.9, gap: 0 },
          { show: dot("p4", "ax", [1, 2], "(1; 2)"), set: { id: "tb", hiCol: 4 }, wait: 0.9, gap: 0 },
          { show: dot("p5", "ax", [2, 8], "(2; 8)", { labelSide: "left" }), set: { id: "tb", hiCol: 5 }, wait: 1.0 },
          { who: "thay", say: "Các em thấy không, các cặp điểm đối xứng với nhau qua trục O y.", sub: "Các cặp điểm đối xứng qua Oy", bubble: false, pose: "point", face: "happy",
            set: { id: "tb", hiCol: 0 }, anim: [{ do: "flash", id: "p1", dur: 0.7 }, { do: "flash", id: "p5", dur: 0.7 }, { do: "flash", id: "p2", at: 1.2, dur: 0.7 }, { do: "flash", id: "p4", at: 1.2, dur: 0.7 }] },
          { who: "thay", say: "Bước ba: nối các điểm bằng một đường cong trơn, ta được parabol.", sub: "Bước 3: Nối thành đường cong trơn", bubble: false, pose: "explain",
            anim: { do: "create", id: "g1", at: 0.5, dur: 2.6, item: { type: "graph", axes: "ax", fn: "2*x^2", x0: -2.08, x1: 2.08, color: "#ffeb3b", width: 9, label: "y = 2x^2", size: 58 } } }
        ] },
      // ---------------- 3. Lỗi hay gặp ----------------
      { bg: "manimgrid", trans: "fade",
        cast: { thay: { x: 300, pose: "idle", face: "worried" } },
        items: [Object.assign({}, AX1)].concat(P1.map((p, i) => dot("q" + i, "ax", p, null, { anim: undefined }))),
        beats: [
          { who: "thay", say: "Chú ý lỗi hay gặp! Nhiều bạn nối các điểm bằng những đoạn thẳng.", sub: "Lỗi hay gặp: nối bằng đoạn thẳng", bubble: false, pose: "facepalm", face: "worried",
            show: [{ id: "bad", type: "poly", points: P1.map((p) => M1(p[0], p[1])), close: false, color: "#ff5252", width: 7, anim: "create", dur: 1.8 },
                   { id: "x1", type: "cross", x: 960, y: 470, scale: 1.1, sfx: "wrong" }] },
          { who: "thay", say: "Như vậy là sai. Đồ thị parabol là đường cong trơn, ở đỉnh O không có góc nhọn.", sub: "Sai! Parabol là đường cong trơn", bubble: false, pose: "shrug", face: "sad",
            anim: { do: "fadeout", id: "bad", at: 2.2, dur: 0.6 } },
          { who: "thay", say: "Ta phải vẽ một nét cong mềm mại đi qua tất cả các điểm.", sub: "Đúng: nét cong đi qua mọi điểm", bubble: false, pose: "explain", face: "happy",
            hide: "x1",
            show: { id: "ok", type: "check", x: 960, y: 470, scale: 1.1, sfx: "correct" },
            anim: { do: "create", id: "good", at: 0.3, dur: 2.2, item: { type: "graph", axes: "ax", fn: "2*x^2", x0: -2.08, x1: 2.08, color: "#69f0ae", width: 9 } } }
        ] },
      // ---------------- 4. Ví dụ 2: y = −½x² ----------------
      { bg: "manimgrid", trans: "fade",
        cast: { thay: { x: 300, pose: "idle", face: "happy" } },
        beats: [
          { who: "thay", say: "Ví dụ hai: vẽ đồ thị hàm số i dài bằng âm một phần hai ích bình phương.", sub: "Ví dụ 2: Vẽ đồ thị y = −½x²", bubble: false, pose: "wave" },
          { who: "thay", say: "Mẹo nhỏ: ta chọn ích là số chẵn để i dài là số nguyên, dễ biểu diễn hơn.", sub: "Mẹo: chọn x chẵn để y nguyên", bubble: false, pose: "pointup", emote: { who: "thay", icon: "idea" },
            show: { id: "tb2", type: "table", x: 60, y: 60, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: "#80deea" }, anim: "create", dur: 1.0 },
            tween: { id: "tb2", revealX: 5, dur: 3.5 } },
          { who: "thay", say: "Ta được i dài bằng âm tám, âm hai, không, âm hai, âm tám.", sub: "Tính được: y = −8; −2; 0; −2; −8", bubble: false, pose: "explain",
            tween: { id: "tb2", revealY: 5, dur: 4.0 } },
          { who: "thay", say: "Biểu diễn các điểm lên mặt phẳng tọa độ.", sub: "Biểu diễn các điểm", bubble: false, pose: "point",
            show: Object.assign({}, AX2, { anim: "create", dur: 1.3 }) },
          { show: dot("r1", "ax2", [-4, -8], "(−4; −8)", { color: "#80deea", label: "(−4; −8)" }), set: { id: "tb2", hiCol: 1 }, wait: 0.85, gap: 0 },
          { show: dot("r2", "ax2", [-2, -2], "(−2; −2)", { color: "#80deea" }), set: { id: "tb2", hiCol: 2 }, wait: 0.85, gap: 0 },
          { show: dot("r3", "ax2", [0, 0], "O", { color: "#80deea", size: 60 }), set: { id: "tb2", hiCol: 3 }, wait: 0.85, gap: 0 },
          { show: dot("r4", "ax2", [2, -2], "(2; −2)", { color: "#80deea" }), set: { id: "tb2", hiCol: 4 }, wait: 0.85, gap: 0 },
          { show: dot("r5", "ax2", [4, -8], "(4; −8)", { color: "#80deea", labelSide: "left" }), set: { id: "tb2", hiCol: 5 }, wait: 1.0 },
          { who: "thay", say: "Nối các điểm bằng đường cong trơn. Vì a âm nên parabol nằm phía dưới trục hoành, O là điểm cao nhất.", sub: "a < 0: parabol phía dưới, O cao nhất", bubble: false, pose: "explain",
            set: { id: "tb2", hiCol: 0 },
            anim: [{ do: "create", id: "g2", at: 0.4, dur: 2.6, item: { type: "graph", axes: "ax2", fn: "-0.5*x^2", x0: -4.08, x1: 4.08, color: "#80deea", width: 9 } }, { do: "flash", id: "r3", at: 3.4, dur: 0.8 }] }
        ] },
      // ---------------- 5. Câu hỏi nhanh ----------------
      { bg: "classroom",
        cast: { thay: { x: 300, pose: "ask", face: "happy" } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: 1, think: 6 } },
          { who: "thay", say: "Đáp án B. Vì a bằng âm ba nhỏ hơn không, nên đồ thị nằm phía dưới trục hoành.", sub: "Đáp án B: a = −3 < 0 → phía dưới trục hoành", pose: "clap", face: "happy", sfx: ["tada"] }
        ] },
      // ---------------- 6. Tóm tắt ----------------
      { bg: "classroom",
        cast: { thay: { x: 300, pose: "idle", face: "happy" } },
        beats: [
          { who: "thay", say: "Tóm lại, để vẽ parabol ta làm ba bước.", sub: "Tóm tắt", pose: "pointup", clear: "board",
            write: { text: "Bước 1: Lập bảng giá trị", size: 70 } },
          { who: "thay", say: "Lập bảng giá trị, biểu diễn các điểm, rồi nối bằng đường cong trơn.", sub: "Lập bảng – Biểu diễn điểm – Nối cong trơn", pose: "write", hold: "chalk",
            write: [{ text: "Bước 2: Biểu diễn các điểm", size: 70 }, { text: "Bước 3: Nối bằng đường cong trơn", size: 70, box: true }] },
          { who: "thay", say: "Các em về nhà vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé. Chào các em!", sub: "Bài tập: vẽ đồ thị y = ½x²", pose: "wave", face: "happy" },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
