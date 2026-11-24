#!/usr/bin/env python3
"""Kiểm tra phim HTML: lỗi console, lỗi kịch bản, chữ tràn bảng, lời đọc còn kí hiệu,
và chụp ảnh xem trước (mỗi cảnh một khung) ghép thành 1 ảnh tổng.

    python3 check_film.py <phim.html> [thu-muc-anh]

Thoát mã 1 nếu có LỖI (ERROR); CẢNH BÁO (WARN) thì vẫn thoát 0 nhưng nên sửa.
"""
import base64
import io
import pathlib
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _browser import launch  # noqa: E402

LINT_JS = r"""
() => {
  const F = window.FILM, SF = STICKFILM, out = [];
  const E = (m) => out.push(["ERROR", m]), Wn = (m) => out.push(["WARN", m]);
  if (!F || !Array.isArray(F.scenes) || !F.scenes.length) { E("FILM.scenes rỗng"); return out; }
  const cast = F.cast || {};
  F.scenes.forEach((sc, si) => {
    const tag = `Cảnh ${si + 1}`;
    if (sc.bg && !SF.BG[sc.bg]) E(`${tag}: phông nền "${sc.bg}" không có. Dùng: ${Object.keys(SF.BG).join(", ")}`);
    const here = new Set(Object.keys(sc.cast || {}));
    Object.entries(sc.cast || {}).forEach(([id, c]) => { if (c.pose && !SF.POSES[c.pose]) E(`${tag}: tư thế "${c.pose}" của ${id} không có`); if (c.x == null) Wn(`${tag}: ${id} chưa có toạ độ x`); });
    (sc.items || []).forEach((it) => { if (it.type && !SF.PROPS[it.type]) E(`${tag}: đạo cụ "${it.type}" không có`); });
    (sc.beats || []).forEach((b, bi) => {
      const bt = `${tag} nhịp ${bi + 1}`;
      if (b.who && b.who !== "narrator" && !here.has(b.who)) E(`${bt}: "${b.who}" không đứng trong cảnh (thêm vào cast của cảnh)`);
      if (b.who && b.who !== "narrator" && !cast[b.who]) Wn(`${bt}: "${b.who}" chưa khai báo trong FILM.cast`);
      if (b.pose && !SF.POSES[b.pose]) E(`${bt}: tư thế "${b.pose}" không có. Dùng: ${Object.keys(SF.POSES).join(", ")}`);
      Object.entries(b.act || {}).forEach(([id, a]) => { if (!here.has(id)) E(`${bt}: act cho "${id}" không có trong cảnh`); if (a.pose && !SF.POSES[a.pose]) E(`${bt}: tư thế "${a.pose}" không có`); });
      [].concat(b.move || []).forEach((m) => { if (!here.has(m.who)) E(`${bt}: move cho "${m.who}" không có trong cảnh`); });
      [].concat(b.show || []).forEach((it) => { if (it.type && !SF.PROPS[it.type]) E(`${bt}: đạo cụ "${it.type}" không có. Dùng: ${Object.keys(SF.PROPS).join(", ")}`); if (it.x == null || it.y == null) Wn(`${bt}: đạo cụ ${it.id || it.type} thiếu x/y`); });
      if (b.say) {
        if (/[\\^_{}√≤≥≠∠⇒×÷=<>%]/.test(b.say)) Wn(`${bt}: lời đọc còn kí hiệu → viết thành chữ: "${b.say.slice(0, 60)}"`);
        if (/\d+\s*\/\s*\d+/.test(b.say)) Wn(`${bt}: lời đọc có phân số dạng a/b → đọc "a phần b"`);
        const words = b.say.trim().split(/\s+/).length; if (words > 45) Wn(`${bt}: lời đọc dài ${words} chữ — nên tách thành 2 nhịp`);
      }
      if (b.quiz && !(b.quiz.options && b.quiz.options.length)) E(`${bt}: quiz thiếu options`);
      if (b.quiz && (b.quiz.answer == null || b.quiz.answer >= b.quiz.options.length)) E(`${bt}: quiz.answer sai chỉ số (đếm từ 0)`);
    });
  });
  // chữ viết tràn bảng
  SF.comp.scenes.forEach((s, si) => {
    const bd = SF.BOARDS[s.src.bg];
    s.beats.forEach((B, bi) => (B.writes || []).forEach((w) => {
      const m = SF.measure(w.text, w.size); const x0 = w.align === "center" ? w.x - m.w / 2 : w.align === "right" ? w.x - m.w : w.x;
      const R = bd ? bd.x + bd.w - 20 : 1900, Bt = bd ? bd.y + bd.h - 10 : 1060, L = bd ? bd.x + 10 : 20;
      if (x0 + m.w > R || x0 < L) E(`Cảnh ${si + 1} nhịp ${bi + 1}: dòng "${w.text}" tràn ngang (${Math.round(x0)}→${Math.round(x0 + m.w)}, giới hạn ${L}–${R}). Giảm size hoặc tách dòng.`);
      if (w.y + m.desc > Bt) E(`Cảnh ${si + 1} nhịp ${bi + 1}: dòng "${w.text}" tràn xuống dưới bảng (y=${Math.round(w.y)}). Thêm clear:"board" hoặc giảm size.`);
    }));
  });
  return out;
}
"""


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    html = pathlib.Path(sys.argv[1]).resolve()
    outdir = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else html.with_suffix("").as_posix() + "-preview")
    outdir.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as p:
        b = launch(p)
        pg = b.new_page(viewport={"width": 1280, "height": 800})
        pg.on("console", lambda m: m.type == "error" and errors.append("console: " + m.text))
        pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        pg.goto(html.as_uri())
        pg.wait_for_function("window.__READY__ === true", timeout=15000)
        issues = pg.evaluate(LINT_JS)
        info = pg.evaluate("() => STICKFILM.info()")
        # chụp khung hình giữa mỗi cảnh + 1 khung cuối mỗi nhịp có viết bảng
        times = []
        for s in info["scenes"]:
            times.append(s["start"] + (s["end"] - s["start"]) * 0.55)
            times.append(s["end"] - 0.05)
        shots = []
        for i, t in enumerate(times):
            data = pg.evaluate(
                """(t) => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080;
                   STICKFILM.renderAt(c.getContext('2d'), t); return c.toDataURL('image/jpeg', 0.85); }""", t)
            raw = base64.b64decode(data.split(",", 1)[1])
            fp = outdir / f"khung-{i + 1:02d}-{t:06.2f}s.jpg"
            fp.write_bytes(raw)
            shots.append(fp)
        b.close()
    # ảnh tổng
    try:
        from PIL import Image, ImageDraw
        cols, tw, th = 4, 480, 270
        rows = (len(shots) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows * (th + 28)), "white")
        d = ImageDraw.Draw(sheet)
        for i, fp in enumerate(shots):
            im = Image.open(fp).resize((tw, th))
            x, y = (i % cols) * tw, (i // cols) * (th + 28)
            sheet.paste(im, (x, y + 28))
            d.text((x + 6, y + 6), fp.stem, fill="black")
        sheet.save(outdir / "tong-quan.jpg", quality=85)
    except Exception as e:  # noqa: BLE001
        print("Không ghép được ảnh tổng:", e)
    n_err = len(errors) + sum(1 for k, _ in issues if k == "ERROR")
    print(f"Thời lượng: {info['duration']:.1f} giây · {len(info['scenes'])} cảnh · {len(info['says'])} câu thoại")
    for e in errors:
        print("ERROR", e)
    for k, m in issues:
        print(k, m)
    print("Ảnh xem trước:", outdir)
    print("KẾT QUẢ:", "CÓ LỖI" if n_err else "ĐẠT")
    sys.exit(1 if n_err else 0)


if __name__ == "__main__":
    main()
