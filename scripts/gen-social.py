#!/usr/bin/env python3
"""Generate the L8EntSpace social graphics set (PNG, exact platform sizes).

Uses the real SVG logos (l8entspace-logo.svg and l8entspace-primary.svg)
rendered to base64 PNGs and embedded as <image> elements in every composite.
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

# ── Render actual SVG logos to base64 PNGs for embedding ─────────────────────

def svg_to_b64(svg_path, width, height):
    with open(svg_path, 'rb') as f:
        svg_bytes = f.read()
    png_bytes = cairosvg.svg2png(bytestring=svg_bytes, output_width=width, output_height=height)
    return base64.b64encode(png_bytes).decode('ascii')

LOGO_PATH    = os.path.join(PUBLIC, 'l8entspace-logo.svg')
PRIMARY_PATH = os.path.join(PUBLIC, 'l8entspace-primary.svg')

print("Rendering logo sprites…")
LOGO_200  = svg_to_b64(LOGO_PATH,    200, 200)
LOGO_400  = svg_to_b64(LOGO_PATH,    400, 400)
# Each PRIM sprite is rendered 10% wider than its nominal width so the .COM
# text (which sits at the right edge of the SVG viewBox) is never clipped.
# The display width in img() matches the ACTUAL pixel width so nothing is scaled.
PRIM_280  = svg_to_b64(PRIMARY_PATH, 308, 220)   # nominal 280
PRIM_420  = svg_to_b64(PRIMARY_PATH, 462, 330)   # nominal 420
PRIM_560  = svg_to_b64(PRIMARY_PATH, 616, 440)   # nominal 560
PRIM_700  = svg_to_b64(PRIMARY_PATH, 770, 550)   # nominal 700
PRIM_900  = svg_to_b64(PRIMARY_PATH, 990, 707)   # nominal 900
PRIM_1000 = svg_to_b64(PRIMARY_PATH, 1100, 786)  # nominal 1000
print("  done.")

def img(b64, x, y, w, h, opacity=1.0):
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

def ai_node(cx, cy, R):
    import math
    spokes = ''
    for a in range(0, 360, 30):
        rad = math.radians(a)
        x1 = cx + R*math.cos(rad);  y1 = cy + R*math.sin(rad)
        x2 = cx + R*2.1*math.cos(rad); y2 = cy + R*2.1*math.sin(rad)
        spokes += f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{PINK}" stroke-width="1.5" opacity="0.35"/>'
        spokes += f'<circle cx="{x2:.0f}" cy="{y2:.0f}" r="4" fill="{PINK}" opacity="0.6"/>'
    return (f'{spokes}'
            f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#pinkgrad)" filter="url(#glow)"/>'
            f'<text x="{cx}" y="{cy-2}" text-anchor="middle" font-family="{HEAD}" font-size="{int(R*0.5)}" font-weight="bold" fill="#fff">AI</text>'
            f'<text x="{cx}" y="{cy+int(R*0.44)}" text-anchor="middle" font-family="{MONO}" font-size="{int(R*0.2)}" fill="#fff" letter-spacing="2">ENGINE</text>')

# ── Assets ────────────────────────────────────────────────────────────────────

print("\nRendering social assets…")

# 1. Profile picture — real logo fills the square, circle-crop safe
render('profile-circle-400.png', 400, 400,
    grid(400, 400, 0.05)
    + f'<circle cx="200" cy="200" r="194" fill="none" stroke="{PINK}" stroke-width="2.5" opacity="0.38"/>'
    + img(LOGO_400, 0, 0, 400, 400))

# 2. LinkedIn personal banner 1584×396
#    Logo mark left, headline centre, primary lockup bottom-right (small, safe margins)
#    PRIM_280 actual render = 308×220; display at 308×220 so .COM is never clipped.
render('linkedin-personal-1584x396.png', 1584, 396,
    grid(1584, 396, 0.05)
    + img(LOGO_400, 30, -2, 400, 400)
    + f'<text x="476" y="118" font-family="{HEAD}" font-size="52" font-weight="bold" fill="#fff">MASTER BRAND VISIBILITY</text>'
    + f'<text x="476" y="176" font-family="{HEAD}" font-size="52" font-weight="bold" fill="#fff">IN THE ERA OF <tspan fill="{PINK}">AI SEARCH</tspan></text>'
    + f'<text x="478" y="230" font-family="{HEAD}" font-size="23" fill="#b0b0ba">Get cited by ChatGPT, Gemini, Claude, Perplexity, Grok &amp; more.</text>'
    + f'<text x="478" y="272" font-family="{MONO}" font-size="21" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>'
    + img(PRIM_280, 1256, 90, 308, 220, opacity=0.82))

# 3. LinkedIn company banner 1128×191
#    Primary lockup on the left; text (no duplicate brand name) safely inset from right edge.
#    PRIM_420 actual render = 462×330; positioned so logo bleeds top & bottom.
render('linkedin-company-1128x191.png', 1128, 191,
    grid(1128, 191, 0.05)
    + img(PRIM_420, -18, -70, 462, 330)
    + f'<text x="466" y="70" font-family="{HEAD}" font-size="32" font-weight="bold" fill="#cfcfd6">GENERATIVE ENGINE OPTIMIZATION</text>'
    + f'<text x="466" y="112" font-family="{HEAD}" font-size="32" font-weight="bold" fill="{PINK}">MEASURE · TEST · LIFT YOUR AI VISIBILITY</text>'
    + f'<text x="466" y="152" font-family="{MONO}" font-size="16" fill="#7a7a85" letter-spacing="1">Is your brand cited by AI? We track your share of voice.</text>')

# 4. X / Twitter header 1500×500
#    PRIM_700 actual render = 770×550; display at full rendered size so .COM is fully visible.
#    x=-50 so logo left-bleed keeps .COM visible (right edge at x 720, safely left of text at 790).
render('x-header-1500x500.png', 1500, 500,
    grid(1500, 500, 0.05)
    + img(PRIM_700, -50, -25, 770, 550)
    + f'<text x="790" y="148" font-family="{HEAD}" font-size="64" font-weight="bold" fill="#fff">THE NEW ERA OF</text>'
    + f'<text x="790" y="222" font-family="{HEAD}" font-size="64" font-weight="bold" fill="#fff">SEARCH IS HERE.</text>'
    + f'<text x="790" y="308" font-family="{HEAD}" font-size="64" font-weight="bold" fill="{PINK}">GEO IS YOUR</text>'
    + f'<text x="790" y="384" font-family="{HEAD}" font-size="64" font-weight="bold" fill="{PINK}">SURVIVAL.</text>'
    + f'<text x="792" y="450" font-family="{MONO}" font-size="21" fill="#8a8a93" letter-spacing="2">l8entspace.com</text>')

# 5. Instagram portrait 1080×1350 (4:5)
#    PRIM_900 actual render = 990×707; display at full rendered size.
#    x=45 so right edge at 1035 (safe — 45px from right canvas edge).
render('instagram-portrait-1080x1350.png', 1080, 1350,
    grid(1080, 1350, 0.045)
    + radar_rings(540, 380, 280)
    + img(PRIM_900, 45, 90, 990, 707)
    + f'<text x="540" y="950" text-anchor="middle" font-family="{HEAD}" font-size="74" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1034" text-anchor="middle" font-family="{HEAD}" font-size="74" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1104" text-anchor="middle" font-family="{HEAD}" font-size="27" fill="#b0b0ba">Is your brand cited by Gemini, ChatGPT, Claude</text>'
    + f'<text x="540" y="1140" text-anchor="middle" font-family="{HEAD}" font-size="27" fill="#b0b0ba">&amp; Perplexity? L8EntSpace tracks your visibility.</text>'
    + f'<text x="540" y="1250" text-anchor="middle" font-family="{MONO}" font-size="24" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 6. Instagram square 1080×1080
render('instagram-square-1080x1080.png', 1080, 1080,
    grid(1080, 1080, 0.045)
    + radar_rings(540, 340, 245)
    + img(LOGO_400, 340, 130, 400, 400)
    + f'<text x="540" y="800" text-anchor="middle" font-family="{HEAD}" font-size="70" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="540" y="866" text-anchor="middle" font-family="{HEAD}" font-size="30" fill="#b0b0ba">Generative Engine Optimization</text>'
    + f'<text x="540" y="970" text-anchor="middle" font-family="{MONO}" font-size="26" fill="{PINK}" letter-spacing="3">www.l8entspace.com</text>')

# 7. Reddit banner 1920×384
#    Primary lockup left, headline centre, L8 logo mark right.
#    PRIM_560 actual render = 616×440; display at full rendered size.
render('reddit-banner-1920x384.png', 1920, 384,
    grid(1920, 384, 0.05)
    + img(PRIM_560, 16, -28, 616, 440)
    + f'<text x="660" y="140" font-family="{HEAD}" font-size="50" font-weight="bold" fill="#fff">MASTER YOUR AI SHARE OF VOICE</text>'
    + f'<text x="662" y="200" font-family="{HEAD}" font-size="28" fill="#cfcfd6">Brand visibility in the era of generative search — <tspan fill="{PINK}">GEO</tspan></text>'
    + f'<text x="662" y="254" font-family="{MONO}" font-size="21" fill="#7a7a85" letter-spacing="1">l8entspace.com</text>'
    + img(LOGO_400, 1530, -8, 400, 400, opacity=0.75))

# 8. TikTok vertical 1080×1920
#    PRIM_1000 actual render = 1100×786; display at full rendered size.
#    x=-10 so right edge at 1090 (10px bleed) — keeps .COM fully visible.
render('tiktok-cover-1080x1920.png', 1080, 1920,
    grid(1080, 1920, 0.045)
    + radar_rings(540, 600, 330)
    + img(PRIM_1000, -10, 250, 1100, 786)
    + f'<text x="540" y="1278" text-anchor="middle" font-family="{HEAD}" font-size="82" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1370" text-anchor="middle" font-family="{HEAD}" font-size="82" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1444" text-anchor="middle" font-family="{HEAD}" font-size="31" fill="#b0b0ba">Is your brand cited by AI engines?</text>'
    + f'<text x="540" y="1600" text-anchor="middle" font-family="{MONO}" font-size="30" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 9. Facebook cover 820×312
#    PRIM_560 actual render = 616×440; display at full rendered size.
render('facebook-cover-820x312.png', 820, 312,
    grid(820, 312, 0.05)
    + img(PRIM_560, -60, -64, 616, 440)
    + f'<text x="540" y="112" font-family="{HEAD}" font-size="42" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="542" y="162" font-family="{HEAD}" font-size="23" fill="#cfcfd6">Generative Engine Optimization</text>'
    + f'<text x="542" y="222" font-family="{MONO}" font-size="20" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>')

print(f'\nAll assets saved to: {os.path.realpath(OUT)}')
