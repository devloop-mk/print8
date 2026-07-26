import fs from 'fs';
const keys = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'BREVO_API_KEY',
  'EMAIL_FROM',
  'ORDER_NOTIFICATION_EMAIL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
];

const lines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/);

for (const k of keys) {
  const line = lines.find((l) => l.startsWith(`${k}=`));
  if (!line) {
    console.log(`${k}: MISSING`);
    continue;
  }
  const v = line.slice(k.length + 1).trim().replace(/^["']|["']$/g, '');
  if (!v || v.includes('YOUR_') || v.includes('your_')) {
    console.log(`${k}: PLACEHOLDER`);
  } else if (k === 'NEXT_PUBLIC_SUPABASE_URL') {
    try {
      const u = new URL(v);
      console.log(`${k}: OK (${u.hostname})`);
    } catch {
      console.log(`${k}: INVALID URL`);
    }
  } else {
    console.log(`${k}: OK (length ${v.length})`);
  }
}
