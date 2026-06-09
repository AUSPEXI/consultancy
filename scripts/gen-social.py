#!/usr/bin/env python3
"""Generate the L8EntSpace social graphics set (PNG, exact platform sizes).

Uses the real SVG logos (l8entspace-logo.svg and l8entspace-primary.svg)
rendered to base64 PNGs and embedded as <image> elements in every composite.

Logo geometry:
  l8entspace-primary.svg  viewBox 0 0 420 300  (aspect 1.4:1, full lockup + .COM)
  l8entspace-logo.svg     viewBox 0 0 256 256  (aspect 1:1, orbit mark only)

All content lives INSIDE the viewBox, so a sprite rendered at the exact aspect
ratio shows the whole logo (including .COM). Every sprite is placed fully within
its canvas with margins — never bled off an edge — so nothing is cropped.
"""
import cairosvg, os, base64

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, 'consultancy-next', 'public')
OUT    = os.path.join(PUBLIC, 'social')
os.makedirs(OUT, exist_ok=True)

PINK = '#ff1493'
DARK = '#0a0a0f'
HEAD = "Liberation Sans"
MONO = "DejaVu Sans Mono"

LOGO_PATH    = os.path.join(PUBLIC, 'l8entspace-logo.svg')
PRIMARY_PATH = os.path.join(PUBLIC, 'l8entspace-primary.svg')

# ── Render SVG logos to base64 PNGs at exact aspect ratios ───────────────────

def _b64(svg_path, width, height, viewbox=None):
    with open(svg_path, 'rb') as f:
        svg = f.read()
    if viewbox:
        svg = svg.replace(b'viewBox="0 0 420 300"', f'viewBox="{viewbox}"'.encode())
    png = cairosvg.svg2png(bytestring=svg, output_width=width, output_height=height)
    return base64.b64encode(png).decode('ascii')

# Primary lockup renders at its native 420:300 viewBox. This REQUIRES the real
# logo fonts (Outfit, JetBrains Mono, Plus Jakarta Sans) to be installed — with
# fallback fonts the wider glyph metrics cause L8/Ent/Space to overlap and .COM
# to clip. Install with:
#   curl -sfL -o /usr/share/fonts/truetype/l8/Outfit.ttf \
#     'https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf'
#   (+ jetbrainsmono + plusjakartasans), then `fc-cache -f`.
def prim(width):
    h = round(width * 300 / 420)
    return (_b64(PRIMARY_PATH, width, h), width, h)

# Square orbit mark.
def logo(side):
    return (_b64(LOGO_PATH, side, side), side, side)

print("Rendering logo sprites…")
LOGO_360 = logo(360)
LOGO_400 = logo(400)
PRIM_250 = prim(250)   # 250x179
PRIM_360 = prim(360)   # 360x257
PRIM_400 = prim(400)   # 400x286
PRIM_500 = prim(500)   # 500x357
PRIM_560 = prim(560)   # 560x400
PRIM_900 = prim(900)   # 900x643
print("  done.")

def img(sprite, x, y, opacity=1.0):
    """Place a (b64, w, h) sprite at its native rendered size — no scaling."""
    b64, w, h = sprite
    op = f' opacity="{opacity}"' if opacity < 1 else ''
    return f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="data:image/png;base64,{b64}"{op}/>'

# ── Shared helpers ────────────────────────────────────────────────────────────

def render(name, w, h, body):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      width="{w}" height="{h}" viewBox="0 0 {w} {h}">
<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%">
    <stop offset="0%" stop-color="#16101a"/>
    <stop offset="55%" stop-color="{DARK}"/>
    <stop offset="100%" stop-color="#050507"/>
  </radialGradient>
  <linearGradient id="pinkgrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ff5cb8"/>
    <stop offset="100%" stop-color="{PINK}"/>
  </linearGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="6" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="18"/>
  </filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/>
{body}
</svg>'''
    path = os.path.join(OUT, name)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=w, output_height=h)
    print(f"  {name}  ({w}x{h})")

def grid(w, h, op=0.055, step=46):
    lines = []
    for x in range(0, w+1, step):
        lines.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="{PINK}" stroke-width="1" opacity="{op}"/>')
    for y in range(0, h+1, step):
        lines.append(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="{PINK}" stroke-width="1" opacity="{op}"/>')
    return ''.join(lines)

def radar_rings(cx, cy, R):
    rings = ''.join(
        f'<circle cx="{cx}" cy="{cy}" r="{int(R*f)}" fill="none" stroke="{PINK}" stroke-width="1.5" opacity="{0.14+0.14*f:.2f}"/>'
        for f in (0.38, 0.60, 0.82, 1.0))
    blips = (
        f'<circle cx="{int(cx+R*0.44)}" cy="{int(cy-R*0.33)}" r="7" fill="#fff" filter="url(#glow)"/>'
        f'<circle cx="{int(cx-R*0.28)}" cy="{int(cy-R*0.54)}" r="6" fill="{PINK}" filter="url(#glow)"/>'
        f'<circle cx="{int(cx+R*0.19)}" cy="{int(cy+R*0.42)}" r="5" fill="#fff" filter="url(#glow)"/>')
    sweep = (f'<path d="M {cx} {cy} L {int(cx+R*0.95)} {int(cy-R*0.62)} A {R} {R} 0 0 1 {int(cx+R)} {cy} Z" '
             f'fill="{PINK}" opacity="0.18" filter="url(#softglow)"/>')
    cross = (f'<line x1="{cx-R}" y1="{cy}" x2="{cx+R}" y2="{cy}" stroke="{PINK}" stroke-width="1" opacity="0.2"/>'
             f'<line x1="{cx}" y1="{cy-R}" x2="{cx}" y2="{cy+R}" stroke="{PINK}" stroke-width="1" opacity="0.2"/>')
    return f'{sweep}{rings}{cross}{blips}'

# ── Assets ────────────────────────────────────────────────────────────────────

print("\nRendering social assets…")

# 1. Profile picture 400×400 — square orbit mark fills the circle-safe square.
render('profile-circle-400.png', 400, 400,
    grid(400, 400, 0.05)
    + f'<circle cx="200" cy="200" r="194" fill="none" stroke="{PINK}" stroke-width="2.5" opacity="0.38"/>'
    + img(LOGO_400, 0, 0))

# 2. LinkedIn personal banner 1584×396 — orbit mark left, headline centre,
#    full primary lockup bottom-right (fully inside, 40px margins).
render('linkedin-personal-1584x396.png', 1584, 396,
    grid(1584, 396, 0.05)
    + img(LOGO_360, 36, 18)
    + f'<text x="440" y="118" font-family="{HEAD}" font-size="50" font-weight="bold" fill="#fff">MASTER BRAND VISIBILITY</text>'
    + f'<text x="440" y="174" font-family="{HEAD}" font-size="50" font-weight="bold" fill="#fff">IN THE ERA OF <tspan fill="{PINK}">AI SEARCH</tspan></text>'
    + f'<text x="442" y="226" font-family="{HEAD}" font-size="22" fill="#b0b0ba">Get cited by ChatGPT, Gemini, Claude, Perplexity, Grok &amp; more.</text>'
    + f'<text x="442" y="268" font-family="{MONO}" font-size="20" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>'
    + img(PRIM_360, 1184, 70, opacity=0.9))

# 3. LinkedIn company banner 1128×191 — short canvas: small primary lockup left
#    (250×179 fits the 191 height), tagline to the right.
render('linkedin-company-1128x191.png', 1128, 191,
    grid(1128, 191, 0.05)
    + img(PRIM_250, 14, 6)
    + f'<text x="294" y="70" font-family="{HEAD}" font-size="30" font-weight="bold" fill="#cfcfd6">GENERATIVE ENGINE OPTIMIZATION</text>'
    + f'<text x="294" y="110" font-family="{HEAD}" font-size="30" font-weight="bold" fill="{PINK}">MEASURE · TEST · LIFT AI VISIBILITY</text>'
    + f'<text x="296" y="150" font-family="{MONO}" font-size="15" fill="#7a7a85" letter-spacing="1">Is your brand cited by AI? We track your share of voice.</text>')

# 4. X / Twitter header 1500×500 — full primary lockup left (560×400, inside),
#    headline right.
render('x-header-1500x500.png', 1500, 500,
    grid(1500, 500, 0.05)
    + img(PRIM_560, 40, 50)
    + f'<text x="660" y="148" font-family="{HEAD}" font-size="60" font-weight="bold" fill="#fff">THE NEW ERA OF</text>'
    + f'<text x="660" y="218" font-family="{HEAD}" font-size="60" font-weight="bold" fill="#fff">SEARCH IS HERE.</text>'
    + f'<text x="660" y="300" font-family="{HEAD}" font-size="60" font-weight="bold" fill="{PINK}">GEO IS YOUR</text>'
    + f'<text x="660" y="370" font-family="{HEAD}" font-size="60" font-weight="bold" fill="{PINK}">SURVIVAL.</text>'
    + f'<text x="662" y="432" font-family="{MONO}" font-size="20" fill="#8a8a93" letter-spacing="2">l8entspace.com</text>')

# 5. Instagram portrait 1080×1350 — full primary lockup hero, centred, inside.
render('instagram-portrait-1080x1350.png', 1080, 1350,
    grid(1080, 1350, 0.045)
    + radar_rings(540, 380, 280)
    + img(PRIM_900, 90, 120)
    + f'<text x="540" y="950" text-anchor="middle" font-family="{HEAD}" font-size="74" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1034" text-anchor="middle" font-family="{HEAD}" font-size="74" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1104" text-anchor="middle" font-family="{HEAD}" font-size="27" fill="#b0b0ba">Is your brand cited by Gemini, ChatGPT, Claude</text>'
    + f'<text x="540" y="1140" text-anchor="middle" font-family="{HEAD}" font-size="27" fill="#b0b0ba">&amp; Perplexity? L8EntSpace tracks your visibility.</text>'
    + f'<text x="540" y="1250" text-anchor="middle" font-family="{MONO}" font-size="24" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 6. Instagram square 1080×1080 — orbit mark hero.
render('instagram-square-1080x1080.png', 1080, 1080,
    grid(1080, 1080, 0.045)
    + radar_rings(540, 340, 245)
    + img(LOGO_400, 340, 140)
    + f'<text x="540" y="800" text-anchor="middle" font-family="{HEAD}" font-size="70" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="540" y="866" text-anchor="middle" font-family="{HEAD}" font-size="30" fill="#b0b0ba">Generative Engine Optimization</text>'
    + f'<text x="540" y="970" text-anchor="middle" font-family="{MONO}" font-size="26" fill="{PINK}" letter-spacing="3">www.l8entspace.com</text>')

# 7. Reddit banner 1920×384 — primary lockup left (500×357 fits 384), headline
#    centre, small orbit mark right (360×360 fits, fully inside).
render('reddit-banner-1920x384.png', 1920, 384,
    grid(1920, 384, 0.05)
    + img(PRIM_500, 20, 14)
    + f'<text x="600" y="140" font-family="{HEAD}" font-size="48" font-weight="bold" fill="#fff">MASTER YOUR AI SHARE OF VOICE</text>'
    + f'<text x="602" y="200" font-family="{HEAD}" font-size="27" fill="#cfcfd6">Brand visibility in the era of generative search — <tspan fill="{PINK}">GEO</tspan></text>'
    + f'<text x="602" y="252" font-family="{MONO}" font-size="20" fill="#7a7a85" letter-spacing="1">l8entspace.com</text>'
    + img(LOGO_360, 1524, 12, opacity=0.8))

# 8. TikTok vertical 1080×1920 — full primary lockup hero, centred, inside.
render('tiktok-cover-1080x1920.png', 1080, 1920,
    grid(1080, 1920, 0.045)
    + radar_rings(540, 600, 330)
    + img(PRIM_900, 90, 300)
    + f'<text x="540" y="1278" text-anchor="middle" font-family="{HEAD}" font-size="82" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1370" text-anchor="middle" font-family="{HEAD}" font-size="82" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1444" text-anchor="middle" font-family="{HEAD}" font-size="31" fill="#b0b0ba">Is your brand cited by AI engines?</text>'
    + f'<text x="540" y="1600" text-anchor="middle" font-family="{MONO}" font-size="30" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 9. Facebook cover 820×312 — primary lockup left (400×286 fits 312), text right.
render('facebook-cover-820x312.png', 820, 312,
    grid(820, 312, 0.05)
    + img(PRIM_400, 16, 13)
    + f'<text x="440" y="118" font-family="{HEAD}" font-size="40" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="442" y="164" font-family="{HEAD}" font-size="22" fill="#cfcfd6">Generative Engine Optimization</text>'
    + f'<text x="442" y="216" font-family="{MONO}" font-size="19" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>')

print(f'\nAll assets saved to: {os.path.realpath(OUT)}')
