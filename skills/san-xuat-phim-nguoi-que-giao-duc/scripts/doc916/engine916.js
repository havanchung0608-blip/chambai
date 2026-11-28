/* PHIM DỌC 9:16 kiểu "bảng vẽ + laptop gõ lời giải" (1080×1920).
   Nửa trên: khung bảng vẽ hình từng nét (đoạn, đường tròn, điểm, kí hiệu góc vuông, vạch bằng nhau…), chú thích từng bước.
   Nửa dưới: laptop gõ từng dòng lời giải (dòng đang gõ được tô sáng), hai tay người que gõ phím.
   Mở đầu: người que nằm → ngồi dậy → đi tới bàn → ngồi gõ máy.  Kết: bảng tổng kết + "Lớp Toán Thầy Chung".
   Dữ liệu: window.FILM916 (kịch bản) + window.TL916 (mốc thời gian do make916.py tính theo độ dài giọng đọc).
   Hàm vẽ: STICKFILM.renderAt(ctx, t) — tất định theo t, để xuất từng khung. */
(function () {
  const W = 1080, H = 1920, FONT = '"Times New Roman","Liberation Serif",serif';
  const COL = { bg: "#0c0d0e", ink: "#f3f1e8", dim: "#8b9196", gold: "#ffd54f", fig: "#4dd0e1", red: "#ff6e6e", green: "#7ee787", blue: "#7cc4ff" };
  const F = window.FILM916, TL = window.TL916;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const lerp = (a, b, k) => a + (b - a) * k;
  const rad = (d) => (d * Math.PI) / 180;
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------------- chữ toán nhỏ gọn: \hat{ABC}, \frac{a}{b}, còn lại là kí tự Unicode ---------------- */
  function toks(s) {
    const out = []; let i = 0;
    while (i < s.length) {
      if (s.startsWith("\\hat{", i)) { const j = s.indexOf("}", i); out.push({ k: "hat", a: s.slice(i + 5, j), n: j - i - 5 }); i = j + 1; continue; }
      if (s.startsWith("\\frac{", i)) { const j = s.indexOf("}", i), j2 = s.indexOf("}", j + 2); out.push({ k: "frac", a: s.slice(i + 6, j), b: s.slice(j + 2, j2), n: Math.max(j - i - 6, j2 - j - 2) }); i = j2 + 1; continue; }
      out.push({ k: "c", a: s[i], n: 1 }); i++;
    }
    return out;
  }
  const tlen = (s) => toks(s).reduce((a, t) => a + t.n, 0);
  function tex(ctx, s, x, y, size, color, align, upto, measureOnly) {
    const T = toks(s); ctx.font = `${size}px ${FONT}`;
    const wOf = (t) => (t.k === "frac" ? (ctx.font = `${size * 0.72}px ${FONT}`, Math.max(ctx.measureText(t.a).width, ctx.measureText(t.b).width) + 8 + (ctx.font = `${size}px ${FONT}`, 0)) : ctx.measureText(t.a).width);
    let total = 0; T.forEach((t) => (total += wOf(t)));
    if (measureOnly) return total;
    let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x, used = 0;
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.textBaseline = "alphabetic";
    for (const t of T) {
      if (upto != null && used >= upto) break;
      const w = wOf(t);
      if (t.k === "c") { ctx.font = `${size}px ${FONT}`; ctx.fillText(t.a, cx, y); }
      else if (t.k === "hat") {
        ctx.font = `${size}px ${FONT}`; ctx.fillText(t.a, cx, y); ctx.lineWidth = Math.max(2, size * 0.05);
        ctx.beginPath(); ctx.moveTo(cx + w * 0.12, y - size * 0.74); ctx.lineTo(cx + w / 2, y - size * 0.95); ctx.lineTo(cx + w * 0.88, y - size * 0.74); ctx.stroke();
      } else {
        const s2 = size * 0.72; ctx.font = `${s2}px ${FONT}`; ctx.textAlign = "center";
        ctx.fillText(t.a, cx + w / 2, y - size * 0.42); ctx.fillText(t.b, cx + w / 2, y + size * 0.36);
        ctx.textAlign = "left"; ctx.lineWidth = Math.max(2, size * 0.045); ctx.beginPath(); ctx.moveTo(cx + 2, y - size * 0.3); ctx.lineTo(cx + w - 2, y - size * 0.3); ctx.stroke();
      }
      cx += w; used += t.n;
    }
    ctx.textAlign = "left";
    return total;
  }
  function wrap(ctx, s, size, maxW) {
    const words = s.split(" "), lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (tex(ctx, t, 0, 0, size, "#000", "left", null, true) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }

  /* ---------------- người que (khớp xương đơn giản, nội suy tư thế) ---------------- */
  const LEN = { torso: 120, thigh: 74, shin: 74, upper: 62, fore: 58, head: 32 };
  // góc tuyệt đối (độ): 0 = hướng lên, 90 = sang phải, 180 = xuống
  const POSE = {
    lie: { hipY: 14, torso: -84, th1: 92, sh1: 90, th2: 96, sh2: 92, ua1: -150, fa1: -60, ua2: -140, fa2: -40 },
    situp: { hipY: 14, torso: -12, th1: 92, sh1: 96, th2: 88, sh2: 100, ua1: 160, fa1: 150, ua2: 200, fa2: 190 },
    crouch: { hipY: 70, torso: 20, th1: 60, sh1: 175, th2: 70, sh2: 185, ua1: 150, fa1: 120, ua2: 170, fa2: 140 },
    stand: { hipY: 148, torso: 0, th1: 176, sh1: 180, th2: 184, sh2: 180, ua1: 165, fa1: 175, ua2: 195, fa2: 185 },
    sit: { hipY: 96, torso: 6, th1: 92, sh1: 180, th2: 86, sh2: 176, ua1: 130, fa1: 80, ua2: 140, fa2: 88 }
  };
  function mixPose(a, b, k) { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; }
  const pt = (p, ang, len) => [p[0] + Math.sin(rad(ang)) * len, p[1] - Math.cos(rad(ang)) * len];
  function stick(ctx, x, floor, P, color, glasses) {
    const hip = [x, floor - P.hipY], neck = pt(hip, P.torso, LEN.torso), head = pt(neck, P.torso, LEN.head + 6);
    ctx.strokeStyle = color; ctx.lineWidth = 13; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const limb = (from, a1, l1, a2, l2) => { const m = pt(from, a1, l1), e = pt(m, a2, l2); ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(m[0], m[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); };
    limb(hip, P.th2, LEN.thigh, P.sh2, LEN.shin); limb(neck, P.ua2, LEN.upper, P.fa2, LEN.fore);
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(neck[0], neck[1]); ctx.stroke();
    limb(hip, P.th1, LEN.thigh, P.sh1, LEN.shin); limb(neck, P.ua1, LEN.upper, P.fa1, LEN.fore);
    ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(head[0], head[1], LEN.head, 0, 7); ctx.stroke();
    if (glasses) { ctx.lineWidth = 4; const s = Math.sin(rad(P.torso)), dx = 10; ctx.beginPath(); ctx.arc(head[0] + dx - 2 + s * 4, head[1] - 2, 9, 0, 7); ctx.moveTo(head[0] + dx + 26 + s * 4, head[1] - 2); ctx.arc(head[0] + dx + 17 + s * 4, head[1] - 2, 9, 0, 7); ctx.stroke(); }
    return head;
  }

  /* ---------------- hình học trên bảng ---------------- */
  function chapterPoints(ch, t) {
    const P = {}; for (const k in ch.points) P[k] = ch.points[k].slice();
    ch.steps.forEach((st, si) => (st.draw || []).forEach((op) => {
      if (!op.move) return; const tm = TL.chapters[ch._i].steps[si];
      if (t < tm.draw0) return; const k = ease(clamp((t - tm.draw0) / Math.max(0.5, tm.t1 - tm.draw0 - 0.6), 0, 1));
      const m = op.move, c = P[m.c], a = rad(lerp(m.a0, m.a1, k)); P[m.pt] = [c[0] + m.r * Math.cos(a), c[1] + m.r * Math.sin(a)];
    }));
    return P;
  }
  function seg(ctx, A, B, k, color, w, dash) { if (k <= 0) return; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash ? [16, 12] : []); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], k), lerp(A[1], B[1], k)); ctx.stroke(); ctx.setLineDash([]); }
  function drawOp(ctx, op, k, P, ch, t) {
    const c = op.color || COL.ink, al = clamp(k * 3, 0, 1);
    if (op.seg) seg(ctx, P[op.seg[0]], P[op.seg[1]], k, c, op.w || 5, op.dash);
    else if (op.circ) { const O = P[op.circ], r = op.r, a0 = rad(op.from == null ? -90 : op.from); ctx.strokeStyle = c; ctx.lineWidth = op.w || 5; ctx.beginPath(); ctx.arc(O[0], O[1], r, a0, a0 + Math.PI * 2 * k); ctx.stroke(); }
    else if (op.pt) {
      const p = P[op.pt], s = k >= 1 ? 1 : Math.sin(clamp(k, 0, 1) * Math.PI * 0.75) * 1.25; if (k <= 0) return;
      ctx.fillStyle = op.color || COL.ink; ctx.beginPath(); ctx.arc(p[0], p[1], 9 * s, 0, 7); ctx.fill();
      const ctr = P[ch.center] || [540, 560]; let dx = p[0] - ctr[0], dy = p[1] - ctr[1], d = Math.hypot(dx, dy);
      if (d < 1) { dx = 0.6; dy = 0.8; d = 1; }
      const off = op.off || [dx / d * 44, dy / d * 44 + 16];
      ctx.globalAlpha = al; tex(ctx, op.lab || op.pt, p[0] + off[0], p[1] + off[1], op.size || 52, op.color || COL.ink, "center"); ctx.globalAlpha = 1;
    } else if (op.right) {
      if (k <= 0) return; const [a, b, cc] = op.right.map((n) => P[n]), u = norm(b, a), v = norm(cc, a), s = 30;
      ctx.globalAlpha = al; ctx.strokeStyle = op.color || COL.gold; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(a[0] + u[0] * s, a[1] + u[1] * s); ctx.lineTo(a[0] + (u[0] + v[0]) * s, a[1] + (u[1] + v[1]) * s); ctx.lineTo(a[0] + v[0] * s, a[1] + v[1] * s); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (op.ticks) {
      if (k <= 0) return; const [A, B] = op.ticks.map((n) => P[n]), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], u = norm(B, A), n = [-u[1], u[0]];
      ctx.globalAlpha = al; ctx.strokeStyle = op.color || COL.red; ctx.lineWidth = 5;
      for (let i = 0; i < (op.n || 1); i++) { const o = (i - ((op.n || 1) - 1) / 2) * 10; ctx.beginPath(); ctx.moveTo(m[0] + u[0] * o - n[0] * 16, m[1] + u[1] * o - n[1] * 16); ctx.lineTo(m[0] + u[0] * o + n[0] * 16, m[1] + u[1] * o + n[1] * 16); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (op.lab) {
      if (k <= 0) return; const p = P[op.at]; ctx.globalAlpha = al; tex(ctx, op.lab, p[0] + op.d[0], p[1] + op.d[1], op.size || 44, op.color || COL.gold, "center"); ctx.globalAlpha = 1;
    } else if (op.hl) {
      if (k <= 0) return; op.hl.forEach((n, i) => { const p = P[n], ph = (t * 3 + i) % 1; ctx.strokeStyle = op.color || COL.gold; ctx.globalAlpha = al * (1 - ph); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(p[0], p[1], 16 + 34 * ph, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = op.color || COL.gold; ctx.beginPath(); ctx.arc(p[0], p[1], 12, 0, 7); ctx.fill(); });
    } else if (op.fill) {
      if (k <= 0) return; ctx.globalAlpha = al * 0.22; ctx.fillStyle = op.color || COL.fig; ctx.beginPath(); op.fill.forEach((n, i) => { const p = P[n]; i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  function norm(b, a) { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }

  /* ---------------- khung bảng + laptop ---------------- */
  const BX = 40, BY = 60, BW = 1000, BH = 960;
  function board(ctx) {
    ctx.fillStyle = "#121416"; ctx.fillRect(BX, BY, BW, BH);
    ctx.strokeStyle = "#3a3f44"; ctx.lineWidth = 8; ctx.strokeRect(BX, BY, BW, BH);
    ctx.fillStyle = "#6d5a3a"; ctx.fillRect(BX + BW - 150, BY + BH - 16, 70, 8);       // khay phấn
    for (let i = 0; i < 18; i++) { const x = BX + 60 + hash(i) * 880, y = BY + 200 + hash(i + 7) * 620; const g = ctx.createRadialGradient(x, y, 0, x, y, 120); g.addColorStop(0, "rgba(255,255,255,.025)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(x - 120, y - 120, 240, 240); }
  }
  const LX = 70, LY = 1080, LW = 940, LH = 520, LINE_H = 66, LSIZE = 44;
  function laptop(ctx, file, lines, cur, typing, t, stmt) {
    // màn hình
    ctx.fillStyle = "#c3c8cc"; roundRect(ctx, LX - 16, LY - 16, LW + 32, LH + 32, 22); ctx.fill();
    ctx.fillStyle = "#16212a"; ctx.fillRect(LX, LY, LW, LH);
    ctx.fillStyle = "#0f171d"; ctx.fillRect(LX, LY, LW, 58); ctx.fillStyle = COL.gold; ctx.fillRect(LX + 18, LY + 14, 6, 30);
    ctx.font = `32px ${FONT}`; ctx.fillStyle = "#c9d1d9"; ctx.fillText(file || "", LX + 36, LY + 40);
    ctx.save(); ctx.beginPath(); ctx.rect(LX, LY + 58, LW, LH - 58); ctx.clip();
    if (stmt) {
      const L = wrap(ctx, stmt.text, 48, LW - 110), h = L.length * 66 + 70, y0 = LY + 58 + (LH - 58 - h) / 2;
      ctx.strokeStyle = COL.gold; ctx.lineWidth = 4; roundRect(ctx, LX + 30, y0, LW - 60, h, 18); ctx.stroke();
      ctx.font = `bold 34px ${FONT}`; ctx.fillStyle = COL.gold; ctx.fillText("★ " + (stmt.head || "ĐỊNH LÍ"), LX + 52, y0 - 12 + 0);
      let left = stmt.n;
      L.forEach((ln, i) => { if (left <= 0) return; const n = tlen(ln) + 1; tex(ctx, ln, LX + 55, y0 + 72 + i * 66, 48, COL.gold, "left", left); left -= n; });
    } else {
      const vis = Math.floor((LH - 80) / LINE_H), first = Math.max(0, lines.length - vis);
      lines.slice(first).forEach((ln, j) => {
        const i = first + j, y = LY + 58 + 52 + j * LINE_H, active = i === lines.length - 1 && cur;
        if (active) { ctx.fillStyle = "#22323d"; ctx.fillRect(LX, y - 46, LW, LINE_H); }
        ctx.font = `28px ${FONT}`; ctx.fillStyle = "#5b6872"; ctx.textAlign = "right"; ctx.fillText(String(i + 1), LX + 58, y - 4); ctx.textAlign = "left";
        const w = tex(ctx, ln.text, LX + 80, y, LSIZE, ln.color || "#e6edf3", "left", ln.n);
        if (active && (typing || Math.floor(t * 2.2) % 2 === 0)) { const ww = tex(ctx, ln.text, 0, 0, LSIZE, "#000", "left", ln.n, true) ; ctx.fillStyle = COL.gold; ctx.fillRect(LX + 82 + partW(ctx, ln), y - 38, 4, 46); }
      });
    }
    ctx.restore();
    // bàn phím
    ctx.fillStyle = "#a9b0b5"; ctx.beginPath(); ctx.moveTo(LX - 30, LY + LH + 30); ctx.lineTo(LX + LW + 30, LY + LH + 30); ctx.lineTo(LX + LW + 70, LY + LH + 230); ctx.lineTo(LX - 70, LY + LH + 230); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2b3034";
    for (let r = 0; r < 4; r++) { const y = LY + LH + 52 + r * 34, inset = 40 - r * 10, n = 14; for (let c = 0; c < n; c++) { const x0 = LX + inset + c * ((LW - 2 * inset) / n); ctx.fillRect(x0 + 3, y, (LW - 2 * inset) / n - 8, 26); } }
    ctx.fillRect(LX + 300, LY + LH + 190, 340, 24);
    ctx.fillStyle = "#8f979c"; roundRect(ctx, LX + 380, LY + LH + 222, 180, 8, 4); ctx.fill();
  }
  function partW(ctx, ln) { const T = toks(ln.text); let s = "", used = 0; for (const t of T) { if (used >= ln.n) break; s += t.k === "c" ? t.a : t.k === "hat" ? "\\hat{" + t.a + "}" : "\\frac{" + t.a + "}{" + t.b + "}"; used += t.n; } return tex(ctx, s, 0, 0, LSIZE, "#000", "left", null, true); }
  function hands(ctx, t, typing) {
    ctx.strokeStyle = COL.fig; ctx.lineCap = "round"; ctx.lineJoin = "round";
    [[300, 1, 0], [780, -1, 1.7]].forEach(([x, s, ph]) => {
      const tap = typing ? Math.abs(Math.sin(t * 13 + ph)) * 22 : Math.sin(t * 1.5 + ph) * 3;
      const sh = [x - s * 120, 2000], el = [x - s * 40, 1840], hd = [x + s * 10, 1700 + tap];
      ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(el[0], el[1]); ctx.lineTo(hd[0], hd[1]); ctx.stroke();
      ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hd[0], hd[1]); ctx.lineTo(hd[0] + s * 22, hd[1] - 10 + tap * 0.3); ctx.stroke();
    });
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ---------------- mở đầu: người que thức dậy, tới bàn ---------------- */
  function intro(ctx, t) {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    tex(ctx, F.title, 60, 150, 76, COL.ink, "left"); tex(ctx, F.sub, 62, 225, 46, COL.dim, "left");
    // tranh trên tường: hình thu nhỏ của định lí
    ctx.save(); ctx.translate(690, 700); ctx.scale(1.35, 1.35); ctx.rotate(rad(2)); ctx.fillStyle = "#1c1f22"; ctx.fillRect(-160, -170, 320, 340); ctx.strokeStyle = "#4a5056"; ctx.lineWidth = 6; ctx.strokeRect(-160, -170, 320, 340);
    ctx.fillStyle = "#777"; ctx.fillRect(-30, -182, 60, 14);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 10, 110, 0, 7); ctx.stroke();
    const q = (a) => [110 * Math.cos(rad(a)), 10 + 110 * Math.sin(rad(a))], A = q(-115), B = q(180), C = q(0), D = q(65);
    ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(A[0], A[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(D[0], D[1]); ctx.closePath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.stroke(); ctx.restore();
    const FL = 1600; ctx.strokeStyle = "#2c3034"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, FL); ctx.lineTo(W, FL); ctx.stroke();
    // bàn + ghế đẩu
    ctx.fillStyle = "#c8894a"; ctx.fillRect(560, FL - 170, 400, 22); ctx.strokeStyle = "#9aa0a6"; ctx.lineWidth = 8;
    [[590, 940]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a, FL - 148); ctx.lineTo(a - 20, FL); ctx.moveTo(b, FL - 148); ctx.lineTo(b + 20, FL); ctx.stroke(); });
    ctx.fillStyle = "#b0b6bb"; ctx.fillRect(700, FL - 178, 170, 10); ctx.save(); ctx.translate(760, FL - 178); ctx.rotate(rad(-70)); ctx.fillStyle = "#cfd4d8"; ctx.fillRect(0, -6, 120, 8); ctx.restore();
    ctx.strokeStyle = "#8d6e63"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(470, FL - 96); ctx.lineTo(560, FL - 96); ctx.moveTo(482, FL - 96); ctx.lineTo(470, FL); ctx.moveTo(548, FL - 96); ctx.lineTo(560, FL); ctx.stroke();
    // diễn: nằm 0–1.4, ngồi dậy –2.4, ngồi xổm –3.0, đứng –3.5, đi –5.4, ngồi ghế –6.2
    let P, x;
    const walk = (k) => { const ph = k * 6 * Math.PI, sw = Math.sin(ph); return { ...POSE.stand, th1: 180 + sw * 22, sh1: 180 + Math.max(0, sw) * 14, th2: 180 - sw * 22, sh2: 180 + Math.max(0, -sw) * 14, ua1: 180 - sw * 20, fa1: 175 - sw * 10, ua2: 180 + sw * 20, fa2: 185 + sw * 10, hipY: 146 + Math.abs(sw) * 4 }; };
    if (t < 1.4) { P = POSE.lie; x = 300; }
    else if (t < 2.4) { P = mixPose(POSE.lie, POSE.situp, ease((t - 1.4) / 1.0)); x = 300; }
    else if (t < 3.0) { P = mixPose(POSE.situp, POSE.crouch, ease((t - 2.4) / 0.6)); x = 300; }
    else if (t < 3.5) { P = mixPose(POSE.crouch, POSE.stand, ease((t - 3.0) / 0.5)); x = 300; }
    else if (t < 5.4) { const k = (t - 3.5) / 1.9; P = walk(k); x = lerp(300, 515, ease(k)); }
    else if (t < 6.2) { P = mixPose(POSE.stand, POSE.sit, ease((t - 5.4) / 0.8)); x = 515; }
    else { P = { ...POSE.sit, fa1: 80 + Math.sin(t * 13) * 8, fa2: 88 + Math.sin(t * 13 + 1.7) * 8 }; x = 515; }
    const head = stick(ctx, x, FL, P, COL.fig, true);
    if (t < 3.0) { // hình nguệch ngoạc trên đầu khi đang ngủ
      ctx.globalAlpha = 1 - clamp((t - 2.4) / 0.6, 0, 1); ctx.save(); ctx.translate(head[0] + 10, head[1] - 80); ctx.rotate(Math.sin(t * 2) * 0.08);
      tex(ctx, "90°", 0, 0, 50, COL.ink, "center"); ctx.strokeStyle = COL.ink; ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) { const a = t * 2 + i, r = 60 + 8 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(Math.cos(a) * r, -16 + Math.sin(a) * r * 0.5, 3, 0, 7); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  /* ---------------- cảnh chính ---------------- */
  function chapterScene(ctx, ci, t) {
    const ch = F.chapters[ci], tc = TL.chapters[ci];
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H); board(ctx);
    // tiêu đề
    const k0 = clamp((t - tc.t0) / 0.9, 0, 1);
    if (k0 < 1) { // chữ lớn giữa bảng rồi thu về góc
      const s = lerp(1.6, 1, ease(k0)), x = lerp(540, BX + 40, ease(k0)), y = lerp(520, BY + 82, ease(k0));
      ctx.globalAlpha = clamp(k0 * 4, 0, 1); ctx.font = `bold ${Math.round(50 * s)}px ${FONT}`; ctx.fillStyle = COL.gold; ctx.textAlign = k0 < 0.5 ? "center" : "left"; ctx.fillText(ch.head, x, y); ctx.textAlign = "left"; ctx.globalAlpha = 1;
    } else { ctx.font = `bold 50px ${FONT}`; ctx.fillStyle = COL.gold; ctx.fillText(ch.head, BX + 40, BY + 82); }
    ctx.globalAlpha = clamp((t - tc.t0 - 0.5) / 0.5, 0, 1); tex(ctx, ch.title, BX + 40, BY + 146, 46, COL.ink, "left"); ctx.globalAlpha = 1;
    // hình
    const P = chapterPoints(ch, t);
    ch.steps.forEach((st, si) => { const tm = tc.steps[si]; const ops = st.draw || [], n = ops.filter((o) => !o.move).length || 1; let j = 0;
      ops.forEach((op) => { if (op.move) return; const a = tm.draw0 + (tm.draw1 - tm.draw0) * (j / n), b = tm.draw0 + (tm.draw1 - tm.draw0) * ((j + 1) / n); j++; const k = t >= b ? 1 : t <= a ? 0 : ease((t - a) / (b - a)); drawOp(ctx, op, k, P, ch, t); }); });
    // chú thích bước hiện tại
    let cur = -1; tc.steps.forEach((tm, si) => { if (t >= tm.t0) cur = si; });
    if (cur >= 0) { const cap = ch.steps[cur].cap; if (cap) { const kk = clamp((t - tc.steps[cur].t0) / 0.4, 0, 1); ctx.globalAlpha = kk; const L = wrap(ctx, cap, 44, BW - 80); L.forEach((ln, i) => tex(ctx, ln, BX + 40, BY + BH - 34 - (L.length - 1 - i) * 54, 44, cap.startsWith("★") ? COL.gold : "#d7dade", "left")); ctx.globalAlpha = 1; } }
    // laptop
    const lines = []; let stmt = null, typing = false;
    ch.steps.forEach((st, si) => { const tm = tc.steps[si]; if (t < tm.type0) return;
      if (st.stmt) { const n = Math.floor((t - tm.type0) * tm.cps); stmt = { text: st.stmt, head: st.stmtHead, n }; typing = typing || t < tm.type1; return; }
      let tt = tm.type0; (st.type || []).forEach((txt) => { const L = tlen(txt), d = L / tm.cps; if (t >= tt) { lines.push({ text: txt, n: Math.min(L, Math.floor((t - tt) * tm.cps)), color: st.typeColor }); if (t < tt + d) typing = true; } tt += d + 0.15; }); });
    laptop(ctx, ch.file, lines, true, typing, t, stmt); hands(ctx, t, typing);
    tag(ctx);
  }
  function tag(ctx) { ctx.font = `italic 34px ${FONT}`; ctx.fillStyle = "#6f777d"; ctx.textAlign = "center"; ctx.fillText("Lớp Toán Thầy Chung", W / 2, H - 34); ctx.textAlign = "left"; }

  function summary(ctx, t) {
    const s = TL.summary, k = t - s.t0; ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H); board(ctx);
    ctx.font = `bold 52px ${FONT}`; ctx.fillStyle = COL.gold; ctx.fillText(F.summary.head, BX + 40, BY + 86);
    let y = BY + 180;
    F.summary.items.forEach((it, i) => { const a = clamp((k - 0.6 - i * 0.9) / 0.5, 0, 1); ctx.globalAlpha = a; const L = wrap(ctx, it, 44, BW - 140);
      ctx.font = `bold 46px ${FONT}`; ctx.fillStyle = COL.gold; ctx.fillText(String(i + 1) + ".", BX + 40, y);
      L.forEach((ln, j) => tex(ctx, ln, BX + 100, y + j * 56, 44, COL.ink, "left")); y += L.length * 56 + 44; ctx.globalAlpha = 1; });
    const n = Math.floor(Math.max(0, k - 4.2) * 18), stmt = { text: F.summary.tip, head: "BÍ QUYẾT", n };
    laptop(ctx, "bi-quyet.txt", [], false, n < tlen(F.summary.tip), t, k > 4 ? stmt : null); hands(ctx, t, k > 4.2 && n < tlen(F.summary.tip)); tag(ctx);
  }
  function ending(ctx, t) {
    const k = t - TL.end.t0; ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    const a = clamp(k / 0.8, 0, 1); ctx.globalAlpha = a;
    ctx.font = `bold 96px ${FONT}`; ctx.fillStyle = COL.gold; ctx.textAlign = "center"; ctx.fillText("Lớp Toán", 540, 820); ctx.fillText("Thầy Chung", 540, 940);
    ctx.font = `48px ${FONT}`; ctx.fillStyle = COL.ink; ctx.fillText(F.endSub || "Chúc các em học tốt!", 540, 1060);
    ctx.font = `32px ${FONT}`; ctx.fillStyle = COL.dim; ctx.fillText("Giọng đọc: VieNeu-TTS · Âm thanh: TiengDong.com", 540, 1800); ctx.textAlign = "left";
    stick(ctx, 540, 1500, { ...POSE.stand, ua1: 50 + Math.sin(k * 6) * 12, fa1: 15 + Math.sin(k * 6) * 30 }, COL.fig, true); ctx.globalAlpha = 1;
  }

  function renderAt(ctx, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (t < TL.intro.t1) { intro(ctx, t); const k = clamp((t - (TL.intro.t1 - 0.7)) / 0.7, 0, 1); if (k > 0) { ctx.globalAlpha = k; chapterScene(ctx, 0, TL.chapters[0].t0); ctx.globalAlpha = 1; } return; }
    for (let i = 0; i < TL.chapters.length; i++) if (t < TL.chapters[i].t1) { chapterScene(ctx, i, t); const k = clamp((TL.chapters[i].t1 - t) / 0.4, 0, 1); if (k < 1 && i + 1 < TL.chapters.length) { ctx.globalAlpha = 1 - k; ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; } return; }
    if (t < TL.summary.t1) return summary(ctx, t);
    return ending(ctx, t);
  }
  F.chapters.forEach((c, i) => (c._i = i));
  window.STICKFILM = { renderAt, W, H, total: TL.total };
  window.__READY__ = true;
})();
