# Génère les icônes de assets/ (pip install cairosvg, puis : python3 scripts/icones.py depuis la racine).
import cairosvg, sys
S = '''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{}</svg>'''
DEFS = '''<defs>
<radialGradient id="bg" cx="30%" cy="25%" r="90%">
 <stop offset="0" stop-color="#D2703F"/><stop offset="0.55" stop-color="#B4532A"/><stop offset="1" stop-color="#8A3B1B"/></radialGradient>
<linearGradient id="pot" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FBF5EC"/><stop offset="1" stop-color="#EBDCC8"/></linearGradient>
<linearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F1E6D6"/></linearGradient>
</defs>'''
def fg(mono=False):
    c = lambda col: '#FFFFFF' if mono else col
    pot = c('url(#pot)'); lid = c('url(#lid)'); steam = c('#F2B544'); handle = c('#F1E6D6')
    heart = '#000' if mono else '#B4532A'
    out = []
    if not mono:
        out.append('<ellipse cx="512" cy="742" rx="215" ry="26" fill="#5A2410" opacity="0.28"/>')
    # steam
    for x in (432, 512, 592):
        out.append(f'<path d="M{x} 316 c-24 -24 -24 -42 0 -64 c24 -22 24 -40 0 -64" fill="none" stroke="{steam}" stroke-width="30" stroke-linecap="round"/>')
    # handles
    out.append(f'<rect x="256" y="500" width="90" height="44" rx="22" fill="{handle}"/>')
    out.append(f'<rect x="678" y="500" width="90" height="44" rx="22" fill="{handle}"/>')
    # body with heart cut out (evenodd)
    heartd = 'M512 652 C442 606 436 560 464 542 C486 528 506 540 512 558 C518 540 538 528 560 542 C588 560 582 606 512 652 Z'
    out.append(f'<path fill-rule="evenodd" d="M318 {490 if mono else 470} H706 V640 a90 90 0 0 1 -90 90 H408 a90 90 0 0 1 -90 -90 Z {heartd}" fill="{pot}"/>')
    # rim band
    if not mono:
        out.append('<rect x="318" y="470" width="388" height="22" fill="#E3D2BC" opacity="0.8"/>')
    # lid
    out.append(f'<path d="M286 456 C300 392 400 372 512 372 C624 372 724 392 738 456 a14 14 0 0 1 -14 16 H300 a14 14 0 0 1 -14 -16 Z" fill="{lid}"/>')
    out.append(f'<rect x="478" y="340" width="68" height="44" rx="18" fill="{c("#F1E6D6")}"/>')
    return '<g transform="translate(512 520) scale(0.84) translate(-512 -520)">'+''.join(out)+'</g>'
def save(svg, path, size=1024):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=size, output_height=size)
bgrect = '<rect width="1024" height="1024" fill="url(#bg)"/>'
save(S.format(DEFS+bgrect), 'assets/android-icon-background.png')
save(S.format(DEFS+fg()), 'assets/android-icon-foreground.png')
# monochrome: heart must be a hole -> use mask
mono = DEFS + fg(True)
save(S.format(mono), 'assets/android-icon-monochrome.png')
# legacy full icon: scale foreground up a bit (adaptive is cropped to 66%)
full = DEFS + bgrect + '<g transform="translate(512 540) scale(1.3) translate(-512 -540)">'+fg()+'</g>'
save(S.format(full), 'assets/icon.png')
save(S.format(full), 'assets/favicon.png', 96)
splash = DEFS + '<rect x="112" y="112" width="800" height="800" rx="190" fill="url(#bg)"/><g transform="translate(512 540) scale(1.05) translate(-512 -540)">'+fg()+'</g>'
save(S.format(splash), 'assets/splash-icon.png')
