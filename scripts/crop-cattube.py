from pathlib import Path

from PIL import Image

src = Path(
    r"C:\Users\Astralite Heart\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7e402a4b0442961aad8d6d9028812264\images"
    r"\ChatGPT Image Sep 21, 2026, 02_14_15 AM-a80bb008-fe6f-44f9-b77f-3d3ece01a61f.jpg"
)
out = Path(r"c:\Users\Astralite Heart\bbg\public\cattube")
thumbs = out / "thumbnails"
avatars = out / "avatars"
thumbs.mkdir(parents=True, exist_ok=True)
avatars.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert("RGB")

# Detected from gutter analysis of the 1024x768 mockup.
xs = [(182, 386), (394, 592), (600, 801), (809, 1010)]
ys = [(156, 272), (350, 464), (544, 664)]
avatar_ys = [(278, 304), (470, 496), (670, 696)]

ids = [
    "tiny-paws",
    "cool-cats",
    "gravity",
    "defy-gravity",
    "sleepy",
    "chef-meow",
    "gamer-cat",
    "reaction",
    "cardboard-box",
    "kittens-play",
    "happier-world",
    "peaceful-morning",
]

for i, video_id in enumerate(ids):
    row, col = divmod(i, 4)
    x0, x1 = xs[col]
    y0, y1 = ys[row]
    thumb = im.crop((x0, y0, x1, y1)).resize((640, 360), Image.Resampling.LANCZOS)
    thumb.save(thumbs / f"{video_id}.jpg", quality=92)

    ay0, ay1 = avatar_ys[row]
    ax0 = x0 + 2
    ax1 = x0 + 28
    avatar = im.crop((ax0, ay0, ax1, ay1)).resize((96, 96), Image.Resampling.LANCZOS)
    avatar.save(avatars / f"{video_id}.jpg", quality=92)

user = im.crop((978, 70, 1014, 106)).resize((96, 96), Image.Resampling.LANCZOS)
user.save(avatars / "user.jpg", quality=92)

print("wrote", len(ids), "thumbnails and avatars to", out)
