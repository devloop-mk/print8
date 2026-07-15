import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/couple');

const svgs = {
  'king.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M120 140 L140 90 L160 120 L180 80 L200 120 L220 80 L240 120 L260 90 L280 140" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <text x="200" y="260" text-anchor="middle" font-family="Georgia,serif" font-size="72" font-weight="bold" fill="#000">KING</text>
</svg>`,
  'queen.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <circle cx="160" cy="110" r="8" fill="#dc2626"/>
  <circle cx="200" cy="90" r="8" fill="#dc2626"/>
  <circle cx="240" cy="110" r="8" fill="#dc2626"/>
  <path d="M120 140 L140 100 L160 125 L180 85 L200 125 L220 85 L240 125 L260 100 L280 140" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <text x="200" y="260" text-anchor="middle" font-family="Georgia,serif" font-size="64" font-weight="bold" fill="#dc2626">QUEEN</text>
</svg>`,
  'hes-mine.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M60 200 C60 160 100 140 140 160 L180 180 L200 200 L180 220 L140 240 C100 260 60 240 60 200Z" fill="#fff" stroke="#000" stroke-width="5"/>
  <path d="M180 200 L280 200" stroke="#000" stroke-width="8" stroke-linecap="round"/>
  <path d="M280 200 L250 180 M280 200 L250 220" stroke="#000" stroke-width="6" stroke-linecap="round"/>
  <text x="200" y="310" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="#dc2626">He's MINE</text>
</svg>`,
  'shes-mine.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M340 200 C340 160 300 140 260 160 L220 180 L200 200 L220 220 L260 240 C300 260 340 240 340 200Z" fill="#fff" stroke="#000" stroke-width="5"/>
  <path d="M220 200 L120 200" stroke="#000" stroke-width="8" stroke-linecap="round"/>
  <path d="M120 200 L150 180 M120 200 L150 220" stroke="#000" stroke-width="6" stroke-linecap="round"/>
  <text x="200" y="310" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="#dc2626">She's MINE</text>
</svg>`,
  'puzzle-left.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M80 200 C80 130 130 80 200 80 C200 110 220 120 240 110 C260 100 280 110 280 130 C300 130 320 150 320 180 L320 200 L80 200Z" fill="#dc2626" stroke="#000" stroke-width="4"/>
  <circle cx="200" cy="200" r="20" fill="#fff" stroke="#000" stroke-width="3"/>
  <path d="M200 180 L200 220 M180 200 L220 200" stroke="#000" stroke-width="3"/>
</svg>`,
  'puzzle-right.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M320 200 C320 270 270 320 200 320 C200 290 180 280 160 290 C140 300 120 290 120 270 C100 270 80 250 80 220 L80 200 L320 200Z" fill="#dc2626" stroke="#000" stroke-width="4"/>
  <circle cx="200" cy="200" r="20" fill="#fff" stroke="#000" stroke-width="3"/>
  <path d="M200 180 L200 220 M180 200 L220 200" stroke="#000" stroke-width="3"/>
</svg>`,
  'magnet-holder.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <circle cx="120" cy="280" r="12" fill="#000"/><line x1="120" y1="292" x2="120" y2="340" stroke="#000" stroke-width="4"/>
  <circle cx="120" cy="350" r="10" fill="#000"/><line x1="120" y1="340" x2="120" y2="200" stroke="#000" stroke-width="4"/>
  <circle cx="120" cy="190" r="12" fill="#000"/>
  <path d="M200 160 C200 120 260 120 260 180 C260 220 200 220 200 180" fill="#dc2626" stroke="#000" stroke-width="4"/>
  <path d="M200 160 C200 120 140 120 140 180 C140 220 200 220 200 180" fill="#1e40af" stroke="#000" stroke-width="4"/>
  <text x="230" y="200" font-family="Arial" font-size="28" fill="#000">N</text>
  <text x="155" y="200" font-family="Arial" font-size="28" fill="#000">S</text>
</svg>`,
  'magnet-attracted.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <circle cx="280" cy="280" r="12" fill="#000"/><line x1="280" y1="292" x2="280" y2="340" stroke="#000" stroke-width="4"/>
  <circle cx="280" cy="350" r="10" fill="#000"/><line x1="280" y1="340" x2="200" y2="200" stroke="#000" stroke-width="4"/>
  <circle cx="190" cy="190" r="12" fill="#000"/>
  <path d="M120 200 L160 200" stroke="#000" stroke-width="3" stroke-dasharray="8 6"/>
  <text x="200" y="120" text-anchor="middle" font-family="Arial" font-size="24" fill="#dc2626">♥</text>
</svg>`,
  'mio.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M60 200 C60 160 100 140 140 160 L180 180 L200 200 L180 220 L140 240 C100 260 60 240 60 200Z" fill="#fff" stroke="#000" stroke-width="5"/>
  <path d="M180 200 L280 200" stroke="#000" stroke-width="8" stroke-linecap="round"/>
  <path d="M280 200 L250 180 M280 200 L250 220" stroke="#000" stroke-width="6" stroke-linecap="round"/>
  <text x="200" y="310" text-anchor="middle" font-family="Georgia,serif" font-size="72" font-weight="bold" fill="#000">Mío</text>
</svg>`,
  'mia.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M340 200 C340 160 300 140 260 160 L220 180 L200 200 L220 220 L260 240 C300 260 340 240 340 200Z" fill="#fff" stroke="#000" stroke-width="5"/>
  <path d="M220 200 L120 200" stroke="#000" stroke-width="8" stroke-linecap="round"/>
  <path d="M120 200 L150 180 M120 200 L150 220" stroke="#000" stroke-width="6" stroke-linecap="round"/>
  <text x="200" y="310" text-anchor="middle" font-family="Georgia,serif" font-size="72" font-weight="bold" fill="#dc2626">Mía</text>
</svg>`,
  'pacman.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M120 200 A80 80 0 1 1 120 199.9 Z" fill="#fbbf24" stroke="#000" stroke-width="4"/>
  <path d="M120 200 L200 140 L200 260 Z" fill="#fff"/>
  <circle cx="100" cy="170" r="8" fill="#000"/>
  <circle cx="240" cy="200" r="6" fill="#fbbf24" stroke="#000" stroke-width="2"/>
  <circle cx="270" cy="200" r="6" fill="#fbbf24" stroke="#000" stroke-width="2"/>
  <circle cx="300" cy="200" r="6" fill="#fbbf24" stroke="#000" stroke-width="2"/>
</svg>`,
  'ghost.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
  <path d="M240 120 C200 100 160 120 160 180 L160 280 C160 280 180 260 200 280 C220 260 240 280 240 280 L240 180 C240 140 260 130 240 120Z" fill="#60a5fa" stroke="#000" stroke-width="4"/>
  <circle cx="185" cy="170" r="14" fill="#fff" stroke="#000" stroke-width="3"/>
  <circle cx="215" cy="170" r="14" fill="#fff" stroke="#000" stroke-width="3"/>
  <circle cx="185" cy="172" r="6" fill="#000"/>
  <circle cx="215" cy="172" r="6" fill="#000"/>
  <path d="M190 210 Q200 220 210 210" stroke="#000" stroke-width="3" fill="none"/>
</svg>`,
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(OUT, name), content.trim());
  console.log(`Wrote ${name}`);
}
