#!/usr/bin/env python3
"""Gợi ý thông số nhân vật từ ảnh tham chiếu (bảng màu chủ đạo bằng k-means).
    python3 from_image.py anh.png [--box x0,y0,x1,y1]
Claude cần XEM ảnh để chọn kiểu tóc/kính/váy; script này chỉ đo màu chính xác để giữ nhất quán."""
import sys, json
from PIL import Image
import numpy as np
im = Image.open(sys.argv[1]).convert("RGB")
if "--box" in sys.argv:
    im = im.crop(tuple(int(v) for v in sys.argv[sys.argv.index("--box") + 1].split(",")))
a = np.asarray(im.resize((160, 160))).reshape(-1, 3).astype(float)
a = a[(a.sum(1) < 720) & (a.sum(1) > 30)]  # bỏ nền trắng tinh / đen tuyền
k = 6
rng = np.random.default_rng(0)
c = a[rng.choice(len(a), k, replace=False)]
for _ in range(20):
    lab = ((a[:, None] - c[None]) ** 2).sum(2).argmin(1)
    c = np.array([a[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
cnt = np.bincount(lab, minlength=k)
order = cnt.argsort()[::-1]
hexes = ["#%02x%02x%02x" % tuple(int(v) for v in c[i]) for i in order]
sat = [float(np.ptp(c[i])) for i in order]
shirt = next((h for h, s in zip(hexes, sat) if s > 40), hexes[0])
dark = min(hexes, key=lambda h: sum(int(h[i:i+2], 16) for i in (1, 3, 5)))
print(json.dumps({"palette": hexes, "goi_y_spec": {"shirt": shirt, "limbs": dark, "hair_color": dark}}, ensure_ascii=False, indent=1))
