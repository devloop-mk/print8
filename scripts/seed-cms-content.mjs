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

const enMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/en.json'), 'utf8'),
);
const mkMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'messages/mk.json'), 'utf8'),
);

const home = enMessages.home;
const homeMk = mkMessages.home;
const contact = enMessages.contact;
const contactMk = mkMessages.contact;

const rows = [
  {
    key: 'home.heroBadge',
    section: 'home',
    label: 'Hero badge',
    value_en: home.heroBadge,
    value_mk: homeMk.heroBadge,
  },
  {
    key: 'home.heroTitle',
    section: 'home',
    label: 'Hero title',
    value_en: home.heroTitle,
    value_mk: homeMk.heroTitle,
  },
  {
    key: 'home.heroSubtitle',
    section: 'home',
    label: 'Hero subtitle',
    value_en: home.heroSubtitle,
    value_mk: homeMk.heroSubtitle,
  },
  {
    key: 'home.contactCtaBadge',
    section: 'home',
    label: 'Contact CTA badge',
    value_en: home.contactCtaBadge,
    value_mk: homeMk.contactCtaBadge,
  },
  {
    key: 'home.contactCtaTitle',
    section: 'home',
    label: 'Contact CTA title',
    value_en: home.contactCtaTitle,
    value_mk: homeMk.contactCtaTitle,
  },
  {
    key: 'home.contactCtaDesc',
    section: 'home',
    label: 'Contact CTA description',
    value_en: home.contactCtaDesc,
    value_mk: homeMk.contactCtaDesc,
  },
  {
    key: 'contact.phoneValue',
    section: 'contact',
    label: 'Phone number',
    value_en: contact.phoneValue,
    value_mk: contactMk.phoneValue,
  },
  {
    key: 'contact.emailValue',
    section: 'contact',
    label: 'Email address',
    value_en: contact.emailValue,
    value_mk: contactMk.emailValue,
  },
  {
    key: 'contact.addressValue',
    section: 'contact',
    label: 'Address',
    value_en: contact.addressValue,
    value_mk: contactMk.addressValue,
  },
  {
    key: 'contact.hoursValue',
    section: 'contact',
    label: 'Business hours',
    value_en: contact.hoursValue,
    value_mk: contactMk.hoursValue,
  },
].map((row) => ({
  ...row,
  updated_at: new Date().toISOString(),
}));

async function main() {
  const { error } = await supabase.from('cms_content').upsert(rows, {
    onConflict: 'key',
  });

  if (error) {
    console.error('CMS content seed failed:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} CMS content entries`);
}

main();
