#!/usr/bin/env python3
"""Builds the loupe look's images from the project pictures already in public/ (run from the repo root):

  public/loupe/atlas.webp     the hero's wall of work, 16 pictures in a 4 by 4 grid of 16:10 cells
  public/loupe/atlas-sm.webp  the same at phone size

Every picture is a screenshot or drawing that's already on the site. The AI teammate's is the unnamed one."""
from PIL import Image, ImageOps

CELLS = [
    'block/teammate.jpg', 'cobalt/dervo-home.jpg', 'block/psyche.jpg', 'cobalt/receipts.jpg',
    'projects/trace/card.jpg', 'projects/easeprint/card.jpg', 'projects/dryline/card.jpg', 'projects/comehome/card.jpg',
    'projects/arro/story.jpg', 'cobalt/tastepack.jpg', 'projects/psyche/coast.jpg', 'projects/easeprint/prints.jpg',
    'cobalt/dervo-thread.jpg', 'projects/comehome/phones.jpg', 'projects/trace/fixes.jpg', 'projects/dryline/today.jpg',
]

def build(cw, ch, out, quality):
    sheet = Image.new('RGB', (cw * 4, ch * 4), (20, 20, 20))
    for i, f in enumerate(CELLS):
        im = Image.open('public/' + f).convert('RGB')
        im = ImageOps.fit(im, (cw, ch), Image.LANCZOS, centering=(0.5, 0.0 if 'prints' not in f else 0.5))
        sheet.paste(im, ((i % 4) * cw, (i // 4) * ch))
    sheet.save(out, quality=quality, method=6)

build(640, 400, 'public/loupe/atlas.webp', 72)
build(352, 220, 'public/loupe/atlas-sm.webp', 70)
