import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'public', 'NEW_DESIGNS');

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.svg')) {
      const svg = readFileSync(full, 'utf8');
      const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/gi)].map(
        (m) => m[1].trim(),
      );
      const classes = [
        ...svg.matchAll(/\.([a-z0-9_-]+)\s*\{\s*fill:\s*([^;]+);/gi),
      ].map((m) => ({ class: m[1], fill: m[2].trim() }));
      console.log(JSON.stringify({ file: path.relative(root, full), texts, classes }));
    }
  }
}

walk(root);
