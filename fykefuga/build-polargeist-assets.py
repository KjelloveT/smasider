"""Build self-hosted PNG flag atlas and optimize original painted assets."""
from io import BytesIO
from pathlib import Path
import argparse
import urllib.request
from PIL import Image, ImageDraw

CODES = 'al ad am at az ba be bg by ch cy cz de dk ee es fi fr gb ge gr hr hu ie is it kz li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sk sm tr ua va xk'.split()
CELL_W, CELL_H, COLUMNS = 120, 76, 8

def flags(output):
    atlas = Image.new('RGBA', (COLUMNS * CELL_W, ((len(CODES) + COLUMNS - 1) // COLUMNS) * CELL_H), (0, 0, 0, 0))
    for index, code in enumerate(CODES):
        with urllib.request.urlopen(f'https://flagcdn.com/w160/{code}.png', timeout=20) as response:
            source = Image.open(BytesIO(response.read())).convert('RGBA')
        source.thumbnail((108, 62), Image.Resampling.LANCZOS)
        x = index % COLUMNS * CELL_W + (CELL_W - source.width) // 2
        y = index // COLUMNS * CELL_H + (CELL_H - source.height) // 2
        atlas.alpha_composite(source, (x, y))
        ImageDraw.Draw(atlas).rectangle((x, y, x + source.width - 1, y + source.height - 1), outline=(20, 40, 32, 220), width=1)
    atlas.save(output / 'europe-flags.png', optimize=True)

def art(path, output):
    image = Image.open(path).convert('RGB')
    image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
    image.save(output / 'polargalleri.jpg', 'JPEG', quality=82, optimize=True, progressive=True)

def ring(path, output):
    image = Image.open(path).convert('RGBA')
    image.thumbnail((192, 192), Image.Resampling.LANCZOS)
    image.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(output / 'jump-ring.png', optimize=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('painting', type=Path)
    parser.add_argument('jump_ring', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    flags(args.output); art(args.painting, args.output); ring(args.jump_ring, args.output)
