import '@/lib/designs/gallery-thumb-dom-polyfill';

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Browser, Page } from 'playwright';
import { designTemplates } from '@/lib/data/catalog';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import {
  buildMergedDefaultSvgTemplateState,
  hasManagedSvgDefaults,
} from '@/lib/designs/merge-svg-template-defaults';
import { applySvgTemplate } from '@/lib/designs/svg-template-engine';
import { CYRILLIC_FONTS_URL } from '@/lib/designs/svg-font-cyrillic';
import { extractSvgFontImportUrls } from '@/lib/designs/svg-fonts';
import { getSvgDimensions } from '@/lib/designs/svg-rasterize';
import { getDesignGalleryThumbPath } from '@/lib/designs/design-thumb';
import {
  findDesignIdsForSvgTemplateId,
  isGalleryThumbFreshForTemplate,
  writeGalleryThumbMeta,
} from '@/lib/designs/gallery-thumb-meta';
import {
  GALLERY_THUMB_REGEN_LOCAL_HINT_MK,
  isGalleryThumbRegenAvailable,
} from '@/lib/designs/gallery-thumb-local';

const PUBLIC_ROOT = path.join(process.cwd(), 'public');
const THUMB_MAX_WIDTH = 640;
const THUMB_LOCALE = 'mk' as const;

export type GalleryThumbBuildResult = {
  designId: string;
  publicPath: string;
  width: number;
  height: number;
  bytes: number;
};

export type { GalleryThumbMeta } from '@/lib/designs/gallery-thumb-meta';

let sharedBrowser: Browser | null = null;

function readPublicText(publicPath: string): string {
  const filePath = path.join(PUBLIC_ROOT, publicPath.replace(/^\//, ''));
  return fs.readFileSync(filePath, 'utf8');
}

function mimeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

function embedSvgExternalImagesNode(svg: string): string {
  const hrefPattern = /(?:xlink:)?href="(\/NEW_DESIGNS\/[^"]+)"/g;
  const urls = [...new Set([...svg.matchAll(hrefPattern)].map((match) => match[1]))];
  if (urls.length === 0) return svg;

  let result = svg;
  for (const url of urls) {
    const filePath = path.join(PUBLIC_ROOT, url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) continue;
    const buf = fs.readFileSync(filePath);
    const dataUrl = `data:${mimeForFile(filePath)};base64,${buf.toString('base64')}`;
    result = result.replaceAll(`href="${url}"`, `href="${dataUrl}"`);
  }
  return result;
}

function buildFontLinkTags(svg: string): string {
  const urls = [CYRILLIC_FONTS_URL, ...extractSvgFontImportUrls(svg)];
  return [...new Set(urls)]
    .map((url) => `<link rel="stylesheet" href="${url.replace(/&/g, '&amp;')}" />`)
    .join('\n');
}

function stripXmlDeclaration(svg: string): string {
  return svg.replace(/<\?xml[^?]*\?>\s*/i, '').trim();
}

export { findDesignIdsForSvgTemplateId, isGalleryThumbFreshForTemplate };

export function prepareDesignGallerySvg(
  designId: string,
  managedDefaults?: ManagedSvgTemplateDefaultsPayload | null,
) {
  const design = designTemplates.find((entry) => entry.id === designId);
  if (!design?.svgTemplateId) return null;

  const template = getSvgDesignTemplate(design.svgTemplateId);
  if (!template) return null;

  const state = buildMergedDefaultSvgTemplateState(
    template,
    THUMB_LOCALE,
    managedDefaults ?? null,
  );
  const rawSvg = readPublicText(template.sides.front.path);
  const rendered = applySvgTemplate(rawSvg, template, state, 'front', THUMB_LOCALE);
  const embedded = embedSvgExternalImagesNode(rendered);

  return { design, svg: embedded, aspectRatio: template.aspectRatio };
}

async function getBrowser(): Promise<Browser> {
  if (!isGalleryThumbRegenAvailable()) {
    throw new Error(GALLERY_THUMB_REGEN_LOCAL_HINT_MK);
  }

  const { chromium } = await import('playwright');

  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    sharedBrowser = await chromium.launch();
  }
  return sharedBrowser;
}

export async function closeGalleryThumbBrowser() {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
}

async function rasterizeSvgToWebp(page: Page, svg: string, outputPath: string) {
  const { width, height } = getSvgDimensions(svg);
  const scale = THUMB_MAX_WIDTH / width;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const prepared = stripXmlDeclaration(svg).replace(
    /<svg\b/i,
    `<svg width="${targetWidth}" height="${targetHeight}"`,
  );

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    ${buildFontLinkTags(svg)}
    <style>
      html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
      svg { display: block; }
    </style>
  </head>
  <body>${prepared}</body>
</html>`;

  await page.setViewportSize({ width: targetWidth, height: targetHeight });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(400);

  const png = await page.screenshot({
    type: 'png',
    omitBackground: true,
    clip: { x: 0, y: 0, width: targetWidth, height: targetHeight },
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(png)
    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 86, effort: 6 })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  return {
    width: meta.width ?? targetWidth,
    height: meta.height ?? targetHeight,
    bytes: fs.statSync(outputPath).size,
  };
}

export async function regenerateDesignGalleryThumb(
  designId: string,
  managedDefaults?: ManagedSvgTemplateDefaultsPayload | null,
  options?: {
    templateId?: string;
    defaultsUpdatedAt?: string | null;
  },
): Promise<GalleryThumbBuildResult | null> {
  if (!isGalleryThumbRegenAvailable()) {
    throw new Error(GALLERY_THUMB_REGEN_LOCAL_HINT_MK);
  }

  const prepared = prepareDesignGallerySvg(designId, managedDefaults);
  if (!prepared) return null;

  const outputPath = path.join(
    PUBLIC_ROOT,
    getDesignGalleryThumbPath(designId).replace(/^\//, ''),
  );

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const dimensions = await rasterizeSvgToWebp(page, prepared.svg, outputPath);
    writeGalleryThumbMeta(outputPath, {
      templateId: options?.templateId ?? prepared.design.svgTemplateId ?? designId,
      designId,
      defaultsUpdatedAt: hasManagedSvgDefaults(managedDefaults)
        ? (options?.defaultsUpdatedAt ?? null)
        : null,
      builtAt: new Date().toISOString(),
    });
    return {
      designId,
      publicPath: getDesignGalleryThumbPath(designId),
      ...dimensions,
    };
  } finally {
    await page.close();
  }
}

export async function regenerateGalleryThumbsForTemplate(
  templateId: string,
  managedDefaults?: ManagedSvgTemplateDefaultsPayload | null,
  defaultsUpdatedAt?: string | null,
): Promise<GalleryThumbBuildResult[]> {
  if (!isGalleryThumbRegenAvailable()) {
    throw new Error(GALLERY_THUMB_REGEN_LOCAL_HINT_MK);
  }

  const designIds = findDesignIdsForSvgTemplateId(templateId);
  const results: GalleryThumbBuildResult[] = [];

  for (const designId of designIds) {
    const built = await regenerateDesignGalleryThumb(designId, managedDefaults, {
      templateId,
      defaultsUpdatedAt,
    });
    if (built) results.push(built);
  }

  return results;
}

export async function regenerateAllDesignGalleryThumbs(options?: {
  force?: boolean;
  onProgress?: (designId: string, status: 'built' | 'skipped') => void;
}) {
  if (!isGalleryThumbRegenAvailable()) {
    throw new Error(GALLERY_THUMB_REGEN_LOCAL_HINT_MK);
  }

  const { managedSvgTemplatesDb } = await import('@/lib/db/managed-svg-templates');
  const managedRecords = await managedSvgTemplatesDb.list();
  const managedByTemplate = Object.fromEntries(
    managedRecords.map((record) => [record.templateId, record]),
  );

  const targets = designTemplates.filter((design) => design.svgTemplateId);
  const results: GalleryThumbBuildResult[] = [];

  for (const design of targets) {
    const templateId = design.svgTemplateId!;
    const managed = managedByTemplate[templateId] ?? null;
    const outputPath = path.join(
      PUBLIC_ROOT,
      getDesignGalleryThumbPath(design.id).replace(/^\//, ''),
    );

    if (
      !options?.force &&
      managed &&
      isGalleryThumbFreshForTemplate(
        templateId,
        managed.updatedAt,
        managed.defaults,
      )
    ) {
      options?.onProgress?.(design.id, 'skipped');
      continue;
    }

    if (!options?.force && !managed && fs.existsSync(outputPath) && design.image) {
      const sourcePath = path.join(PUBLIC_ROOT, design.image.replace(/^\//, ''));
      if (fs.existsSync(sourcePath)) {
        const svgMtime = fs.statSync(sourcePath).mtimeMs;
        if (fs.statSync(outputPath).mtimeMs >= svgMtime) {
          options?.onProgress?.(design.id, 'skipped');
          continue;
        }
      }
    }

    const built = await regenerateDesignGalleryThumb(
      design.id,
      managed?.defaults ?? null,
      {
        templateId,
        defaultsUpdatedAt: managed?.updatedAt ?? null,
      },
    );
    if (built) {
      results.push(built);
      options?.onProgress?.(design.id, 'built');
    }
  }

  await closeGalleryThumbBrowser();
  return results;
}
