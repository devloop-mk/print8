import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public', 'NEW_DESIGNS');

const MAP = {
  'wedding-bg-beach.png': '/NEW_DESIGNS/backgrounds/wedding-bg-beach.png',
  'wedding-bg-autumn.png': '/NEW_DESIGNS/backgrounds/wedding-bg-autumn.png',
  'wedding-bg-celestial.png': '/NEW_DESIGNS/backgrounds/wedding-bg-celestial.png',
  'wedding-bg-watercolor.png': '/NEW_DESIGNS/backgrounds/wedding-bg-watercolor.png',
  'wedding-bg-winter.png': '/NEW_DESIGNS/backgrounds/wedding-bg-winter.png',
  'wedding-bg-terracotta.png': '/NEW_DESIGNS/backgrounds/wedding-bg-terracotta.png',
  'bday-bg-gold.png': '/NEW_DESIGNS/backgrounds/bday-bg-gold.png',
  'bday-bg-rosegold.png': '/NEW_DESIGNS/backgrounds/bday-bg-rosegold.png',
  'bday-bg-princess.png': '/NEW_DESIGNS/backgrounds/bday-bg-princess.png',
  'bday-bg-dino.png': '/NEW_DESIGNS/backgrounds/bday-bg-dino.png',
  'bday-bg-champagne.png': '/NEW_DESIGNS/backgrounds/bday-bg-champagne.png',
  'bday-bg-unicorn.png': '/NEW_DESIGNS/backgrounds/bday-bg-unicorn.png',
  'bday-bg-bbq.png': '/NEW_DESIGNS/backgrounds/bday-bg-bbq.png',
  'bday-bg-retro.png': '/NEW_DESIGNS/backgrounds/bday-bg-retro.png',
  'bday-bg-construction.png': '/NEW_DESIGNS/backgrounds/bday-bg-construction.png',
  'bday-bg-mermaid.png': '/NEW_DESIGNS/backgrounds/bday-bg-mermaid.png',
  'bday-bg-safari.png': '/NEW_DESIGNS/backgrounds/bday-bg-safari.png',
  'bday-bg-space.png': '/NEW_DESIGNS/backgrounds/bday-bg-space.png',
  'menu-bg-rustic-front.png': '/NEW_DESIGNS/backgrounds/menu-bg-rustic-front.png',
  'menu-bg-rustic-back.png': '/NEW_DESIGNS/backgrounds/menu-bg-rustic-back.png',
  'menu-bg-finedining-front.png': '/NEW_DESIGNS/backgrounds/menu-bg-finedining-front.png',
  'menu-bg-finedining-back.png': '/NEW_DESIGNS/backgrounds/menu-bg-finedining-back.png',
};

function patchSvg(content) {
  let next = content.replace(
    /<image\b([^>]*?)\s(?:xlink:)?href="([^"]+)"([^>]*)\/?>/gi,
    (match, before, href, after) => {
      const filename = href.split(/[/\\]/).pop()?.split('?')[0];
      const mapped = filename ? MAP[filename] : null;
      if (!mapped) {
        const svgFallback = filename?.replace(/\.png$/i, '.svg');
        const fallbackPath = svgFallback ? MAP[svgFallback.replace('.svg', '.png')] : null;
        if (!fallbackPath && href.includes('/backgrounds/')) {
          const pngPath = href.replace(/\.svg$/i, '.png');
          if (pngPath !== href) {
            const trailing = after.replace(/\s*\/?\s*$/, '');
            return `<image${before} href="${pngPath}"${trailing}/>`;
          }
        }
        if (!mapped && !fallbackPath) return match;
      }

      const publicPath = mapped ?? MAP[filename.replace(/\.svg$/i, '.png')];
      const trailing = after.replace(/\s*\/?\s*$/, '');
      return `<image${before} href="${publicPath}"${trailing}/>`;
    },
  );

  next = next.replace(/href="(\/NEW_DESIGNS\/backgrounds\/[^"]+)\.svg"/g, '$1.png"');
  return next;
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'backgrounds') continue;
      walk(full);
    } else if (entry.name.endsWith('.svg')) {
      const original = readFileSync(full, 'utf8');
      const patched = patchSvg(original);
      if (patched !== original) {
        writeFileSync(full, patched, 'utf8');
        console.log('patched', path.relative(ROOT, full));
      }
    }
  }
}

walk(ROOT);
