import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const catalogPath = path.join(process.cwd(), 'src/lib/data/catalog.ts');
const catalogSource = fs.readFileSync(catalogPath, 'utf8');

const enMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
);
const mkMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/mk.json'), 'utf8'),
);

function parseServices(source) {
  const blockMatch = source.match(/export const services: Service\[\] = \[([\s\S]*?)\n\];/);
  if (!blockMatch) throw new Error('Could not find services array in catalog.ts');

  const services = [];
  const itemRegex =
    /\{\s*id:\s*'([^']+)'[\s\S]*?startingPrice:\s*(\d+)[\s\S]*?(?:featured:\s*(true|false))?/g;

  let match;
  while ((match = itemRegex.exec(blockMatch[1])) !== null) {
    services.push({
      id: match[1],
      startingPrice: Number(match[2]),
      featured: match[3] === 'true',
    });
  }

  return services;
}

const services = parseServices(catalogSource);

const rows = services.map((service, index) => {
  const en = enMessages.services.items[service.id] ?? {};
  const mk = mkMessages.services.items[service.id] ?? {};

  return {
    id: service.id,
    title_en: en.title ?? service.id,
    title_mk: mk.title ?? service.id,
    description_en: en.description ?? '',
    description_mk: mk.description ?? '',
    detail_en: en.detail ?? '',
    detail_mk: mk.detail ?? '',
    starting_price: service.startingPrice,
    featured: service.featured,
    active: true,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  };
});

async function main() {
  const { error } = await supabase.from('cms_services').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.error('CMS services seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} CMS service entries`);
}

main();
