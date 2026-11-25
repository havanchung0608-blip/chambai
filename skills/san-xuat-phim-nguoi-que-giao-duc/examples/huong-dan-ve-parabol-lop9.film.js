// Video hướng dẫn: Vẽ đồ thị hàm số y = ax² (a ≠ 0) — Toán 9 (Kết nối tri thức) — BẢN HÀNH ĐỘNG
// Thầy Chung không đứng yên: nhảy lên bảng giá trị thay số, "đá" kết quả xuống ô, ném điểm lên mặt phẳng toạ độ,
// trượt ván dọc parabol để vẽ đồ thị (máng trượt khi a > 0, ngọn đồi khi a < 0), vấp ngã ở "góc nhọn" khi nối sai.
(function () {
  const mapper = (A) => (x, y) => [A.x - A.w / 2 + ((x - A.xmin) / (A.xmax - A.xmin)) * A.w, A.y + A.h / 2 - ((y - A.ymin) / (A.ymax - A.ymin)) * A.h];
  const TEACHER = { name: "Thầy Chung", role: "giao-vien", voice: "nam", hair: "short", skirt: false, shirt: "#1e88e5", glasses: true };
  const SC = 0.56;                       // người que nhỏ lại để đứng trên bảng, trượt trên đồ thị
  const TB_Y = 420;                      // mép trên bảng giá trị (thầy đứng trên mép này)
  const col = (i) => 60 + 300 + 65 + 130 * i;   // tâm cột x thứ i (0..4)
  const AX1 = { id: "ax", type: "axes", x: 1450, y: 580, w: 760, h: 600, xmin: -3, xmax: 3, ymin: -0.5, ymax: 8.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y" };
  const AX2 = { id: "ax2", type: "axes", x: 1460, y: 600, w: 780, h: 600, xmin: -5, xmax: 5, ymin: -8.5, ymax: 0.5, step: 1, stepY: 2, size: 56, xlabel: "x", ylabel: "y" };
  const M1 = mapper(AX1), M2 = mapper(AX2);
  const P1 = [[-2, 8], [-1, 2], [0, 0], [1, 2], [2, 8]];
  const P2 = [[-4, -8], [-2, -2], [0, 0], [2, -2], [4, -8]];
  const f1 = (x) => 2 * x * x, f2 = (x) => -0.5 * x * x;
  const label = (p) => p[0] === 0 && p[1] === 0 ? "O" : `(${String(p[0]).replace("-", "−")}; ${String(p[1]).replace("-", "−")})`;
  const hop = (i, dur) => ({ move: { who: "thay", to: col(i), y: TB_Y, dur: dur || 0.55, style: "jump", height: 110 }, gap: 0 });
  const kick = (tb, n) => ({ act: { thay: { pose: "kick", snap: 0.1 } }, tween: { id: tb, revealY: n, dur: 0.35 }, sfx: ["pop"], wait: 0.5, gap: 0 });
  // ném điểm: từ tay thầy (đứng trên cột i) bay theo cung tới đúng toạ độ, chạm là "bụp"
  // biểu diễn điểm kiểu Manim: thầy "đá" cột → x bay xuống Ox, y bay sang Oy → đường gióng mọc → điểm bung + nhãn
  const toss = (ax, p, i, color, side, last) => ({
    act: { thay: { pose: "kick", snap: 0.1 } },
    plot: { ax, at: p, table: ax === "ax" ? "tb" : "tb2", col: i, id: (ax === "ax" ? "p" : "r") + i, color, label: label(p), labelSide: side, dur: 2.4 },
    wait: last ? 2.6 : 1.75, gap: 0 });

  window.FILM = {
    title: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)",
    subtitle: "Toán 9 · Thầy Chung hướng dẫn",
    file: "huong-dan-ve-parabol-lop9",
    watermark: "Thầy Hà Văn Chung",
    music: "intro",
    cast: { thay: TEACHER },
    scenes: [
      // ================= 1. MỞ ĐẦU: chạy vào lớp, viết tính chất =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: -200, pose: "idle", face: "happy" } },
        beats: [
          { title: { text: "VẼ ĐỒ THỊ HÀM SỐ y = ax²", sub: "Toán 9 · Thầy Chung hướng dẫn", dur: 3.2 }, sfx: ["bell"] },
          { move: { who: "thay", to: 330, dur: 1.6, style: "run" }, gap: 0 },
          { move: { who: "thay", by: 0, dur: 1.0, style: "jump", height: 120 }, act: { thay: { pose: "cheer", face: "happy" } }, gap: 0.1 },
          { who: "thay", say: "Chào các em! Hôm nay thầy hướng dẫn các em vẽ đồ thị hàm số i dài bằng a ích bình phương, với a khác không.", sub: "Vẽ đồ thị hàm số y = ax² (a ≠ 0)", pose: "wave", face: "happy" },
          { who: "thay", say: "Đồ thị là một parabol đỉnh O, nhận trục O y làm trục đối xứng.", sub: "Parabol đỉnh O, trục đối xứng Oy", pose: "write", hold: "chalk",
            write: [{ text: "y = ax² (a ≠ 0): parabol đỉnh O", size: 68 }, { text: "• Trục đối xứng: Oy", size: 64 }] },
          { who: "thay", say: "a dương thì đồ thị nằm trên trục hoành, a âm thì nằm dưới trục hoành.", sub: "a > 0: trên trục hoành · a < 0: dưới trục hoành", pose: "write",
            write: [{ text: "• a > 0: trên trục hoành, O thấp nhất", size: 62, color: "#ffd54f" }, { text: "• a < 0: dưới trục hoành, O cao nhất", size: 62, color: "#ff8a80" }] },
          { move: { who: "thay", to: 420, dur: 0.5 }, gap: 0 },
          { who: "thay", say: "Nhớ ba bước: lập bảng, biểu diễn điểm, nối đường cong. Nào, vào việc thôi!", sub: "Lập bảng → Biểu diễn điểm → Nối", pose: "pointup", hold: null, emote: { who: "thay", icon: "idea" },
            write: { text: "Lập bảng → Biểu diễn điểm → Nối", size: 66, box: true }, sfx: ["ding"] },
          { move: { who: "thay", to: 2150, dur: 1.4, style: "run" }, sfx: [{ name: "whoosh", at: 0.2 }], gap: 0 }
        ] },

      // ================= 2. VÍ DỤ 1: y = 2x² — nhảy trên bảng, ném điểm, trượt máng =================
      { bg: "manimgrid", trans: "wipe",
        cast: { thay: { x: -120, pose: "idle", face: "happy", scale: SC } },
        beats: [
          { move: { who: "thay", to: 170, dur: 1.2, style: "run" }, gap: 0 },
          { who: "thay", say: "Ví dụ một: vẽ đồ thị hàm số i dài bằng hai ích bình phương.", sub: "Ví dụ 1: y = 2x²", bubble: false, pose: "wave" },
          { who: "thay", say: "Bước một: lập bảng giá trị. Thầy nhảy lên bảng để thay số nhé!", sub: "Bước 1: Lập bảng giá trị", bubble: false, cam: { x: 560, y: 440, zoom: 1.35, dur: 1.4 },
            show: { id: "tb", type: "table", x: 60, y: TB_Y, rows: [["x", "-2", "-1", "0", "1", "2"], ["y = 2x^2", "8", "2", "0", "2", "8"]], cw0: 300, cw: 130, ch: 112, size: 66, revealX: 0, revealY: 0, cellColors: { 1: "#ffeb3b" }, anim: "create", dur: 0.8 },
            tween: { id: "tb", revealX: 5, dur: 2.0 } },
          hop(0, 0.9),
          { who: "thay", say: "Ích bằng âm hai: i dài bằng hai nhân bình phương của âm hai, bằng tám.", sub: "x = −2: y = 2·(−2)² = 8", bubble: false, pose: "explain",
            show: { id: "calc", type: "text", text: "y = 2·(−2)^2 = 8", x: 560, y: 112, size: 72, color: "#ffeb3b", anim: "write", dur: 1.2 } },
          kick("tb", 1),
          hop(1),
          { who: "thay", say: "Âm một: bằng hai.", sub: "x = −1: y = 2·(−1)² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·(−1)^2 = 2" }, dur: 0.5 } },
          kick("tb", 2),
          hop(2),
          { who: "thay", say: "Không: bằng không.", sub: "x = 0: y = 2·0² = 0", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·0^2 = 0" }, dur: 0.5 } },
          kick("tb", 3),
          hop(3),
          { who: "thay", say: "Một: bằng hai.", sub: "x = 1: y = 2·1² = 2", bubble: false, pose: "explain", anim: { do: "transform", id: "calc", to: { text: "y = 2·1^2 = 2" }, dur: 0.5 } },
          kick("tb", 4),
          hop(4),
          { who: "thay", say: "Hai: bằng tám. Xong bảng giá trị!", sub: "x = 2: y = 2·2² = 8", bubble: false, pose: "cheer", face: "happy", anim: { do: "transform", id: "calc", to: { text: "y = 2·2^2 = 8" }, dur: 0.5 } },
          kick("tb", 5),
          { who: "thay", say: "Bước hai: thầy đá từng cột cho các điểm bay lên mặt phẳng tọa độ!", sub: "Bước 2: Biểu diễn các điểm", bubble: false, pose: "point", cam: { x: 960, y: 540, zoom: 1, dur: 1.0 },
            anim: { do: "fadeout", id: "calc", dur: 0.5 }, show: Object.assign({}, AX1, { anim: "create", dur: 1.2 }) },
          toss("ax", P1[4], 4, "#fc6255", "left"),
          hop(3, 0.45), toss("ax", P1[3], 3, "#fc6255"),
          hop(2, 0.45), toss("ax", P1[2], 2, "#fc6255"),
          hop(1, 0.45), toss("ax", P1[1], 1, "#fc6255"),
          hop(0, 0.45), toss("ax", P1[0], 0, "#fc6255", undefined, true),
          { who: "thay", say: "Các cặp điểm đối xứng nhau qua trục O y.", sub: "Các cặp điểm đối xứng qua Oy", bubble: false, pose: "point", face: "happy",
            set: { id: "tb", hiCol: 0 }, anim: [{ do: "flash", id: "p0", dur: 0.7 }, { do: "flash", id: "p4", dur: 0.7 }, { do: "flash", id: "p1", at: 1.0, dur: 0.7 }, { do: "flash", id: "p3", at: 1.0, dur: 0.7 }] },
          { who: "thay", say: "Bước ba: lên ván trượt nào!", sub: "Bước 3: Nối bằng đường cong trơn", bubble: false, pose: "cheer",
            move: { who: "thay", to: M1(-2.05, f1(-2.05))[0], y: M1(-2.05, f1(-2.05))[1], dur: 1.1, style: "jump", height: 200 }, act: { thay: { skate: true } } },
          { who: "thay", say: "Wiii! Ván trượt đi qua đúng năm điểm, vẽ nên một đường cong trơn: parabol!", sub: "Đi qua cả 5 điểm → đường cong trơn: parabol", bubble: false, pose: "skate",
            show: { id: "g1", type: "graph", axes: "ax", fn: "2*x^2", x0: -2.05, x1: 2.05, color: "#ffeb3b", width: 10, _prog: 0, pop: false, sfx: false },
            ride: { who: "thay", graph: "g1", from: -2.05, to: 2.05, dur: 4.2 }, cam: { x: 1430, y: 560, zoom: 1.2, dur: 1.0 },
            anim: [{ do: "flash", id: "p1", at: 1.5, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p2", at: 2.1, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p3", at: 2.7, dur: 0.5, sfx: "ding" }, { do: "flash", id: "p4", at: 4.0, dur: 0.5, sfx: "ding" }] },
          { who: "thay", say: "Trượt về đáy máng: O là điểm thấp nhất, vì a bằng hai lớn hơn không.", sub: "a = 2 > 0: O là điểm thấp nhất", bubble: false, pose: "skate", face: "happy",
            ride: { who: "thay", graph: "g1", from: 2.05, to: 0, dur: 2.4, ease: "out", trail: false },
            anim: { do: "flash", id: "p2", at: 2.4, dur: 0.8 } },
          { move: { who: "thay", by: 0, dur: 0.9, style: "jump", height: 150 }, act: { thay: { pose: "cheer" } }, sfx: ["tada"], cam: { x: 960, y: 540, zoom: 1, dur: 0.9 }, gap: 0.2 }
        ] },

      // ================= 3. LỖI HAY GẶP: trượt trên đường gấp khúc → vấp ngã =================
      { bg: "manimgrid", trans: "fade",
        cast: { thay: { x: M1(-2, 8)[0], y: M1(-2, 8)[1], scale: SC * 0.9, pose: "skate", face: "happy", skate: true } },
        items: [Object.assign({}, AX1)].concat(P1.map((p, i) => ({ id: "q" + i, type: "dot", ax: "ax", at: p, r: 17, color: "#fc6255" }))),
        beats: [
          { who: "thay", say: "Chú ý lỗi hay gặp: nối các điểm bằng đoạn thẳng. Thử trượt xem sao!", sub: "Lỗi hay gặp: nối bằng đoạn thẳng", bubble: false,
            show: { id: "bad", type: "poly", points: P1.map((p) => M1(p[0], p[1])), close: false, color: "#ff5252", width: 7, anim: "create", dur: 1.4 } },
          { ride: { who: "thay", path: [M1(-2, 8), M1(-1, 2), M1(0, 0)], dur: 1.5, ease: "in" }, gap: 0 },
          { act: { thay: { pose: "lie", skate: false, tilt: 0, face: "surprised", snap: 0.15 } }, move: { who: "thay", by: 70, dur: 0.5, style: "slide" },
            fx: { type: "hit", on: "thay", part: "chest", text: "OÁI!", dur: 0.7 }, shake: { amp: 20, dur: 0.35 }, sfx: [{ name: "fall" }, { name: "boing", at: 0.15 }],
            show: { id: "x1", type: "cross", x: 870, y: 300, scale: 1.1, sfx: "wrong" }, wait: 1.0, gap: 0 },
          { who: "thay", say: "Ối! Vấp ngã ở góc nhọn rồi. Đồ thị parabol không có góc nhọn nên nối như vậy là sai.", sub: "Sai! Parabol không có góc nhọn", bubble: false, act: { thay: { pose: "facepalm", face: "sad" } },
            anim: { do: "fadeout", id: "bad", at: 2.5, dur: 0.6 } },
          { move: { who: "thay", to: M1(-2, 8)[0], y: M1(-2, 8)[1], dur: 1.0, style: "jump", height: 180 }, act: { thay: { pose: "idle", face: "happy", skate: true } }, hide: "x1", gap: 0 },
          { who: "thay", say: "Nối bằng đường cong trơn thì trượt êm ru!", sub: "Đúng: nối bằng đường cong trơn", bubble: false, pose: "skate", face: "happy",
            show: [{ id: "good", type: "graph", axes: "ax", fn: "2*x^2", x0: -2, x1: 2, color: "#69f0ae", width: 10, _prog: 0, pop: false, sfx: false }, { id: "ok", type: "check", x: 870, y: 300, scale: 1.1, sfx: "correct" }],
            ride: { who: "thay", graph: "good", from: -2, to: 2, dur: 3.4 } }
        ] },

      // ================= 4. VÍ DỤ 2: y = −½x² — ngọn đồi, cắm cờ ở đỉnh =================
      { bg: "manimgrid", trans: "wipe",
        cast: { thay: { x: -120, pose: "idle", face: "happy", scale: SC } },
        beats: [
          { move: { who: "thay", to: col(0), y: TB_Y, dur: 1.6, style: "jump", height: 260 },
            show: { id: "tb2", type: "table", x: 60, y: TB_Y, rows: [["x", "-4", "-2", "0", "2", "4"], ["y = -\\frac{1}{2}x^2", "-8", "-2", "0", "-2", "-8"]], cw0: 300, cw: 130, ch: 130, size: 62, revealX: 0, revealY: 0, cellColors: { 1: "#80deea" }, anim: "create", dur: 0.8 }, gap: 0 },
          { who: "thay", say: "Ví dụ hai: i dài bằng âm một phần hai ích bình phương. Mẹo: chọn ích chẵn để i dài là số nguyên.", sub: "Ví dụ 2: y = −½x² · Mẹo: chọn x chẵn", bubble: false, pose: "pointup", emote: { who: "thay", icon: "idea" }, cam: { x: 560, y: 450, zoom: 1.35, dur: 1.4 },
            tween: { id: "tb2", revealX: 5, dur: 3.0 } },
          { who: "thay", say: "Thay vào, ta được âm tám, âm hai, không, âm hai, âm tám.", sub: "y = −8; −2; 0; −2; −8", bubble: false, pose: "explain",
            move: { who: "thay", to: col(4), y: TB_Y, dur: 3.2, style: "run" }, tween: { id: "tb2", revealY: 5, dur: 3.6 } },
          { show: Object.assign({}, AX2, { anim: "create", dur: 1.0 }), sfx: ["whoosh"], cam: { x: 960, y: 540, zoom: 1, dur: 1.0 }, wait: 1.0, gap: 0 },
          toss("ax2", P2[4], 4, "#80deea", "left"),
          hop(3, 0.45), toss("ax2", P2[3], 3, "#80deea"),
          hop(2, 0.45), toss("ax2", P2[2], 2, "#80deea"),
          hop(1, 0.45), toss("ax2", P2[1], 1, "#80deea"),
          hop(0, 0.45), toss("ax2", P2[0], 0, "#80deea", undefined, true),
          { set: { id: "tb2", hiCol: 0 }, move: { who: "thay", to: M2(-4.05, f2(-4.05))[0], y: M2(-4.05, f2(-4.05))[1], dur: 1.2, style: "jump", height: 160 }, act: { thay: { skate: true } }, gap: 0.1 },
          { who: "thay", say: "Lần này parabol là một ngọn đồi. Leo dốc nào!", sub: "a < 0: parabol như ngọn đồi", bubble: false, pose: "skate",
            show: { id: "g2", type: "graph", axes: "ax2", fn: "-0.5*x^2", x0: -4.05, x1: 4.05, color: "#80deea", width: 10, _prog: 0, pop: false, sfx: false },
            ride: { who: "thay", graph: "g2", from: -4.05, to: 0, dur: 3.4, ease: "out" }, cam: { x: 1430, y: 560, zoom: 1.2, dur: 1.2 } },
          { who: "thay", say: "Lên tới đỉnh O rồi! Vì a âm nên O là điểm cao nhất.", sub: "a = −½ < 0: O là điểm cao nhất", bubble: false, act: { thay: { pose: "victory", hold: "flag", face: "happy" } },
            emote: { who: "thay", icon: "!" }, anim: { do: "flash", id: "r2", at: 0.2, dur: 0.8 }, sfx: [{ name: "victory", vol: 0.7 }] },
          { who: "thay", say: "Giờ thì lao xuống dốc. Wiii!", sub: "Nối tiếp bằng đường cong trơn", bubble: false, act: { thay: { pose: "skate", hold: null } },
            ride: { who: "thay", graph: "g2", from: 0, to: 4.05, dur: 2.2, ease: "in" }, sfx: [{ name: "whoosh", at: 1.4 }] },
          { move: { who: "thay", by: 160, y: 960, dur: 1.0, style: "jump", height: 120 }, act: { thay: { skate: false, tilt: 0, pose: "cheer" } }, sfx: [{ name: "land", at: 0.9 }], cam: { x: 960, y: 540, zoom: 1, dur: 0.9 }, gap: 0.3 }
        ] },

      // ================= 5. CÂU HỎI NHANH =================
      { bg: "classroom", trans: "iris",
        cast: { thay: { x: 300, pose: "ask", face: "happy" } },
        beats: [
          { who: "thay", say: "Câu hỏi nhanh: đồ thị hàm số i dài bằng âm ba ích bình phương nằm ở đâu?", sub: "Câu hỏi nhanh", pose: "ask",
            quiz: { q: "Đồ thị y = −3x² nằm ở đâu?", options: ["Phía trên trục hoành", "Phía dưới trục hoành", "Bên phải trục tung", "Đi qua điểm (1; 3)"], answer: 1, think: 6 },
            move: { who: "thay", to: 360, dur: 1.0 } },
          { who: "thay", say: "Đáp án B! Vì a bằng âm ba nhỏ hơn không, nên đồ thị nằm phía dưới trục hoành.", sub: "Đáp án B: a = −3 < 0 → dưới trục hoành", pose: "cheer", face: "happy", sfx: ["tada"],
            move: { who: "thay", by: 0, dur: 0.9, style: "jump", height: 140 } }
        ] },

      // ================= 6. TÓM TẮT: trượt ván dọc bảng =================
      { bg: "classroom",
        cast: { thay: { x: 300, pose: "idle", face: "happy", skate: true } },
        beats: [
          { who: "thay", say: "Tóm lại, vẽ parabol có ba bước.", sub: "Tóm tắt", pose: "pointup", clear: "board",
            write: { text: "Bước 1: Lập bảng giá trị", size: 72 }, move: { who: "thay", to: 700, dur: 2.0, style: "skate", keep: true } },
          { who: "thay", say: "Lập bảng giá trị, biểu diễn các điểm, rồi nối bằng đường cong trơn.", sub: "Lập bảng – Biểu diễn điểm – Nối cong trơn", pose: "skate",
            write: [{ text: "Bước 2: Biểu diễn các điểm", size: 72 }, { text: "Bước 3: Nối bằng đường cong trơn", size: 72, box: true }],
            move: { who: "thay", to: 1500, dur: 3.5, style: "skate", keep: true } },
          { who: "thay", say: "Về nhà các em vẽ đồ thị hàm số i dài bằng một phần hai ích bình phương nhé. Chào các em!", sub: "Bài tập: vẽ đồ thị y = ½x²", act: { thay: { skate: false, pose: "wave", face: "happy" } },
            move: { who: "thay", by: 0, dur: 0.8, style: "jump", height: 120 } },
          { title: { text: "Chúc các em học tốt!", sub: "Âm thanh, nhạc nền: TiengDong.com · Giọng đọc: VieNeu-TTS", dur: 3.4, bgColor: "rgba(20,20,30,.9)", color: "#ffd54f" }, sfx: ["ding"] }
        ] }
    ]
  };
})();
