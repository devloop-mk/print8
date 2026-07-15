import './thumb-dom-polyfill';

import fs from 'node:fs';
import path from 'node:path';
import {
  closeGalleryThumbBrowser,
  regenerateDesignGalleryThumb,
} from '@/lib/designs/gallery-thumb-builder.core';
import { managedSvgTemplatesDb } from '@/lib/db/managed-svg-templates';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const designId = process.argv[2];

if (!designId) {
  console.error('Usage: npx tsx scripts/regenerate-design-gallery-thumb.ts <design-id>');
  process.exit(1);
}

async function main() {
  loadEnv();

  const design = (await import('@/lib/data/catalog')).designTemplates.find(
    (entry) => entry.id === designId,
  );
  const templateId = design?.svgTemplateId ?? null;
  const managed = templateId
    ? await managedSvgTemplatesDb.findByTemplateId(templateId)
    : null;

  const built = await regenerateDesignGalleryThumb(
    designId,
    managed?.defaults ?? null,
    {
      templateId: managed?.templateId ?? templateId ?? designId,
      defaultsUpdatedAt: managed?.updatedAt ?? null,
    },
  );

  if (!built) {
    console.error(`Failed to build thumb for ${designId}`);
    process.exit(1);
  }

  console.log(
    `Built ${built.publicPath} (${built.width}x${built.height}, ${Math.round(built.bytes / 1024)} KB)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeGalleryThumbBrowser();
  });
