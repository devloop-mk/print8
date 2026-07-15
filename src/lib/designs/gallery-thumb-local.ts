/** Gallery WebP regeneration uses Playwright and only runs on a local machine. */
export function isGalleryThumbRegenAvailable(): boolean {
  return !process.env.VERCEL;
}

export const GALLERY_THUMB_REGEN_LOCAL_HINT_MK =
  'Генерирањето на gallery WebP е достапно само локално. Пуштете: npm run regenerate:design-gallery-thumb -- <design-id>, па commit-ирајте ги .webp датотеките во public/NEW_DESIGNS/gallery-thumbs/.';
