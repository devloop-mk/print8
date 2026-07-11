import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const manifestPath = path.join(
  process.cwd(),
  'scripts/business-card-pack-100-manifest.json',
);
const enMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
);
const mkMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/mk.json'), 'utf8'),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

async function main() {
  const rows = manifest.items.map((item, index) => ({
    id: item.id,
    category: 'business-cards',
    kind: 'fixed',
    image: `/NEW_DESIGNS/business-cards/pack-100/${item.id}.jpg`,
    tags: item.tags,
    thumb_aspect: 1.75,
    exclusive: true,
    availability: 'available',
    price: 500,
    sort_order: index + 1,
    name_en: enMessages.designs.templates[item.id],
    name_mk: mkMessages.designs.templates[item.id],
    description_en: null,
    description_mk: null,
    svg_template_id: null,
    layout_id: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('catalog_designs').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} exclusive business card designs into catalog_designs`);
}

main();
