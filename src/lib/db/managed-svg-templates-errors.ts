export const MANAGED_SVG_TEMPLATES_MIGRATION_HINT =
  'Табелата managed_svg_templates не постои. Во Supabase → SQL Editor извршете ја миграцијата од supabase/migrations/add-managed-svg-templates.sql, или поставете SUPABASE_DB_PASSWORD во .env.local и пуштете: npm run db:migrate:svg-templates';

export function isMissingManagedSvgTemplatesTable(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('managed_svg_templates') &&
    (lower.includes('schema cache') ||
      lower.includes('does not exist') ||
      lower.includes('relation'))
  );
}

import { GALLERY_THUMB_REGEN_LOCAL_HINT_MK } from '@/lib/designs/gallery-thumb-local';

export function formatManagedSvgTemplatesError(message: string) {
  if (isMissingManagedSvgTemplatesTable(message)) {
    return MANAGED_SVG_TEMPLATES_MIGRATION_HINT;
  }
  return message;
}

export function formatGalleryThumbBuilderError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("executable doesn't exist") ||
    lower.includes('browsertype.launch') ||
    lower.includes('playwright install')
  ) {
    return 'Playwright Chromium не е инсталиран. Во терминал пуштете: npm run playwright:install';
  }
  if (message === GALLERY_THUMB_REGEN_LOCAL_HINT_MK) {
    return message;
  }
  return message;
}
