#!/usr/bin/env python3
"""Pictures of every catalogue plaque's own sample proof PDF (owner msg 8100, 31 Oct 2026).

Run from the repository root after the PDFs in public/samples/products/ are redrawn (then bump the ?v= in
samplePdfFor, components/CatalogueDetails.tsx, which both the PDF link and these pictures carry):
    python3 scripts/make-sample-proof-thumbs.py [SLUG ...]
Needs pdftoppm (poppler-utils) and Pillow. Writes public/site-images/proof/products/<slug>-<page>.webp, 760 px wide,
for page 1 (the cover) and page 2 (the measured drawing): the product page shows them stacked above its PDF link.
"""
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

PDFS = Path('public/samples/products')
OUT = Path('public/site-images/proof/products')
WIDTH = 760


def render(pdf: Path, workdir: Path):
    for page in (1, 2):
        base = workdir / f'{pdf.stem}-{page}'
        subprocess.run(['pdftoppm', '-f', str(page), '-l', str(page), '-singlefile', '-png', '-scale-to-x', str(WIDTH),
                        '-scale-to-y', '-1', '-aa', 'yes', '-aaVector', 'yes', str(pdf), str(base)], check=True)
        image = Image.open(f'{base}.png').convert('RGB')
        target = OUT / f'{pdf.stem}-{page}.webp'
        image.save(target, 'WEBP', quality=80, method=6)
        yield target, image.size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    slugs = sys.argv[1:]
    pdfs = [PDFS / f'{slug}.pdf' for slug in slugs] if slugs else sorted(PDFS.glob('*.pdf'))
    total = 0
    with tempfile.TemporaryDirectory() as tmp:
        for pdf in pdfs:
            for target, size in render(pdf, Path(tmp)):
                total += target.stat().st_size
                if size[0] != WIDTH:
                    raise SystemExit(f'{target}: unexpected width {size}')
    print(f'{len(pdfs)} PDFs, {2 * len(pdfs)} pictures, {total / 1048576:.1f} MB in {OUT}')


if __name__ == '__main__':
    main()
