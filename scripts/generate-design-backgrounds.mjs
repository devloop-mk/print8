/** @deprecated Placeholder SVG backgrounds — use original PNGs in public/NEW_DESIGNS/backgrounds instead. */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'public', 'NEW_DESIGNS', 'backgrounds');
mkdirSync(outDir, { recursive: true });

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${body}\n</svg>\n`;
}

const backgrounds = {
  'wedding-bg-beach.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#87CEEB"/>
    <stop offset="55%" stop-color="#B8E4F5"/>
    <stop offset="100%" stop-color="#F5DEB3"/>
  </linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#4A9FD4"/>
    <stop offset="100%" stop-color="#2E7D9A"/>
  </linearGradient>
</defs>
<rect width="1500" height="1200" fill="url(#sky)"/>
<rect y="1050" width="1500" height="350" fill="url(#sea)" opacity="0.85"/>
<ellipse cx="750" cy="1080" rx="900" ry="80" fill="#F4E4BC"/>
<path d="M0 1150 Q375 1100 750 1150 T1500 1150 L1500 2100 L0 2100 Z" fill="#EDD9A3"/>
<path d="M0 1180 Q200 1160 400 1185 T800 1175 T1200 1190 T1500 1175 L1500 2100 L0 2100 Z" fill="#E8CF8E" opacity="0.6"/>`,
  ),

  'wedding-bg-autumn.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8B4513"/>
    <stop offset="40%" stop-color="#CD853F"/>
    <stop offset="70%" stop-color="#D2691E"/>
    <stop offset="100%" stop-color="#A0522D"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#bg)"/>
<ellipse cx="200" cy="400" rx="180" ry="120" fill="#B8860B" opacity="0.3"/>
<ellipse cx="1300" cy="600" rx="220" ry="150" fill="#DAA520" opacity="0.25"/>
<g opacity="0.5" fill="#8B0000">
  <ellipse cx="300" cy="800" rx="40" ry="25" transform="rotate(-30 300 800)"/>
  <ellipse cx="1200" cy="950" rx="45" ry="28" transform="rotate(45 1200 950)"/>
  <ellipse cx="750" cy="1500" rx="50" ry="30" transform="rotate(-15 750 1500)"/>
  <ellipse cx="450" cy="1700" rx="38" ry="24" transform="rotate(60 450 1700)"/>
  <ellipse cx="1100" cy="1800" rx="42" ry="26" transform="rotate(-40 1100 1800)"/>
</g>`,
  ),

  'wedding-bg-celestial.svg': svg(
    1500,
    2100,
    `<defs>
  <radialGradient id="night" cx="50%" cy="30%" r="80%">
    <stop offset="0%" stop-color="#1a1a4e"/>
    <stop offset="50%" stop-color="#0d0d2b"/>
    <stop offset="100%" stop-color="#050510"/>
  </radialGradient>
</defs>
<rect width="1500" height="2100" fill="url(#night)"/>
<g fill="#FFFFFF" opacity="0.9">
  <circle cx="200" cy="300" r="2"/><circle cx="450" cy="150" r="1.5"/><circle cx="800" cy="250" r="2"/>
  <circle cx="1100" cy="180" r="1"/><circle cx="1350" cy="350" r="2"/><circle cx="600" cy="500" r="1.5"/>
  <circle cx="300" cy="700" r="2"/><circle cx="1000" cy="600" r="1"/><circle cx="1400" cy="800" r="1.5"/>
  <circle cx="150" cy="1000" r="1"/><circle cx="750" cy="900" r="2"/><circle cx="1250" cy="1100" r="1.5"/>
</g>
<g fill="#D4AF37" opacity="0.8">
  <circle cx="750" cy="400" r="3"/><circle cx="500" cy="350" r="2"/><circle cx="1000" cy="450" r="2.5"/>
</g>
<ellipse cx="750" cy="350" rx="200" ry="80" fill="#F5F5DC" opacity="0.15"/>`,
  ),

  'wedding-bg-watercolor.svg': svg(
    1500,
    2100,
    `<defs>
  <radialGradient id="w1" cx="30%" cy="25%" r="50%">
    <stop offset="0%" stop-color="#98D8C8" stop-opacity="0.7"/>
    <stop offset="100%" stop-color="#98D8C8" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="w2" cx="70%" cy="40%" r="45%">
    <stop offset="0%" stop-color="#F7CAC9" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#F7CAC9" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="w3" cx="50%" cy="70%" r="55%">
    <stop offset="0%" stop-color="#B8D4E3" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#B8D4E3" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="1500" height="2100" fill="#FAF8F5"/>
<rect width="1500" height="2100" fill="url(#w1)"/>
<rect width="1500" height="2100" fill="url(#w2)"/>
<rect width="1500" height="2100" fill="url(#w3)"/>`,
  ),

  'wedding-bg-winter.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#E8F4FC"/>
    <stop offset="50%" stop-color="#F0F8FF"/>
    <stop offset="100%" stop-color="#FFFFFF"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#snow)"/>
<g fill="#B0C4DE" opacity="0.4">
  <circle cx="200" cy="300" r="80"/><circle cx="1300" cy="500" r="100"/><circle cx="700" cy="1200" r="90"/>
</g>
<g fill="#FFFFFF" opacity="0.7">
  <circle cx="400" cy="600" r="4"/><circle cx="900" cy="400" r="3"/><circle cx="1100" cy="800" r="5"/>
  <circle cx="250" cy="1100" r="3"/><circle cx="600" cy="1500" r="4"/><circle cx="1200" cy="1400" r="3"/>
</g>`,
  ),

  'wedding-bg-terracotta.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="terra" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#C67B5C"/>
    <stop offset="50%" stop-color="#D4A574"/>
    <stop offset="100%" stop-color="#B85C38"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#terra)"/>
<rect x="0" y="1600" width="1500" height="500" fill="#8B6914" opacity="0.2"/>
<ellipse cx="750" cy="400" rx="400" ry="200" fill="#E8D5B7" opacity="0.15"/>`,
  ),

  'bday-bg-gold.svg': svg(
    1500,
    2100,
    `<defs>
  <radialGradient id="goldGlow" cx="50%" cy="40%" r="60%">
    <stop offset="0%" stop-color="#2a2a2a"/>
    <stop offset="100%" stop-color="#0a0a0a"/>
  </radialGradient>
</defs>
<rect width="1500" height="2100" fill="url(#goldGlow)"/>
<g fill="#D4AF37" opacity="0.15">
  <circle cx="300" cy="400" r="120"/><circle cx="1200" cy="600" r="150"/><circle cx="750" cy="1200" r="200"/>
</g>
<g fill="#D4AF37" opacity="0.3">
  <circle cx="500" cy="800" r="8"/><circle cx="900" cy="500" r="6"/><circle cx="1100" cy="1000" r="10"/>
</g>`,
  ),

  'bday-bg-rosegold.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="rose" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#FADADD"/>
    <stop offset="50%" stop-color="#F5E6E0"/>
    <stop offset="100%" stop-color="#E8C4C4"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#rose)"/>
<ellipse cx="750" cy="500" rx="500" ry="300" fill="#FFFFFF" opacity="0.3"/>
<g fill="#B76E79" opacity="0.2">
  <circle cx="200" cy="300" r="80"/><circle cx="1300" cy="700" r="100"/>
</g>`,
  ),

  'bday-bg-princess.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="princess" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFE4EC"/>
    <stop offset="50%" stop-color="#E8D5F2"/>
    <stop offset="100%" stop-color="#DDA0DD"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#princess)"/>
<g fill="#FFFFFF" opacity="0.5">
  <polygon points="750,200 770,260 830,260 782,300 800,360 750,325 700,360 718,300 670,260 730,260"/>
  <polygon points="300,600 310,630 340,630 318,650 325,680 300,665 275,680 282,650 260,630 290,630" transform="scale(1.5) translate(50,100)"/>
</g>`,
  ),

  'bday-bg-dino.svg': svg(
    1500,
    2100,
    `<defs>
  <linearGradient id="jungle" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2D5A27"/>
    <stop offset="60%" stop-color="#3D7A35"/>
    <stop offset="100%" stop-color="#1B4332"/>
  </linearGradient>
</defs>
<rect width="1500" height="2100" fill="url(#jungle)"/>
<g fill="#228B22" opacity="0.4">
  <ellipse cx="200" cy="1800" rx="150" ry="80"/><ellipse cx="1300" cy="1900" rx="180" ry="90"/>
</g>
<g fill="#90EE90" opacity="0.3">
  <ellipse cx="400" cy="400" rx="60" ry="100" transform="rotate(-20 400 400)"/>
  <ellipse cx="1100" cy="500" rx="70" ry="110" transform="rotate(25 1100 500)"/>
</g>`,
  ),

  'menu-bg-rustic-front.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="parchment" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#F5F0E1"/>
    <stop offset="50%" stop-color="#EDE4D3"/>
    <stop offset="100%" stop-color="#E8DFC8"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#parchment)"/>
<rect x="80" y="80" width="1440" height="2240" fill="none" stroke="#4F6354" stroke-width="3" opacity="0.4"/>
<g stroke="#4F6354" stroke-width="2" fill="none" opacity="0.3">
  <path d="M200 200 Q250 150 300 200"/><path d="M1300 200 Q1350 150 1400 200"/>
</g>`,
  ),

  'menu-bg-rustic-back.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="parchment2" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#EDE4D3"/>
    <stop offset="100%" stop-color="#E0D5C0"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#parchment2)"/>
<rect x="100" y="100" width="1400" height="2200" fill="none" stroke="#4F6354" stroke-width="2" opacity="0.25"/>`,
  ),

  'menu-bg-finedining-front.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1a1a1a"/>
    <stop offset="50%" stop-color="#2d2d2d"/>
    <stop offset="100%" stop-color="#0f0f0f"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#marble)"/>
<g stroke="#D4AF37" stroke-width="1" fill="none" opacity="0.2">
  <path d="M0 400 Q400 350 800 400 T1600 400"/><path d="M0 1200 Q500 1150 1000 1200 T1600 1200"/>
</g>
<rect x="120" y="120" width="1360" height="2160" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.5"/>`,
  ),

  'menu-bg-finedining-back.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a1a1a"/>
    <stop offset="100%" stop-color="#0a0a0a"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#dark)"/>
<rect x="150" y="150" width="1300" height="2100" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.35"/>`,
  ),

  'menu-bg-sushi-front.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="sushiDark" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0f0f14"/>
    <stop offset="50%" stop-color="#1a1520"/>
    <stop offset="100%" stop-color="#120a10"/>
  </linearGradient>
  <radialGradient id="sushiGlow" cx="50%" cy="35%" r="55%">
    <stop offset="0%" stop-color="#FBCFE8" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#FBCFE8" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="1600" height="2400" fill="url(#sushiDark)"/>
<rect width="1600" height="2400" fill="url(#sushiGlow)"/>
<rect x="100" y="100" width="1400" height="2200" fill="none" stroke="#EF4444" stroke-width="2" opacity="0.35"/>`,
  ),

  'menu-bg-sushi-back.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="sushiBack" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#141018"/>
    <stop offset="100%" stop-color="#0a080c"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#sushiBack)"/>
<g stroke="#FBCFE8" stroke-width="1" fill="none" opacity="0.15">
  <circle cx="800" cy="900" r="280"/><circle cx="800" cy="900" r="220"/>
</g>`,
  ),

  'menu-bg-seafood-front.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0c2d48"/>
    <stop offset="45%" stop-color="#134e6f"/>
    <stop offset="100%" stop-color="#051a2c"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#ocean)"/>
<path d="M0 1700 Q400 1600 800 1680 T1600 1650 L1600 2400 L0 2400 Z" fill="#0a3d5c" opacity="0.55"/>
<rect x="120" y="120" width="1360" height="2160" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.4"/>`,
  ),

  'menu-bg-seafood-back.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="oceanDeep" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#082338"/>
    <stop offset="100%" stop-color="#041018"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#oceanDeep)"/>
<g fill="#E0F2FE" opacity="0.06">
  <ellipse cx="300" cy="500" rx="120" ry="40"/><ellipse cx="1200" cy="700" rx="160" ry="50"/>
</g>`,
  ),

  'menu-bg-cafe-front.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="latte" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#F5EDE4"/>
    <stop offset="50%" stop-color="#E8DDD3"/>
    <stop offset="100%" stop-color="#D7C4B5"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#latte)"/>
<rect x="90" y="90" width="1420" height="2220" fill="none" stroke="#8D6E63" stroke-width="3" opacity="0.35"/>
<g fill="#8D6E63" opacity="0.08">
  <circle cx="250" cy="400" r="90"/><circle cx="1350" cy="500" r="110"/>
</g>`,
  ),

  'menu-bg-cafe-back.svg': svg(
    1600,
    2400,
    `<defs>
  <linearGradient id="latteBack" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#EDE3D8"/>
    <stop offset="100%" stop-color="#D9C8B8"/>
  </linearGradient>
</defs>
<rect width="1600" height="2400" fill="url(#latteBack)"/>
<rect x="110" y="110" width="1380" height="2180" fill="none" stroke="#3E2723" stroke-width="2" opacity="0.2"/>`,
  ),
};

for (const [name, content] of Object.entries(backgrounds)) {
  writeFileSync(path.join(outDir, name), content, 'utf8');
  console.log('wrote', name);
}
