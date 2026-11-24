/* ==========================================================================
   STICKFILM ENGINE — bộ máy dựng phim người que giáo dục (canvas 1920×1080)
   - Một hàm renderAt(t) vẽ đúng khung hình tại thời điểm t (tua, xuất MP4 được)
   - Nhân vật có khung xương, nội suy tư thế, đi/chạy/nhảy, mắt chớp, miệng nói
   - Nét vẽ "rung tay" (line boil) 8 hình/giây như phim vẽ tay
   - Chữ/công thức mini-TeX vẽ trực tiếp lên canvas, hiện ra như đang viết
   - Âm thanh tổng hợp bằng Web Audio, giọng đọc Web Speech (vi-VN)
   ========================================================================== */
(function () {
  "use strict";
  const W = 1920, H = 1080, GROUND = 960;
  const FONT = '"Times New Roman", Times, serif';
  const INK = "#1d1d1f";

  /* ----------------------------- tiện ích ----------------------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const rad = (d) => (d * Math.PI) / 180;
  const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  let BOIL = 0;          // khung "rung" hiện tại (đổi 8 lần/giây)
  let BOIL_AMP = 1.3;    // biên độ rung nét
  function jit(seed) { return (hash(seed * 13.37 + BOIL * 7.77) - 0.5) * 2 * BOIL_AMP; }

  /* Vẽ đường gấp khúc kiểu tay vẽ */
  function hline(ctx, pts, seed, close) {
    if (pts.length < 2) return;
    ctx.beginPath();
    const p = pts.map((q, i) => [q[0] + jit(seed + i * 2.1), q[1] + jit(seed + i * 3.3 + 1)]);
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    if (close) ctx.closePath();
    ctx.stroke();
  }
  function hcircle(ctx, x, y, r, seed, fill, stroke) {
    ctx.beginPath();
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r + jit(seed + (i % n) * 1.7) * 0.6;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke !== false) ctx.stroke();
  }
  function hrect(ctx, x, y, w, h, seed, fill) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    hline(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, true);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  /* --------------------- mini-TeX: chữ + công thức --------------------- */
  const SYM = {
    cdot: "·", times: "×", div: ":", pi: "π", le: "≤", ge: "≥", leq: "≤", geq: "≥", ne: "≠", neq: "≠",
    approx: "≈", pm: "±", angle: "∠", deg: "°", circ: "°", Rightarrow: "⇒", rightarrow: "→", to: "→",
    infty: "∞", alpha: "α", beta: "β", gamma: "γ", Delta: "Δ", in: "∈", notin: "∉", subset: "⊂",
    parallel: "//", perp: "⊥", triangle: "Δ", sim: "∽", backsim: "∽", cdots: "⋯", ldots: "…", quad: "  ", ",": " ",
    left: "", right: "", "%": "%", "{": "{", "}": "}", N: "ℕ", Z: "ℤ", Q: "ℚ", R: "ℝ"
  };
  function parseTex(s) {
    let i = 0;
    function group() {
      const out = [];
      while (i < s.length) {
        const c = s[i];
        if (c === "}") { i++; return out; }
        if (c === "{") { i++; out.push({ k: "g", c: group() }); continue; }
        if (c === "^" || c === "_") { i++; out.push({ k: c === "^" ? "sup" : "sub", c: arg() }); continue; }
        if (c === "\\") {
          i++;
          let name = "";
          if (/[a-zA-Z]/.test(s[i])) { while (i < s.length && /[a-zA-Z]/.test(s[i])) name += s[i++]; }
          else name = s[i++];
          if (name === "frac" || name === "dfrac") { const a = arg(), b = arg(); out.push({ k: "frac", a, b }); continue; }
          if (name === "sqrt") { out.push({ k: "sqrt", c: arg() }); continue; }
          if (name === "hat" || name === "widehat") { out.push({ k: "hat", c: arg() }); continue; }
          if (name === "overline" || name === "bar") { out.push({ k: "over", c: arg() }); continue; }
          if (name === "text" || name === "mathrm") { out.push({ k: "g", c: arg() }); continue; }
          if (name === "color") { const col = flat(arg()); out.push({ k: "col", col, c: arg() }); continue; }
          out.push({ k: "t", t: SYM[name] != null ? SYM[name] : name });
          continue;
        }
        let t = "";
        while (i < s.length && !"{}^_\\".includes(s[i])) t += s[i++];
        out.push({ k: "t", t });
      }
      return out;
    }
    function arg() {
      while (s[i] === " ") i++;
      if (s[i] === "{") { i++; return group(); }
      if (s[i] === "\\") { const save = i; i++; let n = ""; while (/[a-zA-Z]/.test(s[i])) n += s[i++]; if (!n) n = s[i++]; return [{ k: "t", t: SYM[n] != null ? SYM[n] : (i = save, s[i++]) }]; }
      return [{ k: "t", t: s[i++] || "" }];
    }
    function flat(nodes) { return nodes.map((n) => n.t || "").join(""); }
    return group();
  }
  function layout(ctx, nodes, size) {
    // trả về hộp {w, asc, desc, draw(x, baseline)}
    const boxes = nodes.map((n) => box(ctx, n, size));
    let w = 0, asc = size * 0.72, desc = size * 0.22;
    boxes.forEach((b) => { w += b.w; asc = Math.max(asc, b.asc); desc = Math.max(desc, b.desc); });
    return { w, asc, desc, draw(x, y, col) { let cx = x; boxes.forEach((b) => { b.draw(cx, y, col); cx += b.w; }); } };
  }
  function box(ctx, n, size) {
    if (n.k === "t") {
      ctx.font = `${size}px ${FONT}`;
      const w = ctx.measureText(n.t).width;
      return { w, asc: size * 0.72, desc: size * 0.22, draw(x, y, col) { ctx.font = `${size}px ${FONT}`; ctx.fillStyle = col; ctx.fillText(n.t, x, y); } };
    }
    if (n.k === "g") return layout(ctx, n.c, size);
    if (n.k === "col") { const b = layout(ctx, n.c, size); return { ...b, draw(x, y) { b.draw(x, y, n.col); } }; }
    if (n.k === "sup" || n.k === "sub") {
      const b = layout(ctx, n.c, size * 0.62), up = n.k === "sup";
      return { w: b.w + size * 0.04, asc: up ? size * 0.42 + b.asc : size * 0.5, desc: up ? size * 0.2 : size * 0.22 + b.desc,
        draw(x, y, col) { b.draw(x + size * 0.02, y + (up ? -size * 0.42 : size * 0.22), col); } };
    }
    if (n.k === "frac") {
      const s2 = size * 0.82, a = layout(ctx, n.a, s2), b = layout(ctx, n.b, s2), w = Math.max(a.w, b.w) + size * 0.3;
      const mid = size * 0.3;
      return { w: w + size * 0.1, asc: mid + a.desc + a.asc + size * 0.1, desc: -mid + b.asc + b.desc + size * 0.12,
        draw(x, y, col) {
          a.draw(x + (w - a.w) / 2 + size * 0.05, y - mid - a.desc - size * 0.06, col);
          b.draw(x + (w - b.w) / 2 + size * 0.05, y - mid + b.asc + size * 0.1, col);
          ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, size * 0.05);
          ctx.beginPath(); ctx.moveTo(x + size * 0.05, y - mid); ctx.lineTo(x + w + size * 0.05, y - mid); ctx.stroke();
        } };
    }
    if (n.k === "sqrt") {
      const b = layout(ctx, n.c, size), pad = size * 0.5;
      return { w: b.w + pad + size * 0.1, asc: b.asc + size * 0.14, desc: b.desc,
        draw(x, y, col) {
          b.draw(x + pad, y, col);
          ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, size * 0.05);
          const top = y - b.asc - size * 0.08;
          ctx.beginPath(); ctx.moveTo(x + size * 0.04, y - size * 0.28); ctx.lineTo(x + size * 0.16, y - size * 0.36);
          ctx.lineTo(x + size * 0.3, y + b.desc * 0.6); ctx.lineTo(x + pad - size * 0.06, top); ctx.lineTo(x + pad + b.w + size * 0.06, top); ctx.stroke();
        } };
    }
    if (n.k === "hat" || n.k === "over") {
      const b = layout(ctx, n.c, size);
      return { w: b.w, asc: b.asc + size * 0.2, desc: b.desc,
        draw(x, y, col) {
          b.draw(x, y, col); ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, size * 0.045);
          const top = y - b.asc - size * 0.06; ctx.beginPath();
          if (n.k === "hat") { ctx.moveTo(x + b.w * 0.15, top + size * 0.05); ctx.lineTo(x + b.w / 2, top - size * 0.1); ctx.lineTo(x + b.w * 0.85, top + size * 0.05); }
          else { ctx.moveTo(x, top); ctx.lineTo(x + b.w, top); }
          ctx.stroke();
        } };
    }
    return { w: 0, asc: 0, desc: 0, draw() {} };
  }
  const texCache = new Map();
  /* Vẽ chữ/công thức; progress 0..1 = mức "đã viết" (lộ dần trái → phải, có bút) */
  function drawTex(ctx, str, x, y, size, col, align, progress, pen) {
    const key = str;
    let nodes = texCache.get(key);
    if (!nodes) { nodes = parseTex(String(str)); texCache.set(key, nodes); }
    const L = layout(ctx, nodes, size);
    let x0 = x;
    if (align === "center") x0 = x - L.w / 2; else if (align === "right") x0 = x - L.w;
    const p = progress == null ? 1 : clamp(progress, 0, 1);
    ctx.save();
    if (p < 1) { ctx.beginPath(); ctx.rect(x0 - 10, y - L.asc - 20, (L.w + 20) * p, L.asc + L.desc + 40); ctx.clip(); }
    L.draw(x0, y, col);
    ctx.restore();
    if (pen && p > 0 && p < 1) drawPen(ctx, x0 + L.w * p, y - size * 0.25, pen);
    return { x: x0, w: L.w, asc: L.asc, desc: L.desc };
  }
  function drawPen(ctx, x, y, kind) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rad(-35));
    if (kind === "chalk") { ctx.fillStyle = "#f7f7ef"; ctx.fillRect(-6, -40, 12, 40); }
    else { ctx.fillStyle = "#2b59c3"; roundRect(ctx, -9, -78, 18, 64, 5); ctx.fill(); ctx.fillStyle = "#222"; ctx.beginPath(); ctx.moveTo(-9, -14); ctx.lineTo(9, -14); ctx.lineTo(0, 2); ctx.fill(); }
    ctx.restore();
  }
  function wrapText(ctx, text, maxW, size) {
    ctx.font = `${size}px ${FONT}`;
    const words = String(text).split(/\s+/), lines = []; let cur = "";
    words.forEach((w) => { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  }

  /* ---------------------------- tư thế ---------------------------- */
  // Góc tính bằng độ, 0 = thẳng xuống, dương = về phía trước mặt, 180 = thẳng lên.
  // Mỗi tư thế: fa (tay trước: [cánh tay, cẳng tay]), ba (tay sau), fl/bl (chân: [đùi, cẳng chân]),
  // lean (nghiêng thân), head (cúi/ngẩng đầu), lift (nhấc người lên, px)
  const POSES = {
    idle: () => ({ fa: [14, 4], ba: [-14, -4], fl: [7, 0], bl: [-7, 0] }),
    wave: (t) => ({ fa: [150, 165 + Math.sin(t * 10) * 22], ba: [-12, -4], fl: [7, 0], bl: [-7, 0] }),
    point: () => ({ fa: [96, 94], ba: [-14, -4], fl: [10, 0], bl: [-8, 0], lean: 3 }),
    pointup: () => ({ fa: [150, 172], ba: [-14, -4], fl: [7, 0], bl: [-7, 0] }),
    think: (t) => ({ fa: [12, 160], ba: [25, 95], fl: [7, 0], bl: [-7, 0], head: 6 + Math.sin(t * 1.5) * 3 }),
    ask: () => ({ fa: [62, 105], ba: [-62, -105], fl: [9, 0], bl: [-9, 0], head: -4 }),
    explain: (t) => ({ fa: [55 + Math.sin(t * 3) * 10, 95 + Math.sin(t * 3) * 12], ba: [-14, -4], fl: [8, 0], bl: [-8, 0] }),
    cheer: (t) => ({ fa: [138, 158], ba: [-138, -158], fl: [10, 0], bl: [-10, 0], lift: Math.abs(Math.sin(t * 6)) * 14, head: -6 }),
    yes: (t) => ({ fa: [20, 150 + Math.sin(t * 9) * 8], ba: [-14, -4], fl: [7, 0], bl: [-7, 0], head: -4 }),
    write: (t) => ({ fa: [112 + Math.sin(t * 9) * 5, 140 + Math.sin(t * 11) * 9], ba: [-14, -4], fl: [10, 0], bl: [-8, 0], lean: 4 }),
    sad: () => ({ fa: [4, 0], ba: [-4, 0], fl: [4, 0], bl: [-4, 0], lean: 9, head: 16 }),
    surprised: (t) => ({ fa: [128, 150], ba: [-128, -150], fl: [12, 0], bl: [-12, 0], head: -8, lift: Math.max(0, Math.sin(t * 5)) * 4 }),
    shrug: () => ({ fa: [42, 122], ba: [-42, -122], fl: [7, 0], bl: [-7, 0], head: 6 }),
    clap: (t) => ({ fa: [60, 100 + Math.sin(t * 16) * 14], ba: [58, 112 - Math.sin(t * 16) * 14], fl: [7, 0], bl: [-7, 0] }),
    hold: () => ({ fa: [42, 96], ba: [40, 102], fl: [7, 0], bl: [-7, 0] }),
    give: () => ({ fa: [80, 92], ba: [-14, -4], fl: [12, 0], bl: [-8, 0], lean: 5 }),
    facepalm: () => ({ fa: [30, 172], ba: [-10, -4], fl: [7, 0], bl: [-7, 0], head: 14 }),
    angry: (t) => ({ fa: [-40, 40], ba: [40, -40], fl: [12, 0], bl: [-12, 0], lift: Math.abs(Math.sin(t * 14)) * 3 }),
    sit: () => ({ fa: [35, 75], ba: [30, 70], fl: [90, 2], bl: [86, -2] }),
    sitthink: (t) => ({ fa: [30, 165], ba: [30, 70], fl: [90, 2], bl: [86, -2], head: 6 + Math.sin(t * 1.5) * 3 }),
    sithand: (t) => ({ fa: [165, 175 + Math.sin(t * 8) * 6], ba: [30, 70], fl: [90, 2], bl: [86, -2] }),
    lie: () => ({ fa: [14, 4], ba: [-14, -4], fl: [7, 0], bl: [-7, 0], rot: -90 }),
    jump: (t) => ({ fa: [138, 158], ba: [-138, -158], fl: [40, -10], bl: [-10, -50], lift: 60 + Math.sin(t * 6) * 30 }),
    nod: (t) => ({ fa: [14, 4], ba: [-14, -4], fl: [7, 0], bl: [-7, 0], head: Math.sin(t * 8) * 9 })
  };
  function walkPose(phase, run) {
    const s = Math.sin(phase), c = Math.cos(phase), A = run ? 42 : 26;
    const knee = (v) => Math.max(0, v);
    return {
      fa: [-s * A * 0.9 + (run ? 30 : 0), -s * A * 0.9 + (run ? 95 : 10)],
      ba: [s * A * 0.9 + (run ? 30 : 0), s * A * 0.9 + (run ? 95 : 10)],
      fl: [s * A, s * A - knee(-c) * (run ? 70 : 40)],
      bl: [-s * A, -s * A - knee(c) * (run ? 70 : 40)],
      lean: run ? 12 : 3,
      lift: Math.abs(c) * (run ? 10 : 5)
    };
  }
  function blendPose(a, b, k) {
    const o = {};
    ["fa", "ba", "fl", "bl"].forEach((key) => { o[key] = [lerp(a[key][0], b[key][0], k), lerp(a[key][1], b[key][1], k)]; });
    ["lean", "head", "lift", "rot"].forEach((key) => { o[key] = lerp(a[key] || 0, b[key] || 0, k); });
    return o;
  }
  function poseAt(name, t) { return (POSES[name] || POSES.idle)(t); }

  /* ------------------------- vẽ nhân vật ------------------------- */
  function drawFigure(ctx, ch, life) {
    const S = ch.scale || 1, P = ch._pose, dir = ch.flip ? -1 : 1;
    const LEN = { torso: 132, neck: 12, ua: 72, fa: 66, th: 86, sh: 86, head: 40 };
    const pt = (x, y, L, a) => [x + dir * L * Math.sin(rad(a)), y + L * Math.cos(rad(a))];
    // dựng xương với hông tại (0,0)
    const lean = P.lean || 0;
    const breath = Math.sin(life * 2.2 + (ch._seed || 0)) * 2.2;
    const hip = [0, 0];
    const neck = pt(0, 0, LEN.torso + breath, 180 - lean);
    const shoulder = pt(neck[0], neck[1], 10, -lean);
    const fE = pt(shoulder[0], shoulder[1], LEN.ua, P.fa[0]), fH = pt(fE[0], fE[1], LEN.fa, P.fa[1]);
    const bE = pt(shoulder[0], shoulder[1], LEN.ua, P.ba[0]), bH = pt(bE[0], bE[1], LEN.fa, P.ba[1]);
    const fK = pt(0, 0, LEN.th, P.fl[0]), fF = pt(fK[0], fK[1], LEN.sh, P.fl[1]);
    const bK = pt(0, 0, LEN.th, P.bl[0]), bF = pt(bK[0], bK[1], LEN.sh, P.bl[1]);
    const headC = pt(neck[0], neck[1], LEN.neck + LEN.head, 180 - lean - (P.head || 0) * 0.3);
    const footY = Math.max(fF[1], bF[1]);
    const seed = ch._seed || 1;
    ctx.save();
    ctx.translate(ch.x, (ch.y || GROUND) - (P.lift || 0) * S);
    ctx.scale(S, S);
    if (P.rot) { ctx.translate(0, -40); ctx.rotate(rad(P.rot) * dir); }
    ctx.translate(0, -footY);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ch.color || INK;
    const LW = 9;
    // bóng dưới chân
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "#000"; ctx.beginPath();
    ctx.ellipse(0, footY + (P.lift || 0) + 6, 58, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // chi sau (mờ hơn một chút cho có chiều sâu)
    ctx.lineWidth = LW; ctx.globalAlpha = 0.85;
    hline(ctx, [hip, bK, bF], seed + 1);
    hline(ctx, [shoulder, bE, bH], seed + 2);
    ctx.globalAlpha = 1;
    // thân (áo màu nếu có)
    // ghế đẩu khi ngồi
    if (/^sit/.test(ch.pose || "")) { ctx.save(); ctx.lineWidth = 6; ctx.fillStyle = "#b07a43"; hrect(ctx, -60, 8, 90, 16, seed + 30, "#b07a43"); hline(ctx, [[-50, 24], [-56, footY]], seed + 31); hline(ctx, [[20, 24], [26, footY]], seed + 32); ctx.restore(); }
    ctx.lineWidth = LW;
    if (ch.shirt) {
      const nx = Math.cos(rad(lean)), ny = -Math.sin(rad(lean)) * dir; // pháp tuyến của sống lưng
      const top = pt(neck[0], neck[1], 4, -lean), bot = pt(0, 0, ch.skirt ? -30 : 6, 180 - lean);
      const wT = 19, wB = ch.skirt ? 44 : 17;
      ctx.save(); ctx.fillStyle = ch.shirt; ctx.lineWidth = 5;
      hline(ctx, [[top[0] - nx * wT, top[1] - ny * wT], [top[0] + nx * wT, top[1] + ny * wT], [bot[0] + nx * wB, bot[1] + ny * wB], [bot[0] - nx * wB, bot[1] - ny * wB]], seed + 9, true);
      ctx.fill(); ctx.stroke(); ctx.restore();
    } else hline(ctx, [hip, neck], seed + 3);
    hline(ctx, [hip, fK, fF], seed + 4);
    hline(ctx, [shoulder, fE, fH], seed + 5);
    // đồ cầm tay
    if (ch.holding) drawHeld(ctx, ch.holding, fH, dir, life);
    // đầu
    hline(ctx, [neck, pt(neck[0], neck[1], LEN.neck + 4, 180 - lean)], seed + 6);
    drawHead(ctx, ch, headC, LEN.head, dir, life, P);
    ctx.restore();
    ch._headTop = [ch.x + headC[0] * S, (ch.y || GROUND) - (P.lift || 0) * S + (headC[1] - footY - LEN.head) * S];
    ch._hand = [ch.x + fH[0] * S, (ch.y || GROUND) - (P.lift || 0) * S + (fH[1] - footY) * S];
  }
  function drawHead(ctx, ch, c, r, dir, life, P) {
    const [x, y] = c, seed = (ch._seed || 1) + 20;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rad((P.head || 0) * 0.5) * dir);
    // tóc sau
    const hc = ch.hairColor || INK;
    if (ch.hair === "long") { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-r - 4, -6); ctx.quadraticCurveTo(-r - 14, r + 36, -dir * 6 - r * 0.2, r + 34); ctx.lineTo(dir * r * 0.6, 0); ctx.closePath(); ctx.fill(); }
    if (ch.hair === "ponytail") { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(-dir * (r + 14), -r * 0.2 + Math.sin(life * 4) * 3, 14, 30, rad(-20 * dir), 0, Math.PI * 2); ctx.fill(); }
    if (ch.hair === "bun") { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(-dir * r * 0.5, -r - 6, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 8; ctx.strokeStyle = ch.color || INK;
    hcircle(ctx, 0, 0, r, seed, ch.skin || "#fffdf8");
    // tóc trước
    ctx.fillStyle = hc;
    if (["short", "long", "ponytail", "bun", "spiky"].includes(ch.hair)) {
      ctx.beginPath(); ctx.arc(0, 0, r + 3, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(dir * r * 0.2, -r * 0.35, -r * 0.95, -r * 0.3); ctx.closePath(); ctx.fill();
      if (ch.hair === "spiky") for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14 - 8, -r + 4); ctx.lineTo(i * 14, -r - 22); ctx.lineTo(i * 14 + 8, -r + 4); ctx.fill(); }
    }
    if (ch.bow) { ctx.fillStyle = ch.bow; ctx.beginPath(); const bx = -dir * r * 0.55, by = -r * 0.85; ctx.moveTo(bx, by); ctx.lineTo(bx - 16, by - 12); ctx.lineTo(bx - 16, by + 12); ctx.closePath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 16, by - 12); ctx.lineTo(bx + 16, by + 12); ctx.closePath(); ctx.fill(); }
    // mặt
    const face = ch.face || "happy";
    const ex = dir * 9, ey = -4;
    const blinkPhase = (life + (ch._seed || 0) * 1.3) % 4.2;
    const blink = blinkPhase < 0.13;
    ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    const eye = (px) => {
      if (blink || face === "happyclosed") { ctx.beginPath(); ctx.moveTo(px - 6, ey); ctx.lineTo(px + 6, ey); ctx.stroke(); return; }
      const er = face === "surprised" ? 7 : 5;
      ctx.beginPath(); ctx.arc(px + dir * 2, ey, er, 0, Math.PI * 2); ctx.fill();
    };
    eye(ex - 13); eye(ex + 13);
    // lông mày theo cảm xúc
    ctx.lineWidth = 4; ctx.beginPath();
    if (face === "angry") { ctx.moveTo(ex - 22, ey - 18); ctx.lineTo(ex - 6, ey - 11); ctx.moveTo(ex + 22, ey - 18); ctx.lineTo(ex + 6, ey - 11); }
    else if (face === "sad" || face === "worried") { ctx.moveTo(ex - 22, ey - 10); ctx.lineTo(ex - 6, ey - 17); ctx.moveTo(ex + 22, ey - 10); ctx.lineTo(ex + 6, ey - 17); }
    else if (face === "surprised") { ctx.moveTo(ex - 20, ey - 20); ctx.lineTo(ex - 6, ey - 22); ctx.moveTo(ex + 20, ey - 20); ctx.lineTo(ex + 6, ey - 22); }
    else if (face === "thinking") { ctx.moveTo(ex - 20, ey - 14); ctx.lineTo(ex - 6, ey - 14); ctx.moveTo(ex + 20, ey - 20); ctx.lineTo(ex + 6, ey - 16); }
    ctx.stroke();
    if (ch.glasses) { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex - 13, ey, 11, 0, Math.PI * 2); ctx.moveTo(ex + 24, ey); ctx.arc(ex + 13, ey, 11, 0, Math.PI * 2); ctx.moveTo(ex - 2, ey); ctx.lineTo(ex + 2, ey); ctx.stroke(); }
    // miệng
    const mx = dir * 10, my = 17;
    ctx.lineWidth = 4;
    if (ch._talk > 0) {
      ctx.fillStyle = "#7a2230"; ctx.beginPath(); ctx.ellipse(mx, my, 9, 2 + ch._talk * 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      if (face === "happy" || face === "happyclosed") ctx.arc(mx, my - 6, 11, rad(20), rad(160));
      else if (face === "sad") ctx.arc(mx, my + 8, 10, rad(200), rad(340));
      else if (face === "surprised") { ctx.ellipse(mx, my, 6, 8, 0, 0, Math.PI * 2); }
      else if (face === "worried") { ctx.moveTo(mx - 10, my + 2); ctx.quadraticCurveTo(mx - 4, my - 4, mx, my + 2); ctx.quadraticCurveTo(mx + 5, my + 6, mx + 10, my); }
      else if (face === "angry") { ctx.moveTo(mx - 10, my + 3); ctx.lineTo(mx + 10, my + 1); }
      else if (face === "thinking") { ctx.moveTo(mx - 6, my + 2); ctx.lineTo(mx + 10, my - 2); }
      else { ctx.moveTo(mx - 9, my); ctx.lineTo(mx + 9, my); }
      ctx.stroke();
    }
    if (face === "happy" || face === "happyclosed") { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = "#ff7b8a"; ctx.beginPath(); ctx.arc(ex - 20, 10, 6, 0, 7); ctx.arc(ex + 22, 10, 6, 0, 7); ctx.fill(); ctx.restore(); }
    if (ch.beard) { ctx.fillStyle = ch.hairColor || "#555"; ctx.beginPath(); ctx.arc(dir * 4, r * 0.55, r * 0.5, 0, Math.PI); ctx.fill(); }
    // mũ
    if (ch.hat === "cap") { ctx.fillStyle = ch.hatColor || "#d93a3a"; ctx.beginPath(); ctx.arc(0, -r * 0.3, r + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(dir > 0 ? 0 : -r - 30, -r * 0.35, r + 30, 9); }
    if (ch.hat === "grad") { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-r - 18, -r + 2); ctx.lineTo(0, -r - 18); ctx.lineTo(r + 18, -r + 2); ctx.lineTo(0, -r + 18); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#f2c230"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r + 8, -r + 10); ctx.lineTo(r + 8, -r + 34); ctx.stroke(); }
    if (ch.hat === "hard") { ctx.fillStyle = ch.hatColor || "#f2c230"; ctx.beginPath(); ctx.arc(0, -r * 0.25, r + 3, Math.PI, 0); ctx.fill(); ctx.fillRect(-r - 10, -r * 0.3, 2 * r + 20, 8); }
    ctx.restore();
  }
  function drawHeld(ctx, kind, h, dir, life) {
    ctx.save(); ctx.translate(h[0], h[1]);
    if (kind === "pointer" || kind === "ruler") { ctx.rotate(dir > 0 ? rad(-75) : rad(75)); ctx.fillStyle = "#c08a3e"; ctx.fillRect(-4, -110, 8, 120); }
    else if (kind === "chalk" || kind === "marker") { ctx.fillStyle = kind === "chalk" ? "#fff" : "#2b59c3"; ctx.fillRect(-5, -16, 10, 22); }
    else if (kind === "book") { ctx.fillStyle = "#3f7fd6"; ctx.fillRect(-22, -30, 44, 34); ctx.fillStyle = "#fff"; ctx.fillRect(-18, -26, 36, 4); }
    else if (kind === "phone") { ctx.fillStyle = "#333"; roundRect(ctx, -12, -34, 24, 40, 4); ctx.fill(); }
    else if (kind === "flag") { ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -120); ctx.stroke(); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(dir * 70, -100 + Math.sin(life * 6) * 6); ctx.lineTo(0, -80); ctx.fill(); }
    else { ctx.translate(0, -20); drawItem(ctx, { type: kind, x: 0, y: 0, scale: 0.45 }, life); }
    ctx.restore();
  }

  /* ---------------------------- phông nền ---------------------------- */
  const BOARDS = {
    classroom: { x: 560, y: 110, w: 1220, h: 540, chalk: true },
    whiteboard: { x: 520, y: 90, w: 1300, h: 600, chalk: false },
    paper: { x: 520, y: 90, w: 1300, h: 600, chalk: false },
    grid: { x: 520, y: 90, w: 1300, h: 600, chalk: false }
  };
  function sky(ctx, top, bot) { const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND); }
  function floor(ctx, col) { ctx.fillStyle = col; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.strokeStyle = INK; ctx.lineWidth = 5; hline(ctx, [[0, GROUND], [W / 2, GROUND], [W, GROUND]], 501); }
  function tree(ctx, x, y, s, seed) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 6; ctx.strokeStyle = INK;
    ctx.fillStyle = "#9a6b3f"; ctx.fillRect(-14, -170, 28, 170); hline(ctx, [[-14, 0], [-14, -170]], seed); hline(ctx, [[14, 0], [14, -170]], seed + 1);
    hcircle(ctx, 0, -230, 95, seed + 2, "#6cbf5b"); hcircle(ctx, -70, -180, 60, seed + 3, "#5daf4c"); hcircle(ctx, 70, -185, 62, seed + 4, "#5daf4c");
    ctx.restore();
  }
  function house(ctx, x, y, w, h, col, seed) {
    ctx.lineWidth = 5; ctx.strokeStyle = INK;
    hrect(ctx, x, y - h, w, h, seed, col);
    ctx.fillStyle = "#c0504d"; ctx.beginPath(); ctx.moveTo(x - 20, y - h); ctx.lineTo(x + w / 2, y - h - w * 0.45); ctx.lineTo(x + w + 20, y - h); ctx.closePath(); ctx.fill(); ctx.stroke();
    hrect(ctx, x + w * 0.38, y - h * 0.5, w * 0.24, h * 0.5, seed + 5, "#8a5a33");
    hrect(ctx, x + w * 0.1, y - h * 0.82, w * 0.2, h * 0.22, seed + 6, "#bfe3ff");
    hrect(ctx, x + w * 0.7, y - h * 0.82, w * 0.2, h * 0.22, seed + 7, "#bfe3ff");
  }
  const BG = {
    paper(ctx) { ctx.fillStyle = "#fbf8f1"; ctx.fillRect(0, 0, W, H); },
    grid(ctx) {
      ctx.fillStyle = "#fbfaf5"; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = "rgba(60,120,200,.16)"; ctx.lineWidth = 2;
      for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    },
    whiteboard(ctx) {
      ctx.fillStyle = "#eef1f4"; ctx.fillRect(0, 0, W, H); floor(ctx, "#d9d3c7");
      const b = BOARDS.whiteboard; ctx.strokeStyle = "#8d97a5"; ctx.lineWidth = 14; ctx.fillStyle = "#ffffff";
      ctx.fillRect(b.x, b.y, b.w, b.h); ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "#8d97a5"; ctx.fillRect(b.x + 40, b.y + b.h + 8, b.w - 80, 14);
    },
    classroom(ctx) {
      ctx.fillStyle = "#f4ead7"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#e8dcc4"; ctx.fillRect(0, 720, W, GROUND - 720);
      floor(ctx, "#c9a77c");
      const b = BOARDS.classroom; ctx.fillStyle = "#8b5a2b"; ctx.fillRect(b.x - 22, b.y - 22, b.w + 44, b.h + 44);
      ctx.fillStyle = "#1f3b2d"; ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "rgba(255,255,255,.035)"; for (let i = 0; i < 6; i++) ctx.fillRect(b.x + 60 + i * 190, b.y + 30, 120, b.h - 60);
      ctx.fillStyle = "#8b5a2b"; ctx.fillRect(b.x - 10, b.y + b.h + 22, b.w + 20, 16);
      // đồng hồ + cửa sổ
      ctx.strokeStyle = INK; ctx.lineWidth = 5; hcircle(ctx, 300, 180, 50, 77, "#fff"); hline(ctx, [[300, 180], [300, 145]], 78); hline(ctx, [[300, 180], [325, 190]], 79);
      hrect(ctx, 150, 300, 260, 220, 80, "#cde9ff"); hline(ctx, [[280, 300], [280, 520]], 81); hline(ctx, [[150, 410], [410, 410]], 82);
      // bục giảng
      ctx.lineWidth = 5; hrect(ctx, 1500, 800, 260, 160, 83, "#a8743f");
    },
    park(ctx) {
      sky(ctx, "#bfe6ff", "#eaf7ff"); floor(ctx, "#8fd16d");
      ctx.strokeStyle = INK; ctx.lineWidth = 5; hcircle(ctx, 1700, 150, 70, 90, "#ffd54f");
      ctx.fillStyle = "#fff"; [[300, 160], [900, 110]].forEach(([x, y], i) => { hcircle(ctx, x, y, 45, 91 + i, "#fff"); hcircle(ctx, x + 55, y + 5, 38, 93 + i, "#fff"); });
      tree(ctx, 220, GROUND, 1.1, 95); tree(ctx, 1720, GROUND, 0.9, 99);
      ctx.lineWidth = 5; hrect(ctx, 1320, 860, 240, 22, 120, "#b07a43"); hline(ctx, [[1340, 882], [1340, GROUND]], 121); hline(ctx, [[1540, 882], [1540, GROUND]], 122);
    },
    street(ctx) {
      sky(ctx, "#cfe8ff", "#f3f9ff"); floor(ctx, "#b9b9b9");
      house(ctx, 80, GROUND, 340, 300, "#ffe0a3", 130); house(ctx, 560, GROUND, 300, 360, "#cfe3b8", 140); house(ctx, 1440, GROUND, 360, 320, "#f6c9c9", 150);
      ctx.fillStyle = "#fff"; for (let x = 40; x < W; x += 180) ctx.fillRect(x, 1010, 90, 12);
    },
    market(ctx) {
      sky(ctx, "#ffe9c7", "#fff6e8"); floor(ctx, "#d8c3a1");
      const stall = (x, col, seed) => {
        ctx.lineWidth = 5; ctx.strokeStyle = INK; hrect(ctx, x, 760, 380, 200, seed, "#c9945e");
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? "#fff" : col; ctx.beginPath(); ctx.moveTo(x - 20 + i * 70, 640); ctx.lineTo(x + 50 + i * 70, 640); ctx.lineTo(x + 50 + i * 70, 700); ctx.quadraticCurveTo(x + 15 + i * 70, 730, x - 20 + i * 70, 700); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        hline(ctx, [[x, 700], [x, 760]], seed + 3); hline(ctx, [[x + 380, 700], [x + 380, 760]], seed + 4);
      };
      stall(120, "#e53935", 160); stall(1420, "#1e88e5", 170);
    },
    home(ctx) {
      ctx.fillStyle = "#fff3e0"; ctx.fillRect(0, 0, W, H); floor(ctx, "#d7b48a");
      ctx.strokeStyle = INK; ctx.lineWidth = 5; hrect(ctx, 760, 160, 400, 300, 180, "#cde9ff"); hline(ctx, [[960, 160], [960, 460]], 181); hline(ctx, [[760, 310], [1160, 310]], 182);
      hrect(ctx, 1380, 760, 420, 120, 183, "#7e57c2"); hrect(ctx, 1380, 690, 420, 80, 184, "#9575cd");
      hrect(ctx, 160, 300, 220, 150, 185, "#fff"); ctx.fillStyle = "#ffb74d"; ctx.beginPath(); ctx.arc(270, 375, 40, 0, 7); ctx.fill();
    },
    space(ctx) {
      ctx.fillStyle = "#0d1333"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 140; i++) { const x = hash(i) * W, y = hash(i + 99) * H, tw = 0.5 + 0.5 * Math.sin(BOIL * 0.9 + i); ctx.fillStyle = `rgba(255,255,255,${0.35 + tw * 0.6})`; ctx.fillRect(x, y, 3, 3); }
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; hcircle(ctx, 1600, 250, 120, 200, "#ff8a65"); ctx.fillStyle = "#6d4c8f"; ctx.fillRect(0, GROUND, W, H - GROUND);
    },
    stage(ctx) {
      ctx.fillStyle = "#2a1f2d"; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, 700, 50, W / 2, 700, 700); g.addColorStop(0, "rgba(255,240,190,.55)"); g.addColorStop(1, "rgba(255,240,190,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#a3202b"; ctx.fillRect(0, 0, 220, H); ctx.fillRect(W - 220, 0, 220, H); ctx.fillRect(0, 0, W, 90);
      ctx.fillStyle = "#6b4a2b"; ctx.fillRect(0, GROUND, W, H - GROUND);
    }
  };

  /* ------------------------ đạo cụ / đối tượng ------------------------ */
  const PROPS = {
    text(ctx, it) { drawTex(ctx, it.text, 0, 0, it.size || 64, it.color || INK, it.align || "center", 1); },
    apple(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, 42, it._seed, it.color || "#e53935"); ctx.strokeStyle = INK; hline(ctx, [[0, -40], [6, -62]], it._seed + 1); ctx.fillStyle = "#43a047"; ctx.beginPath(); ctx.ellipse(22, -56, 16, 8, -0.4, 0, 7); ctx.fill(); },
    coin(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, 40, it._seed, "#ffca28"); ctx.fillStyle = "#8d6e00"; ctx.font = `bold 34px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "đ", 0, 12); ctx.textAlign = "left"; },
    money(ctx, it) { ctx.lineWidth = 4; hrect(ctx, -90, -45, 180, 90, it._seed, it.color || "#a5d6a7"); ctx.fillStyle = "#1b5e20"; ctx.font = `bold 40px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "10 000đ", 0, 14); ctx.textAlign = "left"; },
    book(ctx, it) { ctx.lineWidth = 5; hrect(ctx, -60, -80, 120, 160, it._seed, it.color || "#3f7fd6"); ctx.fillStyle = "#fff"; ctx.font = `bold 30px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "SGK", 0, 0); ctx.textAlign = "left"; },
    box(ctx, it) { const w = it.w || 160, h = it.h || 120; ctx.lineWidth = 5; hrect(ctx, -w / 2, -h / 2, w, h, it._seed, it.color || "#ffe0a3"); if (it.label != null) drawTex(ctx, String(it.label), 0, 16, it.size || 48, INK, "center", 1); },
    circle(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, it.r || 60, it._seed, it.color || "#bbdefb"); if (it.label != null) drawTex(ctx, String(it.label), 0, 16, it.size || 44, INK, "center", 1); },
    cake(ctx, it) {
      const n = it.slices || 4, k = it.taken || 0, R = it.r || 130, hi = it.highlight || "#ffb74d";
      ctx.lineWidth = 5;
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2, a1 = a0 + Math.PI * 2 / n, off = i < k ? 18 : 0, am = (a0 + a1) / 2;
        ctx.save(); ctx.translate(Math.cos(am) * off, Math.sin(am) * off);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath();
        ctx.fillStyle = i < k ? hi : it.color || "#fff3c4"; ctx.fill(); ctx.stroke(); ctx.restore();
      }
    },
    bar(ctx, it) { // thanh chia phần (phân số)
      const n = it.parts || 4, k = it.taken || 0, w = it.w || 480, h = it.h || 80;
      ctx.lineWidth = 5;
      for (let i = 0; i < n; i++) { ctx.fillStyle = i < k ? (it.highlight || "#64b5f6") : "#fff"; ctx.fillRect(-w / 2 + (i * w) / n, -h / 2, w / n, h); }
      hrect(ctx, -w / 2, -h / 2, w, h, it._seed); for (let i = 1; i < n; i++) hline(ctx, [[-w / 2 + (i * w) / n, -h / 2], [-w / 2 + (i * w) / n, h / 2]], it._seed + i);
    },
    balance(ctx, it) {
      const tilt = rad(it.tilt || 0); ctx.lineWidth = 6; ctx.strokeStyle = INK;
      hline(ctx, [[0, 140], [0, -60]], it._seed); hline(ctx, [[-80, 140], [80, 140]], it._seed + 1);
      ctx.save(); ctx.translate(0, -60); ctx.rotate(tilt);
      hline(ctx, [[-260, 0], [260, 0]], it._seed + 2);
      [-1, 1].forEach((s) => {
        ctx.save(); ctx.translate(s * 240, 0); ctx.rotate(-tilt);
        hline(ctx, [[0, 0], [-70, 110]], it._seed + 3 + s); hline(ctx, [[0, 0], [70, 110]], it._seed + 5 + s);
        ctx.fillStyle = "#ffe082"; ctx.beginPath(); ctx.ellipse(0, 112, 100, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const lab = s < 0 ? it.left : it.right; if (lab != null) drawTex(ctx, String(lab), 0, 85, it.size || 48, INK, "center", 1);
        ctx.restore();
      });
      ctx.restore(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, -60, 10, 0, 7); ctx.fill();
    },
    numberline(ctx, it) {
      const a = it.from != null ? it.from : -5, b = it.to != null ? it.to : 5, w = it.w || 1200, step = it.step || 1;
      const X = (v) => -w / 2 + ((v - a) / (b - a)) * w;
      ctx.lineWidth = 5; ctx.strokeStyle = INK; hline(ctx, [[-w / 2 - 30, 0], [w / 2 + 40, 0]], it._seed);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(w / 2 + 50, 0); ctx.lineTo(w / 2 + 26, -12); ctx.lineTo(w / 2 + 26, 12); ctx.fill();
      for (let v = a; v <= b + 1e-9; v += step) { const x = X(v); hline(ctx, [[x, -14], [x, 14]], it._seed + v * 3); drawTex(ctx, String(Math.round(v * 100) / 100).replace("-", "−"), x, 62, it.size || 40, INK, "center", 1); }
      arr(it.points).forEach((p, i) => { ctx.fillStyle = p.color || "#e53935"; ctx.beginPath(); ctx.arc(X(p.v), 0, 14, 0, 7); ctx.fill(); if (p.label) drawTex(ctx, p.label, X(p.v), -34, it.size || 40, p.color || "#e53935", "center", 1); });
      arr(it.jumps).forEach((j) => { ctx.strokeStyle = j.color || "#1e88e5"; ctx.lineWidth = 5; const x1 = X(j.from), x2 = X(j.to); ctx.beginPath(); ctx.moveTo(x1, -10); ctx.quadraticCurveTo((x1 + x2) / 2, -110, x2, -10); ctx.stroke(); if (j.label) drawTex(ctx, j.label, (x1 + x2) / 2, -80, 38, j.color || "#1e88e5", "center", 1); });
    },
    arrow(ctx, it) {
      const dx = it.dx != null ? it.dx : 200, dy = it.dy || 0, col = it.color || "#e53935";
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = it.width || 8; hline(ctx, [[0, 0], [dx, dy]], it._seed);
      const a = Math.atan2(dy, dx); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx - 30 * Math.cos(a - 0.45), dy - 30 * Math.sin(a - 0.45)); ctx.lineTo(dx - 30 * Math.cos(a + 0.45), dy - 30 * Math.sin(a + 0.45)); ctx.fill();
      if (it.label) drawTex(ctx, it.label, dx / 2, dy / 2 - 24, it.size || 40, col, "center", 1);
    },
    star(ctx, it) { ctx.fillStyle = it.color || "#ffca28"; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 52, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); },
    bulb(ctx, it, life) {
      ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * Math.sin(life * 6); ctx.fillStyle = "#fff59d"; ctx.beginPath(); ctx.arc(0, -20, 85, 0, 7); ctx.fill(); ctx.restore();
      ctx.lineWidth = 5; ctx.strokeStyle = INK; hcircle(ctx, 0, -20, 50, it._seed, "#ffee58"); hrect(ctx, -24, 28, 48, 34, it._seed + 1, "#9e9e9e");
    },
    clock(ctx, it) { const h = it.h || 3, m = it.m || 0; ctx.lineWidth = 6; ctx.strokeStyle = INK; hcircle(ctx, 0, 0, 90, it._seed, "#fff"); for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 74, -Math.cos(a) * 74); ctx.lineTo(Math.sin(a) * 84, -Math.cos(a) * 84); ctx.stroke(); } const am = (m / 60) * Math.PI * 2, ah = ((h % 12) / 12 + m / 720) * Math.PI * 2; hline(ctx, [[0, 0], [Math.sin(ah) * 45, -Math.cos(ah) * 45]], it._seed + 1); ctx.lineWidth = 4; hline(ctx, [[0, 0], [Math.sin(am) * 70, -Math.cos(am) * 70]], it._seed + 2); },
    chart(ctx, it) {
      const vals = it.values || [3, 5, 2], labs = it.labels || [], max = Math.max(...vals, 1), w = it.w || 600, h = it.h || 360, bw = w / vals.length;
      const cols = ["#42a5f5", "#ef5350", "#66bb6a", "#ffa726", "#ab47bc", "#26c6da"];
      ctx.lineWidth = 5; ctx.strokeStyle = INK; hline(ctx, [[-w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]], it._seed);
      const grow = it.grow == null ? 1 : it.grow;
      vals.forEach((v, i) => { const bh = (v / max) * (h - 40) * grow; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(-w / 2 + i * bw + bw * 0.18, h / 2 - bh, bw * 0.64, bh); ctx.strokeRect(-w / 2 + i * bw + bw * 0.18, h / 2 - bh, bw * 0.64, bh); drawTex(ctx, String(v), -w / 2 + i * bw + bw / 2, h / 2 - bh - 14, 36, INK, "center", 1); if (labs[i]) drawTex(ctx, labs[i], -w / 2 + i * bw + bw / 2, h / 2 + 44, 34, INK, "center", 1); });
    },
    sign(ctx, it) { const w = it.w || 420, h = it.h || 130; ctx.lineWidth = 6; ctx.strokeStyle = INK; hline(ctx, [[0, h / 2], [0, h / 2 + 140]], it._seed); hrect(ctx, -w / 2, -h / 2, w, h, it._seed + 1, it.color || "#fff8e1"); drawTex(ctx, it.text || "", 0, 18, it.size || 48, INK, "center", 1); },
    card(ctx, it) { const w = it.w || 520, h = it.h || 140; ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 18; ctx.fillStyle = it.color || "#fffef6"; roundRect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.restore(); ctx.lineWidth = 5; ctx.strokeStyle = it.border || "#f2a900"; roundRect(ctx, -w / 2, -h / 2, w, h, 22); ctx.stroke(); drawTex(ctx, it.text || "", 0, (it.size || 52) * 0.35, it.size || 52, it.textColor || INK, "center", 1); },
    table(ctx, it) { const w = it.w || 420, h = it.h || 190; ctx.lineWidth = 6; ctx.strokeStyle = INK; hrect(ctx, -w / 2, -h, w, 22, it._seed, it.color || "#b07a43"); hline(ctx, [[-w / 2 + 30, -h + 22], [-w / 2 + 30, 0]], it._seed + 1); hline(ctx, [[w / 2 - 30, -h + 22], [w / 2 - 30, 0]], it._seed + 2); },
    tree(ctx, it) { tree(ctx, 0, 0, it.s || 1, it._seed); },
    house(ctx, it) { house(ctx, -150, 0, 300, 260, it.color || "#ffe0a3", it._seed); },
    car(ctx, it, life) { ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.fillStyle = it.color || "#42a5f5"; roundRect(ctx, -150, -90, 300, 70, 16); ctx.fill(); ctx.stroke(); roundRect(ctx, -80, -140, 160, 56, 14); ctx.fill(); ctx.stroke(); [-90, 90].forEach((x) => { hcircle(ctx, x, -18, 30, it._seed + x, "#333"); ctx.save(); ctx.translate(x, -18); ctx.rotate(life * (it.spin || 0)); ctx.strokeStyle = "#ccc"; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(18, 0); ctx.stroke(); ctx.restore(); }); },
    check(ctx, it) { ctx.strokeStyle = it.color || "#2e7d32"; ctx.lineWidth = 16; ctx.lineCap = "round"; hline(ctx, [[-50, 0], [-12, 40], [60, -50]], it._seed); },
    cross(ctx, it) { ctx.strokeStyle = it.color || "#d32f2f"; ctx.lineWidth = 16; ctx.lineCap = "round"; hline(ctx, [[-45, -45], [45, 45]], it._seed); hline(ctx, [[45, -45], [-45, 45]], it._seed + 1); },
    question(ctx, it) { drawTex(ctx, "?", 0, 40, it.size || 140, it.color || "#e53935", "center", 1); },
    heart(ctx, it) { ctx.fillStyle = it.color || "#e91e63"; ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-70, -20, -30, -70, 0, -35); ctx.bezierCurveTo(30, -70, 70, -20, 0, 30); ctx.fill(); },
    triangle(ctx, it) { // tam giác có nhãn đỉnh
      const P = it.points || [[0, -160], [-180, 120], [200, 120]], L = it.labels || ["A", "B", "C"];
      ctx.lineWidth = 6; ctx.strokeStyle = it.color || INK; hline(ctx, P, it._seed, true);
      P.forEach((p, i) => { const cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3, dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; if (L[i]) drawTex(ctx, L[i], p[0] + (dx / d) * 40, p[1] + (dy / d) * 40 + 16, 46, INK, "center", 1); });
    },
    image(ctx, it) { if (it._img && it._img.complete) ctx.drawImage(it._img, -(it.w || 300) / 2, -(it.h || 300) / 2, it.w || 300, it.h || 300); }
  };
  function drawItem(ctx, it, life) {
    const fn = PROPS[it.type] || PROPS.text;
    if (it.type === "image" && !it._img && it.src) { it._img = new Image(); it._img.src = it.src; }
    ctx.save();
    ctx.translate(it.x || 0, it.y || 0);
    if (it.rot) ctx.rotate(rad(it.rot));
    const s = (it.scale == null ? 1 : it.scale) * (it._pop == null ? 1 : it._pop);
    ctx.scale(s, s);
    ctx.globalAlpha *= it.alpha == null ? 1 : it.alpha;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK;
    fn(ctx, it, life);
    ctx.restore();
  }

  /* ------------------------------ âm thanh ------------------------------ */
  const Audio = {
    ctx: null, master: null, muted: false, musicNode: null, musicGain: null,
    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    },
    noise(dur) { const c = this.ctx, b = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; },
    tone(f, t0, dur, type, vol, f2) { const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05); },
    play(name, dur) {
      if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime;
      switch (name) {
        case "pop": this.tone(500, t, 0.12, "sine", 0.35, 1100); break;
        case "ding": this.tone(1318, t, 0.9, "sine", 0.3); this.tone(1976, t + 0.02, 0.7, "sine", 0.12); break;
        case "correct": this.tone(784, t, 0.18, "triangle", 0.3); this.tone(1046, t + 0.14, 0.35, "triangle", 0.3); break;
        case "wrong": this.tone(220, t, 0.25, "square", 0.12, 180); this.tone(170, t + 0.22, 0.35, "square", 0.12, 140); break;
        case "tick": this.tone(1800, t, 0.05, "square", 0.08); break;
        case "boing": this.tone(180, t, 0.45, "sine", 0.35, 520); break;
        case "tada": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.09, 0.6, "triangle", 0.2)); break;
        case "bell": this.tone(880, t, 1.4, "sine", 0.25); this.tone(1760, t, 1, "sine", 0.08); break;
        case "click": this.tone(2400, t, 0.03, "square", 0.08); break;
        case "step": this.tone(120, t, 0.06, "sine", 0.2, 70); break;
        case "whoosh": case "marker": case "chalk": case "applause": {
          const d = name === "whoosh" ? 0.45 : name === "applause" ? 2.2 : clamp(dur || 1, 0.3, 3);
          const s = this.noise(d), f = c.createBiquadFilter(), g = c.createGain();
          f.type = "bandpass"; f.frequency.value = name === "whoosh" ? 900 : name === "chalk" ? 3200 : name === "applause" ? 2200 : 2600; f.Q.value = name === "whoosh" ? 0.8 : 1.4;
          if (name === "whoosh") f.frequency.exponentialRampToValueAtTime(3500, t + d);
          g.gain.setValueAtTime(0.0001, t);
          if (name === "whoosh") { g.gain.exponentialRampToValueAtTime(0.4, t + d * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
          else { const step = name === "applause" ? 0.045 : 0.11; for (let x = 0; x < d; x += step) { const v = (name === "applause" ? 0.12 : 0.09) * (0.4 + Math.random() * 0.6); g.gain.setValueAtTime(0.0001, t + x); g.gain.linearRampToValueAtTime(v, t + x + step * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + x + step * 0.95); } }
          s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.05); break;
        }
        default: break;
      }
    },
    music(on) {
      if (!this.ctx) return;
      if (!on) { if (this.musicNode) { clearInterval(this.musicNode); this.musicNode = null; } return; }
      if (this.musicNode) return;
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.05; this.musicGain.connect(this.master);
      const chords = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]]; let k = 0;
      const playChord = () => { if (this.muted) return; const t = this.ctx.currentTime; chords[k++ % 4].forEach((f, i) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3); o.connect(g); g.connect(this.musicGain); o.start(t + i * 0.12); o.stop(t + 2.5); }); };
      playChord(); this.musicNode = setInterval(playChord, 2400);
    },
    duck(on) { if (this.musicGain) this.musicGain.gain.setTargetAtTime(on ? 0.022 : 0.05, this.ctx.currentTime, 0.2); }
  };

  /* ------------------------------ giọng đọc ------------------------------ */
  const Voice = {
    list: [], vi: [], chosen: null, rate: 1, speaking: false, ok: !!window.speechSynthesis, queueId: 0,
    load() {
      if (!this.ok) return;
      const f = () => { this.list = speechSynthesis.getVoices(); this.vi = this.list.filter((v) => /^vi/i.test(v.lang)); if (!this.chosen) this.chosen = this.pick("nu"); if (window.STICKFILM && STICKFILM._onVoices) STICKFILM._onVoices(); };
      f(); speechSynthesis.onvoiceschanged = f;
    },
    pick(kind) {
      const pref = kind === "nam" ? [/NamMinh/i, /Nam/i] : [/HoaiMy/i, /Hoai/i, /Linh/i, /An\b/i, /Google/i];
      for (const re of pref) { const v = this.vi.find((x) => re.test(x.name)); if (v) return v; }
      return this.vi[0] || null;
    },
    speak(text, opt, onend) {
      if (!this.ok) { onend && onend(); return; }
      const id = ++this.queueId;
      speechSynthesis.cancel();
      const parts = String(text).match(/[^.!?…;:]+[.!?…;:]*/g) || [text];
      let i = 0; this.speaking = true;
      const next = () => {
        if (id !== this.queueId) return;
        if (i >= parts.length) { this.speaking = false; onend && onend(); return; }
        const u = new SpeechSynthesisUtterance(parts[i++].trim());
        u.lang = "vi-VN";
        const v = opt.voice === "nam" ? this.pick("nam") || this.chosen : this.chosen;
        if (v) u.voice = v;
        u.rate = this.rate * (opt.rate || 1);
        u.pitch = opt.pitch || 1;
        u.onboundary = () => { STICKFILM._boundary = performance.now(); };
        u.onend = next; u.onerror = next;
        speechSynthesis.speak(u);
      };
      next();
    },
    stop() { this.queueId++; this.speaking = false; if (this.ok) speechSynthesis.cancel(); }
  };

  /* ------------------------- biên dịch kịch bản ------------------------- */
  function sayText(b) { return b.say || ""; }
  function estimateSay(text, rate) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    const digits = (String(text).match(/\d/g) || []).length;
    return (words * 0.33 + digits * 0.12) / (rate || 1) + 0.35;
  }
  function compile(film, timing) {
    const scenes = []; let T = 0; const sfx = [], says = [];
    film.scenes.forEach((sc, si) => {
      const s = { idx: si, start: T, beats: [], src: sc };
      const board = BOARDS[sc.bg] || null; let writeY = board ? board.y + 90 : 140;
      let lt = 0;
      (sc.beats || []).forEach((b, bi) => {
        const id = `s${si + 1}b${bi + 1}`;
        const B = { id, src: b, start: T + lt };
        const speaker = film.cast && film.cast[b.who];
        let d = 0;
        if (b.say) {
          B.sayDur = timing && timing[id] ? timing[id] : estimateSay(sayText(b), (speaker && speaker.rate) || 1);
          d = Math.max(d, B.sayDur + 0.15);
          says.push({ id, t: B.start, text: sayText(b), who: b.who || "narrator", voice: (speaker && speaker.voice) || (film.narrator && film.narrator.voice) || "nu", pitch: speaker && speaker.pitch, dur: B.sayDur });
        }
        if (b.write != null) {
          const ws = arr(b.write).map((w) => (typeof w === "string" ? { text: w } : { ...w }));
          let off = 0;
          ws.forEach((w) => {
            w.size = w.size || 64;
            if (w.x == null) { w.x = board ? board.x + 70 : 200; w.align = w.align || "left"; }
            if (w.y == null) { w.y = writeY; writeY += w.size * (w.gap || 1.55); } else if (board) writeY = Math.max(writeY, w.y + w.size * 1.55);
            w.wstart = off; w.wdur = w.dur || clamp(String(w.text).length * 0.075, 0.7, 2.8); off += w.wdur + 0.15;
            sfx.push({ t: B.start + w.wstart, name: board && board.chalk ? "chalk" : "marker", dur: w.wdur });
          });
          B.writes = ws; d = Math.max(d, off);
        }
        if (b.clear) writeY = board ? board.y + 90 : 140;
        if (b.move) { arr(b.move).forEach((m) => { d = Math.max(d, m.dur || 1.5); if (m.style === "jump") sfx.push({ t: B.start, name: "boing" }); }); }
        if (b.tween) arr(b.tween).forEach((m) => { d = Math.max(d, m.dur || 0.8); });
        if (b.cam) d = Math.max(d, b.cam.dur || 1);
        if (b.show) arr(b.show).forEach((it) => { if (it.sfx !== false) sfx.push({ t: B.start, name: "pop" }); d = Math.max(d, 0.4); });
        if (b.title) { d = Math.max(d, b.title.dur || 3.2); sfx.push({ t: B.start, name: "whoosh" }); }
        if (b.quiz) {
          const th = b.quiz.think || 5; B.quizThink = th; d = Math.max(d, th + 2.6);
          for (let k = 0; k < th; k++) sfx.push({ t: B.start + 0.8 + k, name: "tick" });
          sfx.push({ t: B.start + 0.8 + th, name: "correct" });
          if (!b.say) says.push({ id: id + "q", t: B.start, text: b.quiz.say || "", who: "narrator", voice: "nu", dur: 0, skip: true });
        }
        if (b.wait) d = Math.max(d, b.wait);
        arr(b.sfx).forEach((n) => sfx.push({ t: B.start + (b.sfxAt || 0), name: n }));
        d += b.gap != null ? b.gap : 0.35;
        B.dur = d; lt += d; s.beats.push(B);
      });
      s.dur = Math.max(lt, sc.minDur || 0.5); T += s.dur; s.end = T;
      scenes.push(s);
    });
    return { scenes, duration: T, sfx: sfx.sort((a, b) => a.t - b.t), says: says.filter((x) => !x.skip) };
  }

  /* ---------------------- trạng thái tại thời điểm t ---------------------- */
  function stateAt(film, comp, t) {
    const sc = comp.scenes.find((s) => t < s.end) || comp.scenes[comp.scenes.length - 1];
    const src = sc.src, lt = t - sc.start;
    const cast = {}; let seedN = 1;
    Object.entries(src.cast || {}).forEach(([id, c]) => {
      const base = (film.cast && film.cast[id]) || {};
      cast[id] = { ...base, ...c, id, holding: c.hold !== undefined ? c.hold : base.hold, _seed: (seedN++) * 17, pose: c.pose || "idle", poseT: sc.start - 1, prevPose: c.pose || "idle", y: c.y || GROUND };
    });
    const items = {}; (src.items || []).forEach((it, i) => { items[it.id || "i" + i] = { ...it, _seed: 300 + i * 11 }; });
    const writes = [];
    const cam = { x: W / 2, y: H / 2, zoom: 1 };
    let speech = null, title = null, quiz = null, highlight = [], emotes = [];
    sc.beats.forEach((B, bi) => {
      if (B.start > t) return;
      const b = B.src, p = (dur) => clamp((t - B.start) / (dur || 1), 0, 1);
      // hành động nhân vật
      const acts = { ...(b.act || {}) };
      if (b.who && (b.pose || b.face || b.flip != null || b.hold !== undefined)) acts[b.who] = { ...(acts[b.who] || {}), pose: b.pose || (acts[b.who] || {}).pose, face: b.face || (acts[b.who] || {}).face, flip: b.flip != null ? b.flip : (acts[b.who] || {}).flip, hold: b.hold };
      Object.entries(acts).forEach(([id, a]) => {
        const ch = cast[id]; if (!ch) return;
        if (a.pose && a.pose !== ch.pose) { ch.prevPose = ch.pose; ch.pose = a.pose; ch.poseT = B.start; }
        if (a.face) ch.face = a.face;
        if (a.flip != null) ch.flip = a.flip;
        if (a.hold !== undefined) ch.holding = a.hold;
        if (a.x != null) ch.x = a.x;
        if (a.enter) { ch.hidden = false; }
        if (a.exit) { ch.hidden = true; }
      });
      arr(b.move).forEach((m) => {
        const ch = cast[m.who]; if (!ch) return; const dur = m.dur || 1.5, k = p(dur);
        const from = ch.x; const to = m.to != null ? m.to : from + (m.by || 0);
        ch.flip = to < from; ch.x = lerp(from, to, m.style === "jump" ? k : easeIO(k));
        if (k < 1) { ch._moving = { style: m.style || "walk", phase: (t - B.start) * (m.style === "run" ? 13 : 8) }; if (m.style === "jump") ch._jumpLift = Math.sin(k * Math.PI) * (m.height || 160); }
        else { ch._moving = null; ch._jumpLift = 0; if (m.face != null) ch.flip = m.face === "left"; }
      });
      arr(b.show).forEach((it, i) => { const id = it.id || `${B.id}_${i}`; items[id] = { ...it, _seed: 500 + bi * 13 + i, _born: B.start }; });
      arr(b.hide).forEach((id) => { if (items[id]) items[id]._dead = B.start; });
      arr(b.set).forEach((s) => { if (items[s.id]) Object.assign(items[s.id], s); });
      arr(b.tween).forEach((tw) => {
        const it = items[tw.id] || cast[tw.id]; if (!it) return; const k = easeIO(p(tw.dur || 0.8));
        Object.keys(tw).forEach((key) => { if (["id", "dur"].includes(key)) return; const from = it[key] == null ? (key === "scale" || key === "alpha" ? 1 : 0) : it[key]; if (typeof tw[key] === "number") it[key] = lerp(from, tw[key], k); else if (k >= 1) it[key] = tw[key]; });
      });
      if (b.clear) { writes.length = 0; if (b.clear === "all") Object.keys(items).forEach((k) => delete items[k]); }
      if (B.writes) B.writes.forEach((w) => writes.push({ ...w, _p: clamp((t - B.start - w.wstart) / w.wdur, 0, 1), _bs: B.start }));
      if (b.cam) { const k = easeIO(p(b.cam.dur || 1)); const fx = cam.x, fy = cam.y, fz = cam.zoom; cam.x = lerp(fx, b.cam.x != null ? b.cam.x : fx, k); cam.y = lerp(fy, b.cam.y != null ? b.cam.y : fy, k); cam.zoom = lerp(fz, b.cam.zoom != null ? b.cam.zoom : fz, k); }
      const inBeat = t < B.start + B.dur;
      if (b.say && inBeat) speech = { B, who: b.who, text: b.sub || b.say, bubble: b.bubble, active: t < B.start + B.sayDur, el: t - B.start };
      if (b.title && t < B.start + (b.title.dur || 3.2)) title = { ...b.title, el: t - B.start };
      if (b.quiz && inBeat) quiz = { ...b.quiz, el: t - B.start, think: B.quizThink };
      if (b.highlight && inBeat) arr(b.highlight).forEach((h) => highlight.push({ id: h, el: t - B.start }));
      if (b.emote && inBeat) arr(b.emote).forEach((e) => emotes.push({ ...e, el: t - B.start }));
    });
    return { sc, cast, items, writes, cam, speech, title, quiz, highlight, emotes, lt };
  }

  /* ------------------------------ khung hình ------------------------------ */
  const ui = { subs: true };
  function renderFrame(ctx, film, comp, t, life, live) {
    BOIL = Math.floor(life * 8);
    const S = stateAt(film, comp, t);
    const src = S.sc.src, bg = src.bg || "paper";
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(S.cam.zoom, S.cam.zoom); ctx.translate(-S.cam.x, -S.cam.y);
    (BG[bg] || BG.paper)(ctx, life);
    const board = BOARDS[bg];
    const ink = board && board.chalk ? "#f5f5ec" : "#1e3a8a";
    // chữ viết trên bảng
    S.writes.forEach((w) => { if (w._p <= 0) return; drawTex(ctx, w.text, w.x, w.y, w.size, w.color || ink, w.align || "left", w._p, w._p < 1 ? (board && board.chalk ? "chalk" : "marker") : null); });
    // khung vàng quanh dòng có box:true
    S.writes.forEach((w) => { if (!w.box || w._p < 1) return; ctx.font = `${w.size}px ${FONT}`; const L = layout(ctx, texCache.get(w.text) || parseTex(w.text), w.size); const x0 = w.align === "center" ? w.x - L.w / 2 : w.x; ctx.save(); ctx.strokeStyle = w.boxColor || "#ffca28"; ctx.lineWidth = 6; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(life * 5); roundRect(ctx, x0 - 22, w.y - L.asc - 18, L.w + 44, L.asc + L.desc + 36, 14); ctx.stroke(); ctx.restore(); });
    // đối tượng (sắp theo z)
    Object.entries(S.items).sort((a, b) => (a[1].z || 0) - (b[1].z || 0)).forEach(([id, it]) => {
      if (it._dead != null) { const k = (t - it._dead) / 0.3; if (k >= 1) return; it.alpha = (it.alpha == null ? 1 : it.alpha) * (1 - k); }
      if (it._born != null && it.pop !== false) { const k = clamp((t - it._born) / 0.45, 0, 1); it._pop = k >= 1 ? 1 : Math.max(0.001, easeOutBack(k)); }
      drawItem(ctx, it, life);
      const hl = S.highlight.find((h) => h.id === id);
      if (hl) { ctx.save(); ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 7; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(hl.el * 8); hcircle(ctx, it.x, it.y, (it.hlR || 120) + Math.sin(hl.el * 8) * 6, 999, null); ctx.restore(); }
    });
    // nhân vật
    Object.values(S.cast).forEach((ch) => {
      if (ch.hidden) return;
      const age = t - ch.poseT, k = clamp(age / 0.38, 0, 1);
      let P = blendPose(poseAt(ch.prevPose, life), poseAt(ch.pose, life), easeIO(k));
      if (ch._moving) { const wp = walkPose(ch._moving.phase, ch._moving.style === "run"); P = ch._moving.style === "jump" ? blendPose(P, poseAt("jump", life), 1) : wp; }
      if (ch._jumpLift) P.lift = (P.lift || 0) + ch._jumpLift;
      ch._pose = P;
      let talk = 0;
      if (S.speech && S.speech.who === ch.id) {
        const voiceOn = Voice.vi.length > 0 && STICKFILM.useVoice;
        const speakingNow = live ? (Voice.speaking && live.sayId === S.speech.B.id) || (!voiceOn && S.speech.active) : S.speech.active;
        if (speakingNow) talk = clamp(0.35 + 0.65 * Math.abs(Math.sin(life * 17 + Math.sin(life * 5) * 2)), 0, 1);
      }
      ch._talk = talk;
      if (talk > 0 && ch.pose === "idle") ch._pose = blendPose(P, poseAt("explain", life), 0.6);
      drawFigure(ctx, ch, life);
    });
    // biểu tượng cảm xúc trên đầu
    S.emotes.forEach((e) => { const ch = S.cast[e.who]; if (!ch || !ch._headTop) return; const [x, y] = ch._headTop; const k = clamp(e.el / 0.3, 0, 1); ctx.save(); ctx.translate(x + (S.cast[e.who].flip ? -80 : 80), y + 20 - Math.sin(e.el * 4) * 6); ctx.scale(k, k); const icon = { idea: "bulb", heart: "heart", question: "question", star: "star" }[e.icon]; if (icon) drawItem(ctx, { type: icon, x: 0, y: 0, scale: 0.55, _seed: 77 }, life); else { ctx.font = `bold 90px ${FONT}`; ctx.fillStyle = e.icon === "!" ? "#e53935" : INK; ctx.textAlign = "center"; ctx.fillText(e.icon || "!", 0, 0); ctx.textAlign = "left"; } ctx.restore(); });
    // bong bóng lời thoại
    if (S.speech && S.speech.who && S.cast[S.speech.who] && S.speech.bubble !== false) drawBubble(ctx, S.cast[S.speech.who], S.speech, film);
    ctx.restore();
    // lớp phủ (không theo camera)
    if (S.quiz) drawQuiz(ctx, S.quiz, life);
    if (S.title) drawTitle(ctx, S.title);
    if (ui.subs && S.speech && S.speech.text) drawSub(ctx, S.speech, film);
    if (film.watermark) { ctx.save(); ctx.globalAlpha = 0.55; ctx.font = `italic 30px ${FONT}`; ctx.fillStyle = "#555"; ctx.textAlign = "right"; ctx.fillText(film.watermark, W - 30, 46); ctx.restore(); }
    return S;
  }
  function drawBubble(ctx, ch, sp, film) {
    if (!ch._headTop) return;
    const text = sp.text, size = 40; const maxW = 560;
    const lines = wrapText(ctx, text, maxW, size);
    if (lines.length > 4) return; // dài quá → chỉ phụ đề
    const k = clamp(sp.el / 0.25, 0, 1);
    let w = 0; ctx.font = `${size}px ${FONT}`; lines.forEach((l) => (w = Math.max(w, ctx.measureText(l).width)));
    w += 56; const h = lines.length * size * 1.25 + 40;
    const [hx, hy] = ch._headTop; let x = hx - w / 2, y = hy - h - 50;
    x = clamp(x, 30, W - w - 30); y = Math.max(30, y);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(hx, hy - 20); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.translate(-hx, -(hy - 20));
    ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    roundRect(ctx, x, y, w, h, 28); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(clamp(hx - 20, x + 30, x + w - 60), y + h - 3); ctx.lineTo(hx, hy - 12); ctx.lineTo(clamp(hx + 20, x + 60, x + w - 30), y + h - 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillRect(clamp(hx - 17, x + 33, x + w - 57), y + h - 9, 34, 10);
    ctx.fillStyle = INK; ctx.font = `${size}px ${FONT}`; ctx.textAlign = "center";
    lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 22 + size * 0.95 + i * size * 1.25));
    ctx.restore(); ctx.textAlign = "left";
  }
  function drawSub(ctx, sp, film) {
    const size = 44, text = sp.text; const lines = wrapText(ctx, text, 1600, size).slice(-2);
    const h = lines.length * size * 1.3 + 30, y = H - h - 24;
    ctx.save(); ctx.fillStyle = "rgba(10,10,20,.62)"; roundRect(ctx, 120, y, W - 240, h, 18); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `${size}px ${FONT}`; ctx.textAlign = "center";
    const name = sp.who && film.cast && film.cast[sp.who] && film.cast[sp.who].name;
    lines.forEach((l, i) => ctx.fillText((i === 0 && name ? name + ": " : "") + l, W / 2, y + 15 + size + i * size * 1.3));
    ctx.restore();
  }
  function drawTitle(ctx, T) {
    const d = T.dur || 3.2, a = Math.min(clamp(T.el / 0.4, 0, 1), clamp((d - T.el) / 0.4, 0, 1));
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = T.bgColor || "rgba(255,250,235,.96)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = T.color || "#c62828"; ctx.textAlign = "center";
    const s = 0.9 + 0.1 * easeOutBack(clamp(T.el / 0.6, 0, 1));
    ctx.translate(W / 2, H / 2 - 30); ctx.scale(s, s);
    const lines = wrapText(ctx, T.text || "", 1600, 96);
    ctx.font = `bold 96px ${FONT}`; lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * 110));
    if (T.sub) { ctx.textAlign = "left"; drawTex(ctx, T.sub, 0, lines.length * 60 + 70, 52, "#37474f", "center", 1); }
    ctx.restore(); ctx.textAlign = "left";
  }
  function drawQuiz(ctx, Q, life) {
    const a = clamp(Q.el / 0.35, 0, 1), reveal = Q.el >= 0.8 + Q.think;
    ctx.save(); ctx.globalAlpha = a;
    const x = 260, y = 70, w = W - 520, opts = Q.options || [], h = 190 + Math.ceil(opts.length / 2) * 130;
    ctx.fillStyle = "rgba(255,253,245,.97)"; ctx.strokeStyle = "#f2a900"; ctx.lineWidth = 8; roundRect(ctx, x, y, w, h, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#c62828"; ctx.font = `bold 50px ${FONT}`; ctx.fillText("❓", x + 36, y + 80);
    drawTex(ctx, Q.q || "", x + 110, y + 80, 50, INK, "left", 1);
    opts.forEach((o, i) => {
      const cx = x + 60 + (i % 2) * (w / 2 - 30), cy = y + 140 + Math.floor(i / 2) * 130, ow = w / 2 - 90;
      const right = reveal && i === Q.answer;
      ctx.fillStyle = right ? "#c8e6c9" : "#fff"; ctx.strokeStyle = right ? "#2e7d32" : "#90a4ae"; ctx.lineWidth = right ? 8 : 4;
      roundRect(ctx, cx, cy, ow, 100, 20); ctx.fill(); ctx.stroke();
      drawTex(ctx, "ABCD"[i] + ".  " + o, cx + 30, cy + 66, 46, INK, "left", 1);
      if (right) drawItem(ctx, { type: "check", x: cx + ow - 60, y: cy + 50, scale: 0.6, _seed: 5 }, life);
    });
    if (!reveal) { const left = Math.ceil(0.8 + Q.think - Q.el); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.arc(x + w - 80, y + 70, 48, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `bold 56px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(String(Math.max(0, left)), x + w - 80, y + 90); ctx.textAlign = "left"; }
    ctx.restore();
  }

  /* ------------------------------ trình phát ------------------------------ */
  const STICKFILM = {
    W, H, POSES, PROPS, BG, BOARDS, Audio, Voice, ui,
    measure(str, size) { const c = document.createElement("canvas").getContext("2d"); return drawTex(c, str, 0, 0, size, "#000", "left", 1); },
    load(film) {
      this.film = film; this.timing = window.FILM_TIMING || null; this.comp = compile(film, this.timing);
      this.duration = this.comp.duration; return this;
    },
    setTiming(map) { this.timing = map; this.comp = compile(this.film, map); this.duration = this.comp.duration; return this.duration; },
    info() { return { duration: this.duration, scenes: this.comp.scenes.map((s) => ({ start: s.start, end: s.end, title: s.src.name || "" })), says: this.comp.says, sfx: this.comp.sfx }; },
    renderAt(ctx, t, life) { return renderFrame(ctx, this.film, this.comp, clamp(t, 0, this.duration - 1e-6), life == null ? t : life, null); },
    // ---- phát trực tiếp ----
    attach(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.t = 0; this.playing = false; this.lastSay = null; this.useVoice = true; Voice.useVoice = true; this._loop(); },
    _loop() {
      let prev = performance.now(); const t0 = prev;
      const step = (now) => {
        const dt = Math.min(0.1, (now - prev) / 1000); prev = now; const life = (now - t0) / 1000;
        if (this.playing) {
          let nt = this.t + dt * (this.speed || 1);
          // giữ hình chờ giọng đọc nói xong
          const cur = this._curSay(this.t);
          if (cur && this.useVoice && Voice.speaking && this.liveSay === cur.id && nt > cur.t + cur.dur) nt = Math.max(this.t, cur.t + cur.dur);
          this._fire(this.t, nt); this.t = nt;
          if (this.t >= this.duration) { this.t = this.duration; this.playing = false; Voice.stop(); Audio.duck(false); this.onEnd && this.onEnd(); }
        }
        const S = renderFrame(this.ctx, this.film, this.comp, Math.min(this.t, this.duration - 1e-6), life, { sayId: this.liveSay });
        this.onFrame && this.onFrame(this.t, S);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    _curSay(t) { const s = this.comp.says; for (let i = s.length - 1; i >= 0; i--) if (s[i].t <= t + 1e-6) return t < s[i].t + s[i].dur + 0.5 ? s[i] : null; return null; },
    _fire(a, b) {
      this.comp.sfx.forEach((e) => { if (e.t >= a && e.t < b) Audio.play(e.name, e.dur); });
      this.comp.says.forEach((s) => {
        if (s.t >= a && s.t < b && this.useVoice && Voice.ok && Voice.vi.length) {
          this.liveSay = s.id; Audio.duck(true);
          const c = (this.film.cast && this.film.cast[s.who]) || {};
          const pitch = c.pitch || (s.voice === "tre" ? 1.35 : s.voice === "nam" ? 0.85 : 1.02);
          Voice.speak(s.text, { voice: s.voice, pitch, rate: c.rate }, () => { if (this.liveSay === s.id) { Audio.duck(false); } });
        }
      });
    },
    play() { Audio.init(); if (Audio.ctx && Audio.ctx.state === "suspended") Audio.ctx.resume(); if (this.t >= this.duration) this.seek(0); this.playing = true; const cur = this._curSay(this.t); if (cur && this.t > cur.t + 0.05 && this.t < cur.t + cur.dur) this._fire(cur.t, cur.t + 0.0001); },
    pause() { this.playing = false; Voice.stop(); Audio.duck(false); },
    seek(t) { Voice.stop(); Audio.duck(false); this.liveSay = null; this.t = clamp(t, 0, this.duration); },
    sceneIndex() { const i = this.comp.scenes.findIndex((s) => this.t < s.end); return i < 0 ? this.comp.scenes.length - 1 : i; },
    goScene(i) { i = clamp(i, 0, this.comp.scenes.length - 1); const was = this.playing; this.seek(this.comp.scenes[i].start); if (was) { this.playing = true; this._fire(this.t - 0.0001, this.t + 0.001); } }
  };
  STICKFILM.Voice = Voice;
  window.STICKFILM = STICKFILM;
  Voice.load();
})();
