from pathlib import Path

from PIL import Image

src = Path(
    r"C:\Users\Astralite Heart\AppData\Roaming\Cursor\User\workspaceStorage"
    r"\7e402a4b0442961aad8d6d9028812264\images"
    r"\ChatGPT Image Sep 21, 2026, 02_34_30 AM-5d238a60-6522-4f75-8175-3439487c193e.jpg"
)
out = Path(r"c:\Users\Astralite Heart\bbg\public\cattube")
(out / "posters").mkdir(parents=True, exist_ok=True)
(out / "comments").mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert("RGB")

player = im.crop((15, 104, 646, 378)).resize((1280, 720), Image.Resampling.LANCZOS)
player.save(out / "posters" / "tiny-paws.jpg", quality=92)

# Comment avatars in the left column of the comments block.
# Approximate from layout: comments start ~y 592
for name, box in {
    "whisker-wonder": (18, 628, 42, 652),
    "purrfectly-happy": (18, 668, 42, 692),
    "cat-dad-life": (18, 708, 42, 732),
    "commenter-self": (18, 592, 42, 616),
}.items():
    im.crop(box).resize((96, 96), Image.Resampling.LANCZOS).save(
        out / "comments" / f"{name}.jpg", quality=92
    )

print("wrote player and comment avatars")
