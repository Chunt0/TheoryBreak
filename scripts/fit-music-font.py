# How src/client/fonts was made (needs fonttools + brotli):
#
#   Inter 4.1 (InterVariable.woff2 from github.com/rsms/inter), subset:
#     python3 -m fontTools.subset InterVariable.woff2 --flavor=woff2 --output-file=src/client/fonts/inter.woff2 \
#       --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2190-2199,U+21B5,U+2212,U+2215,U+2318,U+232B,U+2423,U+25B6,U+2713,U+2717,U+20AC,U+2122" \
#       --layout-features="kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case,ss01,cv11,zero"
#
#   Noto Music (@fontsource/noto-music, noto-music-music-400-normal.woff2), through this script:
#     python3 scripts/fit-music-font.py noto-music-music-400-normal.woff2 src/client/fonts/music.woff2
#
# Noto Music draws accidentals for a staff (a sharp hangs well below the baseline).
# This re-fits them, and the note signs, for running text: sitting on the
# baseline at about cap height, with Inter's line metrics.
import sys
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen

src, out = sys.argv[1], sys.argv[2]
f = TTFont(src)
opts = subset.Options(); opts.flavor = None; opts.layout_features = []; opts.notdef_outline = True
sub = subset.Subsetter(opts); sub.populate(unicodes=[0x2669,0x266A,0x266B,0x266C,0x266D,0x266E,0x266F,0x1D12A,0x1D12B]); sub.subset(f)
upm = f['head'].unitsPerEm
cmap = f.getBestCmap(); gs = f.getGlyphSet(); glyf = f['glyf']; hmtx = f['hmtx']
# codepoint: (target bottom, target height) in em
TARGET = {0x266D: (-0.01, 0.75), 0x266F: (-0.02, 0.76), 0x266E: (-0.02, 0.76), 0x1D12B: (-0.01, 0.75),
          0x1D12A: (0.08, 0.40), 0x2669: (-0.04, 0.80), 0x266A: (-0.04, 0.80), 0x266B: (-0.04, 0.80), 0x266C: (-0.04, 0.80)}
LSB, RSB = 0.03, 0.05
for cp, (bottom, height) in TARGET.items():
    name = cmap[cp]
    bp = BoundsPen(gs); gs[name].draw(bp); x0, y0, x1, y1 = bp.bounds
    s = height * upm / (y1 - y0)
    dx = LSB * upm - x0 * s
    dy = bottom * upm - y0 * s
    pen = TTGlyphPen(gs)
    gs[name].draw(TransformPen(pen, (s, 0, 0, s, dx, dy)))
    glyf[name] = pen.glyph()
    adv = round((x1 - x0) * s + (LSB + RSB) * upm)
    hmtx[name] = (adv, round(LSB * upm))
# line metrics = Inter's (ascender 1984/2048, descender -494/2048), so the fallback never changes line heights
asc, desc = round(1984 / 2048 * upm), round(-494 / 2048 * upm)
f['hhea'].ascent, f['hhea'].descent, f['hhea'].lineGap = asc, desc, 0
os2 = f['OS/2']
os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = asc, desc, 0
os2.usWinAscent, os2.usWinDescent = asc, -desc
f['head'].yMax, f['head'].yMin = asc, desc
f.flavor = 'woff2'
f.save(out)
f2 = TTFont(out); g2 = f2.getGlyphSet(); c2 = f2.getBestCmap()
for cp in TARGET:
    bp = BoundsPen(g2); g2[c2[cp]].draw(bp); print(hex(cp), chr(cp), [round(v / upm, 3) for v in bp.bounds], 'adv', round(g2[c2[cp]].width / upm, 3))
