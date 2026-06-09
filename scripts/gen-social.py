#!/usr/bin/env python3
"""Generate the L8EntSpace social graphics set (PNG, exact platform sizes).

Brand: electric pink #ff1493 on near-black, latent-space orbit mark + L8 wordmark.
Renders SVG -> PNG via cairosvg so every asset is pixel-exact for its platform.
"""
import cairosvg, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'consultancy-next', 'public', 'social')
os.makedirs(OUT, exist_ok=True)

PINK = '#ff1493'
DARK = '#0a0a0f'
HEAD = "Liberation Sans"   # Helvetica-like, clean headlines
MONO = "DejaVu Sans Mono"

def render(name, w, h, body):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
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
    <feGaussianBlur stdDeviation="7" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="16"/>
  </filter>
</defs>
<rect width="{w}" height="{h}" fill="url(#bg)"/>
{body}
</svg>'''
    path = os.path.join(OUT, name)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=w, output_height=h)
    print('wrote', name, f'{w}x{h}')

def grid(w, h, op=0.06, step=46):
    lines = []
    x = 0
    while x <= w:
        lines.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="{PINK}" stroke-width="1" opacity="{op}"/>')
        x += step
    y = 0
    while y <= h:
        lines.append(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="{PINK}" stroke-width="1" opacity="{op}"/>')
        y += step
    return ''.join(lines)

def orbit_logo(cx, cy, R, l8=None, planets=True):
    """L8 latent-space orbit mark. R = horizontal radius; l8 = L8 font size."""
    if l8 is None:
        l8 = R * 0.95
    ry = R * 0.52
    sw = max(2.5, R * 0.032)
    p1 = f'<circle cx="{cx - R*0.88:.1f}" cy="{cy - R*0.30:.1f}" r="{R*0.045:.1f}" fill="{PINK}"/>' if planets else ''
    p2 = f'<circle cx="{cx + R*0.88:.1f}" cy="{cy + R*0.30:.1f}" r="{R*0.045:.1f}" fill="#ffffff"/>' if planets else ''
    return f'''
  <g filter="url(#glow)">
    <ellipse cx="{cx}" cy="{cy}" rx="{R}" ry="{ry:.1f}" transform="rotate(30 {cx} {cy})" fill="none" stroke="#ffffff" stroke-width="{sw:.1f}" opacity="0.5"/>
    <ellipse cx="{cx}" cy="{cy}" rx="{R}" ry="{ry:.1f}" transform="rotate(-30 {cx} {cy})" fill="none" stroke="{PINK}" stroke-width="{sw+1:.1f}"/>
    {p1}{p2}
  </g>
  <text x="{cx}" y="{cy + l8*0.34:.1f}" text-anchor="middle" font-family="{HEAD}" font-size="{l8:.0f}" font-weight="bold" fill="#ffffff" letter-spacing="-{l8*0.04:.0f}">L8</text>'''

def wordmark(cx, cy, size, com=True):
    comtxt = f'<tspan fill="{PINK}" font-size="{size*0.62:.0f}">.COM</tspan>' if com else ''
    return f'''<text x="{cx}" y="{cy}" text-anchor="middle" font-family="{HEAD}" font-size="{size}" font-weight="bold" letter-spacing="{size*0.04:.0f}"><tspan fill="#ffffff">L8</tspan><tspan fill="{PINK}">ENT</tspan><tspan fill="#ffffff">SPACE</tspan>{comtxt}</text>'''

def radar(cx, cy, R):
    """Sweeping radar motif (Instagram/TikTok hero)."""
    rings = ''.join(
        f'<circle cx="{cx}" cy="{cy}" r="{R*f:.0f}" fill="none" stroke="{PINK}" stroke-width="1.5" opacity="{0.18+0.12*f:.2f}"/>'
        for f in (0.4, 0.65, 0.85, 1.0))
    blips = (
        f'<circle cx="{cx+R*0.45:.0f}" cy="{cy-R*0.35:.0f}" r="7" fill="#fff" filter="url(#glow)"/>'
        f'<circle cx="{cx-R*0.30:.0f}" cy="{cy-R*0.55:.0f}" r="6" fill="{PINK}" filter="url(#glow)"/>'
        f'<circle cx="{cx+R*0.20:.0f}" cy="{cy+R*0.40:.0f}" r="5" fill="#fff" filter="url(#glow)"/>')
    sweep = (f'<path d="M {cx} {cy} L {cx+R*0.95:.0f} {cy-R*0.62:.0f} A {R} {R} 0 0 1 {cx+R:.0f} {cy} Z" '
             f'fill="{PINK}" opacity="0.22" filter="url(#softglow)"/>')
    cross = (f'<line x1="{cx-R}" y1="{cy}" x2="{cx+R}" y2="{cy}" stroke="{PINK}" stroke-width="1" opacity="0.25"/>'
             f'<line x1="{cx}" y1="{cy-R}" x2="{cx}" y2="{cy+R}" stroke="{PINK}" stroke-width="1" opacity="0.25"/>')
    return f'<g>{sweep}{rings}{cross}{blips}</g>' + orbit_logo(cx, cy, R*0.26, planets=False)

def ai_engine(cx, cy, R):
    """Central AI-engine node with radiating circuit lines (X / banners)."""
    spokes = ''
    import math
    for a in range(0, 360, 30):
        rad = math.radians(a)
        x2 = cx + (R*1.9)*math.cos(rad); y2 = cy + (R*1.9)*math.sin(rad)
        spokes += f'<line x1="{cx+R*math.cos(rad):.0f}" y1="{cy+R*math.sin(rad):.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="{PINK}" stroke-width="1.5" opacity="0.4"/>'
        spokes += f'<circle cx="{x2:.0f}" cy="{y2:.0f}" r="4" fill="{PINK}" opacity="0.7"/>'
    return f'''{spokes}
  <circle cx="{cx}" cy="{cy}" r="{R}" fill="url(#pinkgrad)" filter="url(#glow)"/>
  <text x="{cx}" y="{cy-2}" text-anchor="middle" font-family="{HEAD}" font-size="{R*0.5:.0f}" font-weight="bold" fill="#fff">AI</text>
  <text x="{cx}" y="{cy+R*0.42:.0f}" text-anchor="middle" font-family="{MONO}" font-size="{R*0.2:.0f}" fill="#fff" letter-spacing="2">ENGINE</text>'''

# ---------------------------------------------------------------- assets

# 1. Profile picture (square, circle-safe) — LinkedIn/X/Reddit/TikTok/Insta/FB
# Just the mark, centred — the circular crop clips the corners so no wordmark.
render('profile-circle-400.png', 400, 400,
    f'{grid(400,400,0.05)}'
    f'<circle cx="200" cy="200" r="194" fill="none" stroke="{PINK}" stroke-width="3" opacity="0.45"/>'
    + orbit_logo(200, 200, 140))

# 2. LinkedIn personal banner 1584x396
render('linkedin-personal-1584x396.png', 1584, 396,
    f'{grid(1584,396,0.05)}'
    + f'<g opacity="0.9">{ai_engine(360, 198, 70)}</g>'
    + f'<text x="660" y="150" font-family="{HEAD}" font-size="58" font-weight="bold" fill="#fff">MASTER BRAND VISIBILITY</text>'
    + f'<text x="660" y="212" font-family="{HEAD}" font-size="58" font-weight="bold" fill="#fff">IN THE ERA OF <tspan fill="{PINK}">AI SEARCH</tspan></text>'
    + f'<text x="662" y="270" font-family="{HEAD}" font-size="25" fill="#b8b8c0">Get cited by ChatGPT, Gemini, Claude, Perplexity, Grok &amp; more.</text>'
    + f'<text x="662" y="320" font-family="{MONO}" font-size="23" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>')

# 3. LinkedIn company banner 1128x191
render('linkedin-company-1128x191.png', 1128, 191,
    f'{grid(1128,191,0.05)}'
    + orbit_logo(118, 96, 66)
    + f'<text x="232" y="86" font-family="{HEAD}" font-size="46" font-weight="bold" letter-spacing="2"><tspan fill="#fff">L8</tspan><tspan fill="{PINK}">ENT</tspan><tspan fill="#fff">SPACE</tspan></text>'
    + f'<text x="234" y="132" font-family="{HEAD}" font-size="27" font-weight="bold" fill="#cfcfd6">GENERATIVE ENGINE OPTIMIZATION <tspan fill="{PINK}">(GEO)</tspan></text>'
    + f'<text x="234" y="166" font-family="{MONO}" font-size="18" fill="#7a7a85" letter-spacing="1">Is your brand cited by AI? We measure, test &amp; lift your AI share of voice.</text>')

# 4. X (Twitter) header 1500x500
render('x-header-1500x500.png', 1500, 500,
    f'{grid(1500,500,0.05)}'
    + f'<g>{ai_engine(360, 250, 95)}</g>'
    + f'<text x="560" y="180" font-family="{HEAD}" font-size="64" font-weight="bold" fill="#fff">THE NEW ERA OF</text>'
    + f'<text x="560" y="250" font-family="{HEAD}" font-size="64" font-weight="bold" fill="#fff">SEARCH IS HERE.</text>'
    + f'<text x="560" y="330" font-family="{HEAD}" font-size="64" font-weight="bold" fill="{PINK}">GEO IS YOUR</text>'
    + f'<text x="560" y="400" font-family="{HEAD}" font-size="64" font-weight="bold" fill="{PINK}">SURVIVAL.</text>'
    + f'<text x="562" y="452" font-family="{MONO}" font-size="22" fill="#8a8a93" letter-spacing="2">l8entspace.com</text>')

# 5. Instagram portrait post 1080x1350 (4:5)
render('instagram-portrait-1080x1350.png', 1080, 1350,
    f'{grid(1080,1350,0.045)}'
    + radar(540, 470, 320)
    + f'<text x="540" y="930" text-anchor="middle" font-family="{HEAD}" font-size="80" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1015" text-anchor="middle" font-family="{HEAD}" font-size="80" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1085" text-anchor="middle" font-family="{HEAD}" font-size="30" fill="#b8b8c0">Is your brand cited by Gemini, ChatGPT, Claude</text>'
    + f'<text x="540" y="1125" text-anchor="middle" font-family="{HEAD}" font-size="30" fill="#b8b8c0">&amp; Perplexity? L8EntSpace tracks your visibility.</text>'
    + f'<text x="540" y="1235" text-anchor="middle" font-family="{MONO}" font-size="26" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 6. Instagram square post 1080x1080
render('instagram-square-1080x1080.png', 1080, 1080,
    f'{grid(1080,1080,0.045)}'
    + radar(540, 400, 270)
    + f'<text x="540" y="800" text-anchor="middle" font-family="{HEAD}" font-size="74" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="540" y="868" text-anchor="middle" font-family="{HEAD}" font-size="34" fill="#b8b8c0">Generative Engine Optimization</text>'
    + f'<text x="540" y="975" text-anchor="middle" font-family="{MONO}" font-size="26" fill="{PINK}" letter-spacing="3">www.l8entspace.com</text>')

# 7. Reddit banner 1920x384
render('reddit-banner-1920x384.png', 1920, 384,
    f'{grid(1920,384,0.05)}'
    + orbit_logo(150, 192, 82)
    + f'<text x="300" y="170" font-family="{HEAD}" font-size="58" font-weight="bold" letter-spacing="2"><tspan fill="#fff">L8</tspan><tspan fill="{PINK}">ENT</tspan><tspan fill="#fff">SPACE</tspan></text>'
    + f'<text x="302" y="228" font-family="{HEAD}" font-size="32" fill="#cfcfd6">Master brand visibility in the era of AI search — <tspan fill="{PINK}">GEO</tspan></text>'
    + f'<text x="302" y="280" font-family="{MONO}" font-size="22" fill="#7a7a85" letter-spacing="1">l8entspace.com</text>'
    + f'<g opacity="0.85">{ai_engine(1680, 192, 72)}</g>')

# 8. TikTok vertical cover 1080x1920
render('tiktok-cover-1080x1920.png', 1080, 1920,
    f'{grid(1080,1920,0.045)}'
    + radar(540, 720, 360)
    + f'<text x="540" y="1300" text-anchor="middle" font-family="{HEAD}" font-size="86" font-weight="bold" fill="#fff">MASTER YOUR</text>'
    + f'<text x="540" y="1395" text-anchor="middle" font-family="{HEAD}" font-size="86" font-weight="bold" fill="{PINK}">AI SHARE OF VOICE</text>'
    + f'<text x="540" y="1480" text-anchor="middle" font-family="{HEAD}" font-size="34" fill="#b8b8c0">Is your brand cited by AI engines?</text>'
    + f'<text x="540" y="1620" text-anchor="middle" font-family="{MONO}" font-size="32" fill="{PINK}" letter-spacing="3">[ www.l8entspace.com ]</text>')

# 9. Facebook / general cover 820x312
render('facebook-cover-820x312.png', 820, 312,
    f'{grid(820,312,0.05)}'
    + orbit_logo(120, 150, 70)
    + f'<text x="250" y="135" font-family="{HEAD}" font-size="44" font-weight="bold" fill="#fff">GET CITED BY <tspan fill="{PINK}">AI</tspan></text>'
    + f'<text x="252" y="185" font-family="{HEAD}" font-size="24" fill="#cfcfd6">Generative Engine Optimization</text>'
    + f'<text x="252" y="235" font-family="{MONO}" font-size="20" fill="{PINK}" letter-spacing="2">www.l8entspace.com</text>')

print('\\nAll assets written to', os.path.realpath(OUT))
