import './thumb-dom-polyfill';

import {
  closeGalleryThumbBrowser,
  regenerateAllDesignGalleryThumbs,
} from '@/lib/designs/gallery-thumb-builder.core';

async function main() {
  const force = process.argv.includes('--force');
  const results = await regenerateAllDesignGalleryThumbs({
    force,
    onProgress: (designId, status) => {
      if (status === 'skipped') {
        console.log(`Skip ${designId} (up to date)`);
      }
    },
  });

  for (const built of results) {
    const kb = Math.round(built.bytes / 1024);
    console.log(
      `Built ${built.designId} -> ${built.publicPath} (${built.width}x${built.height}, ${kb} KB)`,
    );
  }

  console.log(`\nDone: ${results.length} built.`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeGalleryThumbBrowser();
  });
