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
  const MCTX = document.createElement("canvas").getContext("2d");
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
    // —— võ thuật ——
    guard: (t) => ({ fa: [62, 150], ba: [42, 155], fl: [26, -4], bl: [-30, -12], lean: 6, lift: Math.abs(Math.sin(t * 5.5)) * 5 }),
    punch: () => ({ fa: [94, 92], ba: [32, 152], fl: [32, 0], bl: [-38, -12], lean: 14 }),
    punch2: () => ({ fa: [40, 150], ba: [96, 92], fl: [30, 0], bl: [-36, -12], lean: 18 }),
    uppercut: () => ({ fa: [70, 172], ba: [30, 150], fl: [24, -6], bl: [-30, -12], lean: -6, head: -8 }),
    kick: () => ({ fa: [55, 140], ba: [-45, -20], fl: [94, 92], bl: [-6, 0], lean: -16 }),
    highkick: () => ({ fa: [60, 150], ba: [-60, -30], fl: [128, 122], bl: [-4, 0], lean: -26 }),
    block: () => ({ fa: [72, 168], ba: [62, 172], fl: [22, 0], bl: [-26, -6], lean: -4, head: 8 }),
    hit: () => ({ fa: [-35, -10], ba: [-75, -40], fl: [12, 0], bl: [-22, -6], lean: -24, head: -20 }),
    hitlow: () => ({ fa: [40, 10], ba: [35, 5], fl: [18, -20], bl: [-14, -18], lean: 32, head: 18 }),
    dizzy: (t) => ({ fa: [8 + Math.sin(t * 4) * 10, 0], ba: [-8, 0], fl: [10, 0], bl: [-10, 0], lean: Math.sin(t * 3) * 10, head: Math.sin(t * 4) * 14 }),
    bow: () => ({ fa: [18, 60], ba: [12, 60], fl: [4, 0], bl: [-4, 0], lean: 38, head: 22 }),
    fistbow: () => ({ fa: [70, 140], ba: [66, 150], fl: [4, 0], bl: [-4, 0], lean: 24, head: 14 }),
    victory: (t) => ({ fa: [158, 176], ba: [30, 150], fl: [20, 0], bl: [-20, -4], head: -8, lift: Math.abs(Math.sin(t * 4)) * 6 }),
    kneel: () => ({ fa: [30, 20], ba: [20, 10], fl: [80, 0], bl: [-20, -110], lean: 10, head: 10 }),
    skate: (t) => ({ fa: [78, 98 + Math.sin(t * 3) * 8], ba: [-72, -92 + Math.sin(t * 3 + 1) * 8], fl: [30, -18], bl: [-24, -42], lean: 6 + Math.sin(t * 2.5) * 3 }),
    nod: (t) => ({ fa: [14, 4], ba: [-14, -4], fl: [7, 0], bl: [-7, 0], head: Math.sin(t * 8) * 9 })
  };
  /* ------------- chuyển động như người thật: bàn chân bám đất (IK) ------------- */
  const LEG = { th: 86, sh: 86 };
  function noise1(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i * 7.13 + seed), hash((i + 1) * 7.13 + seed), u) * 2 - 1; }
  const easeOutSoft = (t) => { const c1 = 1.15, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function feetFromAngles(P) {
    const pt = (x, y, L, a) => [x + L * Math.sin(rad(a)), y + L * Math.cos(rad(a))];
    const fK = pt(0, 0, LEG.th, P.fl[0]), fF = pt(fK[0], fK[1], LEG.sh, P.fl[1]);
    const bK = pt(0, 0, LEG.th, P.bl[0]), bF = pt(bK[0], bK[1], LEG.sh, P.bl[1]);
    return { ff: fF, bf: bF, hipH: Math.max(fF[1], bF[1]) };
  }
  function poseAt(name, t) { const P = (POSES[name] || POSES.idle)(t); if (!P.ff) Object.assign(P, feetFromAngles(P)); return P; }
  // k: thân + chân, ka: tay (trễ, hơi vượt đà), kh: đầu (trễ nhất) → chuyển động gối nhau tự nhiên
  function blendPose(a, b, k, ka, kh) {
    ka = ka == null ? k : ka; kh = kh == null ? k : kh;
    const o = {};
    ["fa", "ba"].forEach((key) => { o[key] = [lerp(a[key][0], b[key][0], ka), lerp(a[key][1], b[key][1], ka)]; });
    ["ff", "bf"].forEach((key) => { o[key] = [lerp(a[key][0], b[key][0], k), lerp(a[key][1], b[key][1], k)]; });
    o.hipH = lerp(a.hipH, b.hipH, k);
    ["lean", "lift", "rot"].forEach((key) => { o[key] = lerp(a[key] || 0, b[key] || 0, k); });
    o.head = lerp(a.head || 0, b.head || 0, kh);
    return o;
  }
  // quãng đường chuẩn hoá theo vận tốc hình thang: tăng tốc – đều – giảm tốc
  function trap(k, r) {
    k = clamp(k, 0, 1); const v = 1 / (1 - r);
    if (k < r) return 0.5 * v * k * k / r;
    if (k > 1 - r) { const q = 1 - k; return 1 - 0.5 * v * q * q / r; }
    return 0.5 * v * r + v * (k - r);
  }
  function gaitFeet(u, n, L) {
    const i = Math.min(Math.floor(u), n - 1), f = clamp(u - i, 0, 1);
    const a = Math.max(0, (i - 1) * L), b = i === n - 1 ? n * L : (i + 1) * L, sm = f * f * (3 - 2 * f);
    return { st: i * L, sw: lerp(a, b, sm), f, swingIsF: i % 2 === 0 };
  }
  function gaitPose(g) {
    if (g.style === "jump") return jumpPose(g.k);
    if (g.style === "flykick") { const P = jumpPose(g.k); if (g.k > 0.3 && g.k < 0.8) { const K = poseAt("kick", 0); return { ...P, fa: [60, 150], ba: [-60, -30], ff: K.ff, bf: [-20, 120], lean: -14 }; } return P; }
    const run = g.style === "run", F = gaitFeet(g.u, g.n, g.L), hip = g.u * g.L, sf = Math.sin(Math.PI * F.f);
    const lift = sf * (run ? 58 : 26);
    const H = run ? 156 + sf * 12 : 168 - (1 - sf) * 6;           // hông thấp nhất lúc hai chân chạm đất
    const sw = [F.sw - hip + (run ? 0 : sf * 6), H - lift];
    const st = [F.st - hip, H - (run ? Math.max(0, F.f - 0.62) * 80 : Math.max(0, F.f - 0.7) * 30)]; // nhấc gót
    const ff = F.swingIsF ? sw : st, bf = F.swingIsF ? st : sw;
    const u2 = Math.max(0, g.u - 0.12), F2 = gaitFeet(u2, g.n, g.L), h2 = u2 * g.L;   // tay vung trễ hơn chân
    const rf = ((F2.swingIsF ? F2.sw : F2.st) - h2) / g.L, rb = ((F2.swingIsF ? F2.st : F2.sw) - h2) / g.L;
    const A = run ? 44 : 32;
    return {
      fa: [-rf * A + (run ? 22 : 3), -rf * A + (run ? 105 : 10 + Math.max(0, rf) * 22)],
      ba: [-rb * A + (run ? 22 : 3), -rb * A + (run ? 105 : 10 + Math.max(0, rb) * 22)],
      ff, bf, hipH: H, lean: run ? 13 : 4, head: run ? -4 : -sf * 2, lift: 0
    };
  }
  function jumpPose(k) {
    if (k < 0.22) { const c = Math.sin((k / 0.22) * Math.PI / 2); return { fa: [-45 * c, -25 * c], ba: [-50 * c, -30 * c], ff: [14, 168 - 48 * c], bf: [-12, 168 - 48 * c], hipH: 168 - 48 * c, lean: 18 * c, head: 6 * c }; }
    if (k < 0.82) { const q = (k - 0.22) / 0.6, tuck = Math.sin(q * Math.PI); return { fa: [140, 160], ba: [-140, -160], ff: [24 + tuck * 20, 168 - tuck * 50], bf: [-14, 168 - tuck * 44], hipH: 168, lean: 4, head: -6 }; }
    const c = Math.sin(((k - 0.82) / 0.18) * Math.PI); return { fa: [60 * c + 10, 90 * c + 5], ba: [-30 * c, -20 * c], ff: [16, 168 - 42 * c], bf: [-14, 168 - 42 * c], hipH: 168 - 42 * c, lean: 14 * c, head: 4 * c };
  }
  function moveContacts(m, from, S0) {
    // thời điểm (0..1) từng bàn chân chạm đất → tiếng bước chân khớp hình
    const style = m.style || "walk", to = m.to != null ? m.to : from + (m.by || 0), dist = Math.abs(to - from);
    if (style === "jump" || style === "flykick") return [{ k: 0.22, name: style === "flykick" ? "whoosh" : "jump" }, { k: 0.82, name: "land" }];
    if (style === "slide") return [];
    if (dist < 1) return [];
    const n = Math.max(1, Math.round(dist / ((style === "run" ? 150 : 96) * S0))), out = [];
    for (let j = 1; j <= n; j++) { let lo = 0, hi = 1; for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (trap(mid, 0.18) * n < j) lo = mid; else hi = mid; } out.push({ k: (lo + hi) / 2, name: style === "run" ? "steprun" : "step" }); }
    out.push({ k: 1, name: "step", after: 0.26 });
    return out;
  }

  /* ------------------------- vẽ nhân vật ------------------------- */
  function drawFigure(ctx, ch, life) {
    const S = ch.scale || 1, P = ch._pose, dir = ch._dir || (ch.flip ? -1 : 1);
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
    const ik = (F) => { const a = LEG.th, b = LEG.sh; let x = F[0], y = F[1], d = Math.max(1, Math.hypot(x, y)); const md = a + b - 0.5; if (d > md) { x *= md / d; y *= md / d; d = md; } const ang = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)), kA = Math.atan2(y, x) - ang; return [[dir * a * Math.cos(kA), a * Math.sin(kA)], [dir * x, y]]; };
    const [fK, fF] = ik(P.ff), [bK, bF] = ik(P.bf);
    const headC = pt(neck[0], neck[1], LEN.neck + LEN.head, 180 - lean - (P.head || 0) * 0.3);
    const footY = P.hipH;
    const seed = ch._seed || 1;
    ctx.save();
    ctx.translate(ch.x + (ch._sway || 0) * S * dir, (ch.y || GROUND) - (P.lift || 0) * S);
    if (ch.tilt) ctx.rotate(rad(ch.tilt));
    if (ch.skate) {
      // ván trượt: mặt ván + 2 bánh, nhân vật đứng trên ván
      ctx.save(); ctx.scale(S, S); ctx.lineWidth = 5; ctx.strokeStyle = INK;
      ctx.fillStyle = "#ff7043"; roundRect(ctx, -78, -34, 156, 14, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffeb3b"; [-48, 48].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, -11, 10, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.restore(); ctx.translate(0, -34 * S);
    }
    ctx.scale(S * (ch._turnSx || 1), S);
    if (P.rot) { ctx.translate(0, -40); ctx.rotate(rad(P.rot) * dir); }
    ctx.translate(0, -footY);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ch.color || (DARK ? "#f2f2f2" : INK);
    const LW = 9;
    // bóng dưới chân
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "#000"; ctx.beginPath();
    ctx.ellipse(0, footY + (P.lift || 0) + 6, 58, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (ch.cape) drawCape(ctx, ch, shoulder, dir, life);
    // chi sau (mờ hơn một chút cho có chiều sâu)
    ctx.lineWidth = LW; ctx.globalAlpha = 0.85;
    hline(ctx, [hip, bK, bF, [bF[0] + dir * 17, bF[1] + 1]], seed + 1);
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
    hline(ctx, [hip, fK, fF, [fF[0] + dir * 17, fF[1] + 1]], seed + 4);
    hline(ctx, [shoulder, fE, fH], seed + 5);
    // đồ cầm tay
    if (ch.holding) (WEAPONS.has(ch.holding) ? drawWeapon(ctx, ch.holding, fH, dir, life) : drawHeld(ctx, ch.holding, fH, dir, life));
    if (ch.hold2) (WEAPONS.has(ch.hold2) ? drawWeapon(ctx, ch.hold2, bH, dir, life) : drawHeld(ctx, ch.hold2, bH, dir, life));
    if (ch.fists || FIGHT.has(ch.pose)) { ctx.fillStyle = ch.gloves || ch.color || INK; [fH, bH].forEach((h) => { ctx.beginPath(); ctx.arc(h[0], h[1], 10, 0, 7); ctx.fill(); }); }
    if (ch.belt) { const b0 = pt(0, 0, 4, 180 - lean); ctx.save(); ctx.strokeStyle = ch.belt; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(b0[0] - 20, b0[1]); ctx.lineTo(b0[0] + 20, b0[1]); ctx.moveTo(b0[0] - dir * 6, b0[1]); ctx.lineTo(b0[0] - dir * 26, b0[1] + 26 + Math.sin(life * 7) * 4); ctx.stroke(); ctx.restore(); }
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
    if (ch.robot) { drawRobotHead(ctx, ch, r, dir, life); ctx.restore(); return; }
    drawHeadwearBack(ctx, ch, r, dir, life);
    // tóc sau
    const hc = ch.hairColor || INK;
    if (ch.hair === "long") { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-r - 4, -6); ctx.quadraticCurveTo(-r - 14, r + 36, -dir * 6 - r * 0.2, r + 34); ctx.lineTo(dir * r * 0.6, 0); ctx.closePath(); ctx.fill(); }
    if (ch.hair === "ponytail") { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(-dir * (r + 14), -r * 0.2 + Math.sin(life * 4) * 3, 14, 30, rad(-20 * dir), 0, Math.PI * 2); ctx.fill(); }
    if (ch.hair === "bun") { ctx.fillStyle = hc; ctx.beginPath(); ctx.arc(-dir * r * 0.5, -r - 6, 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 8; ctx.strokeStyle = ch.color || (DARK ? "#f2f2f2" : INK);
    hcircle(ctx, 0, 0, r, seed, ch.skin || "#fffdf8");
    drawMaskUnder(ctx, ch, r, dir);
    // tóc trước
    ctx.fillStyle = hc;
    if (["short", "long", "ponytail", "bun", "spiky"].includes(ch.hair)) {
      ctx.beginPath(); ctx.arc(0, 0, r + 3, Math.PI * 1.08, Math.PI * 1.92); ctx.quadraticCurveTo(dir * r * 0.2, -r * 0.35, -r * 0.95, -r * 0.3); ctx.closePath(); ctx.fill();
      if (ch.hair === "spiky") for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14 - 8, -r + 4); ctx.lineTo(i * 14, -r - 22); ctx.lineTo(i * 14 + 8, -r + 4); ctx.fill(); }
    }
    if (ch.band) { ctx.save(); ctx.strokeStyle = ch.band; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, r - 1, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); const tx = -dir * r * 0.85, ty = -r * 0.45, fl = Math.sin(life * 9) * 6; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - dir * 22, ty + fl, tx - dir * 46, ty + 10 + fl); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - dir * 18, ty + 14 - fl, tx - dir * 38, ty + 26 - fl); ctx.stroke(); ctx.restore(); }
    if (ch.bow) { ctx.fillStyle = ch.bow; ctx.beginPath(); const bx = -dir * r * 0.55, by = -r * 0.85; ctx.moveTo(bx, by); ctx.lineTo(bx - 16, by - 12); ctx.lineTo(bx - 16, by + 12); ctx.closePath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 16, by - 12); ctx.lineTo(bx + 16, by + 12); ctx.closePath(); ctx.fill(); }
    // mặt
    const face = ch.face || "happy";
    const lookBack = ch._look && ch._look !== dir; const ex = lookBack ? -dir * 3 : dir * 9, ey = -4;
    const blinkPhase = (life + (ch._seed || 0) * 1.3) % 4.2;
    const blink = blinkPhase < 0.13;
    const EYE = ch.mask === "eye" ? "#fff" : INK; ctx.fillStyle = EYE; ctx.strokeStyle = EYE; ctx.lineWidth = 4;
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
    if (ch.hat === "ninja") { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 7); ctx.clip(); ctx.fillStyle = "#263238"; ctx.fillRect(-r, 7, 2 * r, r); ctx.restore(); }
    drawHeadwearFront(ctx, ch, r, dir, life);
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

  const FIGHT = new Set(["guard", "punch", "punch2", "uppercut", "kick", "highkick", "block", "victory", "fistbow"]);
  /* Hiệu ứng va chạm kiểu truyện tranh: chớp sáng + tia + chữ */
  function drawFx(ctx, f, S) {
    let x = f.x, y = f.y;
    if (f.on && S.cast[f.on]) { const ch = S.cast[f.on], sc = ch.scale || 1; x = ch.x + (f.dx || 0); y = (ch.y || GROUND) - ({ head: 400, chest: 300, belly: 230, legs: 120 }[f.part || "chest"]) * sc + (f.dy || 0); }
    if (x == null) return;
    const d = f.dur || 0.5, k = clamp(f.el / d, 0, 1), a = 1 - k;
    ctx.save(); ctx.translate(x, y);
    if ((f.type || "hit") === "hit") {
      const R = 70 + 90 * easeOutBack(Math.min(1, k * 2.2));
      ctx.globalAlpha = a; ctx.fillStyle = "#fff59d"; ctx.strokeStyle = "#ff6f00"; ctx.lineWidth = 6; ctx.beginPath();
      for (let i = 0; i < 16; i++) { const rr = i % 2 ? R * 0.45 : R * (0.85 + hash(i + 3) * 0.3), an = (i / 16) * Math.PI * 2; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2 + 0.2; ctx.beginPath(); ctx.moveTo(Math.cos(an) * R * 1.05, Math.sin(an) * R * 1.05); ctx.lineTo(Math.cos(an) * R * 1.5, Math.sin(an) * R * 1.5); ctx.stroke(); }
    } else if (f.type === "dust") {
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = "#bcaaa4"; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 40 * (0.5 + k), -20 - k * 40 * hash(i + 9), 26 * (1 - k * 0.4), 0, 7); ctx.fill(); }
    } else if (f.type === "speed") {
      ctx.globalAlpha = a; ctx.strokeStyle = "#455a64"; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { const yy = -260 + i * 50; ctx.beginPath(); ctx.moveTo(-(f.dir || 1) * (60 + 40 * hash(i)), yy); ctx.lineTo(-(f.dir || 1) * (240 + 80 * hash(i + 4)), yy); ctx.stroke(); }
    }
    if (f.text) { const s = 1 + 0.25 * easeOutBack(Math.min(1, k * 3)); ctx.globalAlpha = Math.min(1, a * 1.6); ctx.rotate(rad(-10)); ctx.scale(s, s); ctx.font = `bold 110px ${FONT}`; ctx.textAlign = "center"; ctx.lineWidth = 12; ctx.strokeStyle = "#1d1d1f"; ctx.strokeText(f.text, 0, -90); ctx.fillStyle = f.color || "#e53935"; ctx.fillText(f.text, 0, -90); }
    ctx.restore();
  }
  /* =================== VAI DIỄN / TRANG PHỤC THEO THỂ LOẠI =================== */
  const ROLES = {
    "ninja": { shirt: "#263238", hat: "ninja", band: "#c62828", belt: "#c62828", fists: true },
    "samurai": { shirt: "#6d4c41", hair: "bun", hold: "katana", belt: "#212121" },
    "hiep-si": { shirt: "#9e9e9e", hat: "knight", hold: "sword", hold2: "shield" },
    "phu-thuy": { shirt: "#5e35b1", skirt: true, hat: "wizard", beard: true, hairColor: "#eeeeee", hold: "staff" },
    "cong-chua": { shirt: "#f48fb1", skirt: true, hair: "long", hairColor: "#6d4c41", hat: "crown" },
    "vua": { shirt: "#c62828", hat: "crown", beard: true, hairColor: "#795548", cape: "#8e24aa" },
    "sieu-nhan": { shirt: "#1e88e5", cape: "#e53935", mask: "eye", hair: "short", fists: true },
    "phi-hanh-gia": { shirt: "#eceff1", hat: "space" },
    "hai-tac": { shirt: "#4e342e", hat: "pirate", eyepatch: true, beard: true, hold: "sword" },
    "cao-boi": { shirt: "#a1887f", hat: "cowboy" },
    "dau-bep": { shirt: "#fafafa", hat: "chef" },
    "bac-si": { shirt: "#fafafa", skirt: true, glasses: true, hair: "short" },
    "canh-sat": { shirt: "#1a237e", hat: "police" },
    "linh-cuu-hoa": { shirt: "#d32f2f", hat: "fire" },
    "robot": { robot: true, shirt: "#90a4ae", color: "#455a64" },
    "ong-gia": { hair: "short", hairColor: "#e0e0e0", beard: true, hold: "cane", voice: "nam", rate: 0.9 },
    "ba-gia": { hair: "bun", hairColor: "#e0e0e0", shirt: "#8d6e63", skirt: true, hold: "cane" },
    "nong-dan": { shirt: "#795548", hat: "nonla" },
    "hoc-sinh": { scale: 0.8, shirt: "#fafafa", hair: "short", voice: "tre" },
    "giao-vien": { glasses: true, hair: "long", shirt: "#e57373", skirt: true },
    "cau-thu": { shirt: "#e53935", hair: "spiky" },
    "vo-si": { shirt: "#fafafa", belt: "#212121", band: "#e53935", fists: true },
    "linh": { shirt: "#558b2f", hat: "knight", hold: "spear" },
    "nha-khoa-hoc": { shirt: "#fafafa", skirt: true, glasses: true, hair: "spiky", hairColor: "#9e9e9e" },
    "quai-vat": { horns: true, color: "#1b5e20", skin: "#a5d6a7", shirt: "#388e3c" },
    "tre-em": { scale: 0.65, hair: "ponytail", voice: "tre" }
  };
  ROLES.knight = ROLES["hiep-si"]; ROLES.wizard = ROLES["phu-thuy"]; ROLES.hero = ROLES["sieu-nhan"]; ROLES.pirate = ROLES["hai-tac"];
  ROLES.astronaut = ROLES["phi-hanh-gia"]; ROLES["kiem-si"] = ROLES.samurai; ROLES.king = ROLES.vua; ROLES.princess = ROLES["cong-chua"];

  /* Mũ, mặt nạ, đầu robot — vẽ trong hệ toạ độ đầu (tâm 0,0, bán kính r) */
  function drawHeadwearBack(ctx, ch, r, dir, life) {
    if (ch.hat === "wizard") { ctx.fillStyle = ch.hatColor || "#4527a0"; ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 1.55, r * 0.28, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawHeadwearFront(ctx, ch, r, dir, life) {
    const H = ch.hat;
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    if (H === "crown") { ctx.fillStyle = "#ffca28"; ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.65); for (let i = 0; i <= 4; i++) { const x = -r * 0.75 + (i * r * 1.5) / 4; ctx.lineTo(x, i % 2 ? -r * 1.05 : -r * 1.45); } ctx.lineTo(r * 0.75, -r * 0.65); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.arc(0, -r * 0.85, 6, 0, 7); ctx.fill(); }
    if (H === "wizard") { ctx.fillStyle = ch.hatColor || "#5e35b1"; ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.55); ctx.quadraticCurveTo(-r * 0.2, -r * 1.6, -dir * r * 0.6 + Math.sin(life * 2) * 6, -r * 2.6); ctx.quadraticCurveTo(r * 0.3, -r * 1.4, r * 0.95, -r * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffeb3b"; [[-8, -r * 1.2], [10, -r * 1.7]].forEach(([x, y]) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 4 : 9, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill(); }); }
    if (H === "pirate") { ctx.fillStyle = "#212121"; ctx.beginPath(); ctx.moveTo(-r * 1.3, -r * 0.55); ctx.quadraticCurveTo(0, -r * 1.9, r * 1.3, -r * 0.55); ctx.quadraticCurveTo(0, -r * 0.85, -r * 1.3, -r * 0.55); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -r * 0.95, 7, 0, 7); ctx.fill(); }
    if (H === "cowboy") { ctx.fillStyle = ch.hatColor || "#8d6e63"; ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 1.6, r * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.62); ctx.quadraticCurveTo(-r * 0.8, -r * 1.5, 0, -r * 1.3); ctx.quadraticCurveTo(r * 0.8, -r * 1.5, r * 0.7, -r * 0.62); ctx.fill(); ctx.stroke(); }
    if (H === "chef") { ctx.fillStyle = "#fff"; ctx.fillRect(-r * 0.7, -r * 1.05, r * 1.4, r * 0.4); ctx.strokeRect(-r * 0.7, -r * 1.05, r * 1.4, r * 0.4); [-0.45, 0, 0.45].forEach((k) => { ctx.beginPath(); ctx.arc(k * r, -r * 1.3, r * 0.42, 0, 7); ctx.fill(); ctx.stroke(); }); }
    if (H === "police") { ctx.fillStyle = "#1a237e"; ctx.beginPath(); ctx.arc(0, -r * 0.45, r + 2, Math.PI, 0); ctx.fill(); ctx.fillRect(dir > 0 ? -r * 0.2 : -r - 26, -r * 0.5, r + 26, 9); ctx.fillStyle = "#ffca28"; ctx.beginPath(); ctx.arc(0, -r * 0.85, 7, 0, 7); ctx.fill(); }
    if (H === "fire") { ctx.fillStyle = "#c62828"; ctx.beginPath(); ctx.arc(0, -r * 0.35, r + 4, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillRect(-r - 26, -r * 0.4, 2 * r + 52, 10); ctx.fillStyle = "#ffca28"; ctx.fillRect(-8, -r * 1.2, 16, 22); }
    if (H === "nonla") { ctx.fillStyle = "#f3e5ab"; ctx.beginPath(); ctx.moveTo(-r * 1.7, -r * 0.4); ctx.lineTo(0, -r * 1.55); ctx.lineTo(r * 1.7, -r * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "rgba(120,90,40,.5)"; ctx.lineWidth = 2; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-r * 1.7 * (i / 4), -r * 0.4 - r * 1.15 * (1 - i / 4)); ctx.lineTo(r * 1.7 * (i / 4), -r * 0.4 - r * 1.15 * (1 - i / 4)); ctx.stroke(); } }
    if (H === "knight") { ctx.fillStyle = "#b0bec5"; ctx.beginPath(); ctx.arc(0, -r * 0.15, r + 5, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(r + 5, r * 0.2); ctx.lineTo(dir * r * 0.15, r * 0.2); ctx.lineTo(-dir * (r + 5), r * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#37474f"; ctx.fillRect(dir > 0 ? r * 0.05 : -r * 1.05, -r * 0.3, r, 8); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.moveTo(0, -r - 4); ctx.quadraticCurveTo(-dir * r * 1.4, -r * 1.7 + Math.sin(life * 5) * 5, -dir * r * 1.6, -r * 0.4); ctx.quadraticCurveTo(-dir * r * 0.8, -r * 1.1, 0, -r - 4); ctx.fill(); }
    if (H === "space") { ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = "#b3e5fc"; ctx.beginPath(); ctx.arc(0, 0, r * 1.45, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 5; ctx.strokeStyle = "#cfd8dc"; ctx.stroke(); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#fff"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, r * 1.2, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke(); ctx.restore(); }
    if (ch.horns) { ctx.fillStyle = "#fff8e1"; [-1, 1].forEach((s) => { ctx.beginPath(); ctx.moveTo(s * r * 0.35, -r * 0.85); ctx.lineTo(s * r * 0.75, -r * 1.55); ctx.lineTo(s * r * 0.75, -r * 0.65); ctx.closePath(); ctx.fill(); ctx.stroke(); }); }
    if (ch.eyepatch) { ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(dir * 9 + dir * 13, -4, 11, 9, 0, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r, -r * 0.45); ctx.lineTo(r, r * 0.05); ctx.stroke(); }
  }
  // trước khi vẽ mắt: mặt nạ ninja / mặt nạ siêu nhân
  function drawMaskUnder(ctx, ch, r, dir) {
    if (ch.hat === "ninja") { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 7); ctx.clip(); ctx.fillStyle = "#263238"; ctx.fillRect(-r, -r, 2 * r, 2 * r); ctx.fillStyle = ch.skin || "#fffdf8"; ctx.fillRect(-r, -16, 2 * r, 22); ctx.restore(); return true; }
    if (ch.mask === "eye") { ctx.fillStyle = ch.maskColor || "#212121"; ctx.beginPath(); ctx.ellipse(dir * 9, -5, r * 0.75, 13, 0, 0, 7); ctx.fill(); return false; }
    return false;
  }
  function drawRobotHead(ctx, ch, r, dir, life) {
    ctx.fillStyle = ch.shirt || "#90a4ae"; ctx.strokeStyle = ch.color || INK; ctx.lineWidth = 6;
    roundRect(ctx, -r, -r, 2 * r, 2 * r, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, -r - 22); ctx.stroke(); ctx.fillStyle = Math.sin(life * 6) > 0 ? "#ff5252" : "#ffcdd2"; ctx.beginPath(); ctx.arc(0, -r - 26, 7, 0, 7); ctx.fill();
    ctx.fillStyle = "#00e5ff"; const blink = (life + (ch._seed || 0)) % 3.5 < 0.12; [-1, 1].forEach((s) => ctx.fillRect(dir * 8 + s * 14 - 8, -10, 16, blink ? 3 : 14));
    ctx.fillStyle = "#37474f"; const o = (ch._talk || 0) * 10; ctx.fillRect(dir * 8 - 16, 14 - o / 2, 32, 6 + o);
  }
  function drawCape(ctx, ch, sh, dir, life) {
    const mv = ch._gait ? 1 : 0.3, wv = Math.sin(life * 7) * 9 * mv + Math.sin(life * 2.3) * 4;
    ctx.save(); ctx.fillStyle = ch.cape; ctx.strokeStyle = ch.color || (DARK ? "#eee" : INK); ctx.lineWidth = 4; ctx.beginPath();
    ctx.moveTo(sh[0] + dir * 10, sh[1] - 2);
    ctx.quadraticCurveTo(sh[0] - dir * (30 + 50 * mv), sh[1] + 70, sh[0] - dir * (24 + 110 * mv) + wv, sh[1] + 150 - mv * 30);
    ctx.lineTo(sh[0] - dir * (4 + 60 * mv) + wv * 0.6, sh[1] + 168 - mv * 20);
    ctx.quadraticCurveTo(sh[0] - dir * 12, sh[1] + 80, sh[0] - dir * 12, sh[1] + 4);
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function drawWeapon(ctx, kind, h, dir, life) {
    ctx.save(); ctx.translate(h[0], h[1]); ctx.lineCap = "round";
    const R = (deg) => ctx.rotate(rad(deg) * dir);
    if (kind === "sword" || kind === "katana") {
      R(-55); ctx.fillStyle = "#5d4037"; ctx.fillRect(-5, -6, 10, 34); ctx.fillStyle = "#ffca28"; ctx.fillRect(-18, -10, 36, 7);
      ctx.fillStyle = "#eceff1"; ctx.strokeStyle = "#546e7a"; ctx.lineWidth = 3; ctx.beginPath();
      if (kind === "katana") { ctx.moveTo(-4, -10); ctx.quadraticCurveTo(-10, -90, 6, -175); ctx.lineTo(10, -170); ctx.quadraticCurveTo(0, -90, 5, -10); }
      else { ctx.moveTo(-7, -10); ctx.lineTo(-7, -140); ctx.lineTo(0, -160); ctx.lineTo(7, -140); ctx.lineTo(7, -10); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === "shield") {
      ctx.fillStyle = "#1565c0"; ctx.strokeStyle = "#ffca28"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-36, -46); ctx.lineTo(36, -46); ctx.lineTo(36, 10); ctx.quadraticCurveTo(0, 60, -36, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(0, 30); ctx.moveTo(-22, -12); ctx.lineTo(22, -12); ctx.stroke();
    } else if (kind === "staff" || kind === "wand") {
      const L = kind === "staff" ? 230 : 70; ctx.strokeStyle = "#6d4c41"; ctx.lineWidth = kind === "staff" ? 9 : 6; ctx.beginPath(); ctx.moveTo(0, kind === "staff" ? 80 : 6); ctx.lineTo(dir * 6, -L + 80); ctx.stroke();
      const g = 0.5 + 0.5 * Math.sin(life * 5); ctx.fillStyle = `rgba(124,77,255,${0.25 + 0.25 * g})`; ctx.beginPath(); ctx.arc(dir * 6, -L + 70, 30 + g * 8, 0, 7); ctx.fill(); ctx.fillStyle = "#b388ff"; ctx.beginPath(); ctx.arc(dir * 6, -L + 70, 14, 0, 7); ctx.fill();
    } else if (kind === "cane") { ctx.strokeStyle = "#6d4c41"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir * 10, 150); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-dir * 6, -22, -dir * 22, -8); ctx.stroke(); }
    else if (kind === "spear") { R(-20); ctx.strokeStyle = "#6d4c41"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(0, -200); ctx.stroke(); ctx.fillStyle = "#cfd8dc"; ctx.beginPath(); ctx.moveTo(-10, -200); ctx.lineTo(0, -245); ctx.lineTo(10, -200); ctx.fill(); }
    ctx.restore();
  }
  const WEAPONS = new Set(["sword", "katana", "shield", "staff", "wand", "cane", "spear"]);

  /* =================== MÁY QUAY 2.5D (như phim 3D) =================== */
  const HORIZON = 560;
  function applyCam(ctx, C, p) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const z = 1 + (C.zoom - 1) * p;
    ctx.translate(W / 2 + (C.sx || 0), H / 2 + (C.sy || 0));
    if (C.rot) ctx.rotate(rad(C.rot));
    ctx.scale(z, z * (C.tilt || 1));
    ctx.translate(-(W / 2 + (C.x - W / 2) * p), -(H / 2 + (C.y - H / 2) * p));
  }
  function worldToScreen(C, p, x, y) {
    const z = 1 + (C.zoom - 1) * p;
    let X = (x - (W / 2 + (C.x - W / 2) * p)) * z, Y = (y - (H / 2 + (C.y - H / 2) * p)) * z * (C.tilt || 1);
    if (C.rot) { const c = Math.cos(rad(C.rot)), s = Math.sin(rad(C.rot)); [X, Y] = [X * c - Y * s, X * s + Y * c]; }
    return [X + W / 2 + (C.sx || 0), Y + H / 2 + (C.sy || 0)];
  }
  // khung hình theo cỡ cảnh: wide (toàn), full (toàn thân), medium (trung), close (cận), extreme (đặc tả), two (hai người), ots (qua vai)
  function shotFrame(c, cast) {
    const ids = arr(c.on).filter((id) => cast[id]), shot = c.shot || (ids.length > 1 ? "two" : "medium");
    if (shot === "wide" || !ids.length) return { x: W / 2, y: H / 2, zoom: 1 };
    const chs = ids.map((id) => cast[id]);
    if (shot === "ots" && c.from && cast[c.from]) {
      const a = cast[c.from], b = chs[0], s = b.scale || 1;
      return { x: lerp(a.x, b.x, 0.62), y: GROUND - 330 * s, zoom: clamp(1.9 / s, 1, 4) };
    }
    if (chs.length > 1 || shot === "two") {
      const xs = chs.map((ch) => ch.x), s = Math.max(...chs.map((ch) => ch.scale || 1));
      const span = Math.max(...xs) - Math.min(...xs) + 560 * s, zoom = clamp((W * 0.94) / span, 1, 2.6);
      return { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: GROUND - 250 * s - (zoom - 1) * 30, zoom };
    }
    const ch = chs[0], s = ch.scale || 1, dir = ch.flip ? -1 : 1;
    const T = { full: [1.3, 245], medium: [1.95, 330], close: [3.1, 400], extreme: [5, 428] }[shot] || [1.95, 330];
    const zoom = clamp(T[0] / s, 1, 7);
    const third = c.center ? 0 : dir * (W * 0.16) / zoom;
    return { x: ch.x + third, y: (ch.y || GROUND) - T[1] * s, zoom };
  }

  /* =================== PHÔNG NỀN NHIỀU LỚP (chiều sâu) =================== */
  function tile(ctx, period, fn, from, to) { for (let k = from == null ? -3 : from; k <= (to == null ? 4 : to); k++) { ctx.save(); ctx.translate(k * period, 0); fn(k); ctx.restore(); } }
  function skyFill(ctx, top, bot, y1) { const g = ctx.createLinearGradient(0, -400, 0, y1 || GROUND); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-6000, -3000, 14000, (y1 || GROUND) + 3000 + 400); }
  function groundFill(ctx, col, line) { ctx.fillStyle = col; ctx.fillRect(-8000, GROUND, 18000, 3000); ctx.strokeStyle = line || INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-8000, GROUND); ctx.lineTo(10000, GROUND); ctx.stroke(); }
  function clouds(ctx, life, n) { ctx.strokeStyle = INK; ctx.lineWidth = 4; for (let i = 0; i < (n || 6); i++) { const x = ((hash(i + 3) * 4000 + life * (10 + i * 3)) % 5200) - 1600, y = 60 + hash(i + 7) * 220; hcircle(ctx, x, y, 42, 91 + i, "#fff"); hcircle(ctx, x + 52, y + 6, 34, 95 + i, "#fff"); } }
  function hills(ctx, col, y, seed) { ctx.fillStyle = col; tile(ctx, 1500, (k) => { ctx.beginPath(); ctx.ellipse(300, y, 520, 200 + hash(k + seed) * 80, 0, Math.PI, 0); ctx.ellipse(1100, y, 460, 160 + hash(k + seed + 5) * 90, 0, Math.PI, 0); ctx.fill(); }); }
  function skyline(ctx, col, base, seed, win) {
    tile(ctx, 1400, (k) => { for (let i = 0; i < 9; i++) { const w = 110 + hash(i + seed) * 80, h = 180 + hash(i * 3 + seed + k) * 320, x = i * 155; ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h); if (win) { ctx.fillStyle = win; for (let yy = base - h + 20; yy < base - 30; yy += 46) for (let xx = x + 16; xx < x + w - 20; xx += 34) if (hash(xx * 0.7 + yy + k) > 0.45) ctx.fillRect(xx, yy, 16, 22); } } });
  }
  function streetLamp(ctx, x, on) { ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x, 560); ctx.quadraticCurveTo(x, 520, x + 60, 520); ctx.stroke(); ctx.fillStyle = on ? "#fff59d" : "#eee"; ctx.beginPath(); ctx.ellipse(x + 64, 532, 26, 14, 0, 0, 7); ctx.fill(); ctx.stroke(); if (on) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#fff59d"; ctx.beginPath(); ctx.moveTo(x + 40, 540); ctx.lineTo(x - 80, GROUND); ctx.lineTo(x + 210, GROUND); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  function bush(ctx, x, y, s, col, seed) { ctx.lineWidth = 5; ctx.strokeStyle = INK; [[-60, 0, 60], [0, -30, 75], [60, 0, 60]].forEach(([dx, dy, r], i) => hcircle(ctx, x + dx * s, y + dy * s, r * s, seed + i, col)); }
  function palm(ctx, x, life) { ctx.strokeStyle = "#6d4c41"; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + 40, 700, x + 20, 430); ctx.stroke(); ctx.fillStyle = "#43a047"; for (let i = 0; i < 6; i++) { const a = -Math.PI + (i / 5) * Math.PI + Math.sin(life * 1.5 + i) * 0.05; ctx.beginPath(); ctx.ellipse(x + 20 + Math.cos(a) * 110, 430 + Math.sin(a) * 50 + 40, 130, 26, a, 0, 7); ctx.fill(); } }
  const BGL = {
    park: {
      far: (ctx, life) => { skyFill(ctx, "#9fd8ff", "#e8f7ff"); ctx.strokeStyle = INK; ctx.lineWidth = 5; hcircle(ctx, 1650, 150, 70, 90, "#ffd54f"); clouds(ctx, life); },
      mid: (ctx) => hills(ctx, "#b5e3a0", GROUND - 40, 3),
      main: (ctx) => { groundFill(ctx, "#8fd16d"); tile(ctx, 1900, (k) => { tree(ctx, 220, GROUND, 1.1, 95 + k); tree(ctx, 1720, GROUND, 0.9, 99 + k); }); ctx.lineWidth = 5; hrect(ctx, 1320, 860, 240, 22, 120, "#b07a43"); hline(ctx, [[1340, 882], [1340, GROUND]], 121); hline(ctx, [[1540, 882], [1540, GROUND]], 122); },
      fg: (ctx) => tile(ctx, 2300, (k) => bush(ctx, 120, 1080, 1.3, "#4caf50", 800 + k))
    },
    street: {
      far: (ctx, life) => { skyFill(ctx, "#bfe0ff", "#f3f9ff"); clouds(ctx, life, 5); },
      mid: (ctx) => skyline(ctx, "#c5d3e0", GROUND - 60, 11),
      main: (ctx) => { groundFill(ctx, "#b9b9b9"); tile(ctx, 1920, (k) => { house(ctx, 80, GROUND, 340, 300, "#ffe0a3", 130 + k); house(ctx, 560, GROUND, 300, 360, "#cfe3b8", 140 + k); house(ctx, 1440, GROUND, 360, 320, "#f6c9c9", 150 + k); streetLamp(ctx, 1080, false); }); ctx.fillStyle = "#fff"; for (let x = -6000; x < 8000; x += 180) ctx.fillRect(x, 1010, 90, 12); }
    },
    city: {
      far: (ctx, life) => { skyFill(ctx, "#ff9e80", "#ffe0b2"); ctx.fillStyle = "#fff3e0"; ctx.beginPath(); ctx.arc(1500, 380, 90, 0, 7); ctx.fill(); },
      mid: (ctx) => skyline(ctx, "#8d6e9e", GROUND - 30, 21, "#ffe082"),
      main: (ctx) => { groundFill(ctx, "#78909c"); ctx.fillStyle = "#b0bec5"; ctx.fillRect(-8000, GROUND, 18000, 24); tile(ctx, 900, () => streetLamp(ctx, 200, true)); ctx.fillStyle = "#fff"; for (let x = -6000; x < 8000; x += 200) ctx.fillRect(x, 1030, 100, 10); }
    },
    rooftop: {
      far: (ctx, life) => { skyFill(ctx, "#1a237e", "#5c6bc0"); ctx.fillStyle = "#fffde7"; ctx.beginPath(); ctx.arc(1500, 170, 60, 0, 7); ctx.fill(); for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(BOIL + i)})`; ctx.fillRect(hash(i) * 5000 - 1500, hash(i + 9) * 500, 3, 3); } },
      mid: (ctx) => skyline(ctx, "#283593", GROUND + 40, 31, "#ffeb3b"),
      main: (ctx) => { ctx.fillStyle = "#455a64"; ctx.fillRect(-8000, GROUND, 18000, 3000); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-8000, GROUND); ctx.lineTo(10000, GROUND); ctx.stroke(); tile(ctx, 1700, (k) => { hrect(ctx, 200, 840, 160, 120, 400 + k, "#90a4ae"); hrect(ctx, 1200, 760, 110, 200, 410 + k, "#78909c"); ctx.fillStyle = "#607d8b"; ctx.fillRect(1170, 740, 170, 22); hline(ctx, [[600, GROUND], [600, 900], [760, 900]], 420 + k); }); },
      dark: true
    },
    forest: {
      far: (ctx) => { skyFill(ctx, "#c8e6c9", "#f1f8e9"); },
      mid: (ctx) => { tile(ctx, 520, (k) => { ctx.fillStyle = "#81c784"; ctx.beginPath(); ctx.moveTo(60, GROUND - 20); ctx.lineTo(200, 420 + hash(k) * 120); ctx.lineTo(340, GROUND - 20); ctx.fill(); ctx.fillStyle = "#a5d6a7"; ctx.beginPath(); ctx.moveTo(280, GROUND - 20); ctx.lineTo(400, 520 + hash(k + 3) * 100); ctx.lineTo(520, GROUND - 20); ctx.fill(); }); },
      main: (ctx) => { groundFill(ctx, "#6d9b4e"); tile(ctx, 1100, (k) => { ctx.fillStyle = "#6d4c41"; ctx.fillRect(140, 300, 60, GROUND - 300); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.strokeRect(140, 300, 60, GROUND - 300); hcircle(ctx, 170, 280, 170, 600 + k, "#388e3c"); hcircle(ctx, 60, 360, 110, 610 + k, "#43a047"); hcircle(ctx, 290, 360, 110, 620 + k, "#2e7d32"); }); },
      fg: (ctx) => { tile(ctx, 1600, (k) => { bush(ctx, 300, 1090, 1.5, "#2e7d32", 900 + k); ctx.fillStyle = "#1b5e20"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(1000 + i * 70, -20 + hash(i + k) * 60, 60, 26, 0.5, 0, 7); ctx.fill(); } }); }
    },
    castle: {
      far: (ctx, life) => { skyFill(ctx, "#b39ddb", "#f3e5f5"); clouds(ctx, life, 4); ctx.fillStyle = "#9fa8da"; ctx.beginPath(); ctx.moveTo(-2000, GROUND); ctx.lineTo(600, 320); ctx.lineTo(1300, GROUND); ctx.lineTo(1900, 420); ctx.lineTo(4000, GROUND); ctx.fill(); },
      mid: (ctx) => { ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.fillStyle = "#cfd8dc"; hrect(ctx, 760, 420, 420, 420, 700, "#cfd8dc"); [[700, 330], [1140, 330]].forEach(([x, y], i) => { hrect(ctx, x, y, 100, 510, 710 + i, "#b0bec5"); ctx.fillStyle = "#c62828"; ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x + 50, y - 110); ctx.lineTo(x + 115, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.arc(970, 840, 70, Math.PI, 0); ctx.fill(); },
      main: (ctx) => { groundFill(ctx, "#9ccc65"); tile(ctx, 1900, (k) => { ctx.fillStyle = "#d7ccc8"; ctx.beginPath(); ctx.moveTo(800, GROUND); ctx.lineTo(1120, GROUND); ctx.lineTo(1300, 1080); ctx.lineTo(620, 1080); ctx.fill(); }); }
    },
    night: {
      far: (ctx) => { skyFill(ctx, "#0b1026", "#283a6b"); ctx.fillStyle = "#fffde7"; ctx.beginPath(); ctx.arc(1500, 180, 70, 0, 7); ctx.fill(); ctx.fillStyle = "#0b1026"; ctx.beginPath(); ctx.arc(1530, 165, 62, 0, 7); ctx.fill(); for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.5 * Math.abs(Math.sin(BOIL * 0.7 + i))})`; ctx.fillRect(hash(i) * 6000 - 2000, hash(i + 5) * 600, 3, 3); } },
      mid: (ctx) => hills(ctx, "#1c2541", GROUND - 30, 7),
      main: (ctx) => { groundFill(ctx, "#2b3a55", "#000"); tile(ctx, 1600, (k) => { ctx.fillStyle = "#111a2e"; ctx.fillRect(300, 420, 40, GROUND - 420); ctx.beginPath(); ctx.arc(320, 400, 130, 0, 7); ctx.fill(); }); },
      dark: true
    },
    lab: {
      base: "#e0f2f1",
      main: (ctx, life) => { ctx.fillStyle = "#e0f2f1"; ctx.fillRect(-8000, -3000, 18000, GROUND + 3000); ctx.fillStyle = "#cfd8dc"; for (let x = -6000; x < 8000; x += 120) ctx.fillRect(x, GROUND, 116, 400); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-8000, GROUND); ctx.lineTo(10000, GROUND); ctx.stroke();
        tile(ctx, 1500, (k) => { hrect(ctx, 100, 380, 420, 18, 300 + k, "#8d6e63"); [[160, "#e91e63"], [260, "#00bcd4"], [370, "#8bc34a"], [460, "#ffc107"]].forEach(([x, c], i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 16, 380); ctx.lineTo(x - 30, 330); ctx.lineTo(x - 6, 290); ctx.lineTo(x + 6, 290); ctx.lineTo(x + 30, 330); ctx.lineTo(x + 16, 380); ctx.closePath(); ctx.fill(); ctx.stroke(); }); hrect(ctx, 900, 300, 380, 250, 310 + k, "#263238"); ctx.strokeStyle = "#00e676"; ctx.lineWidth = 4; ctx.beginPath(); for (let x = 0; x <= 340; x += 10) ctx.lineTo(920 + x, 430 + Math.sin(x * 0.05 + life * 4) * 50); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 5; hrect(ctx, 820, 760, 560, 40, 320 + k, "#b0bec5"); }); }
    },
    beach: {
      far: (ctx, life) => { skyFill(ctx, "#81d4fa", "#e1f5fe", 760); ctx.strokeStyle = INK; ctx.lineWidth = 5; hcircle(ctx, 1550, 160, 75, 90, "#ffd54f"); clouds(ctx, life, 4); },
      mid: (ctx, life) => { ctx.fillStyle = "#29b6f6"; ctx.fillRect(-6000, 700, 14000, 300); ctx.strokeStyle = "#e1f5fe"; ctx.lineWidth = 5; for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let x = -3000; x < 5000; x += 40) ctx.lineTo(x, 740 + r * 55 + Math.sin(x * 0.02 + life * 2 + r) * 8); ctx.stroke(); } },
      main: (ctx, life) => { ctx.fillStyle = "#ffe0a3"; ctx.beginPath(); ctx.moveTo(-8000, GROUND - 40); ctx.lineTo(10000, GROUND - 40); ctx.lineTo(10000, 4000); ctx.lineTo(-8000, 4000); ctx.fill(); tile(ctx, 2000, () => { palm(ctx, 250, life); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(1500, GROUND); ctx.lineTo(1500, 640); ctx.stroke(); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.moveTo(1320, 680); ctx.quadraticCurveTo(1500, 520, 1680, 680); ctx.closePath(); ctx.fill(); ctx.stroke(); }); }
    },
    manim: { base: "#1c1c1c", main: (ctx) => { ctx.fillStyle = "#1c1c1c"; ctx.fillRect(-8000, -4000, 18000, 9000); }, dark: true },
    manimgrid: {
      base: "#1c1c1c", dark: true,
      main: (ctx) => { ctx.fillStyle = "#1c1c1c"; ctx.fillRect(-8000, -4000, 18000, 9000); ctx.strokeStyle = "rgba(41,171,202,.33)"; ctx.lineWidth = 2; for (let x = -4000; x <= 6000; x += 80) { ctx.beginPath(); ctx.moveTo(x, -3000); ctx.lineTo(x, 4000); ctx.stroke(); } for (let y = -3000; y <= 4000; y += 80) { ctx.beginPath(); ctx.moveTo(-4000, y); ctx.lineTo(6000, y); ctx.stroke(); } }
    }
  };
  const BGBASE = { classroom: "#f4ead7", whiteboard: "#eef1f4", home: "#fff3e0", space: "#0d1333", stage: "#2a1f2d", dojo: "#f3e3c3", grid: "#fbfaf5", market: "#fff6e8" };

  /* =================== HOẠT HÌNH KIỂU MANIM =================== */
  let CUR_ITEMS = {};
  const fnCache = {};
  function mfn(src) { if (!fnCache[src]) { try { const js = String(src).replace(/−/g, "-").replace(/\^/g, "**").replace(/(^|[(,*\/+\-=])\s*-(?!1\*)/g, "$1-1*"); fnCache[src] = new Function("x", "with (Math) { return (" + js + "); }"); } catch (e) { fnCache[src] = () => NaN; } } return fnCache[src]; }
  function axesMap(A) {
    const xmin = A.xmin != null ? A.xmin : -5, xmax = A.xmax != null ? A.xmax : 5, ymin = A.ymin != null ? A.ymin : -3, ymax = A.ymax != null ? A.ymax : 3, w = A.w || 1200, h = A.h || 700;
    return { xmin, xmax, ymin, ymax, w, h, sx: (v) => -w / 2 + ((v - xmin) / (xmax - xmin)) * w, sy: (v) => h / 2 - ((v - ymin) / (ymax - ymin)) * h };
  }
  function strokeProg(ctx, pts, prog, close) {
    if (pts.length < 2 || prog <= 0) return;
    const P = close ? pts.concat([pts[0]]) : pts; let L = 0; const seg = [];
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); L += d; }
    let left = L * clamp(prog, 0, 1); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    for (let i = 1; i < P.length && left > 0; i++) { const d = seg[i - 1]; if (d <= left) { ctx.lineTo(P[i][0], P[i][1]); left -= d; } else { const k = left / d; ctx.lineTo(lerp(P[i - 1][0], P[i][0], k), lerp(P[i - 1][1], P[i][1], k)); left = 0; } }
    ctx.stroke();
  }
  function graphPts(G, A) {
    const M = axesMap(A), f1 = mfn(G.fn || "x"), f2 = G._fn2 ? mfn(G._fn2) : null, mix = G._mix == null ? 1 : G._mix;
    const x0 = G.x0 != null ? G.x0 : M.xmin, x1 = G.x1 != null ? G.x1 : M.xmax, out = [], N = 240;
    for (let i = 0; i <= N; i++) { const v = lerp(x0, x1, i / N); let y = f1(v); if (f2) y = lerp(y, f2(v), mix); if (!isFinite(y) || y < M.ymin - 0.5 || y > M.ymax + 0.5) { if (out.length) out.push(null); continue; } out.push([M.sx(v), M.sy(clamp(y, M.ymin - 0.5, M.ymax + 0.5))]); }
    return out;
  }
  const MANIM_PROPS = {
    axes(ctx, it) {
      const M = axesMap(it), pr = it._prog == null ? 1 : it._prog, col = it.color || (DARK ? "#e0e0e0" : INK), size = it.size || 44;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = it.width || 5;
      const y0 = M.sy(clamp(0, M.ymin, M.ymax)), x0 = M.sx(clamp(0, M.xmin, M.xmax));
      if (it.grid) { ctx.save(); ctx.globalAlpha *= 0.25 * pr; ctx.lineWidth = 2; for (let v = Math.ceil(M.xmin); v <= M.xmax; v += it.step || 1) { ctx.beginPath(); ctx.moveTo(M.sx(v), -M.h / 2); ctx.lineTo(M.sx(v), M.h / 2); ctx.stroke(); } for (let v = Math.ceil(M.ymin); v <= M.ymax; v += it.stepY || it.step || 1) { ctx.beginPath(); ctx.moveTo(-M.w / 2, M.sy(v)); ctx.lineTo(M.w / 2, M.sy(v)); ctx.stroke(); } ctx.restore(); }
      strokeProg(ctx, [[-M.w / 2 - 20, y0], [M.w / 2 + 30, y0]], pr); strokeProg(ctx, [[x0, M.h / 2 + 20], [x0, -M.h / 2 - 30]], pr);
      if (pr >= 1) { ctx.beginPath(); ctx.moveTo(M.w / 2 + 44, y0); ctx.lineTo(M.w / 2 + 20, y0 - 12); ctx.lineTo(M.w / 2 + 20, y0 + 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x0, -M.h / 2 - 44); ctx.lineTo(x0 - 12, -M.h / 2 - 20); ctx.lineTo(x0 + 12, -M.h / 2 - 20); ctx.fill(); }
      if (it.labels !== false) { ctx.save(); ctx.globalAlpha *= clamp(pr * 2 - 1, 0, 1); const st = it.step || 1;
        for (let v = Math.ceil(M.xmin / st) * st; v <= M.xmax + 1e-9; v += st) { if (Math.abs(v) < 1e-9) continue; ctx.beginPath(); ctx.moveTo(M.sx(v), y0 - 10); ctx.lineTo(M.sx(v), y0 + 10); ctx.stroke(); drawTex(ctx, String(+v.toFixed(2)).replace("-", "−"), M.sx(v), y0 + size + 6, size, col, "center", 1); }
        const sty = it.stepY || st; for (let v = Math.ceil(M.ymin / sty) * sty; v <= M.ymax + 1e-9; v += sty) { if (Math.abs(v) < 1e-9) continue; ctx.beginPath(); ctx.moveTo(x0 - 10, M.sy(v)); ctx.lineTo(x0 + 10, M.sy(v)); ctx.stroke(); drawTex(ctx, String(+v.toFixed(2)).replace("-", "−"), x0 - 18, M.sy(v) + size * 0.35, size, col, "right", 1); }
        if (it.xlabel) drawTex(ctx, it.xlabel, M.w / 2 + 40, y0 - 24, size + 6, col, "center", 1); if (it.ylabel) drawTex(ctx, it.ylabel, x0 + 34, -M.h / 2 - 30, size + 6, col, "left", 1); ctx.restore(); }
    },
    graph(ctx, it) {
      const A = CUR_ITEMS[it.axes]; if (!A) return; ctx.translate((A.x || 0) - (it.x || 0), (A.y || 0) - (it.y || 0));
      const pts = graphPts(it, A), col = it.color || "#ffeb3b"; ctx.strokeStyle = col; ctx.lineWidth = it.width || 8;
      const runs = []; let cur = []; pts.forEach((p) => { if (!p) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p); }); if (cur.length > 1) runs.push(cur);
      const total = runs.reduce((s, r) => s + r.length, 0); let budget = (it._prog == null ? 1 : it._prog) * total;
      runs.forEach((r) => { if (budget <= 0) return; const n = Math.min(r.length, budget); strokeProg(ctx, r, n >= r.length ? 1 : n / r.length); budget -= r.length; });
      if (it.label && (it._prog == null || it._prog >= 1)) { const l = runs.length ? runs[runs.length - 1] : null; if (l) { const e = l[l.length - 1]; drawTex(ctx, it.label, e[0] + 20, e[1] - 20, it.size || 56, col, "left", 1); } }
    },
    table(ctx, it) {
      // bảng giá trị: rows = [["x","-2",...],["y = x^2","4",...]]; reveal = [số ô hiện ở mỗi hàng] (tween được: revealX, revealY)
      const rows = it.rows || [], cw = it.cw || 140, cw0 = it.cw0 || 220, ch = it.ch || 110, size = it.size || 64;
      const col = it.color || (DARK ? "#ffffff" : INK), grid = it.gridColor || (DARK ? "#e0e0e0" : INK);
      const ncol = Math.max(...rows.map((r) => r.length)), W = cw0 + (ncol - 1) * cw, Hh = rows.length * ch;
      const rv = (r) => (r === 0 ? (it.revealX == null ? 99 : it.revealX) : r === 1 ? (it.revealY == null ? 99 : it.revealY) : 99);
      const pr = it._prog == null ? 1 : it._prog;
      ctx.lineWidth = 5; ctx.strokeStyle = grid;
      if (it.hiCol != null && it.hiCol > 0) { ctx.save(); ctx.fillStyle = it.hiColor || "rgba(255,213,79,.35)"; ctx.fillRect(cw0 + (it.hiCol - 1) * cw, 0, cw, Hh); ctx.restore(); }
      const lines = [];
      for (let r = 0; r <= rows.length; r++) lines.push([[0, r * ch], [W, r * ch]]);
      lines.push([[0, 0], [0, Hh]]);
      for (let c = 0; c < ncol; c++) { const x = cw0 + c * cw; lines.push([[x, 0], [x, Hh]]); }
      lines.forEach((L) => strokeProg(ctx, L, pr));
      if (pr < 1) return;
      rows.forEach((row, r) => row.forEach((cell, c) => {
        if (c > 0 && c > rv(r)) return;
        const k = c > 0 ? clamp(rv(r) - (c - 1), 0, 1) : 1;
        ctx.save(); ctx.globalAlpha *= k;
        const x = c === 0 ? cw0 / 2 : cw0 + (c - 0.5) * cw;
        drawTex(ctx, String(cell).replace(/(^|[=\s(])-/g, "$1−"), x, r * ch + ch / 2 + size * 0.33, c === 0 ? size * 0.9 : size, (it.cellColors && it.cellColors[r]) || col, "center", 1);
        ctx.restore();
      }));
    },
    dot(ctx, it) { const r = it.r || 15; ctx.fillStyle = it.color || "#ff5252"; ctx.beginPath(); ctx.arc(0, 0, r * (it._prog == null ? 1 : it._prog), 0, 7); ctx.fill(); if (it.label) { const L = it.labelSide === "left"; drawTex(ctx, it.label, L ? -24 : 24, -24, it.size || 52, it.color || "#ff5252", L ? "right" : "left", 1); } },
    seg(ctx, it) { ctx.strokeStyle = it.color || (DARK ? "#fff" : INK); ctx.lineWidth = it.width || 6; strokeProg(ctx, [[it.x1 || 0, it.y1 || 0], [it.x2 || 200, it.y2 || 0]], it._prog == null ? 1 : it._prog); },
    poly(ctx, it) {
      const P = it.points || [[0, -120], [-140, 100], [140, 100]], pr = it._prog == null ? 1 : it._prog, col = it.color || (DARK ? "#58c4dd" : "#1e88e5");
      if (it.fill && pr >= 1) { ctx.save(); ctx.globalAlpha *= it.fillAlpha || 0.35; ctx.fillStyle = it.fill === true ? col : it.fill; ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.strokeStyle = col; ctx.lineWidth = it.width || 7; strokeProg(ctx, P, pr, it.close !== false);
      if (it.labels && pr >= 1) { const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length; P.forEach((p, i) => { const L = it.labels[i]; if (!L) return; const dx = p[0] - cx, dy = p[1] - cy, d = Math.hypot(dx, dy) || 1; drawTex(ctx, L, p[0] + (dx / d) * 46, p[1] + (dy / d) * 46 + 18, it.size || 56, DARK ? "#fff" : INK, "center", 1); }); }
    },
    circ(ctx, it) { const r = it.r || 120, pr = it._prog == null ? 1 : it._prog, col = it.color || (DARK ? "#fc6255" : "#e53935"); if (it.fill && pr >= 1) { ctx.save(); ctx.globalAlpha *= 0.3; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore(); } ctx.strokeStyle = col; ctx.lineWidth = it.width || 7; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); ctx.stroke(); }
  };
  function itemBounds(ctx, it) {
    if (it.type === "text" || !it.type) { const m = layout(ctx, texCache.get(it.text) || parseTex(String(it.text || "")), it.size || 64); const al = it.align || "center"; const x0 = al === "center" ? -m.w / 2 : al === "right" ? -m.w : 0; return [x0, -m.asc, m.w, m.asc + m.desc]; }
    if (it.type === "poly") { const P = it.points || []; const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }
    if (it.type === "circ" || it.type === "circle") { const r = it.r || 120; return [-r, -r, 2 * r, 2 * r]; }
    if (it.type === "axes") { const M = axesMap(it); return [-M.w / 2, -M.h / 2, M.w, M.h]; }
    const w = it.w || 200, h = it.h || 200; return [-w / 2, -h / 2, w, h];
  }
  function drawManimFx(ctx, it) {
    if (!(it._circ > 0 || it._flash > 0)) return;
    const b = itemBounds(ctx, it), s = it.scale || 1;
    ctx.save(); ctx.translate(it.x || 0, it.y || 0); ctx.scale(s, s);
    if (it._circ > 0 && it._circ < 1) { const pad = 22, R = [[b[0] - pad, b[1] - pad], [b[0] + b[2] + pad, b[1] - pad], [b[0] + b[2] + pad, b[1] + b[3] + pad], [b[0] - pad, b[1] + b[3] + pad]]; ctx.strokeStyle = "#ffeb3b"; ctx.lineWidth = 7; ctx.globalAlpha = it._circ > 0.8 ? (1 - it._circ) * 5 : 1; strokeProg(ctx, R, Math.min(1, it._circ * 1.4), true); }
    if (it._flash > 0 && it._flash < 1) { const k = it._flash, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, r0 = Math.max(b[2], b[3]) / 2 + 20; ctx.strokeStyle = "#ffeb3b"; ctx.lineWidth = 7; ctx.globalAlpha = 1 - k; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r0 + k * 40), cy + Math.sin(a) * (r0 + k * 40)); ctx.lineTo(cx + Math.cos(a) * (r0 + 40 + k * 90), cy + Math.sin(a) * (r0 + 40 + k * 90)); ctx.stroke(); } }
    ctx.restore();
  }
  const ANIM_SFX = { create: "shimmer", write: "marker", transform: "whoosh", indicate: "ding", circumscribe: "swish", flash: "pop", grow: "pop", uncreate: "swish2" };
  let DARK = false, LBOX = 0;

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
    dojo(ctx) {
      ctx.fillStyle = "#f3e3c3"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#8d5a2b"; for (let x = 0; x < W; x += 320) ctx.fillRect(x, 0, 26, GROUND);
      ctx.fillStyle = "#7a4a22"; ctx.fillRect(0, 0, W, 40); ctx.fillRect(0, 700, W, 18);
      ctx.strokeStyle = INK; ctx.lineWidth = 6; hrect(ctx, 620, 110, 680, 170, 601, "#b71c1c");
      ctx.fillStyle = "#ffd54f"; ctx.font = `bold 96px ${FONT}`; ctx.textAlign = "center"; ctx.fillText("VÕ ĐƯỜNG", 960, 230); ctx.textAlign = "left";
      [300, 1620].forEach((x, i) => { ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.ellipse(x, 220, 46, 60, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffca28"; ctx.fillRect(x - 30, 156, 60, 10); ctx.fillRect(x - 30, 274, 60, 10); });
      ctx.fillStyle = "#c8a070"; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.strokeStyle = "rgba(90,50,20,.35)"; ctx.lineWidth = 3; for (let x = -200; x < W + 200; x += 160) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x - 120, H); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 5; hline(ctx, [[0, GROUND], [W, GROUND]], 602);
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
    text(ctx, it) {
      const col = it.color || (DARK ? "#ffffff" : INK), size = it.size || 64, al = it.align || "center";
      if (it._from != null && it._mix != null && it._mix < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - it._mix; ctx.translate(0, -it._mix * 34); drawTex(ctx, it._from, 0, 0, size, it._fromColor || col, al, 1); ctx.restore();
        ctx.save(); ctx.globalAlpha *= it._mix; ctx.translate(0, (1 - it._mix) * 34); drawTex(ctx, it.text, 0, 0, size, col, al, 1); ctx.restore();
      } else drawTex(ctx, it.text, 0, 0, size, col, al, it._prog == null ? 1 : it._prog);
    },
    apple(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, 42, it._seed, it.color || "#e53935"); ctx.strokeStyle = INK; hline(ctx, [[0, -40], [6, -62]], it._seed + 1); ctx.fillStyle = "#43a047"; ctx.beginPath(); ctx.ellipse(22, -56, 16, 8, -0.4, 0, 7); ctx.fill(); },
    coin(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, 40, it._seed, "#ffca28"); ctx.fillStyle = "#8d6e00"; ctx.font = `bold 34px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "đ", 0, 12); ctx.textAlign = "left"; },
    money(ctx, it) { ctx.lineWidth = 4; hrect(ctx, -90, -45, 180, 90, it._seed, it.color || "#a5d6a7"); ctx.fillStyle = "#1b5e20"; ctx.font = `bold 40px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "10 000đ", 0, 14); ctx.textAlign = "left"; },
    book(ctx, it) { ctx.lineWidth = 5; hrect(ctx, -60, -80, 120, 160, it._seed, it.color || "#3f7fd6"); ctx.fillStyle = "#fff"; ctx.font = `bold 30px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(it.label || "SGK", 0, 0); ctx.textAlign = "left"; },
    box(ctx, it) { const w = it.w || 160, h = it.h || 120; ctx.lineWidth = 5; hrect(ctx, -w / 2, -h / 2, w, h, it._seed, it.color || "#ffe0a3"); if (it.label != null) drawTex(ctx, String(it.label), 0, 20, it.size || 60, INK, "center", 1); },
    circle(ctx, it) { ctx.lineWidth = 5; hcircle(ctx, 0, 0, it.r || 60, it._seed, it.color || "#bbdefb"); if (it.label != null) drawTex(ctx, String(it.label), 0, 20, it.size || 56, INK, "center", 1); },
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
        const lab = s < 0 ? it.left : it.right; if (lab != null) drawTex(ctx, String(lab), 0, 85, it.size || 60, INK, "center", 1);
        ctx.restore();
      });
      ctx.restore(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, -60, 10, 0, 7); ctx.fill();
    },
    numberline(ctx, it) {
      const a = it.from != null ? it.from : -5, b = it.to != null ? it.to : 5, w = it.w || 1200, step = it.step || 1;
      const X = (v) => -w / 2 + ((v - a) / (b - a)) * w;
      ctx.lineWidth = 5; ctx.strokeStyle = INK; hline(ctx, [[-w / 2 - 30, 0], [w / 2 + 40, 0]], it._seed);
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(w / 2 + 50, 0); ctx.lineTo(w / 2 + 26, -12); ctx.lineTo(w / 2 + 26, 12); ctx.fill();
      for (let v = a; v <= b + 1e-9; v += step) { const x = X(v); hline(ctx, [[x, -14], [x, 14]], it._seed + v * 3); drawTex(ctx, String(Math.round(v * 100) / 100).replace("-", "−"), x, 70, it.size || 54, INK, "center", 1); }
      arr(it.points).forEach((p, i) => { ctx.fillStyle = p.color || "#e53935"; ctx.beginPath(); ctx.arc(X(p.v), 0, 14, 0, 7); ctx.fill(); if (p.label) drawTex(ctx, p.label, X(p.v), -38, it.size || 54, p.color || "#e53935", "center", 1); });
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
    sign(ctx, it) { const w = it.w || 420, h = it.h || 130; ctx.lineWidth = 6; ctx.strokeStyle = INK; hline(ctx, [[0, h / 2], [0, h / 2 + 140]], it._seed); hrect(ctx, -w / 2, -h / 2, w, h, it._seed + 1, it.color || "#fff8e1"); drawTex(ctx, it.text || "", 0, 22, it.size || 60, INK, "center", 1); },
    card(ctx, it) { const w = it.w || 520, h = it.h || 140; ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 18; ctx.fillStyle = it.color || "#fffef6"; roundRect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.restore(); ctx.lineWidth = 5; ctx.strokeStyle = it.border || "#f2a900"; roundRect(ctx, -w / 2, -h / 2, w, h, 22); ctx.stroke(); drawTex(ctx, it.text || "", 0, (it.size || 64) * 0.35, it.size || 64, it.textColor || INK, "center", 1); },
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
    const s = (it.scale == null ? 1 : it.scale) * (it._pop == null ? 1 : it._pop) * (["graph", "axes", "table"].includes(it.type) ? 1 : 1 + 0.22 * (it._ind || 0));
    ctx.scale(s, s);
    ctx.globalAlpha *= it.alpha == null ? 1 : it.alpha;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK;
    fn(ctx, it, life);
    ctx.restore();
  }

  Object.assign(PROPS, MANIM_PROPS);
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
      name = { punch: "land", punch2: "land", punch3: "land", kickhit: "land", boxing: "land", fall: "land", swish: "whoosh", swish2: "whoosh", crowd: "applause", ko: "tada", victory: "tada" }[name] || name;
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
        case "step": case "steprun": case "land": {
          const big = name === "land" ? 1.6 : name === "steprun" ? 1.2 : 1, r = 0.85 + Math.random() * 0.3;
          this.tone(95 * r, t, 0.09 * big, "sine", 0.32 * big, 48);
          const s = this.noise(0.06 * big), f = c.createBiquadFilter(), g = c.createGain();
          f.type = "bandpass"; f.frequency.value = 1500 * r; f.Q.value = 0.9; g.gain.setValueAtTime(0.13 * big, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06 * big);
          s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.1 * big); break;
        }
        case "jump": this.tone(260, t, 0.22, "sine", 0.18, 620); break;
        case "skate": { const d = clamp(dur || 2, 0.3, 8), s = this.noise(d), f = c.createBiquadFilter(), g = c.createGain(); f.type = "lowpass"; f.frequency.value = 700; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.15); g.gain.setValueAtTime(0.22, t + d - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + d); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.05); break; }
        case "shimmer": [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, t + i * 0.06, 0.5, "sine", 0.06)); break;
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
      const board = BOARDS[sc.bg] || null; let writeY = board ? board.y + 34 : 80; const posX = {};
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
        if (b.clear) writeY = board ? board.y + 34 : 80;  // xoá bảng TRƯỚC khi viết dòng mới trong cùng nhịp
        if (b.write != null) {
          const ws = arr(b.write).map((w) => (typeof w === "string" ? { text: w } : { ...w }));
          let off = 0;
          ws.forEach((w) => {
            w.size = w.size || 84;
            if (w.x == null) { w.x = board ? board.x + 60 : 200; w.align = w.align || "left"; }
            // khoảng dòng theo chiều cao THẬT của chữ/công thức (phân số cao hơn chữ thường)
            const m = layout(MCTX, texCache.get(w.text) || (texCache.set(w.text, parseTex(String(w.text))), texCache.get(w.text)), w.size);
            const pad = w.box ? 26 : 0;
            if (w.y == null) w.y = writeY + pad + m.asc;
            writeY = Math.max(writeY, w.y + m.desc + pad + w.size * (w.gap != null ? w.gap : 0.42));
            w.wstart = off; w.wdur = w.dur || clamp(String(w.text).length * 0.075, 0.7, 2.8); off += w.wdur + 0.15;
            sfx.push({ t: B.start + w.wstart, name: board && board.chalk ? "chalk" : "marker", dur: w.wdur });
          });
          B.writes = ws; d = Math.max(d, off);
        }
        if (b.ride) { const rd = b.ride.dur || 3; d = Math.max(d, rd); sfx.push({ t: B.start, name: "skate", dur: rd, vol: 0.9 }); }
        if (b.move) arr(b.move).forEach((m) => {
          const dur = m.dur || 1.5; d = Math.max(d, dur);
          const c = (sc.cast || {})[m.who] || {}, base = (film.cast || {})[m.who] || {};
          const from = posX[m.who] != null ? posX[m.who] : c.x || 0;
          moveContacts(m, from, c.scale || base.scale || 1).forEach((e) => sfx.push({ t: B.start + e.k * dur + (e.after || 0), name: e.name }));
          posX[m.who] = m.to != null ? m.to : from + (m.by || 0);
        });
        if (b.act) Object.entries(b.act).forEach(([id, a]) => { if (a.x != null) posX[id] = a.x; });
        if (b.tween) arr(b.tween).forEach((m) => { d = Math.max(d, m.dur || 0.8); });
        if (b.cam) { d = Math.max(d, b.cam.dur != null ? b.cam.dur : 1); if (b.cam.whip && b.cam.sfx !== false) sfx.push({ t: B.start, name: "whoosh", vol: 0.8 }); }
        arr(b.anim).forEach((a) => { const nm = a.sfx !== undefined ? a.sfx : ANIM_SFX[a.do]; if (nm) sfx.push({ t: B.start + (a.at || 0), name: nm, dur: a.dur || 1, vol: a.vol || 0.55 }); d = Math.max(d, (a.at || 0) + (a.dur || 1)); });
        if (b.show) arr(b.show).forEach((it) => { const nm = it.sfx !== undefined ? it.sfx : it.anim ? ANIM_SFX[it.anim] || null : "pop"; if (nm) sfx.push({ t: B.start, name: nm, dur: it.dur || 1, vol: it.anim ? 0.55 : 1 }); d = Math.max(d, it.anim ? it.dur || 1 : 0.4); });
        if (b.title) { d = Math.max(d, b.title.dur || 3.2); sfx.push({ t: B.start, name: "whoosh" }); }
        if (b.quiz) {
          const th = b.quiz.think || 5; B.quizThink = th; d = Math.max(d, th + 2.6);
          for (let k = 0; k < th; k++) sfx.push({ t: B.start + 0.8 + k, name: "tick" });
          sfx.push({ t: B.start + 0.8 + th, name: "correct" });
          if (!b.say) says.push({ id: id + "q", t: B.start, text: b.quiz.say || "", who: "narrator", voice: "nu", dur: 0, skip: true });
        }
        if (b.wait) d = Math.max(d, b.wait);
        arr(b.sfx).forEach((n) => sfx.push(typeof n === "string" ? { t: B.start + (b.sfxAt || 0), name: n } : { t: B.start + (n.at || 0), name: n.name, vol: n.vol, len: n.len }));
        d += b.gap != null ? b.gap : 0.35;
        B.dur = d; lt += d; s.beats.push(B);
      });
      s.dur = Math.max(lt, sc.minDur || 0.5); T += s.dur; s.end = T;
      scenes.push(s);
    });
    return { scenes, duration: T, sfx: sfx.sort((a, b) => a.t - b.t), says: says.filter((x) => !x.skip) };
  }

  function applyCamBeat(cam, c, kk, cast, t0, t) {
    const R = c.shot || c.on ? shotFrame(c, cast) : {};
    const tx = c.x != null ? c.x : R.x != null ? R.x : cam.x, ty = c.y != null ? c.y : R.y != null ? R.y : cam.y, tz = c.zoom != null ? c.zoom : R.zoom != null ? R.zoom : cam.zoom;
    const trot = c.rot != null ? c.rot : c.angle === "dutch" ? (c.dutch || 8) * (c.dutchDir || 1) : c.angle ? 0 : cam.rot;
    const ttilt = c.angle === "low" ? 1.14 : c.angle === "high" ? 0.88 : c.angle ? 1 : cam.tilt;
    const f = { x: cam.x, y: cam.y, zoom: cam.zoom, rot: cam.rot, tilt: cam.tilt, letter: cam.letter };
    cam.x = lerp(f.x, tx, kk); cam.y = lerp(f.y, ty, kk); cam.zoom = lerp(f.zoom, tz, kk); cam.rot = lerp(f.rot, trot, kk); cam.tilt = lerp(f.tilt, ttilt, kk);
    if (c.letterbox != null) cam.letter = lerp(f.letter, c.letterbox ? 1 : 0, kk);
    if (c.dof != null) cam.dof = c.dof;
    if (c.handheld != null) cam.handheld = c.handheld;
    if ("follow" in c) cam.follow = c.follow ? { who: c.follow, lead: c.lead || 0, t0, dur: c.dur != null ? c.dur : 1, x0: f.x } : null;
    else if (c.x != null || c.shot || c.on) cam.follow = null;
    if (c.whip) { const d = c.dur || 0.4, el = t - t0; if (el >= 0 && el < d) cam.blur = Math.sin((Math.PI * el) / d) * (c.whip === true ? 30 : c.whip); }
  }
  function applyAnim(a, items, t0, t, bi) {
    const el = t - t0 - (a.at || 0); if (el < 0) return;
    const d = a.dur || 1, k = clamp(el / d, 0, 1), ke = easeIO(k);
    let it = items[a.id];
    if (!it && a.item) it = items[a.id] = { ...a.item, _seed: 760 + bi * 7 };
    if (!it) return;
    switch (a.do) {
      case "create": case "write": it._prog = ke; break;
      case "uncreate": it._prog = 1 - ke; if (k >= 1) it._gone = true; break;
      case "fadein": it.alpha = ke; if (a.shift) { it.x = (it.x || 0) + (1 - ke) * (a.shift[0] || 0); it.y = (it.y || 0) + (1 - ke) * (a.shift[1] || 0); } break;
      case "fadeout": it.alpha = (it.alpha == null ? 1 : it.alpha) * (1 - ke); if (a.shift) { it.x = (it.x || 0) + ke * (a.shift[0] || 0); it.y = (it.y || 0) + ke * (a.shift[1] || 0); } if (k >= 1) it._gone = true; break;
      case "grow": it._pop = Math.max(0.001, k >= 1 ? 1 : easeOutBack(k)); it.pop = false; break;
      case "transform": {
        const to = a.to || {};
        if (to.text != null) { it._from = it.text; it._fromColor = it.color; it.text = to.text; it._mix = ke; if (k >= 1) it._from = null; }
        Object.keys(to).forEach((key) => {
          const v = to[key]; if (key === "text") return;
          if (typeof v === "number") it[key] = lerp(it[key] == null ? (key === "scale" || key === "alpha" ? 1 : 0) : it[key], v, ke);
          else if (key === "points" && it.points) it.points = it.points.map((q, i) => { const r = v[Math.min(i, v.length - 1)]; return [lerp(q[0], r[0], ke), lerp(q[1], r[1], ke)]; });
          else if (key === "fn") { if (k >= 1) { it.fn = v; it._fn2 = null; it._mix = null; } else { it._fn2 = v; it._mix = ke; } }
          else if (k >= 0.5) it[key] = v;
        });
        break;
      }
      case "indicate": it._ind = Math.sin(Math.PI * k); if (k > 0.12 && k < 0.88) it.color = a.color || "#ffeb3b"; break;
      case "circumscribe": it._circ = k < 1 ? k : 0; break;
      case "flash": it._flash = k < 1 ? k : 0; break;
      case "along": it.on = a.graph; it.u = lerp(a.from, a.to, a.ease === "linear" ? k : ke); break;
      case "move": ["x", "y", "scale", "rot"].forEach((key) => { if (a[key] != null) it[key] = lerp(it[key] == null ? (key === "scale" ? 1 : 0) : it[key], a[key], ke); }); break;
      default: break;
    }
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
    const cam = { x: W / 2, y: H / 2, zoom: 1, rot: 0, tilt: 1, letter: film.letterbox ? 1 : 0, follow: null, blur: 0, dof: null, handheld: null };
    if (src.cam) applyCamBeat(cam, src.cam, 1, cast, sc.start, t);
    let speech = null, title = null, quiz = null, highlight = [], emotes = [], fxs = [], shake = null;
    sc.beats.forEach((B, bi) => {
      if (B.start > t) return;
      const b = B.src, p = (dur) => clamp((t - B.start) / (dur || 1), 0, 1);
      // hành động nhân vật
      const acts = { ...(b.act || {}) };
      if (b.who && (b.pose || b.face || b.flip != null || b.hold !== undefined)) acts[b.who] = { ...(acts[b.who] || {}), pose: b.pose || (acts[b.who] || {}).pose, snap: b.snap, face: b.face || (acts[b.who] || {}).face, flip: b.flip != null ? b.flip : (acts[b.who] || {}).flip, hold: b.hold };
      Object.entries(acts).forEach(([id, a]) => {
        const ch = cast[id]; if (!ch) return;
        if (a.pose && a.pose !== ch.pose) { ch.prevPose = ch.pose; ch.pose = a.pose; ch.poseT = B.start + (a.delay || 0); ch.poseDur = a.snap || b.snap || 0.34; }
        if (a.face) ch.face = a.face;
        if (a.flip != null && !!a.flip !== !!ch.flip) { ch.flip = a.flip; ch.flipT = B.start; }
        if (a.hold !== undefined) ch.holding = a.hold;
        if (a.skate !== undefined) ch.skate = a.skate;
        if (a.tilt !== undefined) ch.tilt = a.tilt;
        if (a.y !== undefined) ch.y = a.y;
        if (a.x != null) ch.x = a.x;
        if (a.enter) { ch.hidden = false; }
        if (a.exit) { ch.hidden = true; }
      });
      arr(b.move).forEach((m) => {
        const ch = cast[m.who]; if (!ch) return; const dur = m.dur || 1.5, k = p(dur);
        const from = ch.x, to = m.to != null ? m.to : from + (m.by || 0), style = m.style || "walk", S0 = ch.scale || 1;
        const fy = ch.y || GROUND, ty = m.y != null ? m.y : fy;
        if (style !== "slide" && Math.abs(to - from) > 1 && (to < from) !== !!ch.flip) { ch.flip = to < from; ch.flipT = B.start; }
        let g;
        if (style === "slide") { const e = 1 - Math.pow(1 - k, 3); ch.x = lerp(from, to, e); ch.y = lerp(fy, ty, e); g = null; }
        else if (style === "skate") { const e = easeIO(k); ch.x = lerp(from, to, e); ch.y = lerp(fy, ty, e); g = null; ch.skate = k < 1 || !!m.keep; ch.tilt = 0; }
        else if (style === "jump" || style === "flykick") { const q = clamp((k - 0.22) / 0.6, 0, 1), e = q * q * (3 - 2 * q); ch.x = lerp(from, to, e); ch.y = lerp(fy, ty, e); g = { style, k }; }
        else { const dist = Math.abs(to - from), n = Math.max(1, Math.round(dist / ((style === "run" ? 150 : 96) * S0))), tr = trap(k, 0.18); ch.x = lerp(from, to, tr); ch.y = lerp(fy, ty, tr); g = { style, u: tr * n, n, L: Math.max(1, dist) / n / S0 }; }
        if (k < 1 && g) { ch._gait = g; if (style === "jump" || style === "flykick") ch._jumpLift = Math.sin(clamp((k - 0.22) / 0.6, 0, 1) * Math.PI) * (m.height || 130); }
        else if (k >= 1) {
          ch._gait = null; ch._jumpLift = 0;
          ch._after = g ? { t0: B.start + dur, g: g.k != null ? { style, k: 1 } : { ...g, u: g.n } } : null;
          if (m.face != null && (m.face === "left") !== !!ch.flip) { ch.flip = m.face === "left"; ch.flipT = B.start + dur; }
        }
      });
      arr(b.show).forEach((it, i) => {
        const id = it.id || `${B.id}_${i}`; const o = items[id] = { ...it, _seed: 500 + bi * 13 + i, _born: B.start };
        if (it.anim) { o.pop = false; applyAnim({ do: it.anim, id, dur: it.dur || 1, shift: it.shift }, items, B.start, t, bi); }
      });
      arr(b.hide).forEach((id) => { if (items[id]) items[id]._dead = B.start; });
      arr(b.set).forEach((s) => { if (items[s.id]) Object.assign(items[s.id], s); });
      if (b.ride) {
        // trượt ván dọc đồ thị (graph) hoặc đường gấp khúc (path, toạ độ màn hình); bánh xe "vẽ" nét đồ thị
        const r = b.ride, ch = cast[r.who];
        if (ch) {
          const d = r.dur || 3, k0 = p(d), k = r.ease === "linear" ? k0 : r.ease === "in" ? k0 * k0 : r.ease === "out" ? 1 - (1 - k0) * (1 - k0) : easeIO(k0);
          let X, Y, ang = 0;
          if (r.graph && items[r.graph] && items[items[r.graph].axes]) {
            const G = items[r.graph], A = items[G.axes], M = axesMap(A), f = mfn(G.fn || "x"), u = lerp(r.from, r.to, k), e = 0.01;
            X = (A.x || 0) + M.sx(u); Y = (A.y || 0) + M.sy(f(u));
            ang = Math.atan2(M.sy(f(u + e)) - M.sy(f(u)), M.sx(u + e) - M.sx(u));
            if (r.trail !== false) { const x0 = G.x0 != null ? G.x0 : M.xmin, x1 = G.x1 != null ? G.x1 : M.xmax; G._prog = Math.max(G._prog || 0, clamp((u - x0) / (x1 - x0), 0, 1)); }
          } else if (r.path) {
            const P = r.path; let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const dd = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(dd); L += dd; }
            let left = L * k, i = 0; while (i < seg.length - 1 && left > seg[i]) { left -= seg[i]; i++; }
            const q = seg[i] ? clamp(left / seg[i], 0, 1) : 1; X = lerp(P[i][0], P[i + 1][0], q); Y = lerp(P[i][1], P[i + 1][1], q);
            ang = Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]);
          }
          if (X != null) { ch.x = X; ch.y = Y; ch.tilt = (ang * 180) / Math.PI; if (ch.tilt > 90) ch.tilt -= 180; if (ch.tilt < -90) ch.tilt += 180; ch.skate = r.board !== false && !(k0 >= 1 && r.stay === false); ch.flip = r.to != null && r.from != null ? r.to < r.from : !!ch.flip; if (k0 >= 1 && r.stay === false) ch.tilt = 0; }
        }
      }
      arr(b.tween).forEach((tw) => {
        const it = items[tw.id] || cast[tw.id]; if (!it) return; const k = easeIO(p(tw.dur || 0.8));
        Object.keys(tw).forEach((key) => { if (["id", "dur"].includes(key)) return; const from = it[key] == null ? (key === "scale" || key === "alpha" ? 1 : 0) : it[key]; if (typeof tw[key] === "number") it[key] = lerp(from, tw[key], k); else if (k >= 1) it[key] = tw[key]; });
      });
      if (b.clear) { writes.length = 0; if (b.clear === "all") Object.keys(items).forEach((k) => delete items[k]); }
      if (B.writes) B.writes.forEach((w) => writes.push({ ...w, _p: clamp((t - B.start - w.wstart) / w.wdur, 0, 1), _bs: B.start }));
      if (b.cam) { const d = b.cam.dur != null ? b.cam.dur : 1; applyCamBeat(cam, b.cam, d <= 0 ? 1 : (b.cam.ease === "linear" ? p(d) : easeIO(p(d))), cast, B.start, t); }
      arr(b.anim).forEach((a) => applyAnim(a, items, B.start, t, bi));
      const inBeat = t < B.start + B.dur;
      if (b.say && inBeat) speech = { B, who: b.who, text: b.sub || b.say, bubble: b.bubble, active: t < B.start + B.sayDur, el: t - B.start, left: B.start + B.sayDur - t };
      if (b.title && t < B.start + (b.title.dur || 3.2)) title = { ...b.title, el: t - B.start };
      if (b.quiz && inBeat) quiz = { ...b.quiz, el: t - B.start, think: B.quizThink };
      if (b.highlight && inBeat) arr(b.highlight).forEach((h) => highlight.push({ id: h, el: t - B.start }));
      if (b.emote && inBeat) arr(b.emote).forEach((e) => emotes.push({ ...e, el: t - B.start }));
      arr(b.fx).forEach((f) => { const el = t - B.start - (f.at || 0); if (el >= 0 && el < (f.dur || 0.5)) fxs.push({ ...f, el }); });
      if (b.shake) { const sh = typeof b.shake === "number" ? { amp: 22, dur: b.shake } : b.shake, el = t - B.start - (sh.at || 0); if (el >= 0 && el < (sh.dur || 0.35)) shake = { amp: (sh.amp || 22) * (1 - el / (sh.dur || 0.35)), el }; }
    });
    if (cam.follow && cast[cam.follow.who]) { const ch = cast[cam.follow.who], k = easeIO(clamp((t - cam.follow.t0) / Math.max(0.3, cam.follow.dur), 0, 1)); cam.x = lerp(cam.follow.x0, ch.x + cam.follow.lead * (ch.flip ? -1 : 1), k); }
    return { sc, cast, items, writes, cam, speech, title, quiz, highlight, emotes, fxs, shake, lt };
  }

  /* ------------------------------ khung hình ------------------------------ */
  const ui = { subs: true };
  let OFFC = null;
  function renderFrame(ctx, film, comp, t, life, live) {
    BOIL = Math.floor(life * 8);
    const S = stateAt(film, comp, t);
    const src = S.sc.src, bg = src.bg || "paper", L = BGL[bg];
    DARK = !!(L && L.dark) || bg === "space";
    CUR_ITEMS = S.items;
    const C = S.cam; C.sx = 0; C.sy = 0; LBOX = 118 * (C.letter || 0);
    if (S.shake) { C.sx += (hash(Math.floor(t * 60)) - 0.5) * 2 * S.shake.amp; C.sy += (hash(Math.floor(t * 60) + 0.5) - 0.5) * 2 * S.shake.amp; }
    const hh = C.handheld != null ? C.handheld : film.handheld || 0;
    if (hh) { C.sx += noise1(life * 0.8, 51) * 12 * hh; C.sy += noise1(life * 0.7, 77) * 8 * hh; C.rot = (C.rot || 0) + noise1(life * 0.5, 93) * 0.6 * hh; }
    // nhoè hậu cảnh rất nặng với canvas: chỉ bật khi kịch bản yêu cầu (cam.dof hoặc FILM.dof)
    const dof = C.dof != null ? C.dof : film.dof ? clamp((C.zoom - 1.4) * 3.2, 0, 7) : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = "none";
    ctx.fillStyle = (L && L.base) || BGBASE[bg] || "#fbf8f1"; ctx.fillRect(0, 0, W, H);
    const layer = (p, fn, blur) => { ctx.save(); applyCam(ctx, C, p); if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`; fn(); ctx.restore(); ctx.filter = "none"; };
    if (L) {
      if (L.far) layer(L.farP || 0.18, () => L.far(ctx, life), dof);
      if (L.mid) layer(L.midP || 0.5, () => L.mid(ctx, life), dof * 0.65);
      if (L.main) layer(1, () => L.main(ctx, life), dof * 0.22);
    } else {
      layer(1, () => { const fn = BG[bg] || BG.paper; if (BOARDS[bg]) fn(ctx, life); else for (let k = -1; k <= 1; k++) { ctx.save(); ctx.translate(k * W, 0); fn(ctx, life); ctx.restore(); } }, dof * 0.22);
    }
    ctx.save(); applyCam(ctx, C, 1);
    const board = BOARDS[bg];
    const ink = board && board.chalk ? "#f5f5ec" : DARK ? "#ffffff" : "#1e3a8a";
    // chữ viết trên bảng
    S.writes.forEach((w) => { if (w._p <= 0) return; drawTex(ctx, w.text, w.x, w.y, w.size, w.color || ink, w.align || "left", w._p, w._p < 1 ? (board && board.chalk ? "chalk" : "marker") : null); });
    S.writes.forEach((w) => { if (!w.box || w._p < 1) return; ctx.font = `${w.size}px ${FONT}`; const Lw = layout(ctx, texCache.get(w.text) || parseTex(w.text), w.size); const x0 = w.align === "center" ? w.x - Lw.w / 2 : w.x; ctx.save(); ctx.strokeStyle = w.boxColor || "#ffca28"; ctx.lineWidth = 6; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(life * 5); roundRect(ctx, x0 - 22, w.y - Lw.asc - 18, Lw.w + 44, Lw.asc + Lw.desc + 36, 14); ctx.stroke(); ctx.restore(); });
    // đối tượng (sắp theo z)
    Object.entries(S.items).sort((a, b) => (a[1].z || 0) - (b[1].z || 0)).forEach(([id, it]) => {
      if (it._gone) return;
      if (it._dead != null) { const k = (t - it._dead) / 0.3; if (k >= 1) return; it.alpha = (it.alpha == null ? 1 : it.alpha) * (1 - k); }
      if (it._born != null && it.pop !== false) { const k = clamp((t - it._born) / 0.45, 0, 1); it._pop = k >= 1 ? 1 : Math.max(0.001, easeOutBack(k)); }
      if (it.type === "dot" && it.ax && S.items[it.ax] && it.at) { const A = S.items[it.ax], M = axesMap(A); it.x = (A.x || 0) + M.sx(it.at[0]); it.y = (A.y || 0) + M.sy(it.at[1]);
        let flying = false;
        if (it.fly && it._born != null) { const kf = clamp((t - it._born) / (it.flyDur || 0.7), 0, 1); if (kf < 1) { flying = true; const tx = it.x, ty = it.y; it.x = lerp(it.fly[0], tx, kf); it.y = lerp(it.fly[1], ty, kf) - Math.sin(Math.PI * kf) * (it.arc || 220); } }
        if (it.guides !== false && !flying) { const k = it._pop == null ? 1 : Math.min(1, it._pop); ctx.save(); ctx.setLineDash([14, 10]); ctx.lineWidth = 4; ctx.strokeStyle = it.guideColor || "rgba(255,255,255,.75)"; ctx.globalAlpha *= clamp(k, 0, 1) * (it.alpha == null ? 1 : it.alpha);
          const x0 = (A.x || 0) + M.sx(0), y0 = (A.y || 0) + M.sy(0); ctx.beginPath(); ctx.moveTo(it.x, it.y); ctx.lineTo(it.x, y0); ctx.moveTo(it.x, it.y); ctx.lineTo(x0, it.y); ctx.stroke(); ctx.restore(); } }
      if (it.type === "dot" && it.on && S.items[it.on]) { const G = S.items[it.on], A = S.items[G.axes]; if (A) { const M = axesMap(A), u = it.u != null ? it.u : 0; let y = mfn(G.fn || "x")(u); if (G._fn2) y = lerp(y, mfn(G._fn2)(u), G._mix || 0); it.x = (A.x || 0) + M.sx(u); it.y = (A.y || 0) + M.sy(y); } }
      drawItem(ctx, it, life);
      drawManimFx(ctx, it);
      const hl = S.highlight.find((h) => h.id === id);
      if (hl) { ctx.save(); ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 7; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(hl.el * 8); hcircle(ctx, it.x, it.y, (it.hlR || 120) + Math.sin(hl.el * 8) * 6, 999, null); ctx.restore(); }
    });
    ctx.restore();
    // nhân vật
    const speaker = S.speech && S.speech.who && S.cast[S.speech.who];
    Object.values(S.cast).sort((a, b) => (b.z || 0) - (a.z || 0)).forEach((ch) => {
      if (ch.hidden) return;
      const dp = 1 / (1 + (ch.z || 0) / 700); ch._p = dp;
      if (dp < 0.999) { ch.scale = (ch.scale || 1) * dp; ch.y = HORIZON + ((ch.y || GROUND) - HORIZON) * dp; }
      const age = t - ch.poseT;
      const pd = ch.poseDur || 0.34, k0 = easeIO(clamp(age / pd, 0, 1)), k1 = easeOutSoft(clamp((age - pd * 0.15) / (pd * 1.2), 0, 1)), k2 = easeIO(clamp((age - pd * 0.3) / pd, 0, 1));
      let P = blendPose(poseAt(ch.prevPose, life), poseAt(ch.pose, life), k0, k1, k2);
      const seated = /^(sit|lie)/.test(ch.pose);
      if (ch._gait) P = gaitPose(ch._gait);
      else if (ch._after && t - ch._after.t0 < 0.34) {
        // bước khép chân sau khi dừng: chân sau nhấc lên đặt về chỗ
        const k = easeIO((t - ch._after.t0) / 0.34), G = gaitPose(ch._after.g);
        P = blendPose(G, P, k);
        const bk = Math.abs(G.bf[0] - P.bf[0]) > Math.abs(G.ff[0] - P.ff[0]) ? "bf" : "ff";
        P[bk] = [P[bk][0], P[bk][1] - Math.sin(Math.PI * k) * 18];
      }
      if (!ch._gait && !seated) {
        // dồn trọng tâm, thở, đầu khẽ động — không bao giờ đứng im như tượng
        const sway = noise1(life * 0.35, ch._seed) * 4;
        P.ff = [P.ff[0] - sway, P.ff[1]]; P.bf = [P.bf[0] - sway, P.bf[1]];
        P.head = (P.head || 0) + noise1(life * 0.6, ch._seed + 2) * 2.5;
        ch._sway = sway;
      }
      if (ch._jumpLift) P.lift = (P.lift || 0) + ch._jumpLift;
      // quay người: bóp ngang rồi lật
      ch._turnSx = 1; ch._dir = null;
      if (ch.flipT != null && t - ch.flipT < 0.24 && t >= ch.flipT) { const k = (t - ch.flipT) / 0.24; ch._turnSx = Math.max(0.12, Math.abs(Math.cos(Math.PI * k))); ch._dir = k < 0.5 ? (ch.flip ? 1 : -1) : (ch.flip ? -1 : 1); }
      // người nghe đưa mắt về phía người nói
      ch._look = speaker && speaker !== ch ? (speaker.x < ch.x ? -1 : 1) : 0;
      let talk = 0;
      if (S.speech && S.speech.who === ch.id) {
        const lip = STICKFILM.lip && STICKFILM.lip[S.speech.B.id];
        const voiceOn = Voice.vi.length > 0 && STICKFILM.useVoice;
        const speakingNow = live ? (Voice.speaking && live.sayId === S.speech.B.id) || (!voiceOn && S.speech.active) : S.speech.active;
        if (lip && !live) { const v = lip.env[Math.floor(S.speech.el * lip.fps)] || 0; talk = clamp(v * 1.25, 0, 1); }
        else if (speakingNow) talk = clamp(0.2 + 0.8 * Math.abs(noise1(life * 9, ch._seed + 4)), 0, 1);
        // cử chỉ tay theo lời nói (beat gesture), vào/ra mềm
        if ((ch.pose === "idle" || ch.pose === "explain") && !ch._gait && speakingNow) {
          const w = clamp(S.speech.el / 0.35, 0, 1) * clamp((S.speech.left + 0.2) / 0.4, 0, 1);
          const n1 = noise1(life * 1.7, ch._seed + 11), n2 = noise1(life * 2.4, ch._seed + 13);
          P.fa = [lerp(P.fa[0], 40 + 30 * n1, w), lerp(P.fa[1], 98 + 38 * n2, w)];
          P.ba = [lerp(P.ba[0], -10 + 14 * noise1(life * 1.2, ch._seed + 17), w), P.ba[1]];
          P.head = (P.head || 0) + w * 5 * noise1(life * 3.2, ch._seed + 19);
        }
      }
      ch._talk = talk;
      if (ch.skate && (ch.pose === "idle" || ch.pose === "skate")) P = poseAt("skate", life);
      ch._pose = P;
      ctx.save(); applyCam(ctx, C, dp); if (dof > 0.5 && dp < 0.8) ctx.filter = `blur(${(dof * (1 - dp)).toFixed(1)}px)`;
      drawFigure(ctx, ch, life);
      ctx.restore(); ctx.filter = "none";
    });
    ctx.save(); applyCam(ctx, C, 1);
    // biểu tượng cảm xúc trên đầu
    S.emotes.forEach((e) => { const ch = S.cast[e.who]; if (!ch || !ch._headTop) return; const [x, y] = ch._headTop; const k = clamp(e.el / 0.3, 0, 1); ctx.save(); ctx.translate(x + (S.cast[e.who].flip ? -80 : 80), y + 20 - Math.sin(e.el * 4) * 6); ctx.scale(k, k); const icon = { idea: "bulb", heart: "heart", question: "question", star: "star" }[e.icon]; if (icon) drawItem(ctx, { type: icon, x: 0, y: 0, scale: 0.55, _seed: 77 }, life); else { ctx.font = `bold 90px ${FONT}`; ctx.fillStyle = e.icon === "!" ? "#e53935" : INK; ctx.textAlign = "center"; ctx.fillText(e.icon || "!", 0, 0); ctx.textAlign = "left"; } ctx.restore(); });
    S.fxs.forEach((f) => drawFx(ctx, f, S));
    ctx.restore();
    // lớp tiền cảnh (gần máy quay, trôi nhanh hơn → cảm giác 3D)
    if (L && L.fg && src.fg !== false) layer(L.fgP || 1.45, () => L.fg(ctx, life), Math.max(2.5, dof));
    // nhoè chuyển động khi lia máy nhanh (whip pan)
    if (C.blur > 0.8) {
      if (!OFFC) { OFFC = document.createElement("canvas"); OFFC.width = W; OFFC.height = H; }
      const o = OFFC.getContext("2d"); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H); o.drawImage(ctx.canvas, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0); let n = 0; for (let i = -3; i <= 3; i++) { n++; ctx.globalAlpha = 1 / n; ctx.drawImage(OFFC, i * C.blur * 0.4, 0); } ctx.globalAlpha = 1;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // bong bóng lời thoại (vẽ theo toạ độ màn hình để cỡ chữ luôn chuẩn slide dù máy quay phóng to)
    let bubbled = false;
    const wantBubble = S.speech && (S.speech.bubble === true || (S.speech.bubble !== false && !BOARDS[bg]));
    if (wantBubble && S.speech.who && S.cast[S.speech.who] && S.cast[S.speech.who]._headTop) {
      const ch = S.cast[S.speech.who], ht = worldToScreen(C, ch._p || 1, ch._headTop[0], ch._headTop[1]);
      if (ht[0] > -100 && ht[0] < W + 100 && ht[1] > -200) bubbled = drawBubble(ctx, { ...ch, _headTop: [clamp(ht[0], 60, W - 60), Math.max(260, ht[1])] }, S.speech, film);
    }
    // viền tối nhẹ (vignette) + khung điện ảnh (letterbox)
    if (film.vignette !== false && !BOARDS[bg]) { const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.28)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (C.letter > 0.01) { ctx.fillStyle = "#000"; const bh = 118 * C.letter; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
    // lớp phủ (không theo camera)
    if (S.quiz) drawQuiz(ctx, S.quiz, life);
    if (S.title) drawTitle(ctx, S.title);
    if (ui.subs && S.speech && S.speech.text && (!bubbled || film.subs === "always")) drawSub(ctx, S.speech, film);
    // chuyển cảnh
    const tr = src.trans, trd = src.transDur || 0.6;
    if (tr && S.lt < trd) { const k = S.lt / trd; ctx.save(); ctx.fillStyle = tr === "flash" ? "#fff" : "#000";
      if (tr === "fade" || tr === "flash") { ctx.globalAlpha = 1 - k; ctx.fillRect(0, 0, W, H); }
      else if (tr === "iris") { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Math.max(1, easeIO(k) * 1150), 0, Math.PI * 2, true); ctx.fill("evenodd"); }
      else if (tr === "wipe") ctx.fillRect(W * easeIO(k), 0, W, H);
      ctx.restore(); }
    if (film.watermark) { ctx.save(); ctx.globalAlpha = 0.55; ctx.font = `italic 30px ${FONT}`; ctx.fillStyle = DARK ? "#ddd" : "#555"; ctx.textAlign = "right"; ctx.fillText(film.watermark, W - 30, 46 + 118 * (C.letter || 0)); ctx.restore(); }
    return S;
  }
  function drawBubble(ctx, ch, sp, film) {
    if (!ch._headTop) return false;
    const text = sp.text, size = 80; const maxW = 1100;
    const lines = wrapText(ctx, text, maxW, size);
    if (lines.length > 3) return false; // dài quá → chỉ phụ đề
    const k = clamp(sp.el / 0.25, 0, 1);
    let w = 0; ctx.font = `${size}px ${FONT}`; lines.forEach((l) => (w = Math.max(w, ctx.measureText(l).width)));
    w += 56; const h = lines.length * size * 1.25 + 40;
    const [hx, hy] = ch._headTop; let x = hx - w / 2, y = hy - h - 50;
    x = clamp(x, 30, W - w - 30); y = Math.max(30 + LBOX, y);
    ctx.save(); ctx.globalAlpha = k; ctx.translate(hx, hy - 20); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); ctx.translate(-hx, -(hy - 20));
    ctx.fillStyle = "#fff"; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    roundRect(ctx, x, y, w, h, 28); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(clamp(hx - 20, x + 30, x + w - 60), y + h - 3); ctx.lineTo(hx, hy - 12); ctx.lineTo(clamp(hx + 20, x + 60, x + w - 30), y + h - 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.fillRect(clamp(hx - 17, x + 33, x + w - 57), y + h - 9, 34, 10);
    ctx.fillStyle = INK; ctx.font = `${size}px ${FONT}`; ctx.textAlign = "center";
    lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + 22 + size * 0.95 + i * size * 1.25));
    ctx.restore(); ctx.textAlign = "left";
    return true;
  }
  function drawSub(ctx, sp, film) {
    const size = 78, text = sp.text; const lines = wrapText(ctx, text, 1640, size).slice(-2);
    const h = lines.length * size * 1.3 + 30, y = H - h - 24;
    ctx.save(); ctx.fillStyle = "rgba(10,10,20,.62)"; roundRect(ctx, 60, y, W - 120, h, 18); ctx.fill();
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
    ctx.font = `bold 124px ${FONT}`; const lines = wrapText(ctx, T.text || "", 1700, 124);
    ctx.font = `bold 124px ${FONT}`; lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * 140));
    if (T.sub) { ctx.textAlign = "left"; drawTex(ctx, T.sub, 0, lines.length * 70 + 90, 72, "#37474f", "center", 1); }
    ctx.restore(); ctx.textAlign = "left";
  }
  function drawQuiz(ctx, Q, life) {
    const a = clamp(Q.el / 0.35, 0, 1), reveal = Q.el >= 0.8 + Q.think;
    ctx.save(); ctx.globalAlpha = a;
    const x = 120, y = 50, w = W - 240, opts = Q.options || [], h = 210 + Math.ceil(opts.length / 2) * 160;
    ctx.fillStyle = "rgba(255,253,245,.97)"; ctx.strokeStyle = "#f2a900"; ctx.lineWidth = 8; roundRect(ctx, x, y, w, h, 30); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#c62828"; ctx.font = `bold 66px ${FONT}`; ctx.fillText("?", x + 44, y + 100);
    drawTex(ctx, Q.q || "", x + 110, y + 100, 66, INK, "left", 1);
    opts.forEach((o, i) => {
      const cx = x + 60 + (i % 2) * (w / 2 - 30), cy = y + 170 + Math.floor(i / 2) * 160, ow = w / 2 - 90;
      const right = reveal && i === Q.answer;
      ctx.fillStyle = right ? "#c8e6c9" : "#fff"; ctx.strokeStyle = right ? "#2e7d32" : "#90a4ae"; ctx.lineWidth = right ? 8 : 4;
      roundRect(ctx, cx, cy, ow, 130, 20); ctx.fill(); ctx.stroke();
      drawTex(ctx, "ABCD"[i] + ".  " + o, cx + 30, cy + 88, 64, INK, "left", 1);
      if (right) drawItem(ctx, { type: "check", x: cx + ow - 60, y: cy + 65, scale: 0.7, _seed: 5 }, life);
    });
    if (!reveal) { const left = Math.ceil(0.8 + Q.think - Q.el); ctx.fillStyle = "#e53935"; ctx.beginPath(); ctx.arc(x + w - 80, y + 70, 48, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = `bold 56px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(String(Math.max(0, left)), x + w - 80, y + 90); ctx.textAlign = "left"; }
    ctx.restore();
  }

  /* ------------------------------ trình phát ------------------------------ */
  const STICKFILM = {
    W, H, POSES, PROPS, BG, BGL, ROLES, BOARDS, Audio, Voice, ui,
    measure(str, size) { const c = document.createElement("canvas").getContext("2d"); return drawTex(c, str, 0, 0, size, "#000", "left", 1); },
    load(film) {
      Object.entries(film.cast || {}).forEach(([id, c]) => { if (c.role && ROLES[c.role]) film.cast[id] = { ...ROLES[c.role], ...c }; });
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
