from pathlib import Path

from PIL import Image, ImageChops


ROOT = Path("assets/logos")
FILES = [
    "shoreline-contact-info.png",
    "shoreline-logo-horizontal.png",
    "shoreline-logo-wordmark.png",
    "shoreline-logo-hero.png",
]


def crop_logo(path: Path) -> None:
    image = Image.open(path).convert("RGB")
    white = Image.new("RGB", image.size, (255, 255, 255))
    diff = ImageChops.difference(image, white)
    bbox = diff.point(lambda pixel: 255 if pixel > 12 else 0).getbbox()
    if not bbox:
        print(f"{path.name}: no crop")
        return

    pad = 36
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(image.width, bbox[2] + pad)
    bottom = min(image.height, bbox[3] + pad)
    cropped = image.crop((left, top, right, bottom))
    cropped.save(path, optimize=True)
    print(f"{path.name}: {image.size} -> {cropped.size}")


for filename in FILES:
    crop_logo(ROOT / filename)
