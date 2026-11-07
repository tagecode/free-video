"""按标题栏左上角的品牌标，生成三平台应用图标。

标题栏是 22px 圆角方块、6px 圆角、左上 #ff8a5b 到右下 #d92d3c、白色实心播放三角。
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZE = 1024
BRAND_FROM = (255, 138, 91, 255)  # #ff8a5b
BRAND_TO = (217, 45, 60, 255)  # #d92d3c
# 与 TitleBar 的 rounded-[6px] / size-[22px] 一致
RADIUS = round(SIZE * 6 / 22)

LINUX_SIZES = (16, 24, 32, 48, 64, 128, 256, 512, 1024)
ICO_SIZES = (16, 24, 32, 48, 64, 128, 256)
ICONSET_SIZES = {
    "icon_16x16.png": 16,
    "icon_16x16@2x.png": 32,
    "icon_32x32.png": 32,
    "icon_32x32@2x.png": 64,
    "icon_128x128.png": 128,
    "icon_128x128@2x.png": 256,
    "icon_256x256.png": 256,
    "icon_256x256@2x.png": 512,
    "icon_512x512.png": 512,
    "icon_512x512@2x.png": 1024,
}


def play_triangle(size: int) -> list[tuple[float, float]]:
    """lucide Play 的 polygon（24 视口里的 6,3 20,12 6,21），按标题栏 12/22 的比例居中。"""
    box = size * 12 / 22
    origin = (size - box) / 2
    scale = box / 24
    points = ((6, 3), (20, 12), (6, 21))
    return [(origin + x * scale, origin + y * scale) for x, y in points]


def render(size: int = SIZE) -> Image.Image:
    gradient = Image.new("RGBA", (size, size))
    pixels = gradient.load()
    span = (size - 1) * 2
    for y in range(size):
        for x in range(size):
            t = (x + y) / span
            pixels[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(BRAND_FROM, BRAND_TO))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * 6 / 22), fill=255)

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    image.paste(gradient, mask=mask)
    ImageDraw.Draw(image).polygon(play_triangle(size), fill=(255, 255, 255, 255))
    return image


def resize(master: Image.Image, size: int) -> Image.Image:
    return master.resize((size, size), Image.Resampling.LANCZOS)


def write_svg(path: Path) -> None:
    points = " ".join(f"{x:.2f},{y:.2f}" for x, y in play_triangle(SIZE))
    path.write_text(
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff8a5b"/>
      <stop offset="1" stop-color="#d92d3c"/>
    </linearGradient>
  </defs>
  <rect width="{SIZE}" height="{SIZE}" rx="{RADIUS}" fill="url(#brand)"/>
  <polygon points="{points}" fill="#ffffff"/>
</svg>
""",
        encoding="utf-8",
    )


def main() -> None:
    master = render()
    build = ROOT / "build"
    icons = build / "icons"
    icons.mkdir(parents=True, exist_ok=True)

    master.save(build / "icon.png")
    master.save(ROOT / "resources" / "icon.png")
    write_svg(build / "icon.svg")

    for size in LINUX_SIZES:
        resize(master, size).save(icons / f"{size}x{size}.png")

    master.save(build / "icon.ico", format="ICO", sizes=[(size, size) for size in ICO_SIZES])

    iconset = build / "icon.iconset"
    if iconset.exists():
        shutil.rmtree(iconset)
    iconset.mkdir()
    for name, size in ICONSET_SIZES.items():
        resize(master, size).save(iconset / name)
    subprocess.run(["iconutil", "-c", "icns", str(iconset), "-o", str(build / "icon.icns")], check=True)
    shutil.rmtree(iconset)


if __name__ == "__main__":
    main()
