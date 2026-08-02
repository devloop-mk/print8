/** Client-safe upload limits — no Node-only dependencies. */

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
/** High-res print PNGs from the customizer can exceed the standard upload cap. */
export const MAX_PRINT_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_UPLOADS_PER_SESSION = 25;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
