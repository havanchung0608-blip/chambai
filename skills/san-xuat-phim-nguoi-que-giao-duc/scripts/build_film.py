#!/usr/bin/env python3
"""Ghép kịch bản phim (film.js) + engine + giao diện thành MỘT file HTML chạy ngay.

Cách dùng:
    python3 build_film.py <phim.film.js> <dau-ra.html>

phim.film.js chứa:  window.FILM = { title: ..., cast: {...}, scenes: [...] };
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent


def build(film_path: str, out_path: str) -> str:
    film = pathlib.Path(film_path).read_text(encoding="utf-8")
    if "window.FILM" not in film:
        sys.exit("Lỗi: file kịch bản phải gán  window.FILM = { ... };")
    engine = (HERE / "engine.js").read_text(encoding="utf-8")
    tpl = (HERE / "template.html").read_text(encoding="utf-8")
    m = re.search(r"title\s*:\s*([\"'`])(.*?)\1", film)
    title = m.group(2) if m else "Phim người que"
    ms = re.search(r"size\s*:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]", film)
    mg = re.search(r"ground\s*:\s*(\d+)", film)
    pre = (f"window.__FILMSIZE = [{ms.group(1)}, {ms.group(2)}];" if ms else "") + (f"window.__FILMGROUND = {mg.group(1)};" if mg and ms else "")
    html = (tpl.replace("/*__ENGINE__*/", pre + "\n" + engine)
               .replace("/*__FILM__*/", film)
               .replace("__TITLE__", title.replace("<", "&lt;")))
    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    return str(out)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    print("Đã tạo:", build(sys.argv[1], sys.argv[2]))
