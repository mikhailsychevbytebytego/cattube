from pathlib import Path

import numpy as np
from PIL import Image

src = Path(
    r"C:\Users\Astralite Heart\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7e402a4b0442961aad8d6d9028812264\images"
    r"\ChatGPT Image Sep 21, 2026, 02_34_30 AM-5d238a60-6522-4f75-8175-3439487c193e.jpg"
)
im = Image.open(src).convert("RGB")
arr = np.array(im)
h, w = arr.shape[:2]
print("size", w, h)

# Probe row std in the player/content band
content = arr[:, 20:700]
row_std = content.reshape(content.shape[0], content.shape[1], 3).std(axis=(1, 2))
for y in range(0, h, 8):
    print(y, round(float(row_std[y]), 1))

print("--- col std y110-280 ---")
band = arr[110:280]
col_std = band.reshape(band.shape[0], band.shape[1], 3).std(axis=(0, 2))
gap = (col_std < 10).tolist()
start = None
runs = []
for i, v in enumerate(gap):
    if v and start is None:
        start = i
    elif not v and start is not None:
        runs.append((start, i - 1, i - start))
        start = None
if start is not None:
    runs.append((start, len(gap) - 1, len(gap) - start))
print([(a, b, c) for a, b, c in runs if c > 4])
