import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { embedSvgExternalImages } from '@/lib/designs/svg-background-assets';
import { fetchRenderedSvg } from '@/lib/designs/svg-template-engine';
import { svgStringToPngDataUrl } from '@/lib/designs/svg-rasterize';
import { getOrderPrintObject } from '@/lib/storage/object-storage';

export type SvgSideAssets = {
  svg: string;
  pngDataUrl: string;
};

export type SvgTemplateOrderAssets = {
  front: SvgSideAssets;
  back?: SvgSideAssets;
};

export async function captureSvgTemplateOrderAssets(
  template: SvgDesignTemplate,
  state: SvgTemplateState,
): Promise<SvgTemplateOrderAssets> {
  const backgroundColor = state.colors.background ?? '#ffffff';

  const frontSvg = await embedSvgExternalImages(
    await fetchRenderedSvg(template.sides.front.path, template, state, 'front'),
  );
  const front: SvgSideAssets = {
    svg: frontSvg,
    pngDataUrl: await svgStringToPngDataUrl(frontSvg, {
      scale: 2,
      backgroundColor,
    }),
  };

  if (!template.sides.back) {
    return { front };
  }

  const backSvg = await embedSvgExternalImages(
    await fetchRenderedSvg(template.sides.back.path, template, state, 'back'),
  );

  return {
    front,
    back: {
      svg: backSvg,
      pngDataUrl: await svgStringToPngDataUrl(backSvg, {
        scale: 2,
        backgroundColor,
      }),
    },
  };
}

export type SvgPrintFileRef = {
  side: 'front' | 'back';
  filename: string;
  /** Legacy orders that still store the SVG inline in metadata */
  svg?: string;
  /** Object-storage key under `order-prints/` */
  storedName?: string;
};

export type SvgPrintFile = {
  side: 'front' | 'back';
  svg: string;
  filename: string;
};

function safePrintFilename(itemName: string, side: 'front' | 'back') {
  const safeName = itemName.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || 'design';
  return `${safeName}-${side}-print.svg`;
}

/** List print SVG refs (inline content and/or storage keys). */
export function listSvgPrintFileRefsFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  itemName: string,
): SvgPrintFileRef[] {
  if (!metadata || metadata.orderType !== 'svg-template') return [];

  const files: SvgPrintFileRef[] = [];

  const frontContent = metadata.svgFrontContent;
  const frontStored = metadata.svgFrontStoredName;
  if (typeof frontContent === 'string' && frontContent.trim()) {
    files.push({
      side: 'front',
      filename: safePrintFilename(itemName, 'front'),
      svg: frontContent,
    });
  } else if (typeof frontStored === 'string' && frontStored.trim()) {
    files.push({
      side: 'front',
      filename: safePrintFilename(itemName, 'front'),
      storedName: frontStored,
    });
  }

  const backContent = metadata.svgBackContent;
  const backStored = metadata.svgBackStoredName;
  if (typeof backContent === 'string' && backContent.trim()) {
    files.push({
      side: 'back',
      filename: safePrintFilename(itemName, 'back'),
      svg: backContent,
    });
  } else if (typeof backStored === 'string' && backStored.trim()) {
    files.push({
      side: 'back',
      filename: safePrintFilename(itemName, 'back'),
      storedName: backStored,
    });
  }

  return files;
}

/** @deprecated Prefer listSvgPrintFileRefsFromMetadata + resolve for storage-backed files */
export function getSvgPrintFilesFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  itemName: string,
): SvgPrintFile[] {
  return listSvgPrintFileRefsFromMetadata(metadata, itemName).flatMap((file) =>
    typeof file.svg === 'string' && file.svg.trim()
      ? [{ side: file.side, svg: file.svg, filename: file.filename }]
      : [],
  );
}

export async function resolveSvgPrintFilesFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  itemName: string,
): Promise<SvgPrintFile[]> {
  const refs = listSvgPrintFileRefsFromMetadata(metadata, itemName);
  const files: SvgPrintFile[] = [];

  for (const ref of refs) {
    if (typeof ref.svg === 'string' && ref.svg.trim()) {
      files.push({
        side: ref.side,
        svg: ref.svg,
        filename: ref.filename,
      });
      continue;
    }

    if (!ref.storedName) continue;

    try {
      const { body } = await getOrderPrintObject(ref.storedName);
      files.push({
        side: ref.side,
        svg: body.toString('utf8'),
        filename: ref.filename,
      });
    } catch (error) {
      console.error(
        `[svg-order-assets] failed to load print SVG ${ref.storedName}:`,
        error,
      );
    }
  }

  return files;
}

export function buildSvgMetadataFields(
  assets: SvgTemplateOrderAssets,
  template: SvgDesignTemplate,
) {
  return {
    svgFrontContent: assets.front.svg,
    ...(assets.back ? { svgBackContent: assets.back.svg } : {}),
    previewAspectRatio: template.aspectRatio,
  };
}
