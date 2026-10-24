"""Create un-cropped, EXIF-oriented web copies; preserve originals locally."""
import json, shutil, argparse
from pathlib import Path
from PIL import Image, ImageOps, ImageFile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--force', action='store_true', help='Regenerate existing web derivatives from preserved originals')
args = parser.parse_args()
inventory = json.loads((ROOT / 'content/source-inventory.json').read_text(encoding='utf-8'))
assets = ROOT / 'docs/assets/art'
assets.mkdir(parents=True, exist_ok=True)
for item in inventory:
    original = ROOT / 'source-media' / item['transfer'] / item['relative']
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(item['path'], original)
    ImageFile.LOAD_TRUNCATED_IMAGES = bool(item.get('warning'))
    with Image.open(original) as source:
        im = ImageOps.exif_transpose(source)
        if im.mode in ('RGBA', 'LA') or 'transparency' in im.info:
            rgba = im.convert('RGBA')
            im = Image.new('RGB', rgba.size, 'white')
            im.paste(rgba, mask=rgba.getchannel('A'))
        else:
            im = im.convert('RGB')
        for suffix, size, quality in [('thumb', 640, 83), ('large', 2000, 90)]:
            destination = assets / f'{item["id"]:03}-{suffix}.webp'
            if destination.exists() and not args.force:
                continue
            resized = im.copy()
            resized.thumbnail((size, size), Image.Resampling.LANCZOS)
            resized.save(destination, 'WEBP', quality=quality, method=5)
print(f'Prepared {len(inventory)} images; originals preserved in source-media/')
print(f'Web images: {sum(f.stat().st_size for f in assets.glob("*.webp"))/1024/1024:.1f} MiB')
