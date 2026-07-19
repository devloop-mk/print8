import fs from 'node:fs/promises';
import path from 'node:path';

const OUT = 'E:/print8-social-media';
const text = `# Print 8 — Social media pack

Exact Print 8 logo is composited from SVG-derived PNGs in \`logos/\` (never AI-redrawn).

## Folders

| Folder | Size | Use |
|--------|------|-----|
| \`final/square\` | 1080×1080 | Feed / carousel |
| \`final/portrait-1080x1440\` | 1080×1440 | Vertical feed |
| \`final/landscape-1440x1080\` | 1440×1080 | FB/landscape |
| \`final/stories-1080x1920\` | 1080×1920 | Stories / Reels cover |
| \`raw\` | mixed | Source bases |
| \`manifests\` | — | Export log |

## Themes in filenames

- \`couples_\` — couple packs
- \`family_\` — family
- \`kids_\` — birthday / kids
- \`coupon500_\` — **−500 ден. over 3.500**
- \`coupon1000_\` — **−1.000 ден. over 6.500**
- \`branding_\` — branding pack
- \`local_\` — Štip / Macedonia
- \`apparel_\` \`ready_\` \`cod_\` \`caps_\` \`drinkware_\` \`quality_\` \`custom_\` \`street_\`

## Style suffixes

- \`__fade__\` — soft bottom fade
- \`__gradient-frame__\` — premium gradient border
- \`__navy-panel__\` — solid navy caption bar
- \`__soft-glow__\` — soft brand glow

Regenerate / expand:
\`\`\`
cd print8.mk
set SM_TARGET=500
node scripts/batch-social-media-e-drive.mjs
\`\`\`
`;

await fs.writeFile(path.join(OUT, 'README.md'), text, 'utf8');
console.log('README written');
