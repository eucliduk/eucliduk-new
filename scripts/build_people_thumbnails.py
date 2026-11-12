"""Create small head crops for the Fingertip Galaxy without altering portraits.

Crop values record centre x, centre y and square size as source-width fractions.
The source profile/photo pairings, including the joint profile, stay unchanged.
"""
from pathlib import Path
import json
import re
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'images/humans_of_euclid/thumbnails'
OUTPUT.mkdir(exist_ok=True)
crops = json.loads((ROOT / 'data/fingertip-galaxy/portrait-crops.json').read_text())
source = (ROOT / 'data/site/humans.html').read_text()
for article in re.findall(r'<article class="portrait-card"[\s\S]*?</article>', source):
    path = re.search(r'<img[^>]*src="([^"]+)"', article)[1]
    key = Path(path).stem
    image = ImageOps.exif_transpose(Image.open(ROOT / path)).convert('RGB')
    x, y, fraction = crops[key]
    width, height = image.size
    size = min(width, height, round(width * fraction))
    left = max(0, min(width-size, round(width*x-size/2)))
    top = max(0, min(height-size, round(height*y-size/2)))
    image.crop((left, top, left+size, top+size)).resize((192, 192), Image.Resampling.LANCZOS).save(
        OUTPUT / f'{key}.webp', quality=90, method=6)
print(f'Built {len(crops)} portrait thumbnails.')
