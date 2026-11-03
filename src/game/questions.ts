// =====================================================================
//  NGÂN HÀNG CÂU HỎI "LÊN CHÙA HỌC TOÁN"
//  Mỗi khối (6–9) có 4 mức độ: 1 Nhận biết, 2 Thông hiểu, 3 Vận dụng,
//  4 Vận dụng cao. Mỗi ô là danh sách hàm sinh câu hỏi: mỗi lần chơi số
//  liệu được sinh ngẫu nhiên, đáp án do máy tính toán nên luôn đúng.
//  Câu hỏi trả về: q (đề), a (4 phương án, a[0] là đáp án đúng), g (lời giải).
// =====================================================================

export type Question = { q: string; a: string[]; g: string };
type Gen = () => Question;

// ---------- Tiện ích ----------
const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const nz = (a: number, b: number) => { let x = 0; while (x === 0) x = ri(a, b); return x; };
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

/** Định dạng số kiểu Việt Nam: dấu trừ "−", dấu phẩy thập phân. */
export const fmt = (n: number) => {
  const abs = Math.abs(n);
  const s = Number.isInteger(abs) ? String(abs) : String(+abs.toFixed(4)).replace('.', ',');
  return (n < 0 ? '−' : '') + s;
};
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
export const F = (a: string | number, b: string | number) => `<span class="fr"><i>${a}</i><i>${b}</i></span>`;
const rt = (x: string | number) => `√<span class="ov">${x}</span>`;
const sup = (b: string | number, e: string | number) => `${b}<sup>${e}</sup>`;
const X2 = 'x<sup>2</sup>';

/** Phân số tối giản dạng HTML. */
const frac = (p: number, q: number) => {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q) || 1; p /= g; q /= g;
  if (q === 1) return fmt(p);
  return (p < 0 ? '−' : '') + F(Math.abs(p), q);
};
/** Hệ số đứng trước biến: 1 → "", −1 → "−". */
const coef = (a: number, v: string) => (a === 1 ? v : a === -1 ? '−' + v : fmt(a) + v);
const tail = (b: number) => (b > 0 ? ` + ${fmt(b)}` : b < 0 ? ` − ${fmt(-b)}` : '');
/** ax + b */
const lin = (a: number, b: number, v = 'x') => (a === 0 ? fmt(b) : coef(a, v) + tail(b));
/** ax² + bx + c */
const quad = (a: number, b: number, c: number) => {
  let s = coef(a, X2);
  if (b) s += (b > 0 ? ' + ' : ' − ') + coef(Math.abs(b), 'x');
  return s + tail(c);
};
const pair = (u: number, v: number) => `(${fmt(u)}; ${fmt(v)})`;

/** Tạo câu hỏi: tự loại phương án trùng, bổ sung phương án số nếu thiếu. */
function mk(q: string, correct: number | string, cands: (number | string)[], g: string, unit = ''): Question {
  const show = (v: number | string) => (typeof v === 'number' ? fmt(v) + unit : v);
  const list = [show(correct)];
  for (const c of cands) {
    if (typeof c === 'number' && !Number.isFinite(c)) continue;
    const s = show(c);
    if (!list.includes(s)) list.push(s);
    if (list.length === 4) break;
  }
  if (typeof correct === 'number') {
    for (const d of [1, -1, 2, -2, 3, 5, 10, -10, 4, 7]) {
      if (list.length === 4) break;
      const s = show(correct + d);
      if (!list.includes(s)) list.push(s);
    }
  }
  if (list.length < 4) throw new Error('Thiếu phương án: ' + q);
  return { q, a: list, g };
}

// =====================================================================
//  LỚP 6
// =====================================================================
const L6: Gen[][] = [
  [ // Mức 1 – Nhận biết
    () => {
      const p = pick([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);
      const comps = shuffle([4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 25, 27, 33, 35, 39, 49, 51]).slice(0, 3);
      return mk('Số nào sau đây là số nguyên tố?', String(p), comps.map(String),
        `${p} chỉ có hai ước là 1 và ${p}. Mỗi số còn lại đều có thêm ước khác 1 và chính nó.`);
    },
    () => {
      const n = nz(-60, 60);
      return mk(`Số đối của ${fmt(n)} là`, -n, [n, Math.abs(n) + 1, -(Math.abs(n) + 1)],
        `Hai số đối nhau có tổng bằng 0: ${fmt(n)} + ${par(-n)} = 0.`);
    },
    () => {
      const c = 9 * ri(12, 111);
      const ds = String(c).split('').reduce((s, d) => s + +d, 0);
      return mk('Số nào sau đây chia hết cho 9?', c, [c + 1, c + 3, c - 2],
        `Tổng các chữ số của ${c} là ${ds}, chia hết cho 9 nên ${c} chia hết cho 9.`);
    },
    () => {
      const a = ri(6, 20), b = ri(2, a - 1);
      return mk(`Hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Chu vi hình chữ nhật là`, 2 * (a + b),
        [a * b, a + b, 2 * a + b], `C = 2 · (${a} + ${b}) = ${2 * (a + b)} (cm).`, ' cm');
    },
  ],
  [ // Mức 2 – Thông hiểu
    () => {
      const g0 = ri(2, 12); let x = 0, y = 0;
      do { x = ri(2, 9); y = ri(2, 9); } while (x === y || gcd(x, y) !== 1);
      const a = g0 * x, b = g0 * y;
      return mk(`ƯCLN(${a}, ${b}) bằng`, g0, [lcm(a, b), 2 * g0, Math.min(a, b)],
        `${a} = ${g0} · ${x}; ${b} = ${g0} · ${y} và ƯCLN(${x}, ${y}) = 1 nên ƯCLN(${a}, ${b}) = ${g0}.`);
    },
    () => {
      let a = 0, b = 0;
      do { a = ri(4, 24); b = ri(4, 24); } while (a === b);
      const L = lcm(a, b);
      return mk(`BCNN(${a}, ${b}) bằng`, L, [a * b, gcd(a, b), 2 * L],
        `${L} = ${a} · ${L / a} = ${b} · ${L / b} là bội chung nhỏ nhất khác 0 của ${a} và ${b}.`);
    },
    () => {
      let b = 0, d = 0;
      do { b = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]); d = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]); } while (b === d);
      let a = 0, c = 0;
      do { a = ri(1, b - 1); c = ri(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const L = lcm(b, d), m1 = L / b, m2 = L / d, num = a * m1 + c * m2;
      const res = frac(num, L);
      const unred = F(num, L);
      return mk(`Tính ${F(a, b)} + ${F(c, d)}`, res, [frac(a + c, b + d), frac(a + c, b * d), frac(a * c, b * d), frac(a + c, L), frac(a * m1 + c, L), frac(num + 1, L), frac(num, 2 * L)],
        `Quy đồng mẫu ${L}: ${F(a * m1, L)} + ${F(c * m2, L)} = ${unred}${unred === res ? '' : ' = ' + res}.`);
    },
    () => {
      const p = pick([10, 20, 25, 30, 40, 50, 60, 75]), N = 20 * ri(2, 20), c = (N * p) / 100;
      return mk(`${p}% của ${N} là`, c, [N - c, (N * p) / 10, c + 10],
        `${N} · ${F(p, 100)} = ${c}.`);
    },
  ],
  [ // Mức 3 – Vận dụng
    () => {
      const a = ri(2, 9), x = nz(-12, 12), b = nz(-30, 30), c = a * x + b;
      return mk(`Tìm số nguyên x, biết ${lin(a, b)} = ${fmt(c)}`, x,
        [-x, (c + b) % a === 0 ? (c + b) / a : x + 2, c - b],
        `${a}x = ${fmt(c)} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${fmt(a * x)}, suy ra x = ${par(a * x)} : ${a} = ${fmt(x)}.`);
    },
    () => {
      const d = pick([10, 20, 25, 30, 40, 50]), P = 20 * ri(5, 50), off = (P * d) / 100, c = P - off;
      return mk(`Một bộ sách giá ${P} nghìn đồng, được giảm giá ${d}%. Giá bộ sách sau khi giảm là`, c,
        [off, P - d, P + off],
        `Số tiền được giảm: ${P} · ${d}% = ${off} (nghìn đồng). Giá sau khi giảm: ${P} − ${off} = ${c} (nghìn đồng).`, ' nghìn đồng');
    },
    () => {
      const base = pick([2, 3, 5]), e = base === 5 ? ri(1, 2) : ri(1, 3), m = ri(3, 7), n = ri(2, 5), k = m + n - e;
      const c = base ** e;
      return mk(`Tính ${sup(base, m)} · ${sup(base, n)} : ${sup(base, k)}`, c,
        [base ** (e + 1), base * (m + n - k + 1), base ** Math.max(0, e - 1)],
        `${sup(base, m)} · ${sup(base, n)} : ${sup(base, k)} = ${sup(base, `${m} + ${n} − ${k}`)} = ${sup(base, e)} = ${c}.`);
    },
    () => {
      const a = ri(5, 30), b = ri(2, 9), c = ri(2, 9), d = ri(1, 20);
      return mk(`Tính ${a} + ${b} · ${c} − ${d}`, a + b * c - d, [(a + b) * c - d, a + b * (c - d), a + b * c + d],
        `Nhân trước, cộng trừ sau: ${a} + ${b * c} − ${d} = ${a + b * c - d}.`);
    },
  ],
  [ // Mức 4 – Vận dụng cao
    () => {
      const [p, q, r] = pick([[2, 3, 4], [3, 4, 5], [4, 5, 6], [2, 3, 5], [3, 4, 6], [4, 6, 8], [5, 6, 8], [6, 8, 10], [2, 5, 6]]);
      const L = lcm(lcm(p, q), r);
      const N = L * ri(Math.ceil(100 / L), Math.floor(500 / L));
      const low = N - ri(1, L - 1), high = low + L - 1;
      return mk(`Khi xếp hàng ${p}, hàng ${q}, hàng ${r} thì số học sinh của một khối đều vừa đủ. Biết số học sinh trong khoảng từ ${low} đến ${high}. Số học sinh của khối là`,
        N, [N + L, N - L > 0 ? N - L : N + 2 * L, N + p],
        `Số học sinh là bội chung của ${p}, ${q}, ${r}. BCNN(${p}, ${q}, ${r}) = ${L}. Trong khoảng từ ${low} đến ${high}, bội của ${L} chỉ có ${N}.`);
    },
    () => {
      const g0 = ri(4, 15); let x = 0, y = 0;
      do { x = ri(2, 9); y = ri(2, 9); } while (x === y || gcd(x, y) !== 1);
      const A = g0 * x, B = g0 * y;
      return mk(`Có ${A} quyển vở và ${B} chiếc bút. Chia đều số vở và số bút vào các phần quà. Có thể chia được nhiều nhất bao nhiêu phần quà?`,
        g0, [lcm(A, B), 2 * g0, x + y],
        `Số phần quà nhiều nhất là ƯCLN(${A}, ${B}) = ${g0}. Khi đó mỗi phần có ${x} quyển vở và ${y} chiếc bút.`);
    },
    () => {
      const b = pick([3, 4, 5]), a = ri(1, b - 1), d = pick([2, 3, 4]), c = ri(1, d - 1);
      const kmin = Math.ceil(20 / (b * d)), kmax = Math.max(kmin, Math.floor(48 / (b * d)));
      const N = b * d * ri(kmin, kmax), gioi = (N * a) / b, rem = N - gioi, kha = (rem * c) / d;
      return mk(`Lớp 6A có ${N} học sinh. Số học sinh giỏi bằng ${F(a, b)} số học sinh cả lớp. Số học sinh khá bằng ${F(c, d)} số học sinh còn lại. Số học sinh khá là`,
        kha, [(N * c) / d, gioi, rem - kha, rem],
        `Số học sinh giỏi: ${N} · ${F(a, b)} = ${gioi}. Số học sinh còn lại: ${N} − ${gioi} = ${rem}. Số học sinh khá: ${rem} · ${F(c, d)} = ${kha}.`, ' học sinh');
    },
    () => {
      const a = ri(8, 20), b = ri(5, a - 1), c = (a - 2) * (b - 2);
      return mk(`Mảnh vườn hình chữ nhật dài ${a} m, rộng ${b} m. Người ta làm lối đi rộng 1 m chạy sát bốn cạnh ở bên trong vườn. Diện tích phần vườn còn lại là`,
        c, [(a - 1) * (b - 1), a * b - 2 * (a + b), (a - 2) * b],
        `Phần còn lại là hình chữ nhật dài ${a} − 2 = ${a - 2} (m), rộng ${b} − 2 = ${b - 2} (m). Diện tích: ${a - 2} · ${b - 2} = ${c} (m²).`, ' m²');
    },
  ],
];

// =====================================================================
//  LỚP 7
// =====================================================================
const L7: Gen[][] = [
  [
    () => {
      const x = -(ri(1, 20) + ri(1, 9) / 10);
      return mk(`Giá trị của |${fmt(x)}| là`, -x, [x, 0, -x + 1],
        `Giá trị tuyệt đối của một số luôn không âm: |${fmt(x)}| = ${fmt(-x)}.`);
    },
    () => {
      const n = ri(2, 20);
      return mk(`Tính ${rt(n * n)}`, String(n), [fmt(-n), '±' + n, String(2 * n)],
        `${rt(n * n)} = ${n} vì ${n} ≥ 0 và ${sup(n, 2)} = ${n * n}.`);
    },
    () => {
      const A = ri(30, 100), B = ri(20, 160 - A), C = 180 - A - B;
      return mk(`Tam giác ABC có Â = ${A}°, B̂ = ${B}°. Số đo Ĉ là`, C, [180 - A, 180 - B, Math.abs(A - B)],
        `Tổng ba góc của một tam giác bằng 180° nên Ĉ = 180° − ${A}° − ${B}° = ${C}°.`, '°');
    },
    () => {
      const n = ri(3, 6), m = ri(1, n - 1), a = ri(2, 9), b = ri(1, 9), c = ri(1, 9);
      const xm = m === 1 ? 'x' : sup('x', m);
      const P = `${a}${xm} − ${b === 1 ? '' : b}${sup('x', n)} + ${c}`;
      return mk(`Bậc của đa thức ${P} là`, n, [m, n + m, a],
        `Hạng tử có bậc cao nhất là −${b === 1 ? '' : b}${sup('x', n)} (bậc ${n}) nên đa thức có bậc ${n}.`);
    },
  ],
  [
    () => {
      let a = 0, b = 0, c = 0;
      do { a = ri(2, 12); b = ri(1, 12); c = ri(2, 12); } while ((a * b) % c !== 0 || c === a);
      const x = (a * b) / c;
      return mk(`Tìm x, biết ${F('x', a)} = ${F(b, c)}`, x, [(a * c) % b === 0 ? (a * c) / b : x + 1, b * c, 2 * x],
        `x = ${F(`${a} · ${b}`, c)} = ${x}.`);
    },
    () => {
      let p = 0, q = 0;
      do { p = ri(2, 5); q = ri(p + 1, 9); } while (gcd(p, q) !== 1);
      const neg = Math.random() < 0.5;
      const base = `(${neg ? '−' : ''}${F(p, q)})`;
      return mk(`Tính ${sup(base, 2)}`, frac(p * p, q * q),
        [frac(p * p, q), frac(p, q), neg ? frac(-p * p, q * q) : frac(p * p, 2 * q), frac(2 * p, q * q), frac(p, q * q), frac(p * p + 1, q * q)],
        `${sup(base, 2)} = ${F(sup(p, 2), sup(q, 2))} = ${frac(p * p, q * q)}.`);
    },
    () => {
      const a = ri(1, 5), b = nz(-9, 9), c = ri(-9, 9), x = nz(-4, 4);
      const v = a * x * x + b * x + c;
      return mk(`Giá trị của biểu thức ${quad(a, b, c)} tại x = ${fmt(x)} là`, v,
        [a * x * x - b * x + c, -a * x * x + b * x + c, 2 * a * x + b * x + c],
        `Thay x = ${fmt(x)}: ${a === 1 ? '' : a + ' · '}${sup(par(x), 2)} ${b > 0 ? '+' : '−'} ${Math.abs(b)} · ${par(x)}${tail(c)} = ${fmt(v)}.`);
    },
    () => {
      if (Math.random() < 0.5) {
        const A = 2 * ri(10, 70), B = (180 - A) / 2;
        return mk(`Tam giác ABC cân tại A có Â = ${A}°. Số đo B̂ là`, B, [180 - A, A, A / 2],
          `Tam giác ABC cân tại A nên B̂ = Ĉ = (180° − ${A}°) : 2 = ${B}°.`, '°');
      }
      const B = ri(25, 85), A = 180 - 2 * B;
      return mk(`Tam giác ABC cân tại A có B̂ = ${B}°. Số đo Â là`, A, [B, 180 - B, 90 - B],
        `Tam giác ABC cân tại A nên Ĉ = B̂ = ${B}°, do đó Â = 180° − 2 · ${B}° = ${A}°.`, '°');
    },
  ],
  [
    () => {
      const k = ri(2, 9), a = ri(2, 12); let c = 0;
      do { c = ri(2, 15); } while (c === a);
      const b = k * a;
      return mk(`Cho x và y là hai đại lượng tỉ lệ thuận. Khi x = ${a} thì y = ${b}. Khi x = ${c} thì y bằng`, k * c,
        [b + c - a, (a * b) % c === 0 ? (a * b) / c : k * c + k, k],
        `Hệ số tỉ lệ: ${F('y', 'x')} = ${F(b, a)} = ${k}. Khi x = ${c} thì y = ${k} · ${c} = ${k * c}.`);
    },
    () => {
      let a = 0, b = 0, c = 0;
      do { a = ri(2, 12); b = ri(2, 12); c = ri(2, 24); } while ((a * b) % c !== 0 || c === a || (a * b) / c === b);
      const P = a * b;
      return mk(`Cho x và y là hai đại lượng tỉ lệ nghịch. Khi x = ${a} thì y = ${b}. Khi x = ${c} thì y bằng`, P / c,
        [(b * c) % a === 0 ? (b * c) / a : P / c + 2, P, Math.abs(b + c - a)],
        `x · y = ${a} · ${b} = ${P}. Khi x = ${c} thì y = ${P} : ${c} = ${P / c}.`);
    },
    () => {
      let a = 0, b = 0;
      do { a = ri(2, 7); b = ri(2, 9); } while (a === b);
      const t = ri(2, 9), S = (a + b) * t;
      return mk(`Tìm x, y biết ${F('x', a)} = ${F('y', b)} và x + y = ${S}`, `x = ${a * t}; y = ${b * t}`,
        [`x = ${b * t}; y = ${a * t}`, `x = ${t * (a + 1)}; y = ${t * (b - 1)}`, `x = ${S - a}; y = ${S - b}`, `x = ${a * t + a}; y = ${b * t - a}`, `x = ${a * t - 1}; y = ${b * t + 1}`, `x = ${S}; y = ${t}`],
        `Theo tính chất dãy tỉ số bằng nhau: ${F('x', a)} = ${F('y', b)} = ${F('x + y', `${a} + ${b}`)} = ${F(S, a + b)} = ${t}. Suy ra x = ${a} · ${t} = ${a * t}; y = ${b} · ${t} = ${b * t}.`);
    },
    () => {
      let al = 0;
      do { al = ri(35, 145); } while (al === 90);
      return mk(`Cho a // b. Đường thẳng c cắt a tại A và cắt b tại B. Một góc tại A bằng ${al}°. Góc trong cùng phía với góc đó tại B có số đo là`,
        180 - al, [al, Math.abs(90 - al), 2 * al < 360 ? 2 * al : al + 20],
        `Góc so le trong với góc đã cho bằng ${al}° (vì a // b). Góc cần tìm kề bù với góc này nên bằng 180° − ${al}° = ${180 - al}°.`, '°');
    },
  ],
  [
    () => {
      const r = ri(2, 9), x = ri(2, 9), y = ri(0, 5), n = r + x + y;
      return mk(`Một hộp có ${r} quả bóng đỏ, ${x} quả bóng xanh${y ? `, ${y} quả bóng vàng` : ''}; các quả bóng có cùng kích thước. Lấy ngẫu nhiên một quả. Xác suất lấy được quả bóng đỏ là`,
        frac(r, n), [frac(r, x + y), frac(x, n), frac(1, n), frac(r, n + 1)],
        `Có ${n} kết quả đồng khả năng, trong đó có ${r} kết quả lấy được bóng đỏ. Xác suất bằng ${F(r, n)}${frac(r, n) === F(r, n) ? '' : ' = ' + frac(r, n)}.`);
    },
    () => {
      const [a, b, c] = shuffle([2, 3, 4, 5, 6, 7]).slice(0, 3), t = ri(3, 12), S = (a + b + c) * t;
      return mk(`Ba lớp 7A, 7B, 7C trồng được tất cả ${S} cây. Số cây của ba lớp tỉ lệ với ${a}; ${b}; ${c}. Số cây lớp 7C trồng được là`,
        c * t, [a * t, b * t, S % 3 === 0 ? S / 3 : c * t + t],
        `Gọi số cây ba lớp là x, y, z. Ta có ${F('x', a)} = ${F('y', b)} = ${F('z', c)} = ${F('x + y + z', a + b + c)} = ${F(S, a + b + c)} = ${t}. Suy ra z = ${c} · ${t} = ${c * t}.`, ' cây');
    },
    () => {
      const a = ri(2, 9), r = nz(-9, 9);
      return mk(`Nghiệm của đa thức P(x) = ${lin(a, -a * r)} là`, r, [-r, a * r, -a * r],
        `P(x) = 0 khi ${lin(a, -a * r)} = 0, suy ra ${a}x = ${fmt(a * r)}, x = ${fmt(r)}.`);
    },
    () => {
      let r = 0, m = 0, c = 0;
      do { r = ri(1, 5) * pick([1, -1]); m = ri(-6, 8); c = m * r - r * r; } while (c === 0 || m === 0);
      return mk(`Biết x = ${fmt(r)} là một nghiệm của đa thức P(x) = ${X2} − mx${tail(c)}. Giá trị của m là`, m,
        [-m, m + 1, c],
        `P(${fmt(r)}) = 0 nên ${sup(par(r), 2)} − m · ${par(r)}${tail(c)} = 0, suy ra ${par(r)} · m = ${fmt(r * r + c)}, m = ${fmt(m)}.`);
    },
  ],
];

// =====================================================================
//  LỚP 8
// =====================================================================
const L8: Gen[][] = [
  [
    () => {
      const a = ri(1, 9), s = pick([1, -1]);
      return mk(`Khai triển ${sup(`(${lin(1, s * a)})`, 2)}`, quad(1, 2 * s * a, a * a),
        [quad(1, 0, a * a), quad(1, s * a, a * a), quad(1, -2 * s * a, a * a), quad(1, 2 * s * a, 2 * a)],
        `Hằng đẳng thức: ${sup(`(A ${s > 0 ? '+' : '−'} B)`, 2)} = A² ${s > 0 ? '+' : '−'} 2AB + B². Do đó ${sup(`(${lin(1, s * a)})`, 2)} = ${quad(1, 2 * s * a, a * a)}.`);
    },
    () => {
      let A = 0, B = 0, C = 0, D = 0;
      do { A = ri(60, 130); B = ri(60, 130); C = ri(60, 130); D = 360 - A - B - C; } while (D < 40 || D > 170);
      return mk(`Tứ giác ABCD có Â = ${A}°, B̂ = ${B}°, Ĉ = ${C}°. Số đo D̂ là`, D, [D + 20, D - 10, 180 - D],
        `Tổng các góc của một tứ giác bằng 360° nên D̂ = 360° − ${A}° − ${B}° − ${C}° = ${D}°.`, '°');
    },
    () => {
      let a = 0, b = 0;
      do { a = nz(-9, 9); b = nz(-9, 9); } while (a === b || a === -b);
      return mk(`Hệ số góc của đường thẳng y = ${lin(a, b)} là`, a, [b, -a, a + b],
        `Đường thẳng y = ax + b (a ≠ 0) có hệ số góc là a, ở đây a = ${fmt(a)}.`);
    },
    () => {
      let p = 0, q = 0;
      do { p = ri(1, 9); q = ri(1, 9); } while (p === q);
      return mk(`Phân thức ${F(lin(1, p), lin(1, -q))} xác định khi`, `x ≠ ${q}`,
        [`x ≠ ${fmt(-p)}`, `x ≠ ${fmt(-q)}`, `x = ${q}`, 'x ≠ 0'],
        `Phân thức xác định khi mẫu khác 0: ${lin(1, -q)} ≠ 0, tức là x ≠ ${q}.`);
    },
  ],
  [
    () => {
      const m = pick([1, 1, 2, 3]); let a = 0;
      do { a = ri(2, 12); } while (gcd(a, m) !== 1);
      const mx = m === 1 ? 'x' : m + 'x';
      return mk(`Phân tích ${m === 1 ? '' : m * m}${X2} − ${a * a} thành nhân tử`, `(${mx} − ${a})(${mx} + ${a})`,
        [sup(`(${mx} − ${a})`, 2), sup(`(${mx} + ${a})`, 2), `(${mx} − ${a * a})(${mx} + ${a * a})`, `(${mx} − ${a})(${mx} + ${a * a})`],
        `Hiệu hai bình phương: ${sup(mx === 'x' ? 'x' : `(${mx})`, 2)} − ${sup(a, 2)} = (${mx} − ${a})(${mx} + ${a}).`);
    },
    () => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]]);
      if (Math.random() < 0.5)
        return mk(`Tam giác vuông có hai cạnh góc vuông dài ${a} cm và ${b} cm. Độ dài cạnh huyền là`, c, [a + b, c + 1, b + 2],
          `Theo định lí Pythagore: cạnh huyền = ${rt(`${sup(a, 2)} + ${sup(b, 2)}`)} = ${rt(c * c)} = ${c} (cm).`, ' cm');
      return mk(`Tam giác vuông có cạnh huyền dài ${c} cm, một cạnh góc vuông dài ${a} cm. Cạnh góc vuông còn lại dài`, b, [c - a, c + a, b + 1],
        `Theo định lí Pythagore: cạnh cần tìm = ${rt(`${sup(c, 2)} − ${sup(a, 2)}`)} = ${rt(b * b)} = ${b} (cm).`, ' cm');
    },
    () => {
      const x = ri(-9, 9); let a = 0, c = 0;
      do { a = ri(2, 9); c = ri(1, 9); } while (a === c);
      const b = ri(-15, 15), d = a * x + b - c * x;
      return mk(`Nghiệm của phương trình ${lin(a, b)} = ${lin(c, d)} là`, x,
        [-x, (d - b) % (a + c) === 0 ? (d - b) / (a + c) : x + 1, (d + b) % (a - c) === 0 ? (d + b) / (a - c) : x + 2],
        `Chuyển vế: ${a}x − ${c === 1 ? '' : c}x = ${fmt(d)} ${b >= 0 ? '−' : '+'} ${Math.abs(b)}, suy ra ${coef(a - c, 'x')} = ${fmt(d - b)}${a - c === 1 ? '' : `, x = ${fmt(x)}`}.`);
    },
    () => {
      const a = nz(-5, 5), b = nz(-9, 9), x0 = nz(-4, 4), y0 = a * x0 + b;
      const cands = [pair(x0, a * x0 - b), pair(x0, y0 + 1), pair(-x0, y0)];
      if (a * y0 + b !== x0) cands.unshift(pair(y0, x0));
      return mk(`Đồ thị hàm số y = ${lin(a, b)} đi qua điểm nào sau đây?`, pair(x0, y0), cands,
        `Thay x = ${fmt(x0)}: y = ${fmt(a)} · ${par(x0)}${tail(b)} = ${fmt(y0)}. Vậy điểm ${pair(x0, y0)} thuộc đồ thị.`);
    },
  ],
  [
    () => {
      const a = ri(1, 9), v = ri(0, 2);
      const num = v === 2 ? quad(1, 2 * a, a * a) : quad(1, 0, -a * a);
      const den = v === 0 ? lin(1, -a) : lin(1, a);
      const ans = v === 1 ? lin(1, -a) : lin(1, a);
      const other = v === 1 ? lin(1, a) : lin(1, -a);
      return mk(`Rút gọn phân thức ${F(num, den)} (với điều kiện xác định)`, ans,
        [other, lin(1, v === 1 ? -a * a : a * a), F(1, ans), 'x'],
        v === 2
          ? `${num} = ${sup(`(${lin(1, a)})`, 2)} nên ${F(num, den)} = ${ans}.`
          : `${num} = (${lin(1, -a)})(${lin(1, a)}) nên ${F(num, den)} = ${ans}.`);
    },
    () => {
      const [v1, v2, s] = pick([[40, 60, 120], [30, 45, 90], [50, 75, 150], [36, 45, 180], [40, 50, 200], [45, 60, 180], [30, 40, 120]]);
      const T = s / v1 + s / v2;
      return mk(`Một người đi xe máy từ A đến B với vận tốc ${v1} km/h, lúc về đi với vận tốc ${v2} km/h. Tổng thời gian đi và về là ${T} giờ. Quãng đường AB dài`,
        s, [(T * (v1 + v2)) / 2, T * v1, s / 2],
        `Gọi quãng đường AB là x (km), x > 0. Ta có phương trình ${F('x', v1)} + ${F('x', v2)} = ${T}. Giải phương trình được x = ${s} (thỏa mãn).`, ' km');
    },
    () => {
      const m = nz(-5, 5); let k = 0;
      do { k = nz(-9, 9); } while (k === 3);
      return mk(`Đường thẳng song song với đường thẳng y = ${lin(m, 3)} và cắt trục tung tại điểm có tung độ bằng ${fmt(k)} là`,
        `y = ${lin(m, k)}`, [`y = ${lin(-m, k)}`, `y = ${lin(m, -k)}`, `y = ${lin(m, 3)}`, `y = ${lin(k, m)}`, `y = ${lin(-m, -k)}`, `y = ${lin(-m, 3)}`],
        `Hai đường thẳng song song có cùng hệ số góc nên a = ${fmt(m)}, b ≠ 3. Cắt trục tung tại điểm có tung độ ${fmt(k)} nên b = ${fmt(k)}.`);
    },
    () => {
      let a = 0, b = 0;
      do { a = ri(2, 9); b = ri(2, 9); } while (a === b);
      const k = ri(2, 5);
      return mk(`Tam giác ABC có MN // BC (M ∈ AB, N ∈ AC). Biết AM = ${a} cm, MB = ${b} cm, AN = ${a * k} cm. Độ dài đoạn NC là`,
        b * k, [(a * k * a) % b === 0 ? (a * k * a) / b : b * k + 2, a * k + b - a, b * k + k],
        `Theo định lí Thalès: ${F('AM', 'MB')} = ${F('AN', 'NC')}, suy ra NC = ${F('MB · AN', 'AM')} = ${F(`${b} · ${a * k}`, a)} = ${b * k} (cm).`, ' cm');
    },
  ],
  [
    () => {
      const a = ri(1, 6) * pick([1, -1]), c = ri(-10, 20), m = c - a * a;
      return mk(`Giá trị nhỏ nhất của biểu thức A = ${quad(1, -2 * a, c)} là`, m, [c, -a * a, c + a * a],
        `A = ${sup(`(${lin(1, -a)})`, 2)}${tail(m)} ≥ ${fmt(m)} với mọi x. Dấu "=" xảy ra khi x = ${fmt(a)}.`);
    },
    () => {
      const a = ri(1, 9), x = nz(-6, 6), c = 4 * a * x;
      return mk(`Tìm x, biết ${sup(`(x + ${a})`, 2)} − ${sup(`(x − ${a})`, 2)} = ${fmt(c)}`, x, [-x, 2 * x, c / a],
        `Vế trái = (x + ${a} − x + ${a})(x + ${a} + x − ${a}) = ${2 * a} · 2x = ${4 * a}x. Do đó ${4 * a}x = ${fmt(c)}, x = ${fmt(x)}.`);
    },
    () => {
      const w = ri(3, 15), d = ri(1, 10), l = w + d, P = 2 * (l + w);
      return mk(`Một hình chữ nhật có chu vi ${P} m, chiều dài hơn chiều rộng ${d} m. Diện tích hình chữ nhật là`,
        l * w, [(w + 1) * (l + 1), (P / 2) * d, l * l],
        `Nửa chu vi: ${P / 2} m. Chiều rộng: (${P / 2} − ${d}) : 2 = ${w} (m); chiều dài: ${w} + ${d} = ${l} (m). Diện tích: ${l} · ${w} = ${l * w} (m²).`, ' m²');
    },
    () => {
      let p = 0, q = 0, u = 0, v = 0;
      do { p = ri(2, 5); q = ri(2, 5); u = ri(1, 5); v = ri(1, 5); } while (p === q || u === v);
      return mk(`Cho ΔABC ∽ ΔDEF. Biết AB = ${q * u} cm, BC = ${q * v} cm, DE = ${p * u} cm. Độ dài EF là`, p * v,
        [q * v + p * u - q * u, (q * v * q * u) % (p * u) === 0 ? (q * v * q * u) / (p * u) : p * v + 2, p * u],
        `ΔABC ∽ ΔDEF nên ${F('DE', 'AB')} = ${F('EF', 'BC')}, suy ra EF = ${F('DE · BC', 'AB')} = ${F(`${p * u} · ${q * v}`, q * u)} = ${p * v} (cm).`, ' cm');
    },
  ],
];

// =====================================================================
//  LỚP 9
// =====================================================================
const TRIG: Record<string, Record<number, string>> = {
  sin: { 30: F(1, 2), 45: F(rt(2), 2), 60: F(rt(3), 2) },
  cos: { 30: F(rt(3), 2), 45: F(rt(2), 2), 60: F(1, 2) },
  tan: { 30: F(rt(3), 3), 45: '1', 60: rt(3) },
};
const TRIG_VALUES = [F(1, 2), F(rt(2), 2), F(rt(3), 2), F(rt(3), 3), '1', rt(3)];

const L9: Gen[][] = [
  [
    () => {
      const [p, q] = shuffle([4, 9, 16, 25, 36, 49, 64, 81, 100]).slice(0, 2), sp = Math.sqrt(p), sq = Math.sqrt(q);
      return mk(`Tính ${rt(`${p} · ${q}`)}`, sp * sq, [sp + sq, 2 * sp * sq, p + q],
        `${rt(`${p} · ${q}`)} = ${rt(p)} · ${rt(q)} = ${sp} · ${sq} = ${sp * sq}.`);
    },
    () => {
      const f = pick(['sin', 'cos', 'tan']), ang = pick([30, 45, 60]), v = TRIG[f][ang];
      return mk(`${f} ${ang}° bằng`, v, shuffle(TRIG_VALUES.filter(t => t !== v)),
        `Theo bảng tỉ số lượng giác của các góc đặc biệt: ${f} ${ang}° = ${v}.`);
    },
    () => {
      const al = 2 * ri(20, 150);
      return mk(`Góc nội tiếp chắn cung có số đo ${al}° thì có số đo bằng`, al / 2, [al, 180 - al / 2, al / 2 + 10],
        `Số đo của góc nội tiếp bằng nửa số đo của cung bị chắn: ${al}° : 2 = ${al / 2}°.`, '°');
    },
    () => {
      const a = nz(-9, 9);
      return mk(`Biểu thức ${rt(lin(1, -a))} xác định khi`, `x ≥ ${fmt(a)}`,
        [`x > ${fmt(a)}`, `x ≤ ${fmt(a)}`, `x ≥ ${fmt(-a)}`, `x ≠ ${fmt(a)}`],
        `${rt('A')} xác định khi A ≥ 0: ${lin(1, -a)} ≥ 0, tức là x ≥ ${fmt(a)}.`);
    },
  ],
  [
    () => {
      let x = 0, y = 0;
      do { x = ri(-9, 9); y = ri(-9, 9); } while (x === y);
      const S = x + y, D = x - y;
      const sys = `<span class="sys"><span>x + y = ${fmt(S)}</span><span>x − y = ${fmt(D)}</span></span>`;
      return mk(`Nghiệm của hệ phương trình ${sys} là`, pair(x, y),
        [pair(y, x), pair(S, D), pair(-x, -y), pair(x, -y)],
        `Cộng từng vế hai phương trình: 2x = ${fmt(S + D)}, suy ra x = ${fmt(x)}. Thay vào: y = ${fmt(S)} − ${par(x)} = ${fmt(y)}.`);
    },
    () => {
      const a = ri(1, 4), b = nz(-9, 9), c = nz(-9, 9), d = b * b - 4 * a * c;
      return mk(`Phương trình ${quad(a, b, c)} = 0 có biệt thức Δ bằng`, d, [b * b + 4 * a * c, -d, b - 4 * a * c],
        `Δ = b² − 4ac = ${sup(par(b), 2)} − 4 · ${a} · ${par(c)} = ${fmt(d)}.`);
    },
    () => {
      let r1 = 0, r2 = 0;
      do { r1 = ri(-6, 8); r2 = ri(-6, 8); } while (r1 === 0 && r2 === 0);
      const S = r1 + r2, P = r1 * r2, eq = `${quad(1, -S, P)} = 0`;
      if (Math.random() < 0.5)
        return mk(`Tổng hai nghiệm của phương trình ${eq} là`, S, [-S, P, S + 2],
          `Δ = ${fmt(S * S - 4 * P)} ≥ 0 nên phương trình có hai nghiệm. Theo định lí Viète: x₁ + x₂ = ${F('−b', 'a')} = ${fmt(S)}.`);
      return mk(`Tích hai nghiệm của phương trình ${eq} là`, P, [-P, S, P + 2],
        `Δ = ${fmt(S * S - 4 * P)} ≥ 0 nên phương trình có hai nghiệm. Theo định lí Viète: x₁x₂ = ${F('c', 'a')} = ${fmt(P)}.`);
    },
    () => {
      const R = ri(2, 15);
      if (Math.random() < 0.5)
        return mk(`Độ dài đường tròn bán kính ${R} cm là`, `${2 * R}π cm`,
          [`${R}π cm`, `${R * R}π cm`, `${4 * R}π cm`, `${2 * R * R}π cm`, `${3 * R}π cm`, `${R + 1}π cm`],
          `C = 2πR = 2π · ${R} = ${2 * R}π (cm).`);
      return mk(`Diện tích hình tròn bán kính ${R} cm là`, `${R * R}π cm²`,
        [`${2 * R}π cm²`, `${2 * R * R}π cm²`, `${R}π cm²`, `${4 * R}π cm²`, `${R * R + 1}π cm²`, `${3 * R}π cm²`],
        `S = πR² = π · ${sup(R, 2)} = ${R * R}π (cm²).`);
    },
  ],
  [
    () => {
      const m = pick([2, 3, 5, 6, 7]), k = ri(2, 7), n = k * k * m;
      return mk(`Rút gọn ${rt(n)}`, `${k}${rt(m)}`,
        [`${m}${rt(k)}`, `${k * k}${rt(m)}`, `${k + 1}${rt(m)}`, `${k}${rt(m + 1)}`],
        `${rt(n)} = ${rt(`${sup(k, 2)} · ${m}`)} = ${k}${rt(m)}.`);
    },
    () => {
      let r1 = 0, r2 = 0;
      do { r1 = nz(-7, 7); r2 = nz(-7, 7); } while (r1 === r2);
      const lo = Math.min(r1, r2), hi = Math.max(r1, r2), S = r1 + r2, P = r1 * r2, d = hi - lo;
      const ps = (u: number, v: number) => `x₁ = ${fmt(Math.min(u, v))}; x₂ = ${fmt(Math.max(u, v))}`;
      return mk(`Nghiệm của phương trình ${quad(1, -S, P)} = 0 là`, ps(lo, hi),
        [ps(-lo, -hi), ps(lo, -hi), ps(-lo, hi), ps(lo + 1, hi + 1)],
        `Δ = ${sup(par(-S), 2)} − 4 · ${par(P)} = ${d * d} > 0, ${rt('Δ')} = ${d}. x₁ = ${F(`${fmt(S)} − ${d}`, 2)} = ${fmt(lo)}; x₂ = ${F(`${fmt(S)} + ${d}`, 2)} = ${fmt(hi)}.`);
    },
    () => {
      let a = 0, b = 0;
      do { a = pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]); b = pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]); } while (a === b);
      return mk(`Tính (${rt(a)} + ${rt(b)})(${rt(a)} − ${rt(b)})`, a - b, [a + b, b - a, a * b],
        `Áp dụng (A + B)(A − B) = A² − B²: ${sup(`(${rt(a)})`, 2)} − ${sup(`(${rt(b)})`, 2)} = ${a} − ${b} = ${fmt(a - b)}.`);
    },
    () => {
      const a = pick([-3, -2, -1, 1, 2, 3]), x0 = nz(-3, 3), y0 = a * x0 * x0;
      return mk(`Đồ thị hàm số y = ${coef(a, X2)} đi qua điểm nào sau đây?`, pair(x0, y0),
        [pair(x0, a * x0), pair(x0, -y0), pair(-x0, -y0), pair(2 * x0, 2 * y0), pair(y0, x0)],
        `Thay x = ${fmt(x0)}: y = ${fmt(a)} · ${sup(par(x0), 2)} = ${fmt(y0)}. Vậy điểm ${pair(x0, y0)} thuộc đồ thị.`);
    },
  ],
  [
    () => {
      const w = ri(3, 20), d = ri(2, 10), S = w * (w + d);
      return mk(`Một mảnh đất hình chữ nhật có chiều dài hơn chiều rộng ${d} m và diện tích bằng ${S} m². Chiều rộng mảnh đất là`,
        w, [w + d, S % d === 0 ? S / d : w + 2, w - 1 > 0 ? w - 1 : w + 3],
        `Gọi chiều rộng là x (m), x > 0. Ta có x(x + ${d}) = ${S}, tức là ${quad(1, d, -S)} = 0. Phương trình có hai nghiệm x = ${w} (thỏa mãn) và x = −${w + d} (loại).`, ' m');
    },
    () => {
      const a = ri(1, 6) * pick([1, -1]);
      return mk(`Phương trình ${quad(1, -2 * a, 0)} + m = 0 có nghiệm kép khi m bằng`, a * a, [-a * a, 2 * a, a],
        `b' = ${fmt(-a)}, Δ' = ${sup(par(-a), 2)} − m = ${a * a} − m. Phương trình có nghiệm kép khi Δ' = 0, tức là m = ${a * a}.`);
    },
    () => {
      let r1 = 0, r2 = 0;
      do { r1 = ri(-6, 6); r2 = ri(-6, 6); } while (r1 === 0 || r2 === 0);
      const S = r1 + r2, P = r1 * r2, v = S * S - 2 * P;
      return mk(`Gọi x₁, x₂ là hai nghiệm của phương trình ${quad(1, -S, P)} = 0. Giá trị của x₁² + x₂² là`, v,
        [S * S + 2 * P, S * S, S * S - P],
        `Theo định lí Viète: x₁ + x₂ = ${fmt(S)}, x₁x₂ = ${fmt(P)}. x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂ = ${sup(par(S), 2)} − 2 · ${par(P)} = ${fmt(v)}.`);
    },
    () => {
      const r = ri(2, 8);
      if (Math.random() < 0.5) {
        const h = ri(3, 12), V = r * r * h;
        return mk(`Một hình trụ có bán kính đáy ${r} cm và chiều cao ${h} cm. Thể tích hình trụ là`, `${V}π cm³`,
          [`${2 * r * h}π cm³`, `${r * h}π cm³`, `${2 * V}π cm³`, `${V + 2 * r * r}π cm³`],
          `V = πr²h = π · ${sup(r, 2)} · ${h} = ${V}π (cm³).`);
      }
      const h = 3 * ri(1, 5), V = (r * r * h) / 3;
      return mk(`Một hình nón có bán kính đáy ${r} cm và chiều cao ${h} cm. Thể tích hình nón là`, `${V}π cm³`,
        [`${r * r * h}π cm³`, `${r * h}π cm³`, `${2 * V}π cm³`, `${V + r}π cm³`],
        `V = ${F(1, 3)}πr²h = ${F(1, 3)} · π · ${sup(r, 2)} · ${h} = ${V}π (cm³).`);
    },
  ],
];

export const BANK: Record<number, Gen[][]> = { 6: L6, 7: L7, 8: L8, 9: L9 };

/** Sinh một vòng chơi: n câu của khối `grade`, mức `level` (1–4). Các dạng được xoay vòng đều. */
export function makeRound(grade: number, level: number, n: number): Question[] {
  const gens = BANK[grade]?.[level - 1];
  if (!gens) return [];
  const order: Gen[] = [];
  while (order.length < n) order.push(...shuffle(gens));
  const used = new Set<string>();
  return order.slice(0, n).map(gen => {
    let q = gen();
    for (let i = 0; i < 6 && used.has(q.q); i++) q = gen();
    used.add(q.q);
    return q;
  });
}
