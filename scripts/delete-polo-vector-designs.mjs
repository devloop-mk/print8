import fs from 'node:fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

loadEnv();

const ids = ['polo-sample-logo', 'polo-your-design-here', 'polo-vash-dizajn-tuka'];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url && key) {
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error, count } = await sb
    .from('managed_product_designs')
    .delete({ count: 'exact' })
    .in('id', ids);
  if (error) throw error;
  console.log(`Deleted ${count} managed_product_designs rows`);
} else {
  console.log('Skipped DB delete — no Supabase env');
}

const poloDir = path.join(process.cwd(), 'public', 'NEW_DESIGNS', 'polo');
if (fs.existsSync(poloDir)) {
  fs.rmSync(poloDir, { recursive: true, force: true });
  console.log('Removed', poloDir);
}
