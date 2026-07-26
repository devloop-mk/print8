import fs from 'node:fs';
import path from 'node:path';

/**
 * Cursor chat assets folder (generated images from agent sessions).
 * Override with CURSOR_ASSETS when needed.
 */
export function resolveCursorAssetsDir() {
  if (process.env.CURSOR_ASSETS) {
    return path.resolve(process.env.CURSOR_ASSETS);
  }

  const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
  const candidates = [
    path.join(home, '.cursor', 'projects', 'h-print8-mk', 'assets'),
    path.join(
      home,
      '.cursor',
      'projects',
      'c-Users-Viktor-Karabar-Desktop-print8-mk',
      'assets',
    ),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0];
}
