"""Prepare generated assets; retain full-resolution originals outside publication."""
from pathlib import Path
from PIL import Image
import argparse
import json
import msvcrt
import os
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('kind', choices=['logo', 'landscape'])
parser.add_argument('subject')
parser.add_argument('variant')
parser.add_argument('--edition', type=int, default=1)
args = parser.parse_args()
if args.edition < 1:
    parser.error('Edition must be positive')
root = Path(__file__).resolve().parent.parent
bank_path = root / 'designsystem' / 'illustration-bank.json'
key = f'{args.subject}-{args.variant}'
filename = key if args.edition == 1 else f'{key}-v{args.edition}'
source = Path(args.source)
image = Image.open(source)
original_folder = root / '_kjelder' / ('logoar/vyrdepil' if args.kind == 'logo' else 'bakgrunnar/vyrdepil-scenes')
original_folder.mkdir(parents=True, exist_ok=True)
original_path = original_folder / f'{filename}.png'
if original_path.exists():
    raise FileExistsError(f'Original already exists; use a new edition: {original_path}')
shutil.copyfile(source, original_path)
folder = root / '_resources' / 'vyrdepil-design' / ('logos' if args.kind == 'logo' else 'backgrounds')
folder.mkdir(parents=True, exist_ok=True)
if args.kind == 'logo':
    image = image.convert('RGBA')
    ratio = min(1, 384 / max(image.size))
    display = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    export = folder / f'{filename}.png'
    display.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(export, optimize=True)
else:
    image = image.convert('RGB')
    ratio = min(1, 1920 / max(image.size))
    display = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    export = folder / f'{filename}.jpg'
    for quality in [82, 78, 74, 70, 66]:
        display.save(export, 'JPEG', quality=quality, optimize=True, progressive=True)
        if export.stat().st_size <= 500_000:
            break
    if export.stat().st_size > 500_000:
        raise RuntimeError('Landscape export exceeds 500 kB')
entry = dict(key=key, kind=args.kind, subject=args.subject, variant=args.variant,
             edition=args.edition,
             file=export.relative_to(root).as_posix(), original=original_path.relative_to(root).as_posix(),
             sourceSize=list(image.size), exportSize=list(display.size), bytes=export.stat().st_size)
with (root / '_kjelder' / 'illustration-bank.lock').open('a+b') as lock:
    lock.seek(0)
    if not lock.read(1):
        lock.write(b'0'); lock.flush()
    lock.seek(0)
    msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
    try:
        bank = json.loads(bank_path.read_text(encoding='utf-8'))
        bank['outputs'] = [e for e in bank['outputs'] if e['key'] != key] + [entry]
        temporary = bank_path.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        os.replace(temporary, bank_path)
    finally:
        lock.seek(0)
        msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
print(json.dumps(entry, ensure_ascii=False))
